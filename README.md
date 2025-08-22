# DigiUrban2 - Sistema SaaS de Gestão Municipal Completa

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4.5-3178C6?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Latest-3ECF8E?logo=supabase)
![Status](https://img.shields.io/badge/status-production%20ready-green.svg)

### Plataforma SaaS Multi-Tenant para Digitalização Completa da Gestão Municipal

</div>

---

## 📋 Sumário

- [Visão Geral](#-visão-geral)
- [Arquitetura](#-arquitetura)
- [Módulos Implementados](#-módulos-implementados)
- [Sistema de Usuários](#-sistema-de-usuários)
- [Portais de Acesso](#-portais-de-acesso)
- [Tecnologias](#-tecnologias)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Deploy](#-deploy)
- [Documentação Técnica](#-documentação-técnica)

---

## 🌟 Visão Geral

O **DigiUrban2** é uma plataforma SaaS completa para digitalização integral da gestão municipal. O sistema oferece uma solução moderna, escalável e segura que atende **100% das necessidades** de prefeituras de pequeno, médio e grande porte.

### 🎯 Objetivos Principais

- **Digitalização Completa**: Todas as secretarias municipais em uma única plataforma
- **Eficiência Operacional**: Automatização de processos e redução de burocracias
- **Transparência**: Portal do cidadão com acompanhamento em tempo real
- **Gestão Inteligente**: Dashboards com métricas e indicadores de performance
- **Escalabilidade**: Arquitetura SaaS multi-tenant para múltiplos municípios

### 📊 Números da Plataforma

- **13 Módulos Secretariais** completamente implementados
- **90+ Páginas** funcionais com interfaces específicas
- **8 Níveis Hierárquicos** de usuários
- **3 Portais Distintos** (Super Admin, Administrativo, Cidadão)
- **Sistema Multi-Tenant** com isolamento completo de dados
- **100% Responsivo** e otimizado para dispositivos móveis

---

## 🏗️ Arquitetura

### Stack Tecnológico

```
Frontend    → React 18 + TypeScript + Vite
Backend     → Supabase (PostgreSQL + Edge Functions)
UI/UX       → Tailwind CSS + Shadcn/UI
Auth        → Sistema próprio baseado em Supabase Auth
State       → React Query + Context API
Charts      → Recharts + Nivo
Deploy      → Docker + Nginx
```

### Arquitetura Multi-Tenant

```
┌─────────────────────────────────────────────────────────────┐
│                     SUPER ADMIN LAYER                       │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │   Tenant A      │ │   Tenant B      │ │   Tenant C      ││
│  │  (Município 1)  │ │  (Município 2)  │ │  (Município 3)  ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

- **Isolamento Total**: Cada município possui dados completamente separados
- **Configurações Personalizadas**: Temas, logos e domínios customizáveis
- **Planos Diferenciados**: Starter, Professional, Enterprise
- **Billing Automatizado**: Sistema de cobrança integrado

---

## 🏛️ Módulos Implementados

### Secretarias Municipais (13 Módulos)

#### 🏛️ 1. GABINETE DO PREFEITO
**Funcionalidades Principais:**
- Dashboard Executivo com KPIs gerenciais
- Gestão de Atendimentos e Audiências
- Sistema de Alertas Executivos
- Mapa de Demandas da Cidade
- Relatórios Executivos para Tomada de Decisão
- Ordens de Serviço para Secretarias
- Projetos Estratégicos da Gestão
- Agenda Executiva do Prefeito
- Monitoramento de KPIs Municipais
- Comunicação Oficial e Notas
- Auditoria e Transparência
- Configurações Gerais do Sistema

#### 🏥 2. SECRETARIA DE SAÚDE
**Funcionalidades Principais:**
- Dashboard com Métricas de Saúde
- Sistema de Atendimentos Médicos
- Agendamentos Médicos Online
- Controle de Estoque de Medicamentos
- Campanhas de Vacinação e Prevenção
- Programas de Saúde (Hiperdia, etc.)
- Encaminhamentos TFD (Tratamento Fora Domicílio)
- Gestão de Exames Médicos
- Controle de Agentes Comunitários (ACS)
- Transporte de Pacientes

#### 🎓 3. SECRETARIA DE EDUCAÇÃO
**Funcionalidades Principais:**
- Dashboard Educacional
- Sistema de Matrículas Online
- Gestão Escolar Integrada
- Transporte Escolar
- Merenda Escolar e Cardápios
- Registro de Ocorrências Escolares
- Calendário Escolar

#### 🤝 4. ASSISTÊNCIA SOCIAL
**Funcionalidades Principais:**
- Atendimentos Sociais
- Cadastro de Famílias Vulneráveis
- Gestão de CRAS e CREAS
- Programas Sociais
- Gerenciamento de Benefícios
- Entregas Emergenciais (Cestas Básicas)
- Registro de Visitas Domiciliares

#### 🎭 5. SECRETARIA DE CULTURA
**Funcionalidades Principais:**
- Gestão de Espaços Culturais
- Projetos e Editais Culturais
- Agenda de Eventos Culturais
- Cadastro de Grupos Artísticos
- Manifestações Culturais Populares
- Oficinas e Cursos Culturais

#### 🌾 6. SECRETARIA DE AGRICULTURA
**Funcionalidades Principais:**
- Dashboard Agrícola
- Atendimentos Rurais
- Cadastro de Produtores Rurais
- ATER - Assistência Técnica Rural
- Programas de Desenvolvimento Rural
- Cursos e Capacitações Rurais

#### ⚽ 7. SECRETARIA DE ESPORTES
**Funcionalidades Principais:**
- Dashboard Esportivo
- Atendimentos Esportivos
- Gestão de Equipes Esportivas
- Competições e Torneios
- Cadastro de Atletas Federados
- Escolinhas Esportivas
- Eventos Esportivos
- Gestão de Infraestrutura Esportiva

#### 🏖️ 8. SECRETARIA DE TURISMO
**Funcionalidades Principais:**
- Dashboard Turístico
- Atendimentos Turísticos
- Cadastro de Pontos Turísticos
- Estabelecimentos Turísticos Locais
- Programas Turísticos
- Mapa Turístico Interativo
- Central de Informações Turísticas

#### 🏠 9. SECRETARIA DE HABITAÇÃO
**Funcionalidades Principais:**
- Dashboard Habitacional
- Atendimentos Habitacionais
- Inscrições em Programas Habitacionais
- Gestão de Programas Habitacionais
- Controle de Unidades Habitacionais
- Regularização Fundiária

#### 🌱 10. SECRETARIA DE MEIO AMBIENTE
**Funcionalidades Principais:**
- Atendimentos Ambientais
- Licenciamento Ambiental
- Sistema de Denúncias Ambientais
- Gestão de Áreas Protegidas
- Programas Ambientais

#### 🏗️ 11. PLANEJAMENTO URBANO
**Funcionalidades Principais:**
- Atendimentos de Planejamento
- Aprovação de Projetos
- Emissão de Alvarás
- Reclamações e Denúncias Urbanas
- Consultas Públicas
- Mapa Urbano Interativo

#### 🚧 12. OBRAS PÚBLICAS
**Funcionalidades Principais:**
- Dashboard de Obras
- Atendimentos de Obras
- Gestão de Obras e Intervenções
- Acompanhamento do Progresso de Obras
- Mapa de Obras da Cidade

#### 🧹 13. SERVIÇOS PÚBLICOS
**Funcionalidades Principais:**
- Dashboard de Serviços Públicos
- Atendimentos de Serviços
- Iluminação Pública
- Limpeza Urbana
- Coleta Especial
- Problemas com Geolocalização e Foto
- Programação de Equipes

#### 🚔 14. SEGURANÇA PÚBLICA
**Funcionalidades Principais:**
- Atendimentos de Segurança
- Registro de Ocorrências
- Apoio à Guarda Municipal
- Mapa de Pontos Críticos
- Sistema de Alertas de Segurança
- Estatísticas Regionais de Segurança
- Vigilância Integrada

### Módulos Transversais

#### 👥 ADMINISTRAÇÃO GERAL
- Gerenciamento de Usuários
- Perfis e Permissões
- Setores e Grupos
- Configurações Gerais
- Auditoria de Acessos

#### 📧 CORREIO INTERNO
- Caixa de Entrada
- Caixa de Saída
- Criação de Emails
- Rascunhos
- Lixeira
- Biblioteca de Modelos
- Assinaturas Digitais

#### 📊 RELATÓRIOS E ANALYTICS
- Relatórios Customizáveis
- Indicadores de Atendimentos
- Estatísticas de Uso do Sistema
- Exportações (PDF, Excel)

---

## 👥 Sistema de Usuários

### Hierarquia de Usuários (8 Níveis)

```
🔴 Nível 8 - SUPER ADMIN    │ Controle total do sistema SaaS
🟠 Nível 7 - ADMIN          │ Administrador do município
🟡 Nível 6 - SECRETÁRIO     │ Secretário de pasta específica
🟢 Nível 5 - DIRETOR        │ Diretor de unidade/departamento
🔵 Nível 4 - COORDENADOR    │ Coordenador de área
🟣 Nível 3 - FUNCIONÁRIO    │ Funcionário público comum
🟤 Nível 2 - ATENDENTE      │ Atendente de balcão
⚪ Nível 1 - CIDADÃO        │ Cidadão/munícipe
```

### Sistema de Permissões

- **Permissões Granulares**: Controle específico por módulo e ação
- **RLS (Row Level Security)**: Segurança a nível de linha no banco
- **Auditoria Completa**: Log de todas as ações realizadas
- **Controle Hierárquico**: Acesso baseado na hierarquia funcional

---

## 🌐 Portais de Acesso

### 🔧 Portal Super Admin (`/super-admin/*`)
**Gestão Completa do SaaS:**
- Dashboard Geral do Sistema
- Gestão de Tenants (Municípios)
- Gestão de Usuários Globais
- Sistema de Cobrança e Billing
- Analytics Globais
- Monitoramento do Sistema
- Operações e Manutenção
- Configurações Globais

### 🏛️ Portal Administrativo (`/admin/*`)
**Para Funcionários Públicos:**
- Acesso a todas as 13 secretarias
- Dashboard específico por secretaria
- Sistema de protocolos
- Correio interno
- Relatórios e estatísticas
- Configurações pessoais

### 👨‍👩‍👧‍👦 Portal do Cidadão (`/cidadao/*`)
**Para Munícipes:**
- Dashboard do Cidadão
- Catálogo de Serviços Municipais
- Solicitação de Serviços Online
- Acompanhamento de Protocolos
- Área de Documentos Pessoais
- Sistema de Avaliação de Serviços
- Notificações em Tempo Real

---

## 🛠️ Tecnologias

### Frontend
```json
{
  "core": {
    "react": "18.3.1",
    "typescript": "5.4.5",
    "vite": "5.4.1"
  },
  "ui": {
    "tailwindcss": "3.4.11",
    "@radix-ui": "latest",
    "lucide-react": "0.462.0"
  },
  "state": {
    "@tanstack/react-query": "5.56.2",
    "react-router-dom": "6.26.2"
  },
  "charts": {
    "recharts": "2.12.7",
    "@nivo/bar": "0.98.0",
    "@nivo/line": "0.98.0",
    "@nivo/pie": "0.98.0"
  }
}
```

### Backend e Infraestrutura
```json
{
  "database": "PostgreSQL (Supabase)",
  "auth": "Supabase Auth + Sistema Próprio",
  "storage": "Supabase Storage",
  "realtime": "Supabase Realtime",
  "email": "Sistema próprio SMTP",
  "deploy": "Docker + Nginx"
}
```

---

## 🚀 Instalação

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Instância do Supabase configurada

### Instalação Local

```bash
# Clone o repositório
git clone <repository-url>
cd digiurban2

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Execute em modo desenvolvimento
npm run dev
```

### Configuração do Banco de Dados

```bash
# Execute os scripts SQL na ordem:
cd database-setup

# 1. Schema principal
psql -f 01_schema_completo_fase4.sql

# 2. Dados iniciais
psql -f 02_dados_iniciais_completos.sql

# 3. Módulos secundários
psql -f 03_schema_modulos_secundarios_completo.sql

# 4. Módulos restantes
psql -f 04_schema_modulos_restantes_completo.sql

# 5. Testes de integridade
psql -f 05_testes_integridade_performance.sql
```

---

## ⚙️ Configuração

### Variáveis de Ambiente

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role

# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha

# Sistema
PORT=5000
NODE_ENV=production
```

### Estrutura de Configuração

```
src/
├── config/
│   ├── auth.ts          # Configurações de autenticação
│   └── demo-credentials.ts # Credenciais de demonstração
├── lib/
│   ├── supabase.ts      # Cliente Supabase
│   └── utils.ts         # Utilitários gerais
└── types/
    └── *.ts             # Definições de tipos por módulo
```

---

## 🐳 Deploy

### Deploy com Docker

```bash
# Build da imagem
docker build -t digiurban2 .

# Execute o container
docker run -p 80:80 -d digiurban2
```

### Deploy em Produção

```bash
# Build para produção
npm run build

# Deploy dos arquivos estáticos
# Os arquivos estarão na pasta dist/
```

### Configuração do Nginx

```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://backend:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 📚 Documentação Técnica

### Estrutura do Projeto

```
digiurban2/
├── src/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── ui/             # Componentes base (Shadcn/UI)
│   │   ├── landing/        # Componentes da landing page
│   │   ├── auth/           # Componentes de autenticação
│   │   └── ...
│   ├── pages/              # Páginas da aplicação
│   │   ├── gabinete/       # Páginas do gabinete
│   │   ├── saude/          # Páginas da saúde
│   │   ├── educacao/       # Páginas da educação
│   │   └── ...             # Uma pasta por secretaria
│   ├── hooks/              # Hooks customizados
│   ├── lib/                # Utilitários e configurações
│   ├── services/           # Serviços de API
│   ├── types/              # Definições de tipos TypeScript
│   └── utils/              # Funções utilitárias
├── database-setup/         # Scripts SQL do banco
└── public/                 # Arquivos estáticos
```

### Padrões de Desenvolvimento

#### Nomenclatura de Componentes
```typescript
// ✅ Correto
export default function SaudeAtendimentos() { ... }

// ✅ Correto para hooks
export function useSaudeAtendimentos() { ... }

// ✅ Correto para tipos
export interface AtendimentoSaude { ... }
```

#### Estrutura de Páginas
```typescript
// Estrutura padrão de uma página de módulo
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ModuloFuncionalidade() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Título da Página</h1>
        <Button>Ação Principal</Button>
      </div>
      
      {/* Conteúdo da página */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Cards, tabelas, formulários, etc. */}
      </div>
    </div>
  );
}
```

### Sistema de Roteamento

```typescript
// Estrutura de rotas por portal
const routes = {
  superAdmin: '/super-admin/*',
  admin: '/admin/*',
  cidadao: '/cidadao/*',
  public: '/'
};

// Proteção de rotas por nível de usuário
<AdminRoute>        // Nível 7+
<SuperAdminRoute>   // Nível 8
<CitizenRoute>      // Nível 1+
<ProtectedRoute>    // Qualquer usuário logado
```

### Hooks Padronizados

```typescript
// Padrão de hook por módulo
export function useModuloFuncionalidade() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['modulo', 'funcionalidade'],
    queryFn: () => fetchFuncionalidade()
  });

  const mutation = useMutation({
    mutationFn: createFuncionalidade,
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries(['modulo']);
    }
  });

  return {
    data,
    isLoading,
    error,
    create: mutation.mutate,
    isCreating: mutation.isPending
  };
}
```

---

## 🔒 Segurança

### Autenticação
- **AuthV2**: Sistema moderno de autenticação
- **JWT Tokens**: Tokens seguros com refresh automático
- **Session Management**: Gestão segura de sessões
- **Multi-device**: Suporte a múltiplos dispositivos

### Autorização
- **RLS (Row Level Security)**: Políticas a nível de banco
- **Hierarchical Access**: Controle baseado em hierarquia
- **Feature Flags**: Controle granular de funcionalidades
- **Audit Trail**: Rastreamento completo de ações

### Dados
- **Encryption**: Dados sensíveis criptografados
- **Data Isolation**: Isolamento completo por tenant
- **Backup Strategy**: Estratégia robusta de backup
- **LGPD Compliance**: Conformidade com LGPD

---

## 📊 Monitoramento

### Métricas Principais
- **Performance**: Tempo de resposta das páginas
- **Uptime**: Disponibilidade do sistema
- **Usage**: Estatísticas de uso por módulo
- **Errors**: Monitoramento de erros em tempo real

### Dashboards
- **Super Admin Dashboard**: Visão geral do SaaS
- **Municipality Dashboard**: Métricas por município
- **Module Dashboards**: Específicos por secretaria
- **User Analytics**: Comportamento dos usuários

---

## 🤝 Contribuição

### Padrões de Código
1. **TypeScript**: Sempre tipado, nunca `any`
2. **ESLint**: Seguir as regras configuradas
3. **Prettier**: Formatação automática
4. **Commits**: Seguir conventional commits

### Fluxo de Desenvolvimento
1. **Feature Branch**: Uma branch por funcionalidade
2. **Pull Request**: Review obrigatório
3. **Tests**: Testes antes de merge
4. **Documentation**: Documentar mudanças

---

## 📄 Licença

Este projeto é proprietário e confidencial. Todos os direitos reservados.

---

## 📞 Suporte

### Contato Técnico
- **Email**: suporte@digiurban.com.br
- **Documentação**: [docs.digiurban.com.br](https://docs.digiurban.com.br)
- **Portal**: [app.digiurban.com.br](https://app.digiurban.com.br)

### Níveis de Suporte
- **Básico**: Email e documentação
- **Profissional**: Suporte prioritário
- **Enterprise**: Suporte dedicado 24/7

---

<div align="center">

**DigiUrban2** - Transformando a Gestão Municipal através da Tecnologia

*Desenvolvido com ❤️ para modernizar a administração pública brasileira*

</div>