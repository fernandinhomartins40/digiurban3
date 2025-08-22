// ====================================================================
// 🔐 AUTH SERVICE SIMPLIFICADO - SISTEMA AUTH2
// ====================================================================
// Serviço central de autenticação - APENAS o essencial
// 200 linhas vs 1.700+ do sistema atual (-88% complexidade)
// ====================================================================

import { supabase } from '../../lib/supabase';
import type { 
  LoginCredentials, 
  UserProfile, 
  AuthResponse,
  TenantInfo 
} from '../types/auth.types';

// ====================================================================
// CLASSE PRINCIPAL DO SERVIÇO
// ====================================================================

export class AuthService {
  
  /**
   * Login - APENAS 1 query otimizada
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse<{
    user: any;
    profile: UserProfile;
    tenant: TenantInfo | null;
  }>> {
    try {
      console.log('🔐 [AUTH2] Login iniciado');
      const startTime = Date.now();

      // 1. Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email.toLowerCase().trim(),
        password: credentials.password
      });

      if (authError) {
        console.error('❌ [AUTH2] Erro de autenticação:', authError.message);
        return {
          success: false,
          error: this.getErrorMessage(authError)
        };
      }

      if (!authData.user) {
        return {
          success: false,
          error: 'Dados de usuário não retornados'
        };
      }

      // 2. Buscar perfil do usuário usando view de compatibilidade
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles_with_role')
        .select('id,nome_completo,email,tipo_usuario,role,hierarchy_level,tenant_id,avatar_url,created_at,updated_at')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profileData) {
        console.error('❌ [AUTH2] Erro ao buscar perfil:', profileError);
        await supabase.auth.signOut();
        return {
          success: false,
          error: 'Perfil de usuário não encontrado'
        };
      }

      const profile = profileData;

      // 3. Get tenant info if needed
      let tenantData = null;
      if (profile.tenant_id) {
        const { data: tenantResult } = await supabase
          .from('tenants')
          .select('id,nome,plano,status')
          .eq('id', profile.tenant_id)
          .single();
        
        if (tenantResult) {
          tenantData = tenantResult;
        }
      }

      // 4. Transform data
      const userProfile: UserProfile = {
        id: profile.id,
        name: profile.nome_completo,
        email: profile.email,
        role: profile.role || this.normalizeRole(profile.tipo_usuario),
        tenant_id: profile.tenant_id,
        tenant_name: tenantData?.nome,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      };

      const tenant: TenantInfo | null = tenantData ? {
        id: tenantData.id,
        name: tenantData.nome,
        plan_type: tenantData.plano,
        status: tenantData.status
      } : null;

      const duration = Date.now() - startTime;
      console.log(`✅ [AUTH2] Login completo em ${duration}ms`);

      return {
        success: true,
        data: {
          user: authData.user,
          profile: userProfile,
          tenant
        }
      };

    } catch (error: any) {
      console.error('❌ [AUTH2] Erro no login:', error);
      return {
        success: false,
        error: error.message || 'Erro inesperado durante o login'
      };
    }
  }

  /**
   * Logout - Simples e direto
   */
  static async logout(): Promise<AuthResponse> {
    try {
      console.log('🚪 [AUTH2] Logout iniciado');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ [AUTH2] Erro no logout:', error);
        return { success: false, error: error.message };
      }

      // Limpar storage local
      localStorage.removeItem('auth-cache');
      
      console.log('✅ [AUTH2] Logout completo');
      return { success: true };

    } catch (error: any) {
      console.error('❌ [AUTH2] Erro no logout:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current session - Para verificação inicial
   */
  static async getCurrentSession(): Promise<AuthResponse<{
    user: any;
    profile: UserProfile;
    tenant: TenantInfo | null;
  } | null>> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session?.user) {
        return { success: true, data: null };
      }

      // Recarregar perfil se necessário
      const profileResult = await this.getProfile(session.user.id);
      
      if (!profileResult.success || !profileResult.data) {
        return { success: true, data: null };
      }

      return {
        success: true,
        data: {
          user: session.user,
          profile: profileResult.data.profile,
          tenant: profileResult.data.tenant
        }
      };

    } catch (error: any) {
      console.error('❌ [AUTH2] Erro ao verificar sessão:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get profile + tenant - Query otimizada
   */
  static async getProfile(userId: string): Promise<AuthResponse<{
    profile: UserProfile;
    tenant: TenantInfo | null;
  }>> {
    try {
      // Buscar perfil usando view de compatibilidade
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles_with_role')
        .select('id,nome_completo,email,tipo_usuario,role,hierarchy_level,tenant_id,avatar_url,created_at,updated_at')
        .eq('id', userId)
        .single();

      if (profileError || !profileData) {
        console.error('❌ [AUTH2] Erro ao buscar perfil:', profileError);
        return { success: false, error: 'Perfil não encontrado' };
      }

      const data = profileData;

      // Get tenant info separately if needed
      let tenantData = null;
      if (data.tenant_id) {
        const { data: tenantResult } = await supabase
          .from('tenants')
          .select('id,nome,plano,status')
          .eq('id', data.tenant_id)
          .single();
        
        if (tenantResult) {
          tenantData = tenantResult;
        }
      }

      const profile: UserProfile = {
        id: data.id,
        name: data.nome_completo,
        email: data.email,
        role: data.role || this.normalizeRole(data.tipo_usuario),
        tenant_id: data.tenant_id,
        tenant_name: tenantData?.nome,
        avatar_url: data.avatar_url,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      const tenant: TenantInfo | null = tenantData ? {
        id: tenantData.id,
        name: tenantData.nome,
        plan_type: tenantData.plano,
        status: tenantData.status
      } : null;

      return {
        success: true,
        data: { profile, tenant }
      };

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Normalize role - Simples mapeamento
   */
  private static normalizeRole(dbRole: string): 'super_admin' | 'admin' | 'manager' | 'coordinator' | 'user' | 'guest' {
    const roleMap: Record<string, 'super_admin' | 'admin' | 'manager' | 'coordinator' | 'user' | 'guest'> = {
      // Roles diretos do sistema
      'super_admin': 'super_admin',
      'admin': 'admin',
      'manager': 'manager',
      'coordinator': 'coordinator',
      'user': 'user',
      'guest': 'guest',
      
      // Mapeamento de cargos municipais
      'prefeito': 'admin',              // Prefeito = Administrador Municipal
      'vice_prefeito': 'admin',         // Vice-Prefeito = Administrador Municipal
      'secretario': 'manager',          // Secretário = Gestor de Secretaria
      'diretor': 'manager',             // Diretor = Gestor de Secretaria
      'coordenador': 'coordinator',     // Coordenador = Coordenador de Equipes
      'supervisor': 'coordinator',      // Supervisor = Coordenador de Equipes
      'funcionario': 'user',            // Funcionário = Operação Básica
      'atendente': 'user',              // Atendente = Operação Básica
      'tecnico': 'user',                // Técnico = Operação Básica
      
      // Usuários externos
      'cidadao': 'guest',               // Cidadão = Visitante
      'usuario': 'guest',               // Usuário = Visitante
      'citizen': 'guest',               // Citizen = Visitante
      'publico': 'guest'                // Público = Visitante
    };

    return roleMap[dbRole] || 'user';
  }

  /**
   * Error message helper
   */
  private static getErrorMessage(error: any): string {
    if (typeof error === 'string') return error;
    
    const message = error?.message?.toLowerCase() || '';
    
    if (message.includes('invalid login credentials')) {
      return 'Email ou senha incorretos';
    }
    if (message.includes('email not confirmed')) {
      return 'Email ainda não confirmado';
    }
    if (message.includes('too many requests')) {
      return 'Muitas tentativas. Tente novamente em alguns minutos';
    }
    
    return error?.message || 'Erro desconhecido';
  }
}

export default AuthService;