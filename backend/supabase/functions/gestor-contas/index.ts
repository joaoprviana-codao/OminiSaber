import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const randomPassword = () => `${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}Aa!7`;

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const secret = Deno.env.get('SUPABASE_SECRET_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!secret) return reply({ error: 'Chave administrativa não configurada na função.' }, 500);

    const authorization = request.headers.get('Authorization') || '';
    const scoped = createClient(url, anon, { global: { headers: { Authorization: authorization } } });
    const { data: auth, error: authError } = await scoped.auth.getUser();
    if (authError || !auth.user) return reply({ error: 'Sessão inválida.' }, 401);
    const { data: manager } = await scoped.from('perfis').select('id,role,ativo').eq('id', auth.user.id).single();
    if (manager?.role !== 'gestor' || manager.ativo === false) return reply({ error: 'Acesso exclusivo do gestor.' }, 403);

    const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
    const body = await request.json();
    const action = String(body.action || '');
    let result: Record<string, unknown> = {};

    if (action === 'create_user') {
      const role = String(body.role || '');
      if (!['aluno', 'professor', 'bibliotecaria', 'gestor'].includes(role)) throw new Error('Tipo de conta inválido.');
      const password = randomPassword();
      const { data, error } = await admin.auth.admin.createUser({ email: body.email, password, email_confirm: true, user_metadata: { nome: body.nome, matricula: body.matricula, role, curso_tecnico: body.curso_tecnico || null, tipo_professor: body.tipo_professor || null, primeiro_acesso_pendente: true } });
      if (error) throw error;
      const profile = { id: data.user.id, nome: body.nome, matricula: body.matricula || null, role, email_contato: body.email, curso_tecnico: role === 'aluno' ? body.curso_tecnico : null, turma_id: role === 'aluno' ? body.turma_id || null : null, tipo_professor: role === 'professor' ? body.tipo_professor : null, ativo: true, primeiro_acesso_pendente: true };
      const { error: profileError } = await admin.from('perfis').upsert(profile); if (profileError) throw profileError;
      result = { userId: data.user.id, temporaryPassword: password };
    } else if (action === 'reset_password') {
      const password = randomPassword();
      const { error } = await admin.auth.admin.updateUserById(body.userId, { password }); if (error) throw error;
      await admin.from('perfis').update({ primeiro_acesso_pendente: true }).eq('id', body.userId);
      result = { temporaryPassword: password };
    } else if (action === 'set_active') {
      const active = Boolean(body.active);
      const { error } = await admin.auth.admin.updateUserById(body.userId, { ban_duration: active ? 'none' : '876000h' }); if (error) throw error;
      await admin.from('perfis').update({ ativo: active }).eq('id', body.userId);
      result = { active };
    } else throw new Error('Ação não reconhecida.');

    await admin.from('solicitacoes_acesso').insert({ usuario_id: body.userId || result.userId, solicitado_por: auth.user.id, tipo: action === 'create_user' ? 'criacao' : action === 'reset_password' ? 'redefinicao' : body.active ? 'desbloqueio' : 'bloqueio', status: 'concluida', concluida_em: new Date().toISOString() });
    await admin.from('gestor_auditoria').insert({ gestor_id: auth.user.id, acao: action, recurso: 'conta', recurso_id: String(body.userId || result.userId || ''), detalhes: { role: body.role || null } });
    return reply(result);
  } catch (error) {
    return reply({ error: error instanceof Error ? error.message : 'Erro interno.' }, 400);
  }
});
