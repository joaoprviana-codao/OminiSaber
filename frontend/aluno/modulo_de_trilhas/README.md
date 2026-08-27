# Hub de Trilhas

O `index.html` é o portal de entrada do módulo. Ele apresenta o catálogo completo do Ensino Médio, agrupado em Linguagens, Matemática, Ciências da Natureza e Ciências Humanas, e direciona cada card para uma página de disciplina independente.

Cada disciplina possui um ecossistema próprio, sem sidebar global: identidade visual, ferramenta de estudo, progresso específico e carregamento de trilhas do Supabase. O filtro do hub é apenas um recurso de descoberta; não substitui páginas de matéria.

As páginas consultam `window.OminiSaber.listTrilhas()` e `window.OminiSaber.listStudentProgress()`. O progresso é filtrado pelo campo `atividades.trilhas.materia`, enquanto blocos interativos são escolhidos conforme a configuração da disciplina. Nenhuma página acessa tabelas diretamente.
