/**
 * Adaptador de Banco de Dados
 * 
 * Este módulo adapta o código para trabalhar com diferentes estruturas de banco,
 * permitindo que o projeto funcione mesmo se houver diferenças entre o esperado
 * e o banco real (usado pelo painel admin).
 */

import { supabase } from './supabase';

/**
 * Verifica se uma tabela existe
 */
export async function tableExists(tableName: string): Promise<boolean> {
  const { error } = await supabase.from(tableName).select('*').limit(0);
  return !error;
}

/**
 * Verifica se um campo existe em uma tabela
 */
export async function fieldExists(tableName: string, fieldName: string): Promise<boolean> {
  const { data, error } = await supabase
    .from(tableName)
    .select(fieldName)
    .limit(0);
  
  return !error && data !== null;
}

/**
 * Mapeamento de campos alternativos
 * Se um campo não existir, tenta usar um alternativo
 */
const fieldMappings: Record<string, Record<string, string>> = {
  profiles: {
    // Se 'full_name' não existir, tenta 'name' ou 'nome'
    full_name: 'name',
    name: 'full_name',
    nome: 'full_name',
  },
  transactions: {
    // Se 'payment_method' não existir, tenta 'method' ou 'metodo'
    payment_method: 'method',
    method: 'payment_method',
    metodo: 'payment_method',
  },
  user_subscriptions: {
    // Adaptações possíveis
    app_username: 'username',
    app_password: 'password',
  },
};

/**
 * Obtém o nome correto do campo, tentando alternativas se necessário
 */
export async function getFieldName(
  tableName: string,
  preferredField: string
): Promise<string> {
  // Primeiro tenta o campo preferido
  if (await fieldExists(tableName, preferredField)) {
    return preferredField;
  }

  // Se não existir, tenta alternativas do mapeamento
  const alternatives = fieldMappings[tableName]?.[preferredField];
  if (alternatives) {
    const altFields = Array.isArray(alternatives) ? alternatives : [alternatives];
    for (const altField of altFields) {
      if (await fieldExists(tableName, altField)) {
        return altField;
      }
    }
  }

  // Se nenhum campo funcionar, retorna o preferido mesmo (vai dar erro, mas é melhor que quebrar silenciosamente)
  console.warn(
    `Campo ${preferredField} não encontrado na tabela ${tableName}. Usando campo preferido mesmo.`
  );
  return preferredField;
}

/**
 * Gera código de indicação único
 * Tenta usar a função RPC do banco, se falhar gera localmente com verificação de unicidade
 */
export async function generateReferralCode(): Promise<string> {
  try {
    // Tenta usar a função RPC do banco (garante unicidade no SQL)
    const { data, error } = await supabase.rpc('generate_referral_code');
    if (!error && data) {
      console.log('✅ Código gerado via RPC:', data);
      return data;
    }
  } catch (err) {
    console.warn('⚠️ Função generate_referral_code não encontrada. Gerando código localmente.');
  }

  // Fallback: gera código localmente com verificação de unicidade
  let attempts = 0;
  const maxAttempts = 50;

  while (attempts < maxAttempts) {
    attempts++;

    // Gera código de 8 caracteres alfanuméricos
    const timestamp = Date.now().toString(36).toUpperCase();
    const random1 = Math.random().toString(36).substring(2, 5).toUpperCase();
    const random2 = Math.random().toString(36).substring(2, 5).toUpperCase();
    const code = `${random1}${timestamp.slice(-2)}${random2}`.substring(0, 8);

    // Verifica se já existe no banco
    const { data: existing, error } = await supabase
      .from('users')
      .select('id')
      .eq('referral_code', code)
      .maybeSingle();

    if (error) {
      console.error('Erro ao verificar código:', error);
      // Se houver erro na verificação, retorna o código mesmo assim
      return code;
    }

    // Se não existe, retorna o código
    if (!existing) {
      console.log('✅ Código gerado localmente:', code);
      return code;
    }

    console.log(`⚠️ Código ${code} já existe. Tentando novamente... (${attempts}/${maxAttempts})`);
  }

  // Se após todas as tentativas não conseguiu, gera um código com timestamp completo
  const fallbackCode = `R${Date.now().toString(36).toUpperCase()}`.substring(0, 8);
  console.warn('⚠️ Usando código fallback:', fallbackCode);
  return fallbackCode;
}

/**
 * Verifica estrutura do banco e retorna informações
 */
export async function checkDatabaseStructure() {
  const tables = [
    'profiles',
    'subscription_plans',
    'recharge_prices',
    'user_subscriptions',
    'transactions',
    'referrals',
    'raffles',
    'raffle_entries',
  ];

  const structure: Record<string, { exists: boolean; fields?: string[] }> = {};

  for (const table of tables) {
    const exists = await tableExists(table);
    structure[table] = { exists };

    if (exists) {
      // Tenta obter campos (limitado, mas útil)
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (!error && data && data.length > 0) {
          structure[table].fields = Object.keys(data[0]);
        }
      } catch (err) {
        // Ignora erros ao tentar listar campos
      }
    }
  }

  return structure;
}

/**
 * Query adaptativa - seleciona apenas campos que existem
 */
export async function adaptiveSelect(
  tableName: string,
  preferredFields: string[],
  filters?: Record<string, any>
) {
  // Verifica quais campos existem
  const existingFields: string[] = [];
  for (const field of preferredFields) {
    const actualField = await getFieldName(tableName, field);
    if (actualField && !existingFields.includes(actualField)) {
      existingFields.push(actualField);
    }
  }

  // Se nenhum campo existir, usa '*'
  const selectFields = existingFields.length > 0 ? existingFields.join(', ') : '*';

  let query = supabase.from(tableName).select(selectFields);

  // Aplica filtros se fornecidos
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });
  }

  return query;
}











