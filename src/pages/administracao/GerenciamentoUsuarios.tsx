

import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Badge } from "../../components/ui/badge";
import { Search, Plus, Filter, MoreVertical, RefreshCw, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../components/ui/dropdown-menu";

// Mock data para usuários
const mockUsers = [
  { id: 1, name: "Ana Silva", email: "ana.silva@prefeitura.gov.br", department: "Secretaria de Saúde", role: "Administrador", status: "Ativo", lastLogin: "Hoje, 10:25" },
  { id: 2, name: "Carlos Santos", email: "carlos.santos@prefeitura.gov.br", department: "Secretaria de Educação", role: "Editor", status: "Ativo", lastLogin: "Ontem, 16:42" },
  { id: 3, name: "Mariana Oliveira", email: "mariana.oliveira@prefeitura.gov.br", department: "Secretaria de Finanças", role: "Leitor", status: "Inativo", lastLogin: "15/05/2023, 09:10" },
  { id: 4, name: "Paulo Mendes", email: "paulo.mendes@prefeitura.gov.br", department: "Secretaria de Transportes", role: "Editor", status: "Ativo", lastLogin: "Hoje, 08:30" },
  { id: 5, name: "Juliana Costa", email: "juliana.costa@prefeitura.gov.br", department: "Secretaria de Assistência Social", role: "Administrador", status: "Ativo", lastLogin: "19/05/2023, 11:15" },
  { id: 6, name: "Roberto Alves", email: "roberto.alves@prefeitura.gov.br", department: "Secretaria de Obras", role: "Editor", status: "Bloqueado", lastLogin: "10/05/2023, 14:22" },
  { id: 7, name: "Fernanda Lima", email: "fernanda.lima@prefeitura.gov.br", department: "Secretaria de Meio Ambiente", role: "Leitor", status: "Ativo", lastLogin: "Hoje, 09:05" },
  { id: 8, name: "Ricardo Sousa", email: "ricardo.sousa@prefeitura.gov.br", department: "Secretaria de Cultura", role: "Editor", status: "Ativo", lastLogin: "18/05/2023, 15:40" },
  { id: 9, name: "Patrícia Moreira", email: "patricia.moreira@prefeitura.gov.br", department: "Secretaria de Esportes", role: "Leitor", status: "Inativo", lastLogin: "05/05/2023, 10:20" },
  { id: 10, name: "Eduardo Martins", email: "eduardo.martins@prefeitura.gov.br", department: "Gabinete do Prefeito", role: "Administrador", status: "Ativo", lastLogin: "Hoje, 11:30" },
];

// Função para definir a cor da badge de status
const getStatusColor = (status: string) => {
  switch (status) {
    case "Ativo":
      return "bg-green-500";
    case "Inativo":
      return "bg-yellow-500";
    case "Bloqueado":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

const GerenciamentoUsuarios = () => {
  return (
    
      <div className="px-6 py-4">
        <div className="flex flex-col">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Gerenciamento de Usuários</h1>
              <p className="text-gray-600 dark:text-gray-400">Gerencie os usuários do sistema e suas permissões</p>
            </div>
            <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2">
              <Button className="gap-1" variant="outline">
                <RefreshCw size={16} />
                Atualizar
              </Button>
              <Button className="gap-1">
                <UserPlus size={16} />
                Novo Usuário
              </Button>
            </div>
          </div>

          <Tabs defaultValue="todos" className="w-full">
            <div className="flex flex-col md:flex-row justify-between mb-4">
              <TabsList className="mb-2 md:mb-0">
                <TabsTrigger value="todos">Todos</TabsTrigger>
                <TabsTrigger value="ativos">Ativos</TabsTrigger>
                <TabsTrigger value="inativos">Inativos</TabsTrigger>
                <TabsTrigger value="bloqueados">Bloqueados</TabsTrigger>
              </TabsList>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <Input className="pl-8" placeholder="Buscar usuário..." />
                </div>
                <Button variant="outline">
                  <Filter size={16} />
                </Button>
              </div>
            </div>

            <TabsContent value="todos" className="mt-0">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Usuário</TableHead>
                          <TableHead>Departamento</TableHead>
                          <TableHead>Perfil</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Último Acesso</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} />
                                  <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{user.name}</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{user.department}</TableCell>
                            <TableCell>{user.role}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
                            </TableCell>
                            <TableCell>{user.lastLogin}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>Editar Usuário</DropdownMenuItem>
                                  <DropdownMenuItem>Alterar Permissões</DropdownMenuItem>
                                  <DropdownMenuItem>Redefinir Senha</DropdownMenuItem>
                                  {user.status === "Ativo" ? (
                                    <DropdownMenuItem className="text-yellow-600">Desativar Usuário</DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem className="text-green-600">Ativar Usuário</DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem className="text-red-600">Bloquear Usuário</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between border-t p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Mostrando 1-10 de 42 usuários
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled>Anterior</Button>
                    <Button variant="outline" size="sm">Próximo</Button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="ativos">
              <Card>
                <CardContent className="p-6 text-center">
                  <p>Lista de usuários ativos do sistema.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="inativos">
              <Card>
                <CardContent className="p-6 text-center">
                  <p>Lista de usuários inativos do sistema.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="bloqueados">
              <Card>
                <CardContent className="p-6 text-center">
                  <p>Lista de usuários bloqueados do sistema.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    
  );
};

export default GerenciamentoUsuarios;
