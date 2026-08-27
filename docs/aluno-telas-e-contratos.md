# Módulo do Aluno: telas, layouts e contratos

Este é o inventário das telas de autenticação e do frontend de `aluno`. As telas integradas usam `tela/code.html`, com carregamento de dados centralizado em `frontend/aluno/shared/student-data.js`; autenticação e chamadas Supabase ficam em `backend/supabase-client.js`. O laboratório de redação é um protótipo independente.

## Estado atual

As oito telas documentadas não têm o mesmo nível de integração. Login, cadastro e as cinco telas do shell integrado usam Supabase quando configurado. O laboratório mantém estado e envio simulados no navegador, sem consultar ou inserir dados no Supabase.

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

Layout necessário:

- Saudação e perfil.
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

- Abas de trilhas obrigatórias e de aprendizagem.
- Filtro por tipo.
- Cards com matéria, descritor SEDU, prazo, descrição e atividades.
- Estado vazio quando não houver trilhas publicadas para a turma.
- Ação para abrir trilha e iniciar atividade.

Serviços: `listTrilhas`, `listStudentProgress`.

Observação: a abertura detalhada de uma atividade exige uma tela adicional caso o produto precise de questionários, respostas e correção. O schema atual possui atividades e progresso, mas não possui tabela de respostas.

## Tela 5: Laboratório de redação

```text
frontend/aluno/laboratorio_de_redacao/
|-- index.html
|-- script.js
`-- style.css
```

Layout necessário:

- Editor de título e texto.
- Editor visual com título, texto, formatação e contagem de palavras.
- Rascunho salvo e restaurado em `localStorage`.
- Banco de temas estático e navegação em demonstração.
- Modal e envio simulados; o botão não grava em `redacoes`.
- Alerta de análise de originalidade/adequação por IA é apenas informativo.

Serviços: nenhum serviço Supabase; a implementação usa `localStorage` e `setTimeout`.

Para autosave real, adicionar uma operação `updateRedacao` e usar `status = 'rascunho'` antes do envio final.

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

## Tela 8: Configurações

```text
frontend/aluno/configuracoes/
`-- code.html
```

Layout necessário:

- Nome e e-mail do perfil autenticado.
- Atualização segura sem alteração de `role` ou `turma_id`.
- Tema claro, escuro e sistema.
- Preferências de notificação: o schema ainda não possui tabela para persistência.

Serviços: `getProfile`, `updateProfile`, `auth.updateUser`.

## Recursos compartilhados

```text
frontend/aluno/shared/
|-- navigation.js
|-- responsive.css
`-- student-data.js
```

- `navigation.js`: rotas, tema, sidebar e redirecionamento.
- `responsive.css`: responsividade, tema escuro e toasts.
- `student-data.js`: renderização, estados e ações das telas integradas. Não é carregado pelo laboratório independente.

## Limitações conhecidas

- Os cards de trilhas exibem um botão `Abrir`, mas ainda não existe listener para abrir a trilha ou iniciar uma atividade.
- O filtro de trilhas é local e os cards filtrados não exibem a ação `Abrir`.
- O prazo da trilha não é renderizado atualmente, embora exista no contrato visual.
- Preferências de notificação, autosave remoto, feedback/nota do laboratório e respostas de atividades ainda não têm persistência implementada.

## Dados que ainda exigem extensão de schema

Para completar além do escopo atual, o SQL precisará de:

- `respostas_atividades`: respostas, tentativas, correção e feedback.
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
