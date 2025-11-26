/**
 * Script de teste completo para validação de códigos de indicação
 * Testa: RPC, unicidade, geração múltipla
 * Execute com: npm run test:referral-codes
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54328';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Credenciais do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║   TESTE COMPLETO - CÓDIGOS DE INDICAÇÃO ÚNICOS           ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

async function test1_FuncaoRPC() {
  console.log('━'.repeat(60));
  console.log('📝 TESTE 1: Função RPC generate_referral_code()');
  console.log('━'.repeat(60));

  try {
    const codes: string[] = [];

    for (let i = 1; i <= 5; i++) {
      const { data, error } = await supabase.rpc('generate_referral_code');

      if (error) {
        console.log(`❌ Tentativa ${i}: ERRO - ${error.message}`);
        return false;
      }

      console.log(`✅ Tentativa ${i}: ${data}`);
      codes.push(data);
    }

    // Verifica se todos são únicos
    const uniqueCodes = new Set(codes);
    if (uniqueCodes.size === codes.length) {
      console.log(`\n✅ SUCESSO: Todos os ${codes.length} códigos são únicos!`);
      return true;
    } else {
      console.log(`\n❌ FALHA: Códigos duplicados encontrados!`);
      return false;
    }
  } catch (err: any) {
    console.log(`❌ ERRO: ${err.message}`);
    return false;
  }
}

async function test2_VerificarDuplicatas() {
  console.log('\n━'.repeat(60));
  console.log('📝 TESTE 2: Verificar Códigos Duplicados no Banco');
  console.log('━'.repeat(60));

  try {
    // Busca todos os códigos
    const { data: allUsers, error } = await supabase
      .from('users')
      .select('id, full_name, referral_code')
      .not('referral_code', 'is', null);

    if (error) {
      console.log(`❌ Erro ao buscar usuários: ${error.message}`);
      return false;
    }

    console.log(`\n📊 Total de usuários com código: ${allUsers?.length || 0}`);

    if (!allUsers || allUsers.length === 0) {
      console.log('ℹ️  Nenhum usuário com código de indicação encontrado');
      return true;
    }

    // Agrupa por código
    const codeMap = new Map<string, any[]>();
    allUsers.forEach(user => {
      if (user.referral_code) {
        if (!codeMap.has(user.referral_code)) {
          codeMap.set(user.referral_code, []);
        }
        codeMap.get(user.referral_code)!.push(user);
      }
    });

    // Verifica duplicatas
    const duplicates: any[] = [];
    codeMap.forEach((users, code) => {
      if (users.length > 1) {
        duplicates.push({ code, users });
      }
    });

    if (duplicates.length === 0) {
      console.log('✅ SUCESSO: Nenhum código duplicado encontrado!');
      return true;
    } else {
      console.log(`\n❌ FALHA: ${duplicates.length} código(s) duplicado(s) encontrado(s):\n`);
      duplicates.forEach(dup => {
        console.log(`   Código: ${dup.code}`);
        dup.users.forEach((u: any) => {
          console.log(`      - ${u.full_name} (ID: ${u.id})`);
        });
        console.log('');
      });
      return false;
    }
  } catch (err: any) {
    console.log(`❌ ERRO: ${err.message}`);
    return false;
  }
}

async function test3_UniqueConstraint() {
  console.log('\n━'.repeat(60));
  console.log('📝 TESTE 3: Constraint UNIQUE em referral_code');
  console.log('━'.repeat(60));

  try {
    // Tenta inserir um usuário com código duplicado (deve falhar)
    const testCode = 'TESTDUP1';

    // Primeiro, cria um usuário com este código
    const { data: user1, error: error1 } = await supabase.auth.signUp({
      email: `test-dup-1-${Date.now()}@test.com`,
      password: 'Test123!@#',
    });

    if (error1) {
      console.log(`⚠️  Não foi possível criar usuário de teste: ${error1.message}`);
      return null; // Não é um erro crítico
    }

    // Insere código na tabela users
    await supabase
      .from('users')
      .update({ referral_code: testCode })
      .eq('id', user1.user!.id);

    console.log(`✅ Usuário 1 criado com código: ${testCode}`);

    // Tenta criar outro usuário com o mesmo código
    const { data: user2, error: error2 } = await supabase.auth.signUp({
      email: `test-dup-2-${Date.now()}@test.com`,
      password: 'Test123!@#',
    });

    if (error2) {
      console.log(`⚠️  Não foi possível criar segundo usuário: ${error2.message}`);
      return null;
    }

    // Tenta inserir o mesmo código (deve falhar)
    const { error: duplicateError } = await supabase
      .from('users')
      .update({ referral_code: testCode })
      .eq('id', user2.user!.id);

    if (duplicateError) {
      if (duplicateError.message.includes('unique') || duplicateError.code === '23505') {
        console.log('✅ SUCESSO: Constraint UNIQUE está funcionando!');
        console.log(`   Erro esperado: ${duplicateError.message}`);

        // Limpa usuários de teste
        await supabase.auth.admin.deleteUser(user1.user!.id);
        await supabase.auth.admin.deleteUser(user2.user!.id);

        return true;
      } else {
        console.log(`❌ Erro inesperado: ${duplicateError.message}`);
        return false;
      }
    } else {
      console.log('⚠️  AVISO: Constraint UNIQUE não impediu a duplicação!');
      console.log('   Recomenda-se adicionar a constraint manualmente.');

      // Limpa usuários de teste
      await supabase.auth.admin.deleteUser(user1.user!.id);
      await supabase.auth.admin.deleteUser(user2.user!.id);

      return false;
    }
  } catch (err: any) {
    console.log(`❌ ERRO: ${err.message}`);
    return false;
  }
}

async function test4_ListarCodigos() {
  console.log('\n━'.repeat(60));
  console.log('📝 TESTE 4: Listar Todos os Códigos Existentes');
  console.log('━'.repeat(60));

  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('full_name, referral_code, created_at')
      .not('referral_code', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.log(`❌ Erro: ${error.message}`);
      return false;
    }

    if (!users || users.length === 0) {
      console.log('ℹ️  Nenhum usuário com código encontrado');
      return true;
    }

    console.log(`\n📋 Últimos ${users.length} códigos gerados:\n`);
    users.forEach((user, i) => {
      const date = new Date(user.created_at).toLocaleDateString('pt-BR');
      console.log(`   ${i + 1}. ${user.referral_code.padEnd(10)} - ${user.full_name} (${date})`);
    });

    return true;
  } catch (err: any) {
    console.log(`❌ ERRO: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log(`🔗 Conectado ao Supabase: ${supabaseUrl}\n`);

  const results = {
    test1: await test1_FuncaoRPC(),
    test2: await test2_VerificarDuplicatas(),
    test3: await test3_UniqueConstraint(),
    test4: await test4_ListarCodigos(),
  };

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║                    RESULTADO FINAL                        ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  console.log(`   1. Função RPC:           ${results.test1 ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log(`   2. Sem Duplicatas:       ${results.test2 ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log(`   3. Constraint UNIQUE:    ${results.test3 === true ? '✅ PASSOU' : results.test3 === false ? '❌ FALHOU' : '⚠️  PULADO'}`);
  console.log(`   4. Listagem:             ${results.test4 ? '✅ PASSOU' : '❌ FALHOU'}`);

  const passed = Object.values(results).filter(r => r === true).length;
  const total = Object.values(results).filter(r => r !== null).length;

  console.log(`\n   Total: ${passed}/${total} testes passaram`);

  if (passed === total) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM! Sistema funcionando corretamente.');
  } else {
    console.log('\n⚠️  Alguns testes falharam. Verifique os logs acima.');
  }

  process.exit(passed === total ? 0 : 1);
}

main().catch(console.error);
