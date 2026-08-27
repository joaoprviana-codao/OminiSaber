# Dashboard principal do aluno

Esta página apresenta uma visão resumida da jornada acadêmica do aluno: perfil, média geral, atividades concluídas, redações enviadas, empréstimo ativo, atividades recentes e médias agrupadas por matéria em um gráfico radar.

## Arquitetura

- `index.html` contém a estrutura semântica, navegação e os estados visuais da tela.
- `style.css` define os tokens do `EduTech Clarity`, o layout fluido e os breakpoints para mobile, tablet e desktop.
- `script.js` concentra a apresentação e usa exclusivamente as funções públicas de `window.OminiSaber`: `getSession`, `getProfile`, `listStudentNotes`, `listStudentProgress`, `listStudentRedacoes` e `listStudentLoans`.
- O gateway em `backend/supabase-client.js` é responsável por autenticação, consultas e RLS. A tela não acessa tabelas diretamente.
- Os dados continuam centralizados no contrato compartilhado do aluno (`frontend/aluno/shared/student-data.js`); este dashboard usa o mesmo gateway público para evitar duplicação de acesso ao Supabase.

## Execução

Abra `index.html` por meio de um servidor estático para que os scripts relativos sejam resolvidos. Configure `backend/supabase-config.js` e tenha uma sessão autenticada de aluno para visualizar dados reais. Chart.js é carregado por CDN.

## Estados

O painel exibe carregamento durante as consultas, erro com ação de nova tentativa quando a integração falha e mensagens vazias quando ainda não há notas, atividades ou empréstimos.
