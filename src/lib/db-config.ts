/**
 * Configuração do Banco de Dados
 * 
 * Adapte este arquivo conforme a estrutura real do seu banco de dados.
 * Isso permite que o projeto funcione mesmo com diferenças de nomes de tabelas/campos.
 */

export const DB_CONFIG = {
  /**
   * Nomes das tabelas
   * Mapeamento para as tabelas reais do banco de dados
   */
  tables: {
    profiles: 'users', // Tabela real é 'users'
    subscription_plans: 'subscription_plans',
    recharge_prices: 'recharge_options', // Tabela real é 'recharge_options'
    user_subscriptions: 'subscriptions', // Tabela real é 'subscriptions'
    transactions: 'transactions',
    referrals: 'referrals',
    raffles: 'raffles',
    raffle_entries: 'raffle_entries',
  } as const,

  /**
   * Mapeamento de campos alternativos
   * Se um campo não existir, tenta usar o alternativo
   */
  fieldMappings: {
    profiles: {
      // Tabela 'users' já tem full_name, phone, referral_code, referred_by, total_commission
      full_name: ['full_name', 'name', 'nome', 'fullName'],
      phone: ['phone', 'telefone', 'phone_number'],
      referral_code: ['referral_code', 'referralCode', 'codigo_indicacao'],
      referred_by: ['referred_by', 'referredBy', 'indicado_por'],
      total_commission: ['total_commission', 'totalCommission', 'comissao_total'],
    },
    transactions: {
      payment_method: ['payment_method', 'method', 'metodo_pagamento', 'paymentMethod'],
      description: ['description', 'descricao', 'desc'],
    },
    user_subscriptions: {
      // Tabela 'subscriptions' já tem app_username, app_password, expiration_date
      app_username: ['app_username', 'username', 'usuario', 'appUsername'],
      app_password: ['app_password', 'password', 'senha', 'appPassword'],
      expiration_date: ['expiration_date', 'expirationDate', 'data_expiracao', 'expires_at'],
    },
    recharge_prices: {
      // Tabela 'recharge_options' tem: period, duration_months, price, display_name
      period: ['period'],
      period_label: ['display_name', 'period_label', 'label'],
      duration_days: ['duration_months', 'duration_days'], // recharge_options usa duration_months
      price: ['price'],
    },
  } as const,

  /**
   * Campos opcionais (podem não existir no banco)
   * Se não existirem, o código usa valores padrão
   */
  optionalFields: {
    profiles: ['phone', 'referred_by', 'total_commission', 'cpf', 'email', 'data_nascimento', 'id_botconversa'],
    transactions: ['description', 'metadata'],
    user_subscriptions: ['panel_name', 'monthly_value', 'mac_address', 'device_key'],
    raffles: ['draw_date', 'winner_id', 'winning_number'],
  } as const,
};

/**
 * Obtém o nome da tabela (com fallback)
 */
export function getTableName(key: keyof typeof DB_CONFIG.tables): string {
  return DB_CONFIG.tables[key] || key;
}

/**
 * Obtém campos alternativos para um campo
 */
export function getFieldAlternatives(
  table: keyof typeof DB_CONFIG.fieldMappings,
  field: string
): string[] {
  const mappings = DB_CONFIG.fieldMappings[table];
  if (!mappings) return [];
  
  const alternatives = mappings[field as keyof typeof mappings];
  return alternatives ? (Array.isArray(alternatives) ? alternatives : [alternatives]) : [];
}

