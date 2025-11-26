/**
 * Script para adicionar códigos de indicação em usuários existentes
 * que ainda não possuem código
 * Execute com: npm run fix:existing-codes
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
console.log('║   CORRIGIR USUÁRIOS EXISTENTES SEM CÓDIGO DE INDICAÇÃO   ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

async function main() {
  console.log(`🔗 Conectado ao Supabase: ${supabaseUrl}\n`);

  // 1. Buscar usuários sem código de indicação
  console.log('📋 Buscando usuários sem código de indicação...\n');

  const { data: usersWithoutCode, error: fetchError } = await supabase
    .from('users')
    .select('id, full_name, email')
    .is('referral_code', null);

  if (fetchError) {
    console.error('❌ Erro ao buscar usuários:', fetchError.message);
    process.exit(1);
  }

  if (!usersWithoutCode || usersWithoutCode.length === 0) {
    console.log('✅ Todos os usuários já possuem código de indicação!');
    process.exit(0);
  }

  console.log(`📊 Encontrados ${usersWithoutCode.length} usuário(s) sem código:\n`);
  usersWithoutCode.forEach((user, i) => {
    console.log(`   ${i + 1}. ${user.full_name || 'Sem nome'} (${user.email || user.id})`);
  });

  console.log('\n━'.repeat(60));
  console.log('🔧 Gerando códigos de indicação...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const user of usersWithoutCode) {
    try {
      // Tenta gerar código via RPC
      const { data: newCode, error: rpcError } = await supabase.rpc('generate_referral_code');

      if (rpcError || !newCode) {
        console.log(`❌ ${user.full_name || user.email}: Erro ao gerar código - ${rpcError?.message || 'código vazio'}`);
        errorCount++;
        continue;
      }

      // Atualiza o usuário com o novo código
      const { error: updateError } = await supabase
        .from('users')
        .update({ referral_code: newCode })
        .eq('id', user.id);

      if (updateError) {
        console.log(`❌ ${user.full_name || user.email}: Erro ao atualizar - ${updateError.message}`);
        errorCount++;
        continue;
      }

      console.log(`✅ ${user.full_name || user.email}: ${newCode}`);
      successCount++;
    } catch (err: any) {
      console.log(`❌ ${user.full_name || user.email}: Erro inesperado - ${err.message}`);
      errorCount++;
    }
  }

  console.log('\n━'.repeat(60));
  console.log('📊 RESULTADO FINAL:\n');
  console.log(`   ✅ Sucesso: ${successCount} usuário(s)`);
  console.log(`   ❌ Erro:    ${errorCount} usuário(s)`);
  console.log(`   📋 Total:   ${usersWithoutCode.length} usuário(s)`);

  if (successCount === usersWithoutCode.length) {
    console.log('\n🎉 Todos os usuários foram corrigidos com sucesso!');
  } else if (successCount > 0) {
    console.log('\n⚠️  Alguns usuários foram corrigidos, mas houve erros.');
  } else {
    console.log('\n❌ Nenhum usuário foi corrigido. Verifique os erros acima.');
  }

  // Lista os usuários atualizados
  if (successCount > 0) {
    console.log('\n━'.repeat(60));
    console.log('📋 Verificando usuários atualizados...\n');

    const { data: updatedUsers, error: verifyError } = await supabase
      .from('users')
      .select('full_name, email, referral_code')
      .in('id', usersWithoutCode.map(u => u.id))
      .not('referral_code', 'is', null);

    if (!verifyError && updatedUsers && updatedUsers.length > 0) {
      console.log('✅ Códigos gerados:\n');
      updatedUsers.forEach((user, i) => {
        console.log(`   ${i + 1}. ${user.referral_code} - ${user.full_name || user.email}`);
      });
    }
  }

  process.exit(errorCount > 0 ? 1 : 0);
}

main().catch(console.error);
