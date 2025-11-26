/**
 * Script para aplicar migrations no banco de dados local
 * Execute com: npm run apply:migrations
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54328';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada no .env.local');
  process.exit(1);
}

// Cliente com service role (bypass RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration(filePath: string, migrationName: string) {
  console.log(`\n📄 Aplicando migration: ${migrationName}`);
  console.log('━'.repeat(60));

  try {
    // Lê o arquivo SQL
    const sql = readFileSync(filePath, 'utf-8');

    // Divide em comandos separados por ';' (básico, pode precisar melhorar)
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];

      // Pula comentários e comandos vazios
      if (!command || command.startsWith('--')) continue;

      console.log(`\n🔄 Executando comando ${i + 1}/${commands.length}...`);

      // Executa o comando SQL via RPC
      // Nota: Supabase JS não tem método direto para SQL arbitrário
      // Precisamos usar a API REST diretamente
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ query: command + ';' }),
      });

      if (!response.ok) {
        // Se exec_sql não existir, tenta executar diretamente
        // Vamos usar uma abordagem alternativa
        console.log('⚠️ Método RPC não disponível, tentando abordagem alternativa...');

        // Para migrations que só criam funções, podemos tentar via supabase.rpc
        // Mas isso é limitado. Melhor executar manualmente.
        throw new Error('Execute a migration manualmente no SQL Editor do Supabase Dashboard');
      }

      const result = await response.json();
      console.log('✅ Comando executado com sucesso');
    }

    console.log(`\n✅ Migration ${migrationName} aplicada com sucesso!`);
  } catch (error: any) {
    console.error(`\n❌ Erro ao aplicar migration ${migrationName}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║     APLICAR MIGRATIONS - CORREÇÃO CÓDIGOS INDICAÇÃO  ║');
  console.log('╚═══════════════════════════════════════════════════════╝');

  console.log(`\n🔗 Conectando ao Supabase: ${supabaseUrl}`);

  const migrationsDir = join(process.cwd(), 'supabase', 'migrations');

  const migrations = [
    {
      file: '20250121_fix_generate_referral_code.sql',
      name: 'Corrigir função generate_referral_code',
    },
    {
      file: '20250121_add_unique_constraint_referral_code.sql',
      name: 'Adicionar constraint UNIQUE',
    },
  ];

  console.log('\n📋 Migrations a serem aplicadas:');
  migrations.forEach((m, i) => {
    console.log(`   ${i + 1}. ${m.name}`);
  });

  console.log('\n⚠️  IMPORTANTE:');
  console.log('   Este script não pode executar SQL diretamente via Supabase JS.');
  console.log('   Você precisa aplicar as migrations manualmente no SQL Editor.');
  console.log('\n📝 INSTRUÇÕES:');
  console.log('   1. Abra o Supabase Dashboard: http://localhost:54328');
  console.log('   2. Vá em SQL Editor');
  console.log('   3. Copie e cole o conteúdo de cada migration:');

  migrations.forEach((m, i) => {
    const filePath = join(migrationsDir, m.file);
    console.log(`\n   Migration ${i + 1}: ${m.name}`);
    console.log(`   Arquivo: ${filePath}`);
    console.log(`   ─────────────────────────────────────────────────────`);

    try {
      const content = readFileSync(filePath, 'utf-8');
      console.log(content);
      console.log(`   ─────────────────────────────────────────────────────`);
    } catch (err) {
      console.error(`   ❌ Erro ao ler arquivo: ${err}`);
    }
  });

  console.log('\n✅ Após executar as migrations, execute o teste:');
  console.log('   npm run test:create-user\n');
}

main().catch(console.error);
