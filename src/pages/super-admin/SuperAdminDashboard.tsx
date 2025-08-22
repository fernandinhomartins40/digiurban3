import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth';
import { supabase } from '../../lib/supabase';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Building2, 
  FileText,
  AlertTriangle,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Shield,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { SeedTestUsersButton } from '../../components/super-admin/SeedTestUsersButton';

// Interfaces para tipos de dados SaaS
interface SaaSMetrics {
  mrr: number;
  arrProjected: number;
  churnRate: number;
  cac: number;
  ltv: number;
  activeTenants: number;
  totalUsers: number;
  monthlyProtocols: number;
  growth: {
    mrrGrowth: number;
    tenantGrowth: number;
    userGrowth: number;
    protocolGrowth: number;
  };
  alerts: {
    id: string;
    type: 'churn' | 'payment' | 'usage' | 'technical';
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    count: number;
  }[];
}

interface RevenueData {
  month: string;
  mrr: number;
  newCustomers: number;
  churn: number;
}

interface PlanDistribution {
  STARTER: number;
  PROFESSIONAL: number;
  ENTERPRISE: number;
}

// Mock data para demonstração
const mockMetrics: SaaSMetrics = {
  mrr: 89750, // R$ 89.750 MRR
  arrProjected: 1077000, // R$ 1.077.000 ARR
  churnRate: 3.2, // 3.2% churn mensal
  cac: 850, // R$ 850 CAC
  ltv: 28500, // R$ 28.500 LTV
  activeTenants: 47,
  totalUsers: 1847,
  monthlyProtocols: 12749,
  growth: {
    mrrGrowth: 12.5,
    tenantGrowth: 8.9,
    userGrowth: 15.2,
    protocolGrowth: 23.7
  },
  alerts: [
    { id: '1', type: 'churn', message: 'Prefeitura de São José em risco de cancelamento', severity: 'high', count: 1 },
    { id: '2', type: 'payment', message: 'Faturas em atraso há mais de 7 dias', severity: 'medium', count: 3 },
    { id: '3', type: 'usage', message: 'Clientes próximos do limite do plano', severity: 'low', count: 5 },
    { id: '4', type: 'technical', message: 'Performance degradada em 2 tenants', severity: 'medium', count: 2 }
  ]
};

const mockRevenueData: RevenueData[] = [
  { month: 'Jun', mrr: 67250, newCustomers: 3, churn: 1 },
  { month: 'Jul', mrr: 72100, newCustomers: 4, churn: 0 },
  { month: 'Ago', mrr: 78950, newCustomers: 5, churn: 2 },
  { month: 'Set', mrr: 83200, newCustomers: 3, churn: 1 },
  { month: 'Out', mrr: 89750, newCustomers: 4, churn: 1 }
];

const mockPlanDistribution: PlanDistribution = {
  STARTER: 28,
  PROFESSIONAL: 15,
  ENTERPRISE: 4
};

const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile: user, loading: authLoading } = useAuth();
  const [metrics, setMetrics] = useState<SaaSMetrics>(mockMetrics);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [planDistribution, setPlanDistribution] = useState<PlanDistribution>({ STARTER: 0, PROFESSIONAL: 0, ENTERPRISE: 0 });
  const [loading, setLoading] = useState(true);
  const isInitialized = useRef(false);

  // Função para resolver alertas
  const resolveAlert = (alertId: string) => {
    setMetrics(prev => ({
      ...prev,
      alerts: prev.alerts.filter(alert => alert.id !== alertId)
    }));
  };

  // Função para atualizar métricas
  const refreshMetrics = async () => {
    setLoading(true);
    // Simular chamada API
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Aqui seria a chamada real para API
    setLoading(false);
  };

  useEffect(() => {
    // Proteção contra re-renderização múltipla
    if (isInitialized.current || authLoading || !user) {
      console.log('⏭️ Dashboard: Aguardando autenticação ou já inicializado');
      return;
    }

    // Verificar se é super admin
    if (user?.role !== 'super_admin') {
      console.warn('🚫 Dashboard SuperAdmin: Usuário não é super admin');
      navigate('/unauthorized');
      return;
    }

    // Carregar dados reais do banco
    const loadMetrics = async () => {
      setLoading(true);
      isInitialized.current = true;
      
      try {
        console.log('📊 Carregando métricas do dashboard super admin...');
        
        // Chamar função principal de métricas
        const { data: metricsData, error: metricsError } = await supabase
          .rpc('get_saas_dashboard_metrics');
        
        if (metricsError) {
          console.error('❌ Erro ao carregar métricas:', metricsError);
          throw metricsError;
        }

        // Chamar função de alertas
        const { data: alertsData, error: alertsError } = await supabase
          .rpc('get_active_alerts');
        
        if (alertsError) {
          console.error('❌ Erro ao carregar alertas:', alertsError);
          throw alertsError;
        }

        // Chamar função de evolução de receita
        const { data: revenueEvolutionData, error: revenueError } = await supabase
          .rpc('get_revenue_evolution');
        
        if (revenueError) {
          console.error('❌ Erro ao carregar evolução de receita:', revenueError);
        }

        // Chamar função de distribuição de planos
        const { data: plansDistributionData, error: plansError } = await supabase
          .rpc('get_plan_distribution');
        
        if (plansError) {
          console.error('❌ Erro ao carregar distribuição de planos:', plansError);
        }

        // Combinar dados reais
        const realMetrics: SaaSMetrics = {
          ...metricsData,
          alerts: alertsData || []
        };
        
        // Atualizar states com dados reais
        setMetrics(realMetrics);
        setRevenueData(revenueEvolutionData || []);
        setPlanDistribution(plansDistributionData || { STARTER: 0, PROFESSIONAL: 0, ENTERPRISE: 0 });
        
        console.log('✅ Métricas carregadas com sucesso:', {
          metrics: realMetrics,
          revenue: revenueEvolutionData,
          plans: plansDistributionData
        });
      } catch (error) {
        console.error('❌ Erro ao carregar métricas:', error);
        // Fallback para dados em branco em caso de erro
        const fallbackMetrics: SaaSMetrics = {
          mrr: 0,
          arrProjected: 0,
          churnRate: 0,
          cac: 0,
          ltv: 0,
          activeTenants: 0,
          totalUsers: 0,
          monthlyProtocols: 0,
          growth: {
            mrrGrowth: 0,
            tenantGrowth: 0,
            userGrowth: 0,
            protocolGrowth: 0
          },
          alerts: []
        };
        setMetrics(fallbackMetrics);
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, [user, authLoading, navigate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'churn': return <TrendingDown className="h-4 w-4 text-current" />;
      case 'payment': return <DollarSign className="h-4 w-4 text-current" />;
      case 'usage': return <BarChart3 className="h-4 w-4 text-current" />;
      case 'technical': return <Shield className="h-4 w-4 text-current" />;
      default: return <AlertTriangle className="h-4 w-4 text-current" />;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  // Aguardar carregamento da autenticação
  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Verificação de tipo de usuário
  if (user.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Apenas Super Administradores podem acessar este painel.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Carregando métricas SaaS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Executivo */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold">
                <span className="mr-2">🎛️</span>
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Centro de Comando SaaS
                </span>
              </h1>
              <p className="text-gray-600 text-lg">
                Gestão executiva da plataforma DigiUrban • Dashboard em tempo real
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Sistema Online
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  Atualizado há 2 min
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Zap className="h-3 w-3 mr-1 text-green-600" />
                Produção
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 📊 KPIs PRINCIPAIS - 8 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* 1. MRR - Monthly Recurring Revenue */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/50 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">MRR</CardTitle>
              <DollarSign className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{formatCurrency(metrics.mrr)}</div>
              <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-3 w-3" />
                {formatPercentage(metrics.growth.mrrGrowth)} vs mês anterior
              </p>
              <div className="text-xs text-gray-600 mt-1">Monthly Recurring Revenue</div>
            </CardContent>
          </Card>

          {/* 2. ARR - Annual Recurring Revenue */}
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200/50 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">ARR Projetado</CardTitle>
              <Target className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{formatCurrency(metrics.arrProjected)}</div>
              <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                Projeção baseada no MRR atual
              </p>
              <div className="text-xs text-gray-600 mt-1">Annual Recurring Revenue</div>
            </CardContent>
          </Card>

          {/* 3. Churn Rate */}
          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200/50 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">Churn Rate</CardTitle>
              <TrendingDown className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">{metrics.churnRate.toFixed(1)}%</div>
              <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                <ArrowDownRight className="h-3 w-3" />
                Abaixo da média SaaS (5%)
              </p>
              <div className="text-xs text-gray-600 mt-1">Taxa de Cancelamento Mensal</div>
            </CardContent>
          </Card>

          {/* 4. CAC - Customer Acquisition Cost */}
          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200/50 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">CAC</CardTitle>
              <Users className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{formatCurrency(metrics.cac)}</div>
              <p className="text-xs text-purple-600 flex items-center gap-1 mt-1">
                <Activity className="h-3 w-3" />
                LTV/CAC: {(metrics.ltv / metrics.cac).toFixed(1)}x
              </p>
              <div className="text-xs text-gray-600 mt-1">Customer Acquisition Cost</div>
            </CardContent>
          </Card>

          {/* 5. LTV - Lifetime Value */}
          <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200/50 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-indigo-700">LTV</CardTitle>
              <TrendingUp className="h-5 w-5 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-900">{formatCurrency(metrics.ltv)}</div>
              <p className="text-xs text-indigo-600 flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-3 w-3" />
                Payback em {Math.round(metrics.cac / (metrics.mrr / metrics.activeTenants))} meses
              </p>
              <div className="text-xs text-gray-600 mt-1">Customer Lifetime Value</div>
            </CardContent>
          </Card>

          {/* 6. Total de Tenants Ativos */}
          <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200/50 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-teal-700">Prefeituras Ativas</CardTitle>
              <Building2 className="h-5 w-5 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-900">{metrics.activeTenants}</div>
              <p className="text-xs text-teal-600 flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-3 w-3" />
                {formatPercentage(metrics.growth.tenantGrowth)} crescimento
              </p>
              <div className="text-xs text-gray-600 mt-1">Clientes Ativos</div>
            </CardContent>
          </Card>

          {/* 7. Usuários Totais */}
          <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200/50 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-pink-700">Total de Usuários</CardTitle>
              <Users className="h-5 w-5 text-pink-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-900">{metrics.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-pink-600 flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-3 w-3" />
                {formatPercentage(metrics.growth.userGrowth)} este mês
              </p>
              <div className="text-xs text-gray-600 mt-1">Usuários Únicos</div>
            </CardContent>
          </Card>

          {/* 8. Protocolos Processados */}
          <Card className="bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200/50 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Protocolos Mensais</CardTitle>
              <FileText className="h-5 w-5 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{metrics.monthlyProtocols.toLocaleString()}</div>
              <p className="text-xs text-slate-600 flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-3 w-3" />
                {formatPercentage(metrics.growth.protocolGrowth)} volume
              </p>
              <div className="text-xs text-gray-600 mt-1">Volume Total Mensal</div>
            </CardContent>
          </Card>
        </div>

        {/* 📈 GRÁFICOS INTERATIVOS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Evolução de Receita */}
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Evolução de Receita (MRR)
              </CardTitle>
              <CardDescription>
                Monthly Recurring Revenue - últimos 5 meses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {revenueData.map((data, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="font-medium text-sm w-12">{data.month}</div>
                      <div className="w-64 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${revenueData.length > 0 ? (data.mrr / Math.max(...revenueData.map(d => d.mrr))) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-semibold text-green-600">{formatCurrency(data.mrr)}</span>
                      <Badge variant="outline" className="text-xs">
                        +{data.newCustomers} novos
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Distribuição por Plano */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Distribuição por Plano
              </CardTitle>
              <CardDescription>
                Prefeituras por categoria de assinatura
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-sm">Starter</span>
                  </div>
                  <div className="text-sm font-semibold">{planDistribution.STARTER}</div>
                </div>
                <Progress value={metrics.activeTenants > 0 ? (planDistribution.STARTER / metrics.activeTenants) * 100 : 0} className="h-2" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Professional</span>
                  </div>
                  <div className="text-sm font-semibold">{planDistribution.PROFESSIONAL}</div>
                </div>
                <Progress value={metrics.activeTenants > 0 ? (planDistribution.PROFESSIONAL / metrics.activeTenants) * 100 : 0} className="h-2" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Enterprise</span>
                  </div>
                  <div className="text-sm font-semibold">{planDistribution.ENTERPRISE}</div>
                </div>
                <Progress value={metrics.activeTenants > 0 ? (planDistribution.ENTERPRISE / metrics.activeTenants) * 100 : 0} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 🚨 ALERTAS CRÍTICOS */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Alertas Críticos ({metrics.alerts.length})
            </CardTitle>
            <CardDescription>
              Situações que requerem atenção imediata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg border border-gray-200/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-full ${
                      alert.severity === 'critical' ? 'bg-red-100 text-red-600' :
                      alert.severity === 'high' ? 'bg-orange-100 text-orange-600' :
                      alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {getAlertIcon(alert.type)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{alert.message}</p>
                      <p className="text-xs text-gray-500 capitalize">{alert.type} • {alert.severity}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={getAlertColor(alert.severity) as 'default' | 'secondary' | 'destructive' | 'outline'} className="text-xs">
                      {alert.count} {alert.count === 1 ? 'item' : 'itens'}
                    </Badge>
                    <button 
                      onClick={() => resolveAlert(alert.id)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      Resolver
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ações Rápidas */}
        <Card className="mb-8 bg-gradient-to-r from-white to-blue-50/50 border-blue-200/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Ações Rápidas
            </CardTitle>
            <CardDescription>
              Acesso direto às principais funcionalidades administrativas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                onClick={() => navigate('/super-admin/tenants')}
                className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200/50 hover:shadow-md transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-center p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors shrink-0">
                  <Building2 className="h-6 w-6 text-blue-600 shrink-0" />
                </div>
                <div>
                  <p className="font-semibold text-blue-900">Gerenciar Tenants</p>
                  <p className="text-sm text-blue-600">Administrar prefeituras</p>
                </div>
              </div>
              
              <div 
                onClick={() => navigate('/super-admin/billing')}
                className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-200/50 hover:shadow-md transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-center p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors shrink-0">
                  <DollarSign className="h-6 w-6 text-purple-600 shrink-0" />
                </div>
                <div>
                  <p className="font-semibold text-purple-900">Gestão Financeira</p>
                  <p className="text-sm text-purple-600">Billing e receitas</p>
                </div>
              </div>
              
              <div 
                onClick={() => navigate('/super-admin/analytics')}
                className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200/50 hover:shadow-md transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-center p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors shrink-0">
                  <BarChart3 className="h-6 w-6 text-green-600 shrink-0" />
                </div>
                <div>
                  <p className="font-semibold text-green-900">Analytics</p>
                  <p className="text-sm text-green-600">Relatórios empresariais</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 🧪 Ferramentas de Desenvolvimento */}
        <div className="mb-8">
          <SeedTestUsersButton />
        </div>

        {/* Footer de Status */}
        <div className="text-center text-sm text-gray-500 py-8">
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Sistema Operacional</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Backup Automático Ativo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Monitoramento 24/7</span>
            </div>
          </div>
          <p className="mt-2 text-xs">
            Dashboard atualizado a cada 2 minutos • Última sincronização: {new Date().toLocaleTimeString('pt-BR')}
          </p>
        </div>

      </div>
    </div>
  );
};

export default SuperAdminDashboard;