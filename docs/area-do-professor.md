# Área do professor

## Objetivo

A área do professor concentra planejamento, acompanhamento de turmas, prioridades pedagógicas e ferramentas próprias de cada especialidade. Ela utiliza a identidade OminiSaber com navegação e linguagem próprias para reduzir o tempo operacional do educador.

## Perfis e experiências

| Perfil (`tipo_professor`) | Identidade | Área de trabalho | Permissões específicas |
| --- | --- | --- | --- |
| `matematica` | Azul | Diagnóstico por habilidade, conceitos e exercícios | Conteúdos, trilhas e avaliações de Matemática |
| `portugues` | Roxo | Linguagem, competências e produção textual | Conteúdos de Português, propostas e correção de redações |
| `tecnico_administracao` | Laranja | Projetos, processos, equipes e entregas | Conteúdos e avaliações do eixo de Administração |
| `tecnico_informatica` | Verde-azulado | Laboratórios, projetos técnicos e ambientes | Conteúdos e avaliações do eixo de Informática |

O perfil vem de `perfis.tipo_professor`. A interface não concede permissão: ela apresenta apenas as ferramentas autorizadas pelas policies do banco. As novas rotas não possuem dados fictícios e dependem de uma sessão autenticada compatível.

## Rotas principais

- `frontend/professor/professor_matematica/`: dashboard, laboratório matemático e avaliações por habilidade.
- `frontend/professor/professor_portugues/`: dashboard de Linguagens, oficina e avaliações interpretativas.
- `frontend/professor/professor_tecnico_administracao/`: dashboard em pipeline, estúdio de projetos e avaliações aplicadas.
- `frontend/professor/professor_tecnico_informatica/`: dashboard técnico, laboratórios e avaliações com questões de código.
- `frontend/professor/dashboard/index.html`: rota legada; usuários autenticados são encaminhados ao espaço da especialidade.
- `frontend/professor/redacoes/index.html`: entregas, propostas, evolução das competências e correção guiada.
- `frontend/aluno/laboratorio_de_redacao/index.html`: escolha da proposta, planejamento, escrita e envio do aluno.

O login encaminha cada professor com base em `tipo_professor`. A tentativa de abrir outra especialidade é bloqueada no frontend para orientação e novamente no banco por RLS.

## Laboratórios e avaliações

Cada especialidade possui três rotas: `dashboard`, `laboratorio` e `avaliacoes`. O laboratório cria rascunhos ou publicações vinculadas a uma turma. O construtor de avaliações compõe questões localmente e persiste a avaliação e as questões no Supabase ao salvar.

- Matemática: gráficos, fórmulas, simulação, cálculo e demonstração.
- Português: leitura orientada, produção textual, debate e análise de texto.
- Administração: estudos de caso, projetos em equipe, simulações e cálculo financeiro.
- Informática: desafios de código, redes, banco de dados e revisão técnica.

Os registros são armazenados em `laboratorios_docentes`, `avaliacoes_docentes` e `questoes_avaliacao`. Os gabaritos ficam separados em `gabaritos_avaliacao` para não serem expostos aos alunos. Entregas e tentativas ficam em `entregas_laboratorio` e `tentativas_avaliacao`.

As consultas mais frequentes e os campos usados nas policies possuem índices compostos por professor/aluno, estado e data. Nas atualizações de entregas e tentativas, gatilhos de integridade separam claramente o que o aluno pode enviar do que o professor pode corrigir.

## Fluxo de redação do professor de Português

1. O professor cria uma proposta com tema, categoria, comando, textos motivadores, turma, prazo e rubrica, podendo fixá-la no laboratório da turma.
2. A proposta é salva como rascunho ou publicada em `propostas_redacao`; materiais complementares ficam em `materiais_redacao`.
3. O aluno autenticado consulta propostas publicadas para sua turma, planeja o texto e escreve no laboratório.
4. Planejamento e rascunho são salvos no Supabase; um buffer local existe somente para recuperação de falha de conexão.
5. A redação é persistida em `redacoes`, associada ao planejamento, ao aluno e opcionalmente à proposta; `versoes_redacao` preserva os estados anteriores.
6. O professor de Português vinculado à turma corrige pelas cinco competências, registra feedback e comentários por trecho e devolve o texto.

## Modelo de dados

`perfis.tipo_professor` usa o enum `tipo_professor` e é obrigatório quando `role = 'professor'`. `professor_turmas` representa o vínculo muitos-para-muitos entre docentes e turmas. `propostas_redacao` contém autoria, turma, textos motivadores, detalhes e estado de publicação. `planejamentos_redacao`, `repertorios_redacao`, `versoes_redacao`, `comentarios_redacao` e `avaliacoes_competencias_redacao` completam a jornada. As notas permanecem entre 0 e 1000.

Para bancos existentes, execute os schemas docentes e depois `backend/migrations/20260831_redacao_jornada_completa.sql`. A migração é incremental e não apaga redações existentes.

## Responsividade e acessibilidade

- Navegação lateral recolhível abaixo de 900 px.
- Criação e correção passam de duas colunas para uma coluna em telas menores.
- Controles primários mantêm área de toque adequada.
- Campos possuem rótulos, estados de foco e mensagens em região `aria-live`.
- A correção mantém o texto separado da rubrica, evitando rolagem horizontal.
- Alunos podem usar teclado virtual, seleção de texto, corretor ortográfico e recursos assistivos sem bloqueios artificiais.

## Segurança

- RLS cruza papel, `tipo_professor`, matéria e vínculo em `professor_turmas`.
- Laboratórios e avaliações só podem ser criados pelo professor autenticado da mesma especialidade.
- Publicações para uma turma exigem vínculo em `professor_turmas`.
- Alunos visualizam somente conteúdos publicados da própria turma e suas próprias respostas.
- RLS limita propostas ao professor de Português autor, gestor ou aluno da turma quando publicadas.
- Redações permanecem visíveis apenas ao aluno, professor de Português da turma e gestor.
- O professor autenticado é registrado como autor da proposta e responsável pela correção.
- O frontend nunca utiliza `service_role`.
- Rascunhos do aluno não são colocados em armazenamento persistente compartilhado.
- `?preview=1` não é autorização e deve ser removido ou desabilitado em builds públicos de produção.
