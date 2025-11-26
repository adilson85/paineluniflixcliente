export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          cpf: string | null;
          email: string | null;
          data_nascimento: string | null;
          referral_code: string | null;
          referred_by: string | null;
          total_commission: number;
          id_botconversa: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone?: string | null;
          cpf?: string | null;
          email?: string | null;
          data_nascimento?: string | null;
          referral_code?: string | null;
          referred_by?: string | null;
          total_commission?: number;
          id_botconversa?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string | null;
          cpf?: string | null;
          email?: string | null;
          data_nascimento?: string | null;
          referral_code?: string | null;
          referred_by?: string | null;
          total_commission?: number;
          id_botconversa?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Alias para compatibilidade com código existente
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          cpf: string | null;
          email: string | null;
          data_nascimento: string | null;
          referral_code: string | null;
          referred_by: string | null;
          total_commission: number;
          id_botconversa: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone?: string | null;
          cpf?: string | null;
          email?: string | null;
          data_nascimento?: string | null;
          referral_code?: string | null;
          referred_by?: string | null;
          total_commission?: number;
          id_botconversa?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string | null;
          cpf?: string | null;
          email?: string | null;
          data_nascimento?: string | null;
          referral_code?: string | null;
          referred_by?: string | null;
          total_commission?: number;
          id_botconversa?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscription_plans: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          plan_type: 'ponto_unico' | 'ponto_duplo' | 'ponto_triplo';
          simultaneous_logins: number;
          monthly_price: number;
          app_logins: Record<string, any>;
          active: boolean;
          base_price: number | null;
          current_price: number | null;
          has_promotion: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          plan_type: 'ponto_unico' | 'ponto_duplo' | 'ponto_triplo';
          simultaneous_logins?: number;
          monthly_price: number;
          app_logins?: Record<string, any>;
          active?: boolean;
          base_price?: number | null;
          current_price?: number | null;
          has_promotion?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          plan_type?: 'ponto_unico' | 'ponto_duplo' | 'ponto_triplo';
          simultaneous_logins?: number;
          monthly_price?: number;
          app_logins?: Record<string, any>;
          active?: boolean;
          base_price?: number | null;
          current_price?: number | null;
          has_promotion?: boolean;
          created_at?: string;
        };
      };
      recharge_options: {
        Row: {
          id: string;
          plan_type: 'ponto_unico' | 'ponto_duplo' | 'ponto_triplo';
          period: 'mensal' | 'trimestral' | 'semestral' | 'anual';
          duration_months: number;
          price: number;
          display_name: string;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          plan_type: 'ponto_unico' | 'ponto_duplo' | 'ponto_triplo';
          period: 'mensal' | 'trimestral' | 'semestral' | 'anual';
          duration_months: number;
          price: number;
          display_name: string;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          plan_type?: 'ponto_unico' | 'ponto_duplo' | 'ponto_triplo';
          period?: 'mensal' | 'trimestral' | 'semestral' | 'anual';
          duration_months?: number;
          price?: number;
          display_name?: string;
          active?: boolean;
          created_at?: string;
        };
      };
      // Alias para compatibilidade
      recharge_prices: {
        Row: {
          id: string;
          plan_type: 'ponto_unico' | 'ponto_duplo' | 'ponto_triplo';
          period: 'mensal' | 'trimestral' | 'semestral' | 'anual';
          duration_months: number;
          price: number;
          display_name: string;
          active: boolean;
          created_at: string;
          period_label?: string;
          duration_days?: number;
        };
        Insert: {
          id?: string;
          plan_type: 'ponto_unico' | 'ponto_duplo' | 'ponto_triplo';
          period: 'mensal' | 'trimestral' | 'semestral' | 'anual';
          duration_months: number;
          price: number;
          display_name: string;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          plan_type?: 'ponto_unico' | 'ponto_duplo' | 'ponto_triplo';
          period?: 'mensal' | 'trimestral' | 'semestral' | 'anual';
          duration_months?: number;
          price?: number;
          display_name?: string;
          active?: boolean;
          created_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string | null;
          status: 'active' | 'expired' | 'cancelled' | 'suspended';
          app_username: string;
          app_password: string;
          panel_name: string | null;
          expiration_date: string;
          monthly_value: number | null;
          mac_address: string | null;
          device_key: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id?: string | null;
          status?: 'active' | 'expired' | 'cancelled' | 'suspended';
          app_username: string;
          app_password: string;
          panel_name?: string | null;
          expiration_date: string;
          monthly_value?: number | null;
          mac_address?: string | null;
          device_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_id?: string | null;
          status?: 'active' | 'expired' | 'cancelled' | 'suspended';
          app_username?: string;
          app_password?: string;
          panel_name?: string | null;
          expiration_date?: string;
          monthly_value?: number | null;
          mac_address?: string | null;
          device_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Alias para compatibilidade
      user_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string | null;
          status: 'active' | 'expired' | 'cancelled' | 'suspended';
          app_username: string;
          app_password: string;
          panel_name: string | null;
          expiration_date: string;
          monthly_value: number | null;
          mac_address: string | null;
          device_key: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id?: string | null;
          status?: 'active' | 'expired' | 'cancelled' | 'suspended';
          app_username: string;
          app_password: string;
          panel_name?: string | null;
          expiration_date: string;
          monthly_value?: number | null;
          mac_address?: string | null;
          device_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_id?: string | null;
          status?: 'active' | 'expired' | 'cancelled' | 'suspended';
          app_username?: string;
          app_password?: string;
          panel_name?: string | null;
          expiration_date?: string;
          monthly_value?: number | null;
          mac_address?: string | null;
          device_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string | null;
          type: 'subscription' | 'recharge' | 'commission' | 'commission_payout' | 'entrada' | 'saida';
          amount: number;
          payment_method: 'pix' | 'credit_card' | 'debit_card' | 'boleto' | 'manual' | null;
          status: 'pending' | 'completed' | 'failed' | 'cancelled';
          description: string | null;
          metadata: Record<string, any>;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          type: 'subscription' | 'recharge' | 'commission' | 'commission_payout' | 'entrada' | 'saida';
          amount: number;
          payment_method?: 'pix' | 'credit_card' | 'debit_card' | 'boleto' | 'manual' | null;
          status?: 'pending' | 'completed' | 'failed' | 'cancelled';
          description?: string | null;
          metadata?: Record<string, any>;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          type?: 'subscription' | 'recharge' | 'commission' | 'commission_payout' | 'entrada' | 'saida';
          amount?: number;
          payment_method?: 'pix' | 'credit_card' | 'debit_card' | 'boleto' | 'manual' | null;
          status?: 'pending' | 'completed' | 'failed' | 'cancelled';
          description?: string | null;
          metadata?: Record<string, any>;
          created_at?: string;
        };
      };
      referrals: {
        Row: {
          id: string;
          referrer_id: string;
          referred_id: string;
          total_commission_earned: number;
          last_commission_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          referrer_id: string;
          referred_id: string;
          total_commission_earned?: number;
          last_commission_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          referrer_id?: string;
          referred_id?: string;
          total_commission_earned?: number;
          last_commission_date?: string | null;
          created_at?: string;
        };
      };
      raffles: {
        Row: {
          id: string;
          month: string;
          prize_amount: number;
          winner_id: string | null;
          winning_number: number | null;
          draw_date: string | null;
          status: 'active' | 'drawn' | 'paid';
          created_at: string;
        };
        Insert: {
          id?: string;
          month: string;
          prize_amount?: number;
          winner_id?: string | null;
          winning_number?: number | null;
          draw_date?: string | null;
          status?: 'active' | 'drawn' | 'paid';
          created_at?: string;
        };
        Update: {
          id?: string;
          month?: string;
          prize_amount?: number;
          winner_id?: string | null;
          winning_number?: number | null;
          draw_date?: string | null;
          status?: 'active' | 'drawn' | 'paid';
          created_at?: string;
        };
      };
      raffle_entries: {
        Row: {
          id: string;
          raffle_id: string;
          user_id: string;
          lucky_number: number;
          reason: 'payment' | 'referral';
          created_at: string;
        };
        Insert: {
          id?: string;
          raffle_id: string;
          user_id: string;
          lucky_number: number;
          reason: 'payment' | 'referral';
          created_at?: string;
        };
        Update: {
          id?: string;
          raffle_id?: string;
          user_id?: string;
          lucky_number?: number;
          reason?: 'payment' | 'referral';
          created_at?: string;
        };
      };
      testes_liberados: {
        Row: {
          id: string;
          nome: string;
          telefone: string | null;
          email: string | null;
          dispositivo: string | null;
          usuario1: string | null;
          senha1: string | null;
          painel1: string | null;
          data_teste: string; // date
          aplicativo: string | null;
          referral_code: string | null;
          assinante: boolean;
          valor_pago: number;
          quantidade_teste: number;
          created_at: string;
          updated_at: string;
          IDBotconversa: number | null;
          id_botconversa: number | null;
        };
        Insert: {
          id?: string;
          nome: string;
          telefone?: string | null;
          email?: string | null;
          dispositivo?: string | null;
          usuario1?: string | null;
          senha1?: string | null;
          painel1?: string | null;
          data_teste: string; // date format YYYY-MM-DD
          aplicativo?: string | null;
          referral_code?: string | null;
          assinante?: boolean;
          valor_pago?: number;
          quantidade_teste?: number;
          created_at?: string;
          updated_at?: string;
          IDBotconversa?: number | null;
          id_botconversa?: number | null;
        };
        Update: {
          id?: string;
          nome?: string;
          telefone?: string | null;
          email?: string | null;
          dispositivo?: string | null;
          usuario1?: string | null;
          senha1?: string | null;
          painel1?: string | null;
          data_teste?: string;
          aplicativo?: string | null;
          referral_code?: string | null;
          assinante?: boolean;
          valor_pago?: number;
          quantidade_teste?: number;
          created_at?: string;
          updated_at?: string;
          IDBotconversa?: number | null;
          id_botconversa?: number | null;
        };
      };
    };
  };
}
