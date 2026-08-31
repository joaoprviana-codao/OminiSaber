begin;

create schema if not exists private;

alter table public.trilhas
  add column if not exists area_conhecimento text,
  add column if not exists serie smallint,
  add column if not exists trimestre smallint,
  add column if not exists dificuldade text not null default 'inicial',
  add column if not exists duracao_estimada_min integer not null default 0,
  add column if not exists recompensa_xp integer not null default 0,
  add column if not exists capa_url text,
  add column if not exists tags text[] not null default '{}';

alter table public.atividades
  add column if not exists tipo_conteudo text not null default 'aula',
  add column if not exists conteudo jsonb not null default '{}'::jsonb,
  add column if not exists video_url text,
  add column if not exists duracao_minutos integer not null default 0,
  add column if not exists recompensa_xp integer not null default 0,
  add column if not exists obrigatoria boolean not null default true,
  add column if not exists prerequisito_atividade_id uuid references public.atividades(id) on delete set null;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'trilhas_serie_check' and conrelid = 'public.trilhas'::regclass) then
    alter table public.trilhas add constraint trilhas_serie_check check (serie is null or serie between 1 and 3);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'trilhas_trimestre_check' and conrelid = 'public.trilhas'::regclass) then
    alter table public.trilhas add constraint trilhas_trimestre_check check (trimestre is null or trimestre between 1 and 3);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'trilhas_dificuldade_check' and conrelid = 'public.trilhas'::regclass) then
    alter table public.trilhas add constraint trilhas_dificuldade_check check (dificuldade in ('inicial','intermediaria','avancada'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'trilhas_duracao_check' and conrelid = 'public.trilhas'::regclass) then
    alter table public.trilhas add constraint trilhas_duracao_check check (duracao_estimada_min >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'trilhas_recompensa_check' and conrelid = 'public.trilhas'::regclass) then
    alter table public.trilhas add constraint trilhas_recompensa_check check (recompensa_xp >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'atividades_tipo_conteudo_check' and conrelid = 'public.atividades'::regclass) then
    alter table public.atividades add constraint atividades_tipo_conteudo_check check (tipo_conteudo in ('aula','atividade','quiz','projeto'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'atividades_conteudo_check' and conrelid = 'public.atividades'::regclass) then
    alter table public.atividades add constraint atividades_conteudo_check check (jsonb_typeof(conteudo) = 'object');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'atividades_duracao_check' and conrelid = 'public.atividades'::regclass) then
    alter table public.atividades add constraint atividades_duracao_check check (duracao_minutos >= 0);
  end if;
end $$;

create table if not exists public.trilhas_prerequisitos (
  trilha_id uuid not null references public.trilhas(id) on delete cascade,
  prerequisito_trilha_id uuid not null references public.trilhas(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (trilha_id, prerequisito_trilha_id),
  check (trilha_id <> prerequisito_trilha_id)
);

create table if not exists public.materiais_aula (
  id uuid primary key default gen_random_uuid(),
  atividade_id uuid not null references public.atividades(id) on delete cascade,
  titulo text not null check (char_length(btrim(titulo)) between 2 and 120),
  tipo text not null check (tipo in ('pdf','video','link','imagem','audio','arquivo')),
  url text not null,
  ordem integer not null default 1 check (ordem > 0),
  created_at timestamptz not null default now(),
  unique (atividade_id, ordem)
);

create table if not exists public.questoes_atividades (
  id uuid primary key default gen_random_uuid(),
  atividade_id uuid not null references public.atividades(id) on delete cascade,
  enunciado text not null check (char_length(btrim(enunciado)) >= 3),
  tipo text not null default 'multipla_escolha' check (tipo in ('multipla_escolha','verdadeiro_falso','resposta_curta')),
  alternativas jsonb not null default '[]'::jsonb check (jsonb_typeof(alternativas) = 'array'),
  dica text,
  pontos numeric(7,2) not null default 1 check (pontos > 0),
  ordem integer not null default 1 check (ordem > 0),
  created_at timestamptz not null default now(),
  unique (atividade_id, ordem)
);

create table if not exists private.gabaritos_questoes (
  questao_id uuid primary key references public.questoes_atividades(id) on delete cascade,
  resposta_correta jsonb not null,
  explicacao text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.tentativas_atividades (
  id uuid primary key default gen_random_uuid(),
  atividade_id uuid not null references public.atividades(id) on delete cascade,
  aluno_id uuid not null references public.perfis(id) on delete cascade,
  status text not null default 'em_andamento' check (status in ('em_andamento','concluida')),
  acertos integer not null default 0 check (acertos >= 0),
  pontuacao_obtida numeric(8,2) not null default 0 check (pontuacao_obtida >= 0),
  pontuacao_maxima numeric(8,2) not null default 0 check (pontuacao_maxima >= 0),
  iniciada_em timestamptz not null default now(),
  concluida_em timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.respostas_questoes (
  id uuid primary key default gen_random_uuid(),
  tentativa_id uuid not null references public.tentativas_atividades(id) on delete cascade,
  questao_id uuid not null references public.questoes_atividades(id) on delete cascade,
  aluno_id uuid not null references public.perfis(id) on delete cascade,
  resposta jsonb not null,
  correta boolean not null default false,
  pontos_obtidos numeric(7,2) not null default 0 check (pontos_obtidos >= 0),
  explicacao_snapshot text,
  respondida_em timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tentativa_id, questao_id)
);

create table if not exists public.conteudos_salvos (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.perfis(id) on delete cascade,
  trilha_id uuid references public.trilhas(id) on delete cascade,
  atividade_id uuid references public.atividades(id) on delete cascade,
  nota_pessoal text,
  created_at timestamptz not null default now(),
  check ((trilha_id is not null)::integer + (atividade_id is not null)::integer = 1)
);

create table if not exists public.anotacoes_aula (
  aluno_id uuid not null references public.perfis(id) on delete cascade,
  atividade_id uuid not null references public.atividades(id) on delete cascade,
  texto text not null default '' check (char_length(texto) <= 10000),
  updated_at timestamptz not null default now(),
  primary key (aluno_id, atividade_id)
);

create table if not exists public.historico_estudos (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.perfis(id) on delete cascade,
  trilha_id uuid references public.trilhas(id) on delete set null,
  atividade_id uuid references public.atividades(id) on delete set null,
  evento text not null check (evento in ('iniciou_trilha','abriu_aula','concluiu_aula','iniciou_atividade','respondeu','concluiu_atividade','salvou','removeu_salvo','anotou')),
  detalhes jsonb not null default '{}'::jsonb check (jsonb_typeof(detalhes) = 'object'),
  duracao_segundos integer check (duracao_segundos is null or duracao_segundos >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.xp_movimentos (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.perfis(id) on delete cascade,
  origem_tipo text not null check (origem_tipo in ('atividade','trilha','conquista','ajuste')),
  origem_id uuid not null,
  xp integer not null check (xp >= 0),
  descricao text not null,
  created_at timestamptz not null default now(),
  unique (aluno_id, origem_tipo, origem_id)
);

create index if not exists trilhas_catalogo_idx on public.trilhas (publicada, materia, serie, trimestre);
create index if not exists trilhas_area_idx on public.trilhas (area_conhecimento) where publicada = true;
create index if not exists atividades_trilha_status_ordem_idx on public.atividades (trilha_id, status, ordem);
create index if not exists atividades_prerequisito_idx on public.atividades (prerequisito_atividade_id) where prerequisito_atividade_id is not null;
create index if not exists trilhas_prerequisitos_requisito_idx on public.trilhas_prerequisitos (prerequisito_trilha_id);
create index if not exists materiais_aula_atividade_idx on public.materiais_aula (atividade_id, ordem);
create index if not exists questoes_atividade_idx on public.questoes_atividades (atividade_id, ordem);
create index if not exists tentativas_aluno_atividade_idx on public.tentativas_atividades (aluno_id, atividade_id, created_at desc);
create index if not exists respostas_aluno_tentativa_idx on public.respostas_questoes (aluno_id, tentativa_id);
create unique index if not exists conteudos_salvos_trilha_unique on public.conteudos_salvos (aluno_id, trilha_id) where trilha_id is not null;
create unique index if not exists conteudos_salvos_atividade_unique on public.conteudos_salvos (aluno_id, atividade_id) where atividade_id is not null;
create index if not exists historico_aluno_data_idx on public.historico_estudos (aluno_id, created_at desc);
create index if not exists historico_trilha_idx on public.historico_estudos (trilha_id, created_at desc) where trilha_id is not null;
create index if not exists xp_movimentos_aluno_data_idx on public.xp_movimentos (aluno_id, created_at desc);

alter table public.trilhas_prerequisitos enable row level security;
alter table public.materiais_aula enable row level security;
alter table public.questoes_atividades enable row level security;
alter table public.tentativas_atividades enable row level security;
alter table public.respostas_questoes enable row level security;
alter table public.conteudos_salvos enable row level security;
alter table public.anotacoes_aula enable row level security;
alter table public.historico_estudos enable row level security;
alter table public.xp_movimentos enable row level security;

drop policy if exists trilhas_select on public.trilhas;
create policy trilhas_select on public.trilhas for select to authenticated using (
  (select public.usuario_role()) = 'gestor'
  or professor_id = (select auth.uid())
  or (
    (select public.usuario_role()) = 'professor'
    and turma_id in (select pt.turma_id from public.professor_turmas pt where pt.professor_id = (select auth.uid()))
  )
  or (
    publicada = true
    and (turma_id is null or turma_id = (select p.turma_id from public.perfis p where p.id = (select auth.uid())))
  )
);

drop policy if exists atividades_select on public.atividades;
create policy atividades_select on public.atividades for select to authenticated using (
  exists (select 1 from public.trilhas t where t.id = trilha_id)
);

revoke all on public.trilhas_prerequisitos, public.materiais_aula, public.questoes_atividades,
  public.tentativas_atividades, public.respostas_questoes, public.conteudos_salvos,
  public.anotacoes_aula, public.historico_estudos, public.xp_movimentos from anon;
grant select on public.trilhas_prerequisitos, public.materiais_aula, public.questoes_atividades,
  public.tentativas_atividades, public.respostas_questoes, public.conteudos_salvos,
  public.anotacoes_aula, public.historico_estudos, public.xp_movimentos to authenticated;
grant insert on public.tentativas_atividades, public.respostas_questoes, public.conteudos_salvos,
  public.anotacoes_aula, public.historico_estudos to authenticated;
grant update on public.respostas_questoes, public.conteudos_salvos, public.anotacoes_aula to authenticated;
grant delete on public.conteudos_salvos to authenticated;
grant insert, update, delete on public.trilhas_prerequisitos, public.materiais_aula, public.questoes_atividades to authenticated;

drop policy if exists trilhas_prerequisitos_select on public.trilhas_prerequisitos;
create policy trilhas_prerequisitos_select on public.trilhas_prerequisitos for select to authenticated using (
  exists (select 1 from public.trilhas t where t.id = trilha_id)
);
drop policy if exists trilhas_prerequisitos_manage on public.trilhas_prerequisitos;
create policy trilhas_prerequisitos_manage on public.trilhas_prerequisitos for all to authenticated
using ((select public.usuario_role()) = 'gestor' or exists (select 1 from public.trilhas t where t.id = trilha_id and t.professor_id = (select auth.uid())))
with check ((select public.usuario_role()) = 'gestor' or exists (select 1 from public.trilhas t where t.id = trilha_id and t.professor_id = (select auth.uid())));

drop policy if exists materiais_aula_select on public.materiais_aula;
create policy materiais_aula_select on public.materiais_aula for select to authenticated using (
  exists (select 1 from public.atividades a where a.id = atividade_id)
);
drop policy if exists materiais_aula_manage on public.materiais_aula;
create policy materiais_aula_manage on public.materiais_aula for all to authenticated
using ((select public.usuario_role()) = 'gestor' or exists (select 1 from public.atividades a join public.trilhas t on t.id = a.trilha_id where a.id = atividade_id and t.professor_id = (select auth.uid())))
with check ((select public.usuario_role()) = 'gestor' or exists (select 1 from public.atividades a join public.trilhas t on t.id = a.trilha_id where a.id = atividade_id and t.professor_id = (select auth.uid())));

drop policy if exists questoes_atividades_select on public.questoes_atividades;
create policy questoes_atividades_select on public.questoes_atividades for select to authenticated using (
  exists (select 1 from public.atividades a where a.id = atividade_id)
);
drop policy if exists questoes_atividades_manage on public.questoes_atividades;
create policy questoes_atividades_manage on public.questoes_atividades for all to authenticated
using ((select public.usuario_role()) = 'gestor' or exists (select 1 from public.atividades a join public.trilhas t on t.id = a.trilha_id where a.id = atividade_id and t.professor_id = (select auth.uid())))
with check ((select public.usuario_role()) = 'gestor' or exists (select 1 from public.atividades a join public.trilhas t on t.id = a.trilha_id where a.id = atividade_id and t.professor_id = (select auth.uid())));

drop policy if exists tentativas_atividades_select on public.tentativas_atividades;
create policy tentativas_atividades_select on public.tentativas_atividades for select to authenticated using (
  aluno_id = (select auth.uid()) or (select public.usuario_role()) = 'gestor'
  or ((select public.usuario_role()) = 'professor' and exists (
    select 1 from public.perfis p join public.professor_turmas pt on pt.turma_id = p.turma_id
    where p.id = aluno_id and pt.professor_id = (select auth.uid())
  ))
);
drop policy if exists tentativas_atividades_insert on public.tentativas_atividades;
create policy tentativas_atividades_insert on public.tentativas_atividades for insert to authenticated with check (
  aluno_id = (select auth.uid()) and status = 'em_andamento'
  and exists (select 1 from public.atividades a join public.trilhas t on t.id = a.trilha_id where a.id = atividade_id and a.status = 'publicada' and t.publicada = true)
);

drop policy if exists respostas_questoes_select on public.respostas_questoes;
create policy respostas_questoes_select on public.respostas_questoes for select to authenticated using (
  aluno_id = (select auth.uid()) or (select public.usuario_role()) = 'gestor'
  or ((select public.usuario_role()) = 'professor' and exists (
    select 1 from public.perfis p join public.professor_turmas pt on pt.turma_id = p.turma_id
    where p.id = aluno_id and pt.professor_id = (select auth.uid())
  ))
);
drop policy if exists respostas_questoes_insert on public.respostas_questoes;
create policy respostas_questoes_insert on public.respostas_questoes for insert to authenticated with check (
  aluno_id = (select auth.uid()) and exists (
    select 1 from public.tentativas_atividades ta join public.questoes_atividades q on q.atividade_id = ta.atividade_id
    where ta.id = tentativa_id and ta.aluno_id = (select auth.uid()) and ta.status = 'em_andamento' and q.id = questao_id
  )
);
drop policy if exists respostas_questoes_update on public.respostas_questoes;
create policy respostas_questoes_update on public.respostas_questoes for update to authenticated
using (aluno_id = (select auth.uid())) with check (
  aluno_id = (select auth.uid()) and exists (select 1 from public.tentativas_atividades ta where ta.id = tentativa_id and ta.aluno_id = (select auth.uid()) and ta.status = 'em_andamento')
);

drop policy if exists conteudos_salvos_own on public.conteudos_salvos;
create policy conteudos_salvos_own on public.conteudos_salvos for all to authenticated
using (aluno_id = (select auth.uid())) with check (aluno_id = (select auth.uid()));
drop policy if exists anotacoes_aula_own on public.anotacoes_aula;
create policy anotacoes_aula_own on public.anotacoes_aula for all to authenticated
using (aluno_id = (select auth.uid())) with check (aluno_id = (select auth.uid()));

drop policy if exists historico_estudos_select on public.historico_estudos;
create policy historico_estudos_select on public.historico_estudos for select to authenticated using (
  aluno_id = (select auth.uid()) or (select public.usuario_role()) = 'gestor'
  or ((select public.usuario_role()) = 'professor' and exists (
    select 1 from public.perfis p join public.professor_turmas pt on pt.turma_id = p.turma_id
    where p.id = aluno_id and pt.professor_id = (select auth.uid())
  ))
);
drop policy if exists historico_estudos_insert on public.historico_estudos;
create policy historico_estudos_insert on public.historico_estudos for insert to authenticated with check (aluno_id = (select auth.uid()));

drop policy if exists xp_movimentos_select on public.xp_movimentos;
create policy xp_movimentos_select on public.xp_movimentos for select to authenticated using (
  aluno_id = (select auth.uid()) or (select public.usuario_role()) = 'gestor'
  or ((select public.usuario_role()) = 'professor' and exists (
    select 1 from public.perfis p join public.professor_turmas pt on pt.turma_id = p.turma_id
    where p.id = aluno_id and pt.professor_id = (select auth.uid())
  ))
);

create or replace function private.avaliar_resposta_questao()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_gabarito jsonb; v_explicacao text; v_pontos numeric(7,2);
begin
  if new.aluno_id <> (select auth.uid()) then raise exception 'Resposta inválida para o usuário atual'; end if;
  select g.resposta_correta, g.explicacao, q.pontos into v_gabarito, v_explicacao, v_pontos
  from private.gabaritos_questoes g join public.questoes_atividades q on q.id = g.questao_id
  where g.questao_id = new.questao_id;
  if v_gabarito is null then raise exception 'Gabarito não configurado'; end if;
  new.correta := new.resposta = v_gabarito;
  new.pontos_obtidos := case when new.correta then v_pontos else 0 end;
  new.explicacao_snapshot := v_explicacao;
  new.updated_at := now();
  return new;
end $$;

create or replace function private.recalcular_tentativa_atividade()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_total integer; v_respondidas integer; v_acertos integer; v_obtida numeric(8,2); v_maxima numeric(8,2); v_atividade uuid; v_trilha uuid; v_xp integer; v_ja_concluida boolean;
begin
  select ta.atividade_id, ta.status = 'concluida' into v_atividade, v_ja_concluida from public.tentativas_atividades ta where ta.id = new.tentativa_id;
  select count(*), coalesce(sum(q.pontos),0) into v_total, v_maxima from public.questoes_atividades q where q.atividade_id = v_atividade;
  select count(*), count(*) filter (where r.correta), coalesce(sum(r.pontos_obtidos),0) into v_respondidas, v_acertos, v_obtida from public.respostas_questoes r where r.tentativa_id = new.tentativa_id;
  update public.tentativas_atividades set acertos = v_acertos, pontuacao_obtida = v_obtida, pontuacao_maxima = v_maxima,
    status = case when v_total > 0 and v_respondidas >= v_total then 'concluida' else 'em_andamento' end,
    concluida_em = case when v_total > 0 and v_respondidas >= v_total then coalesce(concluida_em,now()) else null end
  where id = new.tentativa_id;
  if v_total > 0 and v_respondidas >= v_total and not v_ja_concluida then
    select a.trilha_id, a.recompensa_xp into v_trilha, v_xp from public.atividades a where a.id = v_atividade;
    insert into public.progresso_atividades (atividade_id, aluno_id, concluida, nota, concluida_em)
    values (v_atividade, new.aluno_id, true, case when v_maxima > 0 then round((v_obtida / v_maxima) * 10,2) else 0 end, now())
    on conflict (atividade_id, aluno_id) do update set concluida = true, nota = excluded.nota, concluida_em = excluded.concluida_em, updated_at = now();
    insert into public.xp_movimentos (aluno_id, origem_tipo, origem_id, xp, descricao)
    values (new.aluno_id, 'atividade', v_atividade, coalesce(v_xp,0), 'Atividade concluída') on conflict do nothing;
    insert into public.historico_estudos (aluno_id, trilha_id, atividade_id, evento, detalhes)
    values (new.aluno_id, v_trilha, v_atividade, 'concluiu_atividade', jsonb_build_object('pontuacao_obtida',v_obtida,'pontuacao_maxima',v_maxima,'acertos',v_acertos));
  end if;
  return new;
end $$;

create or replace function private.registrar_conclusao_aula()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_trilha uuid; v_xp integer; v_tipo text;
begin
  if new.concluida and tg_op = 'INSERT' then
    select a.trilha_id, a.recompensa_xp, a.tipo_conteudo into v_trilha, v_xp, v_tipo from public.atividades a where a.id = new.atividade_id;
    if v_tipo = 'aula' then
      insert into public.xp_movimentos (aluno_id, origem_tipo, origem_id, xp, descricao)
      values (new.aluno_id, 'atividade', new.atividade_id, coalesce(v_xp,0), 'Aula concluída') on conflict do nothing;
      insert into public.historico_estudos (aluno_id, trilha_id, atividade_id, evento)
      values (new.aluno_id, v_trilha, new.atividade_id, 'concluiu_aula');
    end if;
  elsif new.concluida and not old.concluida then
    select a.trilha_id, a.recompensa_xp, a.tipo_conteudo into v_trilha, v_xp, v_tipo from public.atividades a where a.id = new.atividade_id;
    if v_tipo = 'aula' then
      insert into public.xp_movimentos (aluno_id, origem_tipo, origem_id, xp, descricao)
      values (new.aluno_id, 'atividade', new.atividade_id, coalesce(v_xp,0), 'Aula concluída') on conflict do nothing;
      insert into public.historico_estudos (aluno_id, trilha_id, atividade_id, evento)
      values (new.aluno_id, v_trilha, new.atividade_id, 'concluiu_aula');
    end if;
  end if;
  return new;
end $$;

revoke all on function private.avaliar_resposta_questao() from public, anon, authenticated;
revoke all on function private.recalcular_tentativa_atividade() from public, anon, authenticated;
revoke all on function private.registrar_conclusao_aula() from public, anon, authenticated;

drop trigger if exists trg_avaliar_resposta_questao on public.respostas_questoes;
create trigger trg_avaliar_resposta_questao before insert or update of resposta on public.respostas_questoes for each row execute function private.avaliar_resposta_questao();
drop trigger if exists trg_recalcular_tentativa_atividade on public.respostas_questoes;
create trigger trg_recalcular_tentativa_atividade after insert or update of resposta on public.respostas_questoes for each row execute function private.recalcular_tentativa_atividade();
drop trigger if exists trg_registrar_conclusao_aula on public.progresso_atividades;
create trigger trg_registrar_conclusao_aula after insert or update of concluida on public.progresso_atividades for each row execute function private.registrar_conclusao_aula();

commit;
