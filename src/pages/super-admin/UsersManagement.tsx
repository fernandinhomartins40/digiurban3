import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Edit2,
  Trash2,
  Shield,
  KeyRound,
  Building2,
  Mail,
  Phone,
  Calendar,
  UserCheck,
  UserX,
  AlertTriangle,
  Save,
  X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { supabase } from '../../lib/supabase';
import { supabaseAdmin, createUserAdmin, createUserProfileAdmin, logSystemActivity } from '../../lib/supabaseAdmin';
import { toast } from '../../hooks/use-toast';

// Interfaces
interface User {
  id: string;
  nome_completo: string;
  email: string;
  telefone?: string;
  tipo_usuario: 'admin' | 'operador' | 'fiscal';
  status: 'ativo' | 'inativo' | 'suspenso';
  tenant_id: string;
  prefeitura_nome?: string;
  created_at: string;
  last_sign_in_at?: string;
  is_active: boolean;
}

interface Prefeitura {
  id: string;
  nome: string;
  status: string;
}

interface UserFormData {
  nome_completo: string;
  email: string;
  telefone: string;
  tipo_usuario: 'admin' | 'operador' | 'fiscal';
  prefeitura_id: string;
  senha?: string;
  confirmar_senha?: string;
}

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [prefeituras, setPrefeituras] = useState<Prefeitura[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPrefeitura, setFilterPrefeitura] = useState('all');
  const [filterTipo, setFilterTipo] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Estados dos modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  
  // Estado do formulário
  const [formData, setFormData] = useState<UserFormData>({
    nome_completo: '',
    email: '',
    telefone: '',
    tipo_usuario: 'operador',
    prefeitura_id: '',
    senha: '',
    confirmar_senha: ''
  });
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUsers(),
        loadPrefeituras()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados iniciais",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      console.log('👥 Carregando usuários com Admin Client...');
      
      // Usar supabaseAdmin para garantir acesso completo
      const { data, error } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar user_profiles:', error);
        throw error;
      }

      console.log(`📊 ${data?.length || 0} usuários carregados do banco`);

      // Buscar informações dos tenants separadamente
      const { data: tenantsData, error: tenantsError } = await supabaseAdmin
        .from('tenants')
        .select('id, nome');

      if (tenantsError) {
        console.warn('⚠️ Erro ao buscar tenants para usuarios:', tenantsError);
      }

      // Mapear usuários com informações dos tenants
      const formattedUsers = data?.map(user => {
        const tenant = tenantsData?.find(t => t.id === user.tenant_id);
        
        return {
          id: user.id,
          nome_completo: user.nome_completo || 'Nome não informado',
          email: user.email,
          telefone: user.telefone,
          tipo_usuario: user.tipo_usuario || 'operador',
          status: user.status || 'ativo',
          tenant_id: user.tenant_id,
          prefeitura_nome: tenant?.nome || 'Tenant não encontrado',
          created_at: user.created_at,
          last_sign_in_at: user.ultima_atividade,
          is_active: user.ativo !== false
        };
      }) || [];

      console.log('✅ Usuários formatados:', formattedUsers.length);
      setUsers(formattedUsers);
    } catch (error) {
      console.error('❌ Erro ao carregar usuários:', error);
      throw error;
    }
  };

  const loadPrefeituras = async () => {
    try {
      console.log('🏢 [DEBUG] Carregando tenants com Admin Client...');
      
      // 1. QUERY DE DIAGNÓSTICO PRIMEIRO
      const { data: allData, error: debugError } = await supabaseAdmin
        .from('tenants')
        .select('id, nome, status, ativo, created_at')
        .order('nome');
      
      console.log('🔍 [DEBUG] Todos os tenants na base:', allData?.length || 0);
      console.log('📊 [DEBUG] Status encontrados:', 
        [...new Set(allData?.map(t => t.status) || [])]);
      console.log('✅ [DEBUG] Tenants ativos:', 
        allData?.filter(t => t.ativo !== false).length || 0);
      
      // 2. QUERY CORRIGIDA - Primeiro tenta com filtros rigorosos
      let { data, error } = await supabaseAdmin
        .from('tenants')
        .select('id, nome, status, ativo')
        .in('status', ['ativo', 'trial']) // ✅ CORRETO: apenas valores do enum
        .neq('ativo', false) // ✅ Incluir apenas ativos
        .not('nome', 'is', null) // ✅ Excluir nomes nulos
        .order('nome');

      // 3. FALLBACK: Se não encontrar nenhum, relaxa os filtros
      if (!error && (!data || data.length === 0)) {
        console.log('🔄 [FALLBACK] Nenhum tenant encontrado, tentando query mais flexível...');
        
        const { data: fallbackData, error: fallbackError } = await supabaseAdmin
          .from('tenants')
          .select('id, nome, status, ativo')
          .not('nome', 'is', null) // Apenas garantir que tem nome
          .order('nome');
        
        data = fallbackData;
        error = fallbackError;
        
        console.log('🔄 [FALLBACK] Resultado da query flexível:', { count: data?.length, error });
      }

      console.log('📊 Tenants após filtro correto:', { count: data?.length, error });

      if (error) {
        console.error('❌ Erro na consulta de tenants:', error);
        throw error;
      }

      console.log('🎯 [DEBUG] Tenants filtrados:', data?.length || 0);
      
      const formattedTenants = data?.map(tenant => ({
        id: tenant.id,
        nome: tenant.nome,
        status: tenant.status
      })) || [];

      console.log('✅ Tenants carregados para seleção:', formattedTenants.length);
      setPrefeituras(formattedTenants);
      
      // 3. ALERTA MELHORADO SE VAZIO
      if (formattedTenants.length === 0) {
        console.warn('⚠️ Nenhum tenant encontrado após filtros');
        toast({
          title: "Aviso",
          description: `Encontrados ${allData?.length || 0} tenants na base, mas nenhum com status ativo/trial. Verifique status dos tenants.`,
          variant: "destructive"
        });
      } else {
        console.log('🎉 Tenants disponíveis para vinculação:', formattedTenants.map(t => t.nome));
      }
    } catch (error) {
      console.error('💥 Erro ao carregar prefeituras:', error);
      throw error;
    }
  };

  // Funções CRUD
  const handleCreateUser = async () => {
    console.log('👤 Criando usuário para tenant existente (MODO SIMPLIFICADO)...', formData);
    console.log('⚠️ Usando criação direta no banco devido aos problemas do Supabase Auth');
    
    if (!validateForm()) {
      console.log('❌ Validação do formulário falhou');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Gerar ID único para o usuário
      const userId = crypto.randomUUID();
      console.log('🆔 ID gerado para usuário:', userId);

      // 2. Buscar informações do tenant selecionado
      const selectedTenant = prefeituras.find(t => t.id === formData.prefeitura_id);
      if (!selectedTenant) {
        throw new Error('Tenant não encontrado');
      }

      console.log('🏢 Criando usuário para tenant:', selectedTenant.nome);

      // 3. Criar perfil diretamente na tabela user_profiles (usando Admin Client)
      const userData = {
        id: userId,
        nome_completo: formData.nome_completo,
        email: formData.email,
        telefone: formData.telefone || null,
        tipo_usuario: formData.tipo_usuario,
        tenant_id: formData.prefeitura_id,
        status: 'pendente_ativacao', // Status especial
        ativo: true,
        metadata: {
          created_by: 'super_admin_user_management',
          tenant_name: selectedTenant.nome,
          temporary_password: formData.senha, // Salvar temporariamente
          auth_creation_pending: true, // Flag para indicar que auth ainda não foi criado
          created_at: new Date().toISOString(),
          creation_mode: 'simplified'
        },
        created_at: new Date().toISOString()
      };

      console.log('📋 Dados do usuário:', userData);

      const { data: profileData, error: profileError } = await createUserProfileAdmin(userData);

      if (profileError) {
        console.error('❌ Erro ao criar perfil:', profileError);
        throw new Error(`Erro ao criar usuário: ${profileError.message}`);
      }

      console.log('✅ Usuário criado no banco:', profileData);

      // 4. Registrar atividade
      await logSystemActivity({
        user_id: userId,
        tenant_id: formData.prefeitura_id,
        acao: 'Usuário criado via Gestão de Usuários',
        detalhes: `Usuário ${formData.nome_completo} (${formData.email}) criado para ${selectedTenant.nome}. Modo simplificado - Auth pendente.`,
        categoria: 'usuarios',
        metadata: {
          tenant_id: formData.prefeitura_id,
          tenant_name: selectedTenant.nome,
          user_email: formData.email,
          user_type: formData.tipo_usuario,
          created_by: 'super_admin',
          creation_mode: 'simplified'
        }
      });

      console.log('🎉 Usuário criado com sucesso no modo simplificado!');
      
      toast({
        title: "Sucesso!",
        description: `Usuário ${formData.nome_completo} criado para ${selectedTenant.nome}. Auth será configurado posteriormente.`
      });

      setIsCreateModalOpen(false);
      resetForm();
      loadUsers();
    } catch (error) {
      console.error('💥 Erro ao criar usuário:', error);
      toast({
        title: "Erro",
        description: `Falha ao criar usuário: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser || !validateForm(true)) return;

    setIsSubmitting(true);
    try {
      console.log('✏️ Atualizando usuário:', selectedUser.id);

      const { error } = await supabaseAdmin
        .from('user_profiles')
        .update({
          nome_completo: formData.nome_completo,
          telefone: formData.telefone,
          tipo_usuario: formData.tipo_usuario,
          tenant_id: formData.prefeitura_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      // Registrar atividade
      await logSystemActivity({
        user_id: selectedUser.id,
        tenant_id: formData.prefeitura_id,
        acao: 'Usuário editado via Gestão de Usuários',
        detalhes: `Dados do usuário ${formData.nome_completo} foram atualizados.`,
        categoria: 'usuarios',
        metadata: {
          previous_tenant: selectedUser.tenant_id,
          new_tenant: formData.prefeitura_id,
          updated_by: 'super_admin'
        }
      });

      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso!"
      });

      setIsEditModalOpen(false);
      resetForm();
      loadUsers();
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar usuário",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      console.log('🗑️ Desativando usuário:', selectedUser.id);

      // Desativar usuário em vez de deletar
      const { error } = await supabaseAdmin
        .from('user_profiles')
        .update({ 
          status: 'inativo',
          ativo: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      // Registrar atividade
      await logSystemActivity({
        user_id: selectedUser.id,
        tenant_id: selectedUser.tenant_id,
        acao: 'Usuário desativado via Gestão de Usuários',
        detalhes: `Usuário ${selectedUser.nome_completo} (${selectedUser.email}) foi desativado.`,
        categoria: 'usuarios',
        metadata: {
          previous_status: selectedUser.status,
          deactivated_by: 'super_admin'
        }
      });

      toast({
        title: "Sucesso",
        description: "Usuário desativado com sucesso!"
      });

      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error('Erro ao desativar usuário:', error);
      toast({
        title: "Erro",
        description: "Falha ao desativar usuário",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(selectedUser.email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Email de reset de senha enviado!"
      });

      setIsResetPasswordModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      toast({
        title: "Erro",
        description: "Falha ao enviar reset de senha",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Funções auxiliares
  const validateForm = (isEdit = false) => {
    if (!formData.nome_completo || !formData.email || !formData.prefeitura_id) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return false;
    }

    if (!isEdit && (!formData.senha || formData.senha !== formData.confirmar_senha)) {
      toast({
        title: "Erro",
        description: "Senhas não conferem",
        variant: "destructive"
      });
      return false;
    }

    if (!isEdit && formData.senha && formData.senha.length < 6) {
      toast({
        title: "Erro",
        description: "Senha deve ter pelo menos 6 caracteres",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const resetForm = () => {
    setFormData({
      nome_completo: '',
      email: '',
      telefone: '',
      tipo_usuario: 'operador',
      prefeitura_id: '',
      senha: '',
      confirmar_senha: ''
    });
    setSelectedUser(null);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      nome_completo: user.nome_completo,
      email: user.email,
      telefone: user.telefone || '',
      tipo_usuario: user.tipo_usuario,
      prefeitura_id: user.tenant_id,
      senha: '',
      confirmar_senha: ''
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const openResetPasswordModal = (user: User) => {
    setSelectedUser(user);
    setIsResetPasswordModalOpen(true);
  };

  // Filtrar usuários
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrefeitura = filterPrefeitura === 'all' || user.tenant_id === filterPrefeitura;
    const matchesTipo = filterTipo === 'all' || user.tipo_usuario === filterTipo;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;

    return matchesSearch && matchesPrefeitura && matchesTipo && matchesStatus;
  });

  const getUserStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive || status === 'inativo') {
      return <Badge variant="secondary" className="bg-gray-100 text-gray-600">Inativo</Badge>;
    }
    if (status === 'suspenso') {
      return <Badge variant="destructive">Suspenso</Badge>;
    }
    return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Ativo</Badge>;
  };

  const getTipoUsuarioBadge = (tipo: string) => {
    const variants = {
      admin: { variant: 'destructive' as const, label: 'Administrador' },
      operador: { variant: 'default' as const, label: 'Operador' },
      fiscal: { variant: 'secondary' as const, label: 'Fiscal' }
    };
    
    const config = variants[tipo as keyof typeof variants] || variants.operador;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">
                <span className="mr-2">👥</span>
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Gestão de Usuários
                </span>
              </h1>
              <p className="text-gray-600">
                Gerenciar usuários vinculados às prefeituras ativas
              </p>
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2 text-white" />
              Novo Usuário
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros e Busca */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <Label>Buscar</Label>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    placeholder="Nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label>Prefeitura</Label>
                <Select value={filterPrefeitura} onValueChange={setFilterPrefeitura}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {prefeituras.map(pref => (
                      <SelectItem key={pref.id} value={pref.id}>{pref.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tipo</Label>
                <Select value={filterTipo} onValueChange={setFilterTipo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="operador">Operador</SelectItem>
                    <SelectItem value="fiscal">Fiscal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="suspenso">Suspenso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Usuários */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Usuários ({filteredUsers.length})
            </CardTitle>
            <CardDescription>
              Lista completa de usuários do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg border border-gray-200/50 hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.nome_completo.charAt(0).toUpperCase()}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">{user.nome_completo}</h3>
                        {getTipoUsuarioBadge(user.tipo_usuario)}
                        {getUserStatusBadge(user.status, user.is_active)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-gray-500" />
                          {user.email}
                        </div>
                        {user.telefone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-gray-500" />
                            {user.telefone}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-gray-500" />
                          {user.prefeitura_nome}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        Criado em {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        {user.last_sign_in_at && (
                          <>
                            • Último acesso: {new Date(user.last_sign_in_at).toLocaleDateString('pt-BR')}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4 text-gray-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditModal(user)}>
                        <Edit2 className="h-4 w-4 mr-2 text-blue-600" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openResetPasswordModal(user)}>
                        <KeyRound className="h-4 w-4 mr-2 text-orange-600" />
                        Reset Senha
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => openDeleteModal(user)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Desativar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}

              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <UserX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum usuário encontrado</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Modal Criar Usuário */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
              <DialogDescription>
                Preencha os dados do novo usuário. Um email de confirmação será enviado.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div>
                <Label htmlFor="nome_completo">Nome Completo *</Label>
                <Input
                  id="nome_completo"
                  value={formData.nome_completo}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome_completo: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="tipo_usuario">Tipo de Usuário *</Label>
                <Select value={formData.tipo_usuario} onValueChange={(value: any) => setFormData(prev => ({ ...prev, tipo_usuario: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operador">Operador</SelectItem>
                    <SelectItem value="fiscal">Fiscal</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="prefeitura_id">Prefeitura * ({prefeituras.length} disponível{prefeituras.length !== 1 ? 'eis' : ''})</Label>
                <Select value={formData.prefeitura_id} onValueChange={(value) => {
                  const selectedTenant = prefeituras.find(p => p.id === value);
                  console.log('🏢 Prefeitura selecionada:', { id: value, nome: selectedTenant?.nome });
                  setFormData(prev => ({ ...prev, prefeitura_id: value }));
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={
                      prefeituras.length === 0 
                        ? "⏳ Carregando prefeituras..." 
                        : "Selecione uma prefeitura"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {prefeituras.length === 0 ? (
                      <SelectItem value="loading" disabled>
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
                          Carregando...
                        </div>
                      </SelectItem>
                    ) : (
                      prefeituras.map(pref => (
                        <SelectItem key={pref.id} value={pref.id}>
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600">🏢</span>
                            <span>{pref.nome}</span>
                            <span className="text-xs text-gray-500">({pref.status})</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {loading && (
                  <p className="text-sm text-blue-600 mt-1">🔄 Carregando prefeituras...</p>
                )}
                {!loading && prefeituras.length === 0 && (
                  <p className="text-sm text-red-600 mt-1">❌ Nenhuma prefeitura encontrada - verifique logs do console</p>
                )}
                {!loading && prefeituras.length > 0 && (
                  <p className="text-sm text-green-600 mt-1">✅ {prefeituras.length} prefeitura{prefeituras.length !== 1 ? 's' : ''} carregada{prefeituras.length !== 1 ? 's' : ''} com sucesso</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="senha">Senha *</Label>
                <Input
                  id="senha"
                  type="password"
                  value={formData.senha}
                  onChange={(e) => setFormData(prev => ({ ...prev, senha: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="confirmar_senha">Confirmar Senha *</Label>
                <Input
                  id="confirmar_senha"
                  type="password"
                  value={formData.confirmar_senha}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmar_senha: e.target.value }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateUser} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Criando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2 text-white" />
                    Criar Usuário
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Editar Usuário */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>
                Atualize os dados do usuário. O email não pode ser alterado.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div>
                <Label htmlFor="edit_nome_completo">Nome Completo *</Label>
                <Input
                  id="edit_nome_completo"
                  value={formData.nome_completo}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome_completo: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="edit_email">Email</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              
              <div>
                <Label htmlFor="edit_telefone">Telefone</Label>
                <Input
                  id="edit_telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="edit_tipo_usuario">Tipo de Usuário *</Label>
                <Select value={formData.tipo_usuario} onValueChange={(value: any) => setFormData(prev => ({ ...prev, tipo_usuario: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operador">Operador</SelectItem>
                    <SelectItem value="fiscal">Fiscal</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="edit_prefeitura_id">Prefeitura * ({prefeituras.length} disponível{prefeituras.length !== 1 ? 'eis' : ''})</Label>
                <Select value={formData.prefeitura_id} onValueChange={(value) => {
                  const selectedTenant = prefeituras.find(p => p.id === value);
                  console.log('🏢 [EDIT] Prefeitura selecionada:', { id: value, nome: selectedTenant?.nome });
                  setFormData(prev => ({ ...prev, prefeitura_id: value }));
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={
                      prefeituras.length === 0 
                        ? "Nenhuma prefeitura disponível" 
                        : "Selecione uma prefeitura"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {prefeituras.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        <div className="flex items-center gap-2 text-gray-500">
                          <span>⚠️</span>
                          <span>Nenhuma prefeitura disponível</span>
                        </div>
                      </SelectItem>
                    ) : (
                      prefeituras.map(pref => (
                        <SelectItem key={pref.id} value={pref.id}>
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600">🏢</span>
                            <span>{pref.nome}</span>
                            <span className="text-xs text-gray-500">({pref.status})</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {prefeituras.length === 0 && (
                  <p className="text-sm text-red-600 mt-1">❌ Nenhuma prefeitura encontrada - verifique logs do console</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEditUser} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2 text-white" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Confirmar Desativação */}
        <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Desativar Usuário
              </AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja desativar o usuário <strong>{selectedUser?.nome_completo}</strong>? 
                Esta ação pode ser revertida posteriormente alterando o status do usuário.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteUser} 
                className="bg-red-600 hover:bg-red-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Desativando...
                  </>
                ) : (
                  'Desativar'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Modal Reset Senha */}
        <AlertDialog open={isResetPasswordModalOpen} onOpenChange={setIsResetPasswordModalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-blue-500" />
                Reset de Senha
              </AlertDialogTitle>
              <AlertDialogDescription>
                Será enviado um email para <strong>{selectedUser?.email}</strong> com instruções 
                para redefinir a senha. O usuário precisará acessar o email para criar uma nova senha.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleResetPassword}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  'Enviar Reset'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </div>
  );
};

export default UsersManagement;