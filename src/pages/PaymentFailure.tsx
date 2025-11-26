import { useEffect } from 'react';
import { XCircle, ArrowLeft } from 'lucide-react';

export function PaymentFailure() {
  // Extrai transaction_id da URL
  const urlParams = new URLSearchParams(window.location.search);
  const transactionId = urlParams.get('transaction_id');

  useEffect(() => {
    // Redireciona para o dashboard após 10 segundos
    const timer = setTimeout(() => {
      window.location.href = '/';
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-12 h-12 text-red-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Pagamento Não Aprovado</h1>
        <p className="text-gray-600 mb-6">
          Infelizmente, seu pagamento não foi aprovado. Por favor, tente novamente ou entre em contato conosco.
        </p>
        {transactionId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-600 mb-1">ID da Transação:</p>
            <p className="text-sm font-mono text-gray-900 break-all">{transactionId}</p>
          </div>
        )}
        <div className="space-y-3">
          <button
            onClick={() => window.location.href = '/'}
            className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Voltar ao Dashboard
          </button>
          <button
            onClick={() => window.history.back()}
            className="w-full py-3 px-4 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Tentar Novamente</span>
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-6">
          Redirecionando automaticamente em 10 segundos...
        </p>
      </div>
    </div>
  );
}

