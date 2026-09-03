# Autenticação

## Objetivo

Controlar entrada, recuperação de acesso e identificação do papel do usuário.

## Funcionamento

O Supabase Auth identifica o usuário. O registro correspondente em `public.perfis` fornece `role`, nome, turma, curso técnico e especialidade docente. Matrícula pode ser convertida em e-mail pela função `email_por_matricula`.

## Fluxo

Login → sessão → leitura de `perfis` → validação de papel/especialidade → carregamento da área autorizada. Cadastro e redefinição de senha ficam em `frontend/cadastro/` e `frontend/redefinir-senha/`.

## Banco de dados

`perfis.id` referencia `auth.users.id`. A função de matrícula é `security definer` e deve permanecer limitada ao propósito documentado.

## Pontos de atenção

Não expor chaves privadas no frontend e não usar perfil de demonstração para substituir sessão real.
