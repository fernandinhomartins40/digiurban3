
import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import { Search, Plus, Edit, Trash2, Users, Trophy, Calendar } from "lucide-react";
import { AtendimentoEsportivo } from "../types/esportes";

export default function EsportesAtendimentos() {
  const [atendimentos, setAtendimentos] = useState<AtendimentoEsportivo[]>([
    {
      id: "1",
      cidadao: "João Silva",
      cpf: "123.456.789-00",
      telefone: "(11) 99999-9999",
      modalidade: "Futebol",
      categoria: "Adulto",
      status: "Em Andamento",
      data: "2024-01-15",
      observacoes: "Interessado em participar do time municipal"
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAtendimento, setEditingAtendimento] = useState<AtendimentoEsportivo | null>(null);
  const [formData, setFormData] = useState<Partial<AtendimentoEsportivo>>({});

  const filteredAtendimentos = atendimentos.filter(
    atendimento =>
      atendimento.cidadao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      atendimento.modalidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      atendimento.cpf.includes(searchTerm)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAtendimento) {
      setAtendimentos(atendimentos.map(item => 
        item.id === editingAtendimento.id ? { ...editingAtendimento, ...formData } : item
      ));
    } else {
      const newAtendimento: AtendimentoEsportivo = {
        id: Date.now().toString(),
        cidadao: formData.cidadao || "",
        cpf: formData.cpf || "",
        telefone: formData.telefone || "",
        modalidade: formData.modalidade || "",
        categoria: (formData.categoria as 'Infantil' | 'Juvenil' | 'Adulto' | 'Terceira Idade') || "Adulto",
        status: (formData.status as 'Pendente' | 'Em Andamento' | 'Concluído' | 'Cancelado') || "Pendente",
        data: formData.data || new Date().toISOString().split('T')[0],
        observacoes: formData.observacoes || ""
      };
      setAtendimentos([...atendimentos, newAtendimento]);
    }
    setIsDialogOpen(false);
    setEditingAtendimento(null);
    setFormData({});
  };

  const handleEdit = (atendimento: AtendimentoEsportivo) => {
    setEditingAtendimento(atendimento);
    setFormData(atendimento);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setAtendimentos(atendimentos.filter(item => item.id !== id));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Concluído": return "bg-green-100 text-green-800";
      case "Em Andamento": return "bg-blue-100 text-blue-800";
      case "Pendente": return "bg-yellow-100 text-yellow-800";
      case "Cancelado": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Atendimentos Esportivos</h1>
            <p className="text-muted-foreground">
              Gerencie os atendimentos e solicitações esportivas dos cidadãos
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingAtendimento(null); setFormData({}); }}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Atendimento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingAtendimento ? "Editar Atendimento" : "Novo Atendimento"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="cidadao">Nome do Cidadão</Label>
                  <Input
                    id="cidadao"
                    value={formData.cidadao || ""}
                    onChange={(e) => setFormData({ ...formData, cidadao: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf || ""}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone || ""}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="modalidade">Modalidade</Label>
                  <Input
                    id="modalidade"
                    value={formData.modalidade || ""}
                    onChange={(e) => setFormData({ ...formData, modalidade: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value as 'Infantil' | 'Juvenil' | 'Adulto' | 'Terceira Idade' })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Infantil">Infantil</SelectItem>
                      <SelectItem value="Juvenil">Juvenil</SelectItem>
                      <SelectItem value="Adulto">Adulto</SelectItem>
                      <SelectItem value="Terceira Idade">Terceira Idade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as 'Pendente' | 'Em Andamento' | 'Concluído' | 'Cancelado' })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                      <SelectItem value="Concluído">Concluído</SelectItem>
                      <SelectItem value="Cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes || ""}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingAtendimento ? "Atualizar" : "Criar"} Atendimento
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Atendimentos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{atendimentos.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {atendimentos.filter(a => a.status === "Em Andamento").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {atendimentos.filter(a => a.status === "Concluído").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {atendimentos.filter(a => a.status === "Pendente").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, modalidade ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Atendimentos List */}
        <div className="grid gap-4">
          {filteredAtendimentos.map((atendimento) => (
            <Card key={atendimento.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{atendimento.cidadao}</h3>
                      <Badge className={getStatusColor(atendimento.status)}>
                        {atendimento.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>CPF: {atendimento.cpf} | Telefone: {atendimento.telefone}</p>
                      <p>Modalidade: {atendimento.modalidade} | Categoria: {atendimento.categoria}</p>
                      <p>Data: {new Date(atendimento.data).toLocaleDateString('pt-BR')}</p>
                      {atendimento.observacoes && <p>Obs: {atendimento.observacoes}</p>}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(atendimento)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(atendimento.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    
  );
}
