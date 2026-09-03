import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

const envPath = fileURLToPath(new URL('../../.env', import.meta.url));
const clientConfigPath = fileURLToPath(new URL('../ominisaber-supabase-config.js', import.meta.url));
config({ path: envPath });

const supabaseUrl = String(process.env.SUPABASE_URL || '').trim();
const publishableKey = String(process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
const secretKey = String(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

if (!supabaseUrl || !publishableKey) {
  throw new Error('Preencha SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY (ou SUPABASE_ANON_KEY) no arquivo .env.');
}

if (publishableKey === secretKey) {
  throw new Error('A chave pública não pode ser igual à chave secreta do backend.');
}

const output = `// Gerado por: npm --prefix backend run env:sync
// Este arquivo contém somente valores públicos permitidos no navegador.
window.OMINISABER_SUPABASE_CONFIG = {
  url: ${JSON.stringify(supabaseUrl)},
  anonKey: ${JSON.stringify(publishableKey)}
};
`;

await writeFile(clientConfigPath, output, 'utf8');
console.log('Configuração pública do Supabase atualizada com segurança.');
