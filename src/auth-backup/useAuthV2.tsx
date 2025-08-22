// ====================================================================
// 🔐 DIGIURBAN 2.0 - SISTEMA DE AUTENTICAÇÃO MODERNO
// ====================================================================
// Hook unificado, limpo e seguro para substituir o sistema fragmentado
// Versão: 2.0.0 | Data: 2025-08-15

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { initializeSessionContext, clearSessionContext } from '../lib/sessionContext';
import { AUTH_CONFIG, REDIRECT_PATHS, getDefaultPermissionsForUserType } from '../config/auth';
import { clearAllAuthSessions } from '../config/supabase.config';
import { tokenRotationManager } from '../lib/tokenRotation';
import { useAuthFallback } from './useAuthFallback';

// ====================================================================
// CACHE INTELIGENTE DE PROFILES - EVITA RACE CONDITIONS
// ====================================================================

// Cache de promises para evitar múltiplas chamadas simultâneas
const profilePromiseCache = new Map<string, Promise<AuthUser | null>>();
const PROFILE_CACHE_TIMEOUT = 30000; // 30 segundos

// Limpar cache automaticamente
const clearProfileCache = (userId: string) => {
  profilePromiseCache.delete(userId);
  setTimeout(() => profilePromiseCache.delete(userId), PROFILE_CACHE_TIMEOUT);
};

// ====================================================================
// INTERFACES MODERNAS E TIPADAS
// ====================================================================

export type UserType = 'super_admin' | 'admin' | 'secretary' | 'director' | 'coordinator' | 'employee' | 'attendant' | 'citizen';
export type AuthStatus = 'active' | 'inactive' | 'suspended' | 'locked' | 'pending';

export interface Permission {
  code: string;
  name: string;
  resource: string;
  action: string;
  module: string;
}

// Interface conforme especificação da Fase 2
export interface UserProfile {
  id: string;
  email: string;
  nome: string;
  tipo_usuario: UserType;
  secretaria_id: string | null;
  tenant_id: string | null;
  ativo: boolean;
  primeiro_login: boolean;
  senha_temporaria: boolean;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

// Interface estendida para o sistema (backwards compatibility)
export interface AuthUser extends UserProfile {
  // Campos adicionais para funcionalidade estendida
  status: AuthStatus;
  sectorId?: string;
  position?: string;
  documentId?: string;
  phone?: string;
  avatarUrl?: string;
  permissions: Permission[];
  lastLoginAt?: string;
  
  // Aliases para compatibilidade
  fullName: string;
  userType: UserType;
  tenantId: string | null;
  departmentId: string | null;
  firstAccess: boolean;
  createdAt: string;
}

export interface AuthError {
  code: string;
  message: string;
  details?: any;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: AuthError;
  requiresMFA?: boolean;
  redirectPath?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  documentId?: string;
  phone?: string;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: AuthError | null;
  initialized: boolean;
}

interface AuthContextType extends AuthState {
  // Backwards compatibility
  profile: AuthUser | null;
  
  // Métodos de autenticação
  signIn: (credentials: LoginCredentials) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  signUpCitizen: (data: SignUpData) => Promise<AuthResult>;
  
  // Verificações de permissão
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  canAccess: (resource: string, action: string) => boolean;
  canAccessDepartment: (departmentId: string) => boolean;
  canAccessTenant: (tenantId: string) => boolean;
  
  // Verificações de tipo de usuário
  isAuthenticated: () => boolean;
  isSuperAdmin: () => boolean;
  isAdmin: () => boolean;
  isStaff: () => boolean;
  isCitizen: () => boolean;
  
  // Utilitários
  refreshUser: () => Promise<void>;
  clearError: () => void;
  getDisplayName: () => string;
  getRedirectPath: () => string;
  
  // Auditoria e segurança
  logActivity: (action: string, details?: any) => Promise<void>;
  reportSuspiciousActivity: (details: any) => Promise<void>;
}


// ====================================================================
// CONTEXT E PROVIDER
// ====================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthV2 = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthV2 must be used within AuthV2Provider');
  }
  return context;
};

interface AuthV2ProviderProps {
  children: ReactNode;
}

export const AuthV2Provider: React.FC<AuthV2ProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    initialized: false,
  });

  // ====================================================================
  // FUNÇÕES UTILITÁRIAS INTERNAS
  // ====================================================================

  const createAuthError = (code: string, message: string, details?: any): AuthError => ({
    code,
    message,
    details,
  });

  const updateState = (updates: Partial<AuthState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const getClientInfo = () => ({
    ipAddress: null, // Será preenchido pelo backend
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  // Função movida para config/auth.ts
  
  // Sistema de fallback inteligente
  const { loadProfileWithFallback, isHealthy } = useAuthFallback();

  const validateTablesExist = async (): Promise<{ userProfiles: boolean; userActivities: boolean }> => {
    try {
      // Testar user_profiles
      const { error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);

      // Testar user_activities  
      const { error: activitiesError } = await supabase
        .from('user_activities')
        .select('id')
        .limit(1);

      return {
        userProfiles: !profileError,
        userActivities: !activitiesError
      };
    } catch (error) {
      console.warn('⚠️ [AuthV2] Erro ao validar tabelas:', error);
      return {
        userProfiles: false,
        userActivities: false
      };
    }
  };

  // ====================================================================
  // FUNÇÕES DE CARREGAMENTO DE DADOS
  // ====================================================================

  // ====================================================================
  // FUNÇÃO DE NORMALIZAÇÃO DE TIPOS DE USUÁRIO
  // ====================================================================

  /**
   * Normaliza tipos de usuário do banco (português) para frontend (inglês)
   */
  const normalizeUserType = (dbUserType: string): UserType => {
    const typeMap: Record<string, UserType> = {
      'super_admin': 'super_admin',
      'admin': 'admin',
      'secretario': 'secretary',
      'diretor': 'director', 
      'coordenador': 'coordinator',
      'funcionario': 'employee',
      'atendente': 'attendant',
      'cidadao': 'citizen'
    };

    const normalized = typeMap[dbUserType];
    if (!normalized) {
      console.warn(`⚠️ [AuthV2] Tipo de usuário desconhecido: ${dbUserType}, usando 'employee'`);
      return 'employee';
    }

    return normalized;
  };

  // Cache para evitar múltiplas chamadas simultâneas
  const profileLoadingRef = useRef<string | null>(null);

  /**
   * Detecta e corrige apenas sessões claramente corrompidas
   */
  const detectAndFixCorruptedSession = useCallback(async () => {
    try {
      // Verificar apenas se a sessão atual consegue ser obtida
      const { data: { session }, error } = await supabase.auth.getSession();
      
      // Só limpar se houver erro crítico de autenticação
      if (error && (
        error.message.includes('invalid_grant') ||
        error.message.includes('invalid_token') ||
        error.message.includes('jwt expired')
      )) {
        console.log('🧹 [AuthV2] Sessão corrompida detectada, limpando:', error.message);
        await supabase.auth.signOut();
        return false;
      }

      return true;
    } catch (error) {
      console.warn('🧹 [AuthV2] Erro crítico na verificação de sessão:', error);
      return false;
    }
  }, []);

  const loadUserProfile = useCallback(async (userId: string): Promise<AuthUser | null> => {
    try {
      // Sistema inteligente de cache com Promise para evitar race conditions
      if (profilePromiseCache.has(userId)) {
        console.log('⏭️ [AuthV2] Perfil já sendo carregado, retornando promise existente...');
        return await profilePromiseCache.get(userId)!;
      }

      // Criar nova promise e adicionar ao cache
      const profilePromise = (async (): Promise<AuthUser | null> => {
        try {
          profileLoadingRef.current = userId;
          console.log('🔄 [AuthV2] Carregando perfil do usuário:', userId);

          // Tentar carregamento normal primeiro
          let profile: any = null;
          let profileError: any = null;

          try {
            // Primeira tentativa: consulta normal
            const { data, error } = await Promise.race([
              supabase
                .from('user_profiles')
                .select(`
                  id, email, nome_completo, tipo_usuario, status, tenant_id,
                  secretaria_id, setor_id, cargo, cpf, telefone,
                  avatar_url, primeiro_acesso, ultimo_login, created_at, updated_at
                `)
                .eq('id', userId)
                .maybeSingle(),
              
              new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('Timeout ao carregar perfil')), 15000)
              )
            ]);

            profile = data;
            profileError = error;

          } catch (error: any) {
            console.warn('⚠️ [AuthV2] Erro na consulta normal, usando sistema de fallback...', error);
            
            // Usar RPC direto como fallback de emergência
            try {
              console.log('🚨 [AuthV2] Usando RPC direto de emergência...');
              const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_profile_direct', {
                user_id: userId
              });
              
              if (rpcData?.success) {
                profile = rpcData;
                profileError = null;
                console.log('✅ [AuthV2] RPC direto funcionou como fallback');
              } else {
                throw new Error(`RPC falhou: ${rpcError?.message || 'Unknown error'}`);
              }
            } catch (rpcFallbackError) {
              console.error('❌ [AuthV2] RPC direto também falhou:', rpcFallbackError);
              // Último recurso: sistema de fallback original
              try {
                profile = await loadProfileWithFallback(userId);
                profileError = null;
              } catch (fallbackError) {
                console.error('❌ [AuthV2] Todos os sistemas falharam:', fallbackError);
                profileError = fallbackError;
              }
            }
          }

      if (profileError) {
        console.error('❌ [AuthV2] Erro ao carregar perfil:', profileError);
        return null;
      }

      if (!profile) {
        console.warn('⚠️ [AuthV2] Perfil não encontrado para usuário:', userId);
        return null;
      }

      // Verificar se a conta está ativa (aceitar null/undefined como ativo para super_admin)
      if (profile.status && profile.status !== 'ativo' && profile.status !== 'active') {
        console.warn('⚠️ [AuthV2] Conta inativa:', profile.status);
        return null;
      }

      // Log debug do status
      console.log('🔍 [AuthV2] Status da conta:', profile.status || 'null/undefined');

      // Normalizar tipo de usuário do banco para o frontend
      const normalizedUserType = normalizeUserType(profile.tipo_usuario);

      // Usar permissões fallback diretamente (temporário para melhor performance)
      console.log('🔄 [AuthV2] Usando permissões fallback diretas (otimização temporária)');
      const permissions = [...getDefaultPermissionsForUserType(normalizedUserType)] as any[];
      console.log('✅ [AuthV2] Permissões definidas:', permissions.length);

      const userProfile: AuthUser = {
        // Campos base da UserProfile
        id: profile.id,
        email: profile.email,
        nome: profile.nome_completo,
        tipo_usuario: normalizedUserType, // Usar tipo normalizado
        secretaria_id: profile.secretaria_id,
        tenant_id: profile.tenant_id,
        ativo: profile.status === 'ativo',
        primeiro_login: profile.primeiro_acesso,
        senha_temporaria: false, // TODO: implementar lógica
        created_at: profile.created_at,
        updated_at: profile.updated_at || profile.created_at,
        metadata: {
          setor_id: profile.setor_id,
          cargo: profile.cargo,
          cpf: profile.cpf,
          telefone: profile.telefone,
          avatar_url: profile.avatar_url,
          ultimo_login: profile.ultimo_login,
          original_tipo_usuario: profile.tipo_usuario // Manter o tipo original do banco
        },
        
        // Campos estendidos
        status: (profile.status === 'ativo' || profile.status === 'active' || !profile.status) ? 'active' : profile.status as AuthStatus,
        sectorId: profile.setor_id,
        position: profile.cargo,
        documentId: profile.cpf,
        phone: profile.telefone,
        avatarUrl: profile.avatar_url,
        permissions: permissions || [],
        lastLoginAt: profile.ultimo_login,
        
        // Aliases para compatibilidade
        fullName: profile.nome_completo,
        userType: normalizedUserType, // Usar tipo normalizado
        tenantId: profile.tenant_id,
        departmentId: profile.secretaria_id,
        firstAccess: profile.primeiro_acesso,
        createdAt: profile.created_at,
      };

      console.log('✅ [AuthV2] Perfil carregado com sucesso:', {
        id: userProfile.id,
        originalType: profile.tipo_usuario,
        normalizedType: normalizedUserType,
        permissionsCount: userProfile.permissions.length,
      });

          profileLoadingRef.current = null; // Reset cache
          clearProfileCache(userId); // Limpar cache
          return userProfile;
        } catch (error: any) {
          console.error('❌ [AuthV2] Erro crítico ao carregar perfil:', error);
          profileLoadingRef.current = null; // Reset cache em erro também
          clearProfileCache(userId); // Limpar cache
          return null;
        }
      })();

      // Adicionar promise ao cache
      profilePromiseCache.set(userId, profilePromise);
      
      // Remover do cache após timeout
      setTimeout(() => clearProfileCache(userId), PROFILE_CACHE_TIMEOUT);
      
      return await profilePromise;
    } catch (error: any) {
      console.error('❌ [AuthV2] Erro crítico no sistema de cache:', error);
      clearProfileCache(userId);
      return null;
    }
  }, []);

  // ====================================================================
  // FUNÇÕES DE AUTENTICAÇÃO
  // ====================================================================

  const signIn = async (credentials: LoginCredentials): Promise<AuthResult> => {
    try {
      updateState({ loading: true, error: null });
      
      console.log('🔐 [AuthV2] Iniciando login para:', credentials.email);

      // Validações básicas
      if (!credentials.email || !credentials.password) {
        throw createAuthError('INVALID_INPUT', 'Email e senha são obrigatórios');
      }

      // Normalizar email
      const normalizedEmail = credentials.email.toLowerCase().trim();

      // Tentar autenticar via Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: credentials.password,
      });

      if (authError) {
        // Registrar tentativa falhada
        await logLoginAttempt(normalizedEmail, false, authError.message);
        throw createAuthError('AUTHENTICATION_FAILED', getErrorMessage(authError));
      }

      if (!authData.user) {
        throw createAuthError('NO_USER_DATA', 'Dados de usuário não retornados');
      }

      // Carregar perfil completo
      const userProfile = await loadUserProfile(authData.user.id);
      
      if (!userProfile) {
        await supabase.auth.signOut(); // Limpar sessão inválida
        throw createAuthError('PROFILE_NOT_FOUND', 'Perfil de usuário não encontrado');
      }

      if (userProfile.status !== 'active') {
        await supabase.auth.signOut();
        throw createAuthError('ACCOUNT_DISABLED', `Conta ${userProfile.status}. Entre em contato com o administrador.`);
      }

      // Registrar login bem-sucedido
      await logLoginAttempt(normalizedEmail, true);
      await logActivity('login_success', {
        userId: userProfile.id,
        userType: userProfile.userType,
        ...getClientInfo(),
      });

      // Inicializar contexto de sessão para RLS
      console.log('🔄 Inicializando contexto de sessão após login...');
      await initializeSessionContext();

      // Atualizar estado
      updateState({ 
        user: userProfile, 
        loading: false,
        error: null,
      });

      const redirectPath = getRedirectPathForUser(userProfile);

      console.log('✅ [AuthV2] Login realizado com sucesso, redirecionando para:', redirectPath);

      return {
        success: true,
        user: userProfile,
        redirectPath,
      };

    } catch (error: any) {
      console.error('❌ [AuthV2] Erro no login:', error);
      
      const authError = error.code ? error : createAuthError(
        'LOGIN_ERROR',
        error.message || 'Erro inesperado durante o login'
      );

      updateState({ 
        loading: false, 
        error: authError,
      });

      return {
        success: false,
        error: authError,
      };
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      updateState({ loading: true });

      if (state.user) {
        await logActivity('logout', {
          userId: state.user.id,
          ...getClientInfo(),
        });
      }

      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('⚠️ [AuthV2] Erro no logout:', error);
      }

      // Limpar contexto de sessão
      clearSessionContext();

      // Limpeza completa da sessão conforme Fase 2
      try {
        localStorage.removeItem('digiurban-auth-stable');
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.clear();
      } catch (storageError) {
        console.warn('⚠️ [AuthV2] Erro ao limpar storage:', storageError);
      }

      updateState({
        user: null,
        loading: false,
        error: null,
      });

      console.log('✅ [AuthV2] Logout e limpeza de sessão realizados com sucesso');

    } catch (error: any) {
      console.error('❌ [AuthV2] Erro durante logout:', error);
      // Forçar limpeza mesmo com erro
      updateState({
        user: null,
        loading: false,
        error: null,
      });
    }
  };

  const signUpCitizen = async (data: SignUpData): Promise<AuthResult> => {
    try {
      updateState({ loading: true, error: null });

      console.log('📝 [AuthV2] Registrando novo cidadão:', data.email);

      // Validações
      if (!data.email || !data.password || !data.fullName) {
        throw createAuthError('INVALID_INPUT', 'Todos os campos obrigatórios devem ser preenchidos');
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email.toLowerCase().trim(),
        password: data.password,
        options: {
          data: {
            nome_completo: data.fullName,
            tipo_usuario: 'cidadao',
            cpf: data.documentId,
            telefone: data.phone,
          },
        },
      });

      if (authError) {
        throw createAuthError('SIGNUP_FAILED', getErrorMessage(authError));
      }

      if (!authData.user) {
        throw createAuthError('NO_USER_DATA', 'Dados de usuário não retornados');
      }

      // Aguardar criação do perfil pelo trigger
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('✅ [AuthV2] Cidadão registrado com sucesso');

      updateState({ loading: false });

      return {
        success: true,
      };

    } catch (error: any) {
      console.error('❌ [AuthV2] Erro no registro:', error);

      const authError = error.code ? error : createAuthError(
        'SIGNUP_ERROR',
        error.message || 'Erro durante o registro'
      );

      updateState({
        loading: false,
        error: authError,
      });

      return {
        success: false,
        error: authError,
      };
    }
  };

  // ====================================================================
  // FUNÇÕES DE VERIFICAÇÃO DE PERMISSÕES
  // ====================================================================

  const hasPermission = (permission: string): boolean => {
    if (!state.user) return false;
    if (state.user.userType === 'super_admin') return true;
    return state.user.permissions.some(p => p.code === permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!state.user) return false;
    if (state.user.userType === 'super_admin') return true;
    return permissions.some(permission => hasPermission(permission));
  };

  const canAccess = (resource: string, action: string): boolean => {
    if (!state.user) return false;
    if (state.user.userType === 'super_admin') return true;
    return state.user.permissions.some(p => 
      p.resource === resource && p.action === action
    );
  };

  const canAccessDepartment = (departmentId: string): boolean => {
    if (!state.user) return false;
    if (state.user.userType === 'super_admin') return true;
    if (state.user.userType === 'admin') return true; // Admin pode acessar todos os departamentos
    return state.user.departmentId === departmentId;
  };

  const canAccessTenant = (tenantId: string): boolean => {
    if (!state.user) return false;
    if (state.user.userType === 'super_admin') return true;
    return state.user.tenantId === tenantId;
  };

  // ====================================================================
  // VERIFICAÇÕES DE TIPO DE USUÁRIO
  // ====================================================================

  const isAuthenticated = (): boolean => !!state.user;
  const isSuperAdmin = (): boolean => state.user?.userType === 'super_admin' || false;
  const isAdmin = (): boolean => ['super_admin', 'admin'].includes(state.user?.userType || '') || false;
  const isCitizen = (): boolean => state.user?.userType === 'citizen' || false;
  const isStaff = (): boolean => {
    if (!state.user) return false;
    return ['admin', 'super_admin', 'secretary', 'director', 'coordinator', 'employee', 'attendant'].includes(state.user.userType);
  };

  // ====================================================================
  // FUNÇÕES UTILITÁRIAS
  // ====================================================================

  const refreshUser = async (): Promise<void> => {
    if (!state.user) return;

    try {
      updateState({ loading: true });
      const updatedUser = await loadUserProfile(state.user.id);
      
      if (updatedUser) {
        updateState({ user: updatedUser, loading: false });
      } else {
        await signOut();
      }
    } catch (error) {
      console.error('❌ [AuthV2] Erro ao atualizar usuário:', error);
      updateState({ loading: false });
    }
  };

  const clearError = () => {
    updateState({ error: null });
  };

  const getDisplayName = (): string => {
    return state.user?.fullName || state.user?.email || 'Usuário';
  };

  const getRedirectPath = (): string => {
    if (!state.user) return '/login';
    return REDIRECT_PATHS[state.user.userType] || '/dashboard';
  };

  const getRedirectPathForUser = (user: AuthUser): string => {
    const path = REDIRECT_PATHS[user.userType];
    
    if (!path) {
      console.warn(`⚠️ [AuthV2] Caminho de redirecionamento não encontrado para tipo: ${user.userType}, usando '/dashboard'`);
      return '/dashboard';
    }

    // Para secretários, diretores e coordenadores, incluir secretaria_id se disponível
    if (['secretary', 'director', 'coordinator'].includes(user.userType) && user.secretaria_id) {
      return path.replace('[secretaria_id]', user.secretaria_id);
    }

    console.log(`✅ [AuthV2] Redirecionamento definido: ${user.userType} -> ${path}`);
    return path;
  };

  // ====================================================================
  // FUNÇÕES DE AUDITORIA E SEGURANÇA
  // ====================================================================

  const logActivity = async (action: string, details?: any): Promise<void> => {
    try {
      // Tentar usar a função RPC se existir
      await supabase.rpc('log_audit_action', {
        p_user_id: state.user?.id || null,
        p_action: action,
        p_details: details ? JSON.stringify(details) : null,
        p_ip_address: null, // Será preenchido pelo backend
        p_user_agent: navigator.userAgent,
      });
    } catch (error) {
      console.warn('⚠️ [AuthV2] RPC log_audit_action não encontrada, usando fallback:', error);
      // Fallback: inserir diretamente na tabela user_activities se existir
      try {
        await supabase.from('user_activities').insert({
          user_id: state.user?.id || null,
          acao: action,
          detalhes: details ? JSON.stringify(details) : null,
          created_at: new Date().toISOString()
        });
      } catch (fallbackError) {
        console.warn('⚠️ [AuthV2] Fallback também falhou, pulando log:', fallbackError);
      }
    }
  };

  const logLoginAttempt = async (email: string, success: boolean, reason?: string): Promise<void> => {
    try {
      // Tentar usar a função RPC se existir
      await supabase.rpc('log_login_attempt', {
        p_email: email,
        p_success: success,
        p_user_id: state.user?.id || null,
        p_failure_reason: reason || null,
        p_ip_address: null, // Será preenchido pelo backend
        p_user_agent: navigator.userAgent,
      });
    } catch (error) {
      console.warn('⚠️ [AuthV2] RPC log_login_attempt não encontrada, usando fallback:', error);
      // Fallback: inserir diretamente na tabela user_activities se existir
      try {
        await supabase.from('user_activities').insert({
          user_id: state.user?.id || null,
          acao: success ? 'login_success' : 'login_failed',
          detalhes: JSON.stringify({
            email,
            success,
            failure_reason: reason,
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }),
          created_at: new Date().toISOString()
        });
      } catch (fallbackError) {
        console.warn('⚠️ [AuthV2] Fallback login attempt log também falhou, pulando log:', fallbackError);
      }
    }
  };

  const reportSuspiciousActivity = async (details: any): Promise<void> => {
    try {
      await logActivity('suspicious_activity', {
        ...details,
        reported_at: new Date().toISOString(),
        ...getClientInfo(),
      });
    } catch (error) {
      console.error('❌ [AuthV2] Erro ao reportar atividade suspeita:', error);
    }
  };

  // ====================================================================
  // FUNÇÕES DE TRATAMENTO DE ERRO
  // ====================================================================

  const getErrorMessage = (error: any): string => {
    if (typeof error === 'string') return error;
    
    if (error?.message) {
      const message = error.message.toLowerCase();
      
      if (message.includes('invalid login credentials')) {
        return 'Email ou senha incorretos';
      }
      if (message.includes('email not confirmed')) {
        return 'Email ainda não confirmado. Verifique sua caixa de entrada.';
      }
      if (message.includes('too many requests')) {
        return 'Muitas tentativas de login. Tente novamente em alguns minutos.';
      }
      if (message.includes('user already registered')) {
        return 'Este email já está cadastrado no sistema.';
      }
      
      return error.message;
    }

    return 'Erro desconhecido';
  };

  // ====================================================================
  // EFEITOS E INICIALIZAÇÃO
  // ====================================================================

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🚀 [AuthV2] Inicializando sistema de autenticação...');

        // Verificar e corrigir sessões corrompidas antes de continuar
        const sessionIsHealthy = await detectAndFixCorruptedSession();
        if (!sessionIsHealthy && mounted) {
          updateState({
            user: null,
            loading: false,
            initialized: true,
          });
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user && mounted) {
          console.log('✅ [AuthV2] Sessão existente encontrada');
          
          try {
            const userProfile = await loadUserProfile(session.user.id);
            
            if (userProfile && userProfile.status === 'active' && mounted) {
              updateState({
                user: userProfile,
                loading: false,
                initialized: true,
              });
              
              console.log('✅ [AuthV2] Usuário autenticado automaticamente');
            } else {
              console.log('⚠️ [AuthV2] Perfil inválido, limpando sessão');
              await supabase.auth.signOut();
              updateState({
                user: null,
                loading: false,
                initialized: true,
              });
            }
          } catch (profileError) {
            console.error('❌ [AuthV2] Erro ao carregar perfil na inicialização:', profileError);
            updateState({
              user: null,
              loading: false,
              initialized: true,
              error: createAuthError('PROFILE_LOAD_ERROR', 'Erro ao carregar perfil do usuário'),
            });
          }
        } else if (mounted) {
          console.log('ℹ️ [AuthV2] Nenhuma sessão ativa');
          updateState({
            user: null,
            loading: false,
            initialized: true,
          });
        }
      } catch (error) {
        console.error('❌ [AuthV2] Erro na inicialização:', error);
        if (mounted) {
          updateState({
            user: null,
            loading: false,
            initialized: true,
            error: createAuthError('INIT_ERROR', 'Erro ao inicializar autenticação'),
          });
        }
      }
    };

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('🔄 [AuthV2] Evento de autenticação:', event);

      switch (event) {
        case 'SIGNED_IN':
          // Só carregar perfil se não temos usuário carregado ou se mudou de usuário
          if (session?.user && (!state.user || state.user.id !== session.user.id)) {
            console.log('🔄 [AuthV2] Carregando perfil após SIGNED_IN...');
            const userProfile = await loadUserProfile(session.user.id);
            if (userProfile && userProfile.status === 'active' && mounted) {
              updateState({
                user: userProfile,
                loading: false,
              });
            }
          }
          break;

        case 'SIGNED_OUT':
          if (mounted) {
            // Limpar cache de profiles ao fazer logout
            profilePromiseCache.clear();
            updateState({
              user: null,
              loading: false,
              error: null,
            });
          }
          break;

        case 'TOKEN_REFRESHED':
          // Não recarregar perfil no token refresh - só log
          console.log('🔄 [AuthV2] Token renovado automaticamente (sem recarregar perfil)');
          break;
      }
    });

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
      // Limpar sistema de rotação de tokens
      tokenRotationManager.destroy();
    };
  }, [loadUserProfile]);

  // ====================================================================
  // PROVIDER VALUE
  // ====================================================================

  const value: AuthContextType = {
    // Estado
    ...state,
    
    // Backwards compatibility
    profile: state.user,
    
    // Métodos de autenticação
    signIn,
    signOut,
    signUpCitizen,
    
    // Verificações de permissão
    hasPermission,
    hasAnyPermission,
    canAccess,
    canAccessDepartment,
    canAccessTenant,
    
    // Verificações de tipo
    isAuthenticated,
    isSuperAdmin,
    isAdmin,
    isStaff,
    isCitizen,
    
    // Utilitários
    refreshUser,
    clearError,
    getDisplayName,
    getRedirectPath,
    
    // Auditoria e segurança
    logActivity,
    reportSuspiciousActivity,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ====================================================================
// HOOKS AUXILIARES
// ====================================================================

// Hook para proteção de rotas
export const useProtectedRoute = (options: {
  requiredPermission?: string;
  requiredUserType?: UserType[];
  redirectTo?: string;
} = {}) => {
  const auth = useAuthV2();

  const isAuthorized = () => {
    if (!auth.isAuthenticated()) return false;
    
    if (options.requiredPermission && !auth.hasPermission(options.requiredPermission)) {
      return false;
    }
    
    if (options.requiredUserType && !options.requiredUserType.includes(auth.user!.userType)) {
      return false;
    }
    
    return true;
  };

  return {
    user: auth.user,
    loading: auth.loading,
    initialized: auth.initialized,
    isAuthenticated: auth.isAuthenticated(),
    isAuthorized: isAuthorized(),
    redirectTo: options.redirectTo || '/login',
  };
};

// Hook para verificação de permissões específicas
export const usePermissions = () => {
  const auth = useAuthV2();

  return {
    hasPermission: auth.hasPermission,
    hasAnyPermission: auth.hasAnyPermission,
    canAccess: auth.canAccess,
    canAccessDepartment: auth.canAccessDepartment,
    canAccessTenant: auth.canAccessTenant,
    permissions: auth.user?.permissions || [],
    userType: auth.user?.userType,
  };
};

export default useAuthV2;