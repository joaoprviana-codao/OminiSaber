begin;

alter table public.perfis add column if not exists email_contato text;
alter table public.perfis add column if not exists ativo boolean not null default true;
alter table public.perfis add column if not exists primeiro_acesso_pendente boolean not null default false;
alter table public.perfis add column if not exists ultimo_acesso_em timestamptz;

update public.perfis p set email_contato = u.email
from auth.users u where u.id = p.id and p.email_contato is null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  nova_role public.perfil_role;
begin
  nova_role := case new.raw_user_meta_data ->> 'role'
    when 'professor' then 'professor'::public.perfil_role
    when 'bibliotecaria' then 'bibliotecaria'::public.perfil_role
    when 'gestor' then 'gestor'::public.perfil_role
    else 'aluno'::public.perfil_role
  end;
  insert into public.perfis (id,nome,matricula,role,curso_tecnico,tipo_professor,email_contato,primeiro_acesso_pendente)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome',new.email,'Novo usuário'),
    new.raw_user_meta_data ->> 'matricula',
    nova_role,
    case when nova_role='aluno' then case new.raw_user_meta_data ->> 'curso_tecnico' when 'administracao' then 'administracao'::public.curso_tecnico when 'informatica' then 'informatica'::public.curso_tecnico end end,
    case when nova_role='professor' then case new.raw_user_meta_data ->> 'tipo_professor' when 'matematica' then 'matematica'::public.tipo_professor when 'portugues' then 'portugues'::public.tipo_professor when 'tecnico_administracao' then 'tecnico_administracao'::public.tipo_professor when 'tecnico_informatica' then 'tecnico_informatica'::public.tipo_professor end end,
    new.email,
    coalesce((new.raw_user_meta_data ->> 'primeiro_acesso_pendente')::boolean,false)
  ) on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create unique index if not exists perfis_email_contato_lower_uidx
  on public.perfis (lower(email_contato)) where email_contato is not null;

create table if not exists public.descritores_curriculares (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  titulo text not null,
  descricao text,
  materia_codigo public.materia_aluno not null,
  serie smallint not null check (serie between 1 and 3),
  trimestre smallint not null check (trimestre between 1 and 3),
  status text not null default 'ativo' check (status in ('ativo','revisao','arquivado')),
  criado_por uuid references public.perfis(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.solicitacoes_acesso (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references public.perfis(id) on delete cascade,
  solicitado_por uuid references public.perfis(id) on delete set null default auth.uid(),
  tipo text not null check (tipo in ('criacao','redefinicao','bloqueio','desbloqueio')),
  status text not null default 'pendente' check (status in ('pendente','concluida','falhou')),
  detalhes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  concluida_em timestamptz
);

create table if not exists public.gestor_auditoria (
  id uuid primary key default gen_random_uuid(),
  gestor_id uuid references public.perfis(id) on delete set null default auth.uid(),
  acao text not null,
  recurso text not null,
  recurso_id text,
  detalhes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists descritores_curriculares_filtros_idx on public.descritores_curriculares (materia_codigo, serie, trimestre, status);
create index if not exists solicitacoes_acesso_status_idx on public.solicitacoes_acesso (status, created_at desc);
create index if not exists gestor_auditoria_created_idx on public.gestor_auditoria (created_at desc);

alter table public.descritores_curriculares enable row level security;
alter table public.solicitacoes_acesso enable row level security;
alter table public.gestor_auditoria enable row level security;

drop policy if exists descritores_leitura on public.descritores_curriculares;
create policy descritores_leitura on public.descritores_curriculares for select to authenticated using (true);
drop policy if exists descritores_gestor on public.descritores_curriculares;
create policy descritores_gestor on public.descritores_curriculares for all to authenticated
using ((select public.usuario_role()) = 'gestor') with check ((select public.usuario_role()) = 'gestor');

drop policy if exists solicitacoes_acesso_gestor on public.solicitacoes_acesso;
create policy solicitacoes_acesso_gestor on public.solicitacoes_acesso for select to authenticated
using ((select public.usuario_role()) = 'gestor');
drop policy if exists solicitacoes_acesso_criar_gestor on public.solicitacoes_acesso;
create policy solicitacoes_acesso_criar_gestor on public.solicitacoes_acesso for insert to authenticated
with check ((select public.usuario_role()) = 'gestor' and solicitado_por = (select auth.uid()));

drop policy if exists gestor_auditoria_leitura on public.gestor_auditoria;
create policy gestor_auditoria_leitura on public.gestor_auditoria for select to authenticated
using ((select public.usuario_role()) = 'gestor');

grant select on public.descritores_curriculares to authenticated;
grant insert, update, delete on public.descritores_curriculares to authenticated;
grant select, insert on public.solicitacoes_acesso to authenticated;
grant select on public.gestor_auditoria to authenticated;

commit;
