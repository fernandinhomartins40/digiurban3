
import { FC, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { 
  Phone, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  MapPin, 
  Clock,
  User,
  FileText,
  Calendar
} from "lucide-react";
import { AtendimentoServicos } from "../types/servicos-publicos";

const ServicosPublicosAtendimentos: FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("todos");
  const [selectedService, setSelectedService] = useState<string>("todos");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Mock data
  const atendimentos: AtendimentoServicos[] = [
    {
      id: "1",
      protocolo: "SP-2024-001",
      cidadao: {
        nome: "João Silva",
        cpf: "123.456.789-00",
        telefone: "(11) 99999-9999",
        email: "joao@email.com"
      },
      tipoServico: "iluminacao",
      assunto: "Poste queimado",
      descricao: "Poste da rua está sem iluminação há 3 dias",
      localizacao: {
        endereco: "Rua das Flores, 123",
        coordenadas: { latitude: -23.5505, longitude: -46.6333 }
      },
      status: "em_analise",
      prioridade: "alta",
      dataAbertura: "2024-01-15",
      dataAtualizacao: "2024-01-16",
      responsavel: "Equipe Iluminação A",
      observacoes: "Aguardando peças",
      anexos: []
    },
    {
      id: "2",
      protocolo: "SP-2024-002",
      cidadao: {
        nome: "Maria Santos",
        cpf: "987.654.321-00",
        telefone: "(11) 88888-8888",
        email: "maria@email.com"
      },
      tipoServico: "limpeza",
      assunto: "Limpeza de terreno",
      descricao: "Terreno baldio com muito mato e lixo",
      localizacao: {
        endereco: "Av. Central, 456",
        coordenadas: { latitude: -23.5520, longitude: -46.6350 }
      },
      status: "agendado",
      prioridade: "media",
      dataAbertura: "2024-01-14",
      dataAtualizacao: "2024-01-16",
      responsavel: "Equipe Limpeza B",
      observacoes: "Agendado para próxima semana",
      anexos: []
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aberto": return "bg-blue-100 text-blue-800";
      case "em_analise": return "bg-yellow-100 text-yellow-800";
      case "agendado": return "bg-purple-100 text-purple-800";
      case "em_execucao": return "bg-orange-100 text-orange-800";
      case "concluido": return "bg-green-100 text-green-800";
      case "cancelado": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (prioridade: string) => {
    switch (prioridade) {
      case "baixa": return "bg-green-100 text-green-800";
      case "media": return "bg-yellow-100 text-yellow-800";
      case "alta": return "bg-orange-100 text-orange-800";
      case "urgente": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredAtendimentos = atendimentos.filter(atendimento => {
    const matchesSearch = atendimento.protocolo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         atendimento.cidadao.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         atendimento.assunto.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "todos" || atendimento.status === selectedStatus;
    const matchesService = selectedService === "todos" || atendimento.tipoServico === selectedService;
    return matchesSearch && matchesStatus && matchesService;
  });

  return (
    
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Phone className="mr-3 h-8 w-8" />
              Atendimentos - Serviços Públicos
            </h1>
            <p className="text-gray-600">Gerencie solicitações de serviços públicos</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Atendimento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Novo Atendimento</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome do Cidadão</Label>
                    <Input id="nome" placeholder="Nome completo" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input id="telefone" placeholder="(11) 99999-9999" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipoServico">Tipo de Serviço</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="iluminacao">Iluminação Pública</SelectItem>
                      <SelectItem value="limpeza">Limpeza Urbana</SelectItem>
                      <SelectItem value="coleta_especial">Coleta Especial</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assunto">Assunto</Label>
                  <Input id="assunto" placeholder="Breve descrição do problema" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea id="descricao" placeholder="Descreva detalhadamente o problema" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input id="endereco" placeholder="Endereço onde está o problema" />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={() => setIsDialogOpen(false)}>
                    Criar Atendimento
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <CardTitle>Filtros e Busca</CardTitle>
              <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por protocolo, nome ou assunto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full md:w-80"
                  />
                </div>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full md:w-48">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Status</SelectItem>
                    <SelectItem value="aberto">Aberto</SelectItem>
                    <SelectItem value="em_analise">Em Análise</SelectItem>
                    <SelectItem value="agendado">Agendado</SelectItem>
                    <SelectItem value="em_execucao">Em Execução</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Tipo de Serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Serviços</SelectItem>
                    <SelectItem value="iluminacao">Iluminação</SelectItem>
                    <SelectItem value="limpeza">Limpeza</SelectItem>
                    <SelectItem value="coleta_especial">Coleta Especial</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="lista" className="space-y-4">
          <TabsList>
            <TabsTrigger value="lista">Lista de Atendimentos</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="mapa">Mapa</TabsTrigger>
          </TabsList>

          <TabsContent value="lista">
            <div className="grid gap-4">
              {filteredAtendimentos.map((atendimento) => (
                <Card key={atendimento.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-semibold">{atendimento.protocolo}</h3>
                          <p className="text-sm text-gray-600">{atendimento.assunto}</p>
                        </div>
                        <Badge className={getStatusColor(atendimento.status)}>
                          {atendimento.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={getPriorityColor(atendimento.prioridade)}>
                          {atendimento.prioridade}
                        </Badge>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          Ver
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <User className="mr-2 h-4 w-4" />
                          {atendimento.cidadao.nome}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="mr-2 h-4 w-4" />
                          {atendimento.cidadao.telefone}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="mr-2 h-4 w-4" />
                          {atendimento.localizacao?.endereco || "Não informado"}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <FileText className="mr-2 h-4 w-4" />
                          {atendimento.tipoServico}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="mr-2 h-4 w-4" />
                          {new Date(atendimento.dataAbertura).toLocaleDateString()}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="mr-2 h-4 w-4" />
                          Atualizado: {new Date(atendimento.dataAtualizacao).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-600">Responsável</p>
                        <p className="text-sm">{atendimento.responsavel || "Não atribuído"}</p>
                      </div>
                    </div>
                    {atendimento.observacoes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-700">{atendimento.observacoes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total de Atendimentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">156</p>
                  <p className="text-xs text-gray-600">+12% em relação ao mês anterior</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">23</p>
                  <p className="text-xs text-gray-600">8 agendados para hoje</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">128</p>
                  <p className="text-xs text-gray-600">82% de taxa de resolução</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">3.2 dias</p>
                  <p className="text-xs text-gray-600">Para resolução</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="mapa">
            <Card className="h-[600px]">
              <CardContent className="h-full flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <MapPin className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Mapa de Atendimentos</h3>
                  <p className="text-gray-600">
                    Visualização geográfica dos atendimentos de serviços públicos
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    
  );
};

export default ServicosPublicosAtendimentos;
