import { History, ArrowUpCircle, ArrowDownCircle, CreditCard } from 'lucide-react';
import { formatDateBR } from '../../utils/dateUtils';

interface Transaction {
  id: string;
  type: 'subscription' | 'recharge' | 'commission' | 'commission_payout';
  amount: number;
  payment_method: 'pix' | 'credit_card' | 'debit_card' | null;
  status: 'pending' | 'completed' | 'failed';
  description: string | null;
  created_at: string;
}

interface TransactionsCardProps {
  transactions: Transaction[];
}

export function TransactionsCard({ transactions }: TransactionsCardProps) {
  // Função para corrigir caracteres corrompidos por problemas de encoding
  const fixEncoding = (text: string | null): string => {
    if (!text) return '';
    
    let fixed = text;
    
    // Remove caracteres Unicode de substituição () 
    fixed = fixed.replace(/\uFFFD/g, '');
    
    // Correções específicas para o padrão exato: "Comiss" + caractere corrompido + "o"
    // Detecta qualquer caractere não-ASCII entre "Comiss" e "o" e substitui por "ão"
    fixed = fixed.replace(/Comiss[^\x00-\x7F]o\s+de\s+indica[^\x00-\x7F]o/gi, 'Comissão de indicação');
    fixed = fixed.replace(/Comiss[^\x00-\x7F]o/gi, 'Comissão');
    fixed = fixed.replace(/indica[^\x00-\x7F]o/gi, 'indicação');
    
    // Também detecta múltiplos caracteres corrompidos
    fixed = fixed.replace(/Comiss[^\x00-\x7F]+o\s+de\s+indica[^\x00-\x7F]+o/gi, 'Comissão de indicação');
    fixed = fixed.replace(/Comiss[^\x00-\x7F]+o/gi, 'Comissão');
    fixed = fixed.replace(/indica[^\x00-\x7F]+o/gi, 'indicação');
    
    // Fallback final: se contém "Comiss" mas não "Comissão", força correção
    if (fixed.toLowerCase().includes('comiss') && !fixed.includes('Comissão') && !fixed.includes('comissão')) {
      fixed = fixed.replace(/Comiss[^\w\s]*o/gi, 'Comissão');
    }
    if (fixed.toLowerCase().includes('indica') && !fixed.includes('indicação') && !fixed.includes('Indicação')) {
      fixed = fixed.replace(/indica[^\w\s]*o/gi, 'indicação');
    }
    
    return fixed;
  };

  const typeConfig = {
    subscription: { label: 'Assinatura', color: 'text-blue-600', icon: CreditCard },
    recharge: { label: 'Recarga', color: 'text-green-600', icon: ArrowUpCircle },
    commission: { label: 'Comissão', color: 'text-purple-600', icon: ArrowDownCircle },
    commission_payout: { label: 'Resgate de Comissão', color: 'text-red-600', icon: ArrowDownCircle },
  };

  const statusConfig = {
    pending: { label: 'Pendente', color: 'text-yellow-600', bg: 'bg-yellow-50' },
    completed: { label: 'Concluído', color: 'text-green-600', bg: 'bg-green-50' },
    failed: { label: 'Falhou', color: 'text-red-600', bg: 'bg-red-50' },
  };

  const paymentMethodLabels = {
    pix: 'PIX',
    credit_card: 'Cartão de Crédito',
    debit_card: 'Cartão de Débito',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-blue-100 rounded-lg">
          <History className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Histórico de Transações</h3>
          <p className="text-sm text-gray-600">Últimas movimentações</p>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nenhuma transação encontrada</p>
          <p className="text-sm text-gray-500 mt-1">
            Suas transações aparecerão aqui
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {transactions.map((transaction) => {
            const typeConf = typeConfig[transaction.type] || { 
              label: transaction.type, 
              color: 'text-gray-600', 
              icon: History 
            };
            const statusConf = statusConfig[transaction.status] || {
              label: transaction.status,
              color: 'text-gray-600',
              bg: 'bg-gray-50'
            };
            const TypeIcon = typeConf.icon;

            const date = formatDateBR(transaction.created_at, {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            });

            return (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-2 ${statusConf.bg} rounded-lg`}>
                    <TypeIcon className={`w-5 h-5 ${typeConf.color}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {fixEncoding(transaction.description) || typeConf.label}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500">{date}</span>
                      {transaction.payment_method && (
                        <>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {paymentMethodLabels[transaction.payment_method]}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`text-lg font-bold ${typeConf.color}`}>
                    {transaction.type === 'commission' ? '+' : ''}R${' '}
                    {Math.abs(transaction.amount).toFixed(2)}
                  </p>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${statusConf.bg} ${statusConf.color}`}
                  >
                    {statusConf.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
