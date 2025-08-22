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