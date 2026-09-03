# Autenticação do OminiSaber

## Fluxo de entrada

O aluno pode entrar com e-mail ou matrícula. Quando uma matrícula é informada, a função protegida `email_por_matricula` resolve o e-mail correspondente e o Supabase Auth valida a senha. Uma sessão só é considerada válida quando o Auth retorna simultaneamente `session` e `user`.

Depois da autenticação, o frontend lê o perfil em `public.perfis`, respeitando RLS, e define o destino a partir de `role` e, para professores, `tipo_professor`. Perfis inexistentes, papéis desconhecidos e especialidades docentes ausentes interrompem o acesso com uma mensagem específica; nenhum perfil é convertido silenciosamente em aluno.

## Cadastro e confirmação

O cadastro público cria somente perfis de aluno e envia `nome`, `matricula` e `curso_tecnico` como metadados. O gatilho `handle_new_user` cria o registro correspondente em `public.perfis`. Quando a confirmação de e-mail está habilitada no Supabase, a tela informa claramente que o aluno precisa confirmar o endereço antes do primeiro login e permite reenviar a mensagem.

## Recuperação de senha

O link “Esqueci minha senha” solicita ao Supabase um e-mail de recuperação. O link recebido abre `frontend/redefinir-senha/index.html`, onde o próprio usuário define a nova senha. A resposta exibida não revela se um endereço está cadastrado.

## Verificação automatizada

Execute `npm --prefix backend run auth:check`. A verificação cria uma conta técnica aleatória, autentica com a chave pública usada pelo navegador, lê o próprio perfil pelas políticas RLS e remove essa conta no final. Nenhuma credencial é impressa e nenhum dado de teste permanece no projeto.
