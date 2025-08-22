'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { supabase, Tenant } from '@/lib/supabase'
import { 
  Building2, 
  Users, 
  Calendar,
  MapPin,
  Edit,
  Eye,
  Trash2,
  Plus,
  Search,
  Filter,
  DollarSign
} from 'lucide-react'

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [filteredTenants, setFilteredTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [planoFilter, setPlanoFilter] = useState('ALL')

  useEffect(() => {
    loadTenants()
  }, [])

  useEffect(() => {
    filterTenants()
  }, [tenants, searchTerm, statusFilter, planoFilter])

  const loadTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao carregar tenants:', error)
        return
      }

      setTenants(data || [])
    } catch (error) {
      console.error('Erro ao carregar tenants:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterTenants = () => {
    let filtered = tenants

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(tenant =>
        tenant.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.cnpj.includes(searchTerm) ||
        tenant.uf.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.codigo_municipio.includes(searchTerm)
      )
    }

    // Filtro por status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(tenant => tenant.status === statusFilter)
    }

    // Filtro por plano
    if (planoFilter !== 'ALL') {
      filtered = filtered.filter(tenant => tenant.plano === planoFilter)
    }

    setFilteredTenants(filtered)
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      'ATIVO': 'status-active',
      'SUSPENSO': 'status-suspended',
      'CANCELADO': 'status-cancelled',
      'TRIAL': 'status-badge bg-blue-50 text-blue-600'
    }
    return styles[status as keyof typeof styles] || 'status-inactive'
  }

  const getPlanoBadge = (plano: string) => {
    const styles = {
      'STARTER': 'status-badge bg-gray-100 text-gray-700',
      'PROFESSIONAL': 'status-badge bg-blue-100 text-blue-700',
      'ENTERPRISE': 'status-badge bg-purple-100 text-purple-700'
    }
    return styles[plano as keyof typeof styles] || 'status-inactive'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatCurrency = (plano: string) => {
    const values = {
      'STARTER': 'R$ 99/mês',
      'PROFESSIONAL': 'R$ 299/mês', 
      'ENTERPRISE': 'R$ 799/mês'
    }
    return values[plano as keyof typeof values] || 'Grátis'
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tenants</h1>
            <p className="text-gray-600 mt-2">Gerenciar prefeituras e municípios cadastrados</p>
          </div>
          
          <button className="btn-primary flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Novo Tenant
          </button>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="input pl-10"
                  placeholder="Pesquisar por nome, CNPJ, UF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full lg:w-auto">
              <select
                className="input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">Todos os Status</option>
                <option value="ATIVO">Ativo</option>
                <option value="TRIAL">Trial</option>
                <option value="SUSPENSO">Suspenso</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>

            {/* Plan Filter */}
            <div className="w-full lg:w-auto">
              <select
                className="input"
                value={planoFilter}
                onChange={(e) => setPlanoFilter(e.target.value)}
              >
                <option value="ALL">Todos os Planos</option>
                <option value="STARTER">Starter</option>
                <option value="PROFESSIONAL">Professional</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-primary-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-xl font-bold">{tenants.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="h-3 w-3 bg-success-500 rounded-full mr-2"></div>
              <div>
                <p className="text-sm text-gray-600">Ativos</p>
                <p className="text-xl font-bold">{tenants.filter(t => t.status === 'ATIVO').length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="h-3 w-3 bg-blue-500 rounded-full mr-2"></div>
              <div>
                <p className="text-sm text-gray-600">Trial</p>
                <p className="text-xl font-bold">{tenants.filter(t => t.status === 'TRIAL').length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-success-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">MRR</p>
                <p className="text-xl font-bold">
                  R$ {tenants.reduce((sum, t) => {
                    const values = { STARTER: 99, PROFESSIONAL: 299, ENTERPRISE: 799 }
                    return t.status === 'ATIVO' ? sum + (values[t.plano as keyof typeof values] || 0) : sum
                  }, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tenants Table */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plano
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Localização
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuários
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Criado em
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {tenant.nome}
                          </div>
                          <div className="text-sm text-gray-500">
                            CNPJ: {tenant.cnpj}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(tenant.status)}>
                        {tenant.status}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <span className={getPlanoBadge(tenant.plano)}>
                          {tenant.plano}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatCurrency(tenant.plano)}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                        {tenant.uf} - {tenant.regiao}
                      </div>
                      <div className="text-xs text-gray-500">
                        Pop: {tenant.populacao.toLocaleString()}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Users className="h-4 w-4 mr-1 text-gray-400" />
                        {tenant.usuarios_ativos}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(tenant.created_at)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          className="text-primary-600 hover:text-primary-700"
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="text-gray-600 hover:text-gray-700"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          className="text-error-600 hover:text-error-700"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredTenants.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {tenants.length === 0 ? 'Nenhum tenant cadastrado' : 'Nenhum tenant encontrado com os filtros aplicados'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}