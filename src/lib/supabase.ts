import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validação das variáveis de ambiente
if (!supabaseUrl) {
  console.error('❌ VITE_SUPABASE_URL não está configurada!');
  console.error('Crie um arquivo .env.local com: VITE_SUPABASE_URL=<sua-url-do-supabase>');
}

if (!supabaseAnonKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY não está configurada!');
  console.error('Crie um arquivo .env.local com a chave anon do Supabase');
}

// Log apenas em desenvolvimento
if (import.meta.env.DEV) {
  console.log('🔧 Supabase Config:', {
    url: supabaseUrl || 'NÃO CONFIGURADA',
    hasKey: !!supabaseAnonKey,
  });
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
