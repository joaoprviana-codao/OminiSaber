# Biblioteca

## Objetivo

Gerenciar acervo, exemplares, empréstimos e acesso a materiais digitais.

## Estrutura

Implementação em `frontend/bibliotecaria/` e `frontend/aluno/biblioteca_digital/`. SQL específico em schemas e migrations da biblioteca.

## Funcionamento

A bibliotecária administra acervo e empréstimos. O aluno consulta livros e solicita empréstimos conforme sua autorização.

## Banco de dados

Inclui livros, exemplares, empréstimos, seções físicas, materiais de biblioteca e solicitações.

## Permissões

Policies distinguem bibliotecária, gestor e aluno. Operações de estoque e alocação não devem ser expostas a perfis não autorizados.

## Pontos de atenção

A documentação de fluxos físicos e digitais está preservada em [biblioteca unificada](../../legacy/biblioteca-unificada.md).
