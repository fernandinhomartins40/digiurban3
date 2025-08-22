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