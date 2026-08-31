# Jornada completa de redação

## Experiência do aluno

O laboratório separa a produção em três decisões cognitivas: explorar, planejar e escrever. A etapa de escrita remove textos motivadores e ferramentas de exploração da área principal para reduzir distrações; o planejamento continua disponível em um painel que pode ser minimizado.

Após a escrita, a rota de revisão combina verificações automáticas — título, extensão mínima técnica e quantidade de parágrafos — com confirmações conscientes sobre tese, repertório e intervenção. O envio bloqueia novas alterações do aluno, preserva uma versão e encaminha o texto para a professora.

## Fontes editoriais

- Seis propostas autorais ficam no código para o laboratório nunca perder seu ponto de partida pedagógico.
- A maioria expansível vem de `propostas_redacao` e `materiais_redacao` no Supabase.
- `fixada = true` coloca a proposta na seleção da professora.
- `materiais_redacao.fixado = true` coloca um texto, modelo, vídeo, artigo ou guia na mesma seleção.
- A professora pode marcar uma nova proposta como fixada no formulário de criação.

## Planejamento e repertório

`planejamentos_redacao` guarda anotações, tese, argumentos, intervenção e repertórios contextuais do acervo fixo. A relação `planejamento_repertorios` associa repertórios publicados no banco.

`repertorios_redacao` aceita somente as categorias cultural, estatística, histórica, científica, legal e literária. A restrição `contextualizado = true` impede o cadastro de repertório coringa no fluxo oficial. Toda referência deve explicar sua aplicação ao tema.

## Rascunhos e versões

`redacoes` mantém o estado atual. Um aluno só pode alterar uma redação enquanto ela está em `rascunho`; a mudança para `enviada` encerra sua permissão de edição. O gatilho privado `registrar_versao_redacao` cria snapshots em `versoes_redacao` na criação, nos salvamentos, no envio e na correção.

O navegador salva automaticamente após uma pausa de edição. Um buffer local é mantido como recuperação de emergência, mas o Supabase é a fonte de verdade.

## Correção

- `comentarios_redacao` guarda comentário geral ou ancorado por offsets do texto.
- `avaliacoes_competencias_redacao` guarda C1 a C5 em passos de 40 pontos.
- A tela corrigida mostra o texto enviado, permite alternar versões, apresenta feedback geral, comentários por trecho e barras por competência.

## Segurança

Todas as novas tabelas públicas têm RLS e permissões explícitas. Planejamento e redação pertencem ao aluno autenticado. Professores de Português só acessam alunos de turmas vinculadas em `professor_turmas`; gestores mantêm acesso administrativo. Funções com privilégios ficam no schema `private`, sem execução concedida ao navegador.

Migração: `backend/migrations/20260831_redacao_jornada_completa.sql`.
