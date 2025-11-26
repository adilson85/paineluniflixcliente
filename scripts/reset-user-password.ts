/**
 * Script para resetar senha do usuário de teste
 * 
 * Execute com: npx tsx scripts/reset-user-password.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Carrega variáveis do .env
const envPath = join(process.cwd(), '.env.local');
let envVars: Record<string, string> = {};

try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });
} catch (error) {
  console.warn('⚠️  Não foi possível ler .env.local, usando variáveis de ambiente do sistema');
}

const SUPABASE_URL = envVars.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'http://localhost:54328';
const SUPABASE_SERVICE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas!');
  console.error('Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Cliente com service role key (permite gerenciar usuários)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const TEST_USER = {
  email: 'teste@uniflix.com',
  password: 'Teste123!@#',
};

async function resetPassword() {
  console.log('🔐 Resetando senha do usuário de teste...\n');

  try {
    // Buscar usuário existente
    console.log('1️⃣ Buscando usuário...');
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw listError;
    }

    const user = usersData?.users.find((u) => u.email === TEST_USER.email);
    
    if (!user) {
      console.error('❌ Usuário não encontrado!');
      process.exit(1);
    }

    console.log('✅ Usuário encontrado:', user.email);
    console.log('   ID:', user.id);

    // Atualizar senha
    console.log('\n2️⃣ Atualizando senha...');
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        password: TEST_USER.password,
        email_confirm: true,
      }
    );

    if (updateError) {
      throw updateError;
    }

    console.log('✅ Senha atualizada com sucesso!');
    console.log('\n📋 Credenciais de Login:');
    console.log('   Email:', TEST_USER.email);
    console.log('   Senha:', TEST_USER.password);
    console.log('\n🧪 Testando login...');

    // Testar login
    const testClient = createClient(SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0');
    
    const { data: signInData, error: signInError } = await testClient.auth.signInWithPassword({
      email: TEST_USER.email,
      password: TEST_USER.password,
    });

    if (signInError) {
      console.error('❌ Erro ao testar login:', signInError.message);
      process.exit(1);
    }

    console.log('✅ Login testado com sucesso!');
    console.log('   User ID:', signInData.user?.id);
    console.log('\n🌐 Agora você pode fazer login em: http://localhost:3050');

  } catch (error: any) {
    console.error('❌ Erro ao resetar senha:', error.message);
    process.exit(1);
  }
}

resetPassword();










