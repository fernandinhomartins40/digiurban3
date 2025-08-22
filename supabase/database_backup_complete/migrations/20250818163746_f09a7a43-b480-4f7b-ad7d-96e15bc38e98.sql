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