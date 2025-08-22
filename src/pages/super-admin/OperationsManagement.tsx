import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Database, 
  RefreshCw,
  Download,
  Upload,
  Settings,
  Users,
  Key,
  Lock,
  Unlock,
  Archive,
  Trash2,
  FileText,
  Terminal,
  HardDrive,
  Cloud,
  Mail,
  Bell,
  Calendar,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  Play,
  Pause,
  Stop
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { Input } from '../../components/ui/input';

// ====================================================================
// INTERFACES E TIPOS
// ====================================================================

interface BackupJob {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'differential';
  status: 'running' | 'completed' | 'failed' | 'scheduled';
  progress: number;
  size: number;
  started_at: string;
  completed_at?: string;
  destination: string;
  retention_days: number;
}

interface MaintenanceTask {
  id: string;
  name: string;
  category: 'database' | 'system' | 'security' | 'cleanup';
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  scheduled_at: string;
  estimated_duration: number;
  affects_service: boolean;
  auto_execute: boolean;
}

interface SystemCommand {
  id: string;
  name: string;
  description: string;
  category: 'database' | 'cache' | 'logs' | 'services';
  command: string;
  requires_confirmation: boolean;
  danger_level: 'low' | 'medium' | 'high' | 'critical';
  last_executed?: string;
  execution_time?: number;
}

interface SecurityAction {
  id: string;
  type: 'block_ip' | 'unlock_user' | 'reset_password' | 'revoke_token' | 'ban_tenant';
  target: string;
  reason: string;
  status: 'active' | 'expired' | 'revoked';
  created_at: string;
  expires_at?: string;
  created_by: string;
}

interface StorageStats {
  total_space: number;
  used_space: number;
  available_space: number;
  databases: {
    name: string;
    size: number;
    growth_rate: number;
  }[];
  files: {
    type: string;
    size: number;
    count: number;
  }[];
}

// ====================================================================
// DADOS MOCK PARA DEMONSTRAÇÃO
// ====================================================================

const mockBackupJobs: BackupJob[] = [
  {
    id: '1',
    name: 'Backup Completo Diário',
    type: 'full',
    status: 'running',
    progress: 67,
    size: 15.2,
    started_at: '2024-01-08T02:00:00Z',
    destination: 'AWS S3 - Backup Bucket',
    retention_days: 30
  },
  {
    id: '2',
    name: 'Backup Incremental',
    type: 'incremental',
    status: 'completed',
    progress: 100,
    size: 2.8,
    started_at: '2024-01-08T06:00:00Z',
    completed_at: '2024-01-08T06:15:00Z',
    destination: 'Local Storage - /backups',
    retention_days: 7
  },
  {
    id: '3',
    name: 'Backup de Logs',
    type: 'differential',
    status: 'scheduled',
    progress: 0,
    size: 0,
    started_at: '2024-01-08T18:00:00Z',
    destination: 'External FTP',
    retention_days: 14
  }
];

const mockMaintenanceTasks: MaintenanceTask[] = [
  {
    id: '1',
    name: 'Otimização do Banco de Dados',
    category: 'database',
    description: 'Reindexação e otimização de tabelas principais',
    status: 'pending',
    scheduled_at: '2024-01-09T02:00:00Z',
    estimated_duration: 45,
    affects_service: true,
    auto_execute: true
  },
  {
    id: '2',
    name: 'Limpeza de Logs Antigos',
    category: 'cleanup',
    description: 'Remoção de logs com mais de 90 dias',
    status: 'completed',
    scheduled_at: '2024-01-08T01:00:00Z',
    estimated_duration: 15,
    affects_service: false,
    auto_execute: true
  },
  {
    id: '3',
    name: 'Atualização de Certificados SSL',
    category: 'security',
    description: 'Renovação automática de certificados',
    status: 'running',
    scheduled_at: '2024-01-08T12:00:00Z',
    estimated_duration: 30,
    affects_service: false,
    auto_execute: false
  }
];

const mockSystemCommands: SystemCommand[] = [
  {
    id: '1',
    name: 'Limpar Cache Redis',
    description: 'Remove todos os dados em cache do Redis',
    category: 'cache',
    command: 'redis-cli FLUSHALL',
    requires_confirmation: true,
    danger_level: 'medium',
    last_executed: '2024-01-07T14:30:00Z',
    execution_time: 2.5
  },
  {
    id: '2',
    name: 'Reindexar Banco Principal',
    description: 'Executa REINDEX em todas as tabelas',
    category: 'database',
    command: 'psql -c "REINDEX DATABASE digiurban"',
    requires_confirmation: true,
    danger_level: 'high',
    last_executed: '2024-01-05T03:00:00Z',
    execution_time: 245.7
  },
  {
    id: '3',
    name: 'Restart Serviço API',
    description: 'Reinicia o serviço principal da API',
    category: 'services',
    command: 'systemctl restart digiurban-api',
    requires_confirmation: true,
    danger_level: 'critical'
  },
  {
    id: '4',
    name: 'Exportar Logs de Erro',
    description: 'Gera arquivo com logs de erro das últimas 24h',
    category: 'logs',
    command: 'journalctl --since="24 hours ago" --grep="ERROR"',
    requires_confirmation: false,
    danger_level: 'low'
  }
];

const mockSecurityActions: SecurityAction[] = [
  {
    id: '1',
    type: 'block_ip',
    target: '192.168.1.100',
    reason: 'Múltiplas tentativas de login falhadas',
    status: 'active',
    created_at: '2024-01-08T10:30:00Z',
    expires_at: '2024-01-08T22:30:00Z',
    created_by: 'Sistema Automático'
  },
  {
    id: '2',
    type: 'unlock_user',
    target: 'joao.silva@prefeitura.gov.br',
    reason: 'Desbloqueio solicitado pelo admin',
    status: 'active',
    created_at: '2024-01-08T09:15:00Z',
    created_by: 'admin@digiurban.com'
  },
  {
    id: '3',
    type: 'reset_password',
    target: 'maria.santos@campinas.sp.gov.br',
    reason: 'Reset solicitado pelo usuário',
    status: 'expired',
    created_at: '2024-01-07T16:20:00Z',
    expires_at: '2024-01-08T16:20:00Z',
    created_by: 'Sistema Automático'
  }
];

const mockStorageStats: StorageStats = {
  total_space: 500,
  used_space: 245.7,
  available_space: 254.3,
  databases: [
    { name: 'digiurban_main', size: 89.5, growth_rate: 2.3 },
    { name: 'digiurban_logs', size: 45.2, growth_rate: 8.7 },
    { name: 'digiurban_backups', size: 78.9, growth_rate: -1.2 }
  ],
  files: [
    { type: 'Documentos', size: 23.4, count: 15420 },
    { type: 'Imagens', size: 8.7, count: 3240 },
    { type: 'Logs', size: 45.2, count: 89567 },
    { type: 'Outros', size: 12.1, count: 5670 }
  ]
};

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================

const OperationsManagement: React.FC = () => {
  const [backupJobs, setBackupJobs] = useState<BackupJob[]>(mockBackupJobs);
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>(mockMaintenanceTasks);
  const [systemCommands, setSystemCommands] = useState<SystemCommand[]>(mockSystemCommands);
  const [securityActions, setSecurityActions] = useState<SecurityAction[]>(mockSecurityActions);
  const [storageStats, setStorageStats] = useState<StorageStats>(mockStorageStats);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('backups');

  // ====================================================================
  // FUNÇÕES UTILITÁRIAS
  // ====================================================================

  const formatBytes = (bytes: number) => {
    return `${bytes.toFixed(1)} GB`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      running: { label: 'Executando', color: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Concluído', color: 'bg-green-100 text-green-800' },
      failed: { label: 'Falhado', color: 'bg-red-100 text-red-800' },
      scheduled: { label: 'Agendado', color: 'bg-yellow-100 text-yellow-800' },
      pending: { label: 'Pendente', color: 'bg-gray-100 text-gray-800' },
      active: { label: 'Ativo', color: 'bg-green-100 text-green-800' },
      expired: { label: 'Expirado', color: 'bg-gray-100 text-gray-800' },
      revoked: { label: 'Revogado', color: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getDangerBadge = (level: string) => {
    const dangerConfig = {
      low: { label: 'Baixo', color: 'bg-green-100 text-green-800' },
      medium: { label: 'Médio', color: 'bg-yellow-100 text-yellow-800' },
      high: { label: 'Alto', color: 'bg-orange-100 text-orange-800' },
      critical: { label: 'Crítico', color: 'bg-red-100 text-red-800' }
    };
    
    const config = dangerConfig[level as keyof typeof dangerConfig];
    return <Badge variant="outline" className={config.color}>{config.label}</Badge>;
  };

  const getCommandIcon = (category: string) => {
    switch (category) {
      case 'database': return <Database className="h-5 w-5 text-blue-600" />;
      case 'cache': return <RefreshCw className="h-5 w-5 text-green-600" />;
      case 'logs': return <FileText className="h-5 w-5 text-orange-600" />;
      case 'services': return <Settings className="h-5 w-5 text-purple-600" />;
      default: return <Terminal className="h-5 w-5 text-gray-600" />;
    }
  };

  const executeCommand = (command: SystemCommand) => {
    if (command.requires_confirmation) {
      if (window.confirm(`Tem certeza que deseja executar "${command.name}"?\n\nComando: ${command.command}\nNível de perigo: ${command.danger_level}`)) {
        // Simular execução
        console.log(`Executando: ${command.command}`);
      }
    } else {
      console.log(`Executando: ${command.command}`);
    }
  };

  // ====================================================================
  // RENDER PRINCIPAL
  // ====================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              ⚙️ Ferramentas Operacionais
            </h1>
            <p className="text-gray-600 text-lg mt-2">
              Administração e manutenção do sistema
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Bell className="h-4 w-4 mr-2" />
              Alertas
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Logs
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs de Navegação */}
      <div className="flex gap-2 mb-8">
        {[
          { id: 'backups', label: 'Backups', icon: <Archive className="h-4 w-4" /> },
          { id: 'maintenance', label: 'Manutenção', icon: <Settings className="h-4 w-4" /> },
          { id: 'commands', label: 'Comandos', icon: <Terminal className="h-4 w-4" /> },
          { id: 'security', label: 'Segurança', icon: <Shield className="h-4 w-4" /> },
          { id: 'storage', label: 'Armazenamento', icon: <HardDrive className="h-4 w-4" /> }
        ].map(tab => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "outline"}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2"
          >
            {tab.icon}
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Conteúdo das Tabs */}
      {activeTab === 'backups' && (
        <div className="space-y-6">
          
          {/* Status Geral de Backups */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">Último Backup</p>
                    <p className="text-2xl font-bold text-green-900">Hoje 06:15</p>
                    <p className="text-xs text-green-600">Incremental - 2.8 GB</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Backup Ativo</p>
                    <p className="text-2xl font-bold text-blue-900">67%</p>
                    <p className="text-xs text-blue-600">15.2 GB processados</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700">Total Armazenado</p>
                    <p className="text-2xl font-bold text-purple-900">245 GB</p>
                    <p className="text-xs text-purple-600">30 dias retenção</p>
                  </div>
                  <Cloud className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700">Próximo Backup</p>
                    <p className="text-2xl font-bold text-orange-900">18:00</p>
                    <p className="text-xs text-orange-600">Logs differential</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Jobs de Backup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Archive className="h-5 w-5" />
                Jobs de Backup
              </CardTitle>
              <CardDescription>
                Gestão e monitoramento de backups automáticos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {backupJobs.map((job) => (
                  <Card key={job.id} className="bg-gradient-to-r from-white to-gray-50/50 hover:shadow-md transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-blue-100 rounded-lg">
                            <Archive className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{job.name}</h3>
                            <p className="text-sm text-gray-600">Tipo: {job.type} • Destino: {job.destination}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(job.status)}
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {job.status === 'running' && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progresso</span>
                            <span>{job.progress}% ({formatBytes(job.size)})</span>
                          </div>
                          <Progress value={job.progress} className="h-2" />
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-gray-600 mt-3">
                        <span>Iniciado: {new Date(job.started_at).toLocaleString('pt-BR')}</span>
                        <span>Retenção: {job.retention_days} dias</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'maintenance' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Tarefas de Manutenção
            </CardTitle>
            <CardDescription>
              Manutenção programada e otimização do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {maintenanceTasks.map((task) => (
                <Card key={task.id} className="bg-gradient-to-r from-white to-gray-50/50 hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${
                          task.category === 'database' ? 'bg-blue-100' :
                          task.category === 'security' ? 'bg-red-100' :
                          task.category === 'cleanup' ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          {task.category === 'database' ? <Database className="h-6 w-6 text-blue-600" /> :
                           task.category === 'security' ? <Shield className="h-6 w-6 text-red-600" /> :
                           task.category === 'cleanup' ? <Trash2 className="h-6 w-6 text-green-600" /> :
                           <Settings className="h-6 w-6 text-gray-600" />}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{task.name}</h3>
                          <p className="text-sm text-gray-600">{task.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                            <span>Agendado: {new Date(task.scheduled_at).toLocaleString('pt-BR')}</span>
                            <span>Duração: {formatDuration(task.estimated_duration)}</span>
                            {task.affects_service && <span className="text-orange-600">Afeta serviço</span>}
                            {task.auto_execute && <span className="text-blue-600">Auto-executar</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(task.status)}
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {task.status === 'pending' && (
                            <Button size="sm" variant="outline" className="text-green-600">
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'commands' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Comandos do Sistema
            </CardTitle>
            <CardDescription>
              Execução de comandos administrativos e manutenção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {systemCommands.map((command) => (
                <Card key={command.id} className="bg-gradient-to-r from-white to-gray-50/50 hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gray-100 rounded-lg">
                        {getCommandIcon(command.category)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{command.name}</h3>
                          {getDangerBadge(command.danger_level)}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{command.description}</p>
                        <div className="bg-black/5 rounded p-2 mb-3">
                          <code className="text-xs font-mono">{command.command}</code>
                        </div>
                        {command.last_executed && (
                          <div className="text-xs text-gray-500 mb-3">
                            Último: {new Date(command.last_executed).toLocaleString('pt-BR')}
                            {command.execution_time && ` (${command.execution_time}s)`}
                          </div>
                        )}
                        <Button 
                          size="sm" 
                          onClick={() => executeCommand(command)}
                          className={command.danger_level === 'critical' ? 'bg-red-600 hover:bg-red-700' : ''}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Executar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'security' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Ações de Segurança
            </CardTitle>
            <CardDescription>
              Bloqueios, desbloqueios e ações de segurança ativas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {securityActions.map((action) => (
                <Card key={action.id} className="bg-gradient-to-r from-white to-gray-50/50 hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-100 rounded-lg">
                          {action.type === 'block_ip' ? <Lock className="h-6 w-6 text-red-600" /> :
                           action.type === 'unlock_user' ? <Unlock className="h-6 w-6 text-green-600" /> :
                           action.type === 'reset_password' ? <Key className="h-6 w-6 text-blue-600" /> :
                           <Shield className="h-6 w-6 text-orange-600" />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg capitalize">
                            {action.type.replace('_', ' ')}
                          </h3>
                          <p className="text-sm text-gray-600">Alvo: {action.target}</p>
                          <p className="text-xs text-gray-500">Razão: {action.reason}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(action.status)}
                        <div className="text-xs text-gray-500 mt-2">
                          <p>Por: {action.created_by}</p>
                          <p>{new Date(action.created_at).toLocaleString('pt-BR')}</p>
                          {action.expires_at && (
                            <p>Expira: {new Date(action.expires_at).toLocaleString('pt-BR')}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'storage' && (
        <div className="space-y-6">
          {/* Estatísticas de Armazenamento */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Espaço Total</p>
                    <p className="text-3xl font-bold text-blue-900">{formatBytes(storageStats.total_space)}</p>
                    <p className="text-xs text-blue-600">Capacidade total</p>
                  </div>
                  <HardDrive className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">Espaço Usado</p>
                    <p className="text-3xl font-bold text-green-900">{formatBytes(storageStats.used_space)}</p>
                    <p className="text-xs text-green-600">{((storageStats.used_space / storageStats.total_space) * 100).toFixed(1)}% do total</p>
                  </div>
                  <Activity className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700">Disponível</p>
                    <p className="text-3xl font-bold text-purple-900">{formatBytes(storageStats.available_space)}</p>
                    <p className="text-xs text-purple-600">Espaço livre</p>
                  </div>
                  <Cloud className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progresso de Uso */}
          <Card>
            <CardHeader>
              <CardTitle>Uso de Armazenamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Utilização geral</span>
                  <span className="font-medium">{formatBytes(storageStats.used_space)} / {formatBytes(storageStats.total_space)}</span>
                </div>
                <Progress value={(storageStats.used_space / storageStats.total_space) * 100} className="h-3" />
              </div>
            </CardContent>
          </Card>

          {/* Detalhamento por Categoria */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Bancos de Dados */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Bancos de Dados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {storageStats.databases.map((db, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{db.name}</span>
                        <div className="text-right">
                          <span className="font-semibold">{formatBytes(db.size)}</span>
                          <span className={`text-xs ml-2 ${db.growth_rate > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {db.growth_rate > 0 ? '+' : ''}{db.growth_rate}%/mês
                          </span>
                        </div>
                      </div>
                      <Progress value={(db.size / storageStats.used_space) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Arquivos por Tipo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Arquivos por Tipo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {storageStats.files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg">
                      <div>
                        <p className="font-medium">{file.type}</p>
                        <p className="text-xs text-gray-500">{file.count.toLocaleString()} arquivos</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatBytes(file.size)}</p>
                        <p className="text-xs text-gray-500">
                          {((file.size / storageStats.used_space) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      )}

    </div>
  );
};

export default OperationsManagement;