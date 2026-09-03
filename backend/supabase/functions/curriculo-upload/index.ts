import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const MAX_BYTES = 50 * 1024 * 1024;
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const hexHash = async (bytes: Uint8Array) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map((byte) => byte.toString(16).padStart(2, '0')).join('');

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    if (request.method !== 'POST') return reply({ error: 'Método não permitido.' }, 405);
    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SECRET_KEY');
    if (!secret) return reply({ error: 'Chave administrativa não configurada na função.' }, 500);
    const authorization = request.headers.get('Authorization') || '';
    const scoped = createClient(url, anon, { global: { headers: { Authorization: authorization } } });
    const { data: auth, error: authError } = await scoped.auth.getUser();
    if (authError || !auth.user) return reply({ error: 'Sessão inválida.' }, 401);
    const { data: profile } = await scoped.from('perfis').select('role,ativo').eq('id', auth.user.id).single();
    if (profile?.role !== 'gestor' || profile.ativo === false) return reply({ error: 'Acesso exclusivo do gestor.' }, 403);

    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return reply({ error: 'PDF obrigatório.' }, 400);
    if (!file.name.toLowerCase().endsWith('.pdf') || file.type !== 'application/pdf') return reply({ error: 'Apenas PDF application/pdf é aceito.' }, 400);
    if (file.size <= 0 || file.size > MAX_BYTES) return reply({ error: 'PDF vazio ou maior que 50 MB.' }, 400);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const signature = new TextDecoder().decode(bytes.slice(0, 5));
    if (signature !== '%PDF-' || !new TextDecoder().decode(bytes.slice(-1024)).includes('%%EOF')) return reply({ error: 'Arquivo inválido: assinatura PDF ausente ou finalização inválida.' }, 400);
    const hash = await hexHash(bytes);
    const extractedText = String(form.get('texto') || '');
    if (!extractedText.trim()) return reply({ error: 'PDF sem texto selecionável.' }, 400);
    const reprocessamentoDeId = String(form.get('reprocessamento_de_id') || '') || null;
    if (!reprocessamentoDeId) {
      const { data: duplicate } = await scoped.from('importacoes_curriculo').select('*,importacoes_curriculo_itens(*)').eq('arquivo_hash_sha256', hash).is('reprocessamento_de_id', null).maybeSingle();
      if (duplicate) return reply({ duplicate: true, importacao_id: duplicate.id, importacao: duplicate, items: duplicate.importacoes_curriculo_itens || [] }, 200);
    }
    const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
    const storagePath = `${auth.user.id}/${crypto.randomUUID()}.pdf`;
    const upload = await admin.storage.from('curriculos-pdfs').upload(storagePath, file, { contentType: 'application/pdf', upsert: false });
    if (upload.error) throw upload.error;
    let documentoId: string | null = null;
    try {
      const documento = await admin.from('documentos_curriculares').insert({ storage_path: storagePath, nome_arquivo: file.name, mime_type: file.type, tamanho_bytes: file.size, arquivo_hash_sha256: hash, origem: form.get('origem') || null, ano_letivo: form.get('ano') ? Number(form.get('ano')) : null, materia_codigo: form.get('materia_codigo') || null, criado_por: auth.user.id }).select('id').single();
      if (documento.error) throw documento.error;
      documentoId = documento.data.id;
      const items = JSON.parse(String(form.get('itens') || '[]'));
      const { data: importacaoId, error: stageError } = await scoped.rpc('criar_importacao_curriculo', { p_documento_id: documentoId, p_nome_arquivo: file.name, p_hash: hash, p_tamanho: file.size, p_origem: form.get('origem') || null, p_ano: form.get('ano') ? Number(form.get('ano')) : null, p_materia: form.get('materia_codigo') || null, p_trimestre: form.get('trimestre') ? Number(form.get('trimestre')) : null, p_resumo: JSON.parse(String(form.get('resumo') || '{}')), p_texto: extractedText, p_itens: items, p_reprocessamento_de_id: reprocessamentoDeId });
      if (stageError) throw stageError;
      const { data: staged } = await scoped.from('importacoes_curriculo').select('documento_id').eq('id', importacaoId).single();
      if (staged?.documento_id !== documentoId) { await admin.storage.from('curriculos-pdfs').remove([storagePath]); await admin.from('documentos_curriculares').delete().eq('id', documentoId); }
      const { data: importacao, error: readError } = await scoped.from('importacoes_curriculo').select('*,importacoes_curriculo_itens(*)').eq('id', importacaoId).single();
      if (readError) throw readError;
      return reply({ importacao_id: importacaoId, arquivo_hash_sha256: hash, importacao, items: importacao.importacoes_curriculo_itens || [] });
    } catch (error) {
      await admin.storage.from('curriculos-pdfs').remove([storagePath]);
      if (documentoId) await admin.from('documentos_curriculares').delete().eq('id', documentoId);
      throw error;
    }
  } catch (error) {
    return reply({ error: error instanceof Error ? error.message : 'Erro interno.' }, 400);
  }
});
