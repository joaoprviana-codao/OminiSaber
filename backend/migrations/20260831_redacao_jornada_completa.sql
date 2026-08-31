begin;

create schema if not exists private;

alter table public.propostas_redacao
  add column if not exists fixada boolean not null default false,
  add column if not exists resumo text,
  add column if not exists eixo_tematico text,
  add column if not exists dificuldade text not null default 'intermediaria',
  add column if not exists tempo_estimado_min integer not null default 90,
  add column if not exists palavras_chave text[] not null default '{}',
  add column if not exists imagem_url text,
  add column if not exists detalhes jsonb not null default '{}'::jsonb;

alter table public.redacoes
  add column if not exists tema_codigo text,
  add column if not exists planejamento_id uuid,
  add column if not exists enviada_para_revisao_em timestamptz;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'propostas_redacao_dificuldade_check' and conrelid = 'public.propostas_redacao'::regclass) then
    alter table public.propostas_redacao add constraint propostas_redacao_dificuldade_check check (dificuldade in ('inicial','intermediaria','avancada'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'propostas_redacao_tempo_check' and conrelid = 'public.propostas_redacao'::regclass) then
    alter table public.propostas_redacao add constraint propostas_redacao_tempo_check check (tempo_estimado_min between 10 and 360);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'propostas_redacao_detalhes_check' and conrelid = 'public.propostas_redacao'::regclass) then
    alter table public.propostas_redacao add constraint propostas_redacao_detalhes_check check (jsonb_typeof(detalhes) = 'object');
  end if;
end $$;

create table if not exists public.materiais_redacao (
  id uuid primary key default gen_random_uuid(),
  proposta_id uuid not null references public.propostas_redacao(id) on delete cascade,
  titulo text not null check (char_length(btrim(titulo)) between 2 and 160),
  tipo text not null check (tipo in ('texto_motivador','redacao_modelo','artigo','video','infografico','guia')),
  conteudo text,
  url text,
  autoria text,
  fonte text,
  ano smallint check (ano is null or ano between 1500 and 2200),
  fixado boolean not null default false,
  ordem integer not null default 1 check (ordem > 0),
  created_at timestamptz not null default now(),
  unique (proposta_id, ordem)
);

create table if not exists public.repertorios_redacao (
  id uuid primary key default gen_random_uuid(),
  proposta_id uuid references public.propostas_redacao(id) on delete cascade,
  professor_id uuid not null references public.perfis(id) on delete cascade,
  turma_id uuid references public.turmas(id) on delete set null,
  categoria text not null check (categoria in ('cultural','estatistico','historico','cientifico','legal','literario')),
  titulo text not null check (char_length(btrim(titulo)) between 3 and 160),
  referencia text not null check (char_length(btrim(referencia)) >= 10),
  aplicacao text not null check (char_length(btrim(aplicacao)) >= 10),
  fonte_url text,
  contextualizado boolean not null default true check (contextualizado = true),
  publicado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.planejamentos_redacao (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.perfis(id) on delete cascade,
  proposta_id uuid references public.propostas_redacao(id) on delete set null,
  tema_codigo text not null,
  anotacoes text not null default '' check (char_length(anotacoes) <= 20000),
  tese text not null default '',
  argumentos jsonb not null default '[]'::jsonb check (jsonb_typeof(argumentos) = 'array'),
  repertorios_contextuais jsonb not null default '[]'::jsonb check (jsonb_typeof(repertorios_contextuais) = 'array'),
  intervencao jsonb not null default '{}'::jsonb check (jsonb_typeof(intervencao) = 'object'),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (aluno_id, tema_codigo)
);

alter table public.redacoes
  drop constraint if exists redacoes_planejamento_id_fkey;
alter table public.redacoes
  add constraint redacoes_planejamento_id_fkey foreign key (planejamento_id) references public.planejamentos_redacao(id) on delete set null;

create table if not exists public.planejamento_repertorios (
  planejamento_id uuid not null references public.planejamentos_redacao(id) on delete cascade,
  repertorio_id uuid not null references public.repertorios_redacao(id) on delete cascade,
  uso_planejado text not null default '' check (char_length(uso_planejado) <= 2000),
  created_at timestamptz not null default now(),
  primary key (planejamento_id, repertorio_id)
);

create table if not exists public.versoes_redacao (
  id uuid primary key default gen_random_uuid(),
  redacao_id uuid not null references public.redacoes(id) on delete cascade,
  numero integer not null check (numero > 0),
  titulo text not null,
  texto text not null,
  motivo text not null check (motivo in ('criacao','salvamento','envio','correcao')),
  autor_id uuid references public.perfis(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (redacao_id, numero)
);

create table if not exists public.comentarios_redacao (
  id uuid primary key default gen_random_uuid(),
  redacao_id uuid not null references public.redacoes(id) on delete cascade,
  professor_id uuid not null references public.perfis(id) on delete cascade,
  inicio_offset integer check (inicio_offset is null or inicio_offset >= 0),
  fim_offset integer check (fim_offset is null or fim_offset >= inicio_offset),
  trecho text,
  comentario text not null check (char_length(btrim(comentario)) >= 2),
  tipo text not null default 'orientacao' check (tipo in ('elogio','orientacao','correcao','atencao')),
  created_at timestamptz not null default now()
);

create table if not exists public.avaliacoes_competencias_redacao (
  redacao_id uuid not null references public.redacoes(id) on delete cascade,
  competencia smallint not null check (competencia between 1 and 5),
  nota smallint not null check (nota in (0,40,80,120,160,200)),
  comentario text,
  professor_id uuid not null references public.perfis(id) on delete cascade,
  updated_at timestamptz not null default now(),
  primary key (redacao_id, competencia)
);

create index if not exists propostas_redacao_catalogo_idx on public.propostas_redacao (publicada, fixada desc, turma_id, prazo);
create index if not exists materiais_redacao_proposta_idx on public.materiais_redacao (proposta_id, fixado desc, ordem);
create index if not exists repertorios_redacao_catalogo_idx on public.repertorios_redacao (publicado, turma_id, categoria);
create index if not exists repertorios_redacao_proposta_idx on public.repertorios_redacao (proposta_id) where proposta_id is not null;
create index if not exists planejamentos_redacao_aluno_idx on public.planejamentos_redacao (aluno_id, updated_at desc);
create index if not exists planejamento_repertorios_repertorio_idx on public.planejamento_repertorios (repertorio_id);
create index if not exists redacoes_aluno_status_data_idx on public.redacoes (aluno_id, status, updated_at desc);
create unique index if not exists redacoes_rascunho_tema_unique on public.redacoes (aluno_id, tema_codigo) where status = 'rascunho' and tema_codigo is not null;
create index if not exists versoes_redacao_data_idx on public.versoes_redacao (redacao_id, numero desc);
create index if not exists comentarios_redacao_idx on public.comentarios_redacao (redacao_id, created_at);

alter table public.materiais_redacao enable row level security;
alter table public.repertorios_redacao enable row level security;
alter table public.planejamentos_redacao enable row level security;
alter table public.planejamento_repertorios enable row level security;
alter table public.versoes_redacao enable row level security;
alter table public.comentarios_redacao enable row level security;
alter table public.avaliacoes_competencias_redacao enable row level security;

revoke all on public.materiais_redacao, public.repertorios_redacao, public.planejamentos_redacao,
  public.planejamento_repertorios, public.versoes_redacao, public.comentarios_redacao,
  public.avaliacoes_competencias_redacao from anon;
grant select on public.materiais_redacao, public.repertorios_redacao, public.planejamentos_redacao,
  public.planejamento_repertorios, public.versoes_redacao, public.comentarios_redacao,
  public.avaliacoes_competencias_redacao to authenticated;
grant insert, update on public.planejamentos_redacao, public.planejamento_repertorios to authenticated;
grant delete on public.planejamento_repertorios to authenticated;
grant insert, update, delete on public.materiais_redacao, public.repertorios_redacao,
  public.comentarios_redacao, public.avaliacoes_competencias_redacao to authenticated;

drop policy if exists materiais_redacao_select on public.materiais_redacao;
create policy materiais_redacao_select on public.materiais_redacao for select to authenticated using (
  exists (select 1 from public.propostas_redacao p where p.id = proposta_id)
);
drop policy if exists materiais_redacao_manage on public.materiais_redacao;
create policy materiais_redacao_manage on public.materiais_redacao for all to authenticated
using ((select public.usuario_role()) = 'gestor' or exists (
  select 1 from public.propostas_redacao p where p.id = proposta_id and p.professor_id = (select auth.uid()) and (select public.usuario_tipo_professor()) = 'portugues'
))
with check ((select public.usuario_role()) = 'gestor' or exists (
  select 1 from public.propostas_redacao p where p.id = proposta_id and p.professor_id = (select auth.uid()) and (select public.usuario_tipo_professor()) = 'portugues'
));

drop policy if exists repertorios_redacao_select on public.repertorios_redacao;
create policy repertorios_redacao_select on public.repertorios_redacao for select to authenticated using (
  (select public.usuario_role()) = 'gestor'
  or professor_id = (select auth.uid())
  or (publicado = true and (turma_id is null or turma_id = (select public.usuario_turma_id())))
);
drop policy if exists repertorios_redacao_manage on public.repertorios_redacao;
create policy repertorios_redacao_manage on public.repertorios_redacao for all to authenticated
using ((select public.usuario_role()) = 'gestor' or (professor_id = (select auth.uid()) and (select public.usuario_tipo_professor()) = 'portugues'))
with check ((select public.usuario_role()) = 'gestor' or (
  professor_id = (select auth.uid()) and (select public.usuario_tipo_professor()) = 'portugues'
  and (turma_id is null or exists (select 1 from public.professor_turmas pt where pt.professor_id = (select auth.uid()) and pt.turma_id = repertorios_redacao.turma_id))
));

drop policy if exists planejamentos_redacao_own on public.planejamentos_redacao;
create policy planejamentos_redacao_own on public.planejamentos_redacao for all to authenticated
using (aluno_id = (select auth.uid())) with check (aluno_id = (select auth.uid()));

drop policy if exists planejamento_repertorios_own on public.planejamento_repertorios;
create policy planejamento_repertorios_own on public.planejamento_repertorios for all to authenticated
using (exists (select 1 from public.planejamentos_redacao p where p.id = planejamento_id and p.aluno_id = (select auth.uid())))
with check (exists (select 1 from public.planejamentos_redacao p where p.id = planejamento_id and p.aluno_id = (select auth.uid())));

drop policy if exists versoes_redacao_select on public.versoes_redacao;
create policy versoes_redacao_select on public.versoes_redacao for select to authenticated using (
  exists (select 1 from public.redacoes r where r.id = redacao_id)
);

drop policy if exists comentarios_redacao_select on public.comentarios_redacao;
create policy comentarios_redacao_select on public.comentarios_redacao for select to authenticated using (
  exists (select 1 from public.redacoes r where r.id = redacao_id)
);
drop policy if exists comentarios_redacao_manage on public.comentarios_redacao;
create policy comentarios_redacao_manage on public.comentarios_redacao for all to authenticated
using ((select public.usuario_role()) = 'gestor' or (
  professor_id = (select auth.uid()) and (select public.usuario_tipo_professor()) = 'portugues'
  and exists (select 1 from public.redacoes r where r.id = redacao_id)
))
with check ((select public.usuario_role()) = 'gestor' or (
  professor_id = (select auth.uid()) and (select public.usuario_tipo_professor()) = 'portugues'
  and exists (select 1 from public.redacoes r where r.id = redacao_id)
));

drop policy if exists avaliacoes_competencias_select on public.avaliacoes_competencias_redacao;
create policy avaliacoes_competencias_select on public.avaliacoes_competencias_redacao for select to authenticated using (
  exists (select 1 from public.redacoes r where r.id = redacao_id)
);
drop policy if exists avaliacoes_competencias_manage on public.avaliacoes_competencias_redacao;
create policy avaliacoes_competencias_manage on public.avaliacoes_competencias_redacao for all to authenticated
using ((select public.usuario_role()) = 'gestor' or (
  professor_id = (select auth.uid()) and (select public.usuario_tipo_professor()) = 'portugues'
  and exists (select 1 from public.redacoes r where r.id = redacao_id)
))
with check ((select public.usuario_role()) = 'gestor' or (
  professor_id = (select auth.uid()) and (select public.usuario_tipo_professor()) = 'portugues'
  and exists (select 1 from public.redacoes r where r.id = redacao_id)
));

drop policy if exists redacoes_update on public.redacoes;
drop policy if exists redacoes_update_aluno on public.redacoes;
drop policy if exists redacoes_update_professor on public.redacoes;
drop policy if exists redacoes_update_gestor on public.redacoes;
create policy redacoes_update_aluno on public.redacoes for update to authenticated
using (aluno_id = (select auth.uid()) and status = 'rascunho')
with check (aluno_id = (select auth.uid()) and status in ('rascunho','enviada'));
create policy redacoes_update_professor on public.redacoes for update to authenticated
using ((select public.usuario_tipo_professor()) = 'portugues' and exists (
  select 1 from public.perfis p join public.professor_turmas pt on pt.turma_id = p.turma_id
  where p.id = aluno_id and pt.professor_id = (select auth.uid())
))
with check ((select public.usuario_tipo_professor()) = 'portugues' and exists (
  select 1 from public.perfis p join public.professor_turmas pt on pt.turma_id = p.turma_id
  where p.id = aluno_id and pt.professor_id = (select auth.uid())
));
create policy redacoes_update_gestor on public.redacoes for update to authenticated
using ((select public.usuario_role()) = 'gestor') with check ((select public.usuario_role()) = 'gestor');

drop policy if exists redacoes_insert_proprias on public.redacoes;
create policy redacoes_insert_proprias on public.redacoes for insert to authenticated with check (
  aluno_id = (select auth.uid()) and status = 'rascunho'
  and (proposta_id is null or exists (select 1 from public.propostas_redacao p where p.id = proposta_id and p.publicada = true))
);

create or replace function private.registrar_versao_redacao()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_numero integer; v_motivo text; v_ultima_id uuid; v_ultima_data timestamptz;
begin
  if tg_op = 'UPDATE' then
    if new.titulo is not distinct from old.titulo and new.texto is not distinct from old.texto and new.status is not distinct from old.status then
      return new;
    end if;
  end if;
  select coalesce(max(v.numero), 0) + 1 into v_numero from public.versoes_redacao v where v.redacao_id = new.id;
  if tg_op = 'INSERT' then
    v_motivo := 'criacao';
  elsif new.status = 'corrigida' and old.status is distinct from new.status then
    v_motivo := 'correcao';
  elsif new.status = 'enviada' and old.status is distinct from new.status then
    v_motivo := 'envio';
  else
    v_motivo := 'salvamento';
  end if;
  if v_motivo = 'salvamento' then
    select v.id, v.created_at into v_ultima_id, v_ultima_data
    from public.versoes_redacao v where v.redacao_id = new.id order by v.numero desc limit 1;
    if v_ultima_id is not null and v_ultima_data > now() - interval '2 minutes' then
      update public.versoes_redacao set titulo = new.titulo, texto = new.texto, autor_id = (select auth.uid()), created_at = now() where id = v_ultima_id;
      return new;
    end if;
  end if;
  insert into public.versoes_redacao (redacao_id, numero, titulo, texto, motivo, autor_id)
  values (new.id, v_numero, new.titulo, new.texto, v_motivo, (select auth.uid()));
  return new;
end $$;

revoke all on function private.registrar_versao_redacao() from public, anon, authenticated;
drop trigger if exists trg_redacao_versao_insert on public.redacoes;
create trigger trg_redacao_versao_insert after insert on public.redacoes for each row execute function private.registrar_versao_redacao();
drop trigger if exists trg_redacao_versao_update on public.redacoes;
create trigger trg_redacao_versao_update after update of titulo, texto, status on public.redacoes for each row execute function private.registrar_versao_redacao();

commit;
