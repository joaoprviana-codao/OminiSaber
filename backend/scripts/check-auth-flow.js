import crypto from 'node:crypto';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: new URL('../../.env', import.meta.url) });

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const publicKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

if (!url || !serviceKey || !publicKey) {
  throw new Error('Preencha SUPABASE_URL, a chave pública e a service role no .env.');
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const suffix = crypto.randomUUID().slice(0, 8);
const email = `login-check-${suffix}@ominisaber.invalid`;
const password = `Tmp!${crypto.randomBytes(18).toString('base64url')}`;
let userId = null;

const result = {
  cadastro: false,
  login: false,
  loginMatricula: false,
  perfilProtegido: false,
  papel: null,
  curso: null,
  limpeza: false
};

try {
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      nome: 'Validação automatizada de login',
      matricula: `CHECK-${suffix}`,
      curso_tecnico: 'informatica'
    }
  });
  if (created.error) throw created.error;
  userId = created.data.user.id;
  result.cadastro = true;

  const browserClient = createClient(url, publicKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const signedIn = await browserClient.auth.signInWithPassword({ email, password });
  if (signedIn.error) throw signedIn.error;
  result.login = Boolean(signedIn.data.session);

  const profile = await browserClient
    .from('perfis')
    .select('role,curso_tecnico,turmas!perfis_turma_id_fkey(id,nome,serie,ano_letivo)')
    .eq('id', userId)
    .single();
  if (profile.error) throw profile.error;
  result.perfilProtegido = true;
  result.papel = profile.data.role;
  result.curso = profile.data.curso_tecnico;
  await browserClient.auth.signOut();

  const resolvedEmail = await browserClient.rpc('email_por_matricula', { matricula_input: `CHECK-${suffix}` });
  if (resolvedEmail.error) throw resolvedEmail.error;
  const signedInByRegistration = await browserClient.auth.signInWithPassword({
    email: resolvedEmail.data,
    password
  });
  if (signedInByRegistration.error) throw signedInByRegistration.error;
  result.loginMatricula = Boolean(signedInByRegistration.data.session);
  await browserClient.auth.signOut();
} finally {
  if (userId) {
    const removed = await admin.auth.admin.deleteUser(userId);
    result.limpeza = !removed.error;
  }
}

console.log(JSON.stringify(result, null, 2));

if (!result.cadastro || !result.login || !result.loginMatricula || !result.perfilProtegido || !result.limpeza) {
  process.exitCode = 1;
}
