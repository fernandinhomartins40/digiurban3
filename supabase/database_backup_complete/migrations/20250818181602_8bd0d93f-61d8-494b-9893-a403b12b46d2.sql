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