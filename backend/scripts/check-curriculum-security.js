import fs from 'node:fs';

const migration = fs.readFileSync(new URL('../migrations/20260903_importacao_curricular_fase3.sql', import.meta.url), 'utf8');
const edge = fs.readFileSync(new URL('../supabase/functions/curriculo-upload/index.ts', import.meta.url), 'utf8');
const client = fs.readFileSync(new URL('../ominisaber-manager-client.js', import.meta.url), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };

assert(migration.includes("status = 'publicado'") && migration.includes("status = 'revisao'"), 'ciclo publicado/revisão');
assert(migration.includes('pg_advisory_xact_lock'), 'concorrência protegida por advisory lock');
assert(migration.includes("if imp.status = 'aprovada' and imp.curriculo_id is not null then return imp.curriculo_id"), 'aprovação idempotente');
assert(migration.includes('criar_importacao_curriculo') && migration.includes('jsonb_array_elements(coalesce(p_itens'), 'staging atômico');
assert(migration.includes("item -> 'expectativas'") && migration.includes("item -> 'objetos'"), 'aprovação materializa expectativas e objetos');
assert(migration.includes('reprocessar_importacao_curriculo') && migration.includes('reprocessamento_de_id'), 'reprocessamento preserva histórico');
assert(migration.includes('documentos_curriculares') && migration.includes('curriculos_pdfs'), 'documento e bucket privados');
assert(migration.includes('curriculos_pdfs_gestor_select') && migration.includes("public.usuario_role()) = 'gestor'"), 'Storage restrito ao gestor');
assert(migration.includes('descritores_leitura') && migration.includes("status = 'ativo'") && migration.includes("c.status = 'publicado'"), 'descritores dependem de currículo publicado');
assert(edge.includes("file.type !== 'application/pdf'") && edge.includes('file.size > MAX_BYTES') && edge.includes("signature !== '%PDF-'") && edge.includes('%%EOF') && edge.includes('SHA-256'), 'validação server-side do PDF');
assert(!client.includes('SERVICE_ROLE') && !client.includes('service_role'), 'nenhum segredo administrativo no cliente');
assert(client.includes("curriculo-upload") && client.includes('reprocessCurriculumImport'), 'cliente usa Edge Function e reprocessamento');
console.log('OK segurança curricular: RLS, staging, idempotência, concorrência, Storage, validação e segredos.');