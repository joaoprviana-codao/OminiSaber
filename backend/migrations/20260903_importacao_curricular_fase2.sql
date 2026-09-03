begin;

alter table public.importacoes_curriculo_itens
  drop constraint if exists importacoes_curriculo_itens_tipo_check;
alter table public.importacoes_curriculo_itens
  add constraint importacoes_curriculo_itens_tipo_check
  check (tipo in ('habilidade','referencia_ensino_fundamental','descritor','aviso'));

commit;