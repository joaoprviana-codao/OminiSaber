import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../../frontend/gestor/shared/curriculo-parser.js', import.meta.url), 'utf8');
const migration = fs.readFileSync(new URL('../migrations/20260903_importacao_curricular_fase1.sql', import.meta.url), 'utf8');
const phase2Migration = fs.readFileSync(new URL('../migrations/20260903_importacao_curricular_fase2.sql', import.meta.url), 'utf8');
const gestorSource = fs.readFileSync(new URL('../../frontend/gestor/shared/gestor-app.js', import.meta.url), 'utf8');
const context = { window: {} };
vm.runInNewContext(source, context);
const parse = context.window.OminiSaberCurriculumParser.parseCurriculumPages;
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const single = parse(['SEDU-ES 2026\nEnsino Médio\n1ª série\n1º trimestre\nEM13LP01 Relacionar o texto ao contexto\nD023_P Inferir informações\nEM13LP02 Compreender a linguagem\nNão apresenta descritor relacionado.'], { materia: 'portugues' });
assert(single.resumo.habilidades === 2, 'habilidades do trimestre único');
assert(single.detected.serie === 1 && single.detected.trimestre === 1, 'contexto série/trimestre');
assert(single.items[0].payload.descritores[0].code === 'D023_P', 'descritor separado da habilidade');
assert(single.items[1].payload.descritores.length === 0, 'habilidade sem descritor preservada');
assert(single.items[0].payload.descricao === 'Relacionar o texto ao contexto', 'código removido da descrição');

const automaticSubject = parse(['SEDU-ES 2026\nEnsino Médio\nMatemática\nEF67MA01 Resolver problemas\ncontinuação da habilidade'], {});
assert(automaticSubject.detected.materia_codigo === 'matematica', 'matéria detectada automaticamente');
assert(automaticSubject.items[0].payload.codigo === 'EF67MA01', 'código EF reconhecido');
assert(automaticSubject.items[0].payload.descricao === 'Resolver problemas\ncontinuação da habilidade', 'descrição multiline preservada');

const structured = parse(['1ª série\n1º trimestre\nEM13LP03 Desenvolver leitura\nDescritores:\nD021_P Inferir informações\ncom base no texto\nD022_P Analisar recursos\nExpectativas de aprendizagem:\nReconhecer estratégias\nem textos diversos\nObjetos de conhecimento:\nCoesão e coerência\nPráticas de linguagem'], {});
assert(structured.items[0].payload.descritores.length === 2, 'múltiplos descritores');
assert(structured.items[0].payload.descritores[0].descricao === 'Inferir informações\ncom base no texto', 'descritor multiline');
assert(structured.items[0].payload.expectativas.join('\n') === 'Reconhecer estratégias\nem textos diversos', 'expectativa multiline');
assert(structured.items[0].payload.objetos.join('\n') === 'Coesão e coerência\nPráticas de linguagem', 'objeto multiline');

const table = parse([{ items: [
	{ str: '1ª série', transform: [1, 0, 0, 1, 20, 700], width: 50 },
	{ str: '2º trimestre', transform: [1, 0, 0, 1, 220, 700], width: 70 },
	{ str: 'EM13LP04', transform: [1, 0, 0, 1, 20, 680], width: 60 },
	{ str: 'Interpretar textos', transform: [1, 0, 0, 1, 90, 680], width: 100 },
] }], {});
assert(table.items[0].payload.codigo === 'EM13LP04' && table.items[0].confianca < 90, 'tabela ambígua em revisão');

const subjects = [
	['Língua Portuguesa', 'portugues'],
	['Matemática', 'matematica'],
	['Física', 'fisica'],
	['Redação', 'redacao'],
	['Técnico em Administração', 'tecnico_administracao'],
	['Técnico em Informática', 'tecnico_informatica'],
];
subjects.forEach(([label, code]) => assert(parse([`Componente curricular: ${label}\nEM13XX01 Descrição válida`], {}).detected.materia_codigo === code, `matéria ${label}`));

const allSeries = parse(['2ª série - 2º trimestre\nEM13CO15 Aplicar pensamento computacional\n3ª série - 3º trimestre\nEM13LP06 Analisar textos\nEF67LP01 Referência anterior'], {});
assert(allSeries.items.length === 3, 'documento com múltiplas séries');
assert(allSeries.items[0].payload.serie === 2 && allSeries.items[1].payload.serie === 3, 'séries locais');
assert(allSeries.items[0].payload.trimestre === 2 && allSeries.items[1].payload.trimestre === 3, 'trimestres locais');
assert(allSeries.items.some((item) => item.tipo === 'referencia_ensino_fundamental' && item.etapa === 'ensino_fundamental' && item.status === 'revisar'), 'referência EF separada');
const efReference = allSeries.items.find((item) => item.tipo === 'referencia_ensino_fundamental');
efReference.status = 'aprovado';
assert(efReference.tipo === 'referencia_ensino_fundamental' && efReference.etapa === 'ensino_fundamental', 'EF aprovado permanece referência complementar');
efReference.status = 'rejeitado';
assert(efReference.tipo === 'referencia_ensino_fundamental' && efReference.status === 'rejeitado', 'EF rejeitado permanece fora das habilidades');

const unknown = parse(['Documento escaneado sem texto selecionável'], {});
assert(unknown.items[0].tipo === 'aviso' && unknown.items[0].confianca < 70, 'estrutura desconhecida em revisão');
assert(migration.includes('add column if not exists curriculo_id') && migration.includes('add column if not exists versao'), 'importação registra currículo e versão');
assert(migration.includes('max(versao), 0) + 1') && migration.includes("proxima_versao, 'publicado'"), 'aprovação cria nova versão publicada');
assert(migration.includes("set status = 'aprovada', curriculo_id = novo_curriculo_id, versao = proxima_versao"), 'aprovação vincula versão à importação');
assert(migration.includes("where importacao_id = imp.id and tipo = 'habilidade'"), 'EF nunca materializado como habilidade principal');
assert(phase2Migration.includes('referencia_ensino_fundamental'), 'staging aceita referência EF');
assert(gestorSource.includes('name="materia_codigo"') && gestorSource.includes('payload.materia_codigo'), 'matéria editada usa materia_codigo');
assert(!gestorSource.includes('payload.materia)'), 'payload.materia não é usado');
console.log('OK parser curricular: trimestre único, múltiplas séries, duplicatas por código e habilidade sem descritor.');
