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