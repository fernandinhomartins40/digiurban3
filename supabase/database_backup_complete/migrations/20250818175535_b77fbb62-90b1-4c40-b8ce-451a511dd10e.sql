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