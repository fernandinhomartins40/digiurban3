
-- =========================================================
-- MIGRAÇÃO NÚCLEO SUPABASE - MULTI-TENANT + PROTOCOLOS
-- Compatibilização com o frontend atual
-- ATENÇÃO: Não modifica schemas reservados (auth, storage etc.)
-- =========================================================

-- 0) Extensões úteis (idempotente)
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 1) Funções auxiliares (JWT)
create or replace function public.get_tenant_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claims json;
  t uuid;
begin
  claims := current_setting('request.jwt.claims', true)::json;
  if claims ? 'tenant_id' then
    t := (claims ->> 'tenant_id')::uuid;
  end if;
  return t;
end;
$$;

create or replace function public.get_user_type()
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claims json;
  r text;
begin
  claims := current_setting('request.jwt.claims', true)::json;
  if claims ? 'tipo_usuario' then
    r := (claims ->> 'tipo_usuario')::text;
  else
    r := null;
  end if;
  return r;
end;
$$;

-- 2) Tabela de serviços municipais (usada em criação de protocolos)
create table if not exists public.servicos_municipais (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  secretaria_id uuid not null,
  nome varchar not null,
  descricao text,
  categoria varchar,
  status varchar(20) not null default 'ativo',
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now()
);

-- 3) Ajustar tabela protocolos com colunas usadas pelo app (sem remover existentes)
-- Observação: colunas já existentes não serão alteradas; só adicionamos se faltarem
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='protocolos' and column_name='cidadao_id') then
    alter table public.protocolos add column cidadao_id uuid;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='protocolos' and column_name='servico_id') then
    alter table public.protocolos add column servico_id uuid;
  end if;

  -- Muitas telas usam "secretaria_id"; mapearemos coalesce(destino, origem) na view,
  -- mas adicionamos a coluna "secretaria_id" para compatibilidade com hooks genéricos
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='protocolos' and column_name='secretaria_id') then
    alter table public.protocolos add column secretaria_id uuid;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='protocolos' and column_name='funcionario_responsavel_id') then
    alter table public.protocolos add column funcionario_responsavel_id uuid;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='protocolos' and column_name='avaliacao_nota') then
    alter table public.protocolos add column avaliacao_nota integer;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='protocolos' and column_name='avaliacao_comentario') then
    alter table public.protocolos add column avaliacao_comentario text;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='protocolos' and column_name='avaliado_em') then
    alter table public.protocolos add column avaliado_em date;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='protocolos' and column_name='data_vencimento') then
    alter table public.protocolos add column data_vencimento date;
  end if;
end$$;

-- 4) Funções e triggers para protocolos (idempotente + seguro)
-- 4.1) Gerar número de protocolo por tenant e ano
create or replace function public.gerar_numero_protocolo(p_tenant_id uuid)
returns varchar
language plpgsql
security definer
set search_path = public
as $$
declare
  ano_atual integer;
  sequencial integer;
  numero varchar(20);
begin
  ano_atual := extract(year from current_date);
  select coalesce(max(cast(substring(numero_protocolo from 5 for 6) as integer)), 0) + 1
    into sequencial
  from public.protocolos
  where tenant_id = p_tenant_id
    and numero_protocolo like ano_atual::text || '%';

  numero := ano_atual::text || lpad(sequencial::text, 6, '0');
  return numero;
end;
$$;

create or replace function public.trigger_gerar_numero_protocolo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.numero_protocolo is null or new.numero_protocolo = '' then
    new.numero_protocolo := public.gerar_numero_protocolo(new.tenant_id);
  end if;
  return new;
end;
$$;

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = current_timestamp;
  return new;
end;
$$;

-- 4.2) Criar triggers em protocolos (idempotente)
do $$
begin
  if not exists (
    select 1 from pg_trigger 
     where tgname = 'before_insert_gerar_numero_protocolo'
  ) then
    create trigger before_insert_gerar_numero_protocolo
      before insert on public.protocolos
      for each row
      execute function public.trigger_gerar_numero_protocolo();
  end if;

  if not exists (
    select 1 from pg_trigger 
     where tgname = 'before_update_set_updated_at_protocolos'
  ) then
    create trigger before_update_set_updated_at_protocolos
      before update on public.protocolos
      for each row
      execute function public.update_updated_at_column();
  end if;
end$$;

-- 5) VIEW protocolos_completos compatível com o frontend
-- Observações: 
--  - assunto: usamos título quando houver, caindo para categoria
--  - cidadao_id: mapeado para criado_por_id (melhor proxy disponível)
--  - funcionario_responsavel_id: mapeado de atribuido_para_id
--  - secretaria_id: coalesce(destino, origem)
drop view if exists public.protocolos_completos;
create view public.protocolos_completos as
select
  p.id,
  p.tenant_id,
  p.numero_protocolo,
  coalesce(p.titulo, p.categoria) as assunto,
  p.descricao,
  p.status,
  p.prioridade,
  p.created_at,
  p.updated_at,
  coalesce(p.data_vencimento, p.data_prazo::date) as data_vencimento,
  p.data_conclusao::date as data_conclusao,
  coalesce(p.cidadao_id, p.criado_por_id) as cidadao_id,
  coalesce(p.funcionario_responsavel_id, p.atribuido_para_id) as funcionario_responsavel_id,
  coalesce(p.secretaria_id, coalesce(p.secretaria_destino_id, p.secretaria_origem_id)) as secretaria_id,
  p.servico_id,
  coalesce(p.avaliacao_nota, p.avaliacao) as avaliacao_nota,
  coalesce(p.avaliacao_comentario, p.comentario_avaliacao) as avaliacao_comentario,
  coalesce(p.avaliado_em, p.data_avaliacao::date) as avaliado_em
from public.protocolos p
where p.deleted_at is null or p.deleted_at is null; -- manter simples; ajuste se houver soft delete

-- 6) Tabela de atividades de usuário (auditoria leve)
create table if not exists public.user_activities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  user_id uuid not null,
  action text not null,
  details jsonb default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp without time zone not null default now()
);

-- 7) Realtime em protocolos
alter table public.protocolos replica identity full;
-- Adicionar à publicação realtime (idempotente)
do $$
begin
  if not exists (
    select 1 
      from pg_publication_tables 
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'protocolos'
  ) then
    alter publication supabase_realtime add table public.protocolos;
  end if;
end$$;

-- 8) Habilitar RLS
alter table if exists public.tenants enable row level security;
alter table if exists public.user_profiles enable row level security;
alter table if exists public.secretarias enable row level security;
alter table if exists public.servicos_municipais enable row level security;
alter table if exists public.protocolos enable row level security;
alter table if exists public.user_activities enable row level security;

-- 9) Policies multi-tenant (idempotentes: criadas se não existirem)

-- Helpers para idempotência de policy
do $$
begin
  -- TENANTS
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='tenants' and policyname='tenants_select_own') then
    create policy tenants_select_own
      on public.tenants
      for select
      to authenticated
      using (id = public.get_tenant_id() or public.get_user_type() = 'super_admin');
  end if;

  -- USER_PROFILES
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_profiles' and policyname='profiles_select') then
    create policy profiles_select
      on public.user_profiles
      for select
      to authenticated
      using (tenant_id = public.get_tenant_id() or id = auth.uid() or public.get_user_type() = 'super_admin');
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_profiles' and policyname='profiles_insert_admins') then
    create policy profiles_insert_admins
      on public.user_profiles
      for insert
      to authenticated
      with check (
        (public.get_user_type() in ('admin','secretario','diretor','super_admin'))
        and tenant_id = public.get_tenant_id()
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_profiles' and policyname='profiles_update_self_or_admin') then
    create policy profiles_update_self_or_admin
      on public.user_profiles
      for update
      to authenticated
      using (
        id = auth.uid() 
        or (tenant_id = public.get_tenant_id() and public.get_user_type() in ('admin','secretario','diretor','super_admin'))
      )
      with check (
        tenant_id = public.get_tenant_id()
      );
  end if;

  -- SECRETARIAS
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='secretarias' and policyname='secretarias_select_tenant') then
    create policy secretarias_select_tenant
      on public.secretarias
      for select
      to authenticated
      using (tenant_id = public.get_tenant_id() or public.get_user_type() = 'super_admin');
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='secretarias' and policyname='secretarias_crud_admins') then
    create policy secretarias_crud_admins
      on public.secretarias
      for all
      to authenticated
      using (tenant_id = public.get_tenant_id() and public.get_user_type() in ('admin','secretario','diretor','super_admin'))
      with check (tenant_id = public.get_tenant_id());
  end if;

  -- SERVICOS_MUNICIPAIS
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='servicos_municipais' and policyname='servicos_select_tenant') then
    create policy servicos_select_tenant
      on public.servicos_municipais
      for select
      to authenticated
      using (tenant_id = public.get_tenant_id() or public.get_user_type() = 'super_admin');
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='servicos_municipais' and policyname='servicos_crud_admins') then
    create policy servicos_crud_admins
      on public.servicos_municipais
      for all
      to authenticated
      using (tenant_id = public.get_tenant_id() and public.get_user_type() in ('admin','secretario','diretor','super_admin'))
      with check (tenant_id = public.get_tenant_id());
  end if;

  -- PROTOCOLOS
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='protocolos' and policyname='protocolos_select_scope') then
    create policy protocolos_select_scope
      on public.protocolos
      for select
      to authenticated
      using (
        tenant_id = public.get_tenant_id()
        and (
          -- autor ou responsável ou gestor
          criado_por_id = auth.uid()
          or atribuido_para_id = auth.uid()
          or public.get_user_type() in ('admin','secretario','diretor','super_admin')
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='protocolos' and policyname='protocolos_insert_check') then
    create policy protocolos_insert_check
      on public.protocolos
      for insert
      to authenticated
      with check (
        tenant_id = public.get_tenant_id()
        and (criado_por_id = auth.uid() or public.get_user_type() in ('admin','secretario','diretor','super_admin'))
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='protocolos' and policyname='protocolos_update_scope') then
    create policy protocolos_update_scope
      on public.protocolos
      for update
      to authenticated
      using (
        tenant_id = public.get_tenant_id()
        and (
          criado_por_id = auth.uid()
          or atribuido_para_id = auth.uid()
          or public.get_user_type() in ('admin','secretario','diretor','super_admin')
        )
      )
      with check (tenant_id = public.get_tenant_id());
  end if;

  -- USER_ACTIVITIES
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_activities' and policyname='activities_insert') then
    create policy activities_insert
      on public.user_activities
      for insert
      to authenticated
      with check (tenant_id = public.get_tenant_id() and user_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_activities' and policyname='activities_select') then
    create policy activities_select
      on public.user_activities
      for select
      to authenticated
      using (tenant_id = public.get_tenant_id() or public.get_user_type() in ('admin','secretario','diretor','super_admin'));
  end if;
end
$$;

-- 10) Índices úteis
create index if not exists idx_protocolos_tenant_created_at on public.protocolos (tenant_id, created_at desc);
create index if not exists idx_protocolos_tenant_status on public.protocolos (tenant_id, status);
create index if not exists idx_servicos_municipais_tenant_nome on public.servicos_municipais (tenant_id, nome);
create index if not exists idx_user_activities_tenant_created_at on public.user_activities (tenant_id, created_at desc);

-- FIM
