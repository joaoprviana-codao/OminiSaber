# Troubleshooting

## Supabase não conecta

Confira URL, chave anon, carregamento da biblioteca e console do navegador.

## Dados não aparecem

Verifique sessão, perfil, vínculos em `professor_turmas`, turma do aluno, status publicado e RLS.

## Erro de relacionamento PostgREST

Consulte as FKs do schema e use a constraint explícita no `select`, sem remover relações legítimas.

## Migração falha

Confirme a ordem cronológica, a existência de extensões e a execução no projeto correto. Não use operações destrutivas para contornar o problema.
