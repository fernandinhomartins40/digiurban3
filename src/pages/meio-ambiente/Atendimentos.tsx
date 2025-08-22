
import { useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Plus, Search, FileText, Eye, User, MapPin } from "lucide-react";
import { AtendimentoAmbiental } from "../types/meio-ambiente";

const mockAtendimentos: AtendimentoAmbiental[] = [
  {
    id: "1",
    protocolo: "AMB-2024-001",
    cidadao: {
      nome: "João Silva Santos",
      cpf: "123.456.789-00",
      telefone: "(11) 99999-9999",
      email: "joao.silva@email.com"
    },
    tipoAtendimento: "denuncia",
    assunto: "Descarte irregular de resíduos",
    descricao: "Denúncia de descarte irregular de resíduos em área verde",
    localizacao: {
      endereco: "Rua das Flores, 123 - Centro",
      coordenadas: {
        latitude: -23.5505,
        longitude: -46.6333
      }
    },
    status: "em_analise",
    prioridade: "alta",
    dataAbertura: "2024-03-15",
    dataAtualizacao: "2024-03-16",
    responsavel: "Ana Costa",
    observacoes: "Vistoria agendada",
    anexos: ["foto1.jpg", "relatorio.pdf"]
  },
  {
    id: "2",
    protocolo: "AMB-2024-002",
    cidadao: {
      nome: "Maria Oliveira",
      cpf: "987.654.321-00",
      telefone: "(11) 88888-8888",
      email: "maria.oliveira@email.com"
    },
    tipoAtendimento: "licenciamento",
    assunto: "Solicitação de Licença Prévia",
    descricao: "Pedido de licença prévia para atividade industrial",
    status: "resolvido",
    prioridade: "media",
    dataAbertura: "2024-03-10",
    dataAtualizacao: "2024-03-14",
    responsavel: "Carlos Santos",
    observacoes: "Licença emitida",
    anexos: []
  }
];

const statusColors = {
  aberto: "bg-blue-100 text-blue-800",
  em_analise: "bg-yellow-100 text-yellow-800",
  em_vistoria: "bg-orange-100 text-orange-800",
  resolvido: "bg-green-100 text-green-800",
  indeferido: "bg-red-100 text-red-800"
};

const prioridadeColors = {
  baixa: "bg-gray-100 text-gray-800",
  media: "bg-blue-100 text-blue-800",
  alta: "bg-orange-100 text-orange-800",
  urgente: "bg-red-100 text-red-800"
};

export default function MeioAmbienteAtendimentos() {
  const [atendimentos] = useState<AtendimentoAmbiental[]>(mockAtendimentos);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tipoFilter, setTipoFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredAtendimentos = atendimentos.filter((atendimento) => {
    const matchesSearch = 
      atendimento.protocolo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      atendimento.cidadao.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      atendimento.assunto.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || atendimento.status === statusFilter;
    const matchesTipo = tipoFilter === "all" || atendimento.tipoAtendimento === tipoFilter;
    
    return matchesSearch && matchesStatus && matchesTipo;
  });

  return (
    
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Atendimentos - Meio Ambiente</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Atendimento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Novo Atendimento Ambiental</DialogTitle>
                <DialogDescription>
                  Registre um novo atendimento para questões ambientais
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome do Cidadão</Label>
                    <Input id="nome" placeholder="Nome completo" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input id="cpf" placeholder="000.000.000-00" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input id="telefone" placeholder="(00) 00000-0000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" placeholder="email@exemplo.com" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo de Atendimento</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="licenciamento">Licenciamento</SelectItem>
                        <SelectItem value="denuncia">Denúncia</SelectItem>
                        <SelectItem value="consulta">Consulta</SelectItem>
                        <SelectItem value="recurso">Recurso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prioridade">Prioridade</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a prioridade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assunto">Assunto</Label>
                  <Input id="assunto" placeholder="Assunto do atendimento" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endereco">Localização</Label>
                  <Input id="endereco" placeholder="Endereço da ocorrência (opcional)" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea 
                    id="descricao" 
                    placeholder="Descreva detalhadamente a solicitação"
                    rows={4}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={() => setIsDialogOpen(false)}>
                    Salvar Atendimento
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Atendimentos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,245</div>
              <p className="text-xs text-muted-foreground">
                +12% em relação ao mês anterior
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Análise</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89</div>
              <p className="text-xs text-muted-foreground">
                -3% em relação à semana anterior
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Denúncias</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground">
                +18% em relação ao mês anterior
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5.2 dias</div>
              <p className="text-xs text-muted-foreground">
                -0.8 dias em relação ao mês anterior
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Atendimentos</CardTitle>
            <CardDescription>
              Gerencie todos os atendimentos ambientais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por protocolo, nome ou assunto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="aberto">Aberto</SelectItem>
                  <SelectItem value="em_analise">Em Análise</SelectItem>
                  <SelectItem value="em_vistoria">Em Vistoria</SelectItem>
                  <SelectItem value="resolvido">Resolvido</SelectItem>
                  <SelectItem value="indeferido">Indeferido</SelectItem>
                </SelectContent>
              </Select>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="licenciamento">Licenciamento</SelectItem>
                  <SelectItem value="denuncia">Denúncia</SelectItem>
                  <SelectItem value="consulta">Consulta</SelectItem>
                  <SelectItem value="recurso">Recurso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Protocolo</TableHead>
                    <TableHead>Cidadão</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Assunto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAtendimentos.map((atendimento) => (
                    <TableRow key={atendimento.id}>
                      <TableCell className="font-medium">
                        {atendimento.protocolo}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{atendimento.cidadao.nome}</div>
                          <div className="text-sm text-muted-foreground">
                            {atendimento.cidadao.cpf}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {atendimento.tipoAtendimento === "licenciamento" ? "Licenciamento" :
                           atendimento.tipoAtendimento === "denuncia" ? "Denúncia" :
                           atendimento.tipoAtendimento === "consulta" ? "Consulta" : "Recurso"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {atendimento.assunto}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[atendimento.status]}>
                          {atendimento.status === "aberto" ? "Aberto" :
                           atendimento.status === "em_analise" ? "Em Análise" :
                           atendimento.status === "em_vistoria" ? "Em Vistoria" :
                           atendimento.status === "resolvido" ? "Resolvido" : "Indeferido"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={prioridadeColors[atendimento.prioridade]}>
                          {atendimento.prioridade === "baixa" ? "Baixa" :
                           atendimento.prioridade === "media" ? "Média" :
                           atendimento.prioridade === "alta" ? "Alta" : "Urgente"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(atendimento.dataAbertura).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    
  );
}
