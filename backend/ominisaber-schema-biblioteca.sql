-- OminiSaber | Biblioteca digital e leituras do aluno
-- Execute depois de backend/ominisaber-schema.sql.

begin;

create table if not exists public.livros (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  autor text not null,
  genero varchar(80) not null default 'Didático',
  categoria text not null default 'Didáticos',
  capa_url text,
  pdf_url text,
  sinopse text,
  paginas integer check (paginas is null or paginas > 0),
  palavras_chave text,
  quantidade_total integer not null default 0 check (quantidade_total >= 0),
  quantidade_disponivel integer not null default 0 check (quantidade_disponivel >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'livros' and column_name = 'materia'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'livros' and column_name = 'genero'
  ) then
    alter table public.livros rename column materia to genero;
  end if;
end $$;

alter table public.livros add column if not exists genero varchar(80) default 'Didático';
update public.livros set genero = 'Didático' where genero is null or trim(genero) = '';
alter table public.livros alter column genero set not null;
alter table public.livros alter column genero set default 'Didático';
alter table public.livros add column if not exists categoria text default 'Didáticos';
update public.livros set categoria = 'Didáticos' where categoria is null or btrim(categoria) = '';
alter table public.livros alter column categoria set not null;
alter table public.livros add column if not exists capa_url text;
alter table public.livros add column if not exists pdf_url text;
alter table public.livros add column if not exists sinopse text;
alter table public.livros add column if not exists paginas integer;
alter table public.livros add column if not exists palavras_chave text;
alter table public.livros add column if not exists isbn text;

create table if not exists public.secoes_biblioteca (
  id uuid primary key default gen_random_uuid(),
  nome varchar(100) not null unique,
  materia_associada varchar(80),
  capacidade_maxima integer not null check (capacidade_maxima > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exemplares (
  id uuid primary key default gen_random_uuid(),
  livro_id uuid not null references public.livros(id) on delete cascade,
  numero_serie varchar(40) not null unique,
  isbn_individual varchar(20),
  secao_id uuid references public.secoes_biblioteca(id) on delete set null,
  status text not null default 'disponivel'
    check (status in ('disponivel', 'emprestado', 'manutencao')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_exemplares_livro on public.exemplares (livro_id);
create index if not exists idx_exemplares_secao on public.exemplares (secao_id);
create index if not exists idx_exemplares_status on public.exemplares (status);

alter table public.secoes_biblioteca enable row level security;
alter table public.exemplares enable row level security;

grant select on table public.secoes_biblioteca, public.exemplares to authenticated;
grant insert, update, delete on table public.secoes_biblioteca, public.exemplares to authenticated;

drop policy if exists secoes_biblioteca_staff_select on public.secoes_biblioteca;
create policy secoes_biblioteca_staff_select
  on public.secoes_biblioteca for select to authenticated
  using (public.usuario_role() in ('bibliotecaria', 'gestor'));

drop policy if exists secoes_biblioteca_staff_write on public.secoes_biblioteca;
create policy secoes_biblioteca_staff_write
  on public.secoes_biblioteca for all to authenticated
  using (public.usuario_role() in ('bibliotecaria', 'gestor'))
  with check (public.usuario_role() in ('bibliotecaria', 'gestor'));

drop policy if exists exemplares_staff_select on public.exemplares;
create policy exemplares_staff_select
  on public.exemplares for select to authenticated
  using (public.usuario_role() in ('bibliotecaria', 'gestor'));

drop policy if exists exemplares_staff_write on public.exemplares;
create policy exemplares_staff_write
  on public.exemplares for all to authenticated
  using (public.usuario_role() in ('bibliotecaria', 'gestor'))
  with check (public.usuario_role() in ('bibliotecaria', 'gestor'));

create table if not exists public.leituras_aluno (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.perfis(id) on delete cascade,
  livro_id uuid not null references public.livros(id) on delete cascade,
  status text not null default 'lendo' check (status in ('lendo', 'concluido')),
  progresso_pct integer not null default 0 check (progresso_pct between 0 and 100),
  atualizado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (aluno_id, livro_id)
);

create index if not exists idx_livros_genero on public.livros (genero);
create index if not exists idx_livros_categoria on public.livros (categoria);
create index if not exists idx_leituras_aluno on public.leituras_aluno (aluno_id, atualizado_em desc);
create index if not exists idx_leituras_livro on public.leituras_aluno (livro_id);

alter table public.livros enable row level security;
alter table public.leituras_aluno enable row level security;

grant select on table public.livros to anon, authenticated;
grant select, insert, update on table public.leituras_aluno to authenticated;

drop policy if exists livros_public_select on public.livros;
create policy livros_public_select
  on public.livros
  for select
  to anon, authenticated
  using (true);

drop policy if exists leituras_aluno_own_select on public.leituras_aluno;
create policy leituras_aluno_own_select
  on public.leituras_aluno
  for select
  to authenticated
  using (auth.uid() = aluno_id);

drop policy if exists leituras_aluno_own_insert on public.leituras_aluno;
create policy leituras_aluno_own_insert
  on public.leituras_aluno
  for insert
  to authenticated
  with check (auth.uid() = aluno_id);

drop policy if exists leituras_aluno_own_update on public.leituras_aluno;
create policy leituras_aluno_own_update
  on public.leituras_aluno
  for update
  to authenticated
  using (auth.uid() = aluno_id)
  with check (auth.uid() = aluno_id);

revoke insert, update, delete on table public.livros from anon, authenticated;

-- ============================================================
-- Operacao da biblioteca: solicitacoes, regras e transacoes
-- ============================================================
create table if not exists public.configuracoes_biblioteca (
  id boolean primary key default true check (id),
  prazo_dias integer not null default 15 check (prazo_dias in (15, 30)),
  limite_livros integer not null default 1 check (limite_livros between 1 and 10),
  updated_at timestamptz not null default now()
);

insert into public.configuracoes_biblioteca (id) values (true) on conflict (id) do nothing;

create table if not exists public.solicitacoes_emprestimo (
  id uuid primary key default gen_random_uuid(),
  livro_id uuid not null references public.livros(id) on delete restrict,
  exemplar_id uuid references public.exemplares(id) on delete set null,
  aluno_id uuid not null references public.perfis(id) on delete restrict,
  status text not null default 'pendente' check (status in ('pendente', 'aprovado', 'emprestado', 'devolvido', 'recusado')),
  solicitado_em timestamptz not null default now(),
  aprovado_em timestamptz,
  retirada_em timestamptz,
  devolucao_prevista_em timestamptz,
  devolvido_em timestamptz,
  aprovado_por uuid references public.perfis(id) on delete set null,
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (devolvido_em is null or devolvido_em >= retirada_em)
);

alter table public.solicitacoes_emprestimo
  add column if not exists exemplar_id uuid references public.exemplares(id) on delete set null;

create index if not exists idx_solicitacoes_status on public.solicitacoes_emprestimo(status);
create index if not exists idx_solicitacoes_aluno on public.solicitacoes_emprestimo(aluno_id);
create index if not exists idx_solicitacoes_livro on public.solicitacoes_emprestimo(livro_id);
create index if not exists idx_solicitacoes_exemplar on public.solicitacoes_emprestimo(exemplar_id);
create index if not exists idx_solicitacoes_aprovado_por on public.solicitacoes_emprestimo(aprovado_por) where aprovado_por is not null;

drop trigger if exists solicitacoes_updated_at on public.solicitacoes_emprestimo;
create trigger solicitacoes_updated_at before update on public.solicitacoes_emprestimo
for each row execute function public.set_updated_at();
drop trigger if exists configuracoes_biblioteca_updated_at on public.configuracoes_biblioteca;
create trigger configuracoes_biblioteca_updated_at before update on public.configuracoes_biblioteca
for each row execute function public.set_updated_at();
drop function if exists public.atualizar_biblioteca_updated_at();

create or replace function public.biblioteca_pode_solicitar(p_aluno_id uuid)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare limite integer; quantidade integer;
begin
  if p_aluno_id <> (select auth.uid()) and public.usuario_role() not in ('bibliotecaria', 'gestor') then
    return false;
  end if;
  select limite_livros into limite from public.configuracoes_biblioteca where id = true;
  select count(*) into quantidade from public.solicitacoes_emprestimo
  where aluno_id = p_aluno_id and status in ('pendente', 'aprovado', 'emprestado');
  return quantidade < coalesce(limite, 1) and not exists (
    select 1 from public.solicitacoes_emprestimo
    where aluno_id = p_aluno_id and status = 'emprestado' and devolucao_prevista_em < now()
  );
end; $$;

create or replace function public.biblioteca_aprovar_solicitacao(p_solicitacao_id uuid, p_aprovado_por uuid)
returns public.solicitacoes_emprestimo language plpgsql security definer set search_path = '' as $$
declare resultado public.solicitacoes_emprestimo;
begin
  if public.usuario_role() not in ('bibliotecaria', 'gestor') then raise exception 'Sem permissao'; end if;
  if p_aprovado_por is distinct from (select auth.uid()) then raise exception 'Responsável inválido'; end if;
  update public.solicitacoes_emprestimo set status = 'aprovado', aprovado_em = now(), aprovado_por = (select auth.uid())
  where id = p_solicitacao_id and status = 'pendente' returning * into resultado;
  if resultado.id is null then raise exception 'Solicitacao indisponivel'; end if;
  return resultado;
end; $$;

create or replace function public.biblioteca_confirmar_entrega(p_solicitacao_id uuid)
returns public.solicitacoes_emprestimo language plpgsql security definer set search_path = '' as $$
declare resultado public.solicitacoes_emprestimo; prazo integer; exemplar uuid;
begin
  if public.usuario_role() not in ('bibliotecaria', 'gestor') then raise exception 'Sem permissao'; end if;
  select prazo_dias into prazo from public.configuracoes_biblioteca where id = true;
  select id into exemplar from public.exemplares
  where livro_id = (select livro_id from public.solicitacoes_emprestimo where id = p_solicitacao_id)
    and status = 'disponivel'
  order by numero_serie
  for update skip locked limit 1;
  if exemplar is null then raise exception 'Livro sem exemplar disponivel'; end if;
  update public.solicitacoes_emprestimo set status = 'emprestado', exemplar_id = exemplar, retirada_em = now(),
    observacao = concat(
      'Retirar na ', coalesce((select s.nome from public.secoes_biblioteca s
        join public.exemplares e on e.secao_id = s.id where e.id = exemplar), 'seção não definida'),
      ' | Exemplar N° ', (select e.numero_serie from public.exemplares e where e.id = exemplar),
      ' | ISBN: ', coalesce((select e.isbn_individual from public.exemplares e where e.id = exemplar), 'não informado')
    ),
    devolucao_prevista_em = now() + make_interval(days => coalesce(prazo, 15))
  where id = p_solicitacao_id and status = 'aprovado' returning * into resultado;
  if resultado.id is null then raise exception 'Solicitacao nao esta aguardando retirada'; end if;
  update public.exemplares set status = 'emprestado' where id = exemplar;
  update public.livros set quantidade_disponivel = quantidade_disponivel - 1
  where id = resultado.livro_id and quantidade_disponivel > 0;
  if not found then raise exception 'Livro sem exemplar disponivel'; end if;
  return resultado;
end; $$;

create or replace function public.biblioteca_registrar_devolucao(p_solicitacao_id uuid)
returns public.solicitacoes_emprestimo language plpgsql security definer set search_path = '' as $$
declare resultado public.solicitacoes_emprestimo;
begin
  if public.usuario_role() not in ('bibliotecaria', 'gestor') then raise exception 'Sem permissao'; end if;
  update public.solicitacoes_emprestimo set status = 'devolvido', devolvido_em = now()
  where id = p_solicitacao_id and status = 'emprestado' returning * into resultado;
  if resultado.id is null then raise exception 'Emprestimo nao esta ativo'; end if;
  if resultado.exemplar_id is not null then
    update public.exemplares set status = 'disponivel' where id = resultado.exemplar_id;
  end if;
  update public.livros set quantidade_disponivel = least(quantidade_total, quantidade_disponivel + 1)
  where id = resultado.livro_id;
  return resultado;
end; $$;

alter table public.solicitacoes_emprestimo enable row level security;
alter table public.configuracoes_biblioteca enable row level security;
grant select, insert, update, delete on table public.livros to authenticated;
grant select, insert on table public.solicitacoes_emprestimo to authenticated;
grant select, update on table public.configuracoes_biblioteca to authenticated;
revoke all on function public.biblioteca_pode_solicitar(uuid) from public, anon, authenticated;
revoke all on function public.biblioteca_aprovar_solicitacao(uuid, uuid) from public, anon, authenticated;
revoke all on function public.biblioteca_confirmar_entrega(uuid) from public, anon, authenticated;
revoke all on function public.biblioteca_registrar_devolucao(uuid) from public, anon, authenticated;
grant execute on function public.biblioteca_pode_solicitar(uuid) to authenticated;
grant execute on function public.biblioteca_aprovar_solicitacao(uuid, uuid) to authenticated;
grant execute on function public.biblioteca_confirmar_entrega(uuid) to authenticated;
grant execute on function public.biblioteca_registrar_devolucao(uuid) to authenticated;

drop policy if exists solicitacoes_select on public.solicitacoes_emprestimo;
create policy solicitacoes_select on public.solicitacoes_emprestimo for select to authenticated
using (aluno_id = auth.uid() or public.usuario_role() in ('bibliotecaria', 'gestor'));
drop policy if exists solicitacoes_insert on public.solicitacoes_emprestimo;
create policy solicitacoes_insert on public.solicitacoes_emprestimo for insert to authenticated
with check (
  aluno_id = (select auth.uid()) and public.usuario_role() = 'aluno'
  and status = 'pendente' and exemplar_id is null and aprovado_por is null
  and aprovado_em is null and retirada_em is null and devolucao_prevista_em is null and devolvido_em is null
  and public.biblioteca_pode_solicitar((select auth.uid()))
);
drop policy if exists configuracoes_biblioteca_select on public.configuracoes_biblioteca;
create policy configuracoes_biblioteca_select on public.configuracoes_biblioteca for select to authenticated using (true);
drop policy if exists configuracoes_biblioteca_update on public.configuracoes_biblioteca;
create policy configuracoes_biblioteca_update on public.configuracoes_biblioteca for update to authenticated
using (public.usuario_role() in ('bibliotecaria', 'gestor')) with check (public.usuario_role() in ('bibliotecaria', 'gestor'));

drop trigger if exists set_secoes_biblioteca_updated_at on public.secoes_biblioteca;
create trigger set_secoes_biblioteca_updated_at before update on public.secoes_biblioteca
for each row execute function public.set_updated_at();
drop trigger if exists set_exemplares_updated_at on public.exemplares;
create trigger set_exemplares_updated_at before update on public.exemplares
for each row execute function public.set_updated_at();

commit;
