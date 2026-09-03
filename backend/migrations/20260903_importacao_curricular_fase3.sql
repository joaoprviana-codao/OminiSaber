begin;

create table if not exists public.documentos_curriculares (
  id uuid primary key default gen_random_uuid(),
  bucket text not null default 'curriculos-pdfs',
  storage_path text not null unique,
  nome_arquivo text not null,
  mime_type text not null check (mime_type = 'application/pdf'),
  tamanho_bytes bigint not null check (tamanho_bytes > 0 and tamanho_bytes <= 52428800),
  arquivo_hash_sha256 text not null check (arquivo_hash_sha256 ~ '^[a-f0-9]{64}$'),
  origem text,
  ano_letivo smallint check (ano_letivo is null or ano_letivo between 2000 and 2100),
  materia_codigo public.materia_aluno,
  criado_por uuid references public.perfis(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

alter table public.importacoes_curriculo
  add column if not exists documento_id uuid references public.documentos_curriculares(id) on delete set null,
  add column if not exists reprocessamento_de_id uuid references public.importacoes_curriculo(id) on delete set null;
alter table public.importacoes_curriculo drop constraint if exists importacoes_curriculo_arquivo_hash_sha256_key;
create unique index if not exists importacoes_curriculo_hash_original_uidx
  on public.importacoes_curriculo (arquivo_hash_sha256)
  where reprocessamento_de_id is null;

alter table public.curriculos
  add column if not exists importacao_id uuid references public.importacoes_curriculo(id) on delete set null;

grant select, insert, update, delete on public.documentos_curriculares to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('curriculos-pdfs', 'curriculos-pdfs', false, 52428800, array['application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 52428800, allowed_mime_types = array['application/pdf'];

drop policy if exists curriculos_leitura on public.curriculos;
create policy curriculos_leitura on public.curriculos for select to authenticated
using (status = 'publicado' or (select public.usuario_role()) = 'gestor');
drop policy if exists curriculos_gestor on public.curriculos;
create policy curriculos_gestor on public.curriculos for all to authenticated
using ((select public.usuario_role()) = 'gestor') with check ((select public.usuario_role()) = 'gestor');

drop policy if exists descritores_leitura on public.descritores_curriculares;
create policy descritores_leitura on public.descritores_curriculares for select to authenticated
using (status = 'ativo' and exists (
  select 1 from public.habilidade_descritores hd
  join public.curriculo_periodos cp on cp.id = hd.periodo_id
  join public.curriculos c on c.id = cp.curriculo_id
  where hd.descritor_id = descritores_curriculares.id and c.status = 'publicado'
) or (select public.usuario_role()) = 'gestor');
drop policy if exists descritores_gestor on public.descritores_curriculares;
create policy descritores_gestor on public.descritores_curriculares for all to authenticated
using ((select public.usuario_role()) = 'gestor') with check ((select public.usuario_role()) = 'gestor');

 drop policy if exists habilidades_leitura on public.habilidades_curriculares;
create policy habilidades_leitura on public.habilidades_curriculares for select to authenticated
using (exists (
  select 1 from public.habilidade_curriculo_periodos hcp
  join public.curriculo_periodos cp on cp.id = hcp.periodo_id
  join public.curriculos c on c.id = cp.curriculo_id
  where hcp.habilidade_id = habilidades_curriculares.id and c.status = 'publicado'
) or (select public.usuario_role()) = 'gestor');
drop policy if exists habilidades_gestor on public.habilidades_curriculares;
create policy habilidades_gestor on public.habilidades_curriculares for all to authenticated
using ((select public.usuario_role()) = 'gestor') with check ((select public.usuario_role()) = 'gestor');

drop policy if exists curriculo_periodos_leitura on public.curriculo_periodos;
create policy curriculo_periodos_leitura on public.curriculo_periodos for select to authenticated
using (exists (select 1 from public.curriculos c where c.id = curriculo_id and (c.status = 'publicado' or (select public.usuario_role()) = 'gestor')));
drop policy if exists curriculo_periodos_gestor on public.curriculo_periodos;
create policy curriculo_periodos_gestor on public.curriculo_periodos for all to authenticated using ((select public.usuario_role()) = 'gestor') with check ((select public.usuario_role()) = 'gestor');

 drop policy if exists habilidade_periodos_leitura on public.habilidade_curriculo_periodos;
create policy habilidade_periodos_leitura on public.habilidade_curriculo_periodos for select to authenticated
using (exists (select 1 from public.curriculo_periodos cp join public.curriculos c on c.id = cp.curriculo_id where cp.id = periodo_id and (c.status = 'publicado' or (select public.usuario_role()) = 'gestor')));
drop policy if exists habilidade_descritores_leitura on public.habilidade_descritores;
create policy habilidade_descritores_leitura on public.habilidade_descritores for select to authenticated
using (exists (select 1 from public.curriculo_periodos cp join public.curriculos c on c.id = cp.curriculo_id where cp.id = periodo_id and (c.status = 'publicado' or (select public.usuario_role()) = 'gestor')));
drop policy if exists expectativas_leitura on public.expectativas_aprendizagem;
create policy expectativas_leitura on public.expectativas_aprendizagem for select to authenticated
using (exists (select 1 from public.curriculo_periodos cp join public.curriculos c on c.id = cp.curriculo_id where cp.id = periodo_id and (c.status = 'publicado' or (select public.usuario_role()) = 'gestor')));
drop policy if exists habilidade_objetos_leitura on public.habilidade_objetos;
create policy habilidade_objetos_leitura on public.habilidade_objetos for select to authenticated
using (exists (select 1 from public.curriculo_periodos cp join public.curriculos c on c.id = cp.curriculo_id where cp.id = periodo_id and (c.status = 'publicado' or (select public.usuario_role()) = 'gestor')));
drop policy if exists objetos_leitura on public.objetos_conhecimento;
create policy objetos_leitura on public.objetos_conhecimento for select to authenticated
using (exists (select 1 from public.habilidade_objetos ho join public.curriculo_periodos cp on cp.id = ho.periodo_id join public.curriculos c on c.id = cp.curriculo_id where ho.objeto_id = objetos_conhecimento.id and (c.status = 'publicado' or (select public.usuario_role()) = 'gestor')));

drop policy if exists documentos_curriculares_gestor on public.documentos_curriculares;
create policy documentos_curriculares_gestor on public.documentos_curriculares for all to authenticated
using ((select public.usuario_role()) = 'gestor') with check ((select public.usuario_role()) = 'gestor');
drop policy if exists importacoes_gestor on public.importacoes_curriculo;
create policy importacoes_gestor on public.importacoes_curriculo for all to authenticated using ((select public.usuario_role()) = 'gestor') with check ((select public.usuario_role()) = 'gestor');
drop policy if exists importacoes_itens_gestor on public.importacoes_curriculo_itens;
create policy importacoes_itens_gestor on public.importacoes_curriculo_itens for all to authenticated using ((select public.usuario_role()) = 'gestor') with check ((select public.usuario_role()) = 'gestor');

alter table public.documentos_curriculares enable row level security;
create index if not exists documentos_curriculares_hash_idx on public.documentos_curriculares (arquivo_hash_sha256);
create unique index if not exists documentos_curriculares_hash_uidx on public.documentos_curriculares (arquivo_hash_sha256);
create index if not exists importacoes_curriculo_documento_idx on public.importacoes_curriculo (documento_id, created_at desc);

 drop policy if exists curriculos_pdfs_gestor_insert on storage.objects;
create policy curriculos_pdfs_gestor_insert on storage.objects for insert to authenticated
with check (bucket_id = 'curriculos-pdfs' and (select public.usuario_role()) = 'gestor');
drop policy if exists curriculos_pdfs_gestor_select on storage.objects;
create policy curriculos_pdfs_gestor_select on storage.objects for select to authenticated
using (bucket_id = 'curriculos-pdfs' and (select public.usuario_role()) = 'gestor');
drop policy if exists curriculos_pdfs_gestor_update on storage.objects;
create policy curriculos_pdfs_gestor_update on storage.objects for update to authenticated
using (bucket_id = 'curriculos-pdfs' and (select public.usuario_role()) = 'gestor') with check (bucket_id = 'curriculos-pdfs' and (select public.usuario_role()) = 'gestor');
drop policy if exists curriculos_pdfs_gestor_delete on storage.objects;
create policy curriculos_pdfs_gestor_delete on storage.objects for delete to authenticated
using (bucket_id = 'curriculos-pdfs' and (select public.usuario_role()) = 'gestor');

create or replace function public.criar_importacao_curriculo(
  p_documento_id uuid, p_nome_arquivo text, p_hash text, p_tamanho bigint,
  p_origem text, p_ano smallint, p_materia public.materia_aluno,
  p_trimestre smallint, p_resumo jsonb, p_texto text, p_itens jsonb,
  p_reprocessamento_de_id uuid default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare novo_id uuid; existente public.importacoes_curriculo; item jsonb;
begin
  if public.usuario_role() <> 'gestor' then raise exception 'Apenas gestores podem criar importações'; end if;
  if not exists (select 1 from public.documentos_curriculares where id = p_documento_id and arquivo_hash_sha256 = p_hash) then raise exception 'Documento de origem inválido'; end if;
  if p_nome_arquivo !~* '\\.pdf' or p_tamanho <= 0 or p_tamanho > 52428800 or p_hash !~ '^[a-f0-9]{64}$' or nullif(btrim(p_texto), '') is null then raise exception 'Metadados do PDF ou texto extraído inválidos'; end if;
  if p_reprocessamento_de_id is null then
    select * into existente from public.importacoes_curriculo where arquivo_hash_sha256 = p_hash and reprocessamento_de_id is null limit 1;
    if existente.id is not null then return existente.id; end if;
  end if;
  insert into public.importacoes_curriculo (nome_arquivo, arquivo_hash_sha256, origem, ano_letivo, materia_codigo, trimestre, status, resumo, documento_texto_extraido, documento_id, reprocessamento_de_id)
  values (p_nome_arquivo, p_hash, p_origem, p_ano, p_materia, p_trimestre, 'revisao', coalesce(p_resumo, '{}'::jsonb), p_texto, p_documento_id, p_reprocessamento_de_id)
  returning id into novo_id;
  for item in select value from jsonb_array_elements(coalesce(p_itens, '[]'::jsonb)) loop
    insert into public.importacoes_curriculo_itens (importacao_id, tipo, payload, confianca, status, source_page)
    values (novo_id, item ->> 'tipo', coalesce(item -> 'payload', '{}'::jsonb), coalesce((item ->> 'confianca')::numeric, 0), coalesce(item ->> 'status', 'revisar'), (item ->> 'source_page')::integer);
  end loop;
  insert into public.gestor_auditoria (gestor_id, acao, recurso, recurso_id, detalhes)
  values ((select auth.uid()), 'staging_criado', 'importacao_curriculo', novo_id::text, jsonb_build_object('nome_arquivo', p_nome_arquivo, 'itens', jsonb_array_length(coalesce(p_itens, '[]'::jsonb))));
  return novo_id;
end;
$$;
revoke all on function public.criar_importacao_curriculo(uuid,text,text,bigint,text,smallint,public.materia_aluno,smallint,jsonb,text,jsonb,uuid) from public, anon, authenticated;
grant execute on function public.criar_importacao_curriculo(uuid,text,text,bigint,text,smallint,public.materia_aluno,smallint,jsonb,text,jsonb,uuid) to authenticated;

create or replace function public.editar_item_importacao_curriculo(p_item_id uuid, p_payload jsonb, p_source_page integer, p_status text)
returns public.importacoes_curriculo_itens language plpgsql security definer set search_path = '' as $$
declare resultado public.importacoes_curriculo_itens; importacao_id uuid;
begin
  if public.usuario_role() <> 'gestor' then raise exception 'Apenas gestores podem editar a revisão'; end if;
  if p_status not in ('ok', 'revisar', 'aprovado', 'rejeitado') then raise exception 'Status de revisão inválido'; end if;
  update public.importacoes_curriculo_itens set payload = coalesce(p_payload, '{}'::jsonb), source_page = p_source_page, status = p_status where id = p_item_id returning * into resultado;
  if resultado.id is null then raise exception 'Item de importação não encontrado'; end if;
  importacao_id := resultado.importacao_id;
  insert into public.gestor_auditoria (gestor_id, acao, recurso, recurso_id, detalhes) values ((select auth.uid()), 'edicao_item_importacao', 'importacao_curriculo_item', p_item_id::text, jsonb_build_object('importacao_id', importacao_id, 'status', p_status));
  return resultado;
end;
$$;
revoke all on function public.editar_item_importacao_curriculo(uuid,jsonb,integer,text) from public, anon, authenticated;
grant execute on function public.editar_item_importacao_curriculo(uuid,jsonb,integer,text) to authenticated;

create or replace function public.rejeitar_importacao_curriculo(p_importacao_id uuid)
returns public.importacoes_curriculo language plpgsql security definer set search_path = '' as $$
declare resultado public.importacoes_curriculo;
begin
  if public.usuario_role() <> 'gestor' then raise exception 'Apenas gestores podem rejeitar importações'; end if;
  update public.importacoes_curriculo set status = 'rejeitada', updated_at = now() where id = p_importacao_id and status = 'revisao' returning * into resultado;
  if resultado.id is null then raise exception 'Importação não está em revisão'; end if;
  insert into public.gestor_auditoria (gestor_id, acao, recurso, recurso_id, detalhes) values ((select auth.uid()), 'rejeicao_importacao', 'importacao_curriculo', p_importacao_id::text, '{}'::jsonb);
  return resultado;
end;
$$;
revoke all on function public.rejeitar_importacao_curriculo(uuid) from public, anon, authenticated;
grant execute on function public.rejeitar_importacao_curriculo(uuid) to authenticated;

create or replace function public.reprocessar_importacao_curriculo(p_importacao_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare anterior public.importacoes_curriculo; nova_id uuid;
begin
  if public.usuario_role() <> 'gestor' then raise exception 'Apenas gestores podem reprocessar importações'; end if;
  select * into anterior from public.importacoes_curriculo where id = p_importacao_id;
  if anterior.id is null then raise exception 'Importação não encontrada'; end if;
  if anterior.documento_id is null then raise exception 'Importação sem documento de origem'; end if;
  insert into public.importacoes_curriculo (nome_arquivo, arquivo_hash_sha256, origem, ano_letivo, materia_codigo, trimestre, status, resumo, documento_texto_extraido, documento_id, reprocessamento_de_id)
  values (anterior.nome_arquivo, anterior.arquivo_hash_sha256, anterior.origem, anterior.ano_letivo, anterior.materia_codigo, anterior.trimestre, 'revisao', anterior.resumo, anterior.documento_texto_extraido, anterior.documento_id, anterior.id)
  returning id into nova_id;
  insert into public.importacoes_curriculo_itens (importacao_id, tipo, payload, confianca, status, source_page, observacao)
  select nova_id, tipo, payload, confianca, 'revisar', source_page, 'Reprocessado para nova revisão' from public.importacoes_curriculo_itens where importacao_id = anterior.id;
  insert into public.gestor_auditoria (gestor_id, acao, recurso, recurso_id, detalhes) values ((select auth.uid()), 'reprocessamento', 'importacao_curriculo', nova_id::text, jsonb_build_object('origem_id', anterior.id));
  return nova_id;
end;
$$;
revoke all on function public.reprocessar_importacao_curriculo(uuid) from public, anon, authenticated;
grant execute on function public.reprocessar_importacao_curriculo(uuid) to authenticated;

create or replace function public.aprovar_importacao_curriculo(p_importacao_id uuid) returns uuid language plpgsql security definer set search_path = '' as $$
declare imp public.importacoes_curriculo; curr_id uuid; periodo public.curriculo_periodos; habilidade public.habilidades_curriculares; descritor public.descritores_curriculares; objeto public.objetos_conhecimento; item jsonb; child jsonb; serie_num smallint; tri_num smallint; versao_num integer;
begin
  if public.usuario_role() <> 'gestor' then raise exception 'Apenas gestores podem aprovar importações'; end if;
  select * into imp from public.importacoes_curriculo where id = p_importacao_id for update;
  if imp.id is null then raise exception 'Importação não encontrada'; end if;
  if imp.status = 'aprovada' and imp.curriculo_id is not null then return imp.curriculo_id; end if;
  if imp.status <> 'revisao' then raise exception 'Importação precisa estar em revisão'; end if;
  if imp.materia_codigo is null then raise exception 'Componente curricular não identificado'; end if;
  if exists (select 1 from public.importacoes_curriculo_itens where importacao_id = imp.id and tipo = 'habilidade' and status in ('revisar', 'rejeitado')) then raise exception 'Existem habilidades pendentes ou rejeitadas'; end if;
  perform pg_advisory_xact_lock(hashtext(coalesce(imp.origem, '') || ':' || imp.ano_letivo || ':' || imp.materia_codigo::text));
  select coalesce(max(versao), 0) + 1 into versao_num from public.curriculos where origem = coalesce(imp.origem, 'Não identificada') and ano_letivo = imp.ano_letivo and materia_codigo = imp.materia_codigo;
  insert into public.curriculos (nome, origem, ano_letivo, materia_codigo, versao, status, criado_por, importacao_id) values (coalesce(imp.origem, 'Currículo importado') || ' ' || imp.ano_letivo, coalesce(imp.origem, 'Não identificada'), imp.ano_letivo, imp.materia_codigo, versao_num, 'publicado', imp.importado_por, imp.id) returning id into curr_id;
  update public.curriculos set status = 'arquivado', ativo = false, updated_at = now() where origem = coalesce(imp.origem, 'Não identificada') and ano_letivo = imp.ano_letivo and materia_codigo = imp.materia_codigo and id <> curr_id and status = 'publicado';
  for item in select payload from public.importacoes_curriculo_itens where importacao_id = imp.id and tipo = 'habilidade' and status in ('ok', 'aprovado') loop
    serie_num := nullif((item ->> 'serie')::smallint, 0); tri_num := coalesce(nullif((item ->> 'trimestre')::smallint, 0), imp.trimestre); if serie_num is null or tri_num is null then raise exception 'Habilidade sem série ou trimestre'; end if;
    insert into public.curriculo_periodos (curriculo_id, serie, trimestre) values (curr_id, serie_num, tri_num) returning * into periodo;
    insert into public.habilidades_curriculares (codigo, descricao, materia_codigo) values (upper(item ->> 'codigo'), coalesce(nullif(item ->> 'descricao', ''), 'Descrição pendente'), imp.materia_codigo) on conflict (codigo, materia_codigo) do update set descricao = case when public.habilidades_curriculares.descricao = 'Descrição pendente' then excluded.descricao else public.habilidades_curriculares.descricao end returning * into habilidade;
    insert into public.habilidade_curriculo_periodos (habilidade_id, periodo_id, quinzena, semana, source_page) values (habilidade.id, periodo.id, item ->> 'quinzena', item ->> 'semana', nullif(item ->> 'source_page', '')::integer);
    for child in select value from jsonb_array_elements(coalesce(item -> 'descritores', '[]'::jsonb)) loop
      insert into public.descritores_curriculares (codigo, titulo, descricao, materia_codigo, serie, trimestre, status) values (upper(child ->> 'code'), upper(child ->> 'code'), nullif(child ->> 'descricao', ''), imp.materia_codigo, serie_num, tri_num, 'ativo') on conflict (codigo) do update set descricao = coalesce(public.descritores_curriculares.descricao, excluded.descricao), status = case when public.descritores_curriculares.status = 'revisao' then 'ativo' else public.descritores_curriculares.status end returning * into descritor;
      insert into public.habilidade_descritores values (habilidade.id, descritor.id, periodo.id) on conflict do nothing;
    end loop;
    for child in select value from jsonb_array_elements(coalesce(item -> 'expectativas', '[]'::jsonb)) loop
      insert into public.expectativas_aprendizagem (habilidade_id, periodo_id, descricao)
      values (habilidade.id, periodo.id, child #>> '{}') on conflict do nothing;
    end loop;
    for child in select value from jsonb_array_elements(coalesce(item -> 'objetos', '[]'::jsonb)) loop
      insert into public.objetos_conhecimento (descricao)
      values (child #>> '{}') on conflict (descricao) do update set descricao = excluded.descricao returning * into objeto;
      insert into public.habilidade_objetos values (habilidade.id, objeto.id, periodo.id) on conflict do nothing;
    end loop;
  end loop;
  update public.importacoes_curriculo set status = 'aprovada', curriculo_id = curr_id, versao = versao_num, updated_at = now() where id = imp.id;
  insert into public.gestor_auditoria (gestor_id, acao, recurso, recurso_id, detalhes) values ((select auth.uid()), 'aprovacao_publicacao', 'curriculo', curr_id::text, jsonb_build_object('importacao_id', imp.id, 'versao', versao_num));
  return curr_id;
end;
$$;
revoke all on function public.aprovar_importacao_curriculo(uuid) from public, anon, authenticated;
grant execute on function public.aprovar_importacao_curriculo(uuid) to authenticated;

commit;
