import { CreditCard, CheckCircle, XCircle, Eye, EyeOff, Calendar, Clock, ChevronDown, ChevronUp, Copy, Check, X, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateBR } from '../../utils/dateUtils';

interface Subscription {
  id: string;
    status: string;
    app_username: string;
    app_password: string;
    expiration_date: string | null;
  panel_name?: string | null;
  plan?: {
      id: string;
      name: string;
      description: string | null;
      simultaneous_logins: number;
      plan_type: 'ponto_unico' | 'ponto_duplo' | 'ponto_triplo';
  } | null;
}

interface SubscriptionCardProps {
  subscription: Subscription | null;
  allSubscriptions?: Subscription[];
  onPlanChange?: () => void;
}

export function SubscriptionCard({ subscription, allSubscriptions = [], onPlanChange }: SubscriptionCardProps) {
  const { user } = useAuth();
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [showAllLogins, setShowAllLogins] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [selectedLoginsToRemove, setSelectedLoginsToRemove] = useState<string[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [processingDowngrade, setProcessingDowngrade] = useState(false);

  // Se não tiver allSubscriptions mas tiver subscription, usa apenas ele
  const subscriptions = allSubscriptions.length > 0 ? allSubscriptions : (subscription ? [subscription] : []);
  const hasMultipleLogins = subscriptions.length > 1;

  useEffect(() => {
    const firstSubscription = subscriptions[0];
    if (firstSubscription?.expiration_date) {
      const expirationDate = new Date(firstSubscription.expiration_date);
      const today = new Date();
      const diffTime = expirationDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysRemaining(Math.max(0, diffDays));
    }
  }, [subscriptions]);

  const loadAvailablePlans = async () => {
    setLoadingPlans(true);
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('active', true)
      .order('simultaneous_logins', { ascending: true });

    if (!error && data) {
      setAvailablePlans(data);
    }
    setLoadingPlans(false);
  };

  const handleOpenChangePlanModal = () => {
    setShowChangePlanModal(true);
    loadAvailablePlans();
    setSelectedPlan(null);
    setSelectedLoginsToRemove([]);
  };

  const handleSelectPlan = (plan: any) => {
    setSelectedPlan(plan);
    const currentLogins = firstSubscription?.plan?.simultaneous_logins || 0;
    const newLogins = plan.simultaneous_logins;
    
    // Se for downgrade, prepara a seleção de logins
    if (newLogins < currentLogins) {
      const loginsToRemove = subscriptions.length - newLogins;
      if (loginsToRemove > 0) {
        setSelectedLoginsToRemove([]);
      }
    }
  };

  const getPlanChangeType = (plan: any): 'upgrade' | 'downgrade' | 'same' => {
    const currentLogins = firstSubscription?.plan?.simultaneous_logins || 0;
    const newLogins = plan.simultaneous_logins;
    
    if (newLogins > currentLogins) return 'upgrade';
    if (newLogins < currentLogins) return 'downgrade';
    return 'same';
  };

  const handleToggleLoginSelection = (subscriptionId: string) => {
    setSelectedLoginsToRemove(prev => {
      if (prev.includes(subscriptionId)) {
        return prev.filter(id => id !== subscriptionId);
      } else {
        const currentLogins = subscriptions.length;
        const newLogins = selectedPlan?.simultaneous_logins || 0;
        const maxToRemove = currentLogins - newLogins;
        if (prev.length < maxToRemove) {
          return [...prev, subscriptionId];
        }
        return prev;
      }
    });
  };

  const handleConfirmPlanChange = async () => {
    console.log('🔵 handleConfirmPlanChange chamado');
    console.log('   selectedPlan:', selectedPlan);
    console.log('   subscriptions:', subscriptions.map(s => ({ id: s.id, username: s.app_username })));
    console.log('   selectedLoginsToRemove:', selectedLoginsToRemove);
    
    if (!selectedPlan) {
      console.warn('⚠️ Nenhum plano selecionado');
      return;
    }
    
    const changeType = getPlanChangeType(selectedPlan);
    console.log('   changeType:', changeType);
    
    if (changeType === 'downgrade') {
      const currentLogins = subscriptions.length;
      const newLogins = selectedPlan.simultaneous_logins;
      const loginsToRemove = currentLogins - newLogins;

      console.log(`📊 Downgrade: ${currentLogins} → ${newLogins} (remover ${loginsToRemove})`);
      console.log(`   Logins selecionados para remover: ${selectedLoginsToRemove.length}`);

      if (loginsToRemove !== selectedLoginsToRemove.length) {
        console.error(`❌ Número incorreto de logins selecionados: esperado ${loginsToRemove}, selecionado ${selectedLoginsToRemove.length}`);
        alert(`Você precisa selecionar exatamente ${loginsToRemove} ${loginsToRemove === 1 ? 'login' : 'logins'} para remover.`);
        return;
      }

      console.log('✅ Validação passou, iniciando exclusão...');
      setProcessingDowngrade(true);

      try {
        // Coletar informações dos logins que serão excluídos para anotações
        const deletedLoginsInfo = selectedLoginsToRemove.map(subscriptionId => {
          const sub = subscriptions.find(s => s.id === subscriptionId);
          return {
            login: sub?.app_username || 'N/A',
            senha: sub?.app_password || 'N/A',
            painel: sub?.panel_name || 'N/A',
            data_exclusao: new Date().toISOString(),
          };
        });

        // Excluir os logins selecionados
        console.log(`🗑️ Iniciando exclusão de ${selectedLoginsToRemove.length} login(s)...`);
        for (const subscriptionId of selectedLoginsToRemove) {
          // Buscar informações do login antes de excluir para log
          const loginToDelete = subscriptions.find(s => s.id === subscriptionId);
          console.log(`🗑️ Excluindo login: ${loginToDelete?.app_username || subscriptionId} (ID: ${subscriptionId})`);
          
          const { data: deleteData, error: deleteError } = await supabase
            .from('subscriptions')
            .delete()
            .eq('id', subscriptionId)
            .select();

          if (deleteError) {
            console.error(`❌ Erro ao excluir login ${loginToDelete?.app_username || subscriptionId}:`, deleteError);
            console.error('   Detalhes do erro:', JSON.stringify(deleteError, null, 2));
            throw deleteError;
          } else {
            console.log(`✅ Login ${loginToDelete?.app_username || subscriptionId} excluído com sucesso`);
            console.log('   Dados excluídos:', deleteData);
          }
        }
        
        console.log(`✅ Exclusão concluída. ${selectedLoginsToRemove.length} login(s) removido(s).`);

        // Atualizar o plano das subscriptions restantes para o novo plano
        const remainingSubscriptions = subscriptions.filter(
          sub => !selectedLoginsToRemove.includes(sub.id)
        );

        // Atualizar o plano das subscriptions restantes uma por uma para evitar problemas com RLS
        if (remainingSubscriptions.length > 0) {
          for (const sub of remainingSubscriptions) {
            const { error: updateError } = await supabase
              .from('subscriptions')
              .update({
                plan_id: selectedPlan.id,
                updated_at: new Date().toISOString(),
              })
              .eq('id', sub.id);

            if (updateError) {
              throw updateError;
            }
          }
        }

        // Salvar anotações com informações dos logins excluídos
        if (user?.id && deletedLoginsInfo.length > 0) {
          // Buscar anotações existentes
          const { data: userData, error: fetchError } = await supabase
            .from('users')
            .select('anotacoes')
            .eq('id', user.id)
            .maybeSingle();

          if (fetchError) {
            console.warn('Erro ao buscar anotações existentes:', fetchError);
          }

          // Formatar informações dos logins excluídos
          const timestamp = new Date().toLocaleString('pt-BR');
          const downgradeInfo = `\n\n--- DOWNGRADE REALIZADO PELO CLIENTE - ${timestamp} ---\n`;
          const planInfo = `Plano anterior: ${firstSubscription?.plan?.name || 'N/A'}\nPlano novo: ${selectedPlan.name}\n`;
          const loginsInfo = deletedLoginsInfo.map((info, index) => 
            `Login ${index + 1} excluído:\n  - Login: ${info.login}\n  - Senha: ${info.senha}\n  - Painel: ${info.painel}\n`
          ).join('\n');

          const newNote = `${downgradeInfo}${planInfo}${loginsInfo}`;
          const updatedNotes = (userData?.anotacoes || '') + newNote;

          // Atualizar anotações no banco
          const { error: notesError } = await supabase
            .from('users')
            .update({
              anotacoes: updatedNotes,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

          if (notesError) {
            console.warn('Erro ao salvar anotações:', notesError);
            // Não falha o downgrade se não conseguir salvar anotações
          }
        }

        // Verificar se a exclusão foi bem-sucedida antes de recarregar
        console.log('🔄 Verificando subscriptions após exclusão...');
        const { data: verifyData, error: verifyError } = await supabase
          .from('subscriptions')
          .select('id, app_username, status')
          .eq('user_id', user?.id)
          .eq('status', 'active');
        
        if (verifyError) {
          console.error('❌ Erro ao verificar subscriptions:', verifyError);
        } else {
          console.log(`📊 Subscriptions restantes após exclusão: ${verifyData?.length || 0}`);
          if (verifyData) {
            verifyData.forEach((sub, index) => {
              console.log(`   ${index + 1}. Login: ${sub.app_username} (ID: ${sub.id})`);
            });
          }
        }
        
        // Fecha o modal primeiro
        setShowChangePlanModal(false);
        setSelectedPlan(null);
        setSelectedLoginsToRemove([]);
        
        // Mostra mensagem de sucesso
        alert(`Downgrade realizado com sucesso! ${loginsToRemove} ${loginsToRemove === 1 ? 'login foi removido' : 'logins foram removidos'}.`);
        
        // Força reload completo da página para garantir que os dados sejam atualizados
        // Aguarda um pouco para garantir que o banco processou a exclusão
        // Usa window.location.href para forçar um reload completo sem cache
        setTimeout(() => {
          // Força reload sem cache
          window.location.href = window.location.href.split('#')[0];
        }, 500);
      } catch (error: any) {
        console.error('Erro ao fazer downgrade:', error);
        alert(`Erro ao fazer downgrade: ${error.message || 'Erro desconhecido'}`);
      } finally {
        setProcessingDowngrade(false);
      }
    } else if (changeType === 'upgrade') {
      const whatsappNumber = '554799906423';
      const message = 'Quero fazer um upgrade no meu plano';
      const encodedMessage = encodeURIComponent(message);
      const whatsappLink = `https://api.whatsapp.com/send/?phone=${whatsappNumber}&text=${encodedMessage}`;
      window.open(whatsappLink, '_blank');
      setShowChangePlanModal(false);
      setSelectedPlan(null);
      setSelectedLoginsToRemove([]);
    }
  };

  if (subscriptions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma assinatura ativa</h3>
          <p className="text-gray-600">Entre em contato para assinar um plano</p>
        </div>
      </div>
    );
  }

  const firstSubscription = subscriptions[0];
  const statusConfig = {
    active: { label: 'Ativo', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle },
    expired: { label: 'Expirado', color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
    cancelled: { label: 'Cancelado', color: 'text-gray-600', bg: 'bg-gray-50', icon: XCircle },
  };

  const config = statusConfig[firstSubscription.status as keyof typeof statusConfig];
  const StatusIcon = config.icon;

  const expirationDate = firstSubscription.expiration_date
    ? formatDateBR(firstSubscription.expiration_date, {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : 'Não definido';

  const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 7;
  const isExpired = firstSubscription.status === 'expired' || daysRemaining === 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold">
              {firstSubscription.plan?.name || 'Plano Ativo'}
            </h3>
            {firstSubscription.plan && (
            <p className="text-sm text-blue-100 mt-1">
                {firstSubscription.plan.simultaneous_logins} {firstSubscription.plan.simultaneous_logins === 1 ? 'login simultâneo' : 'logins simultâneos'}
            </p>
            )}
          </div>
          <div className={`flex items-center space-x-2 px-3 py-1 ${config.bg} rounded-full`}>
            <StatusIcon className={`w-4 h-4 ${config.color}`} />
            <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
          </div>
        </div>
        {firstSubscription.plan?.description && (
          <p className="text-blue-100">{firstSubscription.plan.description}</p>
        )}

        <div className="mt-4 pt-4 border-t border-blue-400">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <Calendar className="w-4 h-4 text-blue-200" />
                <span className="text-sm text-blue-100">Expira em</span>
              </div>
              <span className="text-lg font-bold">{expirationDate}</span>
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <Clock className="w-4 h-4 text-blue-200" />
                <span className="text-sm text-blue-100">Dias restantes</span>
              </div>
              <span className={`text-2xl font-bold ${isExpired ? 'text-red-300' : isExpiringSoon ? 'text-yellow-300' : ''}`}>
                {daysRemaining}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900">Credenciais de Acesso</h4>
          {hasMultipleLogins && (
            <button
              onClick={() => setShowAllLogins(!showAllLogins)}
              className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <span>{showAllLogins ? 'Ocultar' : 'Ver todos'} ({subscriptions.length})</span>
              {showAllLogins ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
        
        <div className="space-y-4">
          {subscriptions.map((sub, index) => {
            const isVisible = index === 0 || showAllLogins;
            const loginKey = sub.id || `login-${index}`;
            const isPasswordVisible = showPassword[loginKey] || false;
            
            if (!isVisible) return null;

            const handleCopy = async (text: string, type: string) => {
              await navigator.clipboard.writeText(text);
              setCopiedIndex(`${loginKey}-${type}`);
              setTimeout(() => setCopiedIndex(null), 2000);
            };

            return (
              <div key={loginKey} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                {hasMultipleLogins && (
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-gray-700">
                        Login {index + 1}
                      </span>
                      {sub.panel_name && (
                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                          {sub.panel_name}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Usuário</p>
                      <div className="flex items-center space-x-2">
                        <p className="font-mono font-semibold text-gray-900">{sub.app_username}</p>
                        <button
                          onClick={() => handleCopy(sub.app_username, 'username')}
                          className="p-1 hover:bg-gray-100 rounded transition"
                          title="Copiar usuário"
                        >
                          {copiedIndex === `${loginKey}-username` ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
            </div>
          </div>

                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Senha</p>
                      <div className="flex items-center space-x-2">
              <p className="font-mono font-semibold text-gray-900">
                          {isPasswordVisible ? sub.app_password : '••••••••'}
              </p>
                        <button
                          onClick={() => handleCopy(sub.app_password, 'password')}
                          className="p-1 hover:bg-gray-100 rounded transition"
                          title="Copiar senha"
                        >
                          {copiedIndex === `${loginKey}-password` ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
            </div>
            <button
                      onClick={() => setShowPassword({ ...showPassword, [loginKey]: !isPasswordVisible })}
              className="ml-4 p-2 hover:bg-gray-200 rounded-lg transition"
                      title={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
            >
                      {isPasswordVisible ? (
                <EyeOff className="w-5 h-5 text-gray-600" />
              ) : (
                <Eye className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
                </div>
              </div>
            );
          })}
        </div>

        {isExpired && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>Atenção:</strong> Sua assinatura expirou. Faça uma recarga para continuar aproveitando os serviços.
            </p>
          </div>
        )}

        {!isExpired && isExpiringSoon && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Aviso:</strong> Sua assinatura expira em {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}. Faça uma recarga para renovar.
            </p>
          </div>
        )}

        <div className="mt-4">
          <button
            onClick={handleOpenChangePlanModal}
            className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2"
          >
            <CreditCard className="w-5 h-5" />
            <span>Mudar de Plano</span>
          </button>
        </div>
      </div>

      {showChangePlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Mudar de Plano</h3>
              <button
                onClick={() => {
                  setShowChangePlanModal(false);
                  setSelectedPlan(null);
                  setSelectedLoginsToRemove([]);
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Selecione o novo plano
                </label>
                {loadingPlans ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Carregando planos...</p>
                  </div>
                ) : availablePlans.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Nenhum plano disponível</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availablePlans
                      .filter(plan => {
                        const currentPlanId = firstSubscription?.plan?.id;
                        return plan.id !== currentPlanId;
                      })
                      .map((plan) => {
                        const changeType = getPlanChangeType(plan);
                        const isUpgrade = changeType === 'upgrade';
                        const isDowngrade = changeType === 'downgrade';
                        const isSelected = selectedPlan?.id === plan.id;

                        return (
                          <button
                            key={plan.id}
                            onClick={() => handleSelectPlan(plan)}
                            className={`w-full p-4 rounded-lg border-2 text-left transition ${
                              isSelected
                                ? isUpgrade
                                  ? 'border-green-500 bg-green-50'
                                  : isDowngrade
                                  ? 'border-orange-500 bg-orange-50'
                                  : 'border-blue-500 bg-blue-50'
                                : isUpgrade
                                ? 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                                : isDowngrade
                                ? 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
                                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <p className="font-semibold text-gray-900">{plan.name}</p>
                                  {isUpgrade && (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                                      Upgrade
                                    </span>
                                  )}
                                  {isDowngrade && (
                                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded">
                                      Downgrade
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  {plan.simultaneous_logins} {plan.simultaneous_logins === 1 ? 'login simultâneo' : 'logins simultâneos'}
                                </p>
                                {plan.description && (
                                  <p className="text-xs text-gray-500 mt-1">{plan.description}</p>
                                )}
                              </div>
                              <div className="text-right ml-4">
                                <p className="font-bold text-gray-900">R$ {plan.monthly_price?.toFixed(2).replace('.', ',') || '0,00'}/mês</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>

              {selectedPlan && (() => {
                const changeType = getPlanChangeType(selectedPlan);
                const currentLogins = subscriptions.length;
                const newLogins = selectedPlan.simultaneous_logins;
                const loginsToRemove = currentLogins - newLogins;
                const isDowngrade = changeType === 'downgrade';

                return (
                  <div className="space-y-4">
                    {isDowngrade && loginsToRemove > 0 && (
                      <>
                        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                          <p className="text-sm text-orange-800 font-semibold mb-2">
                            ⚠️ Atenção: {loginsToRemove} {loginsToRemove === 1 ? 'login será excluído' : 'logins serão excluídos'}
                          </p>
                          <p className="text-xs text-orange-700">
                            Selecione quais logins deseja remover antes de confirmar o downgrade.
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Selecione os logins a remover ({selectedLoginsToRemove.length} de {loginsToRemove} selecionados)
                          </label>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {subscriptions.map((sub, index) => (
                              <button
                                key={sub.id}
                                onClick={() => handleToggleLoginSelection(sub.id)}
                                disabled={selectedLoginsToRemove.length >= loginsToRemove && !selectedLoginsToRemove.includes(sub.id)}
                                className={`w-full p-3 rounded-lg border-2 text-left transition ${
                                  selectedLoginsToRemove.includes(sub.id)
                                    ? 'border-red-500 bg-red-50'
                                    : selectedLoginsToRemove.length >= loginsToRemove
                                    ? 'border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed'
                                    : 'border-gray-200 hover:border-red-300 hover:bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-semibold text-gray-900">Login {index + 1}</p>
                                    <p className="text-sm text-gray-600 mt-1 font-mono">{sub.app_username}</p>
                                    {sub.panel_name && (
                                      <p className="text-xs text-gray-500 mt-1">{sub.panel_name}</p>
                                    )}
                                  </div>
                                  {selectedLoginsToRemove.includes(sub.id) && (
                                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                      <X className="w-3 h-3 text-white" />
                                    </div>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          setSelectedPlan(null);
                          setSelectedLoginsToRemove([]);
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleConfirmPlanChange}
                        disabled={(isDowngrade && selectedLoginsToRemove.length !== loginsToRemove) || processingDowngrade}
                        className={`flex-1 px-4 py-2 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 ${
                          isDowngrade
                            ? 'bg-orange-600 hover:bg-orange-700'
                            : changeType === 'upgrade'
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {processingDowngrade ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Processando...</span>
                          </>
                        ) : (
                          <>
                            {isDowngrade
                              ? 'Confirmar Downgrade'
                              : changeType === 'upgrade'
                              ? 'Confirmar Upgrade'
                              : 'Confirmar Mudança'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
