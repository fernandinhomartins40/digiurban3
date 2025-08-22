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