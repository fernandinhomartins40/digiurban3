
-- =====================================================================
-- DIGIURBAN 2.0 - AUTENTICAÇÃO E CONTROLE DE ACESSO (RLS + LOGS)
-- Compatível com as tabelas e enums já existentes no projeto
-- NÃO toca em schemas reservados (auth, storage, etc.)
-- =====================================================================

-- 0) Extensões utilitárias (idempotentes)
create extension if not exists pgcrypto;

-- 1) Funções auxiliares para uso em RLS (evitam recursão)
create or replace function public.get_current_user_type()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select up.tipo_usuario::text
  from public.user_profiles up
  where up.id = auth.uid()
  limit 1
$$;

create or replace function public.get_current_user_tenant()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select up.tenant_id
  from public.user_profiles up
  where up.id = auth.uid()
  limit 1
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.get_current_user_type() = 'super_admin', false)
$$;

-- 2) Tabela de atividades de usuário (auditoria)
create table if not exists public.user_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,                          -- pode ser nulo p/ login_failed
  tenant_id uuid null,
  acao text not null,
  detalhes jsonb null,
  ip_address text null,
  user_agent text null,
  created_at timestamptz not null default now()
);

-- FK opcional para perfis (não toca auth.users)
do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_type = 'FOREIGN KEY'
      and table_schema = 'public'
      and table_name = 'user_activities'
      and constraint_name = 'user_activities_user_id_fkey'
  ) then
    alter table public.user_activities
      add constraint user_activities_user_id_fkey
      foreign key (user_id) references public.user_profiles(id) on delete set null;
  end if;
end$$;

create index if not exists idx_user_activities_user_created_at
  on public.user_activities (user_id, created_at desc);

create index if not exists idx_user_activities_tenant_created_at
  on public.user_activities (tenant_id, created_at desc);

-- 3) RPCs leves para logs (seguem chamadas já usadas no frontend)
-- Observação: RLS continuará sendo aplicado; políticas abaixo permitem os casos de uso.
create or replace function public.log_audit_action(
  p_user_id uuid,
  p_action text,
  p_details jsonb default null,
  p_ip_address text default null,
  p_user_agent text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
begin
  -- identifica tenant do usuário (se houver)
  select tenant_id into v_tenant_id
  from public.user_profiles
  where id = p_user_id;

  insert into public.user_activities(user_id, tenant_id, acao, detalhes, ip_address, user_agent)
  values (p_user_id, v_tenant_id, p_action, p_details, p_ip_address, p_user_agent);
end;
$$;

create or replace function public.log_login_attempt(
  p_email text,
  p_success boolean,
  p_user_id uuid default null,
  p_failure_reason text default null,
  p_ip_address text default null,
  p_user_agent text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_details jsonb;
begin
  if p_user_id is not null then
    select tenant_id into v_tenant_id
    from public.user_profiles
    where id = p_user_id;
  else
    v_tenant_id := null;
  end if;

  v_details := jsonb_build_object(
    'email', p_email,
    'success', p_success,
    'failure_reason', p_failure_reason,
    'timestamp', now()
  );

  insert into public.user_activities(user_id, tenant_id, acao, detalhes, ip_address, user_agent)
  values (
    p_user_id,
    v_tenant_id,
    case when p_success then 'login_success' else 'login_failed' end,
    v_details,
    p_ip_address,
    p_user_agent
  );
end;
$$;

-- 4) Habilitar RLS nas tabelas principais (idempotente)
alter table public.user_profiles enable row level security;
alter table public.secretarias enable row level security;
alter table public.tenants enable row level security;
alter table public.user_activities enable row level security;

-- 5) Políticas em user_profiles
-- Limpeza de políticas antigas (se existirem)
drop policy if exists up_self_select on public.user_profiles;
drop policy if exists up_self_update on public.user_profiles;
drop policy if exists up_self_insert on public.user_profiles;
drop policy if exists up_admin_tenant_select on public.user_profiles;
drop policy if exists up_admin_tenant_write on public.user_profiles;
drop policy if exists up_super_admin_all on public.user_profiles;

-- Usuário vê seu próprio perfil
create policy up_self_select
on public.user_profiles
for select
to authenticated
using (id = auth.uid());

-- Usuário pode atualizar seu próprio perfil
create policy up_self_update
on public.user_profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Usuário pode inserir o próprio perfil (quando ainda não existir)
create policy up_self_insert
on public.user_profiles
for insert
to authenticated
with check (id = auth.uid());

-- Admin pode ver/gerir usuários do mesmo tenant
create policy up_admin_tenant_select
on public.user_profiles
for select
to authenticated
using (
  public.get_current_user_type() in ('admin') and
  tenant_id = public.get_current_user_tenant()
  or public.is_super_admin()
);

create policy up_admin_tenant_write
on public.user_profiles
for all
to authenticated
using (
  public.get_current_user_type() in ('admin') and
  tenant_id = public.get_current_user_tenant()
  or public.is_super_admin()
)
with check (
  public.get_current_user_type() in ('admin') and
  tenant_id = public.get_current_user_tenant()
  or public.is_super_admin()
);

-- Super admin acesso total (seleção inclusiva)
create policy up_super_admin_all
on public.user_profiles
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

-- 6) Políticas em secretarias (id UUID + campo tenant_id já existem)
drop policy if exists sec_tenant_select on public.secretarias;
drop policy if exists sec_tenant_write on public.secretarias;

-- Seleção por tenant ou super_admin
create policy sec_tenant_select
on public.secretarias
for select
to authenticated
using (
  public.is_super_admin()
  or tenant_id = public.get_current_user_tenant()
);

-- Escrita: admins do tenant e super_admin
create policy sec_tenant_write
on public.secretarias
for all
to authenticated
using (
  public.is_super_admin()
  or (public.get_current_user_type() in ('admin') and tenant_id = public.get_current_user_tenant())
)
with check (
  public.is_super_admin()
  or (public.get_current_user_type() in ('admin') and tenant_id = public.get_current_user_tenant())
);

-- 7) Políticas em tenants
drop policy if exists ten_self_select on public.tenants;
drop policy if exists ten_super_admin_all on public.tenants;

-- Usuários não-super_admin só conseguem selecionar seu próprio tenant
create policy ten_self_select
on public.tenants
for select
to authenticated
using (
  public.is_super_admin()
  or id = public.get_current_user_tenant()
);

-- Super admin vê/gerencia todos os tenants
create policy ten_super_admin_all
on public.tenants
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

-- 8) Políticas em user_activities (logs)
drop policy if exists ua_self_insert_or_failed on public.user_activities;
drop policy if exists ua_self_select on public.user_activities;
drop policy if exists ua_admin_tenant_select on public.user_activities;
drop policy if exists ua_super_admin_all on public.user_activities;

-- Inserção: próprio usuário OU login_failed anônimo
create policy ua_self_insert_or_failed
on public.user_activities
for insert
to authenticated
with check (
  user_id = auth.uid()
  or (acao = 'login_failed' and user_id is null)
);

-- Seleção: próprio usuário
create policy ua_self_select
on public.user_activities
for select
to authenticated
using (user_id = auth.uid());

-- Admin pode ver logs do próprio tenant
create policy ua_admin_tenant_select
on public.user_activities
for select
to authenticated
using (
  public.get_current_user_type() in ('admin') and
  tenant_id = public.get_current_user_tenant()
  or public.is_super_admin()
);

-- Super admin vê/gerencia tudo
create policy ua_super_admin_all
on public.user_activities
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

-- 9) Trigger de updated_at em user_profiles usando função já existente
do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_user_profiles_updated_at'
  ) then
    create trigger trg_user_profiles_updated_at
      before update on public.user_profiles
      for each row execute function public.update_updated_at_column();
  end if;
end$$;

-- =====================================================================
-- Fim do script
-- =====================================================================
