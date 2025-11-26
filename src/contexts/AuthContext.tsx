import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { generateReferralCode } from '../lib/db-adapter';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, phone?: string, cpf?: string, referralCode?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, phone?: string, cpf?: string, referralCode?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (!error && data.user) {
      // Gera código de indicação (usa RPC se existir, senão gera localmente)
      const referralCodeGenerated = await generateReferralCode();

      let referredBy = null;
      if (referralCode) {
        const { data: referrer } = await supabase
          .from('users')
          .select('id')
          .eq('referral_code', referralCode)
          .maybeSingle();

        referredBy = referrer?.id || null;
      }

      // Insere perfil na tabela users (campos opcionais podem não existir no banco)
      const profileData: any = {
        id: data.user.id,
        full_name: fullName,
        referral_code: referralCodeGenerated,
        email: email, // Salva email no perfil também
      };

      // Adiciona campos opcionais apenas se fornecidos
      if (phone) {
        profileData.phone = phone;
      }
      if (cpf) {
        profileData.cpf = cpf;
      }
      if (referredBy) {
        profileData.referred_by = referredBy;
      }

      await supabase.from('users').insert(profileData);

      // Cria referral se houver indicador
      if (referredBy) {
        await supabase.from('referrals').insert({
          referrer_id: referredBy,
          referred_id: data.user.id,
        }).catch((err) => {
          // Ignora erro se tabela referrals não existir ou já houver registro
          console.warn('Erro ao criar referral:', err);
        });
      }
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
