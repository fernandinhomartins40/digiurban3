import { FC, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Shield,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  MapPin,
  Clock,
  User,
  AlertTriangle
} from "lucide-react";
import { Ocorrencia } from "../types/seguranca-publica";

const mockOcorrencias: Ocorrencia[] = [
  {
    id: "1",
    protocolo: "SP2024001",
    tipo: "furto",
    status: "em_andamento",
    prioridade: "media",
    descricao: "Furto de bicicleta no centro da cidade",
    local: "Praça Central, Centro",
    coordenadas: { lat: -23.5505, lng: -46.6333 },
    dataOcorrencia: "2024-01-15T14:30:00",
    dataCriacao: "2024-01-15T14:45:00",
    solicitante: {
      nome: "João Silva",
      telefone: "(11) 99999-9999",
      email: "joao@email.com"
    },
    responsavel: {
      nome: "Sgt. Maria Santos",
      setor: "Guarda Municipal"
    }
  },
  {
    id: "2",
    protocolo: "SP2024002",
    tipo: "vandalismo",
    status: "aberta",
    prioridade: "alta",
    descricao: "Pichação em prédio público",
    local: "Prefeitura Municipal",
    dataOcorrencia: "2024-01-15T09:00:00",
    dataCriacao: "2024-01-15T09:15:00",
    solicitante: {
      nome: "Ana Costa",
      telefone: "(11) 88888-8888"
    }
  }
];

const AtendimentosSegurancaPublica: FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tipoFilter, setTipoFilter] = useState("all");
  const [selectedOcorrencia, setSelectedOcorrencia] = useState<Ocorrencia | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aberta": return "bg-red-100 text-red-800";
      case "em_andamento": return "bg-yellow-100 text-yellow-800";
      case "resolvida": return "bg-green-100 text-green-800";
      case "arquivada": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case "critica": return "bg-red-500 text-white";
      case "alta": return "bg-orange-500 text-white";
      case "media": return "bg-yellow-500 text-white";
      case "baixa": return "bg-green-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getTipoLabel = (tipo: string) => {
    const labels: { [key: string]: string } = {
      furto: "Furto",
      roubo: "Roubo",
      vandalismo: "Vandalismo",
      perturbacao: "Perturbação",
      acidente: "Acidente",
      violencia: "Violência",
      outros: "Outros"
    };
    return labels[tipo] || tipo;
  };

  const filteredOcorrencias = mockOcorrencias.filter(ocorrencia => {
    const matchesSearch = searchTerm === "" || 
      ocorrencia.protocolo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ocorrencia.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ocorrencia.local.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || ocorrencia.status === statusFilter;
    const matchesTipo = tipoFilter === "all" || ocorrencia.tipo === tipoFilter;
    
    return matchesSearch && matchesStatus && matchesTipo;
  });

  return (
    
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center">
              <Shield className="mr-3 h-8 w-8 text-blue-600" />
              Atendimentos - Segurança Pública
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie ocorrências e solicitações de segurança pública
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Nova Ocorrência
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Registrar Nova Ocorrência</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Ocorrência</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="furto">Furto</SelectItem>
                      <SelectItem value="roubo">Roubo</SelectItem>
                      <SelectItem value="vandalismo">Vandalismo</SelectItem>
                      <SelectItem value="perturbacao">Perturbação</SelectItem>
                      <SelectItem value="acidente">Acidente</SelectItem>
                      <SelectItem value="violencia">Violência</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
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
                      <SelectItem value="critica">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="local">Local</Label>
                  <Input id="local" placeholder="Endereço ou referência do local" />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <textarea
                    id="descricao"
                    className="w-full p-2 border rounded-md"
                    rows={3}
                    placeholder="Descreva a ocorrência..."
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline">Cancelar</Button>
                <Button className="bg-blue-600 hover:bg-blue-700">Registrar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Abertas</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Em Andamento</p>
                  <p className="text-2xl font-bold">8</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Resolvidas</p>
                  <p className="text-2xl font-bold">45</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <User className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">65</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros e Busca</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por protocolo, descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="aberta">Aberta</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="resolvida">Resolvida</SelectItem>
                  <SelectItem value="arquivada">Arquivada</SelectItem>
                </SelectContent>
              </Select>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="furto">Furto</SelectItem>
                  <SelectItem value="roubo">Roubo</SelectItem>
                  <SelectItem value="vandalismo">Vandalismo</SelectItem>
                  <SelectItem value="perturbacao">Perturbação</SelectItem>
                  <SelectItem value="acidente">Acidente</SelectItem>
                  <SelectItem value="violencia">Violência</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="w-full">
                <Filter className="mr-2 h-4 w-4" />
                Filtros Avançados
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Ocorrências</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Protocolo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOcorrencias.map((ocorrencia) => (
                  <TableRow key={ocorrencia.id}>
                    <TableCell className="font-medium">{ocorrencia.protocolo}</TableCell>
                    <TableCell>{getTipoLabel(ocorrencia.tipo)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(ocorrencia.status)}>
                        {ocorrencia.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPrioridadeColor(ocorrencia.prioridade)}>
                        {ocorrencia.prioridade}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin className="mr-1 h-3 w-3" />
                        {ocorrencia.local}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(ocorrencia.dataOcorrencia).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{ocorrencia.responsavel?.nome || "Não atribuído"}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOcorrencia(ocorrencia)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {selectedOcorrencia && (
          <Dialog open={!!selectedOcorrencia} onOpenChange={() => setSelectedOcorrencia(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Detalhes da Ocorrência - {selectedOcorrencia.protocolo}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo</Label>
                    <p className="text-sm">{getTipoLabel(selectedOcorrencia.tipo)}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge className={getStatusColor(selectedOcorrencia.status)}>
                      {selectedOcorrencia.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <Label>Prioridade</Label>
                    <Badge className={getPrioridadeColor(selectedOcorrencia.prioridade)}>
                      {selectedOcorrencia.prioridade}
                    </Badge>
                  </div>
                  <div>
                    <Label>Data da Ocorrência</Label>
                    <p className="text-sm">
                      {new Date(selectedOcorrencia.dataOcorrencia).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div>
                  <Label>Descrição</Label>
                  <p className="text-sm bg-gray-50 p-3 rounded">{selectedOcorrencia.descricao}</p>
                </div>
                <div>
                  <Label>Local</Label>
                  <p className="text-sm">{selectedOcorrencia.local}</p>
                </div>
                <div>
                  <Label>Solicitante</Label>
                  <div className="text-sm bg-gray-50 p-3 rounded">
                    <p><strong>Nome:</strong> {selectedOcorrencia.solicitante.nome}</p>
                    {selectedOcorrencia.solicitante.telefone && (
                      <p><strong>Telefone:</strong> {selectedOcorrencia.solicitante.telefone}</p>
                    )}
                    {selectedOcorrencia.solicitante.email && (
                      <p><strong>Email:</strong> {selectedOcorrencia.solicitante.email}</p>
                    )}
                  </div>
                </div>
                {selectedOcorrencia.responsavel && (
                  <div>
                    <Label>Responsável</Label>
                    <p className="text-sm">
                      {selectedOcorrencia.responsavel.nome} - {selectedOcorrencia.responsavel.setor}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedOcorrencia(null)}>
                  Fechar
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Editar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    
  );
};

export default AtendimentosSegurancaPublica;
