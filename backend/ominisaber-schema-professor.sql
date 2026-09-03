-- OminiSaber | Extensão da área do professor e propostas de redação
-- Execute após backend/ominisaber-schema.sql apenas em bancos já existentes.

begin;

do $$ begin
  create type public.tipo_professor as enum (
    'matematica', 'portugues', 'tecnico_administracao', 'tecnico_informatica'
  );
exception when duplicate_object then null;
end $$;

alter table public.perfis add column if not exists tipo_professor public.tipo_professor;
update public.perfis set tipo_professor = 'portugues' where role = 'professor' and tipo_professor is null;

do $$ begin
  alter table public.perfis add constraint perfis_tipo_professor_check check (
    (role = 'professor' and tipo_professor is not null)
    or (role <> 'professor' and tipo_professor is null)
  );
exception when duplicate_object then null;
end $$;

create index if not exists idx_perfis_tipo_professor on public.perfis (tipo_professor);

create or replace function public.usuario_tipo_professor()
returns public.tipo_professor
language sql stable security definer set search_path = ''
as $$ select tipo_professor from public.perfis where id = (select auth.uid()); $$;

create or replace function public.professor_pode_gerenciar_materia(materia_input text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select case public.usuario_tipo_professor()
    when 'matematica' then lower(materia_input) like any (array['%matem%', '%geometr%', '%estatíst%', '%estatist%'])
    when 'portugues' then lower(materia_input) like any (array['%portugu%', '%literat%', '%redaç%', '%redac%', '%linguag%'])
    when 'tecnico_administracao' then lower(materia_input) like any (array['%admin%', '%gest%', '%empreend%', '%marketing%', '%finan%'])
    when 'tecnico_informatica' then lower(materia_input) like any (array['%inform%', '%program%', '%tecnolog%', '%banco de dados%', '%redes%'])
    else false
  end;
$$;

revoke all on function public.usuario_tipo_professor() from public, anon, authenticated;
revoke all on function public.professor_pode_gerenciar_materia(text) from public, anon, authenticated;
grant execute on function public.usuario_tipo_professor() to authenticated;
grant execute on function public.professor_pode_gerenciar_materia(text) to authenticated;

create table if not exists public.professor_turmas (
  professor_id uuid not null references public.perfis(id) on delete cascade,
  turma_id uuid not null references public.turmas(id) on delete cascade,
  materia text,
  created_at timestamptz not null default now(),
  primary key (professor_id, turma_id)
);

create index if not exists idx_professor_turmas_turma on public.professor_turmas (turma_id);
alter table public.professor_turmas enable row level security;

drop policy if exists professor_turmas_select on public.professor_turmas;
create policy professor_turmas_select on public.professor_turmas for select to authenticated
using (professor_id = auth.uid() or public.usuario_role() = 'gestor');

drop policy if exists professor_turmas_manage on public.professor_turmas;
create policy professor_turmas_manage on public.professor_turmas for all to authenticated
using (public.usuario_role() = 'gestor')
with check (public.usuario_role() = 'gestor');

drop policy if exists turmas_select on public.turmas;
create policy turmas_select on public.turmas for select to authenticated
using (
  public.usuario_role() in ('gestor', 'bibliotecaria')
  or id = public.usuario_turma_id()
  or exists (select 1 from public.professor_turmas pt where pt.professor_id = auth.uid() and pt.turma_id = id)
);

create table if not exists public.propostas_redacao (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  categoria text not null default 'Sociedade',
  comando text not null,
  textos_motivadores jsonb not null default '[]'::jsonb,
  rubrica text not null default 'Matriz ENEM · 5 competências',
  professor_id uuid not null references public.perfis(id) on delete cascade,
  turma_id uuid references public.turmas(id) on delete set null,
  prazo timestamptz,
  publicada boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(textos_motivadores) = 'array')
);

alter table public.redacoes
  add column if not exists proposta_id uuid references public.propostas_redacao(id) on delete set null;

create index if not exists idx_propostas_redacao_professor on public.propostas_redacao (professor_id);
create index if not exists idx_propostas_redacao_turma on public.propostas_redacao (turma_id, publicada, prazo);
create index if not exists idx_redacoes_proposta on public.redacoes (proposta_id) where proposta_id is not null;

alter table public.propostas_redacao enable row level security;

drop trigger if exists set_propostas_redacao_updated_at on public.propostas_redacao;
create trigger set_propostas_redacao_updated_at
before update on public.propostas_redacao
for each row execute function public.set_updated_at();

-- Reaplica as políticas com especialidade e múltiplas turmas.
drop policy if exists perfis_select on public.perfis;
create policy perfis_select on public.perfis for select to authenticated
using (
  id = auth.uid() or public.usuario_role() = 'gestor'
  or (public.usuario_role() = 'professor' and exists (
    select 1 from public.professor_turmas pt
    where pt.professor_id = auth.uid() and pt.turma_id = perfis.turma_id
  ))
);

drop policy if exists trilhas_manage on public.trilhas;
create policy trilhas_manage on public.trilhas for all to authenticated
using (
  public.usuario_role() = 'gestor'
  or (professor_id = auth.uid() and public.professor_pode_gerenciar_materia(materia))
)
with check (
  public.usuario_role() = 'gestor'
  or (professor_id = auth.uid() and public.professor_pode_gerenciar_materia(materia))
);

drop policy if exists notas_select on public.notas;
create policy notas_select on public.notas for select to authenticated
using (
  aluno_id = auth.uid() or public.usuario_role() = 'gestor'
  or (public.usuario_role() = 'professor' and exists (
    select 1 from public.perfis p join public.professor_turmas pt on pt.turma_id = p.turma_id
    where p.id = aluno_id and pt.professor_id = auth.uid()
  ))
);

drop policy if exists notas_manage on public.notas;
create policy notas_manage on public.notas for all to authenticated
using (
  public.usuario_role() = 'gestor'
  or (professor_id = auth.uid() and public.professor_pode_gerenciar_materia(materia))
)
with check (
  public.usuario_role() = 'gestor'
  or (professor_id = auth.uid() and public.professor_pode_gerenciar_materia(materia))
);

drop policy if exists propostas_redacao_select on public.propostas_redacao;
create policy propostas_redacao_select on public.propostas_redacao for select to authenticated
using (
  public.usuario_role() = 'gestor'
  or (professor_id = auth.uid() and public.usuario_tipo_professor() = 'portugues')
  or (publicada = true and (turma_id is null or turma_id = public.usuario_turma_id()))
);

drop policy if exists propostas_redacao_manage on public.propostas_redacao;
create policy propostas_redacao_manage on public.propostas_redacao for all to authenticated
using (public.usuario_role() = 'gestor' or (professor_id = auth.uid() and public.usuario_tipo_professor() = 'portugues'))
with check (
  public.usuario_role() = 'gestor'
  or (public.usuario_tipo_professor() = 'portugues' and professor_id = auth.uid() and (
    turma_id is null or exists (
      select 1 from public.professor_turmas pt
      where pt.professor_id = auth.uid() and pt.turma_id = propostas_redacao.turma_id
    )
  ))
);

drop policy if exists redacoes_select on public.redacoes;
create policy redacoes_select on public.redacoes for select to authenticated
using (
  aluno_id = auth.uid() or public.usuario_role() = 'gestor'
  or (public.usuario_tipo_professor() = 'portugues' and exists (
    select 1 from public.perfis p join public.professor_turmas pt on pt.turma_id = p.turma_id
    where p.id = aluno_id and pt.professor_id = auth.uid()
  ))
);

drop policy if exists redacoes_update on public.redacoes;
create policy redacoes_update on public.redacoes for update to authenticated
using (
  aluno_id = auth.uid() or public.usuario_role() = 'gestor'
  or (public.usuario_tipo_professor() = 'portugues' and exists (
    select 1 from public.perfis p join public.professor_turmas pt on pt.turma_id = p.turma_id
    where p.id = aluno_id and pt.professor_id = auth.uid()
  ))
)
with check (
  aluno_id = auth.uid() or public.usuario_role() = 'gestor'
  or (public.usuario_tipo_professor() = 'portugues' and exists (
    select 1
    from public.perfis p
    join public.professor_turmas pt on pt.turma_id = p.turma_id
    where p.id = aluno_id and pt.professor_id = auth.uid()
  ))
);

drop policy if exists progresso_select on public.progresso_atividades;
create policy progresso_select on public.progresso_atividades for select to authenticated
using (
  aluno_id = auth.uid() or public.usuario_role() = 'gestor'
  or (public.usuario_role() = 'professor' and exists (
    select 1 from public.perfis p join public.professor_turmas pt on pt.turma_id = p.turma_id
    where p.id = aluno_id and pt.professor_id = auth.uid()
  ))
);

commit;
