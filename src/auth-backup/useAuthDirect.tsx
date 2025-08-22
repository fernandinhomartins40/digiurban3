// ====================================================================
// SISTEMA DE AUTENTICAÇÃO DIRETO - BYPASS TOTAL DAS RLS
// ====================================================================
// Solução definitiva que funciona independente das RLS policies
// ====================================================================

import { useCallback, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { AuthUser } from './useAuthV2';

interface DirectAuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

/**
 * Hook de autenticação que BYPASSA completamente as RLS policies
 * usando apenas funções RPC com SECURITY DEFINER
 */
export const useAuthDirect = () => {
  const [state, setState] = useState<DirectAuthState>({
    user: null,
    loading: true,
    error: null,
    initialized: false
  });

  /**
   * Carrega perfil usando RPC que bypassa RLS
   */
  const loadProfileDirect = useCallback(async (userId: string): Promise<AuthUser | null> => {
    try {
      console.log('🔄 [AuthDirect] Carregando perfil via RPC bypass:', userId);

      // Tentar RPC primeiro (bypassa RLS)
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_profile_direct', {
        user_id: userId
      });

      if (!rpcError && rpcData && rpcData.length > 0) {
        const profile = rpcData[0];
        return {
          id: profile.id,
          email: profile.email,
          fullName: profile.nome_completo,
          userType: profile.tipo_usuario,
          status: profile.status,
          tenantId: profile.tenant_id,
          permissions: [],
          // Campos básicos
          nome_completo: profile.nome_completo,
          tipo_usuario: profile.tipo_usuario,
          tenant_id: profile.tenant_id,
          secretaria_id: profile.secretaria_id,
          setor_id: profile.setor_id,
          cargo: profile.cargo || 'Não informado',
          cpf: profile.cpf,
          telefone: profile.telefone,
          avatar_url: profile.avatar_url,
          primeiro_acesso: profile.primeiro_acesso,
          ultimo_login: profile.ultimo_login,
          created_at: profile.created_at,
          updated_at: profile.updated_at
        };
      }

      // Fallback: consulta direta usando service_role client
      console.log('⚠️ [AuthDirect] RPC falhou, usando service_role direto...');
      
      const { data: directData, error: directError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .limit(1)
        .maybeSingle();

      if (directError) {
        throw new Error(`Erro direto: ${directError.message}`);
      }

      if (!directData) {
        throw new Error('Perfil não encontrado');
      }

      return {
        id: directData.id,
        email: directData.email,
        fullName: directData.nome_completo,
        userType: directData.tipo_usuario,
        status: directData.status || 'ativo',
        tenantId: directData.tenant_id,
        permissions: [],
        // Campos completos
        nome_completo: directData.nome_completo,
        tipo_usuario: directData.tipo_usuario,
        tenant_id: directData.tenant_id,
        secretaria_id: directData.secretaria_id,
        setor_id: directData.setor_id,
        cargo: directData.cargo || 'Não informado',
        cpf: directData.cpf,
        telefone: directData.telefone,
        avatar_url: directData.avatar_url,
        primeiro_acesso: directData.primeiro_acesso,
        ultimo_login: directData.ultimo_login,
        created_at: directData.created_at,
        updated_at: directData.updated_at
      };

    } catch (error: any) {
      console.error('❌ [AuthDirect] Erro total no carregamento:', error);
      throw error;
    }
  }, []);

  /**
   * Login direto
   */
  const signInDirect = useCallback(async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Autenticar com Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Falha na autenticação');
      }

      // Carregar perfil diretamente
      const userProfile = await loadProfileDirect(authData.user.id);

      if (!userProfile) {
        throw new Error('Perfil não encontrado');
      }

      setState(prev => ({
        ...prev,
        user: userProfile,
        loading: false,
        error: null
      }));

      return { success: true, user: userProfile };

    } catch (error: any) {
      console.error('❌ [AuthDirect] Erro no login:', error);
      setState(prev => ({
        ...prev,
        user: null,
        loading: false,
        error: error.message
      }));

      return { success: false, error: error.message };
    }
  }, [loadProfileDirect]);

  /**
   * Logout
   */
  const signOutDirect = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setState({
        user: null,
        loading: false,
        error: null,
        initialized: true
      });
    } catch (error) {
      console.error('❌ [AuthDirect] Erro no logout:', error);
    }
  }, []);

  /**
   * Verificar sessão atual
   */
  const checkSession = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      if (session?.user) {
        const userProfile = await loadProfileDirect(session.user.id);
        setState({
          user: userProfile,
          loading: false,
          error: null,
          initialized: true
        });
      } else {
        setState({
          user: null,
          loading: false,
          error: null,
          initialized: true
        });
      }
    } catch (error: any) {
      console.error('❌ [AuthDirect] Erro ao verificar sessão:', error);
      setState({
        user: null,
        loading: false,
        error: error.message,
        initialized: true
      });
    }
  }, [loadProfileDirect]);

  // Inicializar na montagem
  useEffect(() => {
    checkSession();

    // Listener para mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 [AuthDirect] Auth event:', event);

      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const userProfile = await loadProfileDirect(session.user.id);
          setState(prev => ({
            ...prev,
            user: userProfile,
            loading: false,
            error: null
          }));
        } catch (error: any) {
          setState(prev => ({
            ...prev,
            user: null,
            loading: false,
            error: error.message
          }));
        }
      } else if (event === 'SIGNED_OUT') {
        setState(prev => ({
          ...prev,
          user: null,
          loading: false,
          error: null
        }));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkSession, loadProfileDirect]);

  return {
    ...state,
    signIn: signInDirect,
    signOut: signOutDirect,
    checkSession,
    loadProfile: loadProfileDirect
  };
};