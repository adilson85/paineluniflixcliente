import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface WithdrawalStatusProps {
  userId: string;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  metadata: {
    redeem_type: string;
    requested_at: string;
    pix_key?: string | null;
    admin_notes?: string | null;
    approved_at?: string | null;
  };
}

export function WithdrawalStatus({ userId }: WithdrawalStatusProps) {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWithdrawals();
  }, [userId]);

  const loadWithdrawals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'commission_payout')
        .eq('payment_method', 'pix')
        .in('status', ['pending', 'completed', 'cancelled'])
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Erro ao carregar solicitações de resgate:', error);
      } else {
        setWithdrawals(data as WithdrawalRequest[]);
      }
    } catch (err) {
      console.error('Erro ao carregar solicitações:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (withdrawals.length === 0) {
    return null;
  }

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-3 bg-blue-100 rounded-lg">
          <AlertCircle className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Solicitações de Resgate</h3>
          <p className="text-sm text-gray-600">
            {pendingWithdrawals.length > 0
              ? `${pendingWithdrawals.length} ${pendingWithdrawals.length === 1 ? 'pendente' : 'pendentes'}`
              : 'Histórico de resgates'}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {withdrawals.map((withdrawal) => {
          const isPending = withdrawal.status === 'pending';
          const isCompleted = withdrawal.status === 'completed';
          const isCancelled = withdrawal.status === 'cancelled';

          return (
            <div
              key={withdrawal.id}
              className={`p-4 rounded-lg border-2 ${
                isPending
                  ? 'border-yellow-200 bg-yellow-50'
                  : isCompleted
                  ? 'border-green-200 bg-green-50'
                  : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {isPending ? (
                      <Clock className="w-5 h-5 text-yellow-600" />
                    ) : isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span
                      className={`text-sm font-semibold ${
                        isPending
                          ? 'text-yellow-800'
                          : isCompleted
                          ? 'text-green-800'
                          : 'text-red-800'
                      }`}
                    >
                      {isPending
                        ? 'Em Análise'
                        : isCompleted
                        ? 'Aprovado e Pago'
                        : 'Cancelado'}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm">
                    <p className="text-gray-900">
                      <strong>Valor:</strong>{' '}
                      <span className="text-lg font-bold">
                        R$ {withdrawal.amount.toFixed(2)}
                      </span>
                    </p>
                    <p className="text-gray-600">
                      <strong>Solicitado em:</strong>{' '}
                      {new Date(withdrawal.created_at).toLocaleString('pt-BR')}
                    </p>
                    {withdrawal.metadata?.approved_at && (
                      <p className="text-gray-600">
                        <strong>{isCompleted ? 'Pago' : 'Cancelado'} em:</strong>{' '}
                        {new Date(withdrawal.metadata.approved_at).toLocaleString('pt-BR')}
                      </p>
                    )}
                    {withdrawal.metadata?.admin_notes && (
                      <p className="text-gray-600 mt-2">
                        <strong>Observação:</strong> {withdrawal.metadata.admin_notes}
                      </p>
                    )}
                  </div>

                  {isPending && (
                    <div className="mt-3 p-3 bg-yellow-100 rounded-lg">
                      <p className="text-xs text-yellow-800">
                        ℹ️ Sua solicitação está sendo analisada. Entraremos em contato em breve via WhatsApp.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
