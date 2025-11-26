import { CreditCard, Smartphone, Plus, Check, Receipt, ExternalLink, Tag } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { createMercadoPagoPreference } from '../../lib/mercadopago';

interface RechargePrice {
  id: string;
  period: string;
  period_label: string;
  duration_days: number;
  duration_months?: number;
  price: number;
  original_price?: number;
  has_promotion?: boolean;
  promotion_name?: string;
}

interface Promotion {
  id: string;
  name: string;
  promotion_type: 'percentage' | 'fixed_amount';
  apply_to: string;
  apply_to_period: 'all_periods' | 'mensal' | 'trimestral' | 'semestral' | 'anual' | null;
  discount_percentage: number | null;
  discount_amount: number | null;
  start_date: string;
  end_date: string | null;
  is_individual: boolean;
  active: boolean;
}

interface PaymentCardProps {
  userId: string;
  planType: string | null;
  onPaymentSuccess: () => void;
}

export function PaymentCard({ userId, planType, onPaymentSuccess }: PaymentCardProps) {
  const [rechargePrices, setRechargePrices] = useState<RechargePrice[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<RechargePrice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card' | 'boleto'>('pix');
  const [loading, setLoading] = useState(false);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activePromotion, setActivePromotion] = useState<Promotion | null>(null);

  useEffect(() => {
    loadRechargePrices();
  }, [planType, userId]);

  const loadRechargePrices = async () => {
    if (!planType) {
      setLoadingPrices(false);
      return;
    }

    try {
      // 1. Buscar opções de recarga
      const { data, error } = await supabase
        .from('recharge_options')
        .select('*')
        .eq('plan_type', planType)
        .eq('active', true)
        .order('duration_months', { ascending: true });

      if (error) throw error;

      // 2. Buscar promoções ativas
      const hoje = new Date().toISOString().split('T')[0];

      // Buscar promoções gerais
      const { data: promotionsData } = await supabase
        .from('promotions')
        .select('*')
        .eq('active', true)
        .eq('is_individual', false)
        .or(`apply_to.eq.all_plans,apply_to.eq.${planType}`)
        .lte('start_date', hoje)
        .or(`end_date.is.null,end_date.gte.${hoje}`);

      // Buscar promoções individuais do usuário
      const { data: individualPromotions } = await supabase
        .from('promotion_users')
        .select(`
          promotion:promotions (
            id,
            name,
            promotion_type,
            apply_to,
            apply_to_period,
            discount_percentage,
            discount_amount,
            start_date,
            end_date,
            is_individual,
            active
          )
        `)
        .eq('user_id', userId)
        .eq('active', true);

      // Combinar promoções
      let bestPromotion: Promotion | null = null;

      // Verificar promoções individuais primeiro (prioridade)
      if (individualPromotions && individualPromotions.length > 0) {
        for (const item of individualPromotions) {
          const promo = item.promotion as unknown as Promotion;
          if (
            promo &&
            promo.active &&
            (promo.apply_to === 'all_plans' || promo.apply_to === planType) &&
            (!promo.end_date || promo.end_date >= hoje)
          ) {
            bestPromotion = promo;
            break;
          }
        }
      }

      // Se não houver promoção individual, verificar gerais
      if (!bestPromotion && promotionsData && promotionsData.length > 0) {
        bestPromotion = promotionsData[0] as Promotion;
      }

      setActivePromotion(bestPromotion);

      // 3. Aplicar desconto nos preços
      if (data) {
        const adaptedData = data.map((item: any) => {
          const basePrice = item.price;
          let finalPrice = basePrice;
          let hasPromotion = false;
          let promotionName = '';

          if (bestPromotion) {
            // Verificar se a promoção se aplica a este período específico
            const periodMatches =
              !bestPromotion.apply_to_period ||
              bestPromotion.apply_to_period === 'all_periods' ||
              bestPromotion.apply_to_period === item.period;

            if (periodMatches) {
              if (bestPromotion.promotion_type === 'percentage' && bestPromotion.discount_percentage) {
                finalPrice = basePrice * (1 - bestPromotion.discount_percentage / 100);
                hasPromotion = true;
                promotionName = bestPromotion.name;
              } else if (bestPromotion.promotion_type === 'fixed_amount' && bestPromotion.discount_amount) {
                finalPrice = Math.max(0, basePrice - bestPromotion.discount_amount);
                hasPromotion = true;
                promotionName = bestPromotion.name;
              }
            }
          }

          return {
            ...item,
            period_label: item.display_name || item.period_label || item.period,
            duration_days: item.duration_months ? item.duration_months * 30 : item.duration_days || 30,
            original_price: hasPromotion ? basePrice : undefined,
            price: finalPrice,
            has_promotion: hasPromotion,
            promotion_name: promotionName,
          };
        });

        setRechargePrices(adaptedData);
        if (adaptedData.length > 0) {
          setSelectedPeriod(adaptedData[0]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar preços:', error);
    } finally {
      setLoadingPrices(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPeriod) return;

    setLoading(true);
    setMessage(null);

    try {
      // 1. Cria a transação com status 'pending'
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'recharge',
          amount: selectedPeriod.price,
          payment_method: paymentMethod,
          status: 'pending',
          description: `Recarga ${selectedPeriod.period_label} - ${selectedPeriod.duration_days} dias`,
          metadata: {
            period: selectedPeriod.period,
            duration_days: selectedPeriod.duration_days,
            original_price: selectedPeriod.original_price,
            has_promotion: selectedPeriod.has_promotion,
            promotion_id: activePromotion?.id,
            promotion_name: selectedPeriod.promotion_name,
          },
        })
        .select()
        .single();

      if (transactionError || !transaction) {
        throw new Error(transactionError?.message || 'Erro ao criar transação');
      }

      // 2. Cria a preferência de pagamento no Mercado Pago
      const preferenceParams = {
        transactionId: transaction.id,
        userId: userId,
        amount: selectedPeriod.price,
        description: `Recarga ${selectedPeriod.period_label} - ${selectedPeriod.duration_days} dias`,
        paymentMethod: paymentMethod,
        metadata: {
          period: selectedPeriod.period,
          duration_days: selectedPeriod.duration_days,
        },
      };

      console.log('📤 Enviando para Edge Function:', JSON.stringify(preferenceParams, null, 2));

      const preference = await createMercadoPagoPreference(preferenceParams);

      // 3. Atualiza a transação com o ID da preferência do Mercado Pago
      await supabase
        .from('transactions')
        .update({
          metadata: {
            ...transaction.metadata,
            mercado_pago_preference_id: preference.id,
          },
        })
        .eq('id', transaction.id);

      // 4. Redireciona para a página de pagamento do Mercado Pago
      const paymentUrl = import.meta.env.DEV
        ? (preference.sandbox_init_point || preference.init_point)
        : preference.init_point;

      console.log('🔗 Redirecionando para:', paymentUrl);
      window.location.href = paymentUrl;
    } catch (error: any) {
      console.error('Erro ao processar pagamento:', error);
      console.error('   Detalhes completos:', JSON.stringify(error, null, 2));

      let errorMessage = 'Erro ao processar pagamento. Tente novamente.';

      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.error) {
        errorMessage = error.error;
      }

      setMessage({
        type: 'error',
        text: errorMessage,
      });
      setLoading(false);
    }
  };

  if (loadingPrices) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 mt-4">Carregando opções...</p>
        </div>
      </div>
    );
  }

  if (!planType || rechargePrices.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <Plus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Sem plano ativo</h3>
          <p className="text-gray-600">Entre em contato para assinar um plano</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-green-100 rounded-lg">
          <Plus className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Fazer Recarga</h3>
          <p className="text-sm text-gray-600">Escolha o período de recarga</p>
        </div>
      </div>

      {activePromotion && (
        <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Tag className="w-5 h-5 text-purple-600" />
            <p className="font-semibold text-purple-900">{activePromotion.name}</p>
          </div>
          <p className="text-sm text-purple-700 mt-1">
            {activePromotion.promotion_type === 'percentage'
              ? `${activePromotion.discount_percentage}% de desconto aplicado!`
              : `R$ ${activePromotion.discount_amount?.toFixed(2)} de desconto aplicado!`}
          </p>
        </div>
      )}

      <form onSubmit={handlePayment} className="space-y-4">
        {message && (
          <div
            className={`p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <p
              className={`text-sm ${
                message.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}
            >
              {message.text}
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Período de Recarga
          </label>
          <div className="grid grid-cols-1 gap-3">
            {rechargePrices.map((price) => {
              const isSelected = selectedPeriod?.id === price.id;
              const isAnnual = price.period === 'anual' || price.period === 'annual';

              return (
                <button
                  key={price.id}
                  type="button"
                  onClick={() => setSelectedPeriod(price)}
                  className={`relative flex items-center justify-between p-4 border-2 rounded-lg transition ${
                    isSelected
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${isAnnual ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`}
                >
                  <div className="text-left">
                    <div className="flex items-center space-x-2">
                      <p className={`font-bold text-lg ${isSelected ? 'text-green-900' : 'text-gray-900'}`}>
                        {price.period_label}
                      </p>
                      {isAnnual && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-semibold rounded">
                          MELHOR VALOR
                        </span>
                      )}
                      {price.has_promotion && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-semibold rounded">
                          PROMOÇÃO
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{price.duration_days} dias de acesso</p>
                  </div>
                  <div className="text-right">
                    {price.has_promotion && price.original_price ? (
                      <div>
                        <p className="text-sm text-gray-500 line-through">
                          R$ {price.original_price.toFixed(2)}
                        </p>
                        <p className={`text-2xl font-bold ${isSelected ? 'text-green-700' : 'text-purple-600'}`}>
                          R$ {price.price.toFixed(2)}
                        </p>
                      </div>
                    ) : (
                      <p className={`text-2xl font-bold ${isSelected ? 'text-green-700' : 'text-gray-900'}`}>
                        R$ {price.price.toFixed(2)}
                      </p>
                    )}
                    {price.duration_days > 30 && (
                      <p className="text-xs text-gray-500">
                        R$ {(price.price / (price.duration_days / 30)).toFixed(2)}/mês
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-6 h-6 text-green-600" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Método de Pagamento
          </label>
          <div className="grid grid-cols-1 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('pix')}
              className={`flex items-center space-x-3 p-4 border-2 rounded-lg transition ${
                paymentMethod === 'pix'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Smartphone className={`w-6 h-6 ${paymentMethod === 'pix' ? 'text-green-600' : 'text-gray-400'}`} />
              <div className="text-left">
                <p className={`font-semibold ${paymentMethod === 'pix' ? 'text-green-900' : 'text-gray-900'}`}>
                  PIX
                </p>
                <p className="text-sm text-gray-600">Pagamento instantâneo</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('credit_card')}
              className={`flex items-center space-x-3 p-4 border-2 rounded-lg transition ${
                paymentMethod === 'credit_card'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <CreditCard className={`w-6 h-6 ${paymentMethod === 'credit_card' ? 'text-blue-600' : 'text-gray-400'}`} />
              <div className="text-left">
                <p className={`font-semibold ${paymentMethod === 'credit_card' ? 'text-blue-900' : 'text-gray-900'}`}>
                  Cartão de Crédito
                </p>
                <p className="text-sm text-gray-600">Parcelamento disponível</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('boleto')}
              className={`flex items-center space-x-3 p-4 border-2 rounded-lg transition ${
                paymentMethod === 'boleto'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Receipt className={`w-6 h-6 ${paymentMethod === 'boleto' ? 'text-orange-600' : 'text-gray-400'}`} />
              <div className="text-left">
                <p className={`font-semibold ${paymentMethod === 'boleto' ? 'text-orange-900' : 'text-gray-900'}`}>
                  Boleto Bancário
                </p>
                <p className="text-sm text-gray-600">Até 3 dias úteis</p>
              </div>
            </button>
          </div>
        </div>

        {selectedPeriod && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-semibold text-blue-900 mb-2">Resumo da Recarga:</p>
            <div className="flex items-center justify-between text-sm text-blue-800">
              <span>Período: {selectedPeriod.period_label}</span>
              <span className="font-bold">R$ {selectedPeriod.price.toFixed(2)}</span>
            </div>
            {selectedPeriod.has_promotion && selectedPeriod.original_price && (
              <div className="flex items-center justify-between text-xs text-blue-600 mt-1">
                <span>Economia:</span>
                <span className="font-semibold">R$ {(selectedPeriod.original_price - selectedPeriod.price).toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !selectedPeriod}
          className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? 'Processando...' : 'Confirmar Recarga'}
        </button>
      </form>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-900 font-semibold mb-2">Benefícios da Recarga:</p>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Mantenha seu acesso ativo</li>
          <li>Aproveite todos os recursos da plataforma</li>
        </ul>
      </div>
    </div>
  );
}
