import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2,
  Building2,
  Users,
  MapPin,
  Calendar,
  Activity,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Shield,
  Zap,
  MoreHorizontal,
  Key,
  UserPlus
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Progress } from '../../components/ui/progress';

// Modais separados conforme nova arquitetura
import CreateTenantModal from '../../components/super-admin/CreateTenantModal';
import CreateTenantAdminModal from '../../components/super-admin/CreateTenantAdminModal';
import ViewTenantModal from '../../components/super-admin/ViewTenantModal';
import EditTenantModal from '../../components/super-admin/EditTenantModal';
import DeleteTenantModal from '../../components/super-admin/DeleteTenantModal';

// Serviços separados
import { useTenantService } from '../../services/tenantService';
import { useTenantUserService } from '../../services/tenantUserService';

// ====================================================================
// INTERFACES E TIPOS
// ====================================================================

interface Tenant {
  id: string;
  nome: string;
  tenant_code: string;
  cidade: string;
  estado: string;
  populacao: number;
  cnpj: string;
  status: 'ativo' | 'inativo' | 'suspenso' | 'trial';
  plano: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  data_criacao: string;
  ultimo_acesso: string;
  usuarios_ativos: number;
  limite_usuarios: number;
  protocolos_mes: number;
  valor_mensal: number;
  
  // Dados de contato (não criam usuário)
  responsavel_nome?: string;
  responsavel_email?: string;
  responsavel_telefone?: string;
  
  // Status de administrador
  has_admin: boolean;
  admin_confirmed: boolean;
  admin_first_login: boolean;
  
  configuracoes: {
    personalizacao_ativa: boolean;
    backup_automatico: boolean;
    ssl_customizado: boolean;
    integracao_terceiros: boolean;
  };
  metricas: {
    uptime: number;
    satisfacao: number;
    tempo_resposta: number;
    tickets_abertos: number;
  };
}

interface TenantFilters {
  status: string;
  plano: string;
  cidade: string;
  busca: string;
}

// ====================================================================
// DADOS CARREGADOS DO BANCO (não usa mais dados mock)
// ====================================================================

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================

const TenantsManagement: React.FC = () => {
  const { getAllTenants, updateTenant, deleteTenant } = useTenantService();
  const { createAdminForTenant } = useTenantUserService();
  
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TenantFilters>({
    status: '',
    plano: '',
    cidade: '',
    busca: ''
  });

  // Estados dos modais separados
  const [showCreateTenantModal, setShowCreateTenantModal] = useState(false);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  // ====================================================================
  // EFEITOS E FILTROS
  // ====================================================================

  useEffect(() => {
    loadTenantsFromDatabase();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, tenants]); // eslint-disable-line react-hooks/exhaustive-deps

  // ====================================================================
  // FUNÇÕES DE CARREGAMENTO
  // ====================================================================

  const loadTenantsFromDatabase = async () => {
    try {
      setLoading(true);
      console.log('🏢 Carregando tenants usando TenantService...');
      
      const tenantsData = await getAllTenants();
      console.log('📊 Tenants carregados:', tenantsData);

      // Mapear dados para o formato esperado
      const mappedTenants: Tenant[] = tenantsData.map(tenant => ({
        id: tenant.id,
        nome: tenant.nome,
        tenant_code: tenant.tenant_code,
        cidade: tenant.cidade,
        estado: tenant.estado,
        populacao: tenant.populacao,
        cnpj: tenant.cnpj,
        status: tenant.status === 'ativo' ? 'ativo' as const : 
               tenant.status === 'trial' ? 'trial' as const :
               tenant.status === 'suspenso' ? 'suspenso' as const : 'inativo' as const,
        plano: tenant.plano.toUpperCase() as 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE',
        data_criacao: tenant.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        ultimo_acesso: new Date().toISOString(),
        usuarios_ativos: 0, // Será calculado posteriormente
        limite_usuarios: tenant.plano.toLowerCase() === 'enterprise' ? 500 : tenant.plano.toLowerCase() === 'professional' ? 150 : 50,
        protocolos_mes: 0, // Será calculado posteriormente
        valor_mensal: tenant.plano.toLowerCase() === 'enterprise' ? 10000 : tenant.plano.toLowerCase() === 'professional' ? 4500 : 1200,
        
        // Dados de contato (não são usuários)
        responsavel_nome: tenant.responsavel_nome,
        responsavel_email: tenant.responsavel_email,
        responsavel_telefone: tenant.responsavel_telefone,
        
        // Status de admin
        has_admin: tenant.has_admin || false,
        admin_confirmed: tenant.admin_confirmed || false,
        admin_first_login: tenant.admin_first_login || false,
        
        configuracoes: {
          personalizacao_ativa: tenant.plano.toLowerCase() === 'enterprise',
          backup_automatico: true,
          ssl_customizado: tenant.plano.toLowerCase() === 'enterprise',
          integracao_terceiros: tenant.plano.toLowerCase() !== 'starter'
        },
        metricas: {
          uptime: 99.0,
          satisfacao: 4.0,
          tempo_resposta: 2.0,
          tickets_abertos: 0
        }
      }));

      setTenants(mappedTenants);
      console.log('✅ Tenants mapeados e carregados:', mappedTenants);
      
    } catch (error) {
      console.error('❌ Erro ao carregar tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tenants];

    if (filters.status) {
      filtered = filtered.filter(tenant => tenant.status === filters.status);
    }
    
    if (filters.plano) {
      filtered = filtered.filter(tenant => tenant.plano === filters.plano);
    }
    
    if (filters.cidade) {
      filtered = filtered.filter(tenant => 
        tenant.cidade.toLowerCase().includes(filters.cidade.toLowerCase())
      );
    }
    
    if (filters.busca) {
      const busca = filters.busca.toLowerCase();
      filtered = filtered.filter(tenant => 
        tenant.nome.toLowerCase().includes(busca) ||
        tenant.tenant_code.toLowerCase().includes(busca) ||
        tenant.cidade.toLowerCase().includes(busca) ||
        (tenant.responsavel_nome || '').toLowerCase().includes(busca)
      );
    }

    setFilteredTenants(filtered);
  };

  // ====================================================================
  // FUNÇÕES DE AÇÃO
  // ====================================================================

  const handleStatusChange = (tenantId: string, newStatus: string) => {
    setTenants(prev => prev.map(tenant => 
      tenant.id === tenantId ? { ...tenant, status: newStatus as 'ativo' | 'inativo' | 'suspenso' | 'trial' } : tenant
    ));
  };


  // ====================================================================
  // HANDLERS DOS MODAIS SEPARADOS
  // ====================================================================

  const handleCreateTenant = () => {
    setShowCreateTenantModal(true);
  };

  const handleCreateAdmin = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setShowCreateAdminModal(true);
  };

  const handleViewTenant = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant) {
      setSelectedTenant(tenant);
      setShowViewModal(true);
    }
  };

  const handleEditTenant = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant) {
      setSelectedTenant(tenant);
      setShowEditModal(true);
    }
  };

  const handleConfigureTenant = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant) {
      setSelectedTenant(tenant);
      setShowEditModal(true);
    }
  };

  const handleDeleteTenant = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant) {
      setSelectedTenant(tenant);
      setShowDeleteModal(true);
    }
  };

  // ====================================================================
  // HANDLERS DE SUBMISSÃO DOS MODAIS SEPARADOS
  // ====================================================================

  const handleCreateTenantSubmit = async (tenantData: any) => {
    try {
      setLoading(true);
      console.log('🏗️ Tenant criado via CreateTenantModal');

      // Recarregar lista de tenants
      await loadTenantsFromDatabase();

      console.log('🎉 Tenant adicionado com sucesso!');
      setShowCreateTenantModal(false);

      // Oferecer criação de admin
      const confirm = window.confirm(
        'Tenant criado com sucesso!\n\n' +
        'Deseja criar o administrador agora?'
      );
      
      if (confirm) {
        // Buscar o tenant recém-criado
        const tenantsData = await getAllTenants();
        const newTenant = tenantsData[0]; // Último criado
        if (newTenant) {
          handleCreateAdmin({
            id: newTenant.id,
            nome: newTenant.nome,
            tenant_code: newTenant.tenant_code,
            cidade: newTenant.cidade,
            estado: newTenant.estado,
            has_admin: false
          } as Tenant);
        }
      }

    } catch (error: any) {
      console.error('❌ Erro ao processar criação de tenant:', error);
      alert(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdminSubmit = async (userData: any, credentials: any) => {
    try {
      console.log('👤 Admin criado com sucesso:', credentials);
      
      // Recarregar lista para refletir que tenant tem admin
      await loadTenantsFromDatabase();
      
      setShowCreateAdminModal(false);
      setSelectedTenant(null);

      alert(
        `Administrador criado com sucesso!\n\n` +
        `Email: ${credentials.email}\n` +
        `Senha temporária: ${credentials.password}\n\n` +
        `Credenciais enviadas por email.`
      );

    } catch (error: any) {
      console.error('❌ Erro ao processar criação de admin:', error);
      alert(`Erro: ${error.message}`);
    }
  };

  const handleEditSubmit = async (tenantId: string, tenantData: {
    nome: string;
    cidade: string;
    estado: string;
    populacao: number;
    responsavel_nome: string;
    responsavel_email: string;
    responsavel_telefone: string;
    status: 'ativo' | 'inativo' | 'suspenso' | 'trial';
    plano: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
    limite_usuarios: number;
  }) => {
    try {
      console.log('🔄 Atualizando tenant:', tenantId, tenantData);
      
      // Chamar TenantService para atualizar no banco
      const updatedTenant = await updateTenant(tenantId, {
        nome: tenantData.nome,
        cidade: tenantData.cidade,
        estado: tenantData.estado,
        populacao: tenantData.populacao,
        plano: tenantData.plano.toLowerCase() as 'starter' | 'professional' | 'enterprise'
      });

      // Recarregar lista após atualização
      await loadTenantsFromDatabase();
      
      console.log('✅ Tenant atualizado com sucesso');
      
    } catch (error: any) {
      console.error('❌ Erro ao atualizar tenant:', error);
      alert(`Erro ao atualizar tenant: ${error.message}`);
    }
  };

  const handleDeleteConfirm = async (tenantId: string) => {
    try {
      console.log('🗑️ Excluindo tenant:', tenantId);
      
      // Chamar TenantService para excluir do banco (soft delete)
      await deleteTenant(tenantId);
      
      // Recarregar lista após exclusão
      await loadTenantsFromDatabase();
      
      console.log('✅ Tenant excluído com sucesso');
      
    } catch (error: any) {
      console.error('❌ Erro ao excluir tenant:', error);
      alert(`Erro ao excluir tenant: ${error.message}`);
    }
  };

  // ====================================================================
  // COMPONENTES DE RENDERIZAÇÃO
  // ====================================================================

  const getTenantStatus = (tenant: Tenant) => {
    if (!tenant.has_admin) return 'sem_admin';
    if (!tenant.admin_confirmed) return 'admin_pendente';
    if (!tenant.admin_first_login) return 'aguardando_primeiro_login';
    return 'ativo';
  };

  const getTenantStatusBadge = (tenant: Tenant) => {
    const status = getTenantStatus(tenant);
    const statusConfig = {
      sem_admin: { 
        label: '🏛️ Sem Admin', 
        color: 'bg-yellow-100 text-yellow-800', 
        icon: <AlertCircle className="h-3 w-3" /> 
      },
      admin_pendente: { 
        label: '⏳ Admin Pendente', 
        color: 'bg-orange-100 text-orange-800', 
        icon: <Clock className="h-3 w-3" /> 
      },
      aguardando_primeiro_login: { 
        label: '🔑 Aguardando Login', 
        color: 'bg-blue-100 text-blue-800', 
        icon: <Key className="h-3 w-3" /> 
      },
      ativo: { 
        label: '✅ Totalmente Ativo', 
        color: 'bg-green-100 text-green-800', 
        icon: <CheckCircle className="h-3 w-3" /> 
      }
    };
    
    const config = statusConfig[status];
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ativo: { label: 'Ativo', variant: 'default' as const, icon: <CheckCircle className="h-3 w-3" />, color: 'bg-green-100 text-green-800' },
      inativo: { label: 'Inativo', variant: 'secondary' as const, icon: <AlertCircle className="h-3 w-3" />, color: 'bg-gray-100 text-gray-800' },
      suspenso: { label: 'Suspenso', variant: 'destructive' as const, icon: <AlertCircle className="h-3 w-3" />, color: 'bg-red-100 text-red-800' },
      trial: { label: 'Trial', variant: 'outline' as const, icon: <Clock className="h-3 w-3" />, color: 'bg-yellow-100 text-yellow-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inativo;
    return (
      <Badge variant={config.variant} className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getPlanoBadge = (plano: string) => {
    const planoConfig = {
      STARTER: { label: 'Starter', color: 'bg-purple-100 text-purple-800' },
      PROFESSIONAL: { label: 'Professional', color: 'bg-blue-100 text-blue-800' },
      ENTERPRISE: { label: 'Enterprise', color: 'bg-green-100 text-green-800' }
    };
    
    const config = planoConfig[plano as keyof typeof planoConfig] || planoConfig.STARTER;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  // ====================================================================
  // RENDER PRINCIPAL
  // ====================================================================

  if (loading && tenants.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 text-lg">Carregando prefeituras...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              🏛️ Gestão de Tenants
            </h1>
            <p className="text-gray-600 text-lg mt-2">
              Sistema completo de administração de prefeituras e municípios
            </p>
          </div>
          <Button 
            onClick={handleCreateTenant}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Prefeitura
          </Button>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Ativos</p>
                <p className="text-3xl font-bold text-green-900">
                  {tenants.filter(t => t.status === 'ativo').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Receita Mensal</p>
                <p className="text-3xl font-bold text-blue-900">
                  {formatCurrency(tenants.reduce((sum, t) => sum + t.valor_mensal, 0))}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Usuários Totais</p>
                <p className="text-3xl font-bold text-purple-900">
                  {formatNumber(tenants.reduce((sum, t) => sum + t.usuarios_ativos, 0))}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Protocolos/Mês</p>
                <p className="text-3xl font-bold text-orange-900">
                  {formatNumber(tenants.reduce((sum, t) => sum + t.protocolos_mes, 0))}
                </p>
              </div>
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar prefeitura..."
                value={filters.busca}
                onChange={(e) => setFilters(prev => ({ ...prev, busca: e.target.value }))}
                className="pl-9"
              />
            </div>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Todos os Status</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="suspenso">Suspenso</option>
              <option value="trial">Trial</option>
            </select>

            <select
              value={filters.plano}
              onChange={(e) => setFilters(prev => ({ ...prev, plano: e.target.value }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Todos os Planos</option>
              <option value="STARTER">Starter</option>
              <option value="PROFESSIONAL">Professional</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>

            <Input
              placeholder="Filtrar por cidade..."
              value={filters.cidade}
              onChange={(e) => setFilters(prev => ({ ...prev, cidade: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Tenants */}
      <Card>
        <CardHeader>
          <CardTitle>Prefeituras Cadastradas ({filteredTenants.length})</CardTitle>
          <CardDescription>
            Lista completa com informações detalhadas de cada tenant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTenants.map((tenant) => (
              <Card key={tenant.id} className="bg-gradient-to-r from-white to-gray-50/50 hover:shadow-md transition-all">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    
                    {/* Informações Principais */}
                    <div className="lg:col-span-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Building2 className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{tenant.nome}</h3>
                          <p className="text-sm text-gray-600">{tenant.tenant_code}</p>
                          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                            <MapPin className="h-3 w-3" />
                            {tenant.cidade}, {tenant.estado}
                          </div>
                          <p className="text-xs text-gray-500">
                            Pop: {formatNumber(tenant.populacao)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Status e Plano */}
                    <div className="lg:col-span-2">
                      <div className="space-y-2">
                        {getTenantStatusBadge(tenant)}
                        {getPlanoBadge(tenant.plano)}
                      </div>
                    </div>

                    {/* Métricas de Uso */}
                    <div className="lg:col-span-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Usuários</span>
                          <span className="font-medium">
                            {tenant.usuarios_ativos}/{tenant.limite_usuarios}
                          </span>
                        </div>
                        <Progress 
                          value={(tenant.usuarios_ativos / tenant.limite_usuarios) * 100} 
                          className="h-2"
                        />
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Protocolos/Mês</span>
                          <span className="font-medium">{formatNumber(tenant.protocolos_mes)}</span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Uptime: {tenant.metricas.uptime}%</span>
                          <span>Satisfação: {tenant.metricas.satisfacao}★</span>
                        </div>
                      </div>
                    </div>

                    {/* Informações Financeiras */}
                    <div className="lg:col-span-2">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(tenant.valor_mensal)}
                        </p>
                        <p className="text-xs text-gray-500">por mês</p>
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-gray-600">
                            Desde: {new Date(tenant.data_criacao).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-xs text-gray-500">
                            Último acesso: {new Date(tenant.ultimo_acesso).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Ações Contextuais */}
                    <div className="lg:col-span-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Ação principal baseada no status */}
                        {!tenant.has_admin ? (
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleCreateAdmin(tenant)}
                            title="Criar administrador para este tenant"
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Criar Admin
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-blue-600 hover:bg-blue-50"
                            onClick={() => handleViewTenant(tenant.id)}
                            title="Ver detalhes do tenant"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver Detalhes
                          </Button>
                        )}
                        
                        {/* Ações secundárias */}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-gray-600 hover:bg-gray-50"
                          onClick={() => handleEditTenant(tenant.id)}
                          title="Editar tenant"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-gray-600 hover:bg-gray-50"
                          onClick={() => handleConfigureTenant(tenant.id)}
                          title="Configurações"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteTenant(tenant.id)}
                          title="Excluir tenant"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                  </div>

                  {/* Dados de Contato */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-medium">Contato:</span>
                        <span>{tenant.responsavel_nome || 'Não informado'}</span>
                        {tenant.responsavel_email && (
                          <>
                            <span>•</span>
                            <span>{tenant.responsavel_email}</span>
                          </>
                        )}
                        {tenant.responsavel_telefone && (
                          <>
                            <span>•</span>
                            <span>{tenant.responsavel_telefone}</span>
                          </>
                        )}
                      </div>
                      
                      {tenant.metricas.tickets_abertos > 0 && (
                        <Badge variant="outline" className="text-orange-600 border-orange-200">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {tenant.metricas.tickets_abertos} tickets abertos
                        </Badge>
                      )}
                    </div>
                  </div>

                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modais Separados */}
      <CreateTenantModal
        isOpen={showCreateTenantModal}
        onClose={() => setShowCreateTenantModal(false)}
        onSubmit={handleCreateTenantSubmit}
      />

      <CreateTenantAdminModal
        isOpen={showCreateAdminModal}
        onClose={() => {
          setShowCreateAdminModal(false);
          setSelectedTenant(null);
        }}
        onSubmit={handleCreateAdminSubmit}
        tenant={selectedTenant}
      />

      <ViewTenantModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        tenant={selectedTenant}
      />

      <EditTenantModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        tenant={selectedTenant}
        onSubmit={handleEditSubmit}
      />

      <DeleteTenantModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        tenant={selectedTenant}
        onConfirm={handleDeleteConfirm}
      />

    </div>
  );
};

export default TenantsManagement;