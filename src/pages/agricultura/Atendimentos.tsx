
import { useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Search,
  Filter,
  MoreVertical,
  PlusCircle,
  Download,
  Printer,
  ClipboardEdit,
  Trash2,
  Calendar,
  User,
  FileText,
  Eye,
  Wheat
} from "lucide-react";

interface AtendimentoAgricula {
  id: string;
  protocoloNumero: string;
  produtorId: string;
  produtorNome: string;
  dataAtendimento: string;
  tipoAtendimento: string;
  assunto: string;
  descricao: string;
  tecnicoResponsavel: string;
  status: "agendado" | "em_andamento" | "concluido" | "cancelado";
  prioridade: "baixa" | "media" | "alta" | "urgente";
  proximoContato?: string;
  observacoes?: string;
}

// Mock data para atendimentos
const mockAtendimentos: AtendimentoAgricula[] = [
  {
    id: "1",
    protocoloNumero: "AGR-2025-001",
    produtorId: "prod1",
    produtorNome: "João Silva",
    dataAtendimento: "2025-01-15",
    tipoAtendimento: "Assistência Técnica",
    assunto: "Manejo de pragas na cultura do milho",
    descricao: "Produtor relatou infestação de lagarta-do-cartucho na plantação de milho",
    tecnicoResponsavel: "Dr. Carlos Santos",
    status: "em_andamento",
    prioridade: "alta",
    proximoContato: "2025-01-20",
    observacoes: "Agendada visita técnica na propriedade"
  },
  {
    id: "2",
    protocoloNumero: "AGR-2025-002",
    produtorId: "prod2",
    produtorNome: "Maria Oliveira",
    dataAtendimento: "2025-01-10",
    tipoAtendimento: "Orientação",
    assunto: "Programa de crédito rural",
    descricao: "Informações sobre acesso ao PRONAF",
    tecnicoResponsavel: "Ana Costa",
    status: "concluido",
    prioridade: "media"
  }
];

const AtendimentosAgricultura = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("todos");
  const [openDialog, setOpenDialog] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [atendimentos, setAtendimentos] = useState<AtendimentoAgricula[]>(mockAtendimentos);
  const [selectedAtendimento, setSelectedAtendimento] = useState<AtendimentoAgricula | null>(null);

  const filteredAtendimentos = atendimentos.filter((atendimento) => {
    const matchesSearch =
      atendimento.produtorNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      atendimento.protocoloNumero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      atendimento.assunto.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filter === "todos" || atendimento.status === filter;

    return matchesSearch && matchesFilter;
  });

  const statusMap: Record<string, { label: string; color: string }> = {
    agendado: { label: "Agendado", color: "bg-blue-100 text-blue-800" },
    em_andamento: { label: "Em Andamento", color: "bg-yellow-100 text-yellow-800" },
    concluido: { label: "Concluído", color: "bg-green-100 text-green-800" },
    cancelado: { label: "Cancelado", color: "bg-red-100 text-red-800" }
  };

  const prioridadeMap: Record<string, { label: string; color: string }> = {
    baixa: { label: "Baixa", color: "bg-gray-100 text-gray-800" },
    media: { label: "Média", color: "bg-blue-100 text-blue-800" },
    alta: { label: "Alta", color: "bg-orange-100 text-orange-800" },
    urgente: { label: "Urgente", color: "bg-red-100 text-red-800" }
  };

  const handleViewAtendimento = (atendimento: AtendimentoAgricula) => {
    setSelectedAtendimento({...atendimento});
    setViewMode(true);
    setOpenDialog(true);
  };

  const handleEditAtendimento = (atendimento: AtendimentoAgricula) => {
    setSelectedAtendimento({...atendimento});
    setViewMode(false);
    setOpenDialog(true);
  };

  const handleSaveAtendimento = () => {
    if (!selectedAtendimento) return;

    if (selectedAtendimento.id) {
      setAtendimentos(atendimentos.map((a) => a.id === selectedAtendimento.id ? selectedAtendimento : a));
    } else {
      const newId = (Math.max(...atendimentos.map(a => Number(a.id))) + 1).toString();
      const newProtocolo = `AGR-2025-${String(Number(newId)).padStart(3, '0')}`;
      const newAtendimento = { ...selectedAtendimento, id: newId, protocoloNumero: newProtocolo };
      setAtendimentos([...atendimentos, newAtendimento]);
    }

    setOpenDialog(false);
    setSelectedAtendimento(null);
  };

  const handleDeleteAtendimento = (id: string) => {
    setAtendimentos(atendimentos.filter((atendimento) => atendimento.id !== id));
  };

  const handleNewAtendimento = () => {
    setSelectedAtendimento({
      id: "",
      protocoloNumero: "",
      produtorId: "",
      produtorNome: "",
      dataAtendimento: "",
      tipoAtendimento: "",
      assunto: "",
      descricao: "",
      tecnicoResponsavel: "",
      status: "agendado",
      prioridade: "media"
    });
    setViewMode(false);
    setOpenDialog(true);
  };

  return (
    
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Wheat className="h-8 w-8 text-green-600" />
              Atendimentos - Agricultura
            </h1>
            <p className="text-muted-foreground">
              Gerencie os atendimentos aos produtores rurais
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleNewAtendimento}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Atendimento
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Atendimentos Registrados</CardTitle>
            <CardDescription>
              Total de {filteredAtendimentos.length} atendimentos encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por produtor, protocolo ou assunto..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-[180px]">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <SelectValue placeholder="Filtrar por status" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="agendado">Agendado</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Protocolo / Produtor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Assunto</TableHead>
                    <TableHead>Técnico</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAtendimentos.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center h-32 text-muted-foreground"
                      >
                        Nenhum atendimento encontrado com os filtros atuais
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAtendimentos.map((atendimento) => (
                      <TableRow key={atendimento.id} className="group">
                        <TableCell>
                          <div className="font-medium">{atendimento.protocoloNumero}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {atendimento.produtorNome}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(atendimento.dataAtendimento), "dd/MM/yyyy")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate">{atendimento.assunto}</div>
                          <div className="text-xs text-muted-foreground">{atendimento.tipoAtendimento}</div>
                        </TableCell>
                        <TableCell>{atendimento.tecnicoResponsavel}</TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "font-medium",
                              prioridadeMap[atendimento.prioridade]?.color
                            )}
                          >
                            {prioridadeMap[atendimento.prioridade]?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "font-medium",
                              statusMap[atendimento.status]?.color
                            )}
                          >
                            {statusMap[atendimento.status]?.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0 group-hover:opacity-100 data-[state=open]:opacity-100 opacity-0"
                              >
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Abrir menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleViewAtendimento(atendimento)}
                                className="cursor-pointer"
                              >
                                <Eye className="mr-2 h-4 w-4" /> Ver detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEditAtendimento(atendimento)}
                                className="cursor-pointer"
                              >
                                <ClipboardEdit className="mr-2 h-4 w-4" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteAtendimento(atendimento.id)}
                                className="cursor-pointer text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-xs text-muted-foreground">
              Mostrando {filteredAtendimentos.length} de {atendimentos.length} atendimentos
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" /> Exportar
              </Button>
              <Button variant="outline" size="sm">
                <Printer className="mr-2 h-4 w-4" /> Imprimir
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Dialog for create/edit/view */}
        {selectedAtendimento && (
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {viewMode 
                    ? "Detalhes do Atendimento" 
                    : selectedAtendimento.id 
                      ? "Editar Atendimento" 
                      : "Novo Atendimento"}
                </DialogTitle>
                <DialogDescription>
                  {viewMode
                    ? "Visualize as informações do atendimento"
                    : "Preencha os dados do atendimento ao produtor"}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="produtorNome">Nome do Produtor</Label>
                  <Input
                    id="produtorNome"
                    value={selectedAtendimento.produtorNome}
                    onChange={(e) =>
                      !viewMode &&
                      setSelectedAtendimento({
                        ...selectedAtendimento,
                        produtorNome: e.target.value,
                      })
                    }
                    disabled={viewMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataAtendimento">Data do Atendimento</Label>
                  <Input
                    id="dataAtendimento"
                    type="date"
                    value={selectedAtendimento.dataAtendimento}
                    onChange={(e) =>
                      !viewMode &&
                      setSelectedAtendimento({
                        ...selectedAtendimento,
                        dataAtendimento: e.target.value,
                      })
                    }
                    disabled={viewMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipoAtendimento">Tipo de Atendimento</Label>
                  <Select
                    value={selectedAtendimento.tipoAtendimento}
                    onValueChange={(value) =>
                      !viewMode &&
                      setSelectedAtendimento({
                        ...selectedAtendimento,
                        tipoAtendimento: value,
                      })
                    }
                    disabled={viewMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Assistência Técnica">Assistência Técnica</SelectItem>
                      <SelectItem value="Orientação">Orientação</SelectItem>
                      <SelectItem value="Consulta">Consulta</SelectItem>
                      <SelectItem value="Vistoria">Vistoria</SelectItem>
                      <SelectItem value="Capacitação">Capacitação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tecnicoResponsavel">Técnico Responsável</Label>
                  <Input
                    id="tecnicoResponsavel"
                    value={selectedAtendimento.tecnicoResponsavel}
                    onChange={(e) =>
                      !viewMode &&
                      setSelectedAtendimento({
                        ...selectedAtendimento,
                        tecnicoResponsavel: e.target.value,
                      })
                    }
                    disabled={viewMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prioridade">Prioridade</Label>
                  <Select
                    value={selectedAtendimento.prioridade}
                    onValueChange={(value: 'baixa' | 'media' | 'alta' | 'urgente') =>
                      !viewMode &&
                      setSelectedAtendimento({
                        ...selectedAtendimento,
                        prioridade: value,
                      })
                    }
                    disabled={viewMode}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={selectedAtendimento.status}
                    onValueChange={(value: 'agendado' | 'em_andamento' | 'concluido' | 'cancelado') =>
                      !viewMode &&
                      setSelectedAtendimento({
                        ...selectedAtendimento,
                        status: value,
                      })
                    }
                    disabled={viewMode}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agendado">Agendado</SelectItem>
                      <SelectItem value="em_andamento">Em Andamento</SelectItem>
                      <SelectItem value="concluido">Concluído</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="assunto">Assunto</Label>
                  <Input
                    id="assunto"
                    value={selectedAtendimento.assunto}
                    onChange={(e) =>
                      !viewMode &&
                      setSelectedAtendimento({
                        ...selectedAtendimento,
                        assunto: e.target.value,
                      })
                    }
                    disabled={viewMode}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={selectedAtendimento.descricao}
                    onChange={(e) =>
                      !viewMode &&
                      setSelectedAtendimento({
                        ...selectedAtendimento,
                        descricao: e.target.value,
                      })
                    }
                    disabled={viewMode}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proximoContato">Próximo Contato</Label>
                  <Input
                    id="proximoContato"
                    type="date"
                    value={selectedAtendimento.proximoContato || ""}
                    onChange={(e) =>
                      !viewMode &&
                      setSelectedAtendimento({
                        ...selectedAtendimento,
                        proximoContato: e.target.value,
                      })
                    }
                    disabled={viewMode}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={selectedAtendimento.observacoes || ""}
                    onChange={(e) =>
                      !viewMode &&
                      setSelectedAtendimento({
                        ...selectedAtendimento,
                        observacoes: e.target.value,
                      })
                    }
                    disabled={viewMode}
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter>
                {!viewMode ? (
                  <>
                    <Button variant="outline" onClick={() => setOpenDialog(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveAtendimento}>Salvar</Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setOpenDialog(false)}>
                      Fechar
                    </Button>
                    <Button
                      onClick={() => {
                        setViewMode(false);
                      }}
                    >
                      <ClipboardEdit className="mr-2 h-4 w-4" /> Editar
                    </Button>
                  </>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    
  );
};

export default AtendimentosAgricultura;
