import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Filter, Shield, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import UserManagementService, { CreateUserData } from '../../services/userManagementService';

const UsersManagementPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tenants, setTenants] = useState<Array<{id: string, nome: string}>>([]);
  const [formData, setFormData] = useState<CreateUserData>({
    nome_completo: '',
    email: '',
    tipo_usuario: '',
    tenant_id: '',
    cargo: '',
    departamento: '',
    telefone: '',
    senha: ''
  });

  // Carregar tenants ao montar o componente
  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    const result = await UserManagementService.getTenants();
    
    if (result.success && result.data) {
      setTenants(result.data);
      toast.success(`${result.data.length} prefeituras carregadas`);
    } else {
      console.error('Erro ao carregar tenants:', result.error);
      toast.error(`Erro ao carregar prefeituras: ${result.error}`);
    }
  };

  // Mock data para demonstração
  const users = [
    {
      id: '1',
      nome: 'João Silva',
      email: 'joao.silva@saude.sp.gov.br',
      tipo: 'administrador',
      tenant: 'Prefeitura de São Paulo',
      departamento: 'Secretaria de Saúde',
      status: 'ativo',
      ultimoLogin: '2025-08-19 14:30',
      protocolosProcessados: 1247
    },
    {
      id: '2',
      nome: 'Maria Santos',
      email: 'maria.santos@educacao.rj.gov.br', 
      tipo: 'coordenador',
      tenant: 'Prefeitura do Rio de Janeiro',
      departamento: 'Secretaria de Educação',
      status: 'ativo',
      ultimoLogin: '2025-08-19 16:45',
      protocolosProcessados: 832
    },
    {
      id: '3',
      nome: 'Carlos Oliveira',
      email: 'carlos.oliveira@obras.cp.gov.br',
      tipo: 'operador', 
      tenant: 'Prefeitura de Campinas',
      departamento: 'Secretaria de Obras',
      status: 'suspenso',
      ultimoLogin: '2025-08-15 09:15',
      protocolosProcessados: 156
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-700 border-green-200';
      case 'suspenso': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'inativo': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'administrador': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'coordenador': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'operador': return 'bg-green-100 text-green-700 border-green-200';
      case 'cidadao': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleInputChange = (field: keyof CreateUserData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const result = await UserManagementService.createUser(formData);
    
    if (result.success) {
      toast.success('Usuário criado com sucesso!');
      setIsModalOpen(false);
      resetForm();
    } else {
      toast.error(result.error || 'Erro ao criar usuário');
    }
    
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setFormData({
      nome_completo: '',
      email: '',
      tipo_usuario: '',
      tenant_id: '',
      cargo: '',
      departamento: '',
      telefone: '',
      senha: ''
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Users className="h-8 w-8 text-purple-600" />
              Gestão de Usuários
            </h1>
            <p className="text-gray-600 mt-2">
              Administre usuários de todas as prefeituras
            </p>
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Preencha os dados abaixo para criar um novo usuário no sistema.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome_completo">Nome Completo</Label>
                    <Input
                      id="nome_completo"
                      value={formData.nome_completo}
                      onChange={(e) => handleInputChange('nome_completo', e.target.value)}
                      placeholder="Ex: João Silva"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Ex: joao.silva@prefeitura.gov.br"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo_usuario">Tipo de Usuário</Label>
                    <Select value={formData.tipo_usuario} onValueChange={(value) => handleInputChange('tipo_usuario', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="super_admin">Super Administrador</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="secretario">Secretário</SelectItem>
                        <SelectItem value="diretor">Diretor</SelectItem>
                        <SelectItem value="coordenador">Coordenador</SelectItem>
                        <SelectItem value="funcionario">Funcionário</SelectItem>
                        <SelectItem value="atendente">Atendente</SelectItem>
                        <SelectItem value="cidadao">Cidadão</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tenant_id">Prefeitura</Label>
                    <Select value={formData.tenant_id} onValueChange={(value) => handleInputChange('tenant_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a prefeitura" />
                      </SelectTrigger>
                      <SelectContent>
                        {tenants.map((tenant) => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cargo">Cargo</Label>
                    <Input
                      id="cargo"
                      value={formData.cargo}
                      onChange={(e) => handleInputChange('cargo', e.target.value)}
                      placeholder="Ex: Coordenador"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="departamento">Departamento</Label>
                    <Input
                      id="departamento"
                      value={formData.departamento}
                      onChange={(e) => handleInputChange('departamento', e.target.value)}
                      placeholder="Ex: Secretaria de Saúde"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => handleInputChange('telefone', e.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha">Senha Temporária</Label>
                  <Input
                    id="senha"
                    type="password"
                    value={formData.senha}
                    onChange={(e) => handleInputChange('senha', e.target.value)}
                    placeholder="Senha inicial do usuário (mínimo 6 caracteres)"
                    required
                    minLength={6}
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={isSubmitting}>
                    {isSubmitting ? 'Criando...' : 'Criar Usuário'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">1,526</p>
                <p className="text-sm text-gray-600">Total Usuários</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">1,423</p>
                <p className="text-sm text-gray-600">Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">67</p>
                <p className="text-sm text-gray-600">Suspensos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">342</p>
                <p className="text-sm text-gray-600">Online Agora</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filtros e Busca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, email ou departamento..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              <option value="">Todos os Tipos</option>
              <option value="administrador">Administrador</option>
              <option value="coordenador">Coordenador</option>
              <option value="operador">Operador</option>
              <option value="cidadao">Cidadão</option>
            </select>
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              <option value="">Todos os Status</option>
              <option value="ativo">Ativo</option>
              <option value="suspenso">Suspenso</option>
              <option value="inativo">Inativo</option>
            </select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Mais Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            Gerencie usuários de todas as prefeituras
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Usuário</th>
                  <th className="text-left py-3 px-4 font-medium">Tipo</th>
                  <th className="text-left py-3 px-4 font-medium">Prefeitura</th>
                  <th className="text-left py-3 px-4 font-medium">Departamento</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Último Login</th>
                  <th className="text-left py-3 px-4 font-medium">Protocolos</th>
                  <th className="text-left py-3 px-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-purple-600">
                            {user.nome.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{user.nome}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getTipoColor(user.tipo)}>
                        {user.tipo.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm">{user.tenant}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm">{user.departamento}</p>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getStatusColor(user.status)}>
                        {user.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm">{user.ultimoLogin}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm font-medium">{user.protocolosProcessados}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                        <Button variant="outline" size="sm">
                          Logs
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600">
              Mostrando 1-3 de 1,526 usuários
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Anterior
              </Button>
              <Button variant="outline" size="sm">1</Button>
              <Button variant="outline" size="sm">2</Button>
              <Button variant="outline" size="sm">3</Button>
              <Button variant="outline" size="sm">
                Próximo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersManagementPage;