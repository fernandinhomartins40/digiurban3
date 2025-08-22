
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
import { Calendar, Search, Plus, Eye, MapPin, Clock, User, FileText, Construction } from "lucide-react";
import { AtendimentoObras } from "../types/obras-publicas";

const ObrasPublicasAtendimentos: FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("todos");

  // Mock data
  const atendimentos: AtendimentoObras[] = [
    {
      id: "1",
      protocolo: "OP-2024-001",
      cidadao: {
        nome: "Carlos Silva",
        cpf: "123.456.789-00",
        telefone: "(11) 99999-9999",
        email: "carlos@email.com"
      },
      tipoAtendimento: "solicitacao_obra",
      assunto: "Solicitação de pavimentação",
      descricao: "Solicitação de pavimentação da rua do bairro",
      localizacao: {
        endereco: "Rua das Palmeiras, 456",
        coordenadas: { latitude: -23.5505, longitude: -46.6333 }
      },
      status: "aberto",
      prioridade: "alta",
      dataAbertura: "2024-01-15",
      dataAtualizacao: "2024-01-15",
      observacoes: "Rua em condições precárias",
      anexos: []
    },
    {
      id: "2",
      protocolo: "OP-2024-002",
      cidadao: {
        nome: "Ana Santos",
        cpf: "987.654.321-00",
        telefone: "(11) 88888-8888",
        email: "ana@email.com"
      },
      tipoAtendimento: "reclamacao_obra",
      assunto: "Reclamação sobre obra",
      descricao: "Obra causando transtornos no trânsito",
      status: "em_analise",
      prioridade: "media",
      dataAbertura: "2024-01-14",
      dataAtualizacao: "2024-01-16",
      responsavel: "João Oliveira",
      observacoes: "Verificar sinalização da obra",
      anexos: ["foto1.jpg"]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aberto": return "bg-blue-100 text-blue-800";
      case "em_analise": return "bg-yellow-100 text-yellow-800";
      case "aprovado": return "bg-green-100 text-green-800";
      case "negado": return "bg-red-100 text-red-800";
      case "em_execucao": return "bg-purple-100 text-purple-800";
      case "concluido": return "bg-emerald-100 text-emerald-800";
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
            <h1 className="text-3xl font-bold flex items-center">
              <Construction className="mr-3 h-8 w-8" />
              Atendimentos - Obras Públicas
            </h1>
            <p className="text-gray-600">Gerencie atendimentos relacionados a obras públicas</p>
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
                      <SelectItem value="solicitacao_obra">Solicitação de Obra</SelectItem>
                      <SelectItem value="reclamacao_obra">Reclamação sobre Obra</SelectItem>
                      <SelectItem value="informacao_obra">Informação sobre Obra</SelectItem>
                      <SelectItem value="vistoria">Vistoria</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
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
              <SelectItem value="em_execucao">Em Execução</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
      </div>
    
  );
};

export default ObrasPublicasAtendimentos;
