/**
 * Config central das disciplinas do módulo de trilhas.
 *
 * Substitui as 16 pastas antigas (algebra/, artes/, biologia/, ...), cada uma
 * com seu próprio index.html + script.js + style.css quase idênticos.
 * Adicionar ou editar uma disciplina agora é editar um objeto aqui, não criar
 * três arquivos novos.
 *
 * `aliasPattern` é usado para casar o campo `materia` vindo do Supabase
 * (texto livre, ex: "Álgebra") com o slug da disciplina, sem depender de uma
 * coluna nova no banco. Quando a Fase 2 (SQL) adicionar `materia_slug`, o
 * gateway pode passar a filtrar no servidor e este regex vira só um fallback.
 */
(() => {
  const disciplinas = {
    portugues: {
      nome: "Língua Portuguesa",
      categoria: "linguagens",
      numero: "01",
      icone: "Aa",
      aliasPattern: /portugu[eê]s/i,
      kicker: "LINGUAGENS / LEITURA",
      tagline: "Leia além das linhas.",
      descricao:
        "Um espaço para investigar escolhas de linguagem, contextos e sentidos.",
      tema: {
        ink: "#1b2538",
        muted: "#6c7484",
        paper: "#f3f1eb",
        accent: "#a44931",
        soft: "#f3ded4",
        line: "#ded9cf",
      },
      widget: {
        type: "picker-info",
        kicker: "LEITURA GUIADA",
        titulo: "O texto como território",
        bodyText:
          "Leia o trecho em silêncio. Depois, selecione uma palavra para observar como o sentido muda quando ela encontra seu contexto.",
        leadingQuote:
          "A linguagem não é apenas um meio de comunicação: ela organiza aquilo que conseguimos perceber.",
        layout: "row",
        placeholder: "Escolha uma palavra para abrir sua camada de análise.",
        items: [
          { key: "contexto", label: "contexto", info: "O entorno que dá contorno e intenção a uma mensagem." },
          { key: "sentido", label: "sentido", info: "O efeito de significado produzido pela relação entre palavras e leitor." },
          { key: "perceber", label: "perceber", info: "Observar com atenção para encontrar o que não está explícito." },
        ],
      },
    },

    redacao: {
      nome: "Redação",
      categoria: "linguagens",
      numero: "02",
      icone: "✎",
      aliasPattern: /reda[çc][ãa]o/i,
      kicker: "LINGUAGENS / ARGUMENTAÇÃO",
      tagline: "Uma ideia bem construída.",
      descricao:
        "Treine tese, repertório e intervenção antes de entrar no editor oficial.",
      tema: {
        ink: "#272039",
        muted: "#766e83",
        paper: "#f6f1f8",
        accent: "#7d4a9a",
        soft: "#ecdef3",
        line: "#e0d3e8",
      },
      widget: {
        type: "thesis-counter",
        kicker: "OFICINA DE TESE",
        titulo: "Qual é a posição central do seu texto?",
        placeholder:
          "Escreva uma frase que responda ao problema do tema...",
        labFuncional: "../laboratorio_de_redacao/index.html",
        labLabel: "Abrir Laboratório de Redação",
      },
    },

    literatura: {
      nome: "Literatura",
      categoria: "linguagens",
      numero: "03",
      icone: "◉",
      aliasPattern: /literatura/i,
      kicker: "LINGUAGENS / OBRAS E VOZES",
      tagline: "Leia o tempo em cada voz.",
      descricao:
        "Movimentos literários são formas diferentes de sentir e narrar uma época.",
      tema: {
        ink: "#322b23",
        muted: "#82776d",
        paper: "#f4eee4",
        accent: "#a5663a",
        soft: "#f1dfce",
        line: "#e2d2c0",
      },
      widget: {
        type: "picker-info",
        kicker: "LEITURA EM CAMADAS",
        titulo: "Escolha um movimento",
        layout: "row",
        displayMode: "quote",
        placeholder:
          "Uma obra começa antes da primeira palavra: começa no mundo que a torna necessária.",
        items: [
          { key: "romantismo", label: "Romantismo", info: "A emoção ocupa o centro e a paisagem se torna espelho de quem narra." },
          { key: "modernismo", label: "Modernismo", info: "A linguagem se fragmenta para inventar uma forma capaz de falar do presente." },
          { key: "realismo", label: "Realismo", info: "O cotidiano aparece sem idealização, revelando conflitos sociais e psicológicos." },
        ],
      },
    },

    "ingles-espanhol": {
      nome: "Inglês e Espanhol",
      categoria: "linguagens",
      numero: "04",
      icone: "語",
      aliasPattern: /ingl[eê]s|espanhol/i,
      kicker: "LINGUAGENS / COMUNICAÇÃO",
      tagline: "Words that move.",
      descricao:
        "Vocabulário ganha sentido quando encontra uma situação real de comunicação.",
      tema: {
        ink: "#1d3040",
        muted: "#6e7d88",
        paper: "#eaf4f5",
        accent: "#087c86",
        soft: "#d5eef0",
        line: "#c7dfe1",
      },
      widget: {
        type: "flashcards",
        kicker: "FLASHCARDS DE CONTEXTO",
        titulo: "Vocabulário em contexto",
        cards: [
          { front: "community", back: "comunidade", translation: "comunidade · pessoas que compartilham um espaço ou interesse" },
          { front: "cuidado", back: "care", translation: "care · atenção dedicada a alguém ou algo" },
          { front: "camino", back: "caminho", translation: "caminho · direção ou percurso em espanhol" },
        ],
      },
    },

    artes: {
      nome: "Artes",
      categoria: "linguagens",
      numero: "05",
      icone: "✦",
      aliasPattern: /artes/i,
      kicker: "LINGUAGENS / CRIAÇÃO",
      tagline: "Veja o processo.",
      descricao:
        "Repertório visual, escolha e experimentação: crie sua própria leitura.",
      tema: {
        ink: "#25232d",
        muted: "#77717d",
        paper: "#f7f2f2",
        accent: "#cf5b52",
        soft: "#f8dcd8",
        line: "#ead5d2",
      },
      widget: {
        type: "picker-info",
        kicker: "PALETA DE IDEIAS",
        titulo: "Que atmosfera você quer criar?",
        layout: "swatches",
        placeholder: "Selecione uma cor para iniciar sua composição.",
        items: [
          { key: "calma", label: "Calma", color: "#9ecdc0", info: "Uma paleta calma convida a olhar devagar e perceber detalhes." },
          { key: "energia", label: "Energia", color: "#e37d54", info: "Cores de energia criam contraste e conduzem o olhar pela composição." },
          { key: "memoria", label: "Memória", color: "#7767a4", info: "Uma atmosfera de memória combina camadas, vestígios e afetos." },
        ],
      },
    },

    "educacao-fisica": {
      nome: "Educação Física",
      categoria: "linguagens",
      numero: "06",
      icone: "↗",
      aliasPattern: /educa[çc][ãa]o f[ií]sica/i,
      kicker: "LINGUAGENS / CORPO E CULTURA",
      tagline: "Conheça seu ritmo.",
      descricao:
        "Movimento também é linguagem: observe esforço, pausa e recuperação.",
      tema: {
        ink: "#20342c",
        muted: "#718078",
        paper: "#edf5ee",
        accent: "#d16d3c",
        soft: "#fae4d8",
        line: "#d2e1d6",
      },
      widget: {
        type: "picker-info",
        kicker: "PAINEL DE MOVIMENTO",
        titulo: "Como está sua intensidade?",
        layout: "row",
        placeholder: "Escolha uma intensidade para receber uma orientação de recuperação.",
        items: [
          { key: "leve", label: "Leve", info: "Movimento leve: priorize mobilidade, respiração confortável e percepção do corpo." },
          { key: "moderada", label: "Moderada", info: "Movimento moderado: mantenha ritmo sustentável e faça pausas para hidratação." },
          { key: "intensa", label: "Intensa", info: "Movimento intenso: respeite seus limites e planeje recuperação antes de repetir o esforço." },
        ],
      },
    },

    matematica: {
      nome: "Matemática Geral",
      categoria: "matematica",
      numero: "07",
      icone: "∑",
      aliasPattern: /matem[áa]tica/i,
      kicker: "CAMPO 07 / RESOLUÇÃO DE PROBLEMAS",
      tagline: "Pense em movimentos.",
      descricao:
        "A matemática começa quando você transforma uma pergunta em estratégia.",
      tema: {
        ink: "#16263b",
        muted: "#68788e",
        paper: "#eaf2f1",
        accent: "#006c49",
        soft: "#d4f1e4",
        line: "#c8dbd6",
      },
      widget: {
        type: "slider-calc",
        kicker: "LABORATÓRIO NUMÉRICO",
        titulo: "Área do retângulo",
        descricao: "Altere as medidas e observe o raciocínio passo a passo.",
        resultLabel: "área = base × altura",
        unit: "u²",
        sliders: [
          { key: "base", label: "Base", min: 1, max: 20, default: 8 },
          { key: "altura", label: "Altura", min: 1, max: 20, default: 5 },
        ],
        compute: (v) => v.base * v.altura,
      },
    },

    algebra: {
      nome: "Álgebra",
      categoria: "matematica",
      numero: "08",
      icone: "x²",
      aliasPattern: /álgebra|algebra/i,
      kicker: "MATEMÁTICA / MODELOS",
      tagline: "Encontre o padrão.",
      descricao: "Use símbolos para tornar relações visíveis e testar possibilidades.",
      tema: {
        ink: "#29203c",
        muted: "#756d83",
        paper: "#f5f0fb",
        accent: "#713c9d",
        soft: "#eadcf5",
        line: "#dfd1eb",
      },
      widget: {
        type: "equation-check",
        kicker: "EXPLORADOR DE EQUAÇÕES",
        titulo: "Quando 2x + 4 = 18?",
        coef: 2,
        const: 4,
        alvo: 18,
        valorInicial: 7,
        template: (x, resultado) => `2(${x}) + 4 = ${resultado}`,
        sucesso: (x) => `Perfeito: x = ${x} mantém a igualdade verdadeira.`,
        falha: "A igualdade só é verdadeira quando o resultado chega a 18.",
      },
    },

    geometria: {
      nome: "Geometria",
      categoria: "matematica",
      numero: "09",
      icone: "△",
      aliasPattern: /geometria/i,
      kicker: "MATEMÁTICA / ESPAÇO",
      tagline: "Faça a forma pensar.",
      descricao:
        "Arraste medidas, compare áreas e descubra a lógica escondida nas figuras.",
      tema: {
        ink: "#213142",
        muted: "#6f7e8d",
        paper: "#edf2f6",
        accent: "#3565a5",
        soft: "#dce8f6",
        line: "#cfdae5",
      },
      widget: {
        type: "slider-calc",
        kicker: "ESTÚDIO DE FORMAS",
        titulo: "Triângulo ajustável",
        resultLabel: "área",
        unit: "u²",
        visual: "triangle",
        sliders: [
          { key: "base", label: "Base", min: 2, max: 16, default: 8 },
          { key: "altura", label: "Altura", min: 2, max: 16, default: 6 },
        ],
        compute: (v) => (v.base * v.altura) / 2,
      },
    },

    fisica: {
      nome: "Física",
      categoria: "natureza",
      numero: "10",
      icone: "↯",
      aliasPattern: /f[íi]sica(?! )/i,
      kicker: "CIÊNCIAS DA NATUREZA / LABORATÓRIO",
      tagline: "Forças em cena.",
      descricao: "Observe como uma variável muda o comportamento de um sistema.",
      tema: {
        ink: "#172a42",
        muted: "#6d7c90",
        paper: "#edf4f8",
        accent: "#12648b",
        soft: "#d7edf5",
        line: "#c9dce5",
      },
      widget: {
        type: "slider-calc",
        kicker: "SIMULAÇÃO DE MOVIMENTO",
        titulo: "Deslocamento no tempo",
        unit: "m",
        visual: "bar",
        sliders: [{ key: "velocidade", label: "Velocidade", min: 1, max: 20, default: 8 }],
        compute: (v) => v.velocidade * 5,
        formatText: (v, resultado) =>
          `Velocidade: ${v.velocidade} m/s · deslocamento calculado em 5 segundos: ${resultado} m.`,
      },
    },

    quimica: {
      nome: "Química",
      categoria: "natureza",
      numero: "11",
      icone: "⚗",
      aliasPattern: /qu[íi]mica/i,
      kicker: "CIÊNCIAS DA NATUREZA / MATÉRIA",
      tagline: "A matéria em transformação.",
      descricao: "Explore elementos e observe como suas propriedades organizam o mundo.",
      tema: {
        ink: "#252035",
        muted: "#777386",
        paper: "#f7f1f6",
        accent: "#a63568",
        soft: "#f4dce8",
        line: "#ead4df",
      },
      widget: {
        type: "picker-info",
        kicker: "TABELA PERIÓDICA DE BOLSO",
        titulo: "Escolha um elemento",
        layout: "grid",
        defaultKey: "C",
        items: [
          { key: "H", label: "H", title: "Hidrogênio", info: "Não metal · número atômico 1 · o elemento mais leve." },
          { key: "C", label: "C", title: "Carbono", info: "Não metal · número atômico 6 · base da vida orgânica." },
          { key: "O", label: "O", title: "Oxigênio", info: "Não metal · número atômico 8 · essencial à respiração." },
          { key: "Na", label: "Na", title: "Sódio", info: "Metal alcalino · número atômico 11 · reativo em água." },
          { key: "Fe", label: "Fe", title: "Ferro", info: "Metal de transição · número atômico 26 · presente na hemoglobina." },
          { key: "Au", label: "Au", title: "Ouro", info: "Metal de transição · número atômico 79 · resistente à oxidação." },
        ],
      },
    },

    biologia: {
      nome: "Biologia",
      categoria: "natureza",
      numero: "12",
      icone: "⌬",
      aliasPattern: /biologia/i,
      kicker: "CIÊNCIAS DA NATUREZA / VIDA",
      tagline: "Observe as conexões.",
      descricao: "Investigue como cada sistema participa do equilíbrio de um organismo.",
      tema: {
        ink: "#19352d",
        muted: "#698078",
        paper: "#edf5ee",
        accent: "#27735c",
        soft: "#d8eee0",
        line: "#cbe0d3",
      },
      widget: {
        type: "picker-info",
        kicker: "DIAGRAMA INTERATIVO",
        titulo: "Estruturas da célula",
        layout: "grid",
        items: [
          { key: "nucleo", label: "núcleo", title: "Núcleo", info: "Armazena o material genético e coordena as atividades celulares." },
          { key: "membrana", label: "membrana", title: "Membrana plasmática", info: "Controla a entrada e a saída de substâncias na célula." },
          { key: "mitocondria", label: "mitocôndria", title: "Mitocôndria", info: "Produz energia para as funções da célula por meio da respiração celular." },
        ],
      },
    },

    historia: {
      nome: "História",
      categoria: "humanas",
      numero: "13",
      icone: "◷",
      aliasPattern: /hist[óo]ria/i,
      kicker: "CIÊNCIAS HUMANAS / TEMPO",
      tagline: "O passado em movimento.",
      descricao: "Conecte acontecimentos, vozes e consequências para construir perspectiva.",
      tema: {
        ink: "#392d25",
        muted: "#81756c",
        paper: "#f5f0e8",
        accent: "#9b5537",
        soft: "#f2dfd3",
        line: "#e5d5c6",
      },
      widget: {
        type: "picker-info",
        kicker: "LINHA DO TEMPO",
        titulo: "Marcos brasileiros",
        layout: "timeline",
        placeholder: "Selecione um ponto da linha para abrir seu contexto histórico.",
        items: [
          { key: "1888", label: "1888", title: "Abolição da escravidão", info: "A Lei Áurea encerrou juridicamente a escravidão, sem criar políticas de inclusão para a população liberta." },
          { key: "1930", label: "1930", title: "Revolução de 1930", info: "A ruptura política de 1930 inaugurou uma nova etapa de centralização do Estado brasileiro." },
          { key: "1964", label: "1964", title: "Golpe civil-militar", info: "A ruptura institucional iniciou uma ditadura que restringiu direitos e liberdades por duas décadas." },
          { key: "1988", label: "1988", title: "Constituição cidadã", info: "A Constituição de 1988 reorganizou direitos sociais e marcou a redemocratização brasileira." },
        ],
      },
    },

    geografia: {
      nome: "Geografia",
      categoria: "humanas",
      numero: "14",
      icone: "⌖",
      aliasPattern: /geografia/i,
      kicker: "CIÊNCIAS HUMANAS / ESPAÇO",
      tagline: "Leia o território.",
      descricao: "Mapas não são apenas desenhos: são escolhas sobre o que merece ser visto.",
      tema: {
        ink: "#1d3340",
        muted: "#70808a",
        paper: "#edf5f5",
        accent: "#167b78",
        soft: "#d4eeea",
        line: "#cfe1e0",
      },
      widget: {
        type: "picker-info",
        kicker: "MAPA MENTAL EXPANSÍVEL",
        titulo: "Urbanização brasileira",
        layout: "row",
        placeholder: "Abra um nó para expandir o mapa de relações.",
        items: [
          { key: "centro", label: "Centro urbano", info: "Concentra serviços, empregos e decisões, mas também pode expulsar moradores pelo preço da terra." },
          { key: "fluxos", label: "Fluxos", info: "Pessoas, mercadorias, capitais e informações conectam diferentes territórios." },
          { key: "desigualdade", label: "Desigualdade", info: "O acesso à cidade varia conforme renda, raça, gênero e localização da moradia." },
        ],
      },
    },

    filosofia: {
      nome: "Filosofia",
      categoria: "humanas",
      numero: "15",
      icone: "?",
      aliasPattern: /filosofia/i,
      kicker: "CIÊNCIAS HUMANAS / CONCEITOS",
      tagline: "Comece pela pergunta.",
      descricao: "Um laboratório de ideias para argumentar sem perder a curiosidade.",
      tema: {
        ink: "#292532",
        muted: "#77707e",
        paper: "#f4f0f5",
        accent: "#735486",
        soft: "#ecdeef",
        line: "#e2d5e6",
      },
      widget: {
        type: "picker-info",
        kicker: "DIÁLOGO SOCRÁTICO",
        titulo: "O que torna uma decisão justa?",
        layout: "list",
        placeholder: "Escolha uma posição para abrir uma provocação filosófica.",
        items: [
          { key: "A", label: "A intenção de quem decide", info: "A ética da virtude pergunta que tipo de pessoa age e quais hábitos sustentam a decisão." },
          { key: "B", label: "O resultado para a maioria", info: "O utilitarismo avalia consequências e procura maximizar o bem-estar coletivo." },
          { key: "C", label: "O respeito a um princípio", info: "A ética do dever defende princípios que devem valer mesmo quando o resultado é difícil." },
        ],
      },
    },

    sociologia: {
      nome: "Sociologia",
      categoria: "humanas",
      numero: "16",
      icone: "◎",
      aliasPattern: /sociologia/i,
      kicker: "CIÊNCIAS HUMANAS / SOCIEDADE",
      tagline: "Enxergue as estruturas.",
      descricao: "Conecte experiências individuais a forças sociais maiores.",
      tema: {
        ink: "#252d38",
        muted: "#707a86",
        paper: "#f1f3f4",
        accent: "#405b75",
        soft: "#dfe8ef",
        line: "#d5dde4",
      },
      widget: {
        type: "picker-info",
        kicker: "MAPA DE PERSPECTIVAS",
        titulo: "Uma situação cotidiana",
        layout: "row",
        leadingQuote:
          "O acesso à internet muda as chances de estudar, trabalhar e participar da cidade.",
        placeholder: "Escolha uma lente sociológica.",
        items: [
          { key: "renda", label: "Renda", info: "Renda influencia o acesso a dispositivos, conexão estável, tempo livre e oportunidades de formação." },
          { key: "cultura", label: "Cultura", info: "Cultura molda repertórios, identidades e as formas como cada grupo interpreta a tecnologia." },
          { key: "poder", label: "Poder", info: "Poder aparece nas regras que definem quem cria, controla e se beneficia das infraestruturas digitais." },
        ],
      },
    },
  };

  const categorias = {
    linguagens: "Linguagens",
    matematica: "Matemática",
    natureza: "Ciências da Natureza",
    humanas: "Ciências Humanas",
  };

  window.OMINI_DISCIPLINAS = disciplinas;
  window.OMINI_CATEGORIAS = categorias;
})();