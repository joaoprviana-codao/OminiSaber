# Debugging

## Objetivo

Investigar falhas sem ocultar a causa.

## Fluxo

1. Reproduza com servidor HTTP local.
2. Verifique configuração, sessão e perfil.
3. Observe console do navegador e resposta Supabase.
4. Confirme tabela, filtro, FK explícita, grants e RLS.
5. Reproduza a consulta no SQL Editor com usuário autorizado.

## Pontos de atenção

Não substitua erros por arrays vazios silenciosos nem use dados falsos para mascarar uma falha de integração.
