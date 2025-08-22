-- ====================================================================
-- DIGIURBAN2 - BACKUP COMPLETO DO BANCO DE DADOS
-- ====================================================================
-- Data de backup: 2025-08-18T21:56:49.367Z
-- Projeto: warbeochfoabfptvvtpu
-- URL: https://warbeochfoabfptvvtpu.supabase.co
-- ====================================================================
-- 
-- Este arquivo contém o schema completo do banco DigiUrban2
-- incluindo todas as migrações aplicadas em ordem cronológica
--
-- ====================================================================


-- ====================================================================
-- MIGRAÇÃO: 20250818163513_2ce2bc24-3bf2-454b-aa51-b99546e06a48.sql
-- ====================================================================

-- =====================================================
-- DIGIURBAN - SCHEMA COMPLETO INICIAL
-- Sistema Multi-tenant de Gestão Municipal
-- =====================================================

-- 1. EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- 2. TIPOS ENUMS PADRONIZADOS
CREATE TYPE status_base_enum AS ENUM ('ativo', 'inativo', 'pendente', 'suspenso');
CREATE TYPE status_tenant_enum AS ENUM ('ativo', 'suspenso', 'cancelado', 'trial');
CREATE TYPE status_processo_enum AS ENUM ('aberto', 'em_andamento', 'aguardando_documentos', 'aguardando_aprovacao', 'aprovado', 'rejeitado', 'concluido', 'cancelado', 'suspenso', 'em_revisao');
CREATE TYPE status_agendamento_enum AS ENUM ('agendado', 'confirmado', 'em_andamento', 'concluido', 'cancelado', 'nao_compareceu', 'reagendado');
CREATE TYPE prioridade_enum AS ENUM ('baixa', 'media', 'alta', 'urgente', 'critica');
CREATE TYPE user_tipo_enum AS ENUM ('super_admin', 'admin', 'secretario', 'diretor', 'coordenador', 'supervisor', 'operador', 'cidadao');
CREATE TYPE tenant_plano_enum AS ENUM ('starter', 'professional', 'enterprise');

-- 3. TABELA TENANTS (Multi-tenancy)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_code VARCHAR(20) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  cnpj VARCHAR(18) UNIQUE,
  
  -- Localização
  cidade VARCHAR(100) NOT NULL,
  estado VARCHAR(2) NOT NULL,
  regiao VARCHAR(20) DEFAULT 'Sudeste',
  populacao INTEGER DEFAULT 0,
  
  -- Contato
  email VARCHAR(255),
  telefone VARCHAR(20),
  endereco JSONB,
  website VARCHAR(255),
  
  -- Configurações visuais
  logo_url TEXT,
  cores_tema JSONB DEFAULT '{
    "primary": "#1f2937",
    "secondary": "#3b82f6", 
    "accent": "#10b981",
    "background": "#ffffff"
  }'::JSONB,
  
  -- Plano e limites
  plano tenant_plano_enum DEFAULT 'starter',
  data_ativacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_vencimento TIMESTAMP,
  usuarios_max INTEGER DEFAULT 50,
  protocolos_max INTEGER DEFAULT 1000,
  storage_max_gb INTEGER DEFAULT 10,
  
  -- Módulos habilitados
  modulos_habilitados TEXT[] DEFAULT ARRAY[
    'protocolos', 'usuarios', 'gabinete', 'saude', 'educacao', 'relatorios'
  ],
  
  -- Configurações do sistema
  configuracoes JSONB DEFAULT '{
    "horario_funcionamento": {
      "segunda": {"inicio": "08:00", "fim": "17:00"},
      "terca": {"inicio": "08:00", "fim": "17:00"},
      "quarta": {"inicio": "08:00", "fim": "17:00"},
      "quinta": {"inicio": "08:00", "fim": "17:00"},
      "sexta": {"inicio": "08:00", "fim": "17:00"}
    },
    "timezone": "America/Sao_Paulo",
    "idioma": "pt-BR"
  }'::JSONB,
  
  -- Responsável
  responsavel JSONB,
  
  -- Status e uso
  status status_tenant_enum DEFAULT 'trial',
  uso_atual JSONB DEFAULT '{
    "usuarios_ativos": 0,
    "protocolos_mes_atual": 0,
    "storage_usado_gb": 0
  }'::JSONB,
  
  -- Auditoria
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABELA USER_PROFILES (Perfis de usuários)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Dados pessoais
  nome_completo VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  cpf VARCHAR(11),
  telefone VARCHAR(20),
  data_nascimento DATE,
  
  -- Endereço
  endereco JSONB,
  
  -- Dados profissionais
  cargo VARCHAR(100),
  departamento VARCHAR(100),
  secretaria_id UUID,
  setor_id UUID,
  supervisor_id UUID REFERENCES user_profiles(id),
  
  -- Autenticação e autorização
  tipo_usuario user_tipo_enum DEFAULT 'operador',
  permissoes TEXT[] DEFAULT '{}',
  secretarias_acesso TEXT[] DEFAULT '{}',
  
  -- Profile
  avatar_url TEXT,
  bio TEXT,
  preferencias JSONB DEFAULT '{
    "notificacoes_email": true,
    "notificacoes_push": true,
    "tema": "light",
    "idioma": "pt-BR"
  }'::JSONB,
  
  -- Horário de trabalho
  horario_trabalho JSONB,
  
  -- Status e controle de acesso
  status status_base_enum DEFAULT 'ativo',
  primeiro_acesso BOOLEAN DEFAULT TRUE,
  senha_temporaria BOOLEAN DEFAULT FALSE,
  ultimo_login TIMESTAMP,
  tentativas_login INTEGER DEFAULT 0,
  bloqueado_ate TIMESTAMP,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABELA SECRETARIAS
CREATE TABLE secretarias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Identificação
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  sigla VARCHAR(10) NOT NULL,
  descricao TEXT,
  
  -- Configurações visuais
  cor_tema VARCHAR(7) DEFAULT '#3b82f6',
  icone VARCHAR(50) DEFAULT 'building',
  
  -- Responsáveis
  secretario_id UUID REFERENCES user_profiles(id),
  vice_secretario_id UUID REFERENCES user_profiles(id),
  
  -- Contato
  telefone VARCHAR(20),
  email VARCHAR(255),
  endereco JSONB,
  
  -- Serviços oferecidos
  categorias_servicos TEXT[] DEFAULT '{}',
  servicos_oferecidos JSONB DEFAULT '[]',
  
  -- Horário de funcionamento
  horario_funcionamento JSONB DEFAULT '{
    "segunda": {"inicio": "08:00", "fim": "17:00", "ativo": true},
    "terca": {"inicio": "08:00", "fim": "17:00", "ativo": true},
    "quarta": {"inicio": "08:00", "fim": "17:00", "ativo": true},
    "quinta": {"inicio": "08:00", "fim": "17:00", "ativo": true},
    "sexta": {"inicio": "08:00", "fim": "17:00", "ativo": true},
    "sabado": {"inicio": "08:00", "fim": "12:00", "ativo": false},
    "domingo": {"ativo": false}
  }'::JSONB,
  
  -- Orçamento e metas
  orcamento_anual DECIMAL(15,2),
  meta_atendimentos_mes INTEGER DEFAULT 100,
  
  -- Status
  status status_base_enum DEFAULT 'ativo',
  visivel_portal BOOLEAN DEFAULT TRUE,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. TABELA PROTOCOLOS (Sistema central de protocolos)
CREATE TABLE protocolos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Identificação
  numero_protocolo VARCHAR(20) UNIQUE NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  subcategoria VARCHAR(100),
  
  -- Origem e destino
  secretaria_origem_id UUID NOT NULL REFERENCES secretarias(id),
  secretaria_destino_id UUID REFERENCES secretarias(id),
  setor_origem VARCHAR(100),
  setor_destino VARCHAR(100),
  
  -- Solicitante (cidadão)
  solicitante JSONB NOT NULL,
  representante_legal JSONB,
  
  -- Responsáveis
  criado_por_id UUID NOT NULL REFERENCES user_profiles(id),
  atribuido_para_id UUID REFERENCES user_profiles(id),
  supervisor_id UUID REFERENCES user_profiles(id),
  
  -- Dados específicos do processo
  dados_formulario JSONB DEFAULT '{}',
  documentos_exigidos TEXT[] DEFAULT '{}',
  documentos_anexados TEXT[] DEFAULT '{}',
  
  -- Localização (para serviços que envolvem endereços)
  localizacao_referencia JSONB,
  
  -- Prazos
  data_abertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_prazo TIMESTAMP,
  data_conclusao TIMESTAMP,
  prazo_dias INTEGER DEFAULT 30,
  
  -- Status e prioridade
  status status_processo_enum DEFAULT 'aberto',
  prioridade prioridade_enum DEFAULT 'media',
  urgente BOOLEAN DEFAULT FALSE,
  
  -- Financeiro
  taxa_servico DECIMAL(10,2) DEFAULT 0,
  valor_multa DECIMAL(10,2) DEFAULT 0,
  desconto_aplicado DECIMAL(10,2) DEFAULT 0,
  forma_pagamento VARCHAR(50),
  data_pagamento TIMESTAMP,
  comprovante_pagamento TEXT,
  
  -- Avaliação do cidadão
  avaliacao INTEGER CHECK (avaliacao >= 1 AND avaliacao <= 5),
  comentario_avaliacao TEXT,
  data_avaliacao TIMESTAMP,
  
  -- Observações
  observacoes_internas TEXT,
  observacoes_publicas TEXT,
  motivo_cancelamento TEXT,
  
  -- Auditoria
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. FUNÇÃO PARA GERAR NÚMERO DE PROTOCOLO
CREATE OR REPLACE FUNCTION gerar_numero_protocolo(p_tenant_id UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
  ano_atual INTEGER;
  sequencial INTEGER;
  numero_protocolo VARCHAR(20);
BEGIN
  ano_atual := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Buscar próximo sequencial do ano
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(numero_protocolo FROM 5 FOR 6) AS INTEGER)
  ), 0) + 1
  INTO sequencial
  FROM protocolos 
  WHERE tenant_id = p_tenant_id 
    AND numero_protocolo LIKE ano_atual::TEXT || '%';
  
  -- Gerar número no formato: AAAA999999 (ano + 6 dígitos)
  numero_protocolo := ano_atual::TEXT || LPAD(sequencial::TEXT, 6, '0');
  
  RETURN numero_protocolo;
END;
$$ LANGUAGE plpgsql;

-- 8. TRIGGER PARA AUTO-GERAR NÚMERO DO PROTOCOLO
CREATE OR REPLACE FUNCTION trigger_gerar_numero_protocolo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_protocolo IS NULL OR NEW.numero_protocolo = '' THEN
    NEW.numero_protocolo := gerar_numero_protocolo(NEW.tenant_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER protocolos_gerar_numero
  BEFORE INSERT ON protocolos
  FOR EACH ROW
  EXECUTE FUNCTION trigger_gerar_numero_protocolo();

-- 9. FUNÇÃO PARA ATUALIZAR updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. APLICAR TRIGGER DE updated_at NAS TABELAS PRINCIPAIS
CREATE TRIGGER tenants_update_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER user_profiles_update_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER secretarias_update_updated_at
  BEFORE UPDATE ON secretarias
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER protocolos_update_updated_at
  BEFORE UPDATE ON protocolos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ====================================================================
-- MIGRAÇÃO: 20250818163650_4b35cd37-96c1-4ef8-97a5-30cd0a67031e.sql
-- ====================================================================

-- =====================================================
-- CORREÇÃO DE SEGURANÇA E POLÍTICAS RLS
-- =====================================================

-- 1. CORRIGIR FUNÇÕES COM SEARCH_PATH
CREATE OR REPLACE FUNCTION gerar_numero_protocolo(p_tenant_id UUID)
RETURNS VARCHAR(20)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ano_atual INTEGER;
  sequencial INTEGER;
  numero_protocolo VARCHAR(20);
BEGIN
  ano_atual := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Buscar próximo sequencial do ano
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(numero_protocolo FROM 5 FOR 6) AS INTEGER)
  ), 0) + 1
  INTO sequencial
  FROM protocolos 
  WHERE tenant_id = p_tenant_id 
    AND numero_protocolo LIKE ano_atual::TEXT || '%';
  
  -- Gerar número no formato: AAAA999999 (ano + 6 dígitos)
  numero_protocolo := ano_atual::TEXT || LPAD(sequencial::TEXT, 6, '0');
  
  RETURN numero_protocolo;
END;
$$;

CREATE OR REPLACE FUNCTION trigger_gerar_numero_protocolo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.numero_protocolo IS NULL OR NEW.numero_protocolo = '' THEN
    NEW.numero_protocolo := gerar_numero_protocolo(NEW.tenant_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- 2. HABILITAR RLS EM TODAS AS TABELAS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE secretarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocolos ENABLE ROW LEVEL SECURITY;

-- 3. FUNÇÃO PARA OBTER TENANT_ID DO JWT
CREATE OR REPLACE FUNCTION auth.tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'tenant_id')::UUID,
    NULL
  );
END;
$$;

-- 4. FUNÇÃO PARA OBTER TIPO DE USUÁRIO
CREATE OR REPLACE FUNCTION auth.user_type()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.jwt.claims', true)::json->>'tipo_usuario',
    'cidadao'
  );
END;
$$;

-- 5. POLÍTICAS RLS PARA TENANTS
CREATE POLICY "Super admins têm acesso total aos tenants"
ON tenants
FOR ALL
TO authenticated
USING (auth.user_type() = 'super_admin');

CREATE POLICY "Usuários só veem seu próprio tenant"
ON tenants
FOR SELECT
TO authenticated
USING (id = auth.tenant_id());

-- 6. POLÍTICAS RLS PARA USER_PROFILES
CREATE POLICY "Super admins têm acesso total aos profiles"
ON user_profiles
FOR ALL
TO authenticated
USING (auth.user_type() = 'super_admin');

CREATE POLICY "Admins podem gerenciar profiles do seu tenant"
ON user_profiles
FOR ALL
TO authenticated
USING (
  auth.user_type() IN ('admin', 'secretario', 'diretor') 
  AND tenant_id = auth.tenant_id()
);

CREATE POLICY "Usuários podem ver e editar seu próprio profile"
ON user_profiles
FOR ALL
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Usuários podem ver profiles do mesmo tenant"
ON user_profiles
FOR SELECT
TO authenticated
USING (tenant_id = auth.tenant_id());

-- 7. POLÍTICAS RLS PARA SECRETARIAS
CREATE POLICY "Super admins têm acesso total às secretarias"
ON secretarias
FOR ALL
TO authenticated
USING (auth.user_type() = 'super_admin');

CREATE POLICY "Usuários podem ver secretarias do seu tenant"
ON secretarias
FOR SELECT
TO authenticated
USING (tenant_id = auth.tenant_id());

CREATE POLICY "Admins podem gerenciar secretarias do seu tenant"
ON secretarias
FOR INSERT, UPDATE, DELETE
TO authenticated
USING (
  auth.user_type() IN ('admin', 'secretario') 
  AND tenant_id = auth.tenant_id()
);

-- 8. POLÍTICAS RLS PARA PROTOCOLOS
CREATE POLICY "Super admins têm acesso total aos protocolos"
ON protocolos
FOR ALL
TO authenticated
USING (auth.user_type() = 'super_admin');

CREATE POLICY "Usuários podem ver protocolos do seu tenant"
ON protocolos
FOR SELECT
TO authenticated
USING (tenant_id = auth.tenant_id());

CREATE POLICY "Usuários autenticados podem criar protocolos"
ON protocolos
FOR INSERT
TO authenticated
WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY "Responsáveis podem editar protocolos atribuídos"
ON protocolos
FOR UPDATE
TO authenticated
USING (
  tenant_id = auth.tenant_id() 
  AND (
    atribuido_para_id = auth.uid() 
    OR criado_por_id = auth.uid()
    OR auth.user_type() IN ('admin', 'secretario', 'diretor')
  )
);

-- 9. FUNÇÃO PARA CRIAR PROFILE AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tenant_uuid UUID;
BEGIN
  -- Extrair tenant_id dos metadados do usuário ou usar default
  tenant_uuid := COALESCE(
    (NEW.raw_user_meta_data->>'tenant_id')::UUID,
    (SELECT id FROM tenants LIMIT 1) -- Fallback para o primeiro tenant
  );
  
  -- Inserir profile básico
  INSERT INTO user_profiles (
    id,
    tenant_id,
    nome_completo,
    email,
    tipo_usuario,
    status
  ) VALUES (
    NEW.id,
    tenant_uuid,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', NEW.email),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'tipo_usuario')::user_tipo_enum, 'cidadao'),
    'ativo'
  );
  
  RETURN NEW;
END;
$$;

-- 10. TRIGGER PARA CRIAR PROFILE AUTOMATICAMENTE
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ====================================================================
-- MIGRAÇÃO: 20250818163746_f09a7a43-b480-4f7b-ad7d-96e15bc38e98.sql
-- ====================================================================

-- =====================================================
-- CORREÇÃO DE SEGURANÇA E POLÍTICAS RLS (CORRIGIDA)
-- =====================================================

-- 1. CORRIGIR FUNÇÕES COM SEARCH_PATH
CREATE OR REPLACE FUNCTION gerar_numero_protocolo(p_tenant_id UUID)
RETURNS VARCHAR(20)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ano_atual INTEGER;
  sequencial INTEGER;
  numero_protocolo VARCHAR(20);
BEGIN
  ano_atual := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Buscar próximo sequencial do ano
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(numero_protocolo FROM 5 FOR 6) AS INTEGER)
  ), 0) + 1
  INTO sequencial
  FROM protocolos 
  WHERE tenant_id = p_tenant_id 
    AND numero_protocolo LIKE ano_atual::TEXT || '%';
  
  -- Gerar número no formato: AAAA999999 (ano + 6 dígitos)
  numero_protocolo := ano_atual::TEXT || LPAD(sequencial::TEXT, 6, '0');
  
  RETURN numero_protocolo;
END;
$$;

CREATE OR REPLACE FUNCTION trigger_gerar_numero_protocolo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.numero_protocolo IS NULL OR NEW.numero_protocolo = '' THEN
    NEW.numero_protocolo := gerar_numero_protocolo(NEW.tenant_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- 2. HABILITAR RLS EM TODAS AS TABELAS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE secretarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocolos ENABLE ROW LEVEL SECURITY;

-- 3. FUNÇÃO PARA OBTER TENANT_ID DO JWT
CREATE OR REPLACE FUNCTION auth.tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'tenant_id')::UUID,
    NULL
  );
END;
$$;

-- 4. FUNÇÃO PARA OBTER TIPO DE USUÁRIO
CREATE OR REPLACE FUNCTION auth.user_type()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.jwt.claims', true)::json->>'tipo_usuario',
    'cidadao'
  );
END;
$$;

-- 5. POLÍTICAS RLS PARA TENANTS
CREATE POLICY "Super admins podem gerenciar tenants"
ON tenants
FOR ALL
TO authenticated
USING (auth.user_type() = 'super_admin');

CREATE POLICY "Usuários só veem seu próprio tenant"
ON tenants
FOR SELECT
TO authenticated
USING (id = auth.tenant_id());

-- 6. POLÍTICAS RLS PARA USER_PROFILES
CREATE POLICY "Super admins podem gerenciar profiles"
ON user_profiles
FOR ALL
TO authenticated
USING (auth.user_type() = 'super_admin');

CREATE POLICY "Admins podem gerenciar profiles do tenant"
ON user_profiles
FOR ALL
TO authenticated
USING (
  auth.user_type() IN ('admin', 'secretario', 'diretor') 
  AND tenant_id = auth.tenant_id()
);

CREATE POLICY "Usuários podem editar próprio profile"
ON user_profiles
FOR ALL
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Usuários podem ver profiles do tenant"
ON user_profiles
FOR SELECT
TO authenticated
USING (tenant_id = auth.tenant_id());

-- 7. POLÍTICAS RLS PARA SECRETARIAS
CREATE POLICY "Super admins podem gerenciar secretarias"
ON secretarias
FOR ALL
TO authenticated
USING (auth.user_type() = 'super_admin');

CREATE POLICY "Usuários podem ver secretarias do tenant"
ON secretarias
FOR SELECT
TO authenticated
USING (tenant_id = auth.tenant_id());

CREATE POLICY "Admins podem inserir secretarias"
ON secretarias
FOR INSERT
TO authenticated
WITH CHECK (
  auth.user_type() IN ('admin', 'secretario') 
  AND tenant_id = auth.tenant_id()
);

CREATE POLICY "Admins podem atualizar secretarias"
ON secretarias
FOR UPDATE
TO authenticated
USING (
  auth.user_type() IN ('admin', 'secretario') 
  AND tenant_id = auth.tenant_id()
);

CREATE POLICY "Admins podem deletar secretarias"
ON secretarias
FOR DELETE
TO authenticated
USING (
  auth.user_type() IN ('admin', 'secretario') 
  AND tenant_id = auth.tenant_id()
);

-- 8. POLÍTICAS RLS PARA PROTOCOLOS
CREATE POLICY "Super admins podem gerenciar protocolos"
ON protocolos
FOR ALL
TO authenticated
USING (auth.user_type() = 'super_admin');

CREATE POLICY "Usuários podem ver protocolos do tenant"
ON protocolos
FOR SELECT
TO authenticated
USING (tenant_id = auth.tenant_id());

CREATE POLICY "Usuários podem criar protocolos"
ON protocolos
FOR INSERT
TO authenticated
WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY "Responsáveis podem editar protocolos"
ON protocolos
FOR UPDATE
TO authenticated
USING (
  tenant_id = auth.tenant_id() 
  AND (
    atribuido_para_id = auth.uid() 
    OR criado_por_id = auth.uid()
    OR auth.user_type() IN ('admin', 'secretario', 'diretor')
  )
);

-- 9. FUNÇÃO PARA CRIAR PROFILE AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tenant_uuid UUID;
BEGIN
  -- Extrair tenant_id dos metadados do usuário ou usar default
  tenant_uuid := COALESCE(
    (NEW.raw_user_meta_data->>'tenant_id')::UUID,
    (SELECT id FROM tenants LIMIT 1) -- Fallback para o primeiro tenant
  );
  
  -- Inserir profile básico
  INSERT INTO user_profiles (
    id,
    tenant_id,
    nome_completo,
    email,
    tipo_usuario,
    status
  ) VALUES (
    NEW.id,
    tenant_uuid,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', NEW.email),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'tipo_usuario')::user_tipo_enum, 'cidadao'),
    'ativo'
  );
  
  RETURN NEW;
END;
$$;

-- 10. TRIGGER PARA CRIAR PROFILE AUTOMATICAMENTE
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ====================================================================
-- MIGRAÇÃO: 20250818164848_053b1b50-c116-4da3-9796-324f756398da.sql
-- ====================================================================


-- =========================================================
-- MIGRAÇÃO NÚCLEO SUPABASE - MULTI-TENANT + PROTOCOLOS
-- Compatibilização com o frontend atual
-- ATENÇÃO: Não modifica schemas reservados (auth, storage etc.)
-- =========================================================

-- 0) Extensões úteis (idempotente)
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 1) Funções auxiliares (JWT)
create or replace function public.get_tenant_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claims json;
  t uuid;
begin
  claims := current_setting('request.jwt.claims', true)::json;
  if claims ? 'tenant_id' then
    t := (claims ->> 'tenant_id')::uuid;
  end if;
  return t;
end;
$$;

create or replace function public.get_user_type()
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claims json;
  r text;
begin
  claims := current_setting('request.jwt.claims', true)::json;
  if claims ? 'tipo_usuario' then
    r := (claims ->> 'tipo_usuario')::text;
  else
    r := null;
  end if;
  return r;
end;
$$;

-- 2) Tabela de serviços municipais (usada em criação de protocolos)
create table if not exists public.servicos_municipais (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  secretaria_id uuid not null,
  nome varchar not null,
  descricao text,
  categoria varchar,
  status varchar(20) not null default 'ativo',
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now()
);

-- 3) Ajustar tabela protocolos com colunas usadas pelo app (sem remover existentes)
-- Observação: colunas já existentes não serão alteradas; só adicionamos se faltarem
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='protocolos' and column_name='cidadao_id') then
    alter table public.protocolos add column cidadao_id uuid;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='protocolos' and column_name='servico_id') then
    alter table public.protocolos add column servico_id uuid;
  end if;

  -- Muitas telas usam "secretaria_id"; mapearemos coalesce(destino, origem) na view,
  -- mas adicionamos a coluna "secretaria_id" para compatibilidade com hooks genéricos
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='protocolos' and column_name='secretaria_id') then
    alter table public.protocolos add column secretaria_id uuid;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='protocolos' and column_name='funcionario_responsavel_id') then
    alter table public.protocolos add column funcionario_responsavel_id uuid;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='protocolos' and column_name='avaliacao_nota') then
    alter table public.protocolos add column avaliacao_nota integer;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='protocolos' and column_name='avaliacao_comentario') then
    alter table public.protocolos add column avaliacao_comentario text;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='protocolos' and column_name='avaliado_em') then
    alter table public.protocolos add column avaliado_em date;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='protocolos' and column_name='data_vencimento') then
    alter table public.protocolos add column data_vencimento date;
  end if;
end$$;

-- 4) Funções e triggers para protocolos (idempotente + seguro)
-- 4.1) Gerar número de protocolo por tenant e ano
create or replace function public.gerar_numero_protocolo(p_tenant_id uuid)
returns varchar
language plpgsql
security definer
set search_path = public
as $$
declare
  ano_atual integer;
  sequencial integer;
  numero varchar(20);
begin
  ano_atual := extract(year from current_date);
  select coalesce(max(cast(substring(numero_protocolo from 5 for 6) as integer)), 0) + 1
    into sequencial
  from public.protocolos
  where tenant_id = p_tenant_id
    and numero_protocolo like ano_atual::text || '%';

  numero := ano_atual::text || lpad(sequencial::text, 6, '0');
  return numero;
end;
$$;

create or replace function public.trigger_gerar_numero_protocolo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.numero_protocolo is null or new.numero_protocolo = '' then
    new.numero_protocolo := public.gerar_numero_protocolo(new.tenant_id);
  end if;
  return new;
end;
$$;

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = current_timestamp;
  return new;
end;
$$;

-- 4.2) Criar triggers em protocolos (idempotente)
do $$
begin
  if not exists (
    select 1 from pg_trigger 
     where tgname = 'before_insert_gerar_numero_protocolo'
  ) then
    create trigger before_insert_gerar_numero_protocolo
      before insert on public.protocolos
      for each row
      execute function public.trigger_gerar_numero_protocolo();
  end if;

  if not exists (
    select 1 from pg_trigger 
     where tgname = 'before_update_set_updated_at_protocolos'
  ) then
    create trigger before_update_set_updated_at_protocolos
      before update on public.protocolos
      for each row
      execute function public.update_updated_at_column();
  end if;
end$$;

-- 5) VIEW protocolos_completos compatível com o frontend
-- Observações: 
--  - assunto: usamos título quando houver, caindo para categoria
--  - cidadao_id: mapeado para criado_por_id (melhor proxy disponível)
--  - funcionario_responsavel_id: mapeado de atribuido_para_id
--  - secretaria_id: coalesce(destino, origem)
drop view if exists public.protocolos_completos;
create view public.protocolos_completos as
select
  p.id,
  p.tenant_id,
  p.numero_protocolo,
  coalesce(p.titulo, p.categoria) as assunto,
  p.descricao,
  p.status,
  p.prioridade,
  p.created_at,
  p.updated_at,
  coalesce(p.data_vencimento, p.data_prazo::date) as data_vencimento,
  p.data_conclusao::date as data_conclusao,
  coalesce(p.cidadao_id, p.criado_por_id) as cidadao_id,
  coalesce(p.funcionario_responsavel_id, p.atribuido_para_id) as funcionario_responsavel_id,
  coalesce(p.secretaria_id, coalesce(p.secretaria_destino_id, p.secretaria_origem_id)) as secretaria_id,
  p.servico_id,
  coalesce(p.avaliacao_nota, p.avaliacao) as avaliacao_nota,
  coalesce(p.avaliacao_comentario, p.comentario_avaliacao) as avaliacao_comentario,
  coalesce(p.avaliado_em, p.data_avaliacao::date) as avaliado_em
from public.protocolos p
where p.deleted_at is null or p.deleted_at is null; -- manter simples; ajuste se houver soft delete

-- 6) Tabela de atividades de usuário (auditoria leve)
create table if not exists public.user_activities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  user_id uuid not null,
  action text not null,
  details jsonb default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp without time zone not null default now()
);

-- 7) Realtime em protocolos
alter table public.protocolos replica identity full;
-- Adicionar à publicação realtime (idempotente)
do $$
begin
  if not exists (
    select 1 
      from pg_publication_tables 
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'protocolos'
  ) then
    alter publication supabase_realtime add table public.protocolos;
  end if;
end$$;

-- 8) Habilitar RLS
alter table if exists public.tenants enable row level security;
alter table if exists public.user_profiles enable row level security;
alter table if exists public.secretarias enable row level security;
alter table if exists public.servicos_municipais enable row level security;
alter table if exists public.protocolos enable row level security;
alter table if exists public.user_activities enable row level security;

-- 9) Policies multi-tenant (idempotentes: criadas se não existirem)

-- Helpers para idempotência de policy
do $$
begin
  -- TENANTS
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='tenants' and policyname='tenants_select_own') then
    create policy tenants_select_own
      on public.tenants
      for select
      to authenticated
      using (id = public.get_tenant_id() or public.get_user_type() = 'super_admin');
  end if;

  -- USER_PROFILES
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_profiles' and policyname='profiles_select') then
    create policy profiles_select
      on public.user_profiles
      for select
      to authenticated
      using (tenant_id = public.get_tenant_id() or id = auth.uid() or public.get_user_type() = 'super_admin');
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_profiles' and policyname='profiles_insert_admins') then
    create policy profiles_insert_admins
      on public.user_profiles
      for insert
      to authenticated
      with check (
        (public.get_user_type() in ('admin','secretario','diretor','super_admin'))
        and tenant_id = public.get_tenant_id()
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_profiles' and policyname='profiles_update_self_or_admin') then
    create policy profiles_update_self_or_admin
      on public.user_profiles
      for update
      to authenticated
      using (
        id = auth.uid() 
        or (tenant_id = public.get_tenant_id() and public.get_user_type() in ('admin','secretario','diretor','super_admin'))
      )
      with check (
        tenant_id = public.get_tenant_id()
      );
  end if;

  -- SECRETARIAS
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='secretarias' and policyname='secretarias_select_tenant') then
    create policy secretarias_select_tenant
      on public.secretarias
      for select
      to authenticated
      using (tenant_id = public.get_tenant_id() or public.get_user_type() = 'super_admin');
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='secretarias' and policyname='secretarias_crud_admins') then
    create policy secretarias_crud_admins
      on public.secretarias
      for all
      to authenticated
      using (tenant_id = public.get_tenant_id() and public.get_user_type() in ('admin','secretario','diretor','super_admin'))
      with check (tenant_id = public.get_tenant_id());
  end if;

  -- SERVICOS_MUNICIPAIS
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='servicos_municipais' and policyname='servicos_select_tenant') then
    create policy servicos_select_tenant
      on public.servicos_municipais
      for select
      to authenticated
      using (tenant_id = public.get_tenant_id() or public.get_user_type() = 'super_admin');
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='servicos_municipais' and policyname='servicos_crud_admins') then
    create policy servicos_crud_admins
      on public.servicos_municipais
      for all
      to authenticated
      using (tenant_id = public.get_tenant_id() and public.get_user_type() in ('admin','secretario','diretor','super_admin'))
      with check (tenant_id = public.get_tenant_id());
  end if;

  -- PROTOCOLOS
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='protocolos' and policyname='protocolos_select_scope') then
    create policy protocolos_select_scope
      on public.protocolos
      for select
      to authenticated
      using (
        tenant_id = public.get_tenant_id()
        and (
          -- autor ou responsável ou gestor
          criado_por_id = auth.uid()
          or atribuido_para_id = auth.uid()
          or public.get_user_type() in ('admin','secretario','diretor','super_admin')
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='protocolos' and policyname='protocolos_insert_check') then
    create policy protocolos_insert_check
      on public.protocolos
      for insert
      to authenticated
      with check (
        tenant_id = public.get_tenant_id()
        and (criado_por_id = auth.uid() or public.get_user_type() in ('admin','secretario','diretor','super_admin'))
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='protocolos' and policyname='protocolos_update_scope') then
    create policy protocolos_update_scope
      on public.protocolos
      for update
      to authenticated
      using (
        tenant_id = public.get_tenant_id()
        and (
          criado_por_id = auth.uid()
          or atribuido_para_id = auth.uid()
          or public.get_user_type() in ('admin','secretario','diretor','super_admin')
        )
      )
      with check (tenant_id = public.get_tenant_id());
  end if;

  -- USER_ACTIVITIES
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_activities' and policyname='activities_insert') then
    create policy activities_insert
      on public.user_activities
      for insert
      to authenticated
      with check (tenant_id = public.get_tenant_id() and user_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_activities' and policyname='activities_select') then
    create policy activities_select
      on public.user_activities
      for select
      to authenticated
      using (tenant_id = public.get_tenant_id() or public.get_user_type() in ('admin','secretario','diretor','super_admin'));
  end if;
end
$$;

-- 10) Índices úteis
create index if not exists idx_protocolos_tenant_created_at on public.protocolos (tenant_id, created_at desc);
create index if not exists idx_protocolos_tenant_status on public.protocolos (tenant_id, status);
create index if not exists idx_servicos_municipais_tenant_nome on public.servicos_municipais (tenant_id, nome);
create index if not exists idx_user_activities_tenant_created_at on public.user_activities (tenant_id, created_at desc);

-- FIM



-- ====================================================================
-- MIGRAÇÃO: 20250818175029_ef76b0c4-74ef-49ca-9cf4-505421664df3.sql
-- ====================================================================


-- =====================================================================
-- DIGIURBAN 2.0 - AUTENTICAÇÃO E CONTROLE DE ACESSO (RLS + LOGS)
-- Compatível com as tabelas e enums já existentes no projeto
-- NÃO toca em schemas reservados (auth, storage, etc.)
-- =====================================================================

-- 0) Extensões utilitárias (idempotentes)
create extension if not exists pgcrypto;

-- 1) Funções auxiliares para uso em RLS (evitam recursão)
create or replace function public.get_current_user_type()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select up.tipo_usuario::text
  from public.user_profiles up
  where up.id = auth.uid()
  limit 1
$$;

create or replace function public.get_current_user_tenant()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select up.tenant_id
  from public.user_profiles up
  where up.id = auth.uid()
  limit 1
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.get_current_user_type() = 'super_admin', false)
$$;

-- 2) Tabela de atividades de usuário (auditoria)
create table if not exists public.user_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,                          -- pode ser nulo p/ login_failed
  tenant_id uuid null,
  acao text not null,
  detalhes jsonb null,
  ip_address text null,
  user_agent text null,
  created_at timestamptz not null default now()
);

-- FK opcional para perfis (não toca auth.users)
do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_type = 'FOREIGN KEY'
      and table_schema = 'public'
      and table_name = 'user_activities'
      and constraint_name = 'user_activities_user_id_fkey'
  ) then
    alter table public.user_activities
      add constraint user_activities_user_id_fkey
      foreign key (user_id) references public.user_profiles(id) on delete set null;
  end if;
end$$;

create index if not exists idx_user_activities_user_created_at
  on public.user_activities (user_id, created_at desc);

create index if not exists idx_user_activities_tenant_created_at
  on public.user_activities (tenant_id, created_at desc);

-- 3) RPCs leves para logs (seguem chamadas já usadas no frontend)
-- Observação: RLS continuará sendo aplicado; políticas abaixo permitem os casos de uso.
create or replace function public.log_audit_action(
  p_user_id uuid,
  p_action text,
  p_details jsonb default null,
  p_ip_address text default null,
  p_user_agent text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
begin
  -- identifica tenant do usuário (se houver)
  select tenant_id into v_tenant_id
  from public.user_profiles
  where id = p_user_id;

  insert into public.user_activities(user_id, tenant_id, acao, detalhes, ip_address, user_agent)
  values (p_user_id, v_tenant_id, p_action, p_details, p_ip_address, p_user_agent);
end;
$$;

create or replace function public.log_login_attempt(
  p_email text,
  p_success boolean,
  p_user_id uuid default null,
  p_failure_reason text default null,
  p_ip_address text default null,
  p_user_agent text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_details jsonb;
begin
  if p_user_id is not null then
    select tenant_id into v_tenant_id
    from public.user_profiles
    where id = p_user_id;
  else
    v_tenant_id := null;
  end if;

  v_details := jsonb_build_object(
    'email', p_email,
    'success', p_success,
    'failure_reason', p_failure_reason,
    'timestamp', now()
  );

  insert into public.user_activities(user_id, tenant_id, acao, detalhes, ip_address, user_agent)
  values (
    p_user_id,
    v_tenant_id,
    case when p_success then 'login_success' else 'login_failed' end,
    v_details,
    p_ip_address,
    p_user_agent
  );
end;
$$;

-- 4) Habilitar RLS nas tabelas principais (idempotente)
alter table public.user_profiles enable row level security;
alter table public.secretarias enable row level security;
alter table public.tenants enable row level security;
alter table public.user_activities enable row level security;

-- 5) Políticas em user_profiles
-- Limpeza de políticas antigas (se existirem)
drop policy if exists up_self_select on public.user_profiles;
drop policy if exists up_self_update on public.user_profiles;
drop policy if exists up_self_insert on public.user_profiles;
drop policy if exists up_admin_tenant_select on public.user_profiles;
drop policy if exists up_admin_tenant_write on public.user_profiles;
drop policy if exists up_super_admin_all on public.user_profiles;

-- Usuário vê seu próprio perfil
create policy up_self_select
on public.user_profiles
for select
to authenticated
using (id = auth.uid());

-- Usuário pode atualizar seu próprio perfil
create policy up_self_update
on public.user_profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Usuário pode inserir o próprio perfil (quando ainda não existir)
create policy up_self_insert
on public.user_profiles
for insert
to authenticated
with check (id = auth.uid());

-- Admin pode ver/gerir usuários do mesmo tenant
create policy up_admin_tenant_select
on public.user_profiles
for select
to authenticated
using (
  public.get_current_user_type() in ('admin') and
  tenant_id = public.get_current_user_tenant()
  or public.is_super_admin()
);

create policy up_admin_tenant_write
on public.user_profiles
for all
to authenticated
using (
  public.get_current_user_type() in ('admin') and
  tenant_id = public.get_current_user_tenant()
  or public.is_super_admin()
)
with check (
  public.get_current_user_type() in ('admin') and
  tenant_id = public.get_current_user_tenant()
  or public.is_super_admin()
);

-- Super admin acesso total (seleção inclusiva)
create policy up_super_admin_all
on public.user_profiles
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

-- 6) Políticas em secretarias (id UUID + campo tenant_id já existem)
drop policy if exists sec_tenant_select on public.secretarias;
drop policy if exists sec_tenant_write on public.secretarias;

-- Seleção por tenant ou super_admin
create policy sec_tenant_select
on public.secretarias
for select
to authenticated
using (
  public.is_super_admin()
  or tenant_id = public.get_current_user_tenant()
);

-- Escrita: admins do tenant e super_admin
create policy sec_tenant_write
on public.secretarias
for all
to authenticated
using (
  public.is_super_admin()
  or (public.get_current_user_type() in ('admin') and tenant_id = public.get_current_user_tenant())
)
with check (
  public.is_super_admin()
  or (public.get_current_user_type() in ('admin') and tenant_id = public.get_current_user_tenant())
);

-- 7) Políticas em tenants
drop policy if exists ten_self_select on public.tenants;
drop policy if exists ten_super_admin_all on public.tenants;

-- Usuários não-super_admin só conseguem selecionar seu próprio tenant
create policy ten_self_select
on public.tenants
for select
to authenticated
using (
  public.is_super_admin()
  or id = public.get_current_user_tenant()
);

-- Super admin vê/gerencia todos os tenants
create policy ten_super_admin_all
on public.tenants
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

-- 8) Políticas em user_activities (logs)
drop policy if exists ua_self_insert_or_failed on public.user_activities;
drop policy if exists ua_self_select on public.user_activities;
drop policy if exists ua_admin_tenant_select on public.user_activities;
drop policy if exists ua_super_admin_all on public.user_activities;

-- Inserção: próprio usuário OU login_failed anônimo
create policy ua_self_insert_or_failed
on public.user_activities
for insert
to authenticated
with check (
  user_id = auth.uid()
  or (acao = 'login_failed' and user_id is null)
);

-- Seleção: próprio usuário
create policy ua_self_select
on public.user_activities
for select
to authenticated
using (user_id = auth.uid());

-- Admin pode ver logs do próprio tenant
create policy ua_admin_tenant_select
on public.user_activities
for select
to authenticated
using (
  public.get_current_user_type() in ('admin') and
  tenant_id = public.get_current_user_tenant()
  or public.is_super_admin()
);

-- Super admin vê/gerencia tudo
create policy ua_super_admin_all
on public.user_activities
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

-- 9) Trigger de updated_at em user_profiles usando função já existente
do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_user_profiles_updated_at'
  ) then
    create trigger trg_user_profiles_updated_at
      before update on public.user_profiles
      for each row execute function public.update_updated_at_column();
  end if;
end$$;

-- =====================================================================
-- Fim do script
-- =====================================================================



-- ====================================================================
-- MIGRAÇÃO: 20250818175151_43a3a366-524e-42a7-98de-96251674c81b.sql
-- ====================================================================

-- ====================================================================
-- 🔐 SISTEMA COMPLETO DE AUTENTICAÇÃO E CONTROLE DE ACESSO
-- ====================================================================
-- Configuração de autenticação multi-nível, RLS granular e auditoria
-- Versão: 1.0.0 | Data: 2025-08-18

-- ====================================================================
-- 1. TABELA DE ATIVIDADES DE USUÁRIO (AUDITORIA)
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  acao VARCHAR(100) NOT NULL,
  detalhes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS na tabela de atividades
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- 2. FUNÇÕES AUXILIARES PARA RLS
-- ====================================================================

-- Função para obter tipo de usuário atual (evita recursão RLS)
CREATE OR REPLACE FUNCTION public.get_current_user_type()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT tipo_usuario 
    FROM public.user_profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Função para obter tenant do usuário atual
CREATE OR REPLACE FUNCTION public.get_current_user_tenant()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT tenant_id 
    FROM public.user_profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Função para verificar se é super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT tipo_usuario = 'super_admin'
    FROM public.user_profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Função para obter permissões do usuário
CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  user_type TEXT;
  permissions JSONB := '[]'::JSONB;
BEGIN
  -- Obter tipo de usuário
  SELECT tipo_usuario INTO user_type
  FROM public.user_profiles
  WHERE id = p_user_id;

  -- Definir permissões baseadas no tipo de usuário
  CASE user_type
    WHEN 'super_admin' THEN
      permissions := '[{"code": "all", "name": "Acesso Total", "resource": "system", "action": "all", "module": "system"}]'::JSONB;
    WHEN 'admin' THEN
      permissions := '[
        {"code": "admin_access", "name": "Acesso Admin", "resource": "admin", "action": "manage", "module": "admin"},
        {"code": "user_management", "name": "Gestão de Usuários", "resource": "users", "action": "manage", "module": "users"},
        {"code": "tenant_management", "name": "Gestão de Tenants", "resource": "tenants", "action": "manage", "module": "tenants"}
      ]'::JSONB;
    WHEN 'secretario' THEN
      permissions := '[
        {"code": "department_access", "name": "Acesso Departamental", "resource": "department", "action": "manage", "module": "admin"},
        {"code": "protocol_management", "name": "Gestão de Protocolos", "resource": "protocols", "action": "manage", "module": "protocols"}
      ]'::JSONB;
    WHEN 'diretor' THEN
      permissions := '[
        {"code": "department_access", "name": "Acesso Departamental", "resource": "department", "action": "manage", "module": "admin"},
        {"code": "protocol_management", "name": "Gestão de Protocolos", "resource": "protocols", "action": "manage", "module": "protocols"},
        {"code": "report_access", "name": "Acesso a Relatórios", "resource": "reports", "action": "read", "module": "reports"}
      ]'::JSONB;
    WHEN 'coordenador' THEN
      permissions := '[
        {"code": "protocol_management", "name": "Gestão de Protocolos", "resource": "protocols", "action": "manage", "module": "protocols"},
        {"code": "sector_access", "name": "Acesso Setorial", "resource": "sector", "action": "manage", "module": "admin"}
      ]'::JSONB;
    WHEN 'funcionario' THEN
      permissions := '[
        {"code": "protocol_processing", "name": "Processamento de Protocolos", "resource": "protocols", "action": "process", "module": "protocols"},
        {"code": "sector_access", "name": "Acesso Setorial", "resource": "sector", "action": "read", "module": "admin"}
      ]'::JSONB;
    WHEN 'atendente' THEN
      permissions := '[
        {"code": "protocol_creation", "name": "Criação de Protocolos", "resource": "protocols", "action": "create", "module": "protocols"},
        {"code": "citizen_service", "name": "Atendimento ao Cidadão", "resource": "citizen", "action": "assist", "module": "service"}
      ]'::JSONB;
    WHEN 'cidadao' THEN
      permissions := '[
        {"code": "citizen_access", "name": "Acesso Cidadão", "resource": "citizen", "action": "read", "module": "citizen"},
        {"code": "protocol_submission", "name": "Envio de Protocolos", "resource": "protocols", "action": "submit", "module": "protocols"}
      ]'::JSONB;
    ELSE
      permissions := '[]'::JSONB;
  END CASE;

  RETURN permissions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ====================================================================
-- 3. POLÍTICAS RLS PARA USER_PROFILES
-- ====================================================================

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "super_admin_all_access" ON public.user_profiles;
DROP POLICY IF EXISTS "admin_tenant_access" ON public.user_profiles;
DROP POLICY IF EXISTS "user_own_profile" ON public.user_profiles;

-- Super Admin vê tudo
CREATE POLICY "super_admin_all_access" ON public.user_profiles
FOR ALL USING (public.is_super_admin());

-- Admin vê usuários do mesmo tenant
CREATE POLICY "admin_tenant_access" ON public.user_profiles
FOR SELECT USING (
  public.get_current_user_type() IN ('admin', 'secretario', 'diretor') 
  AND tenant_id = public.get_current_user_tenant()
);

-- Usuários veem apenas seu próprio perfil
CREATE POLICY "user_own_profile" ON public.user_profiles
FOR ALL USING (id = auth.uid());

-- ====================================================================
-- 4. POLÍTICAS RLS PARA SECRETARIAS
-- ====================================================================

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "secretarias_super_admin_access" ON public.secretarias;
DROP POLICY IF EXISTS "secretarias_tenant_access" ON public.secretarias;

-- Super Admin vê todas secretarias
CREATE POLICY "secretarias_super_admin_access" ON public.secretarias
FOR ALL USING (public.is_super_admin());

-- Usuários do tenant veem secretarias do seu tenant
CREATE POLICY "secretarias_tenant_access" ON public.secretarias
FOR SELECT USING (tenant_id = public.get_current_user_tenant());

-- ====================================================================
-- 5. POLÍTICAS RLS PARA TENANTS
-- ====================================================================

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "tenants_super_admin_access" ON public.tenants;
DROP POLICY IF EXISTS "tenants_own_tenant_access" ON public.tenants;

-- Super Admin vê todos tenants
CREATE POLICY "tenants_super_admin_access" ON public.tenants
FOR ALL USING (public.is_super_admin());

-- Usuários veem apenas seu próprio tenant
CREATE POLICY "tenants_own_tenant_access" ON public.tenants
FOR SELECT USING (id = public.get_current_user_tenant());

-- ====================================================================
-- 6. POLÍTICAS RLS PARA USER_ACTIVITIES
-- ====================================================================

-- Super Admin vê todas atividades
CREATE POLICY "activities_super_admin_access" ON public.user_activities
FOR ALL USING (public.is_super_admin());

-- Admin vê atividades de usuários do mesmo tenant
CREATE POLICY "activities_admin_access" ON public.user_activities
FOR SELECT USING (
  public.get_current_user_type() IN ('admin', 'secretario', 'diretor')
  AND user_id IN (
    SELECT id FROM public.user_profiles 
    WHERE tenant_id = public.get_current_user_tenant()
  )
);

-- Usuários veem apenas suas próprias atividades
CREATE POLICY "activities_own_access" ON public.user_activities
FOR ALL USING (user_id = auth.uid());

-- ====================================================================
-- 7. TRIGGER PARA UPDATED_AT EM USER_PROFILES
-- ====================================================================

-- Criar trigger para updated_at (usando função existente)
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================================================
-- 8. FUNÇÃO RPC PARA LOG DE ATIVIDADES
-- ====================================================================

CREATE OR REPLACE FUNCTION public.log_audit_action(
  p_user_id UUID DEFAULT NULL,
  p_action VARCHAR DEFAULT NULL,
  p_details TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO public.user_activities (
    user_id,
    acao,
    detalhes,
    ip_address,
    user_agent,
    created_at
  ) VALUES (
    COALESCE(p_user_id, auth.uid()),
    p_action,
    CASE WHEN p_details IS NOT NULL THEN p_details::JSONB ELSE NULL END,
    p_ip_address,
    p_user_agent,
    NOW()
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- Log silencioso em caso de erro
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- 9. FUNÇÃO RPC PARA LOG DE TENTATIVAS DE LOGIN
-- ====================================================================

CREATE OR REPLACE FUNCTION public.log_login_attempt(
  p_email VARCHAR,
  p_success BOOLEAN,
  p_user_id UUID DEFAULT NULL,
  p_failure_reason TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO public.user_activities (
    user_id,
    acao,
    detalhes,
    ip_address,
    user_agent,
    created_at
  ) VALUES (
    p_user_id,
    CASE WHEN p_success THEN 'login_success' ELSE 'login_failed' END,
    jsonb_build_object(
      'email', p_email,
      'success', p_success,
      'failure_reason', p_failure_reason,
      'timestamp', NOW()
    ),
    p_ip_address,
    p_user_agent,
    NOW()
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- 10. TRIGGER PARA CRIAÇÃO AUTOMÁTICA DE PERFIL
-- ====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir perfil básico para novos usuários
  INSERT INTO public.user_profiles (
    id,
    email,
    nome_completo,
    tipo_usuario,
    tenant_id,
    secretaria_id,
    status,
    primeiro_acesso,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'tipo_usuario', 'cidadao'),
    (NEW.raw_user_meta_data->>'tenant_id')::UUID,
    NEW.raw_user_meta_data->>'secretaria_id',
    'ativo',
    true,
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- 11. ÍNDICES PARA PERFORMANCE
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant_id ON public.user_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_tipo_usuario ON public.user_profiles(tipo_usuario);
CREATE INDEX IF NOT EXISTS idx_user_profiles_secretaria_id ON public.user_profiles(secretaria_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_acao ON public.user_activities(acao);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON public.user_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_secretarias_tenant_id ON public.secretarias(tenant_id);

-- ====================================================================
-- 12. COMENTÁRIOS E DOCUMENTAÇÃO
-- ====================================================================

COMMENT ON TABLE public.user_activities IS 'Log de atividades e auditoria do sistema';
COMMENT ON FUNCTION public.get_current_user_type() IS 'Função para obter tipo do usuário atual (evita recursão RLS)';
COMMENT ON FUNCTION public.get_current_user_tenant() IS 'Função para obter tenant do usuário atual';
COMMENT ON FUNCTION public.is_super_admin() IS 'Verifica se usuário atual é super admin';
COMMENT ON FUNCTION public.get_user_permissions(UUID) IS 'Retorna permissões do usuário baseadas no seu tipo';
COMMENT ON FUNCTION public.log_audit_action(UUID, VARCHAR, TEXT, INET, TEXT) IS 'Registra ações de auditoria no sistema';
COMMENT ON FUNCTION public.log_login_attempt(VARCHAR, BOOLEAN, UUID, TEXT, INET, TEXT) IS 'Registra tentativas de login no sistema';

-- ====================================================================
-- ✅ MIGRAÇÃO CONCLUÍDA
-- ====================================================================


-- ====================================================================
-- MIGRAÇÃO: 20250818175535_b77fbb62-90b1-4c40-b8ce-451a511dd10e.sql
-- ====================================================================

-- ====================================================================
-- 🔒 CORREÇÃO DE SEGURANÇA - RLS E SEARCH PATH
-- ====================================================================
-- Corrigir avisos críticos de segurança detectados pelo linter

-- ====================================================================
-- 1. HABILITAR RLS EM TABELA PROTOCOLOS (CRÍTICO)
-- ====================================================================

ALTER TABLE public.protocolos ENABLE ROW LEVEL SECURITY;

-- Criar política básica para protocolos
CREATE POLICY "protocolos_super_admin_access" ON public.protocolos
FOR ALL USING (public.is_super_admin());

CREATE POLICY "protocolos_tenant_access" ON public.protocolos
FOR ALL USING (tenant_id = public.get_current_user_tenant());

-- ====================================================================  
-- 2. CORRIGIR SEARCH_PATH DAS FUNÇÕES (AVISOS DE SEGURANÇA)
-- ====================================================================

-- Recriar função get_current_user_type com search_path seguro
CREATE OR REPLACE FUNCTION public.get_current_user_type()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT tipo_usuario 
    FROM public.user_profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Recriar função get_current_user_tenant com search_path seguro
CREATE OR REPLACE FUNCTION public.get_current_user_tenant()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT tenant_id 
    FROM public.user_profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Recriar função is_super_admin com search_path seguro
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT tipo_usuario = 'super_admin'
    FROM public.user_profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Recriar função get_user_permissions com search_path seguro
CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  user_type TEXT;
  permissions JSONB := '[]'::JSONB;
BEGIN
  -- Obter tipo de usuário
  SELECT tipo_usuario INTO user_type
  FROM public.user_profiles
  WHERE id = p_user_id;

  -- Definir permissões baseadas no tipo de usuário
  CASE user_type
    WHEN 'super_admin' THEN
      permissions := '[{"code": "all", "name": "Acesso Total", "resource": "system", "action": "all", "module": "system"}]'::JSONB;
    WHEN 'admin' THEN
      permissions := '[
        {"code": "admin_access", "name": "Acesso Admin", "resource": "admin", "action": "manage", "module": "admin"},
        {"code": "user_management", "name": "Gestão de Usuários", "resource": "users", "action": "manage", "module": "users"},
        {"code": "tenant_management", "name": "Gestão de Tenants", "resource": "tenants", "action": "manage", "module": "tenants"}
      ]'::JSONB;
    WHEN 'secretario' THEN
      permissions := '[
        {"code": "department_access", "name": "Acesso Departamental", "resource": "department", "action": "manage", "module": "admin"},
        {"code": "protocol_management", "name": "Gestão de Protocolos", "resource": "protocols", "action": "manage", "module": "protocols"}
      ]'::JSONB;
    WHEN 'diretor' THEN
      permissions := '[
        {"code": "department_access", "name": "Acesso Departamental", "resource": "department", "action": "manage", "module": "admin"},
        {"code": "protocol_management", "name": "Gestão de Protocolos", "resource": "protocols", "action": "manage", "module": "protocols"},
        {"code": "report_access", "name": "Acesso a Relatórios", "resource": "reports", "action": "read", "module": "reports"}
      ]'::JSONB;
    WHEN 'coordenador' THEN
      permissions := '[
        {"code": "protocol_management", "name": "Gestão de Protocolos", "resource": "protocols", "action": "manage", "module": "protocols"},
        {"code": "sector_access", "name": "Acesso Setorial", "resource": "sector", "action": "manage", "module": "admin"}
      ]'::JSONB;
    WHEN 'funcionario' THEN
      permissions := '[
        {"code": "protocol_processing", "name": "Processamento de Protocolos", "resource": "protocols", "action": "process", "module": "protocols"},
        {"code": "sector_access", "name": "Acesso Setorial", "resource": "sector", "action": "read", "module": "admin"}
      ]'::JSONB;
    WHEN 'atendente' THEN
      permissions := '[
        {"code": "protocol_creation", "name": "Criação de Protocolos", "resource": "protocols", "action": "create", "module": "protocols"},
        {"code": "citizen_service", "name": "Atendimento ao Cidadão", "resource": "citizen", "action": "assist", "module": "service"}
      ]'::JSONB;
    WHEN 'cidadao' THEN
      permissions := '[
        {"code": "citizen_access", "name": "Acesso Cidadão", "resource": "citizen", "action": "read", "module": "citizen"},
        {"code": "protocol_submission", "name": "Envio de Protocolos", "resource": "protocols", "action": "submit", "module": "protocols"}
      ]'::JSONB;
    ELSE
      permissions := '[]'::JSONB;
  END CASE;

  RETURN permissions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Recriar função log_audit_action com search_path seguro
CREATE OR REPLACE FUNCTION public.log_audit_action(
  p_user_id UUID DEFAULT NULL,
  p_action VARCHAR DEFAULT NULL,
  p_details TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO public.user_activities (
    user_id,
    acao,
    detalhes,
    ip_address,
    user_agent,
    created_at
  ) VALUES (
    COALESCE(p_user_id, auth.uid()),
    p_action,
    CASE WHEN p_details IS NOT NULL THEN p_details::JSONB ELSE NULL END,
    p_ip_address,
    p_user_agent,
    NOW()
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- Log silencioso em caso de erro
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recriar função log_login_attempt com search_path seguro
CREATE OR REPLACE FUNCTION public.log_login_attempt(
  p_email VARCHAR,
  p_success BOOLEAN,
  p_user_id UUID DEFAULT NULL,
  p_failure_reason TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO public.user_activities (
    user_id,
    acao,
    detalhes,
    ip_address,
    user_agent,
    created_at
  ) VALUES (
    p_user_id,
    CASE WHEN p_success THEN 'login_success' ELSE 'login_failed' END,
    jsonb_build_object(
      'email', p_email,
      'success', p_success,
      'failure_reason', p_failure_reason,
      'timestamp', NOW()
    ),
    p_ip_address,
    p_user_agent,
    NOW()
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recriar função handle_new_user com search_path seguro  
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir perfil básico para novos usuários
  INSERT INTO public.user_profiles (
    id,
    email,
    nome_completo,
    tipo_usuario,
    tenant_id,
    secretaria_id,
    status,
    primeiro_acesso,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'tipo_usuario', 'cidadao'),
    (NEW.raw_user_meta_data->>'tenant_id')::UUID,
    NEW.raw_user_meta_data->>'secretaria_id',
    'ativo',
    true,
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recriar função gerar_numero_protocolo com search_path seguro
CREATE OR REPLACE FUNCTION public.gerar_numero_protocolo(p_tenant_id uuid)
RETURNS character varying AS $$
DECLARE
  ano_atual INTEGER;
  sequencial INTEGER;
  numero_protocolo VARCHAR(20);
BEGIN
  ano_atual := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Buscar próximo sequencial do ano
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(numero_protocolo FROM 5 FOR 6) AS INTEGER)
  ), 0) + 1
  INTO sequencial
  FROM public.protocolos 
  WHERE tenant_id = p_tenant_id 
    AND numero_protocolo LIKE ano_atual::TEXT || '%';
  
  -- Gerar número no formato: AAAA999999 (ano + 6 dígitos)
  numero_protocolo := ano_atual::TEXT || LPAD(sequencial::TEXT, 6, '0');
  
  RETURN numero_protocolo;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Recriar função trigger_gerar_numero_protocolo com search_path seguro
CREATE OR REPLACE FUNCTION public.trigger_gerar_numero_protocolo()
RETURNS trigger AS $$
BEGIN
  IF NEW.numero_protocolo IS NULL OR NEW.numero_protocolo = '' THEN
    NEW.numero_protocolo := public.gerar_numero_protocolo(NEW.tenant_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Recriar função update_updated_at_column com search_path seguro
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ====================================================================
-- ✅ SEGURANÇA CORRIGIDA
-- ====================================================================


-- ====================================================================
-- MIGRAÇÃO: 20250818181602_8bd0d93f-61d8-494b-9893-a403b12b46d2.sql
-- ====================================================================

-- ===============================================
-- DIGIURBAN2 - SCHEMA COMPLETO DOS MÓDULOS PRINCIPAIS
-- FASE 1: SAÚDE, EDUCAÇÃO E ASSISTÊNCIA SOCIAL
-- ===============================================

-- =============================================
-- MÓDULO SAÚDE
-- =============================================

-- Pacientes
CREATE TABLE IF NOT EXISTS public.saude_pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome_completo VARCHAR NOT NULL,
  cpf VARCHAR,
  cns VARCHAR, -- Cartão Nacional de Saúde
  data_nascimento DATE,
  sexo VARCHAR CHECK (sexo IN ('M', 'F', 'O')),
  endereco JSONB DEFAULT '{}',
  contato JSONB DEFAULT '{}',
  convenio_medico VARCHAR,
  alergias TEXT[] DEFAULT '{}',
  condicoes_medicas TEXT[] DEFAULT '{}',
  medicamentos_uso_continuo TEXT[] DEFAULT '{}',
  contato_emergencia JSONB DEFAULT '{}',
  status VARCHAR DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'bloqueado')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profissionais de Saúde
CREATE TABLE IF NOT EXISTS public.saude_profissionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome_completo VARCHAR NOT NULL,
  cpf VARCHAR UNIQUE,
  especialidades TEXT[] DEFAULT '{}',
  crm VARCHAR,
  crm_uf VARCHAR(2),
  contato JSONB DEFAULT '{}',
  tipo_profissional VARCHAR NOT NULL CHECK (tipo_profissional IN ('medico', 'enfermeiro', 'tecnico_enfermagem', 'dentista', 'farmaceutico', 'psicologo', 'nutricionista', 'fisioterapeuta', 'outro')),
  carga_horaria_semanal INTEGER DEFAULT 40,
  turno_trabalho VARCHAR CHECK (turno_trabalho IN ('matutino', 'vespertino', 'noturno', 'integral')),
  unidades_trabalho UUID[] DEFAULT '{}',
  status VARCHAR DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'bloqueado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unidades de Saúde
CREATE TABLE IF NOT EXISTS public.saude_unidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome VARCHAR NOT NULL,
  tipo VARCHAR NOT NULL CHECK (tipo IN ('ubs', 'upf', 'hospital', 'clinica', 'caps', 'pronto_socorro', 'laboratorio', 'farmacia')),
  endereco JSONB DEFAULT '{}',
  contato JSONB DEFAULT '{}',
  cnpj VARCHAR,
  cnes VARCHAR, -- Código Nacional de Estabelecimentos de Saúde
  especialidades_disponiveis TEXT[] DEFAULT '{}',
  servicos_oferecidos TEXT[] DEFAULT '{}',
  horario_funcionamento JSONB DEFAULT '{}',
  capacidade_atendimento JSONB DEFAULT '{}',
  equipamentos_disponiveis TEXT[] DEFAULT '{}',
  gestor_responsavel_id UUID,
  status VARCHAR DEFAULT 'ativa' CHECK (status IN ('ativa', 'inativa', 'reforma', 'desativada')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agendamentos Médicos
CREATE TABLE IF NOT EXISTS public.saude_agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES public.saude_pacientes(id) ON DELETE CASCADE,
  profissional_id UUID NOT NULL REFERENCES public.saude_profissionais(id) ON DELETE CASCADE,
  unidade_saude_id UUID NOT NULL REFERENCES public.saude_unidades(id) ON DELETE CASCADE,
  especialidade VARCHAR,
  data_agendamento DATE NOT NULL,
  horario_inicio TIME NOT NULL,
  horario_fim TIME NOT NULL,
  duracao_minutos INTEGER DEFAULT 30,
  status VARCHAR DEFAULT 'agendado' CHECK (status IN ('agendado', 'confirmado', 'realizado', 'cancelado', 'remarcado', 'faltou')),
  tipo_consulta VARCHAR NOT NULL CHECK (tipo_consulta IN ('consulta', 'exame', 'procedimento', 'retorno', 'urgencia', 'emergencia')),
  prioridade VARCHAR DEFAULT 'normal' CHECK (prioridade IN ('baixa', 'normal', 'alta', 'urgente', 'emergencia')),
  observacoes TEXT,
  sintomas_relatados TEXT,
  prescricoes TEXT[] DEFAULT '{}',
  procedimentos_realizados TEXT[] DEFAULT '{}',
  retorno_necessario BOOLEAN DEFAULT FALSE,
  data_retorno_sugerida DATE,
  lembrete_enviado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medicamentos
CREATE TABLE IF NOT EXISTS public.saude_medicamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome VARCHAR NOT NULL,
  principio_ativo VARCHAR,
  concentracao VARCHAR,
  forma_farmaceutica VARCHAR CHECK (forma_farmaceutica IN ('comprimido', 'capsula', 'xarope', 'solucao', 'pomada', 'injecao', 'outro')),
  categoria VARCHAR CHECK (categoria IN ('antibiotico', 'analgesico', 'anti_inflamatorio', 'cardiovascular', 'diabetes', 'psicotropico', 'outro')),
  controlado BOOLEAN DEFAULT FALSE,
  requer_receita BOOLEAN DEFAULT TRUE,
  codigo_ean VARCHAR,
  fabricante VARCHAR,
  registro_anvisa VARCHAR,
  status VARCHAR DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'descontinuado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campanhas de Saúde
CREATE TABLE IF NOT EXISTS public.saude_campanhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome VARCHAR NOT NULL,
  descricao TEXT,
  tipo VARCHAR NOT NULL CHECK (tipo IN ('vacinacao', 'preventiva', 'educativa', 'exames', 'nutricao', 'saude_mental', 'outro')),
  publico_alvo JSONB DEFAULT '{}',
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  locais_realizacao TEXT[] DEFAULT '{}',
  unidades_participantes UUID[] DEFAULT '{}',
  meta_atendimentos INTEGER DEFAULT 0,
  realizados INTEGER DEFAULT 0,
  responsavel_id UUID REFERENCES public.saude_profissionais(id),
  equipe_ids UUID[] DEFAULT '{}',
  orcamento_previsto DECIMAL(15,2) DEFAULT 0,
  orcamento_gasto DECIMAL(15,2) DEFAULT 0,
  materiais_necessarios TEXT[] DEFAULT '{}',
  indicadores_sucesso JSONB DEFAULT '{}',
  status VARCHAR DEFAULT 'planejada' CHECK (status IN ('planejada', 'ativa', 'pausada', 'concluida', 'cancelada')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- MÓDULO EDUCAÇÃO
-- =============================================

-- Escolas
CREATE TABLE IF NOT EXISTS public.educacao_escolas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome VARCHAR NOT NULL,
  codigo_inep VARCHAR,
  codigo_mec VARCHAR,
  tipo VARCHAR NOT NULL CHECK (tipo IN ('municipal', 'estadual', 'federal', 'privada', 'comunitaria')),
  modalidades_ensino TEXT[] DEFAULT '{}',
  turnos_funcionamento TEXT[] DEFAULT '{}',
  endereco JSONB DEFAULT '{}',
  contato JSONB DEFAULT '{}',
  cnpj VARCHAR,
  diretor_id UUID,
  vice_diretor_id UUID,
  coordenador_pedagogico_id UUID,
  capacidade_total_alunos INTEGER DEFAULT 0,
  vagas_disponiveis INTEGER DEFAULT 0,
  infraestrutura JSONB DEFAULT '{}',
  recursos_tecnologicos JSONB DEFAULT '{}',
  programas_governo TEXT[] DEFAULT '{}',
  horario_funcionamento JSONB DEFAULT '{}',
  status VARCHAR DEFAULT 'ativa' CHECK (status IN ('ativa', 'inativa', 'reforma', 'desativada')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profissionais da Educação
CREATE TABLE IF NOT EXISTS public.educacao_profissionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  matricula_funcional VARCHAR NOT NULL,
  nome_completo VARCHAR NOT NULL,
  cpf VARCHAR UNIQUE,
  data_nascimento DATE,
  endereco JSONB DEFAULT '{}',
  contato JSONB DEFAULT '{}',
  cargo VARCHAR NOT NULL CHECK (cargo IN ('diretor', 'vice_diretor', 'coordenador_pedagogico', 'professor', 'auxiliar_ensino', 'secretario_escola', 'merendeiro', 'servicos_gerais', 'monitor', 'psicopedagogo', 'outro')),
  especialidade TEXT[] DEFAULT '{}',
  formacao_academica JSONB DEFAULT '[]',
  experiencia_anos INTEGER DEFAULT 0,
  carga_horaria_semanal INTEGER DEFAULT 40,
  turno_trabalho TEXT[] DEFAULT '{}',
  escolas_atuacao UUID[] DEFAULT '{}',
  disciplinas_lecionadas TEXT[] DEFAULT '{}',
  turmas_responsavel UUID[] DEFAULT '{}',
  data_admissao DATE NOT NULL,
  data_demissao DATE,
  status VARCHAR DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'licenca', 'aposentado')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alunos
CREATE TABLE IF NOT EXISTS public.educacao_alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  codigo_aluno VARCHAR NOT NULL,
  nome_completo VARCHAR NOT NULL,
  cpf VARCHAR,
  nis VARCHAR,
  data_nascimento DATE NOT NULL,
  sexo VARCHAR CHECK (sexo IN ('M', 'F', 'O')),
  cor_raca VARCHAR CHECK (cor_raca IN ('branca', 'preta', 'parda', 'amarela', 'indigena', 'nao_declarada')),
  nacionalidade VARCHAR DEFAULT 'brasileira',
  naturalidade VARCHAR,
  certidao_nascimento VARCHAR,
  endereco JSONB DEFAULT '{}',
  responsaveis JSONB DEFAULT '[]',
  necessidades_especiais JSONB DEFAULT '{}',
  saude JSONB DEFAULT '{}',
  transporte_escolar JSONB DEFAULT '{}',
  beneficios_sociais TEXT[] DEFAULT '{}',
  situacao_vacinal_em_dia BOOLEAN DEFAULT TRUE,
  documentos_entregues TEXT[] DEFAULT '{}',
  status VARCHAR DEFAULT 'ativo' CHECK (status IN ('ativo', 'transferido', 'evadido', 'concluido', 'falecido')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Turmas
CREATE TABLE IF NOT EXISTS public.educacao_turmas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  escola_id UUID NOT NULL REFERENCES public.educacao_escolas(id) ON DELETE CASCADE,
  codigo VARCHAR NOT NULL,
  nome VARCHAR,
  serie VARCHAR NOT NULL,
  nivel_ensino VARCHAR NOT NULL CHECK (nivel_ensino IN ('educacao_infantil', 'ensino_fundamental_anos_iniciais', 'ensino_fundamental_anos_finais', 'ensino_medio', 'eja', 'educacao_especial')),
  turno VARCHAR NOT NULL CHECK (turno IN ('matutino', 'vespertino', 'noturno', 'integral')),
  vagas_total INTEGER DEFAULT 0,
  vagas_ocupadas INTEGER DEFAULT 0,
  vagas_reservadas INTEGER DEFAULT 0,
  ano_letivo INTEGER NOT NULL,
  professor_regente_id UUID REFERENCES public.educacao_profissionais(id),
  sala_aula VARCHAR,
  horario_aulas JSONB DEFAULT '[]',
  disciplinas_oferecidas TEXT[] DEFAULT '{}',
  status VARCHAR DEFAULT 'ativa' CHECK (status IN ('ativa', 'inativa', 'concluida')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matrículas
CREATE TABLE IF NOT EXISTS public.educacao_matriculas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES public.educacao_alunos(id) ON DELETE CASCADE,
  escola_id UUID NOT NULL REFERENCES public.educacao_escolas(id) ON DELETE CASCADE,
  turma_id UUID NOT NULL REFERENCES public.educacao_turmas(id) ON DELETE CASCADE,
  ano_letivo INTEGER NOT NULL,
  numero_matricula VARCHAR NOT NULL,
  data_matricula DATE NOT NULL,
  data_transferencia DATE,
  data_conclusao DATE,
  status VARCHAR DEFAULT 'ativa' CHECK (status IN ('ativa', 'transferida', 'cancelada', 'concluida', 'abandono', 'remanejada')),
  motivo_status TEXT,
  documentos_entregues JSONB DEFAULT '[]',
  historico_escolar VARCHAR, -- ID do arquivo
  boletim_anterior VARCHAR, -- ID do arquivo
  laudo_medico VARCHAR, -- ID do arquivo se necessário
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- MÓDULO ASSISTÊNCIA SOCIAL
-- =============================================

-- Famílias
CREATE TABLE IF NOT EXISTS public.assistencia_familias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  codigo_familia VARCHAR NOT NULL,
  responsavel_nome VARCHAR NOT NULL,
  responsavel_cpf VARCHAR,
  responsavel_nis VARCHAR,
  endereco JSONB DEFAULT '{}',
  contato JSONB DEFAULT '{}',
  renda_familiar DECIMAL(10,2) DEFAULT 0,
  numero_membros INTEGER DEFAULT 1,
  situacao_vulnerabilidade TEXT[] DEFAULT '{}',
  programas_inscritos TEXT[] DEFAULT '{}',
  cras_referencia UUID,
  data_cadastro DATE DEFAULT CURRENT_DATE,
  status VARCHAR DEFAULT 'ativa' CHECK (status IN ('ativa', 'inativa', 'bloqueada', 'transferida')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Atendimentos Assistência Social
CREATE TABLE IF NOT EXISTS public.assistencia_atendimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  familia_id UUID NOT NULL REFERENCES public.assistencia_familias(id) ON DELETE CASCADE,
  atendente_id UUID NOT NULL,
  unidade_atendimento_id UUID,
  data_atendimento DATE NOT NULL,
  horario_inicio TIME NOT NULL,
  horario_fim TIME,
  tipo_atendimento VARCHAR NOT NULL CHECK (tipo_atendimento IN ('cadastro', 'acompanhamento', 'orientacao', 'encaminhamento', 'entrega_beneficio', 'visita_domiciliar', 'outro')),
  demanda_principal VARCHAR NOT NULL,
  descricao_caso TEXT,
  acoes_realizadas TEXT[] DEFAULT '{}',
  encaminhamentos JSONB DEFAULT '[]',
  proxima_acao JSONB DEFAULT '{}',
  status VARCHAR DEFAULT 'concluido' CHECK (status IN ('agendado', 'em_andamento', 'concluido', 'cancelado')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CRAS/CREAS
CREATE TABLE IF NOT EXISTS public.assistencia_unidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome VARCHAR NOT NULL,
  tipo VARCHAR NOT NULL CHECK (tipo IN ('cras', 'creas', 'centro_pop', 'abrigo', 'casa_passagem', 'outro')),
  endereco JSONB DEFAULT '{}',
  contato JSONB DEFAULT '{}',
  coordenador_id UUID,
  equipe_tecnica UUID[] DEFAULT '{}',
  territorio_abrangencia TEXT[] DEFAULT '{}',
  capacidade_atendimento INTEGER DEFAULT 0,
  servicos_oferecidos TEXT[] DEFAULT '{}',
  horario_funcionamento JSONB DEFAULT '{}',
  familias_referenciadas INTEGER DEFAULT 0,
  status VARCHAR DEFAULT 'ativa' CHECK (status IN ('ativa', 'inativa', 'reforma')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies para todas as tabelas
ALTER TABLE public.saude_pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saude_profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saude_unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saude_agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saude_medicamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saude_campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educacao_escolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educacao_profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educacao_alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educacao_turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educacao_matriculas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistencia_familias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistencia_atendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistencia_unidades ENABLE ROW LEVEL SECURITY;

-- Políticas RLS genéricas para Super Admin e Tenant Access
DO $$
DECLARE
    table_names TEXT[] := ARRAY[
        'saude_pacientes', 'saude_profissionais', 'saude_unidades', 'saude_agendamentos', 
        'saude_medicamentos', 'saude_campanhas',
        'educacao_escolas', 'educacao_profissionais', 'educacao_alunos', 'educacao_turmas', 'educacao_matriculas',
        'assistencia_familias', 'assistencia_atendimentos', 'assistencia_unidades'
    ];
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY table_names
    LOOP
        -- Política para Super Admin (acesso total)
        EXECUTE format('
            CREATE POLICY "super_admin_all_access_%s" ON public.%I
            FOR ALL USING (is_super_admin())
        ', table_name, table_name);

        -- Política para usuários do tenant
        EXECUTE format('
            CREATE POLICY "tenant_access_%s" ON public.%I
            FOR ALL USING (tenant_id = get_current_user_tenant())
        ', table_name, table_name);
    END LOOP;
END $$;

-- Triggers para updated_at
DO $$
DECLARE
    table_names TEXT[] := ARRAY[
        'saude_pacientes', 'saude_profissionais', 'saude_unidades', 'saude_agendamentos', 
        'saude_medicamentos', 'saude_campanhas',
        'educacao_escolas', 'educacao_profissionais', 'educacao_alunos', 'educacao_turmas', 'educacao_matriculas',
        'assistencia_familias', 'assistencia_atendimentos', 'assistencia_unidades'
    ];
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY table_names
    LOOP
        EXECUTE format('
            CREATE TRIGGER update_%s_updated_at
                BEFORE UPDATE ON public.%I
                FOR EACH ROW
                EXECUTE FUNCTION public.update_updated_at_column()
        ', table_name, table_name);
    END LOOP;
END $$;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_saude_pacientes_tenant ON public.saude_pacientes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_saude_pacientes_cpf ON public.saude_pacientes(cpf) WHERE cpf IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_saude_agendamentos_data ON public.saude_agendamentos(data_agendamento, horario_inicio);
CREATE INDEX IF NOT EXISTS idx_saude_agendamentos_paciente ON public.saude_agendamentos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_educacao_alunos_tenant ON public.educacao_alunos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_educacao_matriculas_aluno ON public.educacao_matriculas(aluno_id);
CREATE INDEX IF NOT EXISTS idx_educacao_matriculas_ano ON public.educacao_matriculas(ano_letivo);
CREATE INDEX IF NOT EXISTS idx_assistencia_familias_tenant ON public.assistencia_familias(tenant_id);
CREATE INDEX IF NOT EXISTS idx_assistencia_atendimentos_familia ON public.assistencia_atendimentos(familia_id);


-- ====================================================================
-- MIGRAÇÃO: 20250818191152_5a976cb5-8eb8-40f6-89d1-354756dc505a.sql
-- ====================================================================


-- ===========================
-- PARTE 1 (MÓDULOS 1-6)
-- CULTURA, AGRICULTURA, ESPORTES, TURISMO, HABITAÇÃO, MEIO AMBIENTE
-- Padrões: created_at/updated_at, RLS por tenant + super_admin, trigger updated_at
-- ===========================

-- ============= MÓDULO 1: CULTURA =============

CREATE TABLE public.cultura_espacos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  nome varchar NOT NULL,
  tipo varchar,
  endereco jsonb,
  contato jsonb,
  capacidade integer,
  recursos_disponiveis text[],
  horario_funcionamento jsonb,
  valor_locacao numeric(10,2),
  responsavel_id uuid,
  fotos text[],
  status varchar DEFAULT 'ativo',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_cultura_espacos_tenant ON public.cultura_espacos(tenant_id);

ALTER TABLE public.cultura_espacos ENABLE ROW LEVEL SECURITY;
CREATE POLICY super_admin_all_access_cultura_espacos ON public.cultura_espacos FOR ALL USING (is_super_admin());
CREATE POLICY tenant_access_cultura_espacos ON public.cultura_espacos FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE TRIGGER set_updated_at_cultura_espacos
BEFORE UPDATE ON public.cultura_espacos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.cultura_grupos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  nome varchar NOT NULL,
  tipo varchar,
  categoria varchar,
  coordenador_nome varchar,
  coordenador_contato jsonb,
  participantes_cadastrados integer DEFAULT 0,
  participantes_ativos integer DEFAULT 0,
  local_ensaio varchar,
  horario_ensaio jsonb,
  repertorio text[],
  apresentacoes_realizadas integer DEFAULT 0,
  premios_recebidos text[],
  status varchar DEFAULT 'ativo',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_cultura_grupos_tenant ON public.cultura_grupos(tenant_id);

ALTER TABLE public.cultura_grupos ENABLE ROW LEVEL SECURITY;
CREATE POLICY super_admin_all_access_cultura_grupos ON public.cultura_grupos FOR ALL USING (is_super_admin());
CREATE POLICY tenant_access_cultura_grupos ON public.cultura_grupos FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE TRIGGER set_updated_at_cultura_grupos
BEFORE UPDATE ON public.cultura_grupos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.cultura_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  nome varchar NOT NULL,
  descricao text,
  tipo varchar,
  categoria varchar,
  data_inicio date,
  data_fim date,
  horario_inicio time,
  horario_fim time,
  local_realizacao varchar,
  espaco_id uuid REFERENCES public.cultura_espacos(id) ON DELETE SET NULL,
  publico_esperado integer,
  publico_presente integer,
  faixa_etaria varchar,
  entrada_gratuita boolean DEFAULT TRUE,
  valor_ingresso numeric(10,2),
  organizador_id uuid,
  apoiadores text[],
  orcamento_previsto numeric(10,2),
  orcamento_realizado numeric(10,2),
  material_promocional text[],
  avaliacoes jsonb,
  status varchar DEFAULT 'planejado',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_cultura_eventos_tenant ON public.cultura_eventos(tenant_id);

ALTER TABLE public.cultura_eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY super_admin_all_access_cultura_eventos ON public.cultura_eventos FOR ALL USING (is_super_admin());
CREATE POLICY tenant_access_cultura_eventos ON public.cultura_eventos FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE TRIGGER set_updated_at_cultura_eventos
BEFORE UPDATE ON public.cultura_eventos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.cultura_projetos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  nome varchar NOT NULL,
  descricao text,
  objetivo text,
  publico_alvo text,
  coordenador_id uuid,
  data_inicio date,
  data_fim date,
  orcamento_total numeric(10,2),
  fonte_recurso varchar,
  beneficiarios_diretos integer,
  beneficiarios_indiretos integer,
  atividades_previstas jsonb,
  atividades_realizadas jsonb,
  indicadores_sucesso jsonb,
  relatorios text[],
  prestacao_contas jsonb,
  status varchar DEFAULT 'elaboracao',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_cultura_projetos_tenant ON public.cultura_projetos(tenant_id);

ALTER TABLE public.cultura_projetos ENABLE ROW LEVEL SECURITY;
CREATE POLICY super_admin_all_access_cultura_projetos ON public.cultura_projetos FOR ALL USING (is_super_admin());
CREATE POLICY tenant_access_cultura_projetos ON public.cultura_projetos FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE TRIGGER set_updated_at_cultura_projetos
BEFORE UPDATE ON public.cultura_projetos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.cultura_oficinas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  nome varchar NOT NULL,
  descricao text,
  modalidade varchar,
  categoria varchar,
  nivel varchar,
  instrutor_nome varchar,
  instrutor_curriculo text,
  carga_horaria integer,
  vagas_oferecidas integer,
  vagas_ocupadas integer DEFAULT 0,
  idade_minima integer,
  idade_maxima integer,
  pre_requisitos text,
  material_necessario text[],
  local_realizacao varchar,
  data_inicio date,
  data_fim date,
  horario jsonb,
  valor_inscricao numeric(10,2) DEFAULT 0,
  certificado boolean DEFAULT FALSE,
  avaliacoes jsonb,
  status varchar DEFAULT 'planejada',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_cultura_oficinas_tenant ON public.cultura_oficinas(tenant_id);

ALTER TABLE public.cultura_oficinas ENABLE ROW LEVEL SECURITY;
CREATE POLICY super_admin_all_access_cultura_oficinas ON public.cultura_oficinas FOR ALL USING (is_super_admin());
CREATE POLICY tenant_access_cultura_oficinas ON public.cultura_oficinas FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE TRIGGER set_updated_at_cultura_oficinas
BEFORE UPDATE ON public.cultura_oficinas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============= MÓDULO 2: AGRICULTURA =============

CREATE TABLE public.agricultura_produtores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  nome_completo varchar NOT NULL,
  cpf varchar UNIQUE,
  ctr varchar,
  endereco_residencial jsonb,
  contato jsonb,
  propriedades jsonb[],
  area_total_hectares numeric(10,2),
  principais_cultivos text[],
  criacao_animais text[],
  renda_familiar_estimada numeric(10,2),
  dap boolean DEFAULT FALSE,
  ccir varchar,
  car varchar,
  sindicato_associacao varchar,
  cooperativa varchar,
  status varchar DEFAULT 'ativo',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_agricultura_produtores_tenant ON public.agricultura_produtores(tenant_id);

ALTER TABLE public.agricultura_produtores ENABLE ROW LEVEL SECURITY;
CREATE POLICY super_admin_all_access_agricultura_produtores ON public.agricultura_produtores FOR ALL USING (is_super_admin());
CREATE POLICY tenant_access_agricultura_produtores ON public.agricultura_produtores FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE TRIGGER set_updated_at_agricultura_produtores
BEFORE UPDATE ON public.agricultura_produtores
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.agricultura_ater (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  produtor_id uuid REFERENCES public.agricultura_produtores(id) ON DELETE CASCADE,
  tecnico_responsavel_id uuid,
  data_visita date,
  tipo_atendimento varchar,
  cultivos_orientados text[],
  problemas_identificados text[],
  solucoes_propostas text[],
  insumos_recomendados jsonb,
  tecnologias_apresentadas text[],
  proxima_visita_agendada date,
  observacoes text,
  anexos text[],
  avaliacao_produtor integer,
  resultados_obtidos text,
  status varchar DEFAULT 'realizada',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_agricultura_ater_tenant ON public.agricultura_ater(tenant_id);
CREATE INDEX idx_agricultura_ater_produtor ON public.agricultura_ater(produtor_id);

ALTER TABLE public.agricultura_ater ENABLE ROW LEVEL SECURITY;
CREATE POLICY super_admin_all_access_agricultura_ater ON public.agricultura_ater FOR ALL USING (is_super_admin());
CREATE POLICY tenant_access_agricultura_ater ON public.agricultura_ater FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE TRIGGER set_updated_at_agricultura_ater
BEFORE UPDATE ON public.agricultura_ater
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.agricultura_programas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  nome varchar NOT NULL,
  descricao text,
  tipo varchar,
  publico_alvo text,
  requisitos_participacao text[],
  data_inicio date,
  data_fim date,
  orcamento_total numeric(10,2),
  fonte_recurso varchar,
  coordenador_id uuid,
  produtores_beneficiados integer DEFAULT 0,
  meta_beneficiados integer,
  recursos_distribuidos jsonb,
  criterios_selecao text[],
  processo_inscricao text,
  documentos_necessarios text[],
  relatorios_progresso text[],
  status varchar DEFAULT 'planejado',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_agricultura_programas_tenant ON public.agricultura_programas(tenant_id);

ALTER TABLE public.agricultura_programas ENABLE ROW LEVEL SECURITY;
CREATE POLICY super_admin_all_access_agricultura_programas ON public.agricultura_programas FOR ALL USING (is_super_admin());
CREATE POLICY tenant_access_agricultura_programas ON public.agricultura_programas FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE TRIGGER set_updated_at_agricultura_programas
BEFORE UPDATE ON public.agricultura_programas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.agricultura_insumos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  nome varchar NOT NULL,
  categoria varchar,
  tipo_cultivo text[],
  unidade_medida varchar,
  estoque_atual numeric(10,2),
  estoque_minimo numeric(10,2),
  valor_unitario numeric(10,2),
  fornecedor varchar,
  validade date,
  local_armazenamento varchar,
  especificacoes_tecnicas text,
  modo_uso text,
  restricoes_uso text[],
  registro_ministerio varchar,
  status varchar DEFAULT 'disponivel',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_agricultura_insumos_tenant ON public.agricultura_insumos(tenant_id);

ALTER TABLE public.agricultura_insumos ENABLE ROW LEVEL SECURITY;
CREATE POLICY super_admin_all_access_agricultura_insumos ON public.agricultura_insumos FOR ALL USING (is_super_admin());
CREATE POLICY tenant_access_agricultura_insumos ON public.agricultura_insumos FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE TRIGGER set_updated_at_agricultura_insumos
BEFORE UPDATE ON public.agricultura_insumos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.agricultura_distribuicao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  produtor_id uuid REFERENCES public.agricultura_produtores(id) ON DELETE CASCADE,
  programa_id uuid REFERENCES public.agricultura_programas(id) ON DELETE SET NULL,
  insumo_id uuid REFERENCES public.agricultura_insumos(id) ON DELETE SET NULL,
  quantidade numeric(10,2),
  data_distribuicao date,
  responsavel_entrega_id uuid,
  finalidade varchar,
  area_aplicacao_hectares numeric(10,2),
  observacoes text,
  comprovante_entrega text,
  feedback_produtor text,
  resultados_obtidos text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_agricultura_distribuicao_tenant ON public.agricultura_distribuicao(tenant_id);
CREATE INDEX idx_agricultura_distribuicao_produtor ON public.agricultura_distribuicao(produtor_id);

ALTER TABLE public.agricultura_distribuicao ENABLE ROW LEVEL SECURITY;
CREATE POLICY super_admin_all_access_agricultura_distribuicao ON public.agricultura_distribuicao FOR ALL USING (is_super_admin());
CREATE POLICY tenant_access_agricultura_distribuicao ON public.agricultura_distribuicao FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE TRIGGER set_updated_at_agricultura_distribuicao
BEFORE UPDATE ON public.agricultura_distribuicao
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============= MÓDULO 3: ESPORTES =============

CREATE TABLE public.esportes_infraestrutura (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  nome varchar NOT NULL,
  tipo varchar,
  endereco jsonb,
  capacidade integer,
  modalidades text[],
  equipamentos_disponiveis text[],
  horario_funcionamento jsonb,
  valor_locacao_hora numeric(10,2),
  responsavel_id uuid,
  condicoes_uso varchar,
  manutencao_necessaria text[],
  ultima_reforma date,
  acessibilidade boolean DEFAULT FALSE,
  iluminacao boolean DEFAULT FALSE,
  vestiarios integer DEFAULT 0,
  estacionamento integer DEFAULT 0,
  status varchar DEFAULT 'ativo',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_esportes_infraestrutura_tenant ON public.esportes_infraestrutura(tenant_id);

ALTER TABLE public.esportes_infraestrutura ENABLE ROW LEVEL SECURITY;
CREATE POLICY super_admin_all_access_esportes_infraestrutura ON public.esportes_infraestrutura FOR ALL USING (is_super_admin());
CREATE POLICY tenant_access_esportes_infraestrutura ON public.esportes_infraestrutura FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE TRIGGER set_updated_at_esportes_infraestrutura
BEFORE UPDATE ON public.esportes_infraestrutura
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.esportes_equipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  nome varchar NOT NULL,
  modalidade varchar,
  categoria varchar,
  tecnico_nome varchar,
  tecnico_contato jsonb,
  local_treino_id uuid REFERENCES public.esportes_infraestrutura(id) ON DELETE SET NULL,
  horario_treino jsonb,
  atletas_cadastrados integer DEFAULT 0,
  atletas_ativos integer DEFAULT 0,
  equipamentos_fornecidos text[],
  historico_competicoes jsonb,
  conquistas text[],
  patrocinadores text[],
  orcamento_anual numeric(10,2),
  status varchar DEFAULT 'ativa',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_esportes_equipes_tenant ON public.esportes_equipes(tenant_id);

ALTER TABLE public.esportes_equipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY super_admin_all_access_esportes_equipes ON public.esportes_equipes FOR ALL USING (is_super_admin());
CREATE POLICY tenant_access_esportes_equipes ON public.esportes_equipes FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE TRIGGER set_updated_at_esportes_equipes
BEFORE UPDATE ON public.esportes_equipes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.esportes_atletas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  nome_completo varchar NOT NULL,
  cpf varchar UNIQUE,
  data_nascimento date,
  endereco jsonb,
  contato jsonb,
  responsavel_legal jsonb,
  modalidades text[],
  equipe_id uuid REFERENCES public.esportes_equipes(id) ON DELETE SET NULL,
  posicao_funcao varchar,
  nivel_experiencia varchar,
  federado boolean DEFAULT FALSE,
  numero_federacao varchar,
  exame_medico_valido boolean DEFAULT FALSE,
  data_exame_medico date,
  restricoes_medicas text[],
  conquistas_individuais text[],
  historico_lesoes text[],
  status varchar DEFAULT 'ativo',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_esportes_atletas_tenant ON public.esportes_atletas(tenant_id);
CREATE INDEX idx_esportes_atletas_equipe ON public.esportes_atletas(equipe_id);

ALTER TABLE public.esportes_atletas ENABLE ROW LEVEL SECURITY;
CREATE POLICY super_admin_all_access_esportes_atletas ON public.esportes_atletas FOR ALL USING (is_super_admin());
CREATE POLICY tenant_access_esportes_atletas ON public.esportes_atletas FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE TRIGGER set_updated_at_esportes_atletas
BEFORE UPDATE ON public.esportes_atletas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.esportes_competicoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  nome varchar NOT NULL,
  modalidade varchar,
  tipo varchar,
  categoria varchar,
  data_inicio date,
  data_fim date,
  local_realizacao_id uuid REFERENCES public.esportes_infraestrutura(id) ON DELETE SET NULL,
  equipes_participantes integer,
  equipes_inscritas integer DEFAULT 0,
  valor_inscricao numeric(10,2) DEFAULT 0,
  premiacao jsonb,
  regulamento text,
  organizador_id uuid,
  patrocinadores text[],
  orcamento_total numeric(10,2),
  publico_esperado integer,
  publico_presente integer,
  transmissao_online boolean DEFAULT FALSE,
  cobertura_midia text[],
  resultados jsonb,
  status varchar DEFAULT 'planejada',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_esportes_competicoes_tenant ON public.esportes_competicoes(tenant_id);

ALTER TABLE public.esportes_competicoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY super_admin_all_access_esportes_competicoes ON public.esportes_competicoes FOR ALL USING (is_super_admin());
CREATE POLICY tenant_access_esportes_competicoes ON public.esportes_competicoes FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE TRIGGER set_updated_at_esportes_competicoes
BEFORE UPDATE ON public.esportes_competicoes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.esportes_escolinhas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  nome varchar NOT NULL,
  modalidade varchar,
  faixa_etaria_inicio integer,
  faixa_etaria_fim integer,
  professor_id uuid,
  local_atividade_id uuid REFERENCES public.esportes_infraestrutura(id) ON DELETE SET NULL,
  horario jsonb,
  vagas_oferecidas integer,
  vagas_ocupadas integer DEFAULT 0,
  valor_mensalidade numeric(10,2) DEFAULT 0,
  material_incluido text[],
  objetivos text,
  metodologia text,
  avaliacoes_periodicas boolean DEFAULT TRUE,
  apresentacoes_publicas boolean DEFAULT FALSE,
  uniforme_fornecido boolean DEFAULT FALSE,
  seguro_incluido boolean DEFAULT FALSE,
  lista_espera integer DEFAULT 0,
  status varchar DEFAULT 'ativa',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_esportes_escolinhas_tenant ON public.esportes_escolinhas(tenant_id);

ALTER TABLE public.esportes_escolinhas ENABLE ROW LEVEL SECURITY;
CREATE POLICY super_admin_all_access_esportes_escolinhas ON public.esportes_escolinhas FOR ALL USING (is_super_admin());
CREATE POLICY tenant_access_esportes_escolinhas ON public.esportes_escolinhas FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE TRIGGER set_updated_at_esportes_escolinhas
BEFORE UPDATE ON public.esportes_escolinhas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============= MÓDULO 4: TURISMO =============

CREATE TABLE public.turismo_pontos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  nome varchar NOT NULL,
  descricao text,
  categoria varchar,
  endereco jsonb,
  coordenadas_gps jsonb,
  horario_funcionamento jsonb,
  valor_entrada numeric(10,2) DEFAULT 0,
  acessibilidade boolean DEFAULT FALSE,
  infraestrutura text[],
  capacidade_visitantes integer,
  melhor_epoca_visita varchar,
  tempo_visita_sugerido integer,
  nivel_dificuldade varchar,
  restricoes_idade text[],
  fotos text[],
  videos text[],
  avaliacoes jsonb,
  responsavel_manutencao varchar,
  status varchar DEFAULT 'ativo',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_turismo_pontos_tenant ON public.turismo_pontos(tenant_id);

ALTER TABLE public.turismo_pontos ENABLE ROW LEVEL SECURITY;
CREATE POLICY super_admin_all_access_turismo_pontos ON public.turismo_pontos FOR ALL USING (is_super_admin());
CREATE POLICY tenant_access_turismo_pontos ON public.turismo_pontos FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE TRIGGER set_updated_at_turismo_pontos
BEFORE UPDATE ON public.turismo_pontos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.turismo_estabelecimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  nome varchar NOT NULL,
  tipo varchar,
  categoria varchar,
  proprietario_nome varchar,
  cnpj varchar,
  endereco jsonb,
  contato jsonb,
  capacidade integer,
  servicos_oferecidos text[],
  comodidades text[],
  preco_medio numeric(10,2),
  horario_funcionamento jsonb,
  aceita_cartao boolean DEFAULT FALSE,
  aceita_pix boolean DEFAULT FALSE,
  wifi_gratuito boolean DEFAULT FALSE,
  estacionamento boolean DEFAULT FALSE,
  acessibilidade boolean DEFAULT FALSE,
  certificacoes text[],
  avaliacoes jsonb,
  fotos text[],
  website varchar,
  redes_sociais jsonb,
  status varchar DEFAULT 'ativo',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_turismo_estabelecimentos_tenant ON public.turismo_estabelecimentos(tenant_id);

ALTER TABLE public.turismo_estabelecimentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY super_admin_all_access_turismo_estabelecimentos ON public.turismo_estabelecimentos FOR ALL USING (is_super_admin());
CREATE POLICY tenant_access_turismo_estabelecimentos ON public.turismo_estabelecimentos FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE TRIGGER set_updated_at_turismo_estabelecimentos
BEFORE UPDATE ON public.turismo_estabelecimentos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.turismo_roteiros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  nome varchar NOT NULL,
  descricao text,
  tipo varchar,
  duracao_horas integer,
  dificuldade varchar,
  publico_alvo varchar,
  pontos_turisticos uuid[],
  estabelecimentos uuid[],
  ordem_visitacao jsonb,
  custo_estimado numeric(10,2),
  melhor_epoca varchar,
  restricoes text[],
  equipamentos_necessarios text[],
  guia_necessario boolean DEFAULT FALSE,
  transporte_incluido boolean DEFAULT FALSE,
  alimentacao_incluida boolean DEFAULT FALSE,
  mapa_roteiro text,
  fotos text[],
  avaliacoes jsonb,
  criado_por_id uuid,
  status varchar DEFAULT 'ativo',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_turismo_roteiros_tenant ON public.turismo_roteiros(tenant_id);

ALTER TABLE public.turismo_roteiros ENABLE ROW LEVEL SECURITY;
CREATE POLICY super_admin_all_access_turismo_roteiros ON public.turismo_roteiros FOR ALL USING (is_super_admin());
CREATE POLICY tenant_access_turismo_roteiros ON public.turismo_roteiros FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE TRIGGER set_updated_at_turismo_roteiros
BEFORE UPDATE ON public.turismo_roteiros
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.turismo_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  nome varchar NOT NULL,
  descricao text,
  tipo varchar,
  categoria varchar,
  data_inicio date,
  data_fim date,
  local_realizacao varchar,
  ponto_turistico_id uuid REFERENCES public.turismo_pontos(id) ON DELETE SET NULL,
  publico_esperado integer,
  publico_presente integer,
  valor_entrada numeric(10,2) DEFAULT 0,
  organizador varchar,
  patrocinadores text[],
  atracoes text[],
  programacao jsonb,
  infraestrutura_montada text[],
  seguranca_contratada boolean DEFAULT FALSE,
  ambulancia_standby boolean DEFAULT FALSE,
  cobertura_midia text[],
  impacto_economico_estimado numeric(10,2),
  hospedagens_reservadas integer,
  restaurantes_participantes integer,
  avaliacoes jsonb,
  status varchar DEFAULT 'planejado',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_turismo_eventos_tenant ON public.turismo_eventos(tenant_id);

ALTER TABLE public.turismo_eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY super_admin_all_access_turismo_eventos ON public.turismo_eventos FOR ALL USING (is_super_admin());
CREATE POLICY tenant_access_turismo_eventos ON public.turismo_eventos FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE TRIGGER set_updated_at_turismo_eventos
BEFORE UPDATE ON public.turismo_eventos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.turismo_visitantes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  data_visita date,
  ponto_turistico_id uuid REFERENCES public.turismo_pontos(id) ON DELETE SET NULL,
  estabelecimento_id uuid REFERENCES public.turismo_estabelecimentos(id) ON DELETE SET NULL,
  evento_id uuid REFERENCES public.turismo_eventos(id) ON DELETE SET NULL,
  origem_visitante varchar,
  cidade_origem varchar,
  estado_origem varchar,
  pais_origem varchar DEFAULT 'Brasil',
  faixa_etaria varchar,
  sexo varchar,
  motivo_visita varchar,
  meio_transporte varchar,
  forma_conhecimento varchar,
  gasto_estimado numeric(10,2),
  avaliacao_geral integer,
  sugestoes text,
  permanencia_dias integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_turismo_visitantes_tenant ON public.turismo_visitantes(tenant_id);

ALTER TABLE public.turismo_visitantes ENABLE ROW LEVEL SECURITY;
CREATE POLICY super_admin_all_access_turismo_visitantes ON public.turismo_visitantes FOR ALL USING (is_super_admin());
CREATE POLICY tenant_access_turismo_visitantes ON public.turismo_visitantes FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE TRIGGER set_updated_at_turismo_visitantes
BEFORE UPDATE ON public.turismo_visitantes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============= MÓDULO 5: HABITAÇÃO =============

CREATE TABLE public.habitacao_programas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  nome varchar NOT NULL,
  tipo varchar,
  descricao text,
  publico_alvo text,
  renda_maxima numeric(10,2),
  renda_minima numeric(10,2),
  data_inicio date,
  data_fim date,
  unidades_previstas integer,
  unidades_entregues integer DEFAULT 0,
  valor_subsidiado numeric(10,2),
  valor_financiado numeric(10,2),
  entrada_necessaria numeric(10,2),
  prestacao_maxima numeric(10,2),
  prazo_financiamento integer,
  documentos_necessarios text[],
  criterios_pontuacao jsonb,
  fonte_recurso varchar,
  orcamento_total numeric(10,2),
  coordenador_id uuid,
  status varchar DEFAULT 'planejamento',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_habitacao_programas_tenant ON public.habitacao_programas(tenant_id);

ALTER TABLE public.habitacao_programas ENABLE ROW LEVEL SECURITY;
CREATE POLICY super_admin_all_access_habitacao_programas ON public.habitacao_programas FOR ALL USING (is_super_admin());
CREATE POLICY tenant_access_habitacao_programas ON public.habitacao_programas FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE TRIGGER set_updated_at_habitacao_programas
BEFORE UPDATE ON public.habitacao_programas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.habitacao_familias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  responsavel_nome varchar NOT NULL,
  responsavel_cpf varchar UNIQUE,
  responsavel_rg varchar,
  data_nascimento date,
  estado_civil varchar,
  profissao varchar,
  endereco_atual jsonb,
  contato jsonb,
  renda_familiar numeric(10,2),
  composicao_familiar jsonb,
  pessoas_deficiencia integer DEFAULT 0,
  pessoas_idosas integer DEFAULT 0,
  criancas_adolescentes integer DEFAULT 0,
  situacao_atual varchar,
  valor_aluguel_atual numeric(10,2),
  tempo_municipio integer,
  situacao_documentos varchar,
  programas_interesse uuid[],
  pontuacao_social numeric(5,2),
  vulnerabilidades text[],
  observacoes text,
  status varchar DEFAULT 'ativo',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_habitacao_familias_tenant ON public.habitacao_familias(tenant_id);

ALTER TABLE public.habitacao_familias ENABLE ROW LEVEL SECURITY;
CREATE POLICY super_admin_all_access_habitacao_familias ON public.habitacao_familias FOR ALL USING (is_super_admin());
CREATE POLICY tenant_access_habitacao_familias ON public.habitacao_familias FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE TRIGGER set_updated_at_habitacao_familias
BEFORE UPDATE ON public.habitacao_familias
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.habitacao_unidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  programa_id uuid REFERENCES public.habitacao_programas(id) ON DELETE SET NULL,
  endereco jsonb,
  numero_unidade varchar,
  tipo varchar,
  area_construida numeric(8,2),
  area_terreno numeric(8,2),
  quartos integer,
  banheiros integer,
  garagem boolean DEFAULT FALSE,
  quintal boolean DEFAULT FALSE,
  acessibilidade boolean DEFAULT FALSE,
  valor_avaliacao numeric(10,2),
  valor_venda numeric(10,2),
  situacao varchar,
  familia_beneficiada_id uuid REFERENCES public.habitacao_familias(id) ON DELETE SET NULL,
  data_entrega date,
  escritura_registrada boolean DEFAULT FALSE,
  financiamento_aprovado boolean DEFAULT FALSE,
  observacoes text,
  fotos text[],
  status varchar DEFAULT 'disponivel',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_habitacao_unidades_tenant ON public.habitacao_unidades(tenant_id);

ALTER TABLE public.habitacao_unidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY super_admin_all_access_habitacao_unidades ON public.habitacao_unidades FOR ALL USING (is_super_admin());
CREATE POLICY tenant_access_habitacao_unidades ON public.habitacao_unidades FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE TRIGGER set_updated_at_habitacao_unidades
BEFORE UPDATE ON public.habitacao_unidades
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.habitacao_selecao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  programa_id uuid REFERENCES public.habitacao_programas(id) ON DELETE CASCADE,
  familia_id uuid REFERENCES public.habitacao_familias(id) ON DELETE CASCADE,
  data_inscricao date,
  documentos_entregues text[],
  documentos_pendentes text[],
  pontuacao_final numeric(5,2),
  classificacao integer,
  aprovado boolean DEFAULT FALSE,
  motivo_reprovacao text,
  recurso_apresentado boolean DEFAULT FALSE,
  recurso_aprovado boolean DEFAULT FALSE,
  unidade_indicada_id uuid REFERENCES public.habitacao_unidades(id) ON DELETE SET NULL,
  data_aprovacao date,
  observacoes text,
  status varchar DEFAULT 'analise',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_habitacao_selecao_tenant ON public.habitacao_selecao(tenant_id);

ALTER TABLE public.habitacao_selecao ENABLE ROW LEVEL SECURITY;
CREATE POLICY super_admin_all_access_habitacao_selecao ON public.habitacao_selecao FOR ALL USING (is_super_admin());
CREATE POLICY tenant_access_habitacao_selecao ON public.habitacao_selecao FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE TRIGGER set_updated_at_habitacao_selecao
BEFORE UPDATE ON public.habitacao_selecao
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.habitacao_regularizacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  requerente_nome varchar NOT NULL,
  requerente_cpf varchar,
  endereco_imovel jsonb,
  area_ocupada numeric(10,2),
  tempo_ocupacao integer,
  tipo_ocupacao varchar,
  documentos_posse text[],
  situacao_legal varchar,
  processo_judicial varchar,
  valor_avaliacao numeric(10,2),
  taxa_regularizacao numeric(10,2),
  parcelamento_aprovado boolean DEFAULT FALSE,
  numero_parcelas integer,
  valor_parcela numeric(10,2),
  parcelas_pagas integer DEFAULT 0,
  documentacao_final text[],
  registro_cartorio boolean DEFAULT FALSE,
  observacoes text,
  responsavel_tecnico_id uuid,
  status varchar DEFAULT 'protocolo',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_habitacao_regularizacao_tenant ON public.habitacao_regularizacao(tenant_id);

ALTER TABLE public.habitacao_regularizacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY super_admin_all_access_habitacao_regularizacao ON public.habitacao_regularizacao FOR ALL USING (is_super_admin());
CREATE POLICY tenant_access_habitacao_regularizacao ON public.habitacao_regularizacao FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE TRIGGER set_updated_at_habitacao_regularizacao
BEFORE UPDATE ON public.habitacao_regularizacao
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============= MÓDULO 6: MEIO AMBIENTE =============

CREATE TABLE public.meio_ambiente_licenciamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  requerente_nome varchar NOT NULL,
  requerente_cpf_cnpj varchar,
  atividade_licenciada varchar,
  tipo_licenca varchar,
  endereco_atividade jsonb,
  area_impacto numeric(10,2),
  descricao_atividade text,
  estudos_ambientais text[],
  impactos_identificados text[],
  medidas_mitigadoras text[],
  condicoes_impostas text[],
  data_protocolo date,
  data_vistoria date,
  data_emissao date,
  data_validade date,
  numero_licenca varchar,
  valor_taxa numeric(10,2),
  responsavel_tecnico varchar,
  observacoes text,
  documentos_anexos text[],
  status varchar DEFAULT 'protocolo',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_meio_ambiente_licenciamento_tenant ON public.meio_ambiente_licenciamento(tenant_id);

ALTER TABLE public.meio_ambiente_licenciamento ENABLE ROW LEVEL SECURITY;
CREATE POLICY super_admin_all_access_meio_ambiente_licenciamento ON public.meio_ambiente_licenciamento FOR ALL USING (is_super_admin());
CREATE POLICY tenant_access_meio_ambiente_licenciamento ON public.meio_ambiente_licenciamento FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE TRIGGER set_updated_at_meio_ambiente_licenciamento
BEFORE UPDATE ON public.meio_ambiente_licenciamento
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.meio_ambiente_denuncias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  denunciante_nome varchar,
  denunciante_contato jsonb,
  anonimo boolean DEFAULT FALSE,
  local_ocorrencia jsonb,
  coordenadas_gps jsonb,
  tipo_denuncia varchar,
  descricao_fatos text,
  data_ocorrencia date,
  horario_ocorrencia time,
  frequencia_ocorrencia varchar,
  evidencias text[],
  responsavel_presumido varchar,
  urgencia varchar,
  riscos_identificados text[],
  data_vistoria date,
  responsavel_vistoria_id uuid,
  relatorio_vistoria text,
  medidas_adotadas text[],
  multa_aplicada boolean DEFAULT FALSE,
  valor_multa numeric(10,2),
  processo_judicial boolean DEFAULT FALSE,
  feedback_denunciante text,
  status varchar DEFAULT 'registrada',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_meio_ambiente_denuncias_tenant ON public.meio_ambiente_denuncias(tenant_id);

ALTER TABLE public.meio_ambiente_denuncias ENABLE ROW LEVEL SECURITY;
CREATE POLICY super_admin_all_access_meio_ambiente_denuncias ON public.meio_ambiente_denuncias FOR ALL USING (is_super_admin());
CREATE POLICY tenant_access_meio_ambiente_denuncias ON public.meio_ambiente_denuncias FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE TRIGGER set_updated_at_meio_ambiente_denuncias
BEFORE UPDATE ON public.meio_ambiente_denuncias
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.meio_ambiente_areas_protegidas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  nome varchar NOT NULL,
  tipo varchar,
  categoria varchar,
  area_hectares numeric(10,2),
  perimetro_km numeric(8,2),
  coordenadas_poligono jsonb,
  bioma varchar,
  vegetacao_predominante varchar,
  fauna_presente text[],
  recursos_hidricos text[],
  uso_permitido text[],
  restricoes text[],
  plano_manejo text,
  gestor_responsavel varchar,
  atividades_monitoramento text[],
  ameacas_identificadas text[],
  acoes_conservacao text[],
  visitacao_permitida boolean DEFAULT FALSE,
  infraestrutura text[],
  estudos_realizados text[],
  legislacao_aplicavel text[],
  observacoes text,
  status varchar DEFAULT 'ativa',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_meio_ambiente_areas_protegidas_tenant ON public.meio_ambiente_areas_protegidas(tenant_id);

ALTER TABLE public.meio_ambiente_areas_protegidas ENABLE ROW LEVEL SECURITY;
CREATE POLICY super_admin_all_access_meio_ambiente_areas_protegidas ON public.meio_ambiente_areas_protegidas FOR ALL USING (is_super_admin());
CREATE POLICY tenant_access_meio_ambiente_areas_protegidas ON public.meio_ambiente_areas_protegidas FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE TRIGGER set_updated_at_meio_ambiente_areas_protegidas
BEFORE UPDATE ON public.meio_ambiente_areas_protegidas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.meio_ambiente_educacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  programa_nome varchar NOT NULL,
  descricao text,
  publico_alvo varchar,
  faixa_etaria varchar,
  temas_abordados text[],
  metodologia text,
  local_realizacao varchar,
  carga_horaria integer,
  numero_participantes integer,
  educador_responsavel varchar,
  material_didatico text[],
  atividades_praticas text[],
  recursos_necessarios text[],
  parcerias text[],
  data_inicio date,
  data_fim date,
  cronograma jsonb,
  orcamento numeric(10,2),
  resultados_alcancados text,
  avaliacoes jsonb,
  certificacao boolean DEFAULT FALSE,
  multiplicadores_formados integer DEFAULT 0,
  impacto_medido text,
  status varchar DEFAULT 'planejado',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_meio_ambiente_educacao_tenant ON public.meio_ambiente_educacao(tenant_id);

ALTER TABLE public.meio_ambiente_educacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY super_admin_all_access_meio_ambiente_educacao ON public.meio_ambiente_educacao FOR ALL USING (is_super_admin());
CREATE POLICY tenant_access_meio_ambiente_educacao ON public.meio_ambiente_educacao FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE TRIGGER set_updated_at_meio_ambiente_educacao
BEFORE UPDATE ON public.meio_ambiente_educacao
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.meio_ambiente_monitoramento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  tipo_monitoramento varchar,
  ponto_coleta varchar,
  coordenadas_gps jsonb,
  parametros_monitorados jsonb,
  frequencia_coleta varchar,
  equipamentos_utilizados text[],
  responsavel_coleta varchar,
  data_coleta date,
  horario_coleta time,
  resultados jsonb,
  valores_referencia jsonb,
  conformidade boolean,
  desvios_identificados text[],
  acoes_corretivas text[],
  relatorio_tecnico text,
  laudos_laboratoriais text[],
  tendencias_observadas text,
  recomendacoes text[],
  proxima_coleta date,
  status varchar DEFAULT 'coletado',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_meio_ambiente_monitoramento_tenant ON public.meio_ambiente_monitoramento(tenant_id);

ALTER TABLE public.meio_ambiente_monitoramento ENABLE ROW LEVEL SECURITY;
CREATE POLICY super_admin_all_access_meio_ambiente_monitoramento ON public.meio_ambiente_monitoramento FOR ALL USING (is_super_admin());
CREATE POLICY tenant_access_meio_ambiente_monitoramento ON public.meio_ambiente_monitoramento FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE TRIGGER set_updated_at_meio_ambiente_monitoramento
BEFORE UPDATE ON public.meio_ambiente_monitoramento
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();




-- ====================================================================
-- MIGRAÇÃO: 20250818192810_9f1ed6b8-5677-45a3-9e40-fec220fba79f.sql
-- ====================================================================

-- ============================================
-- PLANEJAMENTO URBANO
-- ============================================

-- Projetos Urbanos
CREATE TABLE planejamento_projetos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  nome VARCHAR NOT NULL,
  tipo VARCHAR, -- loteamento, edificacao, reforma, demolicao, infraestrutura
  categoria VARCHAR, -- nova, reforma, ampliacao, manutencao, restauracao
  descricao TEXT,
  endereco_projeto JSONB,
  area_total DECIMAL(10,2),
  area_construida DECIMAL(10,2),
  numero_unidades INTEGER,
  numero_pavimentos INTEGER,
  uso_pretendido VARCHAR, -- residencial, comercial, industrial, misto
  zoneamento VARCHAR,
  coeficiente_aproveitamento DECIMAL(4,2),
  taxa_ocupacao DECIMAL(4,2),
  taxa_permeabilidade DECIMAL(4,2),
  vagas_estacionamento INTEGER,
  responsavel_tecnico VARCHAR,
  crea_responsavel VARCHAR,
  documentos_projeto TEXT[],
  plantas_aprovadas TEXT[],
  memoriais TEXT[],
  data_protocolo DATE,
  data_analise DATE,
  data_aprovacao DATE,
  validade_aprovacao DATE,
  condicoes_aprovacao TEXT[],
  observacoes TEXT,
  status VARCHAR DEFAULT 'protocolo', -- protocolo, analise, aprovado, reprovado, vencido
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alvarás
CREATE TABLE planejamento_alvaras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  tipo_alvara VARCHAR, -- construcao, funcionamento, demolicao, reforma
  numero_alvara VARCHAR UNIQUE,
  projeto_id UUID REFERENCES planejamento_projetos(id),
  requerente_nome VARCHAR,
  endereco_obra JSONB,
  atividade_exercida VARCHAR,
  area_autorizada DECIMAL(10,2),
  prazo_execucao INTEGER, -- dias
  data_emissao DATE,
  data_vencimento DATE,
  valor_taxa DECIMAL(10,2),
  responsavel_obra VARCHAR,
  crea_responsavel VARCHAR,
  condicoes_especiais TEXT[],
  vistorias_obrigatorias TEXT[],
  penalidades TEXT[],
  renovacao_automatica BOOLEAN DEFAULT FALSE,
  observacoes TEXT,
  documentos_anexos TEXT[],
  status VARCHAR DEFAULT 'vigente', -- vigente, vencido, suspenso, cancelado
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vistorias
CREATE TABLE planejamento_vistorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  alvara_id UUID REFERENCES planejamento_alvaras(id),
  projeto_id UUID REFERENCES planejamento_projetos(id),
  tipo_vistoria VARCHAR, -- inicial, intermediaria, final, fiscalizacao
  data_agendamento DATE,
  data_realizacao DATE,
  fiscal_responsavel_id UUID,
  observacoes_vistoria TEXT,
  irregularidades_encontradas TEXT[],
  conformidades_verificadas TEXT[],
  medidas_solicitadas TEXT[],
  prazo_regularizacao INTEGER, -- dias
  aprovado BOOLEAN DEFAULT FALSE,
  multa_aplicada BOOLEAN DEFAULT FALSE,
  valor_multa DECIMAL(10,2),
  embargo_obra BOOLEAN DEFAULT FALSE,
  fotos_vistoria TEXT[],
  relatorio_tecnico TEXT,
  proxima_vistoria DATE,
  status VARCHAR DEFAULT 'agendada', -- agendada, realizada, aprovada, reprovada
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Consultas Públicas
CREATE TABLE planejamento_consultas_publicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  assunto VARCHAR NOT NULL,
  tipo VARCHAR, -- plano_diretor, lei_zoneamento, projeto_lei, obra_publica
  descricao TEXT,
  justificativa TEXT,
  documentos_consulta TEXT[],
  data_inicio DATE,
  data_fim DATE,
  local_realizacao VARCHAR,
  audiencia_publica BOOLEAN DEFAULT FALSE,
  data_audiencia DATE,
  participantes_esperados INTEGER,
  participantes_efetivos INTEGER,
  contribuicoes_recebidas INTEGER DEFAULT 0,
  contribuicoes JSONB,
  parecer_tecnico TEXT,
  decisao_final TEXT,
  impacto_contribuicoes TEXT,
  publicacao_resultado TEXT,
  responsavel_id UUID,
  comissao_analise TEXT[],
  status VARCHAR DEFAULT 'preparacao', -- preparacao, andamento, analise, concluida
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Zoneamento Urbano
CREATE TABLE planejamento_zoneamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  zona_nome VARCHAR NOT NULL,
  sigla VARCHAR,
  tipo_zona VARCHAR, -- residencial, comercial, industrial, mista, rural, especial
  descricao TEXT,
  uso_permitido TEXT[],
  uso_proibido TEXT[],
  coeficiente_aproveitamento_maximo DECIMAL(4,2),
  taxa_ocupacao_maxima DECIMAL(4,2),
  taxa_permeabilidade_minima DECIMAL(4,2),
  gabarito_maximo INTEGER, -- pavimentos
  recuos_obrigatorios JSONB,
  vagas_estacionamento_obrigatorias DECIMAL(4,2),
  restricoes_especiais TEXT[],
  incentivos_fiscais TEXT[],
  coordenadas_perimetro JSONB,
  area_hectares DECIMAL(10,2),
  populacao_estimada INTEGER,
  densidade_permitida DECIMAL(8,2),
  equipamentos_publicos_obrigatorios TEXT[],
  legislacao_base TEXT,
  data_criacao DATE,
  ultima_alteracao DATE,
  observacoes TEXT,
  status VARCHAR DEFAULT 'vigente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- OBRAS PÚBLICAS
-- ============================================

-- Obras e Intervenções
CREATE TABLE obras_projetos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  nome VARCHAR NOT NULL,
  tipo VARCHAR, -- rua, praca, ponte, escola, posto_saude, rede_agua, rede_esgoto
  categoria VARCHAR, -- nova, reforma, ampliacao, manutencao, restauracao
  descricao TEXT,
  endereco_obra JSONB,
  coordenadas_gps JSONB,
  area_intervencao DECIMAL(10,2),
  extensao_metros DECIMAL(10,2),
  valor_orcado DECIMAL(12,2),
  valor_contratado DECIMAL(12,2),
  fonte_recurso VARCHAR, -- municipal, estadual, federal, financiamento, convenio
  numero_convenio VARCHAR,
  empresa_contratada VARCHAR,
  cnpj_contratada VARCHAR,
  numero_contrato VARCHAR,
  responsavel_tecnico VARCHAR,
  crea_responsavel VARCHAR,
  data_inicio_prevista DATE,
  data_fim_prevista DATE,
  data_inicio_real DATE,
  data_fim_real DATE,
  prazo_dias INTEGER,
  percentual_executado DECIMAL(5,2) DEFAULT 0,
  etapas_previstas JSONB,
  etapas_concluidas JSONB,
  observacoes TEXT,
  status VARCHAR DEFAULT 'licitacao', -- licitacao, contratada, iniciada, pausada, concluida, cancelada
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Acompanhamento de Obras
CREATE TABLE obras_acompanhamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  obra_id UUID REFERENCES obras_projetos(id),
  data_visita DATE,
  fiscal_responsavel_id UUID,
  percentual_fisico DECIMAL(5,2),
  percentual_financeiro DECIMAL(5,2),
  atividades_executadas TEXT[],
  atividades_previstas_proxima TEXT[],
  materiais_utilizados JSONB,
  equipamentos_obra TEXT[],
  funcionarios_presentes INTEGER,
  condicoes_climaticas VARCHAR,
  problemas_identificados TEXT[],
  solucoes_propostas TEXT[],
  prazos_afetados BOOLEAN DEFAULT FALSE,
  justificativa_atrasos TEXT,
  medidas_corretivas TEXT[],
  seguranca_trabalho VARCHAR, -- adequada, inadequada, critica
  impacto_transito VARCHAR, -- baixo, medio, alto
  impacto_comunidade VARCHAR, -- baixo, medio, alto
  fotos_progresso TEXT[],
  relatorio_tecnico TEXT,
  aprovacao_etapa BOOLEAN DEFAULT FALSE,
  observacoes TEXT,
  proxima_visita DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ENABLE RLS AND TRIGGERS
-- ============================================

-- Enable RLS for all new tables
ALTER TABLE planejamento_projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE planejamento_alvaras ENABLE ROW LEVEL SECURITY;
ALTER TABLE planejamento_vistorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE planejamento_consultas_publicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE planejamento_zoneamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE obras_projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE obras_acompanhamento ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Planejamento
CREATE POLICY "super_admin_all_access_planejamento_projetos" ON planejamento_projetos FOR ALL USING (is_super_admin());
CREATE POLICY "tenant_access_planejamento_projetos" ON planejamento_projetos FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE POLICY "super_admin_all_access_planejamento_alvaras" ON planejamento_alvaras FOR ALL USING (is_super_admin());
CREATE POLICY "tenant_access_planejamento_alvaras" ON planejamento_alvaras FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE POLICY "super_admin_all_access_planejamento_vistorias" ON planejamento_vistorias FOR ALL USING (is_super_admin());
CREATE POLICY "tenant_access_planejamento_vistorias" ON planejamento_vistorias FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE POLICY "super_admin_all_access_planejamento_consultas_publicas" ON planejamento_consultas_publicas FOR ALL USING (is_super_admin());
CREATE POLICY "tenant_access_planejamento_consultas_publicas" ON planejamento_consultas_publicas FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE POLICY "super_admin_all_access_planejamento_zoneamento" ON planejamento_zoneamento FOR ALL USING (is_super_admin());
CREATE POLICY "tenant_access_planejamento_zoneamento" ON planejamento_zoneamento FOR ALL USING (tenant_id = get_current_user_tenant());

-- RLS Policies for Obras
CREATE POLICY "super_admin_all_access_obras_projetos" ON obras_projetos FOR ALL USING (is_super_admin());
CREATE POLICY "tenant_access_obras_projetos" ON obras_projetos FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE POLICY "super_admin_all_access_obras_acompanhamento" ON obras_acompanhamento FOR ALL USING (is_super_admin());
CREATE POLICY "tenant_access_obras_acompanhamento" ON obras_acompanhamento FOR ALL USING (tenant_id = get_current_user_tenant());

-- Updated_at triggers
CREATE TRIGGER update_planejamento_projetos_updated_at BEFORE UPDATE ON planejamento_projetos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_planejamento_alvaras_updated_at BEFORE UPDATE ON planejamento_alvaras FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_planejamento_vistorias_updated_at BEFORE UPDATE ON planejamento_vistorias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_planejamento_consultas_publicas_updated_at BEFORE UPDATE ON planejamento_consultas_publicas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_planejamento_zoneamento_updated_at BEFORE UPDATE ON planejamento_zoneamento FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_obras_projetos_updated_at BEFORE UPDATE ON obras_projetos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_obras_acompanhamento_updated_at BEFORE UPDATE ON obras_acompanhamento FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ====================================================================
-- MIGRAÇÃO: 20250818192939_761c62da-0483-489c-8cb2-db34b8201cdf.sql
-- ====================================================================

-- ============================================
-- SERVIÇOS PÚBLICOS
-- ============================================

-- Iluminação Pública
CREATE TABLE servicos_iluminacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  endereco JSONB,
  coordenadas_gps JSONB,
  tipo_luminaria VARCHAR, -- led, vapor_sodio, vapor_mercurio, fluorescente
  potencia_watts INTEGER,
  altura_poste DECIMAL(4,2),
  tipo_poste VARCHAR, -- concreto, madeira, metalico
  numero_patrimonio VARCHAR,
  data_instalacao DATE,
  fornecedor_instalacao VARCHAR,
  garantia_meses INTEGER,
  ultima_manutencao DATE,
  proxima_manutencao DATE,
  consumo_kwh DECIMAL(8,2),
  custo_energia_mensal DECIMAL(8,2),
  funcionamento VARCHAR, -- normal, intermitente, apagado, queimado
  problemas_reportados TEXT[],
  reparos_realizados JSONB,
  impacto_seguranca VARCHAR, -- alto, medio, baixo
  fluxo_pessoas VARCHAR, -- alto, medio, baixo
  reclamacoes_cidadaos INTEGER DEFAULT 0,
  responsavel_manutencao VARCHAR,
  observacoes TEXT,
  status VARCHAR DEFAULT 'funcionando', -- funcionando, defeito, manutencao, substituir
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Limpeza Urbana
CREATE TABLE servicos_limpeza (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  tipo_servico VARCHAR, -- coleta_regular, coleta_seletiva, varricao, capina, poda
  area_atendida VARCHAR,
  logradouros TEXT[],
  bairros_atendidos TEXT[],
  frequencia VARCHAR, -- diaria, dias_alternados, semanal, quinzenal, mensal
  dias_semana TEXT[], -- seg, ter, qua, qui, sex, sab, dom
  horario_inicio TIME,
  horario_fim TIME,
  equipe_responsavel VARCHAR,
  numero_funcionarios INTEGER,
  veiculos_utilizados TEXT[],
  equipamentos_utilizados TEXT[],
  quilometragem_percorrida DECIMAL(8,2),
  volume_coletado DECIMAL(8,2), -- toneladas ou m3
  material_reciclavel DECIMAL(8,2),
  residuos_organicos DECIMAL(8,2),
  entulho_coletado DECIMAL(8,2),
  pontos_criticos TEXT[],
  problemas_encontrados TEXT[],
  cidadaos_orientados INTEGER DEFAULT 0,
  multas_aplicadas INTEGER DEFAULT 0,
  custo_operacional DECIMAL(10,2),
  combustivel_gasto DECIMAL(8,2),
  manutencao_equipamentos DECIMAL(8,2),
  avaliacao_qualidade VARCHAR, -- excelente, boa, regular, ruim
  reclamacoes INTEGER DEFAULT 0,
  elogios INTEGER DEFAULT 0,
  observacoes TEXT,
  status VARCHAR DEFAULT 'executado',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Problemas Urbanos Reportados
CREATE TABLE servicos_problemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  tipo_problema VARCHAR, -- buraco_rua, lixo_acumulado, arvore_caida, poste_quebrado, vazamento
  categoria VARCHAR, -- urgente, normal, programada
  endereco JSONB,
  coordenadas_gps JSONB,
  descricao TEXT,
  solicitante_nome VARCHAR,
  solicitante_contato JSONB,
  anonimo BOOLEAN DEFAULT FALSE,
  canal_entrada VARCHAR, -- telefone, site, app, presencial, ouvidoria
  data_abertura DATE,
  horario_abertura TIME,
  fotos_problema TEXT[],
  impacto_seguranca VARCHAR, -- alto, medio, baixo
  impacto_transito VARCHAR, -- alto, medio, baixo
  urgencia VARCHAR, -- critica, alta, media, baixa
  area_responsavel VARCHAR,
  funcionario_designado_id UUID,
  data_agendamento DATE,
  data_resolucao DATE,
  tempo_resolucao INTEGER, -- horas
  solucao_aplicada TEXT,
  materiais_utilizados TEXT[],
  custo_reparo DECIMAL(8,2),
  fotos_resolucao TEXT[],
  satisfacao_solicitante INTEGER, -- 1 a 5
  feedback_solicitante TEXT,
  reincidencia BOOLEAN DEFAULT FALSE,
  problemas_relacionados UUID[],
  observacoes TEXT,
  status VARCHAR DEFAULT 'aberto', -- aberto, agendado, andamento, resolvido, fechado
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coleta Especial
CREATE TABLE servicos_coleta_especial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  tipo_material VARCHAR, -- entulho, moveis, eletronicos, podas, grandes_volumes
  solicitante_nome VARCHAR,
  solicitante_cpf VARCHAR,
  endereco_coleta JSONB,
  contato_solicitante JSONB,
  quantidade_estimada DECIMAL(8,2),
  unidade_medida VARCHAR, -- m3, toneladas, unidades
  descricao_material TEXT,
  origem_material VARCHAR, -- residencial, comercial, construcao, reforma
  acesso_veiculo VARCHAR, -- facil, dificil, impossivel
  equipamento_necessario VARCHAR, -- caminhao, munck, cacamba, container
  data_solicitacao DATE,
  data_agendada DATE,
  horario_agendado TIME,
  data_coleta DATE,
  horario_coleta TIME,
  equipe_coleta VARCHAR,
  veiculo_utilizado VARCHAR,
  quantidade_coletada DECIMAL(8,2),
  destino_material VARCHAR, -- aterro, reciclagem, reuso, incineracao
  valor_servico DECIMAL(8,2),
  taxa_cobrada DECIMAL(8,2),
  forma_pagamento VARCHAR,
  comprovante_pagamento VARCHAR,
  fotos_antes TEXT[],
  fotos_depois TEXT[],
  observacoes TEXT,
  avaliacao_servico INTEGER, -- 1 a 5
  status VARCHAR DEFAULT 'solicitada', -- solicitada, agendada, coletada, finalizada
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Manutenção de Praças e Parques
CREATE TABLE servicos_areas_verdes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  nome_local VARCHAR NOT NULL,
  tipo_area VARCHAR, -- praca, parque, canteiro, jardim, area_verde
  endereco JSONB,
  area_m2 DECIMAL(10,2),
  responsavel_manutencao VARCHAR,
  frequencia_manutencao VARCHAR, -- semanal, quinzenal, mensal
  ultimo_servico DATE,
  proximo_servico DATE,
  servicos_realizados JSONB, -- corte_grama, poda, irrigacao, limpeza
  especies_plantadas TEXT[],
  arvores_quantidade INTEGER,
  estado_conservacao VARCHAR, -- excelente, bom, regular, ruim, critico
  equipamentos_instalados TEXT[], -- bancos, playground, academia, iluminacao
  equipamentos_danificados TEXT[],
  necessidades_reparos TEXT[],
  irrigacao VARCHAR, -- automatica, manual, nao_possui
  sistema_drenagem BOOLEAN DEFAULT FALSE,
  acessibilidade BOOLEAN DEFAULT FALSE,
  seguranca VARCHAR, -- adequada, inadequada, inexistente
  uso_comunidade VARCHAR, -- alto, medio, baixo
  eventos_realizados INTEGER DEFAULT 0,
  vandalismo_reportado BOOLEAN DEFAULT FALSE,
  melhorias_sugeridas TEXT[],
  orcamento_manutencao DECIMAL(8,2),
  observacoes TEXT,
  status VARCHAR DEFAULT 'ativa',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SEGURANÇA PÚBLICA
-- ============================================

-- Ocorrências de Segurança
CREATE TABLE seguranca_ocorrencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  numero_bo VARCHAR UNIQUE,
  tipo_ocorrencia VARCHAR, -- furto, roubo, vandalismo, perturbacao, transito, outros
  categoria VARCHAR, -- crime, contravencao, administrativa, transito
  endereco_ocorrencia JSONB,
  coordenadas_gps JSONB,
  data_ocorrencia DATE,
  horario_ocorrencia TIME,
  data_registro DATE,
  horario_registro TIME,
  comunicante_nome VARCHAR,
  comunicante_contato JSONB,
  vitima_nome VARCHAR,
  vitima_contato JSONB,
  suspeito_descricao TEXT,
  relato_fatos TEXT,
  objetos_envolvidos TEXT[],
  valor_prejuizo DECIMAL(10,2),
  testemunhas JSONB,
  guarda_responsavel_id UUID,
  viatura_utilizada VARCHAR,
  providencias_tomadas TEXT[],
  encaminhamentos TEXT[],
  delegacia_comunicada VARCHAR,
  numero_bo_civil VARCHAR,
  fotos_local TEXT[],
  croqui_local TEXT,
  observacoes TEXT,
  status VARCHAR DEFAULT 'registrada', -- registrada, investigacao, resolvida, arquivada
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guarda Municipal
CREATE TABLE seguranca_guardas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  nome_completo VARCHAR NOT NULL,
  cpf VARCHAR UNIQUE,
  matricula VARCHAR UNIQUE,
  posto_graduacao VARCHAR, -- guarda, cabo, sargento, tenente, capitao
  especialidades TEXT[], -- transito, ambiental, escolar, patrimonial, municipal
  data_admissao DATE,
  situacao VARCHAR, -- ativo, licenca, afastado, aposentado
  endereco JSONB,
  contato JSONB,
  formacao TEXT[],
  cursos_especializacao TEXT[],
  experiencia_anterior TEXT,
  porte_arma BOOLEAN DEFAULT FALSE,
  numero_arma VARCHAR,
  validade_porte DATE,
  equipamentos_fornecidos TEXT[],
  viatura_designada VARCHAR,
  setor_atuacao VARCHAR,
  horario_trabalho JSONB,
  escala_servico VARCHAR, -- 12x36, 6x1, administrativa
  superior_direto_id UUID,
  avaliacoes_desempenho JSONB,
  ocorrencias_disciplinares TEXT[],
  elogios_recebidos TEXT[],
  treinamentos_realizados TEXT[],
  observacoes TEXT,
  status VARCHAR DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Serviços Públicos
ALTER TABLE servicos_iluminacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos_limpeza ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos_problemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos_coleta_especial ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos_areas_verdes ENABLE ROW LEVEL SECURITY;

-- Enable RLS for Segurança Pública
ALTER TABLE seguranca_ocorrencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE seguranca_guardas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Serviços Públicos
CREATE POLICY "super_admin_all_access_servicos_iluminacao" ON servicos_iluminacao FOR ALL USING (is_super_admin());
CREATE POLICY "tenant_access_servicos_iluminacao" ON servicos_iluminacao FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE POLICY "super_admin_all_access_servicos_limpeza" ON servicos_limpeza FOR ALL USING (is_super_admin());
CREATE POLICY "tenant_access_servicos_limpeza" ON servicos_limpeza FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE POLICY "super_admin_all_access_servicos_problemas" ON servicos_problemas FOR ALL USING (is_super_admin());
CREATE POLICY "tenant_access_servicos_problemas" ON servicos_problemas FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE POLICY "super_admin_all_access_servicos_coleta_especial" ON servicos_coleta_especial FOR ALL USING (is_super_admin());
CREATE POLICY "tenant_access_servicos_coleta_especial" ON servicos_coleta_especial FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE POLICY "super_admin_all_access_servicos_areas_verdes" ON servicos_areas_verdes FOR ALL USING (is_super_admin());
CREATE POLICY "tenant_access_servicos_areas_verdes" ON servicos_areas_verdes FOR ALL USING (tenant_id = get_current_user_tenant());

-- RLS Policies for Segurança Pública  
CREATE POLICY "super_admin_all_access_seguranca_ocorrencias" ON seguranca_ocorrencias FOR ALL USING (is_super_admin());
CREATE POLICY "tenant_access_seguranca_ocorrencias" ON seguranca_ocorrencias FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE POLICY "super_admin_all_access_seguranca_guardas" ON seguranca_guardas FOR ALL USING (is_super_admin());
CREATE POLICY "tenant_access_seguranca_guardas" ON seguranca_guardas FOR ALL USING (tenant_id = get_current_user_tenant());

-- Updated_at triggers for Serviços Públicos
CREATE TRIGGER update_servicos_iluminacao_updated_at BEFORE UPDATE ON servicos_iluminacao FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_servicos_limpeza_updated_at BEFORE UPDATE ON servicos_limpeza FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_servicos_problemas_updated_at BEFORE UPDATE ON servicos_problemas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_servicos_coleta_especial_updated_at BEFORE UPDATE ON servicos_coleta_especial FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_servicos_areas_verdes_updated_at BEFORE UPDATE ON servicos_areas_verdes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Updated_at triggers for Segurança Pública
CREATE TRIGGER update_seguranca_ocorrencias_updated_at BEFORE UPDATE ON seguranca_ocorrencias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_seguranca_guardas_updated_at BEFORE UPDATE ON seguranca_guardas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ====================================================================
-- MIGRAÇÃO: 20250818193106_d1db54f6-4191-426a-91d9-4912489f00d7.sql
-- ====================================================================

-- ============================================
-- GABINETE DO PREFEITO
-- ============================================

-- Atendimentos do Gabinete
CREATE TABLE gabinete_atendimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  protocolo VARCHAR UNIQUE,
  solicitante_nome VARCHAR NOT NULL,
  solicitante_cpf VARCHAR,
  solicitante_contato JSONB,
  endereco_solicitante JSONB,
  tipo_atendimento VARCHAR, -- audiencia, protocolo, informacao, reclamacao, sugestao
  assunto VARCHAR,
  categoria VARCHAR, -- saude, educacao, infraestrutura, social, administrativo
  descricao_solicitacao TEXT,
  documentos_anexos TEXT[],
  urgencia VARCHAR, -- baixa, media, alta, critica
  canal_entrada VARCHAR, -- presencial, telefone, email, site, whatsapp
  data_protocolo DATE,
  horario_protocolo TIME,
  responsavel_recebimento_id UUID,
  secretaria_destino VARCHAR,
  funcionario_designado_id UUID,
  prazo_resposta INTEGER, -- dias
  data_resposta DATE,
  resposta_dada TEXT,
  satisfacao_cidadao INTEGER, -- 1 a 5
  feedback_cidadao TEXT,
  encaminhamentos TEXT[],
  observacoes TEXT,
  arquivos_resposta TEXT[],
  acompanhamento JSONB, -- histórico de atualizações
  status VARCHAR DEFAULT 'protocolado', -- protocolado, andamento, respondido, finalizado
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audiências com o Prefeito
CREATE TABLE gabinete_audiencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  solicitante_nome VARCHAR NOT NULL,
  solicitante_cargo VARCHAR,
  entidade_representada VARCHAR,
  solicitante_contato JSONB,
  assunto_audiencia VARCHAR,
  categoria VARCHAR, -- individual, coletiva, institucional, empresarial
  justificativa TEXT,
  documentos_apresentacao TEXT[],
  data_solicitacao DATE,
  data_agendamento DATE,
  horario_inicio TIME,
  horario_fim TIME,
  duracao_minutos INTEGER,
  local_realizacao VARCHAR,
  participantes JSONB, -- lista de participantes
  pauta_discussao TEXT[],
  demandas_apresentadas TEXT[],
  compromissos_assumidos TEXT[],
  prazos_acordados JSONB,
  encaminhamentos TEXT[],
  secretarias_envolvidas TEXT[],
  ata_reuniao TEXT,
  fotos_reuniao TEXT[],
  material_entregue TEXT[],
  proximos_passos TEXT[],
  acompanhamento_necessario BOOLEAN DEFAULT FALSE,
  data_proximo_contato DATE,
  avaliacao_resultado VARCHAR, -- muito_boa, boa, regular, ruim
  observacoes TEXT,
  status VARCHAR DEFAULT 'solicitada', -- solicitada, agendada, realizada, cancelada
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projetos Estratégicos
CREATE TABLE gabinete_projetos_estrategicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  nome_projeto VARCHAR NOT NULL,
  descricao TEXT,
  objetivo_principal TEXT,
  objetivos_especificos TEXT[],
  justificativa TEXT,
  publico_beneficiado TEXT,
  coordenador_projeto_id UUID,
  equipe_trabalho UUID[],
  secretarias_envolvidas TEXT[],
  parceiros_externos TEXT[],
  data_inicio DATE,
  data_fim_prevista DATE,
  data_fim_real DATE,
  orcamento_total DECIMAL(12,2),
  fonte_recursos VARCHAR, -- proprio, convenio, financiamento, misto
  percentual_executado DECIMAL(5,2) DEFAULT 0,
  etapas_previstas JSONB,
  etapas_concluidas JSONB,
  marcos_importantes JSONB,
  riscos_identificados TEXT[],
  plano_contingencia TEXT[],
  indicadores_sucesso JSONB,
  resultados_alcancados TEXT[],
  impacto_social TEXT,
  impacto_economico DECIMAL(12,2),
  relatorios_progresso TEXT[],
  prestacao_contas TEXT[],
  avaliacao_final TEXT,
  licoes_aprendidas TEXT[],
  recomendacoes TEXT[],
  sustentabilidade TEXT,
  observacoes TEXT,
  status VARCHAR DEFAULT 'planejamento', -- planejamento, aprovado, execucao, concluido, suspenso
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agenda do Prefeito
CREATE TABLE gabinete_agenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  titulo VARCHAR NOT NULL,
  tipo_evento VARCHAR, -- reuniao, audiencia, evento_publico, viagem, agenda_externa
  categoria VARCHAR, -- administrativo, politico, social, institucional
  descricao TEXT,
  data_evento DATE,
  horario_inicio TIME,
  horario_fim TIME,
  local_evento VARCHAR,
  endereco_completo JSONB,
  participantes JSONB,
  organizador VARCHAR,
  contato_organizador JSONB,
  pauta TEXT[],
  materiais_necessarios TEXT[],
  equipamentos_necessarios TEXT[],
  apoio_necessario TEXT[],
  assessor_responsavel_id UUID,
  motorista_designado VARCHAR,
  veiculo_oficial VARCHAR,
  seguranca_necessaria BOOLEAN DEFAULT FALSE,
  imprensa_convidada BOOLEAN DEFAULT FALSE,
  transmissao_online BOOLEAN DEFAULT FALSE,
  protocolo_necessario TEXT[],
  dresscode VARCHAR,
  observacoes_especiais TEXT,
  documentos_evento TEXT[],
  fotos_evento TEXT[],
  ata_reuniao TEXT,
  compromissos_assumidos TEXT[],
  pendencias TEXT[],
  avaliacao_evento VARCHAR, -- excelente, boa, regular, ruim
  status VARCHAR DEFAULT 'agendado', -- agendado, confirmado, realizado, cancelado, reagendado
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Monitoramento de Indicadores
CREATE TABLE gabinete_indicadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  nome_indicador VARCHAR NOT NULL,
  categoria VARCHAR, -- social, economico, administrativo, ambiental, saude, educacao
  unidade_medida VARCHAR,
  meta_anual DECIMAL(10,2),
  meta_mensal DECIMAL(10,2),
  valor_atual DECIMAL(10,2),
  valor_mes_anterior DECIMAL(10,2),
  percentual_meta DECIMAL(5,2),
  tendencia VARCHAR, -- crescimento, estabilidade, queda
  fonte_dados VARCHAR,
  responsavel_coleta_id UUID,
  frequencia_atualizacao VARCHAR, -- diaria, semanal, mensal, trimestral
  ultima_atualizacao DATE,
  proxima_atualizacao DATE,
  metodologia_calculo TEXT,
  observacoes_valor TEXT,
  acoes_melhoria TEXT[],
  metas_intermediarias JSONB,
  historico_valores JSONB,
  benchmark_referencia DECIMAL(10,2),
  fonte_benchmark VARCHAR,
  alertas_configurados JSONB,
  relatorios_gerados TEXT[],
  dashboard_publico BOOLEAN DEFAULT FALSE,
  status VARCHAR DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Gabinete
ALTER TABLE gabinete_atendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE gabinete_audiencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE gabinete_projetos_estrategicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE gabinete_agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE gabinete_indicadores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Gabinete
CREATE POLICY "super_admin_all_access_gabinete_atendimentos" ON gabinete_atendimentos FOR ALL USING (is_super_admin());
CREATE POLICY "tenant_access_gabinete_atendimentos" ON gabinete_atendimentos FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE POLICY "super_admin_all_access_gabinete_audiencias" ON gabinete_audiencias FOR ALL USING (is_super_admin());
CREATE POLICY "tenant_access_gabinete_audiencias" ON gabinete_audiencias FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE POLICY "super_admin_all_access_gabinete_projetos_estrategicos" ON gabinete_projetos_estrategicos FOR ALL USING (is_super_admin());
CREATE POLICY "tenant_access_gabinete_projetos_estrategicos" ON gabinete_projetos_estrategicos FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE POLICY "super_admin_all_access_gabinete_agenda" ON gabinete_agenda FOR ALL USING (is_super_admin());
CREATE POLICY "tenant_access_gabinete_agenda" ON gabinete_agenda FOR ALL USING (tenant_id = get_current_user_tenant());

CREATE POLICY "super_admin_all_access_gabinete_indicadores" ON gabinete_indicadores FOR ALL USING (is_super_admin());
CREATE POLICY "tenant_access_gabinete_indicadores" ON gabinete_indicadores FOR ALL USING (tenant_id = get_current_user_tenant());

-- Updated_at triggers for Gabinete
CREATE TRIGGER update_gabinete_atendimentos_updated_at BEFORE UPDATE ON gabinete_atendimentos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gabinete_audiencias_updated_at BEFORE UPDATE ON gabinete_audiencias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gabinete_projetos_estrategicos_updated_at BEFORE UPDATE ON gabinete_projetos_estrategicos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gabinete_agenda_updated_at BEFORE UPDATE ON gabinete_agenda FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gabinete_indicadores_updated_at BEFORE UPDATE ON gabinete_indicadores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ====================================================================
-- MIGRAÇÃO: 20250818202106_7eabb17a-61fa-4ca5-8ee8-5f9011097e75.sql
-- ====================================================================

-- Corrigir a função que insere perfis ao criar usuários no Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Inserir perfil básico para novos usuários
  INSERT INTO public.user_profiles (
    id,
    email,
    nome_completo,
    tipo_usuario,
    tenant_id,
    secretaria_id,
    status,
    primeiro_acesso,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', 'Usuário'),
    -- IMPORTANTE: converter text -> enum explicitamente
    COALESCE(NEW.raw_user_meta_data->>'tipo_usuario', 'cidadao')::user_tipo_enum,
    NULLIF(NEW.raw_user_meta_data->>'tenant_id', '')::UUID,
    NULLIF(NEW.raw_user_meta_data->>'secretaria_id', ''),
    COALESCE(NEW.raw_user_meta_data->>'status', 'ativo'),
    true,
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$;

-- Recriar a trigger que chama a função após inserção em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ====================================================================
-- MIGRAÇÃO: 20250818214823_0514ed6c-82c2-4917-98fa-e6da1fdf3b62.sql
-- ====================================================================

-- Core Schema Completion Migration
-- DigiUrban2 v4.0 - Missing Tables, Triggers, and Storage Setup

-- 1. Create missing core tables
CREATE TABLE IF NOT EXISTS public.anexos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    protocolo_id UUID,
    nome_arquivo CHARACTER VARYING NOT NULL,
    tipo_mime CHARACTER VARYING,
    tamanho_bytes BIGINT,
    caminho_storage TEXT,
    hash_arquivo CHARACTER VARYING,
    descricao TEXT,
    categoria CHARACTER VARYING DEFAULT 'documento',
    publico BOOLEAN DEFAULT false,
    upload_usuario_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notificacoes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    destinatario_id UUID NOT NULL,
    remetente_id UUID,
    tipo CHARACTER VARYING NOT NULL DEFAULT 'info',
    titulo CHARACTER VARYING NOT NULL,
    conteudo TEXT NOT NULL,
    lida BOOLEAN DEFAULT false,
    data_leitura TIMESTAMP WITH TIME ZONE,
    canal CHARACTER VARYING DEFAULT 'sistema',
    prioridade CHARACTER VARYING DEFAULT 'normal',
    acao_url TEXT,
    acao_texto CHARACTER VARYING,
    metadados JSONB DEFAULT '{}',
    expira_em TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.protocolos_historico (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    protocolo_id UUID NOT NULL,
    usuario_id UUID NOT NULL,
    acao CHARACTER VARYING NOT NULL,
    campo_alterado CHARACTER VARYING,
    valor_anterior TEXT,
    valor_novo TEXT,
    observacoes TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID,
    usuario_id UUID,
    tabela CHARACTER VARYING,
    operacao CHARACTER VARYING NOT NULL,
    registro_id UUID,
    dados_anteriores JSONB,
    dados_novos JSONB,
    ip_address INET,
    user_agent TEXT,
    sessao_id UUID,
    categoria CHARACTER VARYING DEFAULT 'sistema',
    nivel CHARACTER VARYING DEFAULT 'info',
    detalhes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    tenant_id UUID,
    sessao_id UUID NOT NULL,
    ip_address INET,
    user_agent TEXT,
    dispositivo TEXT,
    localizacao JSONB,
    ativa BOOLEAN DEFAULT true,
    ultima_atividade TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days')
);

-- 2. Enable RLS on new tables
ALTER TABLE public.anexos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocolos_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies
-- Anexos policies
CREATE POLICY "super_admin_all_access_anexos" ON public.anexos FOR ALL USING (is_super_admin());
CREATE POLICY "tenant_access_anexos" ON public.anexos FOR ALL USING (tenant_id = get_current_user_tenant());

-- Notificacoes policies  
CREATE POLICY "super_admin_all_access_notificacoes" ON public.notificacoes FOR ALL USING (is_super_admin());
CREATE POLICY "user_own_notifications" ON public.notificacoes FOR SELECT USING (
    destinatario_id = auth.uid() AND tenant_id = get_current_user_tenant()
);
CREATE POLICY "tenant_create_notifications" ON public.notificacoes FOR INSERT WITH CHECK (
    tenant_id = get_current_user_tenant()
);

-- Protocolos historico policies
CREATE POLICY "super_admin_all_access_protocolos_historico" ON public.protocolos_historico FOR ALL USING (is_super_admin());
CREATE POLICY "tenant_access_protocolos_historico" ON public.protocolos_historico FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.protocolos p WHERE p.id = protocolo_id AND p.tenant_id = get_current_user_tenant())
);

-- Audit logs policies (read-only for security)
CREATE POLICY "super_admin_read_audit_logs" ON public.audit_logs FOR SELECT USING (is_super_admin());
CREATE POLICY "tenant_read_own_audit_logs" ON public.audit_logs FOR SELECT USING (
    tenant_id = get_current_user_tenant() AND get_current_user_type() IN ('admin', 'secretario')
);

-- User sessions policies
CREATE POLICY "super_admin_all_access_user_sessions" ON public.user_sessions FOR ALL USING (is_super_admin());
CREATE POLICY "user_own_sessions" ON public.user_sessions FOR ALL USING (user_id = auth.uid());

-- 4. Create essential indexes
CREATE INDEX IF NOT EXISTS idx_anexos_tenant_id ON public.anexos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_anexos_protocolo_id ON public.anexos(protocolo_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_tenant_destinatario ON public.notificacoes(tenant_id, destinatario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON public.notificacoes(lida) WHERE NOT lida;
CREATE INDEX IF NOT EXISTS idx_protocolos_historico_protocolo ON public.protocolos_historico(protocolo_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created ON public.audit_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_ativa ON public.user_sessions(user_id, ativa) WHERE ativa;

-- 5. Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
    ('avatars', 'avatars', true),
    ('anexos', 'anexos', false)
ON CONFLICT (id) DO NOTHING;

-- 6. Create storage policies for avatars (public bucket)
INSERT INTO storage.objects (bucket_id, name, owner, metadata) VALUES ('avatars', '.emptyFolderPlaceholder', null, '{}') ON CONFLICT DO NOTHING;

CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects FOR UPDATE 
USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

-- 7. Create storage policies for anexos (private bucket)
CREATE POLICY "Users can view anexos from their tenant" 
ON storage.objects FOR SELECT 
USING (
    bucket_id = 'anexos' AND 
    (
        is_super_admin() OR
        EXISTS (
            SELECT 1 FROM public.anexos a 
            WHERE a.caminho_storage = name 
            AND a.tenant_id = get_current_user_tenant()
        )
    )
);

CREATE POLICY "Users can upload anexos to their tenant" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'anexos' AND 
    get_current_user_tenant() IS NOT NULL
);

-- 8. Fix handle_new_user function to properly handle tenant_id
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Insert profile with proper enum casting and null handling for tenant_id
  INSERT INTO public.user_profiles (
    id,
    email,
    nome_completo,
    tipo_usuario,
    tenant_id,
    secretaria_id,
    status,
    primeiro_acesso,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', 'Usuário'),
    -- Cast to enum safely
    COALESCE(NEW.raw_user_meta_data->>'tipo_usuario', 'cidadao')::user_tipo_enum,
    -- Handle tenant_id - allow NULL for super_admin, require for others
    CASE 
      when COALESCE(NEW.raw_user_meta_data->>'tipo_usuario', 'cidadao') = 'super_admin' THEN NULL
      ELSE NULLIF(NEW.raw_user_meta_data->>'tenant_id', '')::UUID
    END,
    NULLIF(NEW.raw_user_meta_data->>'secretaria_id', ''),
    COALESCE(NEW.raw_user_meta_data->>'status', 'ativo'),
    true,
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Create updated_at triggers for new tables
CREATE TRIGGER update_anexos_updated_at
    BEFORE UPDATE ON public.anexos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notificacoes_updated_at
    BEFORE UPDATE ON public.notificacoes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Create protocol number generation trigger
CREATE OR REPLACE FUNCTION public.generate_protocolo_number_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_protocolo IS NULL OR NEW.numero_protocolo = '' THEN
    NEW.numero_protocolo := public.gerar_numero_protocolo(NEW.tenant_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to protocolos table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'protocolos') THEN
    DROP TRIGGER IF EXISTS trigger_gerar_numero_protocolo ON public.protocolos;
    CREATE TRIGGER trigger_gerar_numero_protocolo
      BEFORE INSERT ON public.protocolos
      FOR EACH ROW EXECUTE FUNCTION public.generate_protocolo_number_trigger();
  END IF;
END $$;

-- 11. Create audit logging function
CREATE OR REPLACE FUNCTION public.audit_table_changes()
RETURNS TRIGGER AS $$
DECLARE
  tenant_uuid UUID;
BEGIN
  -- Get tenant_id from the record
  IF TG_OP = 'DELETE' then
    tenant_uuid := COALESCE(OLD.tenant_id, get_current_user_tenant());
  ELSE
    tenant_uuid := COALESCE(NEW.tenant_id, get_current_user_tenant());
  END IF;

  INSERT INTO public.audit_logs (
    tenant_id,
    usuario_id,
    tabela,
    operacao,
    registro_id,
    dados_anteriores,
    dados_novos
  ) VALUES (
    tenant_uuid,
    auth.uid(),
    TG_TABLE_NAME,
    TG_OP,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id
      ELSE NEW.id
    END,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Log this migration
INSERT INTO public.audit_logs (
  tenant_id,
  usuario_id,
  tabela,
  operacao,
  detalhes,
  categoria,
  nivel
) VALUES (
  NULL,
  NULL,
  'system',
  'MIGRATION',
  'Core schema completion: Added anexos, notificacoes, protocolos_historico, audit_logs, user_sessions tables with RLS policies, storage buckets, and essential triggers',
  'sistema',
  'info'
);

COMMENT ON TABLE public.anexos IS 'Arquivos anexados aos protocolos';
COMMENT ON TABLE public.notificacoes IS 'Sistema de notificações em tempo real';
COMMENT ON TABLE public.protocolos_historico IS 'Histórico de mudanças nos protocolos';
COMMENT ON TABLE public.audit_logs IS 'Log de auditoria do sistema';
COMMENT ON TABLE public.user_sessions IS 'Controle de sessões de usuário';


-- ====================================================================
-- MIGRAÇÃO: 20250818214932_75c44871-9a35-4c2a-a58d-6becbba55467.sql
-- ====================================================================

-- Core Schema Completion Migration (Fixed)
-- DigiUrban2 v4.0 - Missing Tables, Triggers, and Storage Setup

-- 1. Create missing core tables
CREATE TABLE IF NOT EXISTS public.anexos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    protocolo_id UUID,
    nome_arquivo CHARACTER VARYING NOT NULL,
    tipo_mime CHARACTER VARYING,
    tamanho_bytes BIGINT,
    caminho_storage TEXT,
    hash_arquivo CHARACTER VARYING,
    descricao TEXT,
    categoria CHARACTER VARYING DEFAULT 'documento',
    publico BOOLEAN DEFAULT false,
    upload_usuario_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notificacoes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    destinatario_id UUID NOT NULL,
    remetente_id UUID,
    tipo CHARACTER VARYING NOT NULL DEFAULT 'info',
    titulo CHARACTER VARYING NOT NULL,
    conteudo TEXT NOT NULL,
    lida BOOLEAN DEFAULT false,
    data_leitura TIMESTAMP WITH TIME ZONE,
    canal CHARACTER VARYING DEFAULT 'sistema',
    prioridade CHARACTER VARYING DEFAULT 'normal',
    acao_url TEXT,
    acao_texto CHARACTER VARYING,
    metadados JSONB DEFAULT '{}',
    expira_em TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.protocolos_historico (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    protocolo_id UUID NOT NULL,
    usuario_id UUID NOT NULL,
    acao CHARACTER VARYING NOT NULL,
    campo_alterado CHARACTER VARYING,
    valor_anterior TEXT,
    valor_novo TEXT,
    observacoes TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID,
    usuario_id UUID,
    tabela CHARACTER VARYING,
    operacao CHARACTER VARYING NOT NULL,
    registro_id UUID,
    dados_anteriores JSONB,
    dados_novos JSONB,
    ip_address INET,
    user_agent TEXT,
    sessao_id UUID,
    categoria CHARACTER VARYING DEFAULT 'sistema',
    nivel CHARACTER VARYING DEFAULT 'info',
    detalhes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    tenant_id UUID,
    sessao_id UUID NOT NULL,
    ip_address INET,
    user_agent TEXT,
    dispositivo TEXT,
    localizacao JSONB,
    ativa BOOLEAN DEFAULT true,
    ultima_atividade TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days')
);

-- 2. Enable RLS on new tables
ALTER TABLE public.anexos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocolos_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies
-- Anexos policies
CREATE POLICY "super_admin_all_access_anexos" ON public.anexos FOR ALL USING (is_super_admin());
CREATE POLICY "tenant_access_anexos" ON public.anexos FOR ALL USING (tenant_id = get_current_user_tenant());

-- Notificacoes policies  
CREATE POLICY "super_admin_all_access_notificacoes" ON public.notificacoes FOR ALL USING (is_super_admin());
CREATE POLICY "user_own_notifications" ON public.notificacoes FOR SELECT USING (
    destinatario_id = auth.uid() AND tenant_id = get_current_user_tenant()
);
CREATE POLICY "tenant_create_notifications" ON public.notificacoes FOR INSERT WITH CHECK (
    tenant_id = get_current_user_tenant()
);

-- Protocolos historico policies
CREATE POLICY "super_admin_all_access_protocolos_historico" ON public.protocolos_historico FOR ALL USING (is_super_admin());
CREATE POLICY "tenant_access_protocolos_historico" ON public.protocolos_historico FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.protocolos p WHERE p.id = protocolo_id AND p.tenant_id = get_current_user_tenant())
);

-- Audit logs policies (read-only for security)
CREATE POLICY "super_admin_read_audit_logs" ON public.audit_logs FOR SELECT USING (is_super_admin());
CREATE POLICY "tenant_read_own_audit_logs" ON public.audit_logs FOR SELECT USING (
    tenant_id = get_current_user_tenant() AND get_current_user_type() IN ('admin', 'secretario')
);

-- User sessions policies
CREATE POLICY "super_admin_all_access_user_sessions" ON public.user_sessions FOR ALL USING (is_super_admin());
CREATE POLICY "user_own_sessions" ON public.user_sessions FOR ALL USING (user_id = auth.uid());

-- 4. Create essential indexes
CREATE INDEX IF NOT EXISTS idx_anexos_tenant_id ON public.anexos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_anexos_protocolo_id ON public.anexos(protocolo_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_tenant_destinatario ON public.notificacoes(tenant_id, destinatario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON public.notificacoes(lida) WHERE NOT lida;
CREATE INDEX IF NOT EXISTS idx_protocolos_historico_protocolo ON public.protocolos_historico(protocolo_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created ON public.audit_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_ativa ON public.user_sessions(user_id, ativa) WHERE ativa;

-- 5. Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
    ('avatars', 'avatars', true),
    ('anexos', 'anexos', false)
ON CONFLICT (id) DO NOTHING;

-- 6. Create storage policies for avatars (public bucket)
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects FOR UPDATE 
USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

-- 7. Create storage policies for anexos (private bucket)
CREATE POLICY "Users can view anexos from their tenant" 
ON storage.objects FOR SELECT 
USING (
    bucket_id = 'anexos' AND 
    (
        is_super_admin() OR
        EXISTS (
            SELECT 1 FROM public.anexos a 
            WHERE a.caminho_storage = name 
            AND a.tenant_id = get_current_user_tenant()
        )
    )
);

CREATE POLICY "Users can upload anexos to their tenant" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'anexos' AND 
    get_current_user_tenant() IS NOT NULL
);

-- 8. Fix handle_new_user function by dropping trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Insert profile with proper enum casting and null handling for tenant_id
  INSERT INTO public.user_profiles (
    id,
    email,
    nome_completo,
    tipo_usuario,
    tenant_id,
    secretaria_id,
    status,
    primeiro_acesso,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', 'Usuário'),
    -- Cast to enum safely
    COALESCE(NEW.raw_user_meta_data->>'tipo_usuario', 'cidadao')::user_tipo_enum,
    -- Handle tenant_id - allow NULL for super_admin, require for others
    CASE 
      when COALESCE(NEW.raw_user_meta_data->>'tipo_usuario', 'cidadao') = 'super_admin' THEN NULL
      ELSE NULLIF(NEW.raw_user_meta_data->>'tenant_id', '')::UUID
    END,
    NULLIF(NEW.raw_user_meta_data->>'secretaria_id', ''),
    COALESCE(NEW.raw_user_meta_data->>'status', 'ativo'),
    true,
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Create updated_at triggers for new tables
CREATE TRIGGER update_anexos_updated_at
    BEFORE UPDATE ON public.anexos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notificacoes_updated_at
    BEFORE UPDATE ON public.notificacoes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Create protocol number generation trigger
CREATE OR REPLACE FUNCTION public.generate_protocolo_number_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_protocolo IS NULL OR NEW.numero_protocolo = '' THEN
    NEW.numero_protocolo := public.gerar_numero_protocolo(NEW.tenant_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to protocolos table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'protocolos') THEN
    DROP TRIGGER IF EXISTS trigger_gerar_numero_protocolo ON public.protocolos;
    CREATE TRIGGER trigger_gerar_numero_protocolo
      BEFORE INSERT ON public.protocolos
      FOR EACH ROW EXECUTE FUNCTION public.generate_protocolo_number_trigger();
  END IF;
END $$;

-- 11. Create audit logging function
CREATE OR REPLACE FUNCTION public.audit_table_changes()
RETURNS TRIGGER AS $$
DECLARE
  tenant_uuid UUID;
BEGIN
  -- Get tenant_id from the record
  IF TG_OP = 'DELETE' then
    tenant_uuid := COALESCE(OLD.tenant_id, get_current_user_tenant());
  ELSE
    tenant_uuid := COALESCE(NEW.tenant_id, get_current_user_tenant());
  END IF;

  INSERT INTO public.audit_logs (
    tenant_id,
    usuario_id,
    tabela,
    operacao,
    registro_id,
    dados_anteriores,
    dados_novos
  ) VALUES (
    tenant_uuid,
    auth.uid(),
    TG_TABLE_NAME,
    TG_OP,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id
      ELSE NEW.id
    END,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Log this migration
INSERT INTO public.audit_logs (
  tenant_id,
  usuario_id,
  tabela,
  operacao,
  detalhes,
  categoria,
  nivel
) VALUES (
  NULL,
  NULL,
  'system',
  'MIGRATION',
  'Core schema completion: Added anexos, notificacoes, protocolos_historico, audit_logs, user_sessions tables with RLS policies, storage buckets, and essential triggers',
  'sistema',
  'info'
);

COMMENT ON TABLE public.anexos IS 'Arquivos anexados aos protocolos';
COMMENT ON TABLE public.notificacoes IS 'Sistema de notificações em tempo real';
COMMENT ON TABLE public.protocolos_historico IS 'Histórico de mudanças nos protocolos';
COMMENT ON TABLE public.audit_logs IS 'Log de auditoria do sistema';
COMMENT ON TABLE public.user_sessions IS 'Controle de sessões de usuário';

