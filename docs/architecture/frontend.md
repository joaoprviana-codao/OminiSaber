# Frontend

## Objetivo

Documentar a organização do frontend sem alterar sua arquitetura estática.

## Estrutura

Cada tela normalmente possui `index.html`, `script.js` e `style.css`. Shells compartilhados ficam em `frontend/*/shared/`; o portal docente especializado usa `frontend/professor/specialty/`.

## Funcionamento

HTML define a estrutura, CSS define identidade visual e JavaScript inicializa sessão, carrega dados e renderiza estados de carregamento, vazio e erro.

## Fluxo

Os scripts aguardam o evento de prontidão do shell quando aplicável e chamam o cliente Supabase. Links entre telas são relativos ao diretório da página.

## Pontos de atenção

Não há pipeline React/Vue ou bundler no projeto. O arquivo aberto diretamente pode sofrer restrições de origem; prefira servidor HTTP local.
