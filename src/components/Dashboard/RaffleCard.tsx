import { Ticket, Trophy, Calendar } from 'lucide-react';
import { formatDateBR } from '../../utils/dateUtils';

interface RaffleCardProps {
  currentRaffle: {
    id: string;
    month: string;
    prize_amount: number;
    status: string;
    draw_date: string | null;
  } | null;
  userEntries: Array<{
    lucky_number: number;
    reason: string;
  }>;
}

export function RaffleCard({ currentRaffle, userEntries }: RaffleCardProps) {
  if (!currentRaffle) {
    return null;
  }

  const monthDate = new Date(currentRaffle.month);
  const monthName = monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const drawDate = currentRaffle.draw_date
    ? formatDateBR(currentRaffle.draw_date, {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : 'A definir';

  const paymentEntries = userEntries.filter((e) => e.reason === 'payment');
  const referralEntries = userEntries.filter((e) => e.reason === 'referral');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <Trophy className="w-8 h-8" />
          <div>
            <h3 className="text-2xl font-bold">Sorteio Mensal</h3>
            <p className="text-amber-100">{monthName}</p>
          </div>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-amber-400">
          <span className="text-amber-100">Prêmio</span>
          <span className="text-3xl font-bold">R$ {currentRaffle.prize_amount.toFixed(2)}</span>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <Ticket className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-blue-900">{userEntries.length}</p>
            <p className="text-sm text-blue-700">Números da Sorte</p>
          </div>

          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
            <Calendar className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-xl font-bold text-green-900">{paymentEntries.length}</p>
            <p className="text-sm text-green-700">Por Pagamentos</p>
          </div>

          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
            <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-xl font-bold text-purple-900">{referralEntries.length}</p>
            <p className="text-sm text-purple-700">Por Indicações</p>
          </div>
        </div>

        {userEntries.length > 0 ? (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Seus Números da Sorte</h4>
            <div className="flex flex-wrap gap-2">
              {userEntries.map((entry, index) => (
                <div
                  key={index}
                  className={`px-4 py-2 rounded-lg font-bold text-white ${
                    entry.reason === 'payment'
                      ? 'bg-gradient-to-br from-green-500 to-green-600'
                      : 'bg-gradient-to-br from-purple-500 to-purple-600'
                  }`}
                >
                  {entry.lucky_number}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Você ainda não tem números da sorte este mês</p>
            <p className="text-sm text-gray-500 mt-1">
              Faça recargas e indique amigos para participar!
            </p>
          </div>
        )}

        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className="w-5 h-5 text-amber-600" />
            <span className="font-semibold text-amber-900">Data do Sorteio:</span>
          </div>
          <p className="text-amber-800">{drawDate}</p>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Como participar:</strong>
          </p>
          <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
            <li>Mantenha seus pagamentos em dia</li>
            <li>Faça recargas durante o mês</li>
            <li>Ganhe números extras indicando amigos</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Users(props: { className: string }) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}
