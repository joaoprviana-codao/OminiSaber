# Disciplina (template único) — Fase 1 da remodulação

Substitui as 16 pastas antigas em `frontend/aluno/modulo_de_trilhas/`
(`algebra/`, `artes/`, `biologia/`, `educacao-fisica/`, `filosofia/`,
`fisica/`, `geografia/`, `geometria/`, `historia/`, `ingles-espanhol/`,
`literatura/`, `matematica/`, `portugues/`, `quimica/`, `redacao/`,
`sociologia/`), cada uma com seu próprio `index.html` + `script.js` +
`style.css` quase idênticos (~48 arquivos).

## Como funciona

- `index.html` é o shell único, carregado como `disciplina/index.html?materia=algebra`.
- `disciplinas.config.js` guarda os dados de cada uma das 16 disciplinas:
  tema de cores, textos, e a configuração do widget interativo.
- `script.js` lê o parâmetro `materia`, aplica o tema via CSS custom
  properties e renderiza o widget certo a partir de um registry de 5
  tipos reutilizáveis (`equation-check`, `slider-calc`, `picker-info`,
  `flashcards`, `thesis-counter`) que juntos cobrem as 16 disciplinas.
- `style.css` é uma única folha temável — as cores mudam via
  `--ink`, `--muted`, `--paper`, `--accent`, `--soft`, `--line`.

## O que mudou no hub

`frontend/aluno/modulo_de_trilhas/index.html` e `script.js` foram
atualizados: os 16 cards não são mais hardcoded no HTML — são gerados a
partir do mesmo `disciplinas.config.js`, e cada card aponta para
`../disciplina/index.html?materia=<slug>` em vez de `<slug>/index.html`.

## Progresso e trilhas: ainda por regex (proposital nesta fase)

O filtro de trilhas/progresso por matéria continua usando o mesmo
`aliasPattern` (regex) que os scripts antigos usavam, só que centralizado
em um lugar em vez de repetido em 16 arquivos. A Fase 2 (SQL) vai trocar
isso por uma coluna `materia_slug` no Supabase e o gateway passa a
filtrar no servidor — mais robusto que regex client-side.

## Arquivos que podem ser removidos após validar esta fase

```text
frontend/aluno/modulo_de_trilhas/algebra/
frontend/aluno/modulo_de_trilhas/artes/
frontend/aluno/modulo_de_trilhas/biologia/
frontend/aluno/modulo_de_trilhas/educacao-fisica/
frontend/aluno/modulo_de_trilhas/filosofia/
frontend/aluno/modulo_de_trilhas/fisica/
frontend/aluno/modulo_de_trilhas/geografia/
frontend/aluno/modulo_de_trilhas/geometria/
frontend/aluno/modulo_de_trilhas/historia/
frontend/aluno/modulo_de_trilhas/ingles-espanhol/
frontend/aluno/modulo_de_trilhas/literatura/
frontend/aluno/modulo_de_trilhas/matematica/
frontend/aluno/modulo_de_trilhas/portugues/
frontend/aluno/modulo_de_trilhas/quimica/
frontend/aluno/modulo_de_trilhas/redacao/
frontend/aluno/modulo_de_trilhas/sociologia/
```

**Não remova ainda** se quiser comparar lado a lado antes de apagar —
sugiro só remover depois de testar o template novo no navegador.

## Pendente para próximas fases

- Fase 2: SQL consolidado + coluna `materia_slug`.
- Fase 3: shell compartilhado (header/sidebar/tema) para as 6 telas
  integradas, removendo `shared/student-data.js` (código morto) e os
  `code.html` de redirecionamento.