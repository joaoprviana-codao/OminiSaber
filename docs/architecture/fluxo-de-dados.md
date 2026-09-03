# Fluxo de dados

## Objetivo

Mostrar como uma ação percorre a aplicação.

## Fluxo

1. A página carrega o cliente Supabase e o shell do papel.
2. O cliente obtém a sessão autenticada.
3. O perfil determina papel, turma e especialidade.
4. A função de domínio consulta tabelas e relações autorizadas.
5. O JavaScript renderiza dados reais, estado vazio ou erro contextualizado.
6. Mutações retornam dados do banco e atualizam a interface.

## Pontos de atenção

Filtros de turma usados no frontend são conveniência; o escopo definitivo vem de RLS e dos vínculos persistidos.
