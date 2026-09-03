# Cliente Supabase

## Objetivo

Documentar o gateway usado pelas páginas estáticas.

## Localização

`backend/ominisaber-supabase-client.js` e `backend/ominisaber-supabase-config.js`.

## Funcionamento

O cliente cria a conexão quando há URL, chave anon e biblioteca Supabase. Funções de domínio obtêm sessão, perfil, dados e executam mutações; as páginas renderizam os resultados.

## Pontos de atenção

Use relações PostgREST explícitas quando houver FKs ambíguas, propague erros úteis e nunca coloque service role key no navegador.
