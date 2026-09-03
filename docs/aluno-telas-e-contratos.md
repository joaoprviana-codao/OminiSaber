# Módulo do Aluno: telas, layouts e contratos

Este é o inventário das telas de autenticação e do frontend de `aluno`. As telas integradas usam `tela/code.html`, com carregamento de dados centralizado em `frontend/aluno/shared/student-data.js`; autenticação e chamadas Supabase ficam em `backend/ominisaber-supabase-client.js`. O laboratório de redação é um protótipo independente.

## Estado atual

As telas integradas usam Supabase quando configurado. O laboratório de redação também persiste propostas, planejamento, rascunhos, versões, envio e correção; o navegador mantém apenas um buffer temporário de emergência.

## Tela 1: Login

```text
frontend/login/
|-- code.html
`-- screen.png
```

Responsabilidades:

- Login por e-mail ou matrícula.
- Redirecionamento por `perfis.role`.
- Mensagens interativas de matrícula inexistente, senha inválida e sessão expirada.

Serviços: `signIn`, `email_por_matricula`, `getProfile`.

## Tela 2: Cadastro

```text
frontend/cadastro/
`-- code.html
```

Responsabilidades:

- Nome, matrícula, e-mail, senha, confirmação e aceite.
- Criação via `auth.signUp`.
- Role inicial sempre `aluno`; roles administrativos não podem ser escolhidos publicamente.

Serviços: `signUp` e trigger `handle_new_user`.

## Tela 3: Dashboard principal

```text
frontend/aluno/dashboard_principal/
`-- code.html
```

Implementação atual:

- Saudação e perfil.
- Clique simples nas bolhas para consultar a matéria e clique duplo, Enter ou toque duplo para abrir o mapa de dificuldades.
- Mapa de dificuldades por matéria em `frontend/aluno/mapa_dificuldades/`, com nó central “Geral”, conexões visuais e prioridades por descritor/trilha.
- O percentual geral é ponderado pelas etapas: total de atividades concluídas dividido pelo total de atividades publicadas. Trilhas sem etapas aparecem como “sem evidência” e não produzem porcentagem fictícia.
- Média calculada a partir de `notas`.
- Atividades concluídas a partir de `progresso_atividades`.
- Total de redações em `redacoes`.
- Empréstimo atual em `emprestimos` + `livros`.
- Atividades recentes e links para os módulos.

Serviços: `getProfile`, `listStudentNotes`, `listStudentProgress`, `listStudentRedacoes`, `listStudentLoans`.

## Tela 4: Trilhas

```text
frontend/aluno/modulo_de_trilhas/
`-- code.html
```

Layout necessário:

- Catálogo visual filtrável por busca, área, série, trimestre e dificuldade.
- Detalhe com pré-requisitos, etapas bloqueadas, recompensas e progresso real.
- Aula com blocos editoriais, vídeo, materiais, anotações e conclusão.
- Atividade com dicas, resposta imediata e tentativa persistida.
- Resultado com acertos, explicações e próximos passos.
- Favoritos, conteúdos salvos e histórico cronológico do aluno.
- Estados vazios quando o Supabase não possui conteúdo publicado; não há fallback com dados simulados.

Serviços: `listStudyCatalog`, `getStudyTrail`, `getStudyActivity`, `toggleSavedContent`, `listSavedContent`, `saveLessonNotes`, `completeLesson`, `startActivityAttempt`, `getActiveActivityAttempt`, `answerActivityQuestion`, `getActivityResult`, `recordStudyEvent`, `listStudyHistory` e `getStudyXp`.

O contrato de dados, as sete rotas e as políticas de acesso estão detalhados em [Trilhas e estudos](trilhas-e-estudos.md). A estrutura SQL incremental fica em `backend/migrations/20260831_trilhas_estudos_completos.sql`.

As experiências detalhadas de Língua Portuguesa possuem telas próprias e consomem as avaliações publicadas pelo professor. As respostas são persistidas em `tentativas_avaliacao`, respeitando o vínculo entre aluno e turma.

### Experiências de Língua Portuguesa

```text
frontend/aluno/modulo_de_trilhas/portugues/
|-- index.html
|-- mapa-da-lingua/
|-- investigacao-argumentativa/
`-- interpretacao-visual/
```

- `Mapa da Língua`: 1º ano, 1º trimestre, `EM13LP10` e `D103_P`. Trabalha locutor, interlocutor, contexto, escuta e marcas linguísticas.
- `Investigação Argumentativa`: 2º ano, 3º trimestre, `EM13LP05` e `D055_P`. Permite selecionar ou arrastar tese, argumentos, evidência e contra-argumento.
- `Interpretação Visual`: 3º ano, 1º trimestre, `EM13LP48` e `D057_P`. Articula fotografia, título, gráfico e crítica social.
- As três telas usam o mesmo shell responsivo, menu móvel, navegação por teclado, foco visível, mensagens acessíveis e redução de movimento.
- O conteúdo-base é curricular e autoral. Avaliações, questões, perfil e tentativas não são simulados: são carregados ou gravados no Supabase.
- `listStudentEvaluations`, `getStudentEvaluationAttempt` e `saveStudentEvaluationAttempt` formam o contrato do quiz publicado pelo professor de Português.
- Quando o Supabase não está configurado ou não existe avaliação publicada, a tela informa o estado indisponível sem inventar dados.

## Tela 5: Laboratório de redação

```text
frontend/aluno/laboratorio_de_redacao/
|-- index.html
|-- script.js
`-- style.css
```

Implementação atual:

- Etapa 1 com propostas e textos fixados pela professora, busca, filtros, detalhes e seis propostas autorais de base.
- Etapa 2 com anotações, tese, argumentos, intervenção e repertórios contextuais classificados.
- Etapa 3 focada na redação, painel de planejamento minimizável e atalhos acessíveis para criar parágrafos.
- Revisão anterior ao envio com checklist automático e consciente.
- Redação corrigida com versões, comentários e cinco competências.
- Histórico com rascunhos, envios, correções e evolução de versões.
- Supabase como fonte única de propostas, planejamentos, rascunhos, versões e correções.

Serviços: `listWritingPrompts`, `getWritingPrompt`, `listWritingRepertoires`, `getEssayPlanning`, `saveEssayPlanning`, `getEssayDraft`, `saveEssayDraft`, `submitEssayDraft`, `getStudentEssay` e `listStudentEssayHistory`.

Consulte [Jornada completa de redação](redacao-jornada-completa.md) para o contrato editorial, persistência e políticas de acesso.

## Tela 6: Minha evolução

```text
frontend/aluno/minha_evolucao/
`-- code.html
```

Layout necessário:

- Lista de notas por matéria e bimestre.
- Progresso por atividade/trilha.
- Histórico de redações e notas.
- Gráficos só devem ser desenhados quando houver dados; sem dados, exibir estado vazio.

Serviços: `listStudentNotes`, `listStudentProgress`, `listStudentRedacoes`.

## Tela 7: Biblioteca digital

```text
frontend/aluno/biblioteca_digital/
`-- code.html
```

Layout necessário:

- Busca por título/autor.
- Disponibilidade baseada em `quantidade_disponivel`.
- Empréstimo aberto do aluno.
- Solicitar empréstimo usando `emprestimos`.
- Bloqueio visual quando já houver empréstimo aberto, reforçado pelo índice parcial do banco.

Serviços: `listLivros`, `listStudentLoans`, `requestLoan`.

## Tela 8: Perfil

```text
frontend/aluno/perfil/
|-- index.html
|-- style.css
`-- script.js
```

Layout necessário:

- Nome e e-mail do aluno autenticado.
- Turma, ano, curso técnico, matrícula e tipo de acesso vindos do perfil escolar.
- Atalhos para agenda, notificações e ajuda.
- A área de configurações separada foi removida para evitar duplicidade de navegação e responsabilidades.

Serviços: `getProfile`.

## Recursos compartilhados

```text
frontend/aluno/shared/
|-- navigation.js
|-- responsive.css
`-- student-data.js
```

- `navigation.js`: rotas auxiliares e tema.
- `student-sidebar.css`: apresentação única e responsiva da sidebar do aluno.
- `ominisaber-supabase-client.js`: montagem centralizada da navegação do aluno e identificação da rota ativa.
- `responsive.css`: responsividade, tema escuro e toasts.
- `student-data.js`: renderização, estados e ações das telas integradas. Não é carregado pelo laboratório independente.

## Limitações conhecidas

- Os cards genéricos do catálogo principal ainda não abrem qualquer formato de trilha; Língua Portuguesa já possui rotas detalhadas e interativas.
- O filtro de trilhas é local e os cards filtrados não exibem a ação `Abrir`.
- O prazo da trilha não é renderizado atualmente, embora exista no contrato visual.
- Preferências de notificação, autosave remoto, feedback/nota do laboratório e respostas de atividades ainda não têm persistência implementada.

## Dados que ainda exigem extensão de schema

Para completar além do escopo atual, o SQL precisará de:

- `respostas_atividades`: ainda será necessária somente para atividades genéricas fora do fluxo de `avaliacoes_docentes`; quizzes docentes já usam `tentativas_avaliacao`.
- `rascunhos_redacoes` ou atualização completa de `redacoes` para autosave.
- `preferencias_usuario`: notificações e preferências persistentes.
- `conquistas_usuario`: medalhas, ranking e XP exibidos anteriormente.
- `capas_livros` ou storage público para capas reais no acervo.

Sem essas tabelas, a interface deve exibir vazio/indisponível, nunca inventar valores.

## Critério de aceite

Uma tela do aluno está funcional quando:

1. exige sessão autenticada;
2. consulta apenas dados permitidos pelo RLS;
3. mostra loading, vazio e erro;
4. não contém nome, nota, porcentagem, livro ou atividade fixa;
5. suas ações confirmam sucesso/erro sem recarregar a página de forma inesperada;
6. possui uma fonte de dados ou declara explicitamente no estado vazio que o recurso ainda não existe no schema.
