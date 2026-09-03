# Configuração e ambiente

## Objetivo

Configurar a conexão do frontend com o projeto Supabase sem publicar credenciais privadas.

## Estrutura

- `backend/config/env.example.js`: modelo de configuração.
- `backend/ominisaber-supabase-config.js`: configuração consumida pelo navegador.
- `backend/ominisaber-supabase-client.js`: gateway compartilhado do frontend.

## Funcionamento

Preencha a URL do projeto e a chave pública anon conforme o padrão existente no arquivo de exemplo. Nunca coloque service role key ou outros segredos em arquivos servidos pelo frontend.

## Pontos de atenção

A configuração é obrigatória para fluxos que acessam dados reais. Sem ela, as telas devem exibir estado de erro ou configuração ausente.
