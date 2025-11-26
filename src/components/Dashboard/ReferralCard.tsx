import { Users, Copy, Check, DollarSign, X, Phone, User, MessageCircle, CheckCircle, Wallet } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { formatDateBR } from '../../utils/dateUtils';

interface ReferralCardProps {
  referralCode: string;
  totalCommission: number;
  referrals: Array<{
    id: string;
    total_commission_earned: number;
    created_at?: string;
    last_transaction?: {
      created_at: string;
      amount: number;
    };
    profiles: {
      full_name: string;
      phone?: string;
      email?: string;
    };
    is_subscriber?: boolean;
    type?: 'user' | 'test_request'; // 'user' = cadastrado, 'test_request' = apenas solicitou teste
  }>;
  subscribersCount?: number; // Número de assinantes calculado diretamente da tabela testes_liberados
  userId?: string; // ID do usuário para resgate
  monthlyPrice?: number; // Preço mensal do plano do usuário
  subscriptionId?: string; // ID da assinatura para aplicar crédito
  planType?: 'ponto_unico' | 'ponto_duplo' | 'ponto_triplo' | null; // Tipo de plano do cliente
  subscriptionExpirationDate?: string | null; // Data de expiração da assinatura
}

export function ReferralCard({ referralCode, totalCommission, referrals, subscribersCount = 0, userId, monthlyPrice, subscriptionId, planType, subscriptionExpirationDate }: ReferralCardProps) {
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemType, setRedeemType] = useState<'credit' | 'pix' | null>(null);
  const [redeemAmount, setRedeemAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [rechargeOptions, setRechargeOptions] = useState<any[]>([]);
  const [selectedRecharge, setSelectedRecharge] = useState<any | null>(null);
  const [loadingRecharge, setLoadingRecharge] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // Debug: verifica o que está sendo recebido
  console.log('🎯 ReferralCard recebeu:', {
    referralCode,
    totalCommission,
    referralsCount: referrals.length,
    subscribersCount,
    referrals: referrals,
  });

  // Filtra apenas os indicados cadastrados (tipo 'user')
  const registeredReferrals = referrals.filter(r => r.type === 'user');
  // Total de indicados = todos (cadastrados + solicitações de teste)
  const totalIndicados = referrals.length;

  // Verifica se a assinatura está expirada
  const isSubscriptionExpired = subscriptionExpirationDate
    ? new Date(subscriptionExpirationDate) < new Date()
    : false;

  console.log('📊 ReferralCard - Total indicados:', totalIndicados, 'Cadastrados:', registeredReferrals.length, 'Assinantes:', subscribersCount);
  console.log('📅 Assinatura expirada:', isSubscriptionExpired, 'Data de expiração:', subscriptionExpirationDate);

  // Link de indicação para cadastro de teste IPTV
  const referralLink = `${window.location.origin}?ref=${referralCode}`;

  // Mensagem para compartilhar no WhatsApp (sem emojis para evitar problemas de encoding)
  const whatsappMessage = `*Ganhe R$ 10 de desconto!*\n\nVoce foi indicado para testar IPTV da Uniflix com desconto!\n\nClique no link abaixo para solicitar seu teste:\n${referralLink}\n\nAproveite!`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const encodedMessage = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  // Carrega opções de recarga quando o tipo de resgate for crédito
  useEffect(() => {
    if (redeemType === 'credit' && planType) {
      loadRechargeOptions();
    }
  }, [redeemType, planType]);

  const loadRechargeOptions = async () => {
    if (!planType) return;
    
    setLoadingRecharge(true);
    const { data, error } = await supabase
      .from('recharge_options')
      .select('*')
      .eq('plan_type', planType)
      .eq('active', true)
      .order('duration_months', { ascending: true });

    if (!error && data) {
      const adaptedData = data.map((item: any) => ({
        ...item,
        period_label: item.display_name || item.period_label || item.period,
        duration_days: item.duration_months ? item.duration_months * 30 : 30,
      }));
      setRechargeOptions(adaptedData);
    }
    setLoadingRecharge(false);
  };

  const handleRedeem = async () => {
    if (redeemType === 'pix') {
      // Validação: não permite resgate via PIX se a assinatura estiver expirada
      if (isSubscriptionExpired) {
        setError('Não é possível resgatar via PIX com assinatura expirada. Renove sua assinatura primeiro.');
        return;
      }

      // Para PIX: cria transação pendente e redireciona para WhatsApp
      if (!redeemAmount) {
        setError('Informe o valor');
        return;
      }

      const amount = parseFloat(redeemAmount.replace(',', '.'));

      if (isNaN(amount) || amount <= 0) {
        setError('Valor inválido');
        return;
      }

      // Validação: valor mínimo de R$ 50,00
      if (amount < 50) {
        setError('Valor mínimo para resgate em PIX: R$ 50,00');
        return;
      }

      // Validação: saldo mínimo de R$ 50,00
      if (totalCommission < 50) {
        setError('Saldo insuficiente. Mínimo necessário: R$ 50,00');
        return;
      }

      if (amount > totalCommission) {
        setError('Valor excede o total de comissões disponíveis');
        return;
      }

      if (!userId) {
        setError('Usuário não identificado');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Cria transação pendente de resgate via PIX
        // @ts-ignore - Supabase type issue
        const { data: transaction, error: transError } = await supabase
          .from('transactions')
          .insert({
            user_id: userId,
            type: 'commission_payout',
            amount: amount,
            payment_method: 'pix',
            status: 'pending',
            description: `Solicitação de Resgate via PIX - R$ ${amount.toFixed(2)}`,
            metadata: {
              redeem_type: 'pix',
              requested_at: new Date().toISOString(),
              pix_key: null,
              admin_notes: null,
            },
          })
          .select()
          .single();

        if (transError) {
          throw transError;
        }

        setSuccess('Solicitação enviada com sucesso! Entraremos em contato via WhatsApp.');

        // Abre WhatsApp para contato com suporte
        const whatsappNumber = '554799906423';
        const message = `Olá! Solicitei um resgate via PIX no valor de R$ ${amount.toFixed(2)}. ID da solicitação: ${transaction.id}`;
        const encodedMessage = encodeURIComponent(message);
        const whatsappLink = `https://api.whatsapp.com/send/?phone=${whatsappNumber}&text=${encodedMessage}`;

        window.open(whatsappLink, '_blank');

        setTimeout(() => {
          setShowRedeemModal(false);
          setRedeemType(null);
          setRedeemAmount('');
          setError(null);
          setSuccess(null);
          window.location.reload();
        }, 2000);
      } catch (err: any) {
        setError(err.message || 'Erro ao criar solicitação de resgate');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Para crédito: aplicar na assinatura
    if (!selectedRecharge) {
      setError('Selecione uma opção de recarga');
      return;
    }

    if (!subscriptionId || !userId) {
      setError('Assinatura não encontrada');
      return;
    }

    const amount = selectedRecharge.price;
    
    if (amount > totalCommission) {
      setError('Saldo insuficiente');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Busca a assinatura atual
      // @ts-ignore - Supabase type issue
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('expiration_date')
        .eq('id', subscriptionId)
        .single();

      if (subError || !subscription) {
        throw new Error('Erro ao buscar assinatura');
      }

      // Calcula nova data de expiração
      const currentExpiration = subscription.expiration_date
        ? new Date(subscription.expiration_date)
        : new Date();
      const newExpiration = new Date(currentExpiration);
      newExpiration.setDate(newExpiration.getDate() + selectedRecharge.duration_days);

      // Atualiza a assinatura
      // @ts-ignore - Supabase type issue
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          expiration_date: newExpiration.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId);

      if (updateError) {
        throw updateError;
      }

      // Cria transação de resgate
      // @ts-ignore - Supabase type issue
      const { error: transError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'commission_payout',
          amount: amount,
          payment_method: null,
          status: 'completed',
          description: `Resgate de Comissão em Crédito - ${selectedRecharge.period_label} - ${selectedRecharge.duration_days} dias`,
          metadata: {
            redeem_type: 'credit',
            recharge_option_id: selectedRecharge.id,
            days_added: selectedRecharge.duration_days,
          },
        });

      if (transError) {
        throw transError;
      }

      // Atualiza total_commission do usuário
      // @ts-ignore - Supabase type issue
      const { error: updateCommissionError } = await supabase
        .from('users')
        .update({
          total_commission: totalCommission - amount,
        })
        .eq('id', userId);

      if (updateCommissionError) {
        console.error('Erro ao atualizar comissão:', updateCommissionError);
      }

      setSuccess(`Crédito de ${selectedRecharge.period_label} aplicado com sucesso! ${selectedRecharge.duration_days} dias adicionados à sua assinatura.`);
      setTimeout(() => {
        setShowRedeemModal(false);
        setRedeemType(null);
        setSelectedRecharge(null);
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao processar resgate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-green-100 rounded-lg">
          <Users className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Programa de Indicações</h3>
          <p className="text-sm text-gray-600">Ganhe 10% de comissão nas recargas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-green-700 mb-1">Total em Comissões</p>
              <p className="text-3xl font-bold text-green-900">
                R$ {totalCommission.toFixed(2)}
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-green-600 opacity-20" />
          </div>
          {totalCommission > 0 && (
            <button
              onClick={() => setShowRedeemModal(true)}
              className="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition flex items-center justify-center space-x-2"
            >
              <Wallet className="w-4 h-4" />
              <span>Resgatar Comissão</span>
            </button>
          )}
        </div>

        <button
          onClick={() => totalIndicados > 0 && setShowModal(true)}
          disabled={totalIndicados === 0}
          className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 hover:from-blue-100 hover:to-blue-150 transition disabled:opacity-50 disabled:cursor-not-allowed text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 mb-1">Total Indicados</p>
              <p className="text-3xl font-bold text-blue-900">{totalIndicados}</p>
            </div>
            <Users className="w-10 h-10 text-blue-600 opacity-20" />
          </div>
        </button>

        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 mb-1">Assinantes</p>
              <p className="text-3xl font-bold text-purple-900">
                {subscribersCount}
              </p>
              <p className="text-xs text-purple-600 mt-1">
                de {totalIndicados} indicado{totalIndicados !== 1 ? 's' : ''}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-purple-600 opacity-20" />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seu Link de Indicação
        </label>
        <p className="text-xs text-gray-600 mb-3">
          Compartilhe este link para que pessoas testem IPTV e ganhem R$ 10 de desconto. Você ganha 10% de comissão em cada recarga!
        </p>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono text-gray-700"
          />
          <button
            onClick={handleCopy}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
            title="Copiar link"
          >
            {copied ? (
              <>
                <Check className="w-5 h-5" />
                <span className="hidden sm:inline">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                <span className="hidden sm:inline">Copiar</span>
              </>
            )}
          </button>
          <button
            onClick={handleShareWhatsApp}
            className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center space-x-2"
            title="Compartilhar no WhatsApp"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seu Código de Indicação
        </label>
        <p className="text-xs text-gray-600 mb-3">
          As pessoas podem usar este código ao se cadastrar para vincular a indicação a você
        </p>
        <div className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-center">
          <p className="text-3xl font-bold text-white tracking-wider">{referralCode}</p>
        </div>
      </div>

      {referrals.length === 0 && (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Você ainda não fez indicações</p>
          <p className="text-sm text-gray-500 mt-1">Compartilhe seu link e comece a ganhar!</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Meus Indicados</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {referrals.length > 0 ? (
                referrals.map((referral, index) => {
                  // Formata telefone para WhatsApp (remove caracteres não numéricos)
                  const phoneRaw = referral.profiles?.phone || '';
                  const phoneCleaned = phoneRaw.replace(/\D/g, '');
                  const whatsappLink = phoneCleaned ? `https://wa.me/${phoneCleaned}` : null;
                  const isSubscriber = referral.is_subscriber || false;
                  const isUser = referral.type === 'user';
                  
                  return (
                  <div
                    key={referral.id}
                      className={`p-4 rounded-lg border ${
                        isSubscriber
                          ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-200'
                          : 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200'
                      }`}
                  >
                    <div className="flex items-start space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isSubscriber ? 'bg-green-500' : 'bg-blue-500'
                        }`}>
                          {isSubscriber ? (
                            <CheckCircle className="w-5 h-5 text-white" />
                          ) : (
                        <span className="text-white font-bold text-sm">#{index + 1}</span>
                          )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {referral.profiles ? (
                          <>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2 flex-1 min-w-0">
                                  <User className="w-4 h-4 text-gray-600 flex-shrink-0" />
                              <p className="font-semibold text-gray-900 truncate">
                                {referral.profiles.full_name || 'Sem nome'}
                              </p>
                            </div>
                                <div className="flex items-center space-x-1 ml-2">
                                  {isSubscriber && (
                                    <span className="px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                                      Assinante
                                    </span>
                                  )}
                                  {!isSubscriber && isUser && (
                                    <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-semibold rounded-full">
                                      Cadastrado
                                    </span>
                                  )}
                                  {!isUser && (
                                    <span className="px-2 py-1 bg-gray-400 text-white text-xs font-semibold rounded-full">
                                      Teste
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2 mb-2">
                            {referral.profiles.phone && (
                              <a
                                    href={whatsappLink || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 hover:opacity-70 transition"
                              >
                                <Phone className="w-4 h-4 text-green-600 flex-shrink-0" />
                                <p className="text-sm text-green-600 hover:underline">{referral.profiles.phone}</p>
                              </a>
                                )}
                                {whatsappLink && (
                                  <a
                                    href={whatsappLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center justify-center"
                                    title="Falar no WhatsApp"
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                              
                              {referral.profiles.email && (
                                <p className="text-xs text-gray-600 mb-2">
                                  📧 {referral.profiles.email}
                                </p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-gray-500">Dados do indicado não encontrados</p>
                        )}
                          
                        {referral.last_transaction ? (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <p className="text-xs text-gray-600">
                                💳 Pagamento: {formatDateBR(referral.last_transaction.created_at)}
                            </p>
                            <p className="text-xs text-gray-600">
                              Valor: R$ {referral.last_transaction.amount.toFixed(2)}
                            </p>
                          </div>
                        ) : (
                            <p className="text-xs text-gray-400 mt-2">Sem pagamentos registrados</p>
                        )}
                          
                          {referral.total_commission_earned > 0 && (
                            <p className="text-xs text-green-700 mt-2 font-semibold">
                              💰 Comissão: R$ {referral.total_commission_earned.toFixed(2)}
                        </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-gray-500 py-6">Nenhum indicado ainda</p>
              )}
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full mt-6 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {showRedeemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Resgatar Comissão</h3>
                <button
                  onClick={() => {
                    setShowRedeemModal(false);
                    setRedeemType(null);
                    setRedeemAmount('');
                    setSelectedRecharge(null);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="p-1 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            {!redeemType ? (
              <div className="space-y-4">
                <p className="text-gray-600 mb-4">Escolha o tipo de resgate:</p>
                
                <button
                  onClick={() => setRedeemType('credit')}
                  className="w-full p-4 border-2 border-blue-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">Créditos em Mensalidade</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Pagar sua mensalidade com saldo
                      </p>
                      {planType === 'ponto_unico' ? (
                        <p className="text-xs text-blue-600 mt-1">
                          Mínimo: R$ 35,00
                        </p>
                      ) : monthlyPrice ? (
                        <p className="text-xs text-blue-600 mt-1">
                          Mínimo: R$ {monthlyPrice.toFixed(2)}
                        </p>
                      ) : null}
                    </div>
                    <Wallet className="w-6 h-6 text-blue-600" />
                  </div>
                </button>

                <button
                  onClick={() => !isSubscriptionExpired && totalCommission >= 50 && setRedeemType('pix')}
                  disabled={isSubscriptionExpired || totalCommission < 50}
                  className={`w-full p-4 border-2 rounded-lg transition text-left ${
                    !isSubscriptionExpired && totalCommission >= 50
                      ? 'border-green-200 hover:border-green-500 hover:bg-green-50'
                      : 'border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">PIX</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Receber em sua conta
                      </p>
                      {isSubscriptionExpired ? (
                        <p className="text-xs text-red-600 mt-1">
                          Assinatura expirada - Renove para sacar via PIX
                        </p>
                      ) : totalCommission < 50 ? (
                        <p className="text-xs text-red-600 mt-1">
                          Saldo insuficiente (mínimo: R$ 50,00)
                        </p>
                      ) : (
                        <p className="text-xs text-green-600 mt-1">
                          Mínimo: R$ 50,00
                        </p>
                      )}
                    </div>
                    <DollarSign className={`w-6 h-6 ${!isSubscriptionExpired && totalCommission >= 50 ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                </button>
              </div>
            ) : redeemType === 'credit' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Selecionar Créditos
                  </label>
                  {loadingRecharge ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Carregando opções...</p>
                    </div>
                  ) : rechargeOptions.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Nenhuma opção de recarga disponível</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {rechargeOptions.map((option) => {
                        const canAfford = option.price <= totalCommission;
                        return (
                          <button
                            key={option.id}
                            onClick={() => canAfford && setSelectedRecharge(option)}
                            disabled={!canAfford}
                            className={`w-full p-4 rounded-lg border-2 text-left transition ${
                              selectedRecharge?.id === option.id
                                ? 'border-blue-500 bg-blue-50'
                                : canAfford
                                ? 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                : 'border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">
                                  Recarga {option.period_label} - R$ {option.price.toFixed(2).replace('.', ',')}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {(() => {
                                    const months = option.duration_months || Math.floor(option.duration_days / 30);
                                    return `${months} ${months === 1 ? 'mês' : 'meses'} de crédito`;
                                  })()}
                                </p>
                              </div>
                              <div className="text-right ml-4">
                                <p className="font-bold text-gray-900">R$ {option.price.toFixed(2).replace('.', ',')}</p>
                                {!canAfford && (
                                  <p className="text-xs text-red-600 mt-1">Saldo insuficiente</p>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Saldo disponível: R$ {totalCommission.toFixed(2).replace('.', ',')}
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-600">{success}</p>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setRedeemType(null);
                      setSelectedRecharge(null);
                      setError(null);
                      setSuccess(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleRedeem}
                    disabled={!selectedRecharge || loading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processando...' : 'Confirmar Resgate'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor a resgatar
                  </label>
                  <input
                    type="text"
                    value={redeemAmount}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d,]/g, '');
                      setRedeemAmount(value);
                    }}
                    placeholder="0,00"
                    className={`w-full px-4 py-3 border rounded-lg text-lg font-semibold ${
                      redeemAmount && !isNaN(parseFloat(redeemAmount.replace(',', '.'))) && parseFloat(redeemAmount.replace(',', '.')) < 50
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300'
                    }`}
                  />
                  <div className="mt-1">
                    <p className="text-xs text-gray-500">
                      Disponível: R$ {totalCommission.toFixed(2).replace('.', ',')}
                    </p>
                    {redeemAmount && !isNaN(parseFloat(redeemAmount.replace(',', '.'))) && parseFloat(redeemAmount.replace(',', '.')) < 50 && (
                      <p className="text-xs text-red-600 mt-1">
                        Valor mínimo: R$ 50,00
                      </p>
                    )}
                    {totalCommission < 50 && (
                      <p className="text-xs text-red-600 mt-1">
                        Saldo insuficiente. Mínimo necessário: R$ 50,00
                      </p>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setRedeemType(null);
                      setRedeemAmount('');
                      setError(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleRedeem}
                    disabled={
                      !redeemAmount || 
                      isNaN(parseFloat(redeemAmount.replace(',', '.'))) ||
                      parseFloat(redeemAmount.replace(',', '.')) < 50 || 
                      totalCommission < 50
                    }
                    className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Finalizar Resgate
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
