import { useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Calendar, User, Search, Calendar as CalendarIcon, FileText } from "lucide-react";
import { Appointment, Patient } from "../types/saude";

// Mock data
const mockAppointments: Appointment[] = [
  {
    id: "1",
    patientId: "101",
    patientName: "Maria Silva",
    doctorId: "201",
    doctorName: "Dr. Carlos Santos",
    specialty: "Clínica Geral",
    date: "2025-05-21",
    time: "09:00",
    status: "agendado",
    priority: "normal",
  },
  {
    id: "2",
    patientId: "102",
    patientName: "João Oliveira",
    doctorId: "202",
    doctorName: "Dra. Ana Pereira",
    specialty: "Cardiologia",
    date: "2025-05-21",
    time: "10:30",
    status: "confirmado",
    priority: "urgente",
  },
  {
    id: "3",
    patientId: "103",
    patientName: "Antônio Ferreira",
    doctorId: "203",
    doctorName: "Dr. Ricardo Martins",
    specialty: "Ortopedia",
    date: "2025-05-22",
    time: "14:00",
    status: "remarcado",
    notes: "Paciente solicitou remarcação",
    priority: "normal",
  },
  {
    id: "4",
    patientId: "104",
    patientName: "Luiza Costa",
    doctorId: "204",
    doctorName: "Dra. Mariana Alves",
    specialty: "Pediatria",
    date: "2025-05-22",
    time: "15:30",
    status: "realizado",
    priority: "normal",
  },
  {
    id: "5",
    patientId: "105",
    patientName: "Roberto Gomes",
    doctorId: "205",
    doctorName: "Dr. Felipe Souza",
    specialty: "Neurologia",
    date: "2025-05-23",
    time: "09:45",
    status: "agendado",
    priority: "emergência",
    notes: "Paciente com dores intensas",
  },
];

const waitingList: Patient[] = [
  {
    id: "106",
    name: "Fernanda Martins",
    birthDate: "1985-03-12",
    cpf: "123.456.789-00",
    cns: "123456789012345",
    phone: "(11) 98765-4321",
    address: "Rua das Flores, 123",
  },
  {
    id: "107",
    name: "Paulo Rodrigues",
    birthDate: "1972-06-25",
    cpf: "987.654.321-00",
    cns: "987654321098765",
    phone: "(11) 91234-5678",
    address: "Av. Principal, 456",
  },
  {
    id: "108",
    name: "Carla Mendes",
    birthDate: "1990-11-08",
    cpf: "456.789.123-00",
    cns: "456789123045678",
    phone: "(11) 92345-6789",
    address: "Rua dos Pinheiros, 789",
  },
];

const statusColors: Record<string, string> = {
  agendado: "bg-blue-500",
  confirmado: "bg-green-500",
  realizado: "bg-purple-500",
  cancelado: "bg-red-500",
  remarcado: "bg-amber-500",
};

const priorityColors: Record<string, string> = {
  normal: "bg-blue-500",
  urgente: "bg-amber-500",
  emergência: "bg-red-500",
};

const AtendimentosSaude = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterSpecialty, setFilterSpecialty] = useState<string>("");

  const filteredAppointments = mockAppointments.filter((appointment) => {
    const matchesSearch = 
      appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.doctorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus ? appointment.status === filterStatus : true;
    const matchesSpecialty = filterSpecialty ? appointment.specialty === filterSpecialty : true;
    
    return matchesSearch && matchesStatus && matchesSpecialty;
  });

  const specialties = Array.from(new Set(mockAppointments.map((a) => a.specialty)));
  const statuses = Array.from(new Set(mockAppointments.map((a) => a.status)));

  return (
    
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Atendimentos em Saúde</h1>
          <Button>
            <Calendar className="mr-2 h-4 w-4" /> Novo Atendimento
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
              <CardTitle>Total de Atendimentos</CardTitle>
              <CardDescription>Hoje</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">24</div>
              <p className="text-sm text-muted-foreground mt-2">+12% em relação à semana passada</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="bg-green-50 dark:bg-green-900/20">
              <CardTitle>Atendimentos Concluídos</CardTitle>
              <CardDescription>Hoje</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">16</div>
              <p className="text-sm text-muted-foreground mt-2">67% do total previsto</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="bg-amber-50 dark:bg-amber-900/20">
              <CardTitle>Tempo Médio</CardTitle>
              <CardDescription>Por atendimento</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">23 min</div>
              <p className="text-sm text-muted-foreground mt-2">-4 min em relação à semana passada</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="agendados">
          <TabsList className="grid grid-cols-3 mb-4 w-[400px]">
            <TabsTrigger value="agendados">Agendados</TabsTrigger>
            <TabsTrigger value="em-espera">Em Espera</TabsTrigger>
            <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="agendados">
            <Card>
              <CardHeader>
                <CardTitle>Atendimentos Agendados</CardTitle>
                <CardDescription>
                  Visualize e gerencie os atendimentos agendados para hoje e próximos dias
                </CardDescription>
                
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar por paciente ou médico..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      {statuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Especialidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as especialidades</SelectItem>
                      {specialties.map((specialty) => (
                        <SelectItem key={specialty} value={specialty}>
                          {specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Médico</TableHead>
                        <TableHead>Especialidade</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Horário</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Prioridade</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAppointments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-4">
                            Nenhum atendimento encontrado com os filtros aplicados.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAppointments.map((appointment) => (
                          <TableRow key={appointment.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center">
                                <User className="mr-2 h-4 w-4" />
                                {appointment.patientName}
                              </div>
                            </TableCell>
                            <TableCell>{appointment.doctorName}</TableCell>
                            <TableCell>{appointment.specialty}</TableCell>
                            <TableCell>{new Date(appointment.date).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell>{appointment.time}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`${statusColors[appointment.status]} text-white`}>
                                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`${priorityColors[appointment.priority]} text-white`}>
                                {appointment.priority.charAt(0).toUpperCase() + appointment.priority.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">
                                  <FileText className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm">
                                  <CalendarIcon className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <p className="text-sm text-muted-foreground">
                  Exibindo {filteredAppointments.length} de {mockAppointments.length} atendimentos
                </p>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">Anterior</Button>
                  <Button variant="outline" size="sm">Próximo</Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="em-espera">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Espera</CardTitle>
                <CardDescription>
                  Pacientes aguardando atendimento na unidade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Data de Nascimento</TableHead>
                        <TableHead>CNS</TableHead>
                        <TableHead>Tempo de Espera</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {waitingList.map((patient, index) => (
                        <TableRow key={patient.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <User className="mr-2 h-4 w-4" />
                              {patient.name}
                            </div>
                          </TableCell>
                          <TableCell>{new Date(patient.birthDate).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell>{patient.cns}</TableCell>
                          <TableCell>{`${30 + index * 15} minutos`}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="default" size="sm">
                                Iniciar Atendimento
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
          </TabsContent>
          
          <TabsContent value="estatisticas">
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas de Atendimento</CardTitle>
                <CardDescription>
                  Análise de atendimentos por especialidade e tipo
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] flex items-center justify-center">
                <p className="text-muted-foreground">
                  [Aqui serão exibidos gráficos de estatísticas de atendimento]
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    
  );
};

export default AtendimentosSaude;
