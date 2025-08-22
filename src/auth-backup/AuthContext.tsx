// ======================================================
// CONTEXTO LEGADO - REDIRECIONANDO PARA SISTEMA UNIFICADO
// ======================================================
// Este arquivo mantém compatibilidade com código existente
// mas redireciona para o novo sistema unificado

import React, { ReactNode } from 'react'
import { AuthV2Provider, useAuthV2, AuthUser } from '../hooks/useAuthV2'
import { User } from '@supabase/supabase-js'

// Manter interface legada para compatibilidade
interface AuthContextType {
  user: AuthUser | null
  profile: AuthUser | null
  permissions: string[]
  loading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
  signUpCitizen: (email: string, password: string, nomeCompleto: string, cpf: string, telefone: string) => Promise<any>
  refreshProfile: () => Promise<void>
  hasPermission: (permissionCode: string) => boolean
  isAdmin: () => boolean
  isCitizen: () => boolean
}

// Redirecionar para o hook seguro
export function useAuth(): AuthContextType {
  const auth = useAuthV2()
  
  return {
    user: auth.user,
    profile: auth.user,
    permissions: auth.user?.permissions?.map(p => p.code) || [],
    loading: auth.loading,
    signIn: async (email: string, password: string) => {
      return auth.signIn({ email, password })
    },
    signOut: auth.signOut,
    signUpCitizen: async (email: string, password: string, nomeCompleto: string, cpf: string, telefone: string) => {
      return auth.signUpCitizen({ email, password, fullName: nomeCompleto, cpf, phone: telefone })
    },
    refreshProfile: auth.refreshUser,
    hasPermission: auth.hasPermission,
    isAdmin: auth.isAdmin,
    isCitizen: auth.isCitizen
  }
}

interface AuthProviderProps {
  children: ReactNode
}

// Provider legado que agora usa o sistema seguro
export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <AuthV2Provider>
      {children}
    </AuthV2Provider>
  )
}