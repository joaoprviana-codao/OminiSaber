(() => {
  const SKILL_RE = /\b(?:EM|EF)\d{2}[A-Z]{2}\d{2}\b/gi;
  const DESCRIPTOR_RE = /\bD\d{3}(?:_[A-Z])?\b/gi;
  const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
  const unique = (values) => [...new Set(values.map(clean).filter(Boolean))];
  const first = (value, pattern) => String(value || '').match(pattern)?.[1] || null;
  const normalizeLines = (values) => values.map((value) => String(value || '').trim()).filter(Boolean).join('\n');
  const context = (text) => ({
    serie: /(?:1ª|1a|1º|1o)\s*(?:série|serie)/i.test(text) ? 1 : /(?:2ª|2a|2º|2o)\s*(?:série|serie)/i.test(text) ? 2 : /(?:3ª|3a|3º|3o)\s*(?:série|serie)/i.test(text) ? 3 : null,
    trimestre: /(?:1º|1o|1ª|1a)\s*trimestre/i.test(text) ? 1 : /(?:2º|2o|2ª|2a)\s*trimestre/i.test(text) ? 2 : /(?:3º|3o|3ª|3a)\s*trimestre/i.test(text) ? 3 : null,
    quinzena: first(text, /(\d+ª?\s*quinzena)/i),
    semana: first(text, /(\d+ª?\s*semana)/i),
  });
  const detectSubject = (text) => {
    const normalized = String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const rules = [
      ['tecnico_informatica', /informatica|programacao|banco de dados|redes de computadores|computacao/],
      ['tecnico_administracao', /administracao|gestao|empreendedorismo|marketing|financas/],
      ['redacao', /redacao|producao textual|texto dissertativo/],
      ['matematica', /matematica|algebra|geometria|estatistica/],
      ['fisica', /fisica|mecanica|termodinamica|eletromagnetismo/],
      ['portugues', /lingua portuguesa|portugues|literatura|linguagens/],
    ];
    return rules.find(([, pattern]) => pattern.test(normalized))?.[0] || null;
  };
  const confidence = ({ code, description, serie, trimestre }) => {
    let score = code ? 55 : 15;
    if (description.length >= 20) score += 20;
    if (serie) score += 12;
    if (trimestre) score += 8;
    return Math.min(score, 99);
  };
  const itemStatus = (score) => score >= 90 ? 'ok' : 'revisar';

  const parseCurriculumPages = (pages, options = {}) => {
    const lines = pages.flatMap((page, pageIndex) => String(page || '').split(/\r?\n/).map((line) => ({ line, page: pageIndex + 1 })));
    const text = lines.map((entry) => entry.line).join('\n');
    const detected = {
      origem: options.origem || (/(SEDU|secretaria de estado da educação)/i.test(text) ? 'SEDU-ES' : null),
      ano_letivo: Number(options.ano || first(text, /\b(20\d{2})\b/)) || null,
      modalidade: /ensino\s+m[eé]dio/i.test(text) ? 'Ensino Médio' : null,
      materia_codigo: options.materia || detectSubject(text),
      ...context(text),
    };
    const matches = [];
    lines.forEach((entry, index) => {
      const regex = new RegExp(SKILL_RE.source, 'ig');
      let match;
      while ((match = regex.exec(entry.line))) matches.push({ code: match[0].toUpperCase(), index, page: entry.page, offset: match.index });
    });
    const items = matches.map((match, matchIndex) => {
      const end = matches[matchIndex + 1]?.index ?? lines.length;
      let contextStart = match.index;
      const previousSkill = matches[matchIndex - 1]?.index ?? -1;
      for (let lineIndex = match.index - 1; lineIndex > previousSkill; lineIndex -= 1) {
        if (/(?:série|serie|trimestre)/i.test(lines[lineIndex].line)) contextStart = lineIndex;
      }
      const block = lines.slice(contextStart, end).map((entry) => entry.line).join('\n');
      const firstLine = lines[match.index]?.line || '';
      const firstLineDescription = firstLine.slice(match.offset + match.code.length);
      const remainingLines = [];
      for (const entry of lines.slice(match.index + 1, end)) {
        if (/\bD\d{3}(?:_[A-Z])?\b/i.test(entry.line) || /\bdescritor(?:es)?\b/i.test(entry.line)) break;
        remainingLines.push(entry.line);
      }
      const description = normalizeLines([firstLineDescription, ...remainingLines].map((value) => value.replace(/^[\s:–-]+/, '').split(/(?:descritor(?:es)?|expectativa(?:s)?|objeto(?:s)?\s+de\s+conhecimento)/i)[0]));
      const local = context(block);
      const descriptors = unique(block.match(DESCRIPTOR_RE) || []).map((code) => ({ code: code.toUpperCase(), descricao: '' }));
      const score = confidence({ ...local, code: match.code, description });
      return {
        tipo: 'habilidade',
        source_page: match.page,
        confianca: score,
        status: itemStatus(score),
        payload: {
          codigo: match.code,
          descricao: description || 'Descrição não identificada; revisar documento original.',
          serie: local.serie || detected.serie,
          trimestre: local.trimestre || detected.trimestre,
          quinzena: local.quinzena,
          semana: local.semana,
          descritores: descriptors,
          expectativas: unique((block.match(/expectativa(?:s)?(?: de aprendizagem)?\s*[:\-]?\s*([^\n]+)/ig) || []).map((value) => value.replace(/^.*?[:\-]\s*/, ''))),
          objetos: unique((block.match(/objeto(?:s)?\s+(?:de\s+)?conhecimento\s*[:\-]?\s*([^\n]+)/ig) || []).map((value) => value.replace(/^.*?[:\-]\s*/, ''))),
        },
      };
    });
    if (!items.length) items.push({ tipo: 'aviso', source_page: 1, confianca: 20, status: 'revisar', payload: { mensagem: 'Nenhuma habilidade com código EM ou EF foi identificada.' } });
    return { detected, items, resumo: { habilidades: items.filter((item) => item.tipo === 'habilidade').length, descritores: unique(items.flatMap((item) => item.payload.descritores || []).map((item) => item.code)).length, paginas: pages.length } };
  };
  window.OminiSaberCurriculumParser = { parseCurriculumPages, confidence, itemStatus, detectSubject };
})();
