import { useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2,
  Phone,
  Mail,
  Clock,
  User,
  AlertCircle
} from 'lucide-react';
import { AtendimentoTuristico } from '../types/turismo';

const TurismoAtendimentos = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AtendimentoTuristico | null>(null);

  // Mock data
  const [atendimentos] = useState<AtendimentoTuristico[]>([
    {
      id: '1',
      cidadao: 'Maria Silva Santos',
      cpf: '123.456.789-00',
      telefone: '(11) 99999-9999',
      email: 'maria@email.com',
      tipoAtendimento: 'Informações',
      assunto: 'Pontos turísticos da cidade',
      descricao: 'Gostaria de saber quais são os principais pontos turísticos da cidade e horários de funcionamento.',
      status: 'Pendente',
      prioridade: 'Média',
      data: '2024-01-15',
      responsavel: 'João Costa',
      observacoes: 'Turista de São Paulo interessada em roteiro de 2 dias'
    },
    {
      id: '2',
      cidadao: 'Carlos Eduardo Lima',
      cpf: '987.654.321-00',
      telefone: '(11) 88888-8888',
      email: 'carlos@email.com',
      tipoAtendimento: 'Reclamação',
      assunto: 'Falta de sinalização turística',
      descricao: 'A sinalização para chegar ao mirante está inadequada, causando dificuldades aos turistas.',
      status: 'Em Andamento',
      prioridade: 'Alta',
      data: '2024-01-14',
      responsavel: 'Ana Paula',
      observacoes: 'Verificar com equipe de infraestrutura'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendente': return 'bg-yellow-100 text-yellow-800';
      case 'Em Andamento': return 'bg-blue-100 text-blue-800';
      case 'Resolvido': return 'bg-green-100 text-green-800';
      case 'Cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (prioridade: string) => {
    switch (prioridade) {
      case 'Baixa': return 'bg-green-100 text-green-800';
      case 'Média': return 'bg-yellow-100 text-yellow-800';
      case 'Alta': return 'bg-orange-100 text-orange-800';
      case 'Urgente': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAtendimentos = atendimentos.filter(atendimento => 
    (atendimento.cidadao.toLowerCase().includes(searchTerm.toLowerCase()) ||
     atendimento.assunto.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (statusFilter === 'all' || atendimento.status === statusFilter)
  );

  const AtendimentoForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cidadao">Nome do Cidadão</Label>
          <Input id="cidadao" placeholder="Nome completo" />
        </div>
        <div>
          <Label htmlFor="cpf">CPF</Label>
          <Input id="cpf" placeholder="000.000.000-00" />
        </div>
        <div>
          <Label htmlFor="telefone">Telefone</Label>
          <Input id="telefone" placeholder="(00) 00000-0000" />
        </div>
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" placeholder="email@exemplo.com" />
        </div>
        <div>
          <Label htmlFor="tipo">Tipo de Atendimento</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Informações">Informações</SelectItem>
              <SelectItem value="Reclamação">Reclamação</SelectItem>
              <SelectItem value="Sugestão">Sugestão</SelectItem>
              <SelectItem value="Agendamento">Agendamento</SelectItem>
              <SelectItem value="Outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="prioridade">Prioridade</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Baixa">Baixa</SelectItem>
              <SelectItem value="Média">Média</SelectItem>
              <SelectItem value="Alta">Alta</SelectItem>
              <SelectItem value="Urgente">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="assunto">Assunto</Label>
        <Input id="assunto" placeholder="Assunto do atendimento" />
      </div>
      <div>
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea id="descricao" placeholder="Descreva detalhadamente a solicitação" rows={4} />
      </div>
      <div>
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea id="observacoes" placeholder="Observações adicionais" rows={3} />
      </div>
    </div>
  );

  return (
    
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Atendimentos Turísticos</h1>
            <p className="text-gray-600 mt-2">Gerencie atendimentos e solicitações relacionadas ao turismo</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus size={16} />
                Novo Atendimento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Editar Atendimento' : 'Novo Atendimento'}
                </DialogTitle>
              </DialogHeader>
              <AtendimentoForm />
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setIsDialogOpen(false)}>
                  {editingItem ? 'Atualizar' : 'Cadastrar'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <CardTitle>Lista de Atendimentos</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter size={16} className="mr-2" />
                  Filtros
                </Button>
                <Button variant="outline" size="sm">
                  <Download size={16} className="mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Buscar por nome ou assunto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                  <SelectItem value="Resolvido">Resolvido</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4">
              {filteredAtendimentos.map((atendimento) => (
                <Card key={atendimento.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{atendimento.assunto}</h3>
                              <Badge className={getStatusColor(atendimento.status)}>
                                {atendimento.status}
                              </Badge>
                              <Badge className={getPriorityColor(atendimento.prioridade)}>
                                {atendimento.prioridade}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <User size={14} />
                                <span>{atendimento.cidadao}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone size={14} />
                                <span>{atendimento.telefone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail size={14} />
                                <span>{atendimento.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock size={14} />
                                <span>{new Date(atendimento.data).toLocaleDateString('pt-BR')}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <AlertCircle size={14} />
                                <span>{atendimento.tipoAtendimento}</span>
                              </div>
                            </div>
                            <p className="text-gray-700 mt-2 line-clamp-2">{atendimento.descricao}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button variant="outline" size="sm">
                          <Eye size={14} className="mr-1" />
                          Ver
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setEditingItem(atendimento);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit size={14} className="mr-1" />
                          Editar
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredAtendimentos.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Nenhum atendimento encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    
  );
};

export default TurismoAtendimentos;
