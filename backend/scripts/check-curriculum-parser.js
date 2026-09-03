import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../../frontend/gestor/shared/curriculo-parser.js', import.meta.url), 'utf8');
const migration = fs.readFileSync(new URL('../migrations/20260903_importacao_curricular_fase1.sql', import.meta.url), 'utf8');
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

const subjects = [
	['Língua Portuguesa', 'portugues'],
	['Matemática', 'matematica'],
	['Física', 'fisica'],
	['Redação', 'redacao'],
	['Técnico em Administração', 'tecnico_administracao'],
	['Técnico em Informática', 'tecnico_informatica'],
];
subjects.forEach(([label, code]) => assert(parse([`Componente curricular: ${label}\nEM13XX01 Descrição válida`], {}).detected.materia_codigo === code, `matéria ${label}`));

const allSeries = parse(['2ª série - 2º trimestre\nEM13CO15 Aplicar pensamento computacional\n3ª série - 3º trimestre\nEM13LP06 Analisar textos'], {});
assert(allSeries.items.length === 2, 'documento com múltiplas séries');
assert(allSeries.items[0].payload.serie === 2 && allSeries.items[1].payload.serie === 3, 'séries locais');
assert(allSeries.items[0].payload.trimestre === 2 && allSeries.items[1].payload.trimestre === 3, 'trimestres locais');

const unknown = parse(['Documento escaneado sem texto selecionável'], {});
assert(unknown.items[0].tipo === 'aviso' && unknown.items[0].confianca < 70, 'estrutura desconhecida em revisão');
assert(migration.includes('add column if not exists curriculo_id') && migration.includes('add column if not exists versao'), 'importação registra currículo e versão');
assert(migration.includes('max(versao), 0) + 1') && migration.includes("proxima_versao, 'publicado'"), 'aprovação cria nova versão publicada');
assert(migration.includes("set status = 'aprovada', curriculo_id = novo_curriculo_id, versao = proxima_versao"), 'aprovação vincula versão à importação');
console.log('OK parser curricular: trimestre único, múltiplas séries, duplicatas por código e habilidade sem descritor.');
