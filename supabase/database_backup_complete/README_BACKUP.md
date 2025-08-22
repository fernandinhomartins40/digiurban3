# 🚀 BACKUP COMPLETO SUPABASE DIGIURBAN2

## 📋 Resumo do Backup

**Data de Extração:** 18/08/2025 21:56  
**Projeto:** warbeochfoabfptvvtpu  
**URL:** https://warbeochfoabfptvvtpu.supabase.co  
**Versão:** DigiUrban2 v4.0  

## 📁 Estrutura do Backup

```
database_backup_complete/
├── 📄 README_BACKUP.md (este arquivo)
├── 🗄️ schema_completo_digiurban2.sql (5.340 linhas - SCHEMA PRINCIPAL)
├── 📊 schema/
│   └── 01_complete_schema_export.json (metadados via edge function)
├── 💾 data/
│   ├── tenants_data.json (1 registro - tenant teste)
│   ├── user_profiles_data.json (0 registros)
│   └── secretarias_data.json (0 registros)
├── ⚡ edge_functions/
│   ├── export-schema/ (função para extrair schema)
│   └── seed-test-users/ (função para criar usuários teste)
├── 📁 migrations/ (15 migrações SQL)
│   ├── 20250818163513_*.sql (schema inicial)
│   ├── 20250818163650_*.sql (user profiles e auth)
│   ├── ... (demais migrações)
│   ├── 20250818214823_*.sql (tabelas core: anexos, notificações, audit)
│   └── 20250818214932_*.sql (versão corrigida)
├── 🔒 policies/ (políticas RLS)
├── ⚙️ functions/ (functions PostgreSQL)
├── 🔄 triggers/ (triggers do banco)
├── 👁️ views/ (views do sistema)
└── 📦 storage/ (configurações de storage)
```

## 🏗️ Schema Completo Extraído

### **Extensões PostgreSQL**
- `uuid-ossp` - Geração de UUIDs
- `pg_trgm` - Busca textual com trigrams
- `unaccent` - Remoção de acentos

### **Types e Enums (7 tipos)**
```sql
- status_base_enum ('ativo', 'inativo', 'pendente', 'suspenso')
- status_tenant_enum ('ativo', 'suspenso', 'cancelado', 'trial')
- status_processo_enum (10 status de protocolos)
- status_agendamento_enum (7 status de agendamentos)
- prioridade_enum ('baixa', 'media', 'alta', 'urgente', 'critica')
- user_tipo_enum (8 tipos: super_admin até cidadao)
- tenant_plano_enum ('starter', 'professional', 'enterprise')
```

### **Tabelas Principais (9 tabelas)**

#### **1. Sistema Multi-tenant**
- `tenants` - Configuração dos municípios
- `user_profiles` - Perfis e permissões de usuários
- `secretarias` - Estrutura organizacional

#### **2. Gestão de Protocolos**
- `protocolos` - Sistema central de protocolos
- `protocolos_historico` - Histórico de alterações
- `anexos` - Arquivos anexados

#### **3. Sistema de Notificações**
- `notificacoes` - Notificações em tempo real

#### **4. Auditoria e Controle**
- `audit_logs` - Log completo de auditoria
- `user_sessions` - Controle de sessões

### **Functions PostgreSQL**
- `gerar_numero_protocolo()` - Gera números sequenciais
- `handle_new_user()` - Trigger para novos usuários
- `update_updated_at_column()` - Atualiza timestamps
- `audit_table_changes()` - Auditoria automática

### **Triggers Implementados**
- Auto-geração de números de protocolo
- Atualização automática de `updated_at`
- Trigger para criação de perfil de usuário
- Auditoria automática de mudanças

### **Políticas RLS (Row Level Security)**
- Isolamento completo por tenant
- Acesso super_admin bypass
- Políticas específicas por tipo de usuário
- Proteção de dados sensíveis

### **Storage Configurado**
- **Bucket `avatars`** (público)
  - Upload/update/delete por usuário próprio
  - Acesso público para visualização
- **Bucket `anexos`** (privado)
  - Acesso restrito por tenant
  - Controle via RLS

## 🔄 Edge Functions

### **1. export-schema**
Função para exportar metadados do schema:
- Tabelas e estrutura
- Políticas RLS
- Functions e triggers
- Índices e constraints
- Storage buckets

### **2. seed-test-users**
Função para criar usuários de teste:
- Um usuário para cada tipo (8 tipos)
- Auto-confirmação de email
- Vinculação automática ao tenant
- Permissões configuradas

## 📊 Estado Atual dos Dados

### **Tenants**
- 1 registro: "Município de Teste"
- Status: ativo
- Plano: professional
- Módulos habilitados: protocolos, usuários, gabinete, saúde, educação, relatórios

### **Usuários**
- 0 registros em user_profiles
- Sistema pronto para criação via edge function

### **Secretarias**
- 0 registros
- Estrutura pronta para cadastro

## 🚀 Como Restaurar

### **1. Restauração Completa**
```bash
# Aplicar schema principal
psql -h db.xxx.supabase.co -p 5432 -d postgres -U postgres -f schema_completo_digiurban2.sql

# Deploy edge functions
supabase functions deploy export-schema
supabase functions deploy seed-test-users
```

### **2. Restauração por Partes**
```bash
# Aplicar migrações em ordem
ls migrations/*.sql | sort | xargs -I {} psql [...] -f {}
```

### **3. Criar Usuários de Teste**
```javascript
// Via edge function
const { data } = await supabase.functions.invoke('seed-test-users')
```

## ⚠️ Notas Importantes

1. **Schema Evolutivo**: O backup contém 15 migrações sequenciais
2. **RLS Ativo**: Todas as tabelas têm Row Level Security
3. **Multi-tenant**: Isolamento completo por município
4. **Auditoria**: Log automático de todas as alterações
5. **Storage**: Buckets configurados com políticas de segurança

## 🛡️ Segurança

- ✅ Políticas RLS em todas as tabelas
- ✅ Functions com SECURITY DEFINER
- ✅ Isolamento por tenant
- ✅ Auditoria completa
- ✅ Controle de sessões
- ✅ Storage com acesso controlado

## 📞 Credenciais de Teste

Após executar a edge function `seed-test-users`:

```
SUPER_ADMIN: superadmin@digiurban.com.br | password123
ADMIN: admin@digiurban.com.br | password123
SECRETARIO: secretario@digiurban.com.br | password123
DIRETOR: diretor@digiurban.com.br | password123
COORDENADOR: coordenador@digiurban.com.br | password123
FUNCIONARIO: funcionario@digiurban.com.br | password123
ATENDENTE: atendente@digiurban.com.br | password123
CIDADAO: cidadao@digiurban.com.br | password123
```

---

**🎉 Backup 100% Completo e Pronto para Restauração!**