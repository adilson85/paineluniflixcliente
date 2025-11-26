import { useEffect, useState } from 'react';
import { CheckCircle, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function PaymentSuccess() {
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState<any>(null);

  // Extrai transaction_id da URL
  const urlParams = new URLSearchParams(window.location.search);
  const transactionId = urlParams.get('transaction_id');

  useEffect(() => {
    if (!transactionId) {
      window.location.href = '/';
      return;
    }

    // Verifica o status da transação
    const checkTransaction = async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (error || !data) {
        console.error('Erro ao buscar transação:', error);
        window.location.href = '/';
        return;
      }

      setTransaction(data);
      setLoading(false);

      // Se o status ainda estiver pendente, aguarda alguns segundos e verifica novamente
      if (data.status === 'pending') {
        setTimeout(() => {
          checkTransaction();
        }, 3000);
      } else {
        // Redireciona para o dashboard após 3 segundos
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      }
    };

    checkTransaction();
  }, [transactionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verificando pagamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {transaction?.status === 'completed' ? (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Pagamento Aprovado!</h1>
            <p className="text-gray-600 mb-6">
              Seu pagamento foi processado com sucesso. Sua assinatura foi atualizada.
            </p>
            {transaction && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-gray-600 mb-1">Valor pago:</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {transaction.amount.toFixed(2)}
                </p>
              </div>
            )}
            <p className="text-sm text-gray-500 mb-4">
              Redirecionando para o dashboard...
            </p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader className="w-12 h-12 text-yellow-600 animate-spin" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Processando Pagamento</h1>
            <p className="text-gray-600 mb-6">
              Estamos verificando o status do seu pagamento. Isso pode levar alguns instantes.
            </p>
            <p className="text-sm text-gray-500">
              Aguarde enquanto processamos...
            </p>
          </>
        )}
      </div>
    </div>
  );
}

