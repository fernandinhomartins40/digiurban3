import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Supabase client para uso geral
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storageKey: 'digiurban-nextjs-auth', // Chave única para Next.js
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// Client para componentes
export const createSupabaseClient = () => createClientComponentClient()

// Tipos do banco de dados
export interface Tenant {
  id: string
  nome: string
  cnpj: string
  codigo_municipio: string
  uf: string
  regiao: string
  populacao: number
  plano: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
  status: 'ATIVO' | 'SUSPENSO' | 'CANCELADO' | 'TRIAL'
  data_criacao: string
  data_expiracao?: string
  trial_ate?: string
  logo_url?: string
  cor_primaria: string
  cor_secundaria: string
  dominio_personalizado?: string
  prefeito_nome?: string
  prefeito_email?: string
  prefeito_telefone?: string
  secretario_ti_nome?: string
  secretario_ti_email?: string
  usuarios_ativos: number
  protocolos_mes_atual: number
  storage_usado_gb: number
  ultima_atividade: string
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  email: string
  nome_completo: string
  cpf?: string
  telefone?: string
  tipo_usuario: 'super_admin' | 'admin' | 'secretario' | 'diretor' | 'coordenador' | 'funcionario' | 'atendente' | 'cidadao'
  tenant_id?: string
  secretaria_id?: string
  cargo?: string
  setor?: string
  status: 'ativo' | 'inativo' | 'suspenso'
  primeiro_acesso: boolean
  ultima_atividade?: string
  created_at: string
  updated_at: string
}

export interface TenantLog {
  id: string
  tenant_id: string
  acao: string
  recurso?: string
  usuario_id?: string
  usuario_nome?: string
  ip_address?: string
  user_agent?: string
  sessao_id?: string
  dados_adicionais?: any
  created_at: string
  status: 'SUCESSO' | 'ERRO' | 'AVISO'
}

export interface TenantMetrica {
  id: string
  tenant_id: string
  data_referencia: string
  mes: number
  ano: number
  usuarios_ativos: number
  usuarios_novos: number
  logins_total: number
  protocolos_criados: number
  protocolos_finalizados: number
  storage_usado_gb: number
  uso_por_secretaria: any
  funcionalidades_mais_usadas: any
  tempo_medio_resposta_ms: number
  uptime_percentual: number
  sessoes_total: number
  tempo_medio_sessao_min: number
  paginas_mais_visitadas: any
  created_at: string
}