
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

