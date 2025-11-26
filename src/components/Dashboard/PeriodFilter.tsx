import { Calendar } from 'lucide-react';

export type PeriodOption = 'current_month' | 'last_month' | 'last_3_months' | 'all' | 'custom';

interface PeriodFilterProps {
  selectedPeriod: PeriodOption;
  onPeriodChange: (period: PeriodOption) => void;
  customStartDate?: string;
  customEndDate?: string;
  onCustomDatesChange?: (startDate: string, endDate: string) => void;
}

export function PeriodFilter({
  selectedPeriod,
  onPeriodChange,
  customStartDate,
  customEndDate,
  onCustomDatesChange,
}: PeriodFilterProps) {
  const periodOptions: { value: PeriodOption; label: string }[] = [
    { value: 'current_month', label: 'Mês Atual' },
    { value: 'last_month', label: 'Mês Passado' },
    { value: 'last_3_months', label: 'Últimos 3 Meses' },
    { value: 'all', label: 'Todos' },
    { value: 'custom', label: 'Período Personalizado' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex items-center gap-3 mb-3">
        <Calendar className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Filtrar por Período</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
        {periodOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onPeriodChange(option.value)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedPeriod === option.value
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {selectedPeriod === 'custom' && onCustomDatesChange && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
              Data Inicial
            </label>
            <input
              type="date"
              id="startDate"
              value={customStartDate || ''}
              onChange={(e) => onCustomDatesChange(e.target.value, customEndDate || '')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
              Data Final
            </label>
            <input
              type="date"
              id="endDate"
              value={customEndDate || ''}
              onChange={(e) => onCustomDatesChange(customStartDate || '', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Retorna as datas de início e fim baseado no período selecionado
 */
export function getPeriodDates(
  period: PeriodOption,
  customStart?: string,
  customEnd?: string
): { startDate: Date | null; endDate: Date | null } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case 'current_month': {
      // Primeiro dia do mês atual
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      // Último dia do mês atual
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      return { startDate, endDate };
    }

    case 'last_month': {
      // Primeiro dia do mês passado
      const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      // Último dia do mês passado
      const endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { startDate, endDate };
    }

    case 'last_3_months': {
      // Primeiro dia de 3 meses atrás
      const startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      // Fim de hoje
      const endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      return { startDate, endDate };
    }

    case 'custom': {
      if (customStart && customEnd) {
        const startDate = new Date(customStart);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(customEnd);
        endDate.setHours(23, 59, 59, 999);
        return { startDate, endDate };
      }
      return { startDate: null, endDate: null };
    }

    case 'all':
    default:
      return { startDate: null, endDate: null };
  }
}

/**
 * Filtra array de dados por período
 */
export function filterByPeriod<T extends { created_at?: string | Date }>(
  data: T[],
  period: PeriodOption,
  customStart?: string,
  customEnd?: string
): T[] {
  const { startDate, endDate } = getPeriodDates(period, customStart, customEnd);

  if (!startDate || !endDate) {
    return data; // Retorna todos se não há filtro
  }

  return data.filter((item) => {
    if (!item.created_at) return false;

    const itemDate = new Date(item.created_at);
    return itemDate >= startDate && itemDate <= endDate;
  });
}
