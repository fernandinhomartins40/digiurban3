import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGabinete } from "@/hooks/modules/useGabinete";
import { Calendar, Users, TrendingUp, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function DashboardGabinete() {
  const { atendimentos, audiencias, projetosEstrategicos, agenda, indicadores } = useGabinete();

  const atendimentosPendentes = atendimentos.data?.filter(a => a.status === 'protocolado' || a.status === 'andamento').length || 0;
  const audienciasAgendadas = audiencias.data?.filter(a => a.status === 'agendada').length || 0;
  const projetosAndamento = projetosEstrategicos.data?.filter(p => p.status === 'execucao').length || 0;
  const eventosHoje = agenda.data?.filter(e => {
    const hoje = new Date().toDateString();
    const dataEvento = new Date(e.data_evento).toDateString();
    return hoje === dataEvento;
  }).length || 0;

  const cards = [
    {
      title: "Atendimentos Pendentes",
      value: atendimentosPendentes,
      icon: Clock,
      color: "text-orange-600"
    },
    {
      title: "Audiências Agendadas",
      value: audienciasAgendadas,
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Projetos Estratégicos",
      value: projetosAndamento,
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      title: "Eventos Hoje",
      value: eventosHoje,
      icon: Calendar,
      color: "text-purple-600"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gabinete do Prefeito</h1>
        <p className="text-muted-foreground">
          Gestão executiva, audiências e projetos estratégicos
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Agenda do Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {agenda.data?.filter(e => {
                const hoje = new Date().toDateString();
                const dataEvento = new Date(e.data_evento).toDateString();
                return hoje === dataEvento;
              }).slice(0, 5).map((evento) => (
                <div key={evento.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{evento.titulo}</p>
                    <p className="text-sm text-muted-foreground">
                      {evento.horario_inicio} - {evento.local_evento}
                    </p>
                  </div>
                  <Badge variant={
                    evento.status === 'confirmado' ? 'default' :
                    evento.status === 'agendado' ? 'secondary' : 'outline'
                  }>
                    {evento.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Projetos Estratégicos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {projetosEstrategicos.data?.slice(0, 5).map((projeto) => (
                <div key={projeto.id} className="flex items-center gap-3">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium">{projeto.nome_projeto}</p>
                    <p className="text-sm text-muted-foreground">
                      {projeto.percentual_executado}% concluído
                    </p>
                  </div>
                  <Badge variant={
                    projeto.status === 'execucao' ? 'default' :
                    projeto.status === 'planejamento' ? 'secondary' :
                    projeto.status === 'concluido' ? 'outline' : 'destructive'
                  }>
                    {projeto.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}