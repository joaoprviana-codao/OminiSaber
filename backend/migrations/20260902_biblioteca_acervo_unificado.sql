-- OminiSaber | Acervo físico, PDFs verificados e reserva transacional
-- Pode ser aplicado sobre uma instalação existente sem apagar dados.

begin;

alter table public.exemplares drop constraint if exists exemplares_status_check;
alter table public.exemplares
  add constraint exemplares_status_check
  check (status in ('disponivel', 'reservado', 'emprestado', 'manutencao'));

create table if not exists public.materiais_biblioteca (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  autor text,
  descricao text,
  categoria text not null default 'Material de apoio',
  materia text,
  paginas integer check (paginas is null or paginas > 0),
  capa_url text,
  palavras_chave text,
  storage_bucket text not null default 'biblioteca-pdfs',
  storage_path text not null unique,
  nome_arquivo text not null,
  mime_type text not null default 'application/pdf' check (mime_type = 'application/pdf'),
  tamanho_bytes bigint check (tamanho_bytes is null or tamanho_bytes > 0),
  verificado boolean not null default false,
  verificado_por uuid references public.perfis(id) on delete set null,
  verificado_em timestamptz,
  publicado boolean not null default false,
  criado_por uuid references public.perfis(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not verificado or verificado_em is not null),
  check (not publicado or verificado)
);

alter table public.materiais_biblioteca add column if not exists autor text;
alter table public.materiais_biblioteca add column if not exists descricao text;
alter table public.materiais_biblioteca add column if not exists categoria text default 'Material de apoio';
alter table public.materiais_biblioteca add column if not exists materia text;
alter table public.materiais_biblioteca add column if not exists paginas integer;
alter table public.materiais_biblioteca add column if not exists capa_url text;
alter table public.materiais_biblioteca add column if not exists palavras_chave text;
alter table public.materiais_biblioteca add column if not exists storage_bucket text default 'biblioteca-pdfs';
alter table public.materiais_biblioteca add column if not exists storage_path text;
alter table public.materiais_biblioteca add column if not exists nome_arquivo text;
alter table public.materiais_biblioteca add column if not exists mime_type text default 'application/pdf';
alter table public.materiais_biblioteca add column if not exists tamanho_bytes bigint;
alter table public.materiais_biblioteca add column if not exists verificado boolean default false;
alter table public.materiais_biblioteca add column if not exists verificado_por uuid references public.perfis(id) on delete set null;
alter table public.materiais_biblioteca add column if not exists verificado_em timestamptz;
alter table public.materiais_biblioteca add column if not exists publicado boolean default false;
alter table public.materiais_biblioteca add column if not exists criado_por uuid references public.perfis(id) on delete set null default auth.uid();
alter table public.materiais_biblioteca add column if not exists created_at timestamptz default now();
alter table public.materiais_biblioteca add column if not exists updated_at timestamptz default now();

create index if not exists idx_materiais_biblioteca_publicados
  on public.materiais_biblioteca (materia, categoria, titulo)
  where publicado and verificado;
create unique index if not exists idx_materiais_biblioteca_storage_path
  on public.materiais_biblioteca (storage_path)
  where storage_path is not null;

create unique index if not exists idx_solicitacao_ativa_aluno_livro
  on public.solicitacoes_emprestimo (aluno_id, livro_id)
  where status in ('pendente', 'aprovado', 'emprestado');

alter table public.notificacoes
  add column if not exists destino_usuario_id uuid references public.perfis(id) on delete cascade;
create index if not exists notificacoes_usuario_created_idx
  on public.notificacoes (destino_usuario_id, created_at desc)
  where destino_usuario_id is not null;

drop policy if exists notificacoes_select on public.notificacoes;
create policy notificacoes_select on public.notificacoes for select to authenticated using (
  (expira_em is null or expira_em > now()) and (
    (select public.usuario_role()) = 'gestor'
    or criado_por = (select auth.uid())
    or destino_usuario_id = (select auth.uid())
    or (destino_usuario_id is null and destino_turma_id is null)
    or (destino_usuario_id is null and destino_turma_id in (select pt.turma_id from public.professor_turmas pt where pt.professor_id = (select auth.uid())))
    or (destino_usuario_id is null and destino_turma_id = (select p.turma_id from public.perfis p where p.id = (select auth.uid())))
  )
);

drop policy if exists notificacoes_insert on public.notificacoes;
create policy notificacoes_insert on public.notificacoes for insert to authenticated with check (
  criado_por = (select auth.uid()) and (
    (select public.usuario_role()) = 'gestor'
    or ((select public.usuario_role()) = 'bibliotecaria' and destino_usuario_id is not null and tipo = 'biblioteca')
    or ((select public.usuario_role()) = 'professor' and destino_usuario_id is null and destino_turma_id in (select pt.turma_id from public.professor_turmas pt where pt.professor_id = (select auth.uid())))
  )
);

drop trigger if exists set_materiais_biblioteca_updated_at on public.materiais_biblioteca;
create trigger set_materiais_biblioteca_updated_at
before update on public.materiais_biblioteca
for each row execute function public.set_updated_at();

alter table public.materiais_biblioteca enable row level security;
grant select, insert, update, delete on table public.materiais_biblioteca to authenticated;

drop policy if exists materiais_biblioteca_select on public.materiais_biblioteca;
create policy materiais_biblioteca_select
  on public.materiais_biblioteca for select to authenticated
  using (
    (publicado and verificado)
    or public.usuario_role() in ('bibliotecaria', 'gestor')
  );

drop policy if exists materiais_biblioteca_staff_write on public.materiais_biblioteca;
create policy materiais_biblioteca_staff_write
  on public.materiais_biblioteca for all to authenticated
  using (public.usuario_role() in ('bibliotecaria', 'gestor'))
  with check (public.usuario_role() in ('bibliotecaria', 'gestor'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('biblioteca-pdfs', 'biblioteca-pdfs', false, 52428800, array['application/pdf'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists biblioteca_pdfs_read_verified on storage.objects;
create policy biblioteca_pdfs_read_verified
  on storage.objects for select to authenticated
  using (
    bucket_id = 'biblioteca-pdfs'
    and exists (
      select 1 from public.materiais_biblioteca material
      where material.storage_bucket = bucket_id
        and material.storage_path = name
        and material.publicado
        and material.verificado
    )
  );

drop policy if exists biblioteca_pdfs_staff_insert on storage.objects;
create policy biblioteca_pdfs_staff_insert
  on storage.objects for insert to authenticated
  with check (bucket_id = 'biblioteca-pdfs' and public.usuario_role() in ('bibliotecaria', 'gestor'));

drop policy if exists biblioteca_pdfs_staff_update on storage.objects;
create policy biblioteca_pdfs_staff_update
  on storage.objects for update to authenticated
  using (bucket_id = 'biblioteca-pdfs' and public.usuario_role() in ('bibliotecaria', 'gestor'))
  with check (bucket_id = 'biblioteca-pdfs' and public.usuario_role() in ('bibliotecaria', 'gestor'));

drop policy if exists biblioteca_pdfs_staff_delete on storage.objects;
create policy biblioteca_pdfs_staff_delete
  on storage.objects for delete to authenticated
  using (bucket_id = 'biblioteca-pdfs' and public.usuario_role() in ('bibliotecaria', 'gestor'));

create or replace function public.biblioteca_solicitar_livro(p_livro_id uuid)
returns public.solicitacoes_emprestimo
language plpgsql security definer set search_path = '' as $$
declare resultado public.solicitacoes_emprestimo; disponiveis integer; pendentes integer;
begin
  if public.usuario_role() <> 'aluno' then raise exception 'Apenas alunos podem solicitar livros'; end if;
  if not public.biblioteca_pode_solicitar((select auth.uid())) then
    raise exception 'Limite de empréstimos atingido ou existe devolução atrasada';
  end if;
  select quantidade_disponivel into disponiveis from public.livros where id = p_livro_id for update;
  if disponiveis is null then raise exception 'Livro não encontrado'; end if;
  select count(*) into pendentes from public.solicitacoes_emprestimo where livro_id = p_livro_id and status = 'pendente';
  if disponiveis <= pendentes or not exists (
    select 1 from public.exemplares where livro_id = p_livro_id and status = 'disponivel'
  ) then raise exception 'Nenhum exemplar disponível no momento'; end if;

  insert into public.solicitacoes_emprestimo (livro_id, aluno_id, status)
  values (p_livro_id, (select auth.uid()), 'pendente')
  returning * into resultado;
  return resultado;
exception when unique_violation then
  raise exception 'Você já possui uma solicitação ativa para este livro';
end; $$;

create or replace function public.biblioteca_separar_solicitacao(p_solicitacao_id uuid)
returns public.solicitacoes_emprestimo
language plpgsql security definer set search_path = '' as $$
declare
  pedido public.solicitacoes_emprestimo;
  exemplar public.exemplares;
  resultado public.solicitacoes_emprestimo;
  localizacao text;
  titulo_livro text;
begin
  if public.usuario_role() not in ('bibliotecaria', 'gestor') then raise exception 'Sem permissão'; end if;

  select * into pedido from public.solicitacoes_emprestimo
  where id = p_solicitacao_id and status = 'pendente'
  for update;
  if pedido.id is null then raise exception 'Solicitação não está pendente'; end if;

  select * into exemplar from public.exemplares
  where livro_id = pedido.livro_id and status = 'disponivel'
  order by numero_serie for update skip locked limit 1;
  if exemplar.id is null then raise exception 'Livro sem exemplar disponível'; end if;

  update public.exemplares set status = 'reservado' where id = exemplar.id;
  update public.livros
    set quantidade_disponivel = quantidade_disponivel - 1
    where id = pedido.livro_id and quantidade_disponivel > 0;
  if not found then raise exception 'Livro sem disponibilidade registrada'; end if;

  select coalesce(sf.nome, sb.nome), l.titulo into localizacao, titulo_livro
  from public.livros l
  left join public.secoes_fisicas sf on sf.id = exemplar.secao_fisica_id
  left join public.secoes_biblioteca sb on sb.id = exemplar.secao_id
  where l.id = pedido.livro_id;
  update public.solicitacoes_emprestimo set
    status = 'aprovado', exemplar_id = exemplar.id,
    aprovado_em = now(), aprovado_por = (select auth.uid()),
    observacao = concat('Separado em ', coalesce(localizacao, 'localização pendente'),
      ' · Exemplar ', exemplar.numero_serie)
  where id = pedido.id returning * into resultado;
  insert into public.notificacoes (titulo, mensagem, tipo, prioridade, destino_usuario_id, criado_por, link)
  values ('Livro pronto para retirada', concat('O exemplar de “', titulo_livro, '” foi separado em ', coalesce(localizacao, 'localização pendente'), '.'), 'biblioteca', 'alta', pedido.aluno_id, (select auth.uid()), 'frontend/aluno/biblioteca_digital/index.html');
  return resultado;
end; $$;

create or replace function public.biblioteca_aprovar_solicitacao(p_solicitacao_id uuid, p_aprovado_por uuid)
returns public.solicitacoes_emprestimo
language plpgsql security definer set search_path = '' as $$
begin
  if p_aprovado_por is distinct from (select auth.uid()) then raise exception 'Responsável inválido'; end if;
  return public.biblioteca_separar_solicitacao(p_solicitacao_id);
end; $$;

create or replace function public.biblioteca_confirmar_entrega(p_solicitacao_id uuid)
returns public.solicitacoes_emprestimo
language plpgsql security definer set search_path = '' as $$
declare resultado public.solicitacoes_emprestimo; prazo integer; pedido public.solicitacoes_emprestimo;
begin
  if public.usuario_role() not in ('bibliotecaria', 'gestor') then raise exception 'Sem permissão'; end if;
  select * into pedido from public.solicitacoes_emprestimo
    where id = p_solicitacao_id and status = 'aprovado' for update;
  if pedido.id is null or pedido.exemplar_id is null then raise exception 'Separe um exemplar antes da entrega'; end if;
  perform 1 from public.exemplares where id = pedido.exemplar_id and status = 'reservado' for update;
  if not found then raise exception 'O exemplar reservado não está disponível para entrega'; end if;
  select prazo_dias into prazo from public.configuracoes_biblioteca where id = true;
  update public.exemplares set status = 'emprestado' where id = pedido.exemplar_id;
  update public.solicitacoes_emprestimo set status = 'emprestado', retirada_em = now(),
    devolucao_prevista_em = now() + make_interval(days => coalesce(prazo, 15))
  where id = pedido.id returning * into resultado;
  insert into public.notificacoes (titulo, mensagem, tipo, prioridade, destino_usuario_id, criado_por, link)
  values ('Retirada confirmada', concat('Empréstimo confirmado. Devolva até ', to_char(resultado.devolucao_prevista_em at time zone 'America/Sao_Paulo', 'DD/MM/YYYY'), '.'), 'biblioteca', 'normal', pedido.aluno_id, (select auth.uid()), 'frontend/aluno/biblioteca_digital/index.html');
  return resultado;
end; $$;

create or replace function public.biblioteca_recusar_solicitacao(p_solicitacao_id uuid, p_motivo text default null)
returns public.solicitacoes_emprestimo
language plpgsql security definer set search_path = '' as $$
declare pedido public.solicitacoes_emprestimo; resultado public.solicitacoes_emprestimo;
begin
  if public.usuario_role() not in ('bibliotecaria', 'gestor') then raise exception 'Sem permissão'; end if;
  select * into pedido from public.solicitacoes_emprestimo
    where id = p_solicitacao_id and status in ('pendente', 'aprovado') for update;
  if pedido.id is null then raise exception 'Solicitação não pode ser recusada'; end if;
  if pedido.exemplar_id is not null then
    update public.exemplares set status = 'disponivel' where id = pedido.exemplar_id and status = 'reservado';
    if found then update public.livros set quantidade_disponivel = least(quantidade_total, quantidade_disponivel + 1) where id = pedido.livro_id; end if;
  end if;
  update public.solicitacoes_emprestimo set status = 'recusado', observacao = nullif(btrim(p_motivo), '')
    where id = pedido.id returning * into resultado;
  insert into public.notificacoes (titulo, mensagem, tipo, prioridade, destino_usuario_id, criado_por, link)
  values ('Atualização do pedido', coalesce(nullif(btrim(p_motivo), ''), 'A solicitação não pôde ser atendida.'), 'biblioteca', 'normal', pedido.aluno_id, (select auth.uid()), 'frontend/aluno/biblioteca_digital/index.html');
  return resultado;
end; $$;

create or replace function public.biblioteca_atualizar_status_exemplar(p_exemplar_id uuid, p_status text)
returns public.exemplares
language plpgsql security definer set search_path = '' as $$
declare exemplar public.exemplares; resultado public.exemplares;
begin
  if public.usuario_role() not in ('bibliotecaria', 'gestor') then raise exception 'Sem permissão'; end if;
  if p_status not in ('disponivel', 'manutencao') then raise exception 'Status manual inválido'; end if;
  select * into exemplar from public.exemplares where id = p_exemplar_id for update;
  if exemplar.id is null then raise exception 'Exemplar não encontrado'; end if;
  if exemplar.status in ('reservado', 'emprestado') then raise exception 'Finalize a circulação antes de alterar este exemplar'; end if;
  if exemplar.status is distinct from p_status then
    update public.livros set quantidade_disponivel = greatest(0, least(quantidade_total,
      quantidade_disponivel + case when p_status = 'disponivel' then 1 else -1 end))
    where id = exemplar.livro_id;
  end if;
  update public.exemplares set status = p_status where id = exemplar.id returning * into resultado;
  return resultado;
end; $$;

create or replace function public.biblioteca_registrar_devolucao(p_solicitacao_id uuid)
returns public.solicitacoes_emprestimo language plpgsql security definer set search_path = '' as $$
declare resultado public.solicitacoes_emprestimo; titulo_livro text;
begin
  if public.usuario_role() not in ('bibliotecaria', 'gestor') then raise exception 'Sem permissão'; end if;
  update public.solicitacoes_emprestimo set status = 'devolvido', devolvido_em = now()
  where id = p_solicitacao_id and status = 'emprestado' returning * into resultado;
  if resultado.id is null then raise exception 'Empréstimo não está ativo'; end if;
  if resultado.exemplar_id is not null then update public.exemplares set status = 'disponivel' where id = resultado.exemplar_id; end if;
  update public.livros set quantidade_disponivel = least(quantidade_total, quantidade_disponivel + 1)
  where id = resultado.livro_id returning titulo into titulo_livro;
  insert into public.notificacoes (titulo, mensagem, tipo, prioridade, destino_usuario_id, criado_por, link)
  values ('Devolução registrada', concat('A devolução de “', titulo_livro, '” foi concluída. Obrigado!'), 'biblioteca', 'baixa', resultado.aluno_id, (select auth.uid()), 'frontend/aluno/biblioteca_digital/index.html');
  return resultado;
end; $$;

revoke insert on table public.solicitacoes_emprestimo from authenticated;
revoke all on function public.biblioteca_solicitar_livro(uuid) from public, anon, authenticated;
revoke all on function public.biblioteca_separar_solicitacao(uuid) from public, anon, authenticated;
revoke all on function public.biblioteca_recusar_solicitacao(uuid, text) from public, anon, authenticated;
revoke all on function public.biblioteca_aprovar_solicitacao(uuid, uuid) from public, anon, authenticated;
revoke all on function public.biblioteca_confirmar_entrega(uuid) from public, anon, authenticated;
revoke all on function public.biblioteca_atualizar_status_exemplar(uuid, text) from public, anon, authenticated;
revoke all on function public.biblioteca_registrar_devolucao(uuid) from public, anon, authenticated;
grant execute on function public.biblioteca_solicitar_livro(uuid) to authenticated;
grant execute on function public.biblioteca_separar_solicitacao(uuid) to authenticated;
grant execute on function public.biblioteca_recusar_solicitacao(uuid, text) to authenticated;
grant execute on function public.biblioteca_aprovar_solicitacao(uuid, uuid) to authenticated;
grant execute on function public.biblioteca_confirmar_entrega(uuid) to authenticated;
grant execute on function public.biblioteca_atualizar_status_exemplar(uuid, text) to authenticated;
grant execute on function public.biblioteca_registrar_devolucao(uuid) to authenticated;

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'solicitacoes_emprestimo') then alter publication supabase_realtime add table public.solicitacoes_emprestimo; end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'livros') then alter publication supabase_realtime add table public.livros; end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'materiais_biblioteca') then alter publication supabase_realtime add table public.materiais_biblioteca; end if;
end $$;

commit;
