
import { FC, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Calendar, Search, Plus, Eye, MapPin, Clock, User, FileText } from "lucide-react";
import { AtendimentoUrbano } from "../types/planejamento-urbano";

const PlanejamentoUrbanoAtendimentos: FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("todos");

  // Mock data
  const atendimentos: AtendimentoUrbano[] = [
    {
      id: "1",
      protocolo: "PU-2024-001",
      cidadao: {
        nome: "João Silva",
        cpf: "123.456.789-00",
        telefone: "(11) 99999-9999",
        email: "joao@email.com"
      },
      tipoAtendimento: "consulta",
      assunto: "Consulta sobre zoneamento",
      descricao: "Gostaria de saber sobre as regras de zoneamento para meu terreno",
      localizacao: {
        endereco: "Rua das Flores, 123",
        coordenadas: { latitude: -23.5505, longitude: -46.6333 }
      },
      status: "aberto",
      prioridade: "media",
      dataAbertura: "2024-01-15",
      dataAtualizacao: "2024-01-15",
      observacoes: "Primeira consulta do cidadão",
      anexos: []
    },
    {
      id: "2",
      protocolo: "PU-2024-002",
      cidadao: {
        nome: "Maria Santos",
        cpf: "987.654.321-00",
        telefone: "(11) 88888-8888",
        email: "maria@email.com"
      },
      tipoAtendimento: "solicitacao",
      assunto: "Solicitação de certidão",
      descricao: "Preciso de certidão de uso do solo",
      status: "em_analise",
      prioridade: "alta",
      dataAbertura: "2024-01-14",
      dataAtualizacao: "2024-01-16",
      responsavel: "Ana Oliveira",
      observacoes: "Documentação em análise",
      anexos: ["documento1.pdf"]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aberto": return "bg-blue-100 text-blue-800";
      case "em_analise": return "bg-yellow-100 text-yellow-800";
      case "aprovado": return "bg-green-100 text-green-800";
      case "negado": return "bg-red-100 text-red-800";
      case "pendente_documentos": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (prioridade: string) => {
    switch (prioridade) {
      case "urgente": return "bg-red-100 text-red-800";
      case "alta": return "bg-orange-100 text-orange-800";
      case "media": return "bg-yellow-100 text-yellow-800";
      case "baixa": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredAtendimentos = atendimentos.filter(atendimento => {
    const matchesSearch = atendimento.protocolo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         atendimento.cidadao.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         atendimento.assunto.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "todos" || atendimento.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Atendimentos - Planejamento Urbano</h1>
            <p className="text-gray-600">Gerencie atendimentos relacionados ao planejamento urbano</p>
          </div>
          <Dialog>
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
                  <div>
                    <Label htmlFor="nome">Nome do Cidadão</Label>
                    <Input id="nome" placeholder="Nome completo" />
                  </div>
                  <div>
                    <Label htmlFor="cpf">CPF</Label>
                    <Input id="cpf" placeholder="000.000.000-00" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input id="telefone" placeholder="(00) 00000-0000" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" placeholder="email@exemplo.com" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="tipo">Tipo de Atendimento</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consulta">Consulta</SelectItem>
                      <SelectItem value="solicitacao">Solicitação</SelectItem>
                      <SelectItem value="recurso">Recurso</SelectItem>
                      <SelectItem value="informacao">Informação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="assunto">Assunto</Label>
                  <Input id="assunto" placeholder="Assunto do atendimento" />
                </div>
                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea id="descricao" placeholder="Descreva o atendimento" />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline">Cancelar</Button>
                  <Button>Salvar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por protocolo, nome ou assunto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              <SelectItem value="aberto">Aberto</SelectItem>
              <SelectItem value="em_analise">Em Análise</SelectItem>
              <SelectItem value="aprovado">Aprovado</SelectItem>
              <SelectItem value="negado">Negado</SelectItem>
              <SelectItem value="pendente_documentos">Pendente Documentos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="lista" className="space-y-4">
          <TabsList>
            <TabsTrigger value="lista">Lista</TabsTrigger>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="mapa">Mapa</TabsTrigger>
          </TabsList>

          <TabsContent value="lista">
            <div className="grid gap-4">
              {filteredAtendimentos.map((atendimento) => (
                <Card key={atendimento.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CardTitle className="text-lg">{atendimento.protocolo}</CardTitle>
                        <Badge className={getStatusColor(atendimento.status)}>
                          {atendimento.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={getPriorityColor(atendimento.prioridade)}>
                          {atendimento.prioridade}
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <User className="mr-2 h-4 w-4" />
                          {atendimento.cidadao.nome}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <FileText className="mr-2 h-4 w-4" />
                          {atendimento.assunto}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="mr-2 h-4 w-4" />
                          Aberto: {new Date(atendimento.dataAbertura).toLocaleDateString()}
                        </div>
                        {atendimento.localizacao && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="mr-2 h-4 w-4" />
                            {atendimento.localizacao.endereco}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        {atendimento.responsavel && (
                          <div className="flex items-center text-sm text-gray-600">
                            <User className="mr-2 h-4 w-4" />
                            Responsável: {atendimento.responsavel}
                          </div>
                        )}
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="mr-2 h-4 w-4" />
                          Atualizado: {new Date(atendimento.dataAtualizacao).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    {atendimento.descricao && (
                      <p className="mt-3 text-sm text-gray-700">{atendimento.descricao}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="kanban">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {["aberto", "em_analise", "aprovado", "negado", "pendente_documentos"].map((status) => (
                <Card key={status}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      {status.replace('_', ' ').toUpperCase()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {filteredAtendimentos
                      .filter(a => a.status === status)
                      .map((atendimento) => (
                        <Card key={atendimento.id} className="p-3">
                          <div className="text-sm font-medium">{atendimento.protocolo}</div>
                          <div className="text-xs text-gray-600">{atendimento.cidadao.nome}</div>
                          <div className="text-xs text-gray-500 mt-1">{atendimento.assunto}</div>
                        </Card>
                      ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="mapa">
            <Card>
              <CardContent className="h-96 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-600">Mapa dos atendimentos será exibido aqui</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    
  );
};

export default PlanejamentoUrbanoAtendimentos;
