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