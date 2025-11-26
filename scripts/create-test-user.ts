/**
 * Script para criar usuário de teste
 * 
 * Execute com: npx tsx scripts/create-test-user.ts
 * 
 * Este script cria:
 * - Usuário de teste no Supabase Auth
 * - Perfil completo
 * - Assinatura ativa
 * - Transações de exemplo
 * - Indicações de teste
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Carrega variáveis do .env
const envPath = join(process.cwd(), '.env');
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
  console.warn('⚠️  Não foi possível ler .env, usando variáveis de ambiente do sistema');
}

// Configuração - lê do .env ou variáveis de ambiente
const SUPABASE_URL = envVars.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // Chave de serviço (não a anon key)

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas!');
  console.error('Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Cliente com service role key (permite criar usuários)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Dados do usuário de teste
const TEST_USER = {
  email: 'teste@uniflix.com',
  password: 'Teste123!@#',
  fullName: 'Usuário de Teste',
  phone: '(47) 99999-9999',
};

async function createTestUser() {
  console.log('🚀 Criando usuário de teste...\n');

  try {
    // 1. Criar usuário no Auth
    console.log('1️⃣ Criando usuário no Auth...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: TEST_USER.email,
      password: TEST_USER.password,
      email_confirm: true, // Confirma email automaticamente
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('⚠️  Usuário já existe. Continuando...');
        // Buscar usuário existente
        const { data: existingUser } = await supabase.auth.admin.listUsers();
        const user = existingUser?.users.find((u) => u.email === TEST_USER.email);
        if (!user) {
          throw new Error('Usuário existe mas não foi encontrado');
        }
        await createUserData(user.id);
        return;
      }
      throw authError;
    }

    if (!authData.user) {
      throw new Error('Usuário não foi criado');
    }

    console.log('✅ Usuário criado:', authData.user.email);
    const userId = authData.user.id;

    // 2. Criar dados do usuário
    await createUserData(userId);

    console.log('\n✅ Usuário de teste criado com sucesso!');
    console.log('\n📋 Credenciais de Login:');
    console.log('   Email:', TEST_USER.email);
    console.log('   Senha:', TEST_USER.password);
    console.log('\n🌐 Acesse: http://localhost:3050');
  } catch (error: any) {
    console.error('❌ Erro ao criar usuário de teste:', error.message);
    process.exit(1);
  }
}

async function createUserData(userId: string) {
  // 2. Gerar código de indicação
  console.log('2️⃣ Gerando código de indicação...');
  let referralCode: string;
  try {
    const { data } = await supabase.rpc('generate_referral_code');
    referralCode = data || `TEST${Date.now()}`;
  } catch {
    // Se RPC não existir, gera localmente
    referralCode = `TEST${Date.now()}`;
  }
  console.log('✅ Código gerado:', referralCode);

  // 3. Criar perfil
  console.log('3️⃣ Criando perfil...');
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    full_name: TEST_USER.fullName,
    phone: TEST_USER.phone,
    referral_code: referralCode,
    referred_by: null,
    total_commission: 0,
  }, { onConflict: 'id' });

  if (profileError) {
    console.warn('⚠️  Erro ao criar perfil (pode já existir):', profileError.message);
  } else {
    console.log('✅ Perfil criado');
  }

  // 4. Buscar ou criar plano de teste
  console.log('4️⃣ Verificando planos...');
  const { data: plans } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('active', true)
    .limit(1);

  if (!plans || plans.length === 0) {
    console.log('⚠️  Nenhum plano ativo encontrado. Criando plano de teste...');
    const { data: newPlan } = await supabase
      .from('subscription_plans')
      .insert({
        name: 'Plano Teste',
        description: 'Plano criado para testes',
        plan_type: 'ponto_unico',
        simultaneous_logins: 1,
        app_logins: {},
        active: true,
      })
      .select()
      .single();

    if (newPlan) {
      await createSubscription(userId, newPlan.id);
    }
  } else {
    await createSubscription(userId, plans[0].id);
  }

  // 5. Criar transações de teste
  console.log('5️⃣ Criando transações de teste...');
  await createTestTransactions(userId);

  // 6. Criar indicações de teste (opcional)
  console.log('6️⃣ Criando indicações de teste...');
  await createTestReferrals(userId);

  console.log('✅ Todos os dados criados!');
}

async function createSubscription(userId: string, planId: string) {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 30); // 30 dias a partir de hoje

  const { error } = await supabase.from('user_subscriptions').upsert({
    user_id: userId,
    plan_id: planId,
    status: 'active',
    app_username: 'teste_user',
    app_password: 'senha_teste_123',
    expiration_date: expirationDate.toISOString(),
  }, { onConflict: 'user_id' });

  if (error) {
    console.warn('⚠️  Erro ao criar assinatura:', error.message);
  } else {
    console.log('✅ Assinatura criada (expira em 30 dias)');
  }
}

async function createTestTransactions(userId: string) {
  const transactions = [
    {
      user_id: userId,
      type: 'recharge' as const,
      amount: 29.90,
      payment_method: 'pix' as const,
      status: 'completed' as const,
      description: 'Recarga Mensal - Teste',
      metadata: { period: 'monthly', duration_days: 30 },
    },
    {
      user_id: userId,
      type: 'recharge' as const,
      amount: 79.90,
      payment_method: 'credit_card' as const,
      status: 'completed' as const,
      description: 'Recarga Trimestral - Teste',
      metadata: { period: 'quarterly', duration_days: 90 },
    },
    {
      user_id: userId,
      type: 'commission_payout' as const,
      amount: 7.99,
      payment_method: null,
      status: 'completed' as const,
      description: 'Comissão de Indicação - Teste',
      metadata: {},
    },
  ];

  for (const transaction of transactions) {
    const { error } = await supabase.from('transactions').insert(transaction);
    if (error) {
      console.warn('⚠️  Erro ao criar transação:', error.message);
    }
  }

  console.log(`✅ ${transactions.length} transações criadas`);
}

async function createTestReferrals(userId: string) {
  // Criar usuários fictícios indicados
  const referredUsers = [
    { name: 'Indicado 1', phone: '(47) 88888-8888' },
    { name: 'Indicado 2', phone: '(47) 77777-7777' },
  ];

  for (const referred of referredUsers) {
    // Criar perfil fictício (sem auth, apenas para teste)
    const referredId = `test-${Date.now()}-${Math.random()}`;
    
    try {
      await supabase.from('profiles').insert({
        id: referredId,
        full_name: referred.name,
        phone: referred.phone,
        referral_code: `REF${Date.now()}`,
        referred_by: userId,
        total_commission: 0,
      });

      await supabase.from('referrals').insert({
        referrer_id: userId,
        referred_id: referredId,
        total_commission_earned: 7.99,
        last_commission_date: new Date().toISOString(),
      });
    } catch (error: any) {
      console.warn('⚠️  Erro ao criar indicação:', error.message);
    }
  }

  console.log(`✅ ${referredUsers.length} indicações criadas`);
}

// Executar
createTestUser();

