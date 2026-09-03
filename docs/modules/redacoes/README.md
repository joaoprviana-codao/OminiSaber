# Redações

## Objetivo

Cobrir proposta, planejamento, produção, envio, correção e devolutiva.

## Estrutura

Aluno: `frontend/aluno/laboratorio_de_redacao/`. Professor: `frontend/professor/professor_portugues/redacoes/`.

## Funcionamento

O aluno cria ou continua uma redação, salva versões e envia. O professor seleciona submissões das turmas vinculadas, lê o texto integral, atribui C1 a C5, calcula a nota, salva rascunho e publica a devolutiva.

## Banco de dados

`propostas_redacao`, `redacoes`, `planejamentos_redacao`, `repertorios_redacao`, `versoes_redacao`, `comentarios_redacao`, `avaliacoes_competencias_redacao` e `rascunhos_correcao_redacao`.

## Permissões

O aluno administra a própria produção. O professor de Português corrige redações de seus alunos. RLS e a função transacional `corrigir_redacao` protegem o fluxo.

## Pontos de atenção

A especificação detalhada está preservada em [jornada completa](../../legacy/redacao-jornada-completa.md).
