-- Corrigir a função que insere perfis ao criar usuários no Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
    -- IMPORTANTE: converter text -> enum explicitamente
    COALESCE(NEW.raw_user_meta_data->>'tipo_usuario', 'cidadao')::user_tipo_enum,
    NULLIF(NEW.raw_user_meta_data->>'tenant_id', '')::UUID,
    NULLIF(NEW.raw_user_meta_data->>'secretaria_id', ''),
    COALESCE(NEW.raw_user_meta_data->>'status', 'ativo'),
    true,
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$;

-- Recriar a trigger que chama a função após inserção em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();