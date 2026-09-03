# Biblioteca unificada do OminiSaber

## Objetivo

A biblioteca separa claramente dois tipos de acervo:

- **Livro físico:** é cadastrado pela bibliotecária com exemplares individualizados. O aluno apenas solicita; o sistema não oferece “marcar como lendo” nem abertura de conteúdo.
- **Material digital:** é um arquivo PDF armazenado no bucket privado `biblioteca-pdfs`. O aluno só vê registros publicados e verificados e recebe o arquivo por download.

Nenhuma tela possui catálogo, fila, histórico ou indicador demonstrativo. Estados vazios representam o banco real.

## Fluxo do livro físico

1. A bibliotecária cadastra o título e seus exemplares.
2. O aluno envia uma solicitação para `solicitacoes_emprestimo`.
3. A ação **Separar** executa `biblioteca_separar_solicitacao` em uma transação: bloqueia o pedido, seleciona um exemplar disponível, muda o exemplar para `reservado`, reduz a disponibilidade e registra a localização no pedido.
4. Na retirada, `biblioteca_confirmar_entrega` muda o exemplar reservado para `emprestado` e calcula o prazo configurado.
5. A devolução libera o mesmo exemplar e recompõe a disponibilidade.

O índice parcial `idx_solicitacao_ativa_aluno_livro` impede pedidos ativos duplicados para o mesmo aluno e título.

## Fluxo do PDF

1. A bibliotecária escolhe um arquivo `.pdf` de até 50 MB.
2. O navegador valida MIME e assinatura `%PDF-` antes do envio.
3. O arquivo é enviado ao bucket privado e os metadados são gravados em `materiais_biblioteca`.
4. O material é publicado com identificação de quem verificou e quando.
5. O aluno baixa o Blob retornado pelo Storage; nenhuma URL pública permanente ou página externa é aberta.

## Segurança

- O bucket é privado e aceita apenas `application/pdf`.
- RLS permite ao aluno consultar apenas materiais simultaneamente `publicado = true` e `verificado = true`.
- Escrita no acervo digital e gestão de exemplares exigem papel `bibliotecaria` ou `gestor`.
- As operações de solicitação, separação, retirada e recusa ficam em funções `security definer` com `search_path` vazio e permissões explicitamente revogadas antes do `grant`.
- O cliente recebe somente chaves públicas. Chaves administrativas continuam exclusivamente no `.env` e em scripts locais de manutenção.
- O download cria uma URL temporária em memória e a revoga após iniciar a transferência.

## Instalação no Supabase correto

O projeto de destino é sempre o definido por `SUPABASE_URL` no `.env`. Não use IDs de projetos descobertos em outras contas.

Para uma instalação limpa, execute `backend/ominisaber-schema-completo.sql`. Em um banco OminiSaber já existente, execute apenas `../../backend/migrations/20260902_biblioteca_acervo_unificado.sql` no SQL Editor do projeto indicado pelo `.env`.

Depois, valide localmente:

```powershell
npm --prefix backend run sql:check
npm --prefix backend run library:check
```

O verificador informa somente host, existência das estruturas e contagens; não imprime chaves nem dados pessoais.
