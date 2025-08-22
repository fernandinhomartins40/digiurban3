

import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { FC } from "react";
import { Calendar, Filter, Plus, Search } from "lucide-react";

// Dados de exemplo para atendimentos
const atendimentosData = [
  {
    id: "AT-2025-001",
    solicitante: "Maria Silva",
    tipo: "Audiência",
    data: "2025-05-18",
    status: "pendente",
    responsavel: "João Oliveira",
  },
  {
    id: "AT-2025-002",
    solicitante: "Carlos Mendes",
    tipo: "Reclamação",
    data: "2025-05-17",
    status: "em_andamento",
    responsavel: "Fernanda Lima",
  },
  {
    id: "AT-2025-003",
    solicitante: "Ana Pereira",
    tipo: "Solicitação",
    data: "2025-05-15",
    status: "concluido",
    responsavel: "Roberto Santos",
  },
  {
    id: "AT-2025-004",
    solicitante: "Paulo Ribeiro",
    tipo: "Denúncia",
    data: "2025-05-14",
    status: "pendente",
    responsavel: "Carla Ferreira",
  },
  {
    id: "AT-2025-005",
    solicitante: "Lucia Martins",
    tipo: "Audiência",
    data: "2025-05-12",
    status: "em_andamento",
    responsavel: "Ricardo Gomes",
  },
];

// Componente de estatísticas para os cards no topo
const StatCard: FC<{ title: string; value: string; icon: React.ReactNode; className?: string }> = ({ 
  title, 
  value, 
  icon,
  className
}) => (
  <Card className={className}>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

// Componente para o status dos atendimentos
const AtendimentoStatus: FC<{ status: string }> = ({ status }) => {
  const statusConfig = {
    pendente: { label: "Pendente", className: "bg-yellow-500 text-yellow-50" },
    em_andamento: { label: "Em Andamento", className: "bg-blue-500 text-blue-50" },
    concluido: { label: "Concluído", className: "bg-green-500 text-green-50" },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || { label: status, className: "bg-gray-500 text-gray-50" };

  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  );
};

const Atendimentos: FC = () => {
  return (
    
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Atendimentos do Gabinete</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Novo Atendimento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Atendimento</DialogTitle>
                <DialogDescription>
                  Preencha os dados para registrar um novo atendimento.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Input id="solicitante" className="col-span-4" placeholder="Nome do solicitante" />
                  <Select defaultValue="audiencia">
                    <SelectTrigger className="col-span-4">
                      <SelectValue placeholder="Tipo de Atendimento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="audiencia">Audiência</SelectItem>
                      <SelectItem value="reclamacao">Reclamação</SelectItem>
                      <SelectItem value="solicitacao">Solicitação</SelectItem>
                      <SelectItem value="denuncia">Denúncia</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input id="data" className="col-span-4" placeholder="Data" type="date" />
                  <Input id="detalhes" className="col-span-4" placeholder="Detalhes do atendimento" />
                </div>
                <div className="flex justify-end">
                  <Button>Salvar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard 
            title="Atendimentos Pendentes" 
            value="12" 
            icon={<Calendar className="h-4 w-4 text-muted-foreground" />} 
            className="border-l-4 border-yellow-500"
          />
          <StatCard 
            title="Atendimentos Concluídos Hoje" 
            value="5" 
            icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
            className="border-l-4 border-green-500" 
          />
          <StatCard 
            title="Tempo Médio de Resposta" 
            value="2.3 dias" 
            icon={<Calendar className="h-4 w-4 text-muted-foreground" />} 
            className="border-l-4 border-blue-500"
          />
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Gerenciamento de Atendimentos</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="todos">
              <TabsList className="mb-4">
                <TabsTrigger value="todos">Todos</TabsTrigger>
                <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
                <TabsTrigger value="em_andamento">Em Andamento</TabsTrigger>
                <TabsTrigger value="concluidos">Concluídos</TabsTrigger>
              </TabsList>

              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex gap-2 flex-1">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar atendimentos..."
                      className="pl-8"
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Select defaultValue="todos">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os tipos</SelectItem>
                      <SelectItem value="audiencia">Audiência</SelectItem>
                      <SelectItem value="reclamacao">Reclamação</SelectItem>
                      <SelectItem value="solicitacao">Solicitação</SelectItem>
                      <SelectItem value="denuncia">Denúncia</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="date" className="w-[180px]" />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Solicitante</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Responsável</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {atendimentosData.map((atendimento) => (
                      <tr key={atendimento.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{atendimento.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{atendimento.solicitante}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{atendimento.tipo}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {new Date(atendimento.data).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <AtendimentoStatus status={atendimento.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{atendimento.responsavel}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right space-x-2">
                          <Button variant="ghost" size="sm">Ver</Button>
                          <Button variant="ghost" size="sm">Editar</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    
  );
};

export default Atendimentos;
