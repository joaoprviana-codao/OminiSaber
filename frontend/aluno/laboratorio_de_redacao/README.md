# Laboratório de Redação

Módulo de escrita guiada em três etapas, com seleção de proposta no modelo ENEM, planejamento textual e editor oficial para envio da produção.

## Fluxo

1. **Banco de temas:** exibe propostas organizadas por Tecnologia, Meio ambiente e Sociedade. Cada card apresenta o recorte do tema, uma orientação inicial e textos motivadores.
2. **Planejamento textual:** mostra os textos motivadores do tema selecionado, mantém um bloco de anotações para tese, argumentos e intervenção e apresenta as cinco competências da matriz ENEM.
3. **Redação oficial:** oferece campos de título e texto final, contadores de palavras e linhas, aviso de integridade e envio persistido no Supabase.

A navegação acontece sem recarregar a página. O tema selecionado é mantido em memória durante o fluxo e o planejamento não é enviado como redação final.

## Segurança e integridade

- `copy`, `paste`, `cut` e `contextmenu` são bloqueados durante a etapa oficial.
- `F12`, `Ctrl+Shift+I`, `Ctrl+Shift+J`, `Ctrl+U`, `Ctrl+C` e `Ctrl+V` são interceptados durante a etapa oficial.
- A Page Visibility API invalida imediatamente a tentativa quando a aba perde visibilidade. O editor é desabilitado e o envio fica impedido até reiniciar o fluxo.
- O texto é escapado antes de ser inserido no resumo do planejamento, reduzindo risco de injeção no DOM.
- A validação de autenticação e persistência ocorre pelo gateway público `window.OminiSaber`; o módulo não acessa tabelas diretamente.

## Persistência

O envio chama `createRedacao({ titulo, texto, trilhaId })` em `backend/supabase-client.js`. Essa operação grava o aluno autenticado, `status = 'enviada'` e `enviada_em` no servidor. A autorização final é reforçada pelo Supabase Auth e pelas políticas RLS do banco.

O bloqueio de atalhos e de transferência é uma camada de dissuasão no cliente, não uma fronteira de segurança. Para auditoria forte, o backend deve registrar eventos de sessão e aplicar validações adicionais no servidor.
