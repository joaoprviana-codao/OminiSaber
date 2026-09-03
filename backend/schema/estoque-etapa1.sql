-- OminiSaber | Migracao da Etapa 1: autores, obras e exemplares
-- Execute depois de backend/schema/biblioteca.sql no SQL Editor do Supabase.

begin;

create table if not exists public.autores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint autores_nome_nao_vazio check (length(trim(nome)) > 0)
);

create unique index if not exists autores_nome_normalizado_idx
  on public.autores (lower(regexp_replace(trim(nome), '\s+', ' ', 'g')));

alter table public.livros add column if not exists autor_id uuid references public.autores(id) on delete restrict;
alter table public.livros add column if not exists isbn text;
alter table public.livros add column if not exists prefixo_serie varchar(4);
alter table public.exemplares add column if not exists isbn text;
create index if not exists livros_autor_id_idx on public.livros (autor_id) where autor_id is not null;

update public.exemplares
set isbn = isbn_individual
where isbn is null and isbn_individual is not null;

-- Converte o formato anterior 9842-001 para o novo formato 98420001.
update public.exemplares
set numero_serie = left(numero_serie, 4) || lpad(right(numero_serie, 3), 4, '0')
where numero_serie ~ '^[0-9]{4}-[0-9]{3}$';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'exemplares_numero_serie_oito_digitos'
      and conrelid = 'public.exemplares'::regclass
  ) then
    alter table public.exemplares add constraint exemplares_numero_serie_oito_digitos
      check (numero_serie ~ '^[0-9]{8}$');
  end if;
end $$;

alter table public.autores enable row level security;
grant select on public.autores to authenticated;
grant insert on public.autores to authenticated;

drop policy if exists autores_staff_select on public.autores;
create policy autores_staff_select on public.autores
  for select to authenticated
  using (public.usuario_role() in ('bibliotecaria', 'gestor'));

drop policy if exists autores_staff_insert on public.autores;
create policy autores_staff_insert on public.autores
  for insert to authenticated
  with check (public.usuario_role() in ('bibliotecaria', 'gestor'));

-- Uma unica transacao cria a obra e todas as copias. p_isbns e indexado por copia.
create or replace function public.biblioteca_cadastrar_lote_livros(
  p_titulo text,
  p_autor_id uuid,
  p_genero text,
  p_isbn text default null,
  p_prefixo text default '9842',
  p_isbns text[] default '{}'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_livro public.livros;
  v_autor public.autores;
  v_prefixo text := left(lpad(regexp_replace(coalesce(p_prefixo, ''), '[^0-9]', '', 'g'), 4, '0'), 4);
  v_quantidade integer := greatest(coalesce(array_length(p_isbns, 1), 0), 1);
begin
  if public.usuario_role() not in ('bibliotecaria', 'gestor') then
    raise exception 'Sem permissao';
  end if;
  if length(trim(coalesce(p_titulo, ''))) = 0 then raise exception 'Titulo obrigatorio'; end if;
  if length(trim(coalesce(p_genero, ''))) = 0 then raise exception 'Genero obrigatorio'; end if;
  if length(v_prefixo) <> 4 or v_prefixo !~ '^[0-9]{4}$' then raise exception 'Prefixo deve ter 4 digitos'; end if;
  if v_quantidade > 9999 then raise exception 'O lote aceita no máximo 9999 exemplares'; end if;
  select * into v_autor from public.autores where id = p_autor_id;
  if v_autor.id is null then raise exception 'Autor nao encontrado'; end if;
  if exists (select 1 from public.exemplares where left(numero_serie, 4) = v_prefixo) then
    raise exception 'O prefixo informado ja possui uma serie cadastrada';
  end if;

  insert into public.livros (titulo, autor, autor_id, genero, isbn, prefixo_serie, quantidade_total, quantidade_disponivel)
  values (trim(p_titulo), v_autor.nome, v_autor.id, trim(p_genero), nullif(regexp_replace(coalesce(p_isbn, ''), '[^0-9]', '', 'g'), ''), v_prefixo, v_quantidade, v_quantidade)
  returning * into v_livro;

  insert into public.exemplares (livro_id, numero_serie, isbn, isbn_individual, status)
  select v_livro.id,
    v_prefixo || lpad(series.numero::text, 4, '0'),
    nullif(regexp_replace(coalesce(p_isbns[series.numero], p_isbn, ''), '[^0-9]', '', 'g'), ''),
    nullif(regexp_replace(coalesce(p_isbns[series.numero], p_isbn, ''), '[^0-9]', '', 'g'), ''),
    'disponivel'
  from generate_series(1, v_quantidade) as series(numero);

  return jsonb_build_object('livro_id', v_livro.id, 'quantidade', v_quantidade, 'prefixo', v_prefixo);
end;
$$;

revoke all on function public.biblioteca_cadastrar_lote_livros(text, uuid, text, text, text, text[]) from public, anon, authenticated;
grant execute on function public.biblioteca_cadastrar_lote_livros(text, uuid, text, text, text, text[]) to authenticated;

drop trigger if exists set_autores_updated_at on public.autores;
create trigger set_autores_updated_at before update on public.autores
for each row execute function public.set_updated_at();

commit;
