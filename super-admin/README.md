# 🚀 DigiUrban Super Admin Panel

Painel de Administração Multi-Tenant para a plataforma DigiUrban SaaS.

## 📋 Funcionalidades

### 🔐 Autenticação Segura
- Login exclusivo para Super Admins
- Integração com Supabase Auth
- Verificação de permissões em tempo real
- Logs de acesso automatizados

### 📊 Dashboard Completo
- Visão geral de métricas da plataforma
- Total de tenants, usuários e protocolos
- Receita mensal recorrente (MRR)
- Atividade recente do sistema

### 🏢 Gestão de Tenants
- Lista completa de prefeituras cadastradas
- Filtros por status, plano, localização
- Visualização de métricas por tenant
- Gestão de planos (STARTER, PROFESSIONAL, ENTERPRISE)

### 📋 Sistema de Logs
- Auditoria completa de ações
- Filtros por status, data, usuário
- Monitoramento de segurança
- Rastreamento de atividades críticas

## 🛠️ Tecnologias

- **Frontend:** Next.js 14, React 18, TypeScript
- **UI:** Tailwind CSS, Headless UI
- **Ícones:** Lucide React
- **Backend:** Supabase (PostgreSQL + Auth)
- **Deploy:** Vercel (recomendado)

## 🚀 Instalação e Configuração

### 1. Pré-requisitos
```bash
# Node.js 18+
node --version

# PostgreSQL com Supabase configurado
# Super Admin criado no banco de dados
```

### 2. Instalar Dependências
```bash
cd super-admin
npm install
```

### 3. Configurar Variáveis de Ambiente
Edite o arquivo `.env.local`:

```env
# Configurações do Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8167  # Ou sua URL do Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# JWT Secret (mesmo do Supabase)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# URL do Super Painel
NEXTAUTH_URL=http://localhost:3000
```

### 4. Criar Super Admin
Execute o script SQL para criar seu usuário:

```bash
# No diretório database-setup
psql -d digiurban -f 23_criar_super_admin.sql
```

### 5. Iniciar Aplicação
```bash
npm run dev
```

Acesse: `http://localhost:3000`

## 📁 Estrutura do Projeto

```
super-admin/
├── app/                    # App Router (Next.js 13+)
│   ├── dashboard/         # Dashboard principal
│   ├── tenants/           # Gestão de tenants
│   ├── logs/              # Logs de auditoria
│   ├── login/             # Página de login
│   └── globals.css        # Estilos globais
├── components/            # Componentes reutilizáveis
│   └── Layout.tsx         # Layout principal
├── lib/                   # Utilitários e configurações
│   ├── supabase.ts        # Cliente Supabase + Types
│   └── auth.ts            # Funções de autenticação
├── public/                # Assets estáticos
└── README.md              # Este arquivo
```

## 🔐 Credenciais Padrão

**Email:** fernandinhomartins040@gmail.com  
**Senha:** Nando157940/!

> ⚠️ **IMPORTANTE:** Altere estas credenciais em produção!

## 📊 Funcionalidades por Página

### Dashboard (`/dashboard`)
- **Métricas Gerais:** Total de tenants, usuários, protocolos
- **Receita:** MRR (Monthly Recurring Revenue)
- **Atividade Recente:** Últimas 10 ações do sistema
- **Performance:** Tempo de resposta, uptime

### Tenants (`/tenants`)
- **Lista Completa:** Todas as prefeituras cadastradas
- **Filtros:** Status, plano, localização, pesquisa
- **Ações:** Visualizar, editar, suspender tenants
- **Métricas:** MRR total, tenants ativos/trial

### Logs (`/logs`)
- **Auditoria Completa:** Todos os eventos do sistema
- **Filtros:** Status (sucesso/erro/aviso), data, usuário
- **Detalhes:** IP, user agent, dados adicionais
- **Estatísticas:** Total, sucessos, erros por período

## 🎨 Temas e Customização

### Cores do Sistema
- **Primária:** Blue-600 (#2563eb)
- **Sucesso:** Green-600 (#16a34a)
- **Aviso:** Yellow-600 (#d97706)
- **Erro:** Red-600 (#dc2626)

### Componentes CSS Customizados
```css
.btn-primary      # Botão primário
.btn-secondary    # Botão secundário
.card             # Card container
.input            # Campo de entrada
.status-badge     # Badge de status
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar produção
npm run start

# Lint
npm run lint
```

## 🚀 Deploy

### Vercel (Recomendado)
```bash
# Instalar CLI da Vercel
npm i -g vercel

# Deploy
vercel --prod
```

### Variáveis de Ambiente no Deploy
Configure no painel da Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXTAUTH_URL`

## 🛡️ Segurança

### Medidas Implementadas
- ✅ Autenticação obrigatória para Super Admin
- ✅ Verificação de permissões em cada página
- ✅ Logs de auditoria de todas as ações
- ✅ Sanitização de inputs
- ✅ HTTPS obrigatório em produção

### Recomendações Adicionais
- Configurar rate limiting no Supabase
- Implementar 2FA para Super Admins
- Monitorar tentativas de login suspeitas
- Backup regular dos logs de auditoria

## 🐛 Troubleshooting

### Erro de Conexão com Supabase
```bash
# Verificar se as variáveis estão corretas
echo $NEXT_PUBLIC_SUPABASE_URL
```

### Super Admin não consegue fazer login
```sql
-- Verificar se o usuário existe
SELECT * FROM user_profiles WHERE tipo_usuario = 'super_admin';
```

### Logs não aparecem
```sql
-- Verificar se a tabela tenant_logs existe
SELECT COUNT(*) FROM tenant_logs;
```

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar os logs do console do navegador
2. Consultar a documentação do Supabase
3. Verificar as configurações de RLS no banco

## 📄 Licença

Este projeto é parte do DigiUrban SaaS Platform.

---

**DigiUrban Super Admin Panel v1.0.0**  
Desenvolvido com ❤️ para administradores de plataforma.