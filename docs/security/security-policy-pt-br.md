# Política de Segurança

## Versões com suporte

O OmniSaber está em desenvolvimento ativo e ainda não adota uma política formal de versionamento semântico ou suporte de longo prazo.

| Versão ou branch | Status de suporte |
| --- | --- |
| `main` e versão mais recente do projeto | Recebem correções de segurança |
| Versões antigas | Suporte sob melhores esforços, sem garantia |
| Forks de terceiros | Não são suportados pelos mantenedores do OmniSaber |

As correções de segurança são aplicadas prioritariamente à branch `main` e à versão mais recente do projeto. Esta seção será atualizada quando forem adotadas releases versionadas formais.

## Reportando uma vulnerabilidade

Não divulgue vulnerabilidades suspeitas publicamente em Issues, pull requests ou outros canais públicos antes da investigação e correção.

Se o GitHub Private Vulnerability Reporting estiver habilitado neste repositório, use-o como canal preferencial. Caso não esteja habilitado, utilize um canal privado previamente informado pelos mantenedores.

> **TODO:** O repositório ainda não possui um canal privado de contato configurado. Os mantenedores devem habilitar o GitHub Private Vulnerability Reporting ou publicar um canal privado antes de depender desta política.

Inclua, quando possível:

- descrição da vulnerabilidade;
- impacto esperado ou potencial;
- passos claros para reprodução;
- ambiente, componente, rota ou configuração afetada;
- evidências ou PoC, quando aplicável;
- sugestão de correção ou mitigação, se houver.

A intenção é confirmar o recebimento em até 7 dias. Atualizações de status serão fornecidas conforme a investigação avançar. O prazo de correção depende da severidade, explorabilidade, usuários afetados e complexidade da correção.

### Fluxo de tratamento

1. Recebimento do relatório privado.
2. Triagem e identificação do componente afetado.
3. Validação e reprodução, quando possível.
4. Classificação da severidade e do risco.
5. Desenvolvimento e teste da correção.
6. Divulgação coordenada após a mitigação estar disponível.

## Divulgação responsável

Evite ações que possam prejudicar usuários, o projeto ou sua disponibilidade. Em especial, não:

- acesse ou exponha dados de outros usuários;
- destrua, modifique ou extraia dados de produção;
- provoque indisponibilidade intencional do serviço;
- acesse sistemas, contas ou registros além do necessário para validar a falha;
- publique detalhes, código de exploração ou conteúdo do relatório antes da divulgação coordenada.

Interrompa os testes e reporte o problema de forma privada assim que a falha estiver suficientemente demonstrada.

## Escopo

Podem ser reportados problemas de segurança envolvendo:

- frontend;
- backend;
- autenticação;
- integração ou configuração do Supabase;
- políticas Row Level Security (RLS);
- APIs e RPCs;
- acesso ao banco de dados;
- controle de acesso;
- uploads de arquivos;
- gerenciamento de sessões;
- papéis e permissões.

## Fora do escopo

Os itens abaixo ficam fora do escopo, salvo quando demonstrarem impacto concreto no OmniSaber:

- engenharia social ou phishing contra mantenedores, usuários ou escolas;
- spam, tráfego abusivo ou reclamações de moderação de conteúdo;
- ataques físicos ou acesso a instalações e dispositivos;
- ataques deliberados de negação de serviço ou exaustão de recursos;
- vulnerabilidades de dependências já corrigidas upstream sem impacto confirmado no OmniSaber.

## Safe Harbor

Pesquisas de segurança realizadas de boa-fé, dentro do escopo desta política e sem causar danos, serão tratadas de forma colaborativa. Pesquisadores que seguirem estas orientações não serão tratados como agentes hostis por sua pesquisa compatível com a política.
