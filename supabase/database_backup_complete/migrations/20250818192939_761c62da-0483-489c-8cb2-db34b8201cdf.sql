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