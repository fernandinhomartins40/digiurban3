import { FC, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from '@/auth'
import { usePermissions } from "../contexts/PermissionsContext"
import { SidebarLogo } from "./SidebarLogo"
import { UserMenu } from "./UserMenu"
import { cn } from "../lib/utils"
import {
  Briefcase,
  Heart,
  GraduationCap,
  Users,
  TreePine,
  MapPin,
  Lightbulb,
  Shield,
  Tractor,
  Camera,
  Trophy,
  Palette,
  Home,
  ChevronDown,
  ChevronRight,
  Building2,
  BarChart3,
  Settings,
  Mail,
  FileText,
  Bell,
  Search
} from "lucide-react"

// ======================================================
// DEFINIÇÃO DAS 13 SECRETARIAS
// ======================================================

interface SecretariaConfig {
  id: string
  nome: string
  sigla: string
  icone: React.ReactNode
  cor: string
  caminhos: {
    nome: string
    path: string
    icone: React.ReactNode
    permissao?: string
  }[]
}

const SECRETARIAS: SecretariaConfig[] = [
  {
    id: "gabinete",
    nome: "Gabinete do Prefeito",
    sigla: "GAB",
    icone: <Briefcase className="w-5 h-5" />,
    cor: "#1E40AF",
    caminhos: [
      { nome: "Visão Geral", path: "/gabinete/visao-geral", icone: <BarChart3 className="w-4 h-4" /> },
      { nome: "Gerenciar Permissões", path: "/gabinete/gerenciar-permissoes", icone: <Shield className="w-4 h-4" /> },
      { nome: "Projetos Estratégicos", path: "/gabinete/projetos-estrategicos", icone: <Building2 className="w-4 h-4" /> },
      { nome: "Monitoramento KPIs", path: "/gabinete/monitoramento-kpis", icone: <BarChart3 className="w-4 h-4" /> },
      { nome: "Comunicação Oficial", path: "/gabinete/comunicacao-oficial", icone: <Mail className="w-4 h-4" /> },
      { nome: "Agenda Executiva", path: "/gabinete/agenda-executiva", icone: <FileText className="w-4 h-4" /> },
      { nome: "Auditoria", path: "/gabinete/auditoria-transparencia", icone: <Search className="w-4 h-4" /> },
      { nome: "Configurações", path: "/gabinete/configuracoes-sistema", icone: <Settings className="w-4 h-4" /> },
      { nome: "Mapa de Demandas", path: "/gabinete/mapa-demandas", icone: <MapPin className="w-4 h-4" /> },
      { nome: "Relatórios Executivos", path: "/gabinete/relatorios-executivos", icone: <FileText className="w-4 h-4" /> },
      { nome: "Ordens aos Setores", path: "/gabinete/ordens-setores", icone: <Bell className="w-4 h-4" /> },
      { nome: "Gerenciar Alertas", path: "/gabinete/gerenciar-alertas", icone: <Bell className="w-4 h-4" /> },
      { nome: "Atendimentos", path: "/gabinete/atendimentos", icone: <Users className="w-4 h-4" /> }
    ]
  },
  {
    id: "saude",
    nome: "Secretaria de Saúde",
    sigla: "SECSAU",
    icone: <Heart className="w-5 h-5" />,
    cor: "#DC2626",
    caminhos: [
      { nome: "Dashboard", path: "/saude/dashboard", icone: <BarChart3 className="w-4 h-4" /> },
      { nome: "Atendimentos", path: "/saude/atendimentos", icone: <Users className="w-4 h-4" /> },
      { nome: "Agendamentos Médicos", path: "/saude/agendamentos-medicos", icone: <FileText className="w-4 h-4" /> },
      { nome: "Controle Medicamentos", path: "/saude/controle-medicamentos", icone: <Heart className="w-4 h-4" /> },
      { nome: "Campanhas de Saúde", path: "/saude/campanhas-saude", icone: <Bell className="w-4 h-4" /> },
      { nome: "Programas de Saúde", path: "/saude/programas-saude", icone: <Building2 className="w-4 h-4" /> },
      { nome: "Encaminhamentos TFD", path: "/saude/encaminhamentos-tfd", icone: <MapPin className="w-4 h-4" /> },
      { nome: "Exames", path: "/saude/exames", icone: <Search className="w-4 h-4" /> },
      { nome: "ACS", path: "/saude/acs", icone: <Users className="w-4 h-4" /> }
    ]
  },
  {
    id: "educacao",
    nome: "Secretaria de Educação",
    sigla: "SECEDU",
    icone: <GraduationCap className="w-5 h-5" />,
    cor: "#059669",
    caminhos: [
      { nome: "Dashboard", path: "/educacao/dashboard", icone: <BarChart3 className="w-4 h-4" /> },
      { nome: "Matrícula Alunos", path: "/educacao/matricula-alunos", icone: <Users className="w-4 h-4" /> },
      { nome: "Gestão Escolar", path: "/educacao/gestao-escolar", icone: <Building2 className="w-4 h-4" /> },
      { nome: "Transporte Escolar", path: "/educacao/transporte-escolar", icone: <MapPin className="w-4 h-4" /> },
      { nome: "Merenda Escolar", path: "/educacao/merenda-escolar", icone: <Heart className="w-4 h-4" /> },
      { nome: "Registro Ocorrências", path: "/educacao/registro-ocorrencias", icone: <FileText className="w-4 h-4" /> },
      { nome: "Calendário Escolar", path: "/educacao/calendario-escolar", icone: <FileText className="w-4 h-4" /> }
    ]
  },
  {
    id: "assistencia-social",
    nome: "Assistência Social",
    sigla: "SECAS",
    icone: <Users className="w-5 h-5" />,
    cor: "#7C3AED",
    caminhos: [
      { nome: "Dashboard", path: "/assistencia-social/dashboard", icone: <BarChart3 className="w-4 h-4" /> },
      { nome: "Atendimentos", path: "/assistencia-social/atendimentos", icone: <Users className="w-4 h-4" /> },
      { nome: "Famílias Vulneráveis", path: "/assistencia-social/familias-vulneraveis", icone: <Users className="w-4 h-4" /> },
      { nome: "CRAS e CREAS", path: "/assistencia-social/cras-e-creas", icone: <Building2 className="w-4 h-4" /> },
      { nome: "Programas Sociais", path: "/assistencia-social/programas-sociais", icone: <Heart className="w-4 h-4" /> },
      { nome: "Gerenciamento Benefícios", path: "/assistencia-social/gerenciamento-beneficios", icone: <FileText className="w-4 h-4" /> },
      { nome: "Entregas Emergenciais", path: "/assistencia-social/entregas-emergenciais", icone: <Bell className="w-4 h-4" /> }
    ]
  },
  {
    id: "meio-ambiente",
    nome: "Meio Ambiente",
    sigla: "SECMA",
    icone: <TreePine className="w-5 h-5" />,
    cor: "#16A34A",
    caminhos: [
      { nome: "Dashboard", path: "/meio-ambiente/dashboard", icone: <BarChart3 className="w-4 h-4" /> },
      { nome: "Atendimentos", path: "/meio-ambiente/atendimentos", icone: <Users className="w-4 h-4" /> },
      { nome: "Licenças Ambientais", path: "/meio-ambiente/licencas-ambientais", icone: <FileText className="w-4 h-4" /> },
      { nome: "Registro Denúncias", path: "/meio-ambiente/registro-denuncias", icone: <Bell className="w-4 h-4" /> },
      { nome: "Áreas Protegidas", path: "/meio-ambiente/areas-protegidas", icone: <MapPin className="w-4 h-4" /> },
      { nome: "Programas Ambientais", path: "/meio-ambiente/programas-ambientais", icone: <TreePine className="w-4 h-4" /> }
    ]
  },
  {
    id: "planejamento-urbano",
    nome: "Planejamento Urbano",
    sigla: "SECPU",
    icone: <MapPin className="w-5 h-5" />,
    cor: "#EA580C",
    caminhos: [
      { nome: "Dashboard", path: "/planejamento-urbano/dashboard", icone: <BarChart3 className="w-4 h-4" /> },
      { nome: "Atendimentos", path: "/planejamento-urbano/atendimentos", icone: <Users className="w-4 h-4" /> },
      { nome: "Aprovação Projetos", path: "/planejamento-urbano/aprovacao-projetos", icone: <FileText className="w-4 h-4" /> },
      { nome: "Emissão Alvarás", path: "/planejamento-urbano/emissao-alvaras", icone: <FileText className="w-4 h-4" /> },
      { nome: "Reclamações/Denúncias", path: "/planejamento-urbano/reclamacoes-denuncias", icone: <Bell className="w-4 h-4" /> },
      { nome: "Consultas Públicas", path: "/planejamento-urbano/consultas-publicas", icone: <Users className="w-4 h-4" /> }
    ]
  },
  {
    id: "servicos-publicos",
    nome: "Serviços Públicos",
    sigla: "SECSP",
    icone: <Lightbulb className="w-5 h-5" />,
    cor: "#FBBF24",
    caminhos: [
      { nome: "Dashboard", path: "/servicos-publicos/dashboard", icone: <BarChart3 className="w-4 h-4" /> },
      { nome: "Atendimentos", path: "/servicos-publicos/atendimentos", icone: <Users className="w-4 h-4" /> },
      { nome: "Iluminação Pública", path: "/servicos-publicos/iluminacao-publica", icone: <Lightbulb className="w-4 h-4" /> },
      { nome: "Limpeza Urbana", path: "/servicos-publicos/limpeza-urbana", icone: <Building2 className="w-4 h-4" /> },
      { nome: "Coleta Especial", path: "/servicos-publicos/coleta-especial", icone: <MapPin className="w-4 h-4" /> },
      { nome: "Problemas com Foto", path: "/servicos-publicos/problemas-com-foto", icone: <Camera className="w-4 h-4" /> },
      { nome: "Programação Equipes", path: "/servicos-publicos/programacao-equipes", icone: <Users className="w-4 h-4" /> }
    ]
  },
  {
    id: "seguranca-publica",
    nome: "Segurança Pública",
    sigla: "SECSP",
    icone: <Shield className="w-5 h-5" />,
    cor: "#DC2626",
    caminhos: [
      { nome: "Dashboard", path: "/seguranca-publica/dashboard", icone: <BarChart3 className="w-4 h-4" /> },
      { nome: "Atendimentos", path: "/seguranca-publica/atendimentos", icone: <Users className="w-4 h-4" /> },
      { nome: "Registro Ocorrências", path: "/seguranca-publica/registro-ocorrencias", icone: <FileText className="w-4 h-4" /> },
      { nome: "Apoio Guarda", path: "/seguranca-publica/apoio-guarda", icone: <Shield className="w-4 h-4" /> },
      { nome: "Mapa Pontos Críticos", path: "/seguranca-publica/mapa-pontos-criticos", icone: <MapPin className="w-4 h-4" /> },
      { nome: "Alertas Segurança", path: "/seguranca-publica/alertas-seguranca", icone: <Bell className="w-4 h-4" /> },
      { nome: "Vigilância Integrada", path: "/seguranca-publica/vigilancia-integrada", icone: <Shield className="w-4 h-4" /> }
    ]
  },
  {
    id: "agricultura",
    nome: "Agricultura",
    sigla: "SECAG",
    icone: <Tractor className="w-5 h-5" />,
    cor: "#65A30D",
    caminhos: [
      { nome: "Dashboard", path: "/agricultura/dashboard", icone: <BarChart3 className="w-4 h-4" /> },
      { nome: "Atendimentos", path: "/agricultura/atendimentos", icone: <Users className="w-4 h-4" /> },
      { nome: "Cadastro Produtores", path: "/agricultura/cadastro-produtores", icone: <Users className="w-4 h-4" /> },
      { nome: "Assistência Técnica", path: "/agricultura/assistencia-tecnica", icone: <Settings className="w-4 h-4" /> },
      { nome: "Programas Rurais", path: "/agricultura/programas-rurais", icone: <Building2 className="w-4 h-4" /> },
      { nome: "Cursos/Capacitações", path: "/agricultura/cursos-capacitacoes", icone: <GraduationCap className="w-4 h-4" /> }
    ]
  },
  {
    id: "turismo",
    nome: "Turismo",
    sigla: "SECTUR",
    icone: <Camera className="w-5 h-5" />,
    cor: "#0EA5E9",
    caminhos: [
      { nome: "Dashboard", path: "/turismo/dashboard", icone: <BarChart3 className="w-4 h-4" /> },
      { nome: "Atendimentos", path: "/turismo/atendimentos", icone: <Users className="w-4 h-4" /> },
      { nome: "Pontos Turísticos", path: "/turismo/pontos-turisticos", icone: <MapPin className="w-4 h-4" /> },
      { nome: "Estabelecimentos Locais", path: "/turismo/estabelecimentos-locais", icone: <Building2 className="w-4 h-4" /> },
      { nome: "Programas Turísticos", path: "/turismo/programas-turisticos", icone: <Camera className="w-4 h-4" /> },
      { nome: "Mapa Turístico", path: "/turismo/mapa-turistico", icone: <MapPin className="w-4 h-4" /> },
      { nome: "Informações Turísticas", path: "/turismo/informacoes-turisticas", icone: <FileText className="w-4 h-4" /> }
    ]
  },
  {
    id: "esportes",
    nome: "Esportes",
    sigla: "SECEP",
    icone: <Trophy className="w-5 h-5" />,
    cor: "#F59E0B",
    caminhos: [
      { nome: "Dashboard", path: "/esportes/dashboard", icone: <BarChart3 className="w-4 h-4" /> },
      { nome: "Atendimentos", path: "/esportes/atendimentos", icone: <Users className="w-4 h-4" /> },
      { nome: "Equipes Esportivas", path: "/esportes/equipes-esportivas", icone: <Trophy className="w-4 h-4" /> },
      { nome: "Competições/Torneios", path: "/esportes/competicoes-torneios", icone: <Trophy className="w-4 h-4" /> },
      { nome: "Atletas Federados", path: "/esportes/atletas-federados", icone: <Users className="w-4 h-4" /> },
      { nome: "Escolinhas Esportivas", path: "/esportes/escolinhas-esportivas", icone: <GraduationCap className="w-4 h-4" /> },
      { nome: "Eventos Esportivos", path: "/esportes/eventos-esportivos", icone: <Trophy className="w-4 h-4" /> },
      { nome: "Infraestrutura Esportiva", path: "/esportes/infraestrutura-esportiva", icone: <Building2 className="w-4 h-4" /> }
    ]
  },
  {
    id: "cultura",
    nome: "Cultura",
    sigla: "SECCUL",
    icone: <Palette className="w-5 h-5" />,
    cor: "#8B5CF6",
    caminhos: [
      { nome: "Dashboard", path: "/cultura/dashboard", icone: <BarChart3 className="w-4 h-4" /> },
      { nome: "Espaços Culturais", path: "/cultura/espacos-culturais", icone: <Building2 className="w-4 h-4" /> },
      { nome: "Projetos Culturais", path: "/cultura/projetos-culturais", icone: <Palette className="w-4 h-4" /> },
      { nome: "Eventos", path: "/cultura/eventos", icone: <FileText className="w-4 h-4" /> },
      { nome: "Grupos Artísticos", path: "/cultura/grupos-artisticos", icone: <Users className="w-4 h-4" /> },
      { nome: "Manifestações Culturais", path: "/cultura/manifestacoes-culturais", icone: <Palette className="w-4 h-4" /> },
      { nome: "Oficinas/Cursos", path: "/cultura/oficinas-cursos", icone: <GraduationCap className="w-4 h-4" /> }
    ]
  },
  {
    id: "habitacao",
    nome: "Habitação",
    sigla: "SECHAB",
    icone: <Home className="w-5 h-5" />,
    cor: "#DC2626",
    caminhos: [
      { nome: "Dashboard", path: "/habitacao/dashboard", icone: <BarChart3 className="w-4 h-4" /> },
      { nome: "Atendimentos", path: "/habitacao/atendimentos", icone: <Users className="w-4 h-4" /> },
      { nome: "Inscrições", path: "/habitacao/inscricoes", icone: <FileText className="w-4 h-4" /> },
      { nome: "Programas Habitacionais", path: "/habitacao/programas-habitacionais", icone: <Home className="w-4 h-4" /> },
      { nome: "Unidades Habitacionais", path: "/habitacao/unidades-habitacionais", icone: <Building2 className="w-4 h-4" /> },
      { nome: "Regularização Fundiária", path: "/habitacao/regularizacao-fundiaria", icone: <FileText className="w-4 h-4" /> }
    ]
  }
]

// ======================================================
// COMPONENTE PRINCIPAL DO SIDEBAR
// ======================================================

export const UnifiedSidebar: FC = () => {
  const { profile: user, isLoading: loading, isAuthenticated } = useAuth()
  const permissions = usePermissions()
  const location = useLocation()
  const [expandedSections, setExpandedSections] = useState<string[]>(['gabinete'])

  // If not authenticated, don't render sidebar
  if (!isAuthenticated || !user) {
    return null
  }

  // Verificar se uma secretaria pode ser acessada
  const canAccessSecretaria = (secretaria: SecretariaConfig): boolean => {
    switch (secretaria.id) {
      case 'gabinete':
        return permissions.canAccessGabinete()
      case 'saude':
        return permissions.canAccessSaude()
      case 'educacao':
        return permissions.canAccessEducacao()
      case 'assistencia-social':
        return permissions.canAccessAssistenciaSocial()
      case 'meio-ambiente':
        return permissions.canAccessMeioAmbiente()
      case 'planejamento-urbano':
        return permissions.canAccessPlanejamentoUrbano()
      case 'servicos-publicos':
        return permissions.canAccessServicosPublicos()
      case 'seguranca-publica':
        return permissions.canAccessSegurancaPublica()
      case 'agricultura':
        return permissions.canAccessAgricultura()
      case 'turismo':
        return permissions.canAccessTurismo()
      case 'esportes':
        return permissions.canAccessEsportes()
      case 'cultura':
        return permissions.canAccessCultura()
      case 'habitacao':
        return permissions.canAccessHabitacao()
      default:
        return false
    }
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const isCurrentPath = (path: string): boolean => {
    return location.pathname === path
  }

  const isInSection = (secretaria: SecretariaConfig): boolean => {
    // Verificar se algum caminho da secretaria corresponde exatamente ou é prefixo da rota atual
    return secretaria.caminhos.some(caminho => {
      const currentPath = location.pathname;
      // Verificação exata primeiro
      if (currentPath === caminho.path) return true;
      
      // Verificação de prefixo mais precisa (precisa ter uma barra depois ou ser o final)
      if (currentPath.startsWith(caminho.path)) {
        const nextChar = currentPath[caminho.path.length];
        return nextChar === '/' || nextChar === undefined;
      }
      return false;
    });
  }

  if (loading) {
    return (
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 pb-4 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        
        {/* Logo */}
        <div className="flex items-center flex-shrink-0 px-4 mb-6">
          <SidebarLogo />
        </div>
        
        {/* Menus das Secretarias */}
        <nav className="flex-1 px-2 space-y-1">
          
          {/* Dashboard Principal */}
          <div className="mb-6">
            <Link
              to="/gabinete/visao-geral"
              className={cn(
                "group flex items-center px-3 py-2 text-sm font-medium rounded-md",
                location.pathname === '/gabinete/visao-geral' || location.pathname === '/admin'
                  ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                  : "text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
              )}
            >
              <BarChart3 className="mr-3 h-5 w-5" style={{ color: '#1E40AF' }} />
              Dashboard Principal
            </Link>
          </div>

          {/* Secretarias */}
          <div className="space-y-2">
            {SECRETARIAS.map((secretaria) => {
              if (!canAccessSecretaria(secretaria)) return null

              const isExpanded = expandedSections.includes(secretaria.id)
              const isActive = isInSection(secretaria)

              return (
                <div key={secretaria.id} className="space-y-1">
                  
                  {/* Header da Secretaria */}
                  <button
                    onClick={() => toggleSection(secretaria.id)}
                    className={cn(
                      "w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md text-left",
                      isActive
                        ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white"
                        : "text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
                    )}
                  >
                    <div className="mr-3 h-5 w-5" style={{ color: secretaria.cor }}>
                      {secretaria.icone}
                    </div>
                    <span className="flex-1">{secretaria.nome}</span>
                    {isExpanded ? (
                      <ChevronDown className="ml-auto h-4 w-4" />
                    ) : (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </button>

                  {/* Submenu da Secretaria */}
                  {isExpanded && (
                    <div className="space-y-1 pl-6">
                      {secretaria.caminhos.map((caminho) => (
                        <Link
                          key={caminho.path}
                          to={caminho.path}
                          className={cn(
                            "group flex items-center px-3 py-2 text-sm rounded-md",
                            isCurrentPath(caminho.path)
                              ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700 dark:bg-blue-900/50 dark:text-blue-100"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700"
                          )}
                        >
                          <div className="mr-3 h-4 w-4 text-gray-400">
                            {caminho.icone}
                          </div>
                          {caminho.nome}
                        </Link>
                      ))}
                    </div>
                  )}
                  
                </div>
              )
            })}
          </div>

          {/* Seções Adicionais */}
          <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
            
            {/* Correio */}
            <div className="mb-4">
              <button
                onClick={() => toggleSection('correio')}
                className="w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
              >
                <Mail className="mr-3 h-5 w-5 text-gray-500" />
                <span className="flex-1">Correio Interno</span>
                {expandedSections.includes('correio') ? (
                  <ChevronDown className="ml-auto h-4 w-4" />
                ) : (
                  <ChevronRight className="ml-auto h-4 w-4" />
                )}
              </button>

              {expandedSections.includes('correio') && (
                <div className="space-y-1 pl-6 mt-1">
                  <Link to="/correio/caixa-entrada" className="group flex items-center px-3 py-2 text-sm rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700">
                    <Mail className="mr-3 h-4 w-4" />
                    Caixa de Entrada
                  </Link>
                  <Link to="/correio/caixa-saida" className="group flex items-center px-3 py-2 text-sm rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700">
                    <Mail className="mr-3 h-4 w-4" />
                    Caixa de Saída
                  </Link>
                  <Link to="/correio/novo-email" className="group flex items-center px-3 py-2 text-sm rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700">
                    <Mail className="mr-3 h-4 w-4" />
                    Novo Email
                  </Link>
                </div>
              )}
            </div>

            {/* Relatórios */}
            <div className="mb-4">
              <button
                onClick={() => toggleSection('relatorios')}
                className="w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
              >
                <BarChart3 className="mr-3 h-5 w-5 text-gray-500" />
                <span className="flex-1">Relatórios</span>
                {expandedSections.includes('relatorios') ? (
                  <ChevronDown className="ml-auto h-4 w-4" />
                ) : (
                  <ChevronRight className="ml-auto h-4 w-4" />
                )}
              </button>

              {expandedSections.includes('relatorios') && (
                <div className="space-y-1 pl-6 mt-1">
                  <Link to="/relatorios/relatorios" className="group flex items-center px-3 py-2 text-sm rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700">
                    <FileText className="mr-3 h-4 w-4" />
                    Relatórios Gerais
                  </Link>
                  <Link to="/relatorios/indicadores-atendimentos" className="group flex items-center px-3 py-2 text-sm rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700">
                    <BarChart3 className="mr-3 h-4 w-4" />
                    Indicadores
                  </Link>
                  <Link to="/relatorios/exportacoes" className="group flex items-center px-3 py-2 text-sm rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700">
                    <FileText className="mr-3 h-4 w-4" />
                    Exportações
                  </Link>
                </div>
              )}
            </div>

            {/* Administração - apenas para admins */}
            {permissions.isAdmin() && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('administracao')}
                  className="w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
                >
                  <Settings className="mr-3 h-5 w-5 text-gray-500" />
                  <span className="flex-1">Administração</span>
                  {expandedSections.includes('administracao') ? (
                    <ChevronDown className="ml-auto h-4 w-4" />
                  ) : (
                    <ChevronRight className="ml-auto h-4 w-4" />
                  )}
                </button>

                {expandedSections.includes('administracao') && (
                  <div className="space-y-1 pl-6 mt-1">
                    <Link to="/administracao/gerenciamento-usuarios" className="group flex items-center px-3 py-2 text-sm rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700">
                      <Users className="mr-3 h-4 w-4" />
                      Gerenciar Usuários
                    </Link>
                    <Link to="/administracao/perfis-permissoes" className="group flex items-center px-3 py-2 text-sm rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700">
                      <Shield className="mr-3 h-4 w-4" />
                      Perfis e Permissões
                    </Link>
                    <Link to="/administracao/configuracoes-gerais" className="group flex items-center px-3 py-2 text-sm rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700">
                      <Settings className="mr-3 h-4 w-4" />
                      Configurações Gerais
                    </Link>
                  </div>
                )}
              </div>
            )}

          </div>

        </nav>

        {/* User Menu */}
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-2">
          <UserMenu />
        </div>

      </div>
    </div>
  )
}