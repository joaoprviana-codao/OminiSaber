import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: new URL('../../.env', import.meta.url) });
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !secretKey) throw new Error('Configuração administrativa ausente no .env.');
const admin = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });

const bucket = await admin.storage.getBucket('biblioteca-pdfs');
if (bucket.error) {
  const created = await admin.storage.createBucket('biblioteca-pdfs', { public: false, fileSizeLimit: 52428800, allowedMimeTypes: ['application/pdf'] });
  if (created.error) throw created.error;
} else {
  const updated = await admin.storage.updateBucket('biblioteca-pdfs', { public: false, fileSizeLimit: 52428800, allowedMimeTypes: ['application/pdf'] });
  if (updated.error) throw updated.error;
}

console.log(JSON.stringify({ host: new URL(url).host, privatePdfBucket: true }, null, 2));
