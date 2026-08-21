// Exemplo para ferramentas JavaScript locais. Não use service_role no navegador.
export const env = {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  appOrigin: process.env.APP_ORIGIN || 'http://localhost:4173'
};
