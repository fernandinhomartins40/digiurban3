import { supabase } from './supabase'
import { UserProfile } from './supabase'

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  success: boolean
  user?: UserProfile
  error?: string
}

// Login do Super Admin
export async function loginSuperAdmin(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    // 1. Fazer login via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    if (authError) {
      return {
        success: false,
        error: authError.message
      }
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Usuário não encontrado'
      }
    }

    // 2. Verificar se é super admin
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .eq('tipo_usuario', 'super_admin')
      .eq('status', 'ativo')
      .single()

    if (profileError || !profile) {
      // Fazer logout se não for super admin
      await supabase.auth.signOut()
      return {
        success: false,
        error: 'Acesso negado. Apenas Super Admins podem acessar este painel.'
      }
    }

    // 3. Log de acesso
    await logSuperAdminAccess(profile.id, credentials.email)

    return {
      success: true,
      user: profile
    }

  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erro interno do servidor'
    }
  }
}

// Logout
export async function logout() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Erro ao fazer logout:', error)
  }
}

// Verificar se usuário está logado e é super admin
export async function checkSuperAdmin(): Promise<{ isAuthenticated: boolean; user?: UserProfile }> {
  try {
    // 1. Verificar sessão do Supabase
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return { isAuthenticated: false }
    }

    // 2. Verificar perfil de super admin
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .eq('tipo_usuario', 'super_admin')
      .eq('status', 'ativo')
      .single()

    if (error || !profile) {
      // Se não é super admin, fazer logout
      await supabase.auth.signOut()
      return { isAuthenticated: false }
    }

    return {
      isAuthenticated: true,
      user: profile
    }

  } catch (error) {
    console.error('Erro ao verificar autenticação:', error)
    return { isAuthenticated: false }
  }
}

// Log de acesso do super admin
async function logSuperAdminAccess(userId: string, email: string) {
  try {
    await supabase
      .from('tenant_logs')
      .insert({
        tenant_id: null, // Super admin não tem tenant específico
        acao: 'SUPER_ADMIN_LOGIN',
        recurso: 'super_admin_panel',
        usuario_id: userId,
        usuario_nome: email,
        ip_address: null, // Será preenchido pelo trigger do banco
        user_agent: navigator?.userAgent || null,
        dados_adicionais: {
          timestamp: new Date().toISOString(),
          panel_version: '1.0.0'
        },
        status: 'SUCESSO'
      })
  } catch (error) {
    console.error('Erro ao registrar log de acesso:', error)
  }
}

// Hook para usar em componentes React
export function useAuth() {
  return {
    login: loginSuperAdmin,
    logout,
    checkAuth: checkSuperAdmin
  }
}