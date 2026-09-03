# Laboratório de Redação

Jornada de escrita do aluno em três etapas:

1. Exploração de propostas e textos fixados pela professora, seguida do banco completo de temas.
2. Planejamento com anotações, tese, dois argumentos, intervenção e classificação de repertório contextualizado.
3. Editor focado somente na redação, com planejamento recolhível, salvamento automático e atalhos de parágrafo.

Depois da terceira etapa, o aluno passa pela revisão estrutural antes de enviar. O histórico preserva versões; quando a professora corrige, a devolutiva mostra nota geral, competências e comentários por trecho.

## Rotas

- `index.html`: proposta, planejamento e escrita.
- `revisao/index.html`: checklist antes do envio.
- `corrigida/index.html`: texto, comentários e competências.
- `historico/index.html`: rascunhos, envios, correções e versões.

## Persistência

Supabase é a fonte única de propostas, materiais, repertórios, planejamentos, redações, versões e correções. Falhas de salvamento são exibidas ao aluno e nunca são substituídas por dados locais.

O editor cria um novo parágrafo com `Tab` no início de uma linha ou `Shift + Enter`. Esse comportamento é explicado na etapa 2 e repetido na barra do editor.

Repertórios genéricos não fazem parte do fluxo. Cada referência precisa informar categoria, fonte e aplicação específica ao tema; o banco exige `contextualizado = true`.
