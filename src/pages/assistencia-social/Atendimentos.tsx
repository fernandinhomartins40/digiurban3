
import { useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Atendimento } from "../types/assistencia-social";
import { Search, Plus, Filter, RefreshCcw, FileDown, Calendar, Clock, Users } from "lucide-react";
import { useToast } from "../../hooks/use-toast";

// Mock data
const mockAtendimentos: Atendimento[] = [
  {
    id: "1",
    cidadao: "Maria da Silva",
    cpf: "123.456.789-00",
    dataAtendimento: "2023-10-15T14:30:00",
    tipo: "Auxílio Aluguel",
    descricao: "Solicitação de auxílio aluguel devido à situação de vulnerabilidade",
    status: "concluido",
    responsavel: "Ana Paula Santos",
    local: "CRAS Central",
    encaminhamentos: ["Secretaria de Habitação"]
  },
  {
    id: "2",
    cidadao: "José Pereira",
    cpf: "987.654.321-00",
    dataAtendimento: "2023-10-16T10:00:00",
    tipo: "Cesta Básica",
    descricao: "Solicitação de cesta básica para família em situação de insegurança alimentar",
    status: "em andamento",
    responsavel: "Carlos Eduardo Mendes",
    local: "CRAS Norte"
  },
  {
    id: "3",
    cidadao: "Antônia Ferreira",
    cpf: "456.789.123-00",
    dataAtendimento: "2023-10-17T09:15:00",
    tipo: "Benefício Eventual",
    descricao: "Avaliação para concessão de benefício eventual por situação de nascimento",
    status: "agendado",
    responsavel: "Mariana Costa",
    local: "CRAS Sul"
  },
  {
    id: "4",
    cidadao: "João Oliveira",
    cpf: "321.654.987-00",
    dataAtendimento: "2023-10-14T16:00:00",
    tipo: "Orientação",
    descricao: "Orientação sobre acesso ao BPC - Benefício de Prestação Continuada",
    status: "concluido",
    responsavel: "Rafael Almeida",
    local: "CREAS"
  },
  {
    id: "5",
    cidadao: "Luiza Santos",
    cpf: "789.123.456-00",
    dataAtendimento: "2023-10-18T11:30:00",
    tipo: "Violação de Direitos",
    descricao: "Atendimento por situação de violência doméstica",
    status: "em andamento",
    responsavel: "Fernanda Oliveira",
    local: "CREAS",
    encaminhamentos: ["Delegacia da Mulher", "Defensoria Pública"]
  }
];

export default function AtendimentosAssistencia() {
  const { toast } = useToast();
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>(mockAtendimentos);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filteredAtendimentos, setFilteredAtendimentos] = useState<Atendimento[]>(mockAtendimentos);
  
  const handleSearch = () => {
    const results = atendimentos.filter(
      (atendimento) =>
        atendimento.cidadao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        atendimento.cpf.includes(searchTerm) ||
        atendimento.tipo.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAtendimentos(results);
  };

  const handleAddAtendimento = (novoAtendimento: Partial<Atendimento>) => {
    const newAtendimento = {
      ...novoAtendimento,
      id: (atendimentos.length + 1).toString(),
      status: "agendado" as const,
    } as Atendimento;

    setAtendimentos([...atendimentos, newAtendimento as Atendimento]);
    setFilteredAtendimentos([...atendimentos, newAtendimento as Atendimento]);
    setIsDialogOpen(false);
    
    toast({
      title: "Atendimento agendado",
      description: `O atendimento para ${novoAtendimento.cidadao} foi agendado com sucesso.`
    });
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "concluido":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "em andamento":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "agendado":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "cancelado":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  return (
    
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Atendimentos Sociais</h1>
          <div className="flex items-center gap-4">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Atendimento
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Agendar Novo Atendimento</DialogTitle>
                  <DialogDescription>
                    Preencha os dados para agendar um novo atendimento social.
                  </DialogDescription>
                </DialogHeader>
                <NovoAtendimentoForm onSubmit={handleAddAtendimento} onCancel={() => setIsDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <Card className="w-full md:w-2/3">
            <CardHeader className="pb-3">
              <CardTitle>Lista de Atendimentos</CardTitle>
              <CardDescription>
                Visualize e gerencie os atendimentos sociais
              </CardDescription>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Buscar por nome, CPF ou tipo..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <Button variant="outline" onClick={handleSearch}>
                  <Search className="mr-2 h-4 w-4" />
                  Buscar
                </Button>
                <Select defaultValue="todos">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os status</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="em andamento">Em andamento</SelectItem>
                    <SelectItem value="agendado">Agendado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cidadão</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAtendimentos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          Nenhum atendimento encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAtendimentos.map((atendimento) => (
                        <TableRow key={atendimento.id}>
                          <TableCell>
                            <div className="font-medium">{atendimento.cidadao}</div>
                            <div className="text-sm text-gray-500">
                              {atendimento.cpf}
                            </div>
                          </TableCell>
                          <TableCell>{atendimento.tipo}</TableCell>
                          <TableCell>
                            {new Date(atendimento.dataAtendimento).toLocaleDateString('pt-BR')}
                            <div className="text-sm text-gray-500">
                              {new Date(atendimento.dataAtendimento).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </TableCell>
                          <TableCell>{atendimento.local}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(
                                atendimento.status
                              )}`}
                            >
                              {atendimento.status === "concluido" && "Concluído"}
                              {atendimento.status === "em andamento" && "Em andamento"}
                              {atendimento.status === "agendado" && "Agendado"}
                              {atendimento.status === "cancelado" && "Cancelado"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" className="mr-2" onClick={() => {
                              toast({
                                title: "Detalhes do atendimento",
                                description: `Visualizando detalhes do atendimento de ${atendimento.cidadao}`
                              });
                            }}>
                              Ver
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => {
                              toast({
                                title: "Edição de atendimento",
                                description: `Edição do atendimento de ${atendimento.cidadao} iniciada`
                              });
                            }}>
                              Editar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => {
                setFilteredAtendimentos(atendimentos);
                setSearchTerm("");
              }}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Limpar filtros
              </Button>
              <Button variant="outline">
                <FileDown className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </CardFooter>
          </Card>

          <div className="w-full md:w-1/3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 mr-3">
                      <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Atendimentos Hoje</p>
                    </div>
                  </div>
                  <p className="font-bold text-xl">8</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30 mr-3">
                      <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Em Andamento</p>
                    </div>
                  </div>
                  <p className="font-bold text-xl">5</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30 mr-3">
                      <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Total na Semana</p>
                    </div>
                  </div>
                  <p className="font-bold text-xl">32</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Próximos Agendamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredAtendimentos
                    .filter((a) => a.status === "agendado")
                    .slice(0, 3)
                    .map((atendimento) => (
                      <div key={atendimento.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                        <div>
                          <p className="font-medium">{atendimento.cidadao}</p>
                          <p className="text-sm text-gray-500">{atendimento.tipo}</p>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(atendimento.dataAtendimento).toLocaleDateString('pt-BR')} às{" "}
                            {new Date(atendimento.dataAtendimento).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => {
                          toast({
                            title: "Detalhes do agendamento",
                            description: `Visualizando agendamento de ${atendimento.cidadao}`
                          });
                        }}>
                          Ver
                        </Button>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="hoje" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="hoje">Hoje</TabsTrigger>
            <TabsTrigger value="semana">Esta Semana</TabsTrigger>
            <TabsTrigger value="mes">Este Mês</TabsTrigger>
            <TabsTrigger value="todos">Todos</TabsTrigger>
          </TabsList>
          <TabsContent value="hoje" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Atendimentos de Hoje</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center py-8 text-gray-500">
                  Visualização por período será implementada em breve.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="semana" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Atendimentos da Semana</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center py-8 text-gray-500">
                  Visualização por período será implementada em breve.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="mes" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Atendimentos do Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center py-8 text-gray-500">
                  Visualização por período será implementada em breve.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="todos" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Todos os Atendimentos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center py-8 text-gray-500">
                  Visualização completa será implementada em breve.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    
  );
}

interface NovoAtendimentoFormProps {
  onSubmit: (data: Partial<Atendimento>) => void;
  onCancel: () => void;
}

function NovoAtendimentoForm({ onSubmit, onCancel }: NovoAtendimentoFormProps) {
  const [formData, setFormData] = useState<Partial<Atendimento>>({
    cidadao: "",
    cpf: "",
    dataAtendimento: "",
    tipo: "",
    descricao: "",
    responsavel: "",
    local: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="cidadao" className="text-sm font-medium leading-none">
              Nome do Cidadão
            </label>
            <Input
              id="cidadao"
              name="cidadao"
              value={formData.cidadao}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="cpf" className="text-sm font-medium leading-none">
              CPF
            </label>
            <Input
              id="cpf"
              name="cpf"
              value={formData.cpf}
              onChange={handleChange}
              placeholder="000.000.000-00"
              required
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="dataAtendimento" className="text-sm font-medium leading-none">
              Data e Hora
            </label>
            <Input
              id="dataAtendimento"
              name="dataAtendimento"
              type="datetime-local"
              value={formData.dataAtendimento}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="tipo" className="text-sm font-medium leading-none">
              Tipo de Atendimento
            </label>
            <Select
              value={formData.tipo}
              onValueChange={(value) => handleSelectChange("tipo", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Auxílio Aluguel">Auxílio Aluguel</SelectItem>
                <SelectItem value="Cesta Básica">Cesta Básica</SelectItem>
                <SelectItem value="Benefício Eventual">Benefício Eventual</SelectItem>
                <SelectItem value="Orientação">Orientação</SelectItem>
                <SelectItem value="Violação de Direitos">Violação de Direitos</SelectItem>
                <SelectItem value="Acompanhamento Familiar">Acompanhamento Familiar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="responsavel" className="text-sm font-medium leading-none">
              Responsável
            </label>
            <Input
              id="responsavel"
              name="responsavel"
              value={formData.responsavel}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="local" className="text-sm font-medium leading-none">
              Local
            </label>
            <Select
              value={formData.local}
              onValueChange={(value) => handleSelectChange("local", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o local" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CRAS Central">CRAS Central</SelectItem>
                <SelectItem value="CRAS Norte">CRAS Norte</SelectItem>
                <SelectItem value="CRAS Sul">CRAS Sul</SelectItem>
                <SelectItem value="CREAS">CREAS</SelectItem>
                <SelectItem value="Centro POP">Centro POP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="descricao" className="text-sm font-medium leading-none">
            Descrição
          </label>
          <textarea
            id="descricao"
            name="descricao"
            className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            value={formData.descricao}
            onChange={handleChange}
            placeholder="Descreva a situação ou necessidade do cidadão..."
            required
          ></textarea>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          Agendar Atendimento
        </Button>
      </DialogFooter>
    </form>
  );
}
