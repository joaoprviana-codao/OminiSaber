import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: new URL('../../.env', import.meta.url) });

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !secretKey) throw new Error('Configuração administrativa do Supabase incompleta no .env.');

const admin = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
const checks = {
  host: new URL(url).host,
  perfis: false,
  turmaECurso: false,
  camposDoPortal: false,
  tabelasDoPortal: {},
  pronto: false
};

const core = await admin.from('perfis').select('id,turma_id,curso_tecnico,tipo_professor', { head: true, count: 'exact' });
checks.perfis = !core.error;
checks.turmaECurso = !core.error;

const portalColumns = await admin.from('perfis').select('id,email_contato,ativo,primeiro_acesso_pendente,ultimo_acesso_em', { head: true, count: 'exact' });
checks.camposDoPortal = !portalColumns.error;

for (const table of ['descritores_curriculares', 'solicitacoes_acesso', 'gestor_auditoria']) {
  const result = await admin.from(table).select('id', { head: true, count: 'exact' });
  checks.tabelasDoPortal[table] = !result.error;
}

checks.pronto = checks.turmaECurso && checks.camposDoPortal && Object.values(checks.tabelasDoPortal).every(Boolean);
console.log(JSON.stringify(checks, null, 2));

if (!checks.turmaECurso) process.exitCode = 1;
if (!checks.pronto) {
  console.error('\nA base essencial de turma/curso está utilizável, mas o portal completo requer backend/migrations/20260903_portal_gestor.sql.');
}
