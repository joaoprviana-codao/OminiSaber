-- OminiSaber | Espaços funcionais por especialidade docente
-- Migração idempotente para bancos existentes. Não remove tabelas ou dados.

begin;

do $$ begin
  create type public.status_conteudo_docente as enum ('rascunho', 'publicado', 'encerrado');
exception when duplicate_object then null;
end $$;

create table if not exists public.laboratorios_docentes (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid not null references public.perfis(id) on delete cascade,
  turma_id uuid references public.turmas(id) on delete set null,
  tipo_professor public.tipo_professor not null,
  titulo text not null check (char_length(titulo) between 3 and 140),
  descricao text not null default '',
  formato text not null,
  configuracao jsonb not null default '{}'::jsonb check (jsonb_typeof(configuracao) = 'object'),
  status public.status_conteudo_docente not null default 'rascunho',
  prazo timestamptz,
  publicado_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.avaliacoes_docentes (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid not null references public.perfis(id) on delete cascade,
  turma_id uuid references public.turmas(id) on delete set null,
  tipo_professor public.tipo_professor not null,
  titulo text not null check (char_length(titulo) between 3 and 140),
  instrucoes text not null default '',
  duracao_minutos integer check (duracao_minutos between 5 and 300),
  valor numeric(6,2) not null default 10 check (valor > 0),
  configuracao jsonb not null default '{}'::jsonb check (jsonb_typeof(configuracao) = 'object'),
  status public.status_conteudo_docente not null default 'rascunho',
  abre_em timestamptz,
  encerra_em timestamptz,
  publicado_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (encerra_em is null or abre_em is null or encerra_em > abre_em)
);

create table if not exists public.questoes_avaliacao (
  id uuid primary key default gen_random_uuid(),
  avaliacao_id uuid not null references public.avaliacoes_docentes(id) on delete cascade,
  ordem integer not null check (ordem > 0),
  tipo text not null check (tipo in ('multipla_escolha','verdadeiro_falso','dissertativa','calculo','codigo','estudo_caso')),
  enunciado text not null check (char_length(enunciado) >= 3),
  alternativas jsonb not null default '[]'::jsonb check (jsonb_typeof(alternativas) = 'array'),
  pontos numeric(6,2) not null default 1 check (pontos > 0),
  created_at timestamptz not null default now(),
  unique (avaliacao_id, ordem)
);

create table if not exists public.gabaritos_avaliacao (
  questao_id uuid primary key references public.questoes_avaliacao(id) on delete cascade,
  resposta_esperada jsonb not null default '{}'::jsonb check (jsonb_typeof(resposta_esperada) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.entregas_laboratorio (
  id uuid primary key default gen_random_uuid(),
  laboratorio_id uuid not null references public.laboratorios_docentes(id) on delete cascade,
  aluno_id uuid not null references public.perfis(id) on delete cascade,
  conteudo jsonb not null default '{}'::jsonb check (jsonb_typeof(conteudo) = 'object'),
  status text not null default 'rascunho' check (status in ('rascunho','enviada','avaliada')),
  nota numeric(6,2) check (nota >= 0),
  feedback text,
  enviada_em timestamptz,
  avaliada_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (laboratorio_id, aluno_id)
);

create table if not exists public.tentativas_avaliacao (
  id uuid primary key default gen_random_uuid(),
  avaliacao_id uuid not null references public.avaliacoes_docentes(id) on delete cascade,
  aluno_id uuid not null references public.perfis(id) on delete cascade,
  respostas jsonb not null default '{}'::jsonb check (jsonb_typeof(respostas) = 'object'),
  status text not null default 'em_andamento' check (status in ('em_andamento','enviada','corrigida')),
  nota numeric(6,2) check (nota >= 0),
  feedback text,
  iniciada_em timestamptz not null default now(),
  enviada_em timestamptz,
  corrigida_em timestamptz,
  updated_at timestamptz not null default now(),
  unique (avaliacao_id, aluno_id)
);

create index if not exists idx_laboratorios_professor_status on public.laboratorios_docentes (professor_id, status, created_at desc);
create index if not exists idx_laboratorios_turma on public.laboratorios_docentes (turma_id, status);
create index if not exists idx_avaliacoes_professor_status on public.avaliacoes_docentes (professor_id, status, created_at desc);
create index if not exists idx_avaliacoes_turma on public.avaliacoes_docentes (turma_id, status);
create index if not exists idx_questoes_avaliacao on public.questoes_avaliacao (avaliacao_id, ordem);
create index if not exists idx_entregas_laboratorio on public.entregas_laboratorio (laboratorio_id, status);
create index if not exists idx_entregas_aluno_status on public.entregas_laboratorio (aluno_id, status);
create index if not exists idx_tentativas_avaliacao on public.tentativas_avaliacao (avaliacao_id, status);
create index if not exists idx_tentativas_aluno_status on public.tentativas_avaliacao (aluno_id, status);

alter table public.laboratorios_docentes enable row level security;
alter table public.avaliacoes_docentes enable row level security;
alter table public.questoes_avaliacao enable row level security;
alter table public.gabaritos_avaliacao enable row level security;
alter table public.entregas_laboratorio enable row level security;
alter table public.tentativas_avaliacao enable row level security;

drop policy if exists laboratorios_select on public.laboratorios_docentes;
create policy laboratorios_select on public.laboratorios_docentes for select to authenticated using (
  (select public.usuario_role()) = 'gestor' or professor_id = (select auth.uid()) or
  (status = 'publicado' and turma_id = (select public.usuario_turma_id()))
);
drop policy if exists laboratorios_insert on public.laboratorios_docentes;
create policy laboratorios_insert on public.laboratorios_docentes for insert to authenticated with check (
  professor_id = (select auth.uid()) and (select public.usuario_role()) = 'professor' and
  tipo_professor = (select public.usuario_tipo_professor()) and
  status = 'rascunho' and publicado_em is null and
  (turma_id is null or exists (select 1 from public.professor_turmas pt where pt.professor_id = (select auth.uid()) and pt.turma_id = laboratorios_docentes.turma_id))
);
drop policy if exists laboratorios_update on public.laboratorios_docentes;
create policy laboratorios_update on public.laboratorios_docentes for update to authenticated
using ((select public.usuario_role()) = 'gestor' or professor_id = (select auth.uid()))
with check ((select public.usuario_role()) = 'gestor' or (
  professor_id = (select auth.uid()) and tipo_professor = (select public.usuario_tipo_professor()) and
  (turma_id is null or exists (select 1 from public.professor_turmas pt where pt.professor_id = (select auth.uid()) and pt.turma_id = laboratorios_docentes.turma_id))
));
drop policy if exists laboratorios_delete on public.laboratorios_docentes;
create policy laboratorios_delete on public.laboratorios_docentes for delete to authenticated
using ((select public.usuario_role()) = 'gestor' or (professor_id = (select auth.uid()) and status = 'rascunho'));

drop policy if exists avaliacoes_select on public.avaliacoes_docentes;
create policy avaliacoes_select on public.avaliacoes_docentes for select to authenticated using (
  (select public.usuario_role()) = 'gestor' or professor_id = (select auth.uid()) or
  (status = 'publicado' and turma_id = (select public.usuario_turma_id()) and (abre_em is null or abre_em <= now()) and (encerra_em is null or encerra_em >= now()))
);
drop policy if exists avaliacoes_insert on public.avaliacoes_docentes;
create policy avaliacoes_insert on public.avaliacoes_docentes for insert to authenticated with check (
  professor_id = (select auth.uid()) and (select public.usuario_role()) = 'professor' and
  tipo_professor = (select public.usuario_tipo_professor()) and
  status = 'rascunho' and publicado_em is null and
  (turma_id is null or exists (select 1 from public.professor_turmas pt where pt.professor_id = (select auth.uid()) and pt.turma_id = avaliacoes_docentes.turma_id))
);
drop policy if exists avaliacoes_update on public.avaliacoes_docentes;
create policy avaliacoes_update on public.avaliacoes_docentes for update to authenticated
using ((select public.usuario_role()) = 'gestor' or professor_id = (select auth.uid()))
with check ((select public.usuario_role()) = 'gestor' or (
  professor_id = (select auth.uid()) and tipo_professor = (select public.usuario_tipo_professor()) and
  (turma_id is null or exists (select 1 from public.professor_turmas pt where pt.professor_id = (select auth.uid()) and pt.turma_id = avaliacoes_docentes.turma_id))
));
drop policy if exists avaliacoes_delete on public.avaliacoes_docentes;
create policy avaliacoes_delete on public.avaliacoes_docentes for delete to authenticated
using ((select public.usuario_role()) = 'gestor' or (professor_id = (select auth.uid()) and status = 'rascunho'));

drop policy if exists questoes_select on public.questoes_avaliacao;
create policy questoes_select on public.questoes_avaliacao for select to authenticated using (
  exists (select 1 from public.avaliacoes_docentes a where a.id = avaliacao_id)
);
drop policy if exists questoes_manage on public.questoes_avaliacao;
create policy questoes_manage on public.questoes_avaliacao for all to authenticated
using ((select public.usuario_role()) = 'gestor' or exists (select 1 from public.avaliacoes_docentes a where a.id = avaliacao_id and a.professor_id = (select auth.uid()) and a.status = 'rascunho'))
with check ((select public.usuario_role()) = 'gestor' or exists (select 1 from public.avaliacoes_docentes a where a.id = avaliacao_id and a.professor_id = (select auth.uid()) and a.status = 'rascunho'));

drop policy if exists gabaritos_select on public.gabaritos_avaliacao;
create policy gabaritos_select on public.gabaritos_avaliacao for select to authenticated using (
  (select public.usuario_role()) = 'gestor' or exists (
    select 1 from public.questoes_avaliacao q join public.avaliacoes_docentes a on a.id = q.avaliacao_id
    where q.id = questao_id and a.professor_id = (select auth.uid())
  )
);
drop policy if exists gabaritos_manage on public.gabaritos_avaliacao;
create policy gabaritos_manage on public.gabaritos_avaliacao for all to authenticated
using ((select public.usuario_role()) = 'gestor' or exists (
  select 1 from public.questoes_avaliacao q join public.avaliacoes_docentes a on a.id = q.avaliacao_id
  where q.id = questao_id and a.professor_id = (select auth.uid()) and a.status = 'rascunho'
))
with check ((select public.usuario_role()) = 'gestor' or exists (
  select 1 from public.questoes_avaliacao q join public.avaliacoes_docentes a on a.id = q.avaliacao_id
  where q.id = questao_id and a.professor_id = (select auth.uid()) and a.status = 'rascunho'
));

drop policy if exists entregas_select on public.entregas_laboratorio;
create policy entregas_select on public.entregas_laboratorio for select to authenticated using (
  aluno_id = (select auth.uid()) or (select public.usuario_role()) = 'gestor' or
  exists (select 1 from public.laboratorios_docentes l where l.id = laboratorio_id and l.professor_id = (select auth.uid()))
);
drop policy if exists entregas_insert on public.entregas_laboratorio;
create policy entregas_insert on public.entregas_laboratorio for insert to authenticated with check (
  aluno_id = (select auth.uid()) and status = 'rascunho'
  and nota is null and feedback is null and enviada_em is null and avaliada_em is null
  and exists (
    select 1 from public.laboratorios_docentes l where l.id = laboratorio_id and l.status = 'publicado' and l.turma_id = (select public.usuario_turma_id())
  )
);
drop policy if exists entregas_update on public.entregas_laboratorio;
create policy entregas_update on public.entregas_laboratorio for update to authenticated
using (aluno_id = (select auth.uid()) or (select public.usuario_role()) = 'gestor' or exists (select 1 from public.laboratorios_docentes l where l.id = laboratorio_id and l.professor_id = (select auth.uid())))
with check (aluno_id = (select auth.uid()) or (select public.usuario_role()) = 'gestor' or exists (select 1 from public.laboratorios_docentes l where l.id = laboratorio_id and l.professor_id = (select auth.uid())));

drop policy if exists tentativas_select on public.tentativas_avaliacao;
create policy tentativas_select on public.tentativas_avaliacao for select to authenticated using (
  aluno_id = (select auth.uid()) or (select public.usuario_role()) = 'gestor' or
  exists (select 1 from public.avaliacoes_docentes a where a.id = avaliacao_id and a.professor_id = (select auth.uid()))
);
drop policy if exists tentativas_insert on public.tentativas_avaliacao;
create policy tentativas_insert on public.tentativas_avaliacao for insert to authenticated with check (
  aluno_id = (select auth.uid()) and status = 'em_andamento'
  and nota is null and feedback is null and enviada_em is null and corrigida_em is null
  and exists (
    select 1 from public.avaliacoes_docentes a where a.id = avaliacao_id and a.status = 'publicado' and a.turma_id = (select public.usuario_turma_id())
  )
);
drop policy if exists tentativas_update on public.tentativas_avaliacao;
create policy tentativas_update on public.tentativas_avaliacao for update to authenticated
using (aluno_id = (select auth.uid()) or (select public.usuario_role()) = 'gestor' or exists (select 1 from public.avaliacoes_docentes a where a.id = avaliacao_id and a.professor_id = (select auth.uid())))
with check (aluno_id = (select auth.uid()) or (select public.usuario_role()) = 'gestor' or exists (select 1 from public.avaliacoes_docentes a where a.id = avaliacao_id and a.professor_id = (select auth.uid())));

-- Conteúdo publicado vira um registro pedagógico estável: o professor pode encerrá-lo,
-- mas precisa duplicar/criar um novo rascunho para alterar enunciados ou configuração.
create or replace function public.validar_ciclo_laboratorio_docente()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.id <> old.id or new.created_at is distinct from old.created_at then
    raise exception 'A identidade e a data de criação do laboratório são imutáveis.';
  end if;
  if (select public.usuario_role()) = 'professor' then
    if new.professor_id <> old.professor_id or new.tipo_professor <> old.tipo_professor then
      raise exception 'A autoria e a especialidade do laboratório são imutáveis.';
    end if;
    if old.status <> 'rascunho' and (
      old.status <> 'publicado' or new.status <> 'encerrado'
      or new.turma_id is distinct from old.turma_id
      or new.titulo is distinct from old.titulo
      or new.descricao is distinct from old.descricao
      or new.formato is distinct from old.formato
      or new.configuracao is distinct from old.configuracao
      or new.prazo is distinct from old.prazo
      or new.publicado_em is distinct from old.publicado_em
    ) then
      raise exception 'Um laboratório publicado só pode ser encerrado.';
    end if;
    if old.status = 'rascunho' and new.status = 'publicado' then
      new.publicado_em := coalesce(new.publicado_em, now());
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.validar_ciclo_avaliacao_docente()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.id <> old.id or new.created_at is distinct from old.created_at then
    raise exception 'A identidade e a data de criação da avaliação são imutáveis.';
  end if;
  if (select public.usuario_role()) = 'professor' then
    if new.professor_id <> old.professor_id or new.tipo_professor <> old.tipo_professor then
      raise exception 'A autoria e a especialidade da avaliação são imutáveis.';
    end if;
    if old.status = 'rascunho' and new.status = 'publicado' and not exists (
      select 1 from public.questoes_avaliacao q where q.avaliacao_id = old.id
    ) then
      raise exception 'Adicione ao menos uma questão antes de publicar.';
    end if;
    if old.status <> 'rascunho' and (
      old.status <> 'publicado' or new.status <> 'encerrado'
      or new.turma_id is distinct from old.turma_id
      or new.titulo is distinct from old.titulo
      or new.instrucoes is distinct from old.instrucoes
      or new.duracao_minutos is distinct from old.duracao_minutos
      or new.valor is distinct from old.valor
      or new.configuracao is distinct from old.configuracao
      or new.abre_em is distinct from old.abre_em
      or new.encerra_em is distinct from old.encerra_em
      or new.publicado_em is distinct from old.publicado_em
    ) then
      raise exception 'Uma avaliação publicada só pode ser encerrada.';
    end if;
    if old.status = 'rascunho' and new.status = 'publicado' then
      new.publicado_em := coalesce(new.publicado_em, now());
    end if;
  end if;
  return new;
end;
$$;

-- Impede que um aluno atribua a própria nota ou altere uma entrega já enviada.
-- Também preserva a autoria: professores corrigem, mas não reescrevem o conteúdo do aluno.
create or replace function public.validar_atualizacao_entrega_docente()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  papel public.perfil_role := (select public.usuario_role());
begin
  if new.id <> old.id or new.created_at is distinct from old.created_at then
    raise exception 'A identidade e a data de criação da entrega são imutáveis.';
  end if;
  if papel = 'aluno' then
    if old.aluno_id <> (select auth.uid())
      or new.aluno_id <> old.aluno_id
      or new.laboratorio_id <> old.laboratorio_id
      or old.status <> 'rascunho'
      or new.status not in ('rascunho', 'enviada')
      or new.nota is distinct from old.nota
      or new.feedback is distinct from old.feedback
      or new.avaliada_em is distinct from old.avaliada_em then
      raise exception 'O aluno não pode alterar autoria, correção ou uma entrega já enviada.';
    end if;
    if new.status = 'enviada' and old.status = 'rascunho' then
      new.enviada_em := coalesce(new.enviada_em, now());
    end if;
  elsif papel = 'professor' then
    if new.aluno_id <> old.aluno_id
      or new.laboratorio_id <> old.laboratorio_id
      or new.conteudo is distinct from old.conteudo
      or new.enviada_em is distinct from old.enviada_em then
      raise exception 'O professor pode corrigir a entrega, mas não alterar a resposta do aluno.';
    end if;
  elsif papel <> 'gestor' then
    raise exception 'Perfil sem permissão para atualizar entregas.';
  end if;
  return new;
end;
$$;

create or replace function public.validar_atualizacao_tentativa_docente()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  papel public.perfil_role := (select public.usuario_role());
begin
  if new.id <> old.id then
    raise exception 'A identidade da tentativa é imutável.';
  end if;
  if papel = 'aluno' then
    if old.aluno_id <> (select auth.uid())
      or new.aluno_id <> old.aluno_id
      or new.avaliacao_id <> old.avaliacao_id
      or old.status <> 'em_andamento'
      or new.status not in ('em_andamento', 'enviada')
      or new.nota is distinct from old.nota
      or new.feedback is distinct from old.feedback
      or new.corrigida_em is distinct from old.corrigida_em then
      raise exception 'O aluno não pode alterar autoria, correção ou uma tentativa já enviada.';
    end if;
    if new.status = 'enviada' and old.status = 'em_andamento' then
      new.enviada_em := coalesce(new.enviada_em, now());
    end if;
  elsif papel = 'professor' then
    if new.aluno_id <> old.aluno_id
      or new.avaliacao_id <> old.avaliacao_id
      or new.respostas is distinct from old.respostas
      or new.iniciada_em is distinct from old.iniciada_em
      or new.enviada_em is distinct from old.enviada_em then
      raise exception 'O professor pode corrigir a tentativa, mas não alterar as respostas do aluno.';
    end if;
  elsif papel <> 'gestor' then
    raise exception 'Perfil sem permissão para atualizar tentativas.';
  end if;
  return new;
end;
$$;

revoke all on function public.validar_atualizacao_entrega_docente() from public, anon, authenticated;
revoke all on function public.validar_atualizacao_tentativa_docente() from public, anon, authenticated;
revoke all on function public.validar_ciclo_laboratorio_docente() from public, anon, authenticated;
revoke all on function public.validar_ciclo_avaliacao_docente() from public, anon, authenticated;

drop trigger if exists set_laboratorios_updated_at on public.laboratorios_docentes;
drop trigger if exists set_avaliacoes_updated_at on public.avaliacoes_docentes;
drop trigger if exists set_entregas_updated_at on public.entregas_laboratorio;
drop trigger if exists set_tentativas_updated_at on public.tentativas_avaliacao;
drop trigger if exists validar_entrega_docente on public.entregas_laboratorio;
drop trigger if exists validar_tentativa_docente on public.tentativas_avaliacao;
drop trigger if exists validar_ciclo_laboratorio_docente on public.laboratorios_docentes;
drop trigger if exists validar_ciclo_avaliacao_docente on public.avaliacoes_docentes;
create trigger set_laboratorios_updated_at before update on public.laboratorios_docentes for each row execute function public.set_updated_at();
create trigger set_avaliacoes_updated_at before update on public.avaliacoes_docentes for each row execute function public.set_updated_at();
create trigger validar_ciclo_laboratorio_docente before update on public.laboratorios_docentes for each row execute function public.validar_ciclo_laboratorio_docente();
create trigger validar_ciclo_avaliacao_docente before update on public.avaliacoes_docentes for each row execute function public.validar_ciclo_avaliacao_docente();
create trigger validar_entrega_docente before update on public.entregas_laboratorio for each row execute function public.validar_atualizacao_entrega_docente();
create trigger validar_tentativa_docente before update on public.tentativas_avaliacao for each row execute function public.validar_atualizacao_tentativa_docente();
create trigger set_entregas_updated_at before update on public.entregas_laboratorio for each row execute function public.set_updated_at();
create trigger set_tentativas_updated_at before update on public.tentativas_avaliacao for each row execute function public.set_updated_at();
drop trigger if exists set_gabaritos_updated_at on public.gabaritos_avaliacao;
create trigger set_gabaritos_updated_at before update on public.gabaritos_avaliacao for each row execute function public.set_updated_at();

revoke all on public.laboratorios_docentes, public.avaliacoes_docentes, public.questoes_avaliacao, public.gabaritos_avaliacao, public.entregas_laboratorio, public.tentativas_avaliacao from anon;
grant select, insert, update, delete on public.laboratorios_docentes, public.avaliacoes_docentes, public.questoes_avaliacao, public.gabaritos_avaliacao, public.entregas_laboratorio, public.tentativas_avaliacao to authenticated;

commit;
