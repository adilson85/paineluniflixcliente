/**
 * Script para analisar a estrutura real do banco de dados
 * 
 * Execute com: npm run test:analyze-db
 * 
 * Este script conecta ao Supabase e verifica:
 * - Quais tabelas existem
 * - Quais campos cada tabela tem
 * - Quais funções RPC existem
 * - Compara com o esperado pelo projeto
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
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

const SUPABASE_URL = envVars.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = envVars.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas!');
  console.error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env');
  process.exit(1);
}

// Usa service key se disponível, senão usa anon key
const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY
);

// Tabelas esperadas pelo projeto
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

// Campos esperados por tabela
const EXPECTED_FIELDS: Record<string, string[]> = {
  profiles: ['id', 'full_name', 'phone', 'referral_code', 'referred_by', 'total_commission', 'created_at', 'updated_at'],
  subscription_plans: ['id', 'name', 'description', 'plan_type', 'simultaneous_logins', 'app_logins', 'active', 'created_at'],
  recharge_prices: ['id', 'plan_type', 'period', 'period_label', 'duration_days', 'price', 'created_at'],
  user_subscriptions: ['id', 'user_id', 'plan_id', 'status', 'app_username', 'app_password', 'expiration_date', 'created_at', 'updated_at'],
  transactions: ['id', 'user_id', 'type', 'amount', 'payment_method', 'status', 'description', 'metadata', 'created_at'],
  referrals: ['id', 'referrer_id', 'referred_id', 'total_commission_earned', 'last_commission_date', 'created_at'],
  raffles: ['id', 'month', 'prize_amount', 'winner_id', 'winning_number', 'draw_date', 'status', 'created_at'],
  raffle_entries: ['id', 'raffle_id', 'user_id', 'lucky_number', 'reason', 'created_at'],
};

async function analyzeDatabase() {
  console.log('🔍 Analisando estrutura do banco de dados...\n');
  console.log(`📡 Conectado a: ${SUPABASE_URL}\n`);

  // 1. Verificar tabelas
  console.log('📋 VERIFICANDO TABELAS\n');
  const tableResults: Record<string, { exists: boolean; fields: string[]; missing: string[]; extra: string[] }> = {};

  for (const table of EXPECTED_TABLES) {
    const { data, error } = await supabase.from(table).select('*').limit(0);
    const exists = !error;
    let fields: string[] = [];
    let missing: string[] = [];
    let extra: string[] = [];

    if (exists) {
      // Tenta obter um registro para ver os campos
      const { data: sampleData } = await supabase.from(table).select('*').limit(1);
      if (sampleData && sampleData.length > 0) {
        fields = Object.keys(sampleData[0]);
        const expected = EXPECTED_FIELDS[table] || [];
        missing = expected.filter((f) => !fields.includes(f));
        extra = fields.filter((f) => !expected.includes(f));
      }
    }

    tableResults[table] = { exists, fields, missing, extra };

    if (exists) {
      console.log(`✅ ${table}`);
      if (missing.length > 0) {
        console.log(`   ⚠️  Campos faltando: ${missing.join(', ')}`);
      }
      if (extra.length > 0) {
        console.log(`   ℹ️  Campos extras: ${extra.join(', ')}`);
      }
    } else {
      console.log(`❌ ${table} - NÃO ENCONTRADA`);
    }
  }

  // 2. Verificar funções RPC
  console.log('\n🔧 VERIFICANDO FUNÇÕES RPC\n');
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('generate_referral_code');
    if (rpcError) {
      console.log('❌ generate_referral_code() - NÃO ENCONTRADA');
      console.log(`   Erro: ${rpcError.message}`);
    } else {
      console.log('✅ generate_referral_code() - FUNCIONANDO');
      console.log(`   Retornou: ${rpcData}`);
    }
  } catch (err: any) {
    console.log('❌ generate_referral_code() - NÃO ENCONTRADA');
    console.log(`   Erro: ${err.message}`);
  }

  // 3. Verificar todas as tabelas do banco (pode haver outras)
  console.log('\n📊 TODAS AS TABELAS DO BANCO\n');
  try {
    // Tenta listar todas as tabelas via query SQL (se service key estiver disponível)
    if (SUPABASE_SERVICE_KEY) {
      const { data: tablesData, error: tablesError } = await supabase.rpc('exec_sql', {
        query: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          ORDER BY table_name;
        `,
      });

      if (!tablesError && tablesData) {
        console.log('Tabelas encontradas no banco:');
        (tablesData as any[]).forEach((row: any) => {
          const tableName = row.table_name || Object.values(row)[0];
          const isExpected = EXPECTED_TABLES.includes(tableName);
          console.log(`  ${isExpected ? '✅' : 'ℹ️ '} ${tableName}${isExpected ? ' (esperada)' : ' (não esperada)'}`);
        });
      }
    }
  } catch (err) {
    // Ignora erro se não conseguir listar
  }

  // 4. Resumo
  console.log('\n📝 RESUMO\n');
  const existingTables = Object.values(tableResults).filter((t) => t.exists).length;
  const missingTables = EXPECTED_TABLES.length - existingTables;
  
  console.log(`Tabelas encontradas: ${existingTables}/${EXPECTED_TABLES.length}`);
  if (missingTables > 0) {
    console.log(`⚠️  Tabelas faltando: ${missingTables}`);
    EXPECTED_TABLES.forEach((table) => {
      if (!tableResults[table].exists) {
        console.log(`   - ${table}`);
      }
    });
  }

  // 5. Gerar relatório de adaptação
  console.log('\n🔧 RECOMENDAÇÕES DE ADAPTAÇÃO\n');
  
  const needsAdaptation = Object.entries(tableResults).some(
    ([_, result]) => result.missing.length > 0 || result.extra.length > 0
  );

  if (needsAdaptation) {
    console.log('O banco tem diferenças. Ajuste src/lib/db-config.ts:\n');
    
    Object.entries(tableResults).forEach(([table, result]) => {
      if (result.missing.length > 0 || result.extra.length > 0) {
        console.log(`${table}:`);
        if (result.missing.length > 0) {
          console.log(`  Campos faltando: ${result.missing.join(', ')}`);
          console.log(`  → Torne estes campos opcionais no código`);
        }
        if (result.extra.length > 0) {
          console.log(`  Campos extras: ${result.extra.join(', ')}`);
          console.log(`  → Estes campos podem ser ignorados`);
        }
      }
    });
  } else {
    console.log('✅ Estrutura do banco está compatível com o projeto!');
  }

  // 6. Salvar relatório
  const report = {
    analyzedAt: new Date().toISOString(),
    supabaseUrl: SUPABASE_URL,
    tables: tableResults,
    summary: {
      existing: existingTables,
      missing: missingTables,
      total: EXPECTED_TABLES.length,
    },
  };

  console.log('\n💾 Relatório salvo em: database-analysis.json');
  const { writeFileSync } = await import('fs');
  writeFileSync('database-analysis.json', JSON.stringify(report, null, 2));
}

analyzeDatabase().catch((error) => {
  console.error('❌ Erro ao analisar banco:', error);
  process.exit(1);
});

