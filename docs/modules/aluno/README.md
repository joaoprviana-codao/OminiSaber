# Módulo do aluno

## Objetivo

Oferecer login, trilhas, experiências, redação, evolução, biblioteca, agenda e perfil do aluno.

## Estrutura

A implementação fica em `frontend/aluno/`. O cliente compartilhado fornece os dados reais do Supabase.

## Funcionamento

A sessão identifica o aluno e suas relações. O dashboard agrega trilhas, atividades, notas, redações, experiências, XP e histórico. Estados de carregamento, vazio e erro devem permanecer visíveis.

## Banco de dados

Usa `perfis`, `turmas`, `trilhas`, `atividades`, progresso, notas, redações, agenda, biblioteca e conquistas.

## Pontos de atenção

Detalhes de contratos estão em [telas e contratos](../../legacy/aluno-telas-e-contratos.md), preservado durante a reorganização.
