begin;

create extension if not exists pgcrypto;

create table if not exists public.eventos_agenda (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (char_length(btrim(titulo)) between 3 and 120),
  descricao text,
  tipo text not null check (tipo in ('aula', 'prova', 'recuperacao', 'trabalho', 'atividade', 'reuniao', 'outro')),
  inicio timestamptz not null,
  fim timestamptz,
  dia_inteiro boolean not null default false,
  materia text,
  local text,
  turma_id uuid not null references public.turmas(id) on delete cascade,
  professor_id uuid not null references public.perfis(id) on delete cascade,
  status text not null default 'publicado' check (status in ('rascunho', 'publicado', 'cancelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (fim is null or fim >= inicio)
);

create table if not exists public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (char_length(btrim(titulo)) between 3 and 140),
  mensagem text not null check (char_length(btrim(mensagem)) between 3 and 500),
  tipo text not null default 'sistema' check (tipo in ('agenda', 'avaliacao', 'biblioteca', 'progresso', 'sistema')),
  prioridade text not null default 'normal' check (prioridade in ('baixa', 'normal', 'alta')),
  destino_turma_id uuid references public.turmas(id) on delete cascade,
  criado_por uuid not null references public.perfis(id) on delete cascade,
  evento_agenda_id uuid unique references public.eventos_agenda(id) on delete cascade,
  link text,
  expira_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notificacoes_lidas (
  usuario_id uuid not null references public.perfis(id) on delete cascade,
  notificacao_id uuid not null references public.notificacoes(id) on delete cascade,
  lida_em timestamptz not null default now(),
  primary key (usuario_id, notificacao_id)
);

create index if not exists eventos_agenda_turma_inicio_idx on public.eventos_agenda (turma_id, inicio);
create index if not exists eventos_agenda_professor_inicio_idx on public.eventos_agenda (professor_id, inicio);
create index if not exists eventos_agenda_publicados_idx on public.eventos_agenda (inicio) where status = 'publicado';
create index if not exists notificacoes_turma_created_idx on public.notificacoes (destino_turma_id, created_at desc);
create index if not exists notificacoes_criador_created_idx on public.notificacoes (criado_por, created_at desc);
create index if not exists notificacoes_lidas_usuario_idx on public.notificacoes_lidas (usuario_id, lida_em desc);
create index if not exists notificacoes_lidas_notificacao_idx on public.notificacoes_lidas (notificacao_id);

alter table public.eventos_agenda enable row level security;
alter table public.notificacoes enable row level security;
alter table public.notificacoes_lidas enable row level security;

revoke all on public.eventos_agenda, public.notificacoes, public.notificacoes_lidas from anon;
grant select, insert, update, delete on public.eventos_agenda, public.notificacoes, public.notificacoes_lidas to authenticated;

drop policy if exists eventos_agenda_select on public.eventos_agenda;
create policy eventos_agenda_select on public.eventos_agenda for select to authenticated using (
  (select public.usuario_role()) = 'gestor'
  or professor_id = (select auth.uid())
  or turma_id in (select pt.turma_id from public.professor_turmas pt where pt.professor_id = (select auth.uid()))
  or (
    status = 'publicado'
    and turma_id = (select p.turma_id from public.perfis p where p.id = (select auth.uid()))
  )
);

drop policy if exists eventos_agenda_insert on public.eventos_agenda;
create policy eventos_agenda_insert on public.eventos_agenda for insert to authenticated with check (
  professor_id = (select auth.uid())
  and (
    (select public.usuario_role()) = 'gestor'
    or (
      (select public.usuario_role()) = 'professor'
      and turma_id in (select pt.turma_id from public.professor_turmas pt where pt.professor_id = (select auth.uid()))
    )
  )
);

drop policy if exists eventos_agenda_update on public.eventos_agenda;
create policy eventos_agenda_update on public.eventos_agenda for update to authenticated
using ((select public.usuario_role()) = 'gestor' or professor_id = (select auth.uid()))
with check (
  (select public.usuario_role()) = 'gestor'
  or (
    professor_id = (select auth.uid())
    and turma_id in (select pt.turma_id from public.professor_turmas pt where pt.professor_id = (select auth.uid()))
  )
);

drop policy if exists eventos_agenda_delete on public.eventos_agenda;
create policy eventos_agenda_delete on public.eventos_agenda for delete to authenticated
using ((select public.usuario_role()) = 'gestor' or professor_id = (select auth.uid()));

drop policy if exists notificacoes_select on public.notificacoes;
create policy notificacoes_select on public.notificacoes for select to authenticated using (
  (expira_em is null or expira_em > now())
  and (
    (select public.usuario_role()) = 'gestor'
    or criado_por = (select auth.uid())
    or destino_turma_id is null
    or destino_turma_id in (select pt.turma_id from public.professor_turmas pt where pt.professor_id = (select auth.uid()))
    or destino_turma_id = (select p.turma_id from public.perfis p where p.id = (select auth.uid()))
  )
);

drop policy if exists notificacoes_insert on public.notificacoes;
create policy notificacoes_insert on public.notificacoes for insert to authenticated with check (
  criado_por = (select auth.uid())
  and (
    (select public.usuario_role()) = 'gestor'
    or (
      (select public.usuario_role()) = 'professor'
      and destino_turma_id in (select pt.turma_id from public.professor_turmas pt where pt.professor_id = (select auth.uid()))
    )
  )
);

drop policy if exists notificacoes_update on public.notificacoes;
create policy notificacoes_update on public.notificacoes for update to authenticated
using ((select public.usuario_role()) = 'gestor' or criado_por = (select auth.uid()))
with check ((select public.usuario_role()) = 'gestor' or criado_por = (select auth.uid()));

drop policy if exists notificacoes_delete on public.notificacoes;
create policy notificacoes_delete on public.notificacoes for delete to authenticated
using ((select public.usuario_role()) = 'gestor' or criado_por = (select auth.uid()));

drop policy if exists notificacoes_lidas_select on public.notificacoes_lidas;
create policy notificacoes_lidas_select on public.notificacoes_lidas for select to authenticated
using (usuario_id = (select auth.uid()));
drop policy if exists notificacoes_lidas_insert on public.notificacoes_lidas;
create policy notificacoes_lidas_insert on public.notificacoes_lidas for insert to authenticated
with check (usuario_id = (select auth.uid()));
drop policy if exists notificacoes_lidas_update on public.notificacoes_lidas;
create policy notificacoes_lidas_update on public.notificacoes_lidas for update to authenticated
using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));
drop policy if exists notificacoes_lidas_delete on public.notificacoes_lidas;
create policy notificacoes_lidas_delete on public.notificacoes_lidas for delete to authenticated
using (usuario_id = (select auth.uid()));

create or replace function public.sincronizar_notificacao_agenda()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_titulo text;
  v_mensagem text;
begin
  if new.status = 'publicado' and new.tipo in ('prova', 'recuperacao', 'trabalho', 'atividade') then
    v_titulo := case new.tipo
      when 'prova' then 'Nova prova na agenda'
      when 'recuperacao' then 'Recuperação agendada'
      when 'trabalho' then 'Novo trabalho na agenda'
      else 'Nova atividade na agenda'
    end;
    v_mensagem := new.titulo || ' · ' || to_char(new.inicio at time zone 'America/Sao_Paulo', 'DD/MM/YYYY às HH24:MI');
    insert into public.notificacoes (titulo, mensagem, tipo, prioridade, destino_turma_id, criado_por, evento_agenda_id, link, updated_at)
    values (
      v_titulo,
      v_mensagem,
      'agenda',
      case when new.tipo in ('prova', 'recuperacao') then 'alta' else 'normal' end,
      new.turma_id,
      new.professor_id,
      new.id,
      '../agenda/index.html?evento=' || new.id,
      now()
    )
    on conflict (evento_agenda_id) do update set
      titulo = excluded.titulo,
      mensagem = excluded.mensagem,
      prioridade = excluded.prioridade,
      destino_turma_id = excluded.destino_turma_id,
      updated_at = now();
  else
    delete from public.notificacoes where evento_agenda_id = new.id;
  end if;
  return new;
end;
$$;

revoke all on function public.sincronizar_notificacao_agenda() from public, anon, authenticated;

drop trigger if exists trg_sincronizar_notificacao_agenda on public.eventos_agenda;
create trigger trg_sincronizar_notificacao_agenda
after insert or update of titulo, tipo, inicio, turma_id, status
on public.eventos_agenda
for each row execute function public.sincronizar_notificacao_agenda();

drop trigger if exists set_eventos_agenda_updated_at on public.eventos_agenda;
create trigger set_eventos_agenda_updated_at
before update on public.eventos_agenda
for each row execute function public.set_updated_at();

drop trigger if exists set_notificacoes_updated_at on public.notificacoes;
create trigger set_notificacoes_updated_at
before update on public.notificacoes
for each row execute function public.set_updated_at();

do $$
begin
  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'eventos_agenda'
  ) then alter publication supabase_realtime add table public.eventos_agenda; end if;
  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notificacoes'
  ) then alter publication supabase_realtime add table public.notificacoes; end if;
end $$;

commit;
