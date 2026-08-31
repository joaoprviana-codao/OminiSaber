import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no backend/.env.');
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const users = [
  { username: 'useraluno', email: 'useraluno@ominisaber.test', password: 'senha123aluno', role: 'aluno', nome: 'Usuário Aluno' },
  { username: 'profmatematica', email: 'profmatematica@ominisaber.test', password: 'senha123matematica', role: 'professor', tipoProfessor: 'matematica', nome: 'Marcos Nogueira' },
  { username: 'profportugues', email: 'profportugues@ominisaber.test', password: 'senha123portugues', role: 'professor', tipoProfessor: 'portugues', nome: 'Helena Costa' },
  { username: 'profadministracao', email: 'profadministracao@ominisaber.test', password: 'senha123administracao', role: 'professor', tipoProfessor: 'tecnico_administracao', nome: 'Renata Alves' },
  { username: 'profinformatica', email: 'profinformatica@ominisaber.test', password: 'senha123informatica', role: 'professor', tipoProfessor: 'tecnico_informatica', nome: 'Caio Martins' },
  { username: 'userbibliotecaria', email: 'userbibliotecaria@ominisaber.test', password: 'senha123bibliotecaria', role: 'bibliotecaria', nome: 'Usuária Bibliotecária' },
  { username: 'usergestor', email: 'usergestor@ominisaber.test', password: 'senha123gestor', role: 'gestor', nome: 'Usuário Gestor' }
];

const findUser = async (email) => {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const found = data.users.find((user) => user.email === email);
    if (found) return found;
    if (data.users.length < 1000) break;
  }
  return null;
};

for (const definition of users) {
  let user = await findUser(definition.email);
  if (user) {
    const { data, error } = await admin.auth.admin.updateUserById(user.id, {
      password: definition.password,
      email_confirm: true,
      user_metadata: { nome: definition.nome, matricula: definition.username }
    });
    if (error) throw error;
    user = data.user;
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: definition.email,
      password: definition.password,
      email_confirm: true,
      user_metadata: { nome: definition.nome, matricula: definition.username }
    });
    if (error) throw error;
    user = data.user;
  }

  const { error: profileError } = await admin.from('perfis').upsert({
    id: user.id,
    nome: definition.nome,
    matricula: definition.username,
    role: definition.role,
    tipo_professor: definition.tipoProfessor || null
  }, { onConflict: 'id' });
  if (profileError) throw profileError;

  console.log(`${definition.role}: ${definition.username} / ${definition.password}`);
}

console.log('Usuários de teste criados/atualizados com sucesso.');
