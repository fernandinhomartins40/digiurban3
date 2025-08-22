'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { supabase } from '@/lib/supabase'
import { 
  Building2, 
  Users, 
  FileText, 
  TrendingUp,
  DollarSign,
  Activity,
  Clock,
  AlertTriangle
} from 'lucide-react'

interface DashboardStats {
  totalTenants: number
  activeTenants: number
  totalUsers: number
  totalProtocols: number
  monthlyRevenue: number
  avgResponseTime: number
}

interface RecentActivity {
  id: string
  acao: string
  tenant_nome?: string
  usuario_nome?: string
  created_at: string
  status: 'SUCESSO' | 'ERRO' | 'AVISO'
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTenants: 0,
    activeTenants: 0,
    totalUsers: 0,
    totalProtocols: 0,
    monthlyRevenue: 0,
    avgResponseTime: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Carregar estatísticas dos tenants
      const { data: tenants } = await supabase
        .from('tenants')
        .select('*')

      // Carregar usuários
      const { data: users } = await supabase
        .from('user_profiles')
        .select('*')

      // Carregar protocolos (se a tabela existir)
      const { data: protocols } = await supabase
        .from('protocolos')
        .select('id')

      // Carregar atividade recente
      const { data: logs } = await supabase
        .from('tenant_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      // Calcular estatísticas
      setStats({
        totalTenants: tenants?.length || 0,
        activeTenants: tenants?.filter(t => t.status === 'ATIVO')?.length || 0,
        totalUsers: users?.length || 0,
        totalProtocols: protocols?.length || 0,
        monthlyRevenue: tenants?.reduce((sum, t) => {
          const planValues = { STARTER: 99, PROFESSIONAL: 299, ENTERPRISE: 799 }
          return sum + (planValues[t.plano as keyof typeof planValues] || 0)
        }, 0) || 0,
        avgResponseTime: 180 // Mock
      })

      setRecentActivity(logs || [])
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCESSO':
        return 'text-success-600 bg-success-50'
      case 'ERRO':
        return 'text-error-600 bg-error-50'
      case 'AVISO':
        return 'text-warning-600 bg-warning-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Visão geral da plataforma DigiUrban</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Tenants */}
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Building2 className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Tenants</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTenants}</p>
              </div>
            </div>
          </div>

          {/* Active Tenants */}
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-success-100 rounded-lg">
                <Activity className="h-6 w-6 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tenants Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeTenants}</p>
              </div>
            </div>
          </div>

          {/* Total Users */}
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          {/* Monthly Revenue */}
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Receita Mensal</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.monthlyRevenue)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Stats */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas Rápidas</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-500 mr-3" />
                  <span className="text-sm text-gray-700">Total de Protocolos</span>
                </div>
                <span className="font-semibold text-gray-900">{stats.totalProtocols}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-500 mr-3" />
                  <span className="text-sm text-gray-700">Tempo Médio de Resposta</span>
                </div>
                <span className="font-semibold text-gray-900">{stats.avgResponseTime}ms</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <TrendingUp className="h-5 w-5 text-gray-500 mr-3" />
                  <span className="text-sm text-gray-700">Taxa de Crescimento</span>
                </div>
                <span className="font-semibold text-success-600">+12.5%</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividade Recente</h3>
            <div className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.acao}
                      </p>
                      <p className="text-xs text-gray-500">
                        {activity.usuario_nome} • {formatDate(activity.created_at)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(activity.status)}`}>
                      {activity.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                  <p>Nenhuma atividade recente</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}