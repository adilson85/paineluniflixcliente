import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ============================================================
// VALIDAÇÃO CRÍTICA DE VARIÁVEIS DE AMBIENTE
// ============================================================
// Impede inicialização do cliente se variáveis não estiverem configuradas
if (!supabaseUrl) {
  const errorMsg = '❌ VITE_SUPABASE_URL não está configurada! Crie um arquivo .env.local com: VITE_SUPABASE_URL=<sua-url-do-supabase>';
  console.error(errorMsg);
  throw new Error(errorMsg);
}

if (!supabaseAnonKey) {
  const errorMsg = '❌ VITE_SUPABASE_ANON_KEY não está configurada! Crie um arquivo .env.local com a chave anon do Supabase';
  console.error(errorMsg);
  throw new Error(errorMsg);
}

// Log apenas em desenvolvimento
if (import.meta.env.DEV) {
  console.log('✅ Supabase Config:', {
    url: supabaseUrl.substring(0, 30) + '...',
    hasKey: true,
  });
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
