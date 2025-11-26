/**
 * Script para analisar banco usando Supabase CLI
 * 
 * Execute com: npm run test:analyze-db-cli
 * 
 * Requer: npx supabase login (se ainda não estiver autenticado)
 */

import { execSync } from 'child_process';
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
  console.error('❌ Erro ao ler .env:', error);
  process.exit(1);
}

const SUPABASE_URL = envVars.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';

if (!SUPABASE_URL) {
  console.error('❌ VITE_SUPABASE_URL não encontrado no .env');
  process.exit(1);
}

// Extrai project ref da URL
const projectRefMatch = SUPABASE_URL.match(/https?:\/\/([^.]+)\.supabase\.co/);
if (!projectRefMatch) {
  console.error('❌ Não foi possível extrair project ref da URL:', SUPABASE_URL);
  process.exit(1);
}

const projectRef = projectRefMatch[1];

console.log('🔍 Analisando banco de dados usando Supabase CLI...\n');
console.log(`📡 Projeto: ${projectRef}`);
console.log(`🔗 URL: ${SUPABASE_URL}\n`);

// Tabelas esperadas
const EXPECTED_TABLES = [
  'profiles',
  'subscription_plans',
  'recharge_prices',
  'user_subscriptions',
  'transactions',
  'referrals',
  'raffles',
  'raffle_entries',
];

function execCommand(command: string, description?: string): string | null {
  try {
    if (description) {
      console.log(`\n${description}...`);
    }
    const output = execSync(command, { 
      encoding: 'utf-8', 
      stdio: 'pipe',
      maxBuffer: 10 * 1024 * 1024 // 10MB
    });
    return output.trim();
  } catch (error: any) {
    if (description) {
      console.log(`⚠️  ${description} - Erro: ${error.message.split('\n')[0]}`);
    }
    return null;
  }
}

async function analyzeDatabase() {
  console.log('='.repeat(60));
  console.log('📊 ANÁLISE COMPLETA DO BANCO DE DADOS');
  console.log('='.repeat(60));

  // 1. Verificar autenticação
  console.log('\n1️⃣ Verificando autenticação...');
  const authCheck = execCommand('npx supabase projects list', 'Verificando login');
  if (!authCheck) {
    console.log('\n❌ Não autenticado no Supabase CLI');
    console.log('💡 Execute: npx supabase login');
    process.exit(1);
  }
  console.log('✅ Autenticado');

  // 2. Listar todas as tabelas do projeto
  console.log('\n2️⃣ Listando todas as tabelas do banco...');
  const listTablesSQL = `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `;
  
  const tablesResult = execCommand(
    `npx supabase db execute --project-id ${projectRef} "${listTablesSQL.replace(/\s+/g, ' ').trim()}"`,
    'Executando query SQL'
  );

  if (tablesResult) {
    console.log('\n📋 Tabelas encontradas:');
    const lines = tablesResult.split('\n').filter(l => l.trim());
    lines.forEach((line, idx) => {
      if (idx === 0) return; // Header
      const tableName = line.trim().split(/\s+/)[0];
      if (tableName) {
        const isExpected = EXPECTED_TABLES.includes(tableName);
        console.log(`  ${isExpected ? '✅' : 'ℹ️ '} ${tableName}${isExpected ? ' (esperada)' : ' (não esperada)'}`);
      }
    });
  }

  // 3. Para cada tabela esperada, verificar estrutura
  console.log('\n\n3️⃣ Verificando estrutura das tabelas esperadas...');
  console.log('='.repeat(60));

  const tableAnalysis: Record<string, any> = {};

  for (const table of EXPECTED_TABLES) {
    console.log(`\n📊 Tabela: ${table}`);
    
    // Verificar se existe
    const existsSQL = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '${table}'
      );
    `;
    
    const existsResult = execCommand(
      `npx supabase db execute --project-id ${projectRef} "${existsSQL.replace(/\s+/g, ' ').trim()}"`,
      'Verificando existência'
    );

    if (existsResult && existsResult.includes('t')) {
      console.log('  ✅ Tabela existe');

      // Listar campos
      const fieldsSQL = `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = '${table}'
        ORDER BY ordinal_position;
      `;

      const fieldsResult = execCommand(
        `npx supabase db execute --project-id ${projectRef} "${fieldsSQL.replace(/\s+/g, ' ').trim()}"`,
        'Listando campos'
      );

      if (fieldsResult) {
        console.log('\n  📝 Campos:');
        const lines = fieldsResult.split('\n');
        lines.forEach((line, idx) => {
          if (idx === 0) return; // Header
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 2) {
            const fieldName = parts[0];
            const dataType = parts[1];
            const nullable = parts[2] === 't' ? 'NULL' : 'NOT NULL';
            console.log(`    - ${fieldName} (${dataType}, ${nullable})`);
          }
        });
      }

      tableAnalysis[table] = { exists: true };
    } else {
      console.log('  ❌ Tabela NÃO existe');
      tableAnalysis[table] = { exists: false };
    }
  }

  // 4. Verificar funções RPC
  console.log('\n\n4️⃣ Verificando funções RPC...');
  console.log('='.repeat(60));

  const functionsSQL = `
    SELECT 
      routine_name,
      routine_type,
      data_type as return_type
    FROM information_schema.routines
    WHERE routine_schema = 'public' 
    AND routine_type = 'FUNCTION'
    ORDER BY routine_name;
  `;

  const functionsResult = execCommand(
    `npx supabase db execute --project-id ${projectRef} "${functionsSQL.replace(/\s+/g, ' ').trim()}"`,
    'Listando funções'
  );

  if (functionsResult) {
    console.log('\n📝 Funções encontradas:');
    const lines = functionsResult.split('\n');
    lines.forEach((line, idx) => {
      if (idx === 0) return; // Header
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 1) {
        const funcName = parts[0];
        const isExpected = funcName === 'generate_referral_code';
        console.log(`  ${isExpected ? '✅' : 'ℹ️ '} ${funcName}${isExpected ? ' (esperada)' : ''}`);
      }
    });
  }

  // Verificar especificamente generate_referral_code
  const checkRPC = execCommand(
    `npx supabase db execute --project-id ${projectRef} "SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_referral_code');"`,
    'Verificando generate_referral_code'
  );

  if (checkRPC && checkRPC.includes('t')) {
    console.log('\n✅ generate_referral_code() existe');
  } else {
    console.log('\n❌ generate_referral_code() NÃO existe');
  }

  // 5. Resumo
  console.log('\n\n5️⃣ RESUMO');
  console.log('='.repeat(60));

  const existingCount = Object.values(tableAnalysis).filter((t: any) => t.exists).length;
  const missingCount = EXPECTED_TABLES.length - existingCount;

  console.log(`\n📊 Tabelas encontradas: ${existingCount}/${EXPECTED_TABLES.length}`);
  
  if (missingCount > 0) {
    console.log(`\n⚠️  Tabelas faltando (${missingCount}):`);
    EXPECTED_TABLES.forEach((table) => {
      if (!tableAnalysis[table]?.exists) {
        console.log(`   - ${table}`);
      }
    });
  } else {
    console.log('\n✅ Todas as tabelas esperadas existem!');
  }

  // 6. Salvar relatório
  const report = {
    analyzedAt: new Date().toISOString(),
    projectRef,
    supabaseUrl: SUPABASE_URL,
    tables: tableAnalysis,
    summary: {
      existing: existingCount,
      missing: missingCount,
      total: EXPECTED_TABLES.length,
    },
  };

  const { writeFileSync } = await import('fs');
  writeFileSync('database-analysis-cli.json', JSON.stringify(report, null, 2));
  console.log('\n💾 Relatório salvo em: database-analysis-cli.json');

  console.log('\n' + '='.repeat(60));
  console.log('✅ Análise concluída!');
  console.log('='.repeat(60));
}

analyzeDatabase().catch((error) => {
  console.error('\n❌ Erro na análise:', error.message);
  if (error.message.includes('not authenticated')) {
    console.log('\n💡 Execute: npx supabase login');
  }
  process.exit(1);
});
