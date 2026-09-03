# Políticas e arquitetura de segurança

## Modelo de confiança

O navegador não é confiável. Ocultar botões ou validar papéis no JavaScript melhora a experiência, mas não autoriza operações. A decisão final pertence ao PostgreSQL por meio de RLS e funções RPC.

## Autenticação

- Sessões são gerenciadas pelo Supabase Auth.
- Áreas restritas consultam a sessão antes de buscar dados.
- Perfis são vinculados ao identificador autenticado.
- O gatilho handle_new_user cria o perfil inicial.

## Autorização

- Tabelas de domínio habilitam Row Level Security.
- Alunos acessam os próprios dados.
- Professores recebem acesso conforme papel, especialidade e vínculo com a turma; gestores mantêm a visão administrativa.
- Bibliotecárias operam acervo e circulação por policies e RPCs.
- Funções como usuario_role, usuario_turma_id, usuario_tipo_professor e professor_pode_gerenciar_materia centralizam regras.

## Chaves e segredos

- A chave anon é pública por definição e pode existir no frontend.
- SUPABASE_SERVICE_ROLE_KEY nunca deve entrar em HTML, JavaScript público ou Git.
- Ferramentas administrativas leem segredos de backend/.env, ignorado pelo Git.
- O seed usa a chave de serviço somente em ambiente local autorizado.

## Proteções implementadas

- RLS nas tabelas principais.
- Policies separadas por leitura, inclusão e atualização.
- revoke e grant explícitos em funções sensíveis.
- Índices nos campos de autorização e consulta.
- RPCs para mudanças atômicas na biblioteca.
- Escape de HTML para conteúdo dinâmico.
- Validação nativa e limites nos formulários.
- Nas novas áreas docentes, `preview=1` mostra somente estados vazios, bloqueia envios e não consulta nem altera o Supabase.
- O enum tipo_professor impede especialidades arbitrárias; a restrição em perfis exige uma especialidade para professores e mantém o campo nulo nos demais papéis.
- Propostas e correções de redação são reservadas ao professor de Português vinculado à turma.
- Laboratórios e avaliações validam simultaneamente autoria, `tipo_professor` e vínculo com `professor_turmas`.
- Questões herdam o acesso da avaliação; entregas e tentativas ficam limitadas ao aluno autor, professor proprietário ou gestor.
- Respostas esperadas ficam em `gabaritos_avaliacao`, com RLS exclusiva para professor autor e gestor; alunos nunca recebem o gabarito junto com a questão.
- As tabelas docentes revogam todo acesso de `anon` e concedem operações somente a `authenticated`, ainda sujeitas a RLS.
- Gatilhos de integridade impedem o aluno de atribuir a própria nota ou alterar uma entrega/tentativa já enviada; o professor corrige sem reescrever a resposta do aluno.

## Riscos conhecidos

1. **Enumeração de matrícula:** email_por_matricula é executável por anon. Aplicar rate limit, CAPTCHA e resposta indistinguível.
2. **CSP:** limitar scripts, fontes e conexões ao Supabase e CDNs aprovadas.
3. **Headers:** habilitar Referrer-Policy, X-Content-Type-Options, Permissions-Policy e proteção contra framing.
4. **CDNs:** fixar versões e considerar Subresource Integrity ou hospedagem local.
5. **Gateway incompleto:** migrar consultas diretas da biblioteca para métodos de domínio.
6. **Auditoria:** registrar aprovação, retirada, devolução e mudanças de regras com autor e timestamp.
7. **Uploads:** validar MIME, tamanho e extensão no servidor; preferir buckets privados e URLs assinadas.
8. **Dados pessoais:** não usar dados reais em logs, seeds, screenshots ou demonstrações.

## Checklist de publicação

- Revisar policies com contas de cada papel.
- Confirmar que service_role não está no frontend.
- Testar acesso cruzado entre alunos e turmas.
- Testar acesso cruzado entre as quatro especialidades de professor.
- Testar que alunos não visualizam rascunhos nem conteúdos publicados para outras turmas.
- Testar RPCs com usuário sem permissão.
- Ativar headers e rate limiting.
- Revisar dependências e versões.
- Testar teclado, contraste, zoom e mensagens de erro.
