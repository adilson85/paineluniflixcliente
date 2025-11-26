import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Header } from '../components/Dashboard/Header';
import { SubscriptionCard } from '../components/Dashboard/SubscriptionCard';
import { ReferralCard } from '../components/Dashboard/ReferralCard';
import { WithdrawalStatus } from '../components/Dashboard/WithdrawalStatus';
import { TransactionsCard } from '../components/Dashboard/TransactionsCard';
import { PaymentCard } from '../components/Dashboard/PaymentCard';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { CompleteRegistrationModal } from '../components/Dashboard/CompleteRegistrationModal';

export function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [allSubscriptions, setAllSubscriptions] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [subscribersCount, setSubscribersCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showCompleteRegistration, setShowCompleteRegistration] = useState(false);

  const loadData = async () => {
    if (!user) return;

    const { data: profileData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    // Busca TODAS as assinaturas ativas (um plano pode ter múltiplos logins)
    const { data: subscriptionsData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    // Log para debug
    if (subscriptionError) {
      console.error('❌ Erro ao buscar assinaturas:', subscriptionError);
    }
    if (subscriptionsData && subscriptionsData.length > 0) {
      console.log('✅ Assinaturas encontradas:', subscriptionsData.length);
      console.log('   Detalhes de todas as assinaturas:');
      subscriptionsData.forEach((sub, index) => {
        console.log(`     ${index + 1}. ID: ${sub.id}, Login: ${sub.app_username}, Status: ${sub.status}, Plan ID: ${sub.plan_id}`);
      });
      console.log('   Primeira assinatura:', { 
        id: subscriptionsData[0].id, 
        status: subscriptionsData[0].status,
        hasPlan: !!subscriptionsData[0].plan,
        planId: subscriptionsData[0].plan_id,
        app_username: subscriptionsData[0].app_username
      });
    } else {
      console.warn('⚠️ Nenhuma assinatura ativa encontrada para o usuário:', user.id);
    }

    // Usa a primeira assinatura para dados do plano (todas devem ter o mesmo plano)
    const subscriptionData = subscriptionsData && subscriptionsData.length > 0 ? subscriptionsData[0] : null;

    // Busca referrals (pessoas que se cadastraram pelo link)
    const { data: referralsRawData, error: referralsError } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', user.id);

    if (referralsError) {
      console.error('❌ Erro ao buscar referrals:', referralsError);
    } else {
      console.log('✅ Referrals encontrados:', referralsRawData?.length || 0);
      if (referralsRawData && referralsRawData.length > 0) {
        console.log('   Detalhes dos referrals do banco:');
        referralsRawData.forEach((ref, index) => {
          console.log(`     ${index + 1}. Referrer ID: ${ref.referrer_id}, Referred ID: ${ref.referred_id}, ID: ${ref.id}`);
        });
      }
    }

    // Busca também solicitações de teste que usaram o código de indicação
    const referralCodeToSearch = (profileData?.referral_code || '').trim().toUpperCase();
    console.log('🔍 Buscando testes_liberados com referral_code:', referralCodeToSearch);
    console.log('   Profile referral_code original:', profileData?.referral_code);
    console.log('   Profile completo:', profileData ? Object.keys(profileData) : 'null');
    
    const { data: testRequestsData, error: testRequestsError } = await supabase
      .from('testes_liberados')
      .select('*')
      .ilike('referral_code', referralCodeToSearch) // Usa ilike para case-insensitive
      .order('created_at', { ascending: false });

    if (testRequestsError) {
      console.error('❌ Erro ao buscar testes_liberados:', testRequestsError);
    } else {
      console.log('✅ Testes liberados encontrados:', testRequestsData?.length || 0);
      if (testRequestsData && testRequestsData.length > 0) {
        console.log('   Detalhes dos testes do banco:');
        testRequestsData.forEach((test, index) => {
          console.log(`     ${index + 1}. Nome: ${test.nome}, Email: ${test.email}, Telefone: ${test.telefone}, Referral Code: ${test.referral_code}, ID: ${test.id}`);
        });
      }
    }

    // Função auxiliar para normalizar telefone (remove caracteres não numéricos)
    const normalizePhone = (phone: string | null | undefined): string => {
      if (!phone) return '';
      return phone.replace(/\D/g, '');
    };

    // Função auxiliar para normalizar email (lowercase e trim)
    const normalizeEmail = (email: string | null | undefined): string => {
      if (!email) return '';
      return email.toLowerCase().trim();
    };

    let referralsData = [];
    const processedUserIds = new Set<string>(); // Para evitar duplicatas de referrals
    const processedTestPhones = new Set<string>(); // Para evitar duplicatas de testes
    
    // Processa referrals (pessoas que se cadastraram e viraram usuários)
    if (referralsRawData) {
      // Remove duplicatas baseado em referred_id
      const uniqueReferrals = referralsRawData.filter((ref, index, self) => 
        index === self.findIndex(r => r.referred_id === ref.referred_id)
      );
      
      console.log('🔍 Referrals únicos (após remover duplicatas):', uniqueReferrals.length);
      
      for (let i = 0; i < uniqueReferrals.length; i++) {
        const referral = uniqueReferrals[i];
        
        // Evita processar o mesmo usuário duas vezes
        if (processedUserIds.has(referral.referred_id)) {
          console.log('⚠️ Referral duplicado ignorado:', referral.referred_id);
          continue;
        }
        processedUserIds.add(referral.referred_id);

        let profileData = null;
        
        // Tenta buscar o perfil pelo referred_id
        console.log(`🔍 Buscando perfil para referred_id: ${referral.referred_id}`);
        const { data: profileDataById, error: profileError } = await supabase
          .from('users')
          .select('full_name, phone, email, id')
          .eq('id', referral.referred_id)
          .maybeSingle();

        if (profileError) {
          console.error(`❌ Erro ao buscar perfil:`, profileError);
        }

        if (profileDataById) {
          profileData = profileDataById;
          console.log(`✅ Perfil encontrado por ID: ${profileData.full_name}, ${profileData.email}, ${profileData.phone}, ID: ${profileData.id}`);
        } else {
          console.log(`⚠️ Perfil não encontrado para referred_id: ${referral.referred_id}`);
          
          // Se não encontrou pelo ID, busca todos os usuários que podem corresponder
          // pelos testes que usaram o código de indicação
          if (testRequestsData && testRequestsData.length > 0) {
            for (const testRequest of testRequestsData) {
              const testPhoneNormalized = normalizePhone(testRequest.telefone);
              const testEmailNormalized = normalizeEmail(testRequest.email);
              
              console.log(`🔍 Buscando usuário por telefone/email: ${testPhoneNormalized} / ${testEmailNormalized}`);
              
              // Busca usuário pelo telefone (normalizado)
              let userByContact = null;
              
              if (testPhoneNormalized) {
                const { data: usersByPhone } = await supabase
                  .from('users')
                  .select('full_name, phone, email, id')
                  .not('phone', 'is', null);
                
                if (usersByPhone) {
                  userByContact = usersByPhone.find(u => {
                    const userPhoneNormalized = normalizePhone(u.phone);
                    return userPhoneNormalized === testPhoneNormalized;
                  });
                }
              }
              
              // Se não encontrou pelo telefone, tenta pelo email
              if (!userByContact && testEmailNormalized) {
                const { data: userByEmail } = await supabase
                  .from('users')
                  .select('full_name, phone, email, id')
                  .ilike('email', testEmailNormalized)
                  .maybeSingle();
                
                if (userByEmail) {
                  userByContact = userByEmail;
                }
              }
              
              if (userByContact) {
                console.log(`✅ Usuário encontrado: ${userByContact.full_name}, ${userByContact.email}, ${userByContact.phone}, ID: ${userByContact.id}`);
                
                // Verifica se este usuário tem assinatura ativa
                const { data: userSubscriptions } = await supabase
                  .from('subscriptions')
                  .select('id, status')
                  .eq('user_id', userByContact.id)
                  .eq('status', 'active');
                
                console.log(`📋 Assinaturas do usuário encontrado: ${userSubscriptions?.length || 0}`);
                
                // Se tem assinatura ou se é o único usuário encontrado, usa ele
                if ((userSubscriptions && userSubscriptions.length > 0) || !profileData) {
                  profileData = userByContact;
                  console.log(`✅ Perfil encontrado por telefone/email: ${profileData.full_name}, ${profileData.email}, ${profileData.phone}`);
                  // Atualiza o referred_id para o ID correto
                  referral.referred_id = userByContact.id;
                  break;
                }
              } else {
                console.log(`⚠️ Nenhum usuário encontrado para telefone/email: ${testPhoneNormalized} / ${testEmailNormalized}`);
              }
            }
          }
        }

        // Verifica se é assinante buscando diretamente na tabela testes_liberados
        // onde assinante = true e corresponde ao email ou telefone do perfil
        let hasActiveSubscription = false;
        
        if (profileData) {
          const profileEmail = normalizeEmail(profileData.email);
          const profilePhone = normalizePhone(profileData.phone);
          
          // Busca todos os testes com assinante = true
          const { data: allSubscriberTests, error: testError } = await supabase
            .from('testes_liberados')
            .select('id, assinante, email, telefone')
            .eq('assinante', true);
          
          if (testError) {
            console.log(`⚠️ Erro ao buscar testes_liberados:`, testError);
          } else if (allSubscriberTests && allSubscriberTests.length > 0) {
            // Verifica se algum teste corresponde ao email ou telefone do perfil
            const matchingTest = allSubscriberTests.find(test => {
              const testEmail = normalizeEmail(test.email);
              const testPhone = normalizePhone(test.telefone);
              return (profileEmail && testEmail && profileEmail === testEmail) ||
                     (profilePhone && testPhone && profilePhone === testPhone);
            });
            
            if (matchingTest) {
              hasActiveSubscription = true;
              console.log(`✅ Assinante encontrado na tabela testes_liberados para ${profileData.full_name || 'usuário'}`);
            } else {
              console.log(`⚠️ Nenhum teste com assinante=true corresponde a ${profileData.full_name || 'usuário'} (email: ${profileEmail}, telefone: ${profilePhone})`);
            }
          } else {
            console.log(`⚠️ Nenhum teste com assinante=true encontrado no banco`);
          }
        } else {
          console.log(`⚠️ Sem perfil para verificar assinante (referred_id: ${referral.referred_id})`);
        }

        const userIdToCheck = profileData?.id || referral.referred_id;
        
        const { data: transactionData } = await supabase
          .from('transactions')
          .select('id, created_at, amount, status')
          .eq('user_id', userIdToCheck)
          .eq('type', 'recharge')
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        referralsData.push({
          ...referral,
          profiles: profileData,
          last_transaction: transactionData,
          is_subscriber: hasActiveSubscription,
          type: 'user', // Cadastrado e virou usuário
        });
        
        console.log(`✅ Referral processado: referred_id=${referral.referred_id}, is_subscriber=${hasActiveSubscription}, nome=${profileData?.full_name || 'Sem nome'}`);
      }
    }

    // Processa solicitações de teste (pessoas que solicitaram teste mas ainda não se cadastraram)
    if (testRequestsData) {
      // Remove duplicatas baseado em telefone normalizado
      const uniqueTestRequests = testRequestsData.filter((test, index, self) => {
        const testPhone = normalizePhone(test.telefone);
        return index === self.findIndex(t => normalizePhone(t.telefone) === testPhone && testPhone !== '');
      });
      
      console.log('🔍 Testes únicos (após remover duplicatas):', uniqueTestRequests.length);
      
      // Primeiro, busca os dados dos usuários referenciados nos referrals que não têm perfil
      const referralUserIds = referralsData
        .filter(ref => ref.referred_id && (!ref.profiles || !ref.profiles.phone || !ref.profiles.email))
        .map(ref => ref.referred_id);
      
      const referralUsersMap = new Map();
      if (referralUserIds.length > 0) {
        const { data: referralUsers } = await supabase
          .from('users')
          .select('id, phone, email')
          .in('id', referralUserIds);
        
        if (referralUsers) {
          referralUsers.forEach(user => {
            referralUsersMap.set(user.id, {
              phone: normalizePhone(user.phone),
              email: normalizeEmail(user.email),
            });
          });
        }
      }
      
      for (let i = 0; i < uniqueTestRequests.length; i++) {
        const testRequest = uniqueTestRequests[i];
        const testPhoneNormalized = normalizePhone(testRequest.telefone);
        const testEmailNormalized = normalizeEmail(testRequest.email);
        
        // Evita processar o mesmo telefone duas vezes
        if (testPhoneNormalized && processedTestPhones.has(testPhoneNormalized)) {
          console.log('⚠️ Teste duplicado ignorado (telefone):', testRequest.telefone);
          continue;
        }
        if (testPhoneNormalized) {
          processedTestPhones.add(testPhoneNormalized);
        }
        
        // Verifica se já virou usuário (já está em referrals)
        // Compara usando telefone e email normalizados
        let alreadyInReferrals = false;
        
        for (const ref of referralsData) {
          const refPhoneNormalized = normalizePhone(ref.profiles?.phone);
          const refEmailNormalized = normalizeEmail(ref.profiles?.email);
          
          // Se o referral tem dados, compara diretamente
          if ((testPhoneNormalized && refPhoneNormalized && testPhoneNormalized === refPhoneNormalized) ||
              (testEmailNormalized && refEmailNormalized && testEmailNormalized === refEmailNormalized)) {
            alreadyInReferrals = true;
            console.log(`✅ Teste ${testRequest.telefone} corresponde ao referral (dados diretos)`);
            break;
          }
          
          // Se o referral não tem dados mas tem referred_id, verifica no mapa
          if (ref.referred_id && referralUsersMap.has(ref.referred_id)) {
            const userData = referralUsersMap.get(ref.referred_id);
            if ((testPhoneNormalized && userData.phone && testPhoneNormalized === userData.phone) ||
                (testEmailNormalized && userData.email && testEmailNormalized === userData.email)) {
              alreadyInReferrals = true;
              console.log(`✅ Teste ${testRequest.telefone} corresponde ao referral com referred_id ${ref.referred_id}`);
              break;
            }
          }
        }

        if (!alreadyInReferrals) {
          referralsData.push({
            id: testRequest.id,
            referrer_id: user.id,
            referred_id: null, // Ainda não é usuário
            total_commission_earned: 0,
            last_commission_date: null,
            created_at: testRequest.created_at,
            profiles: {
              full_name: testRequest.nome,
              phone: testRequest.telefone,
              email: testRequest.email,
            },
            last_transaction: null,
            is_subscriber: testRequest.assinante || false,
            type: 'test_request', // Apenas solicitou teste
          });
        } else {
          console.log('⚠️ Teste ignorado (já está em referrals):', testRequest.telefone);
        }
      }
    }

    const { data: transactionsData } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Conta assinantes diretamente da tabela testes_liberados usando o referral_code
    // Reutiliza o referralCodeToSearch já declarado acima
    let subscribersCount = 0;
    
    if (referralCodeToSearch) {
      const { data: subscriberTests, error: subscriberError } = await supabase
        .from('testes_liberados')
        .select('id, assinante')
        .ilike('referral_code', referralCodeToSearch)
        .eq('assinante', true);
      
      if (subscriberError) {
        console.error('❌ Erro ao buscar assinantes:', subscriberError);
      } else {
        subscribersCount = subscriberTests?.length || 0;
        console.log(`✅ Assinantes encontrados com referral_code ${referralCodeToSearch}: ${subscribersCount}`);
      }
    }
    
    // Atualiza o is_subscriber nos referrals baseado na contagem
    referralsData.forEach(ref => {
      if (ref.type === 'user' && profileData) {
        const refEmail = normalizeEmail(ref.profiles?.email);
        const refPhone = normalizePhone(ref.profiles?.phone);
        
        // Verifica se este referral corresponde a algum teste assinante
        if (testRequestsData && testRequestsData.length > 0) {
          const matchingTest = testRequestsData.find(test => {
            const testEmail = normalizeEmail(test.email);
            const testPhone = normalizePhone(test.telefone);
            return test.assinante === true && (
              (refEmail && testEmail && refEmail === testEmail) ||
              (refPhone && testPhone && refPhone === testPhone)
            );
          });
          
          if (matchingTest) {
            ref.is_subscriber = true;
          }
        }
      }
    });
    
    // Filtra apenas os cadastrados para o log
    const registeredReferrals = referralsData.filter(r => r.type === 'user');
    
    console.log('📊 Dados finais de referrals:', {
      total: referralsData.length,
      users: registeredReferrals.length,
      testRequests: referralsData.filter(r => r.type === 'test_request').length,
      subscribers: subscribersCount, // Usa a contagem direta da tabela
    });
    
    // Log detalhado de cada referral para debug
    console.log('🔍 Detalhes dos referrals encontrados:');
    referralsData.forEach((ref, index) => {
      console.log(`  ${index + 1}. Tipo: ${ref.type}, Nome: ${ref.profiles?.full_name || 'Sem nome'}, Email: ${ref.profiles?.email || 'Sem email'}, Telefone: ${ref.profiles?.phone || 'Sem telefone'}, is_subscriber: ${ref.is_subscriber}, ID: ${ref.id}, Referred ID: ${ref.referred_id}`);
    });
    
    // Log específico dos cadastrados e assinantes
    console.log('👥 Cadastrados (tipo user):', registeredReferrals.length);
    registeredReferrals.forEach((ref, index) => {
      console.log(`  ${index + 1}. ${ref.profiles?.full_name || 'Sem nome'} - is_subscriber: ${ref.is_subscriber}`);
    });
    console.log('✅ Total de Assinantes (da tabela testes_liberados):', subscribersCount);

    setProfile(profileData);
    setSubscription(subscriptionData);
    setAllSubscriptions(subscriptionsData || []);
    setReferrals(referralsData || []);
    setTransactions(transactionsData || []);
    setSubscribersCount(subscribersCount);
    setLoading(false);

    // Verifica se o cadastro está completo
    if (profileData) {
      const isRegistrationComplete = !!(
        (profileData as any).cpf &&
        (profileData as any).data_nascimento &&
        (profileData as any).cep &&
        (profileData as any).logradouro &&
        (profileData as any).numero &&
        (profileData as any).bairro &&
        (profileData as any).cidade &&
        (profileData as any).estado
      );

      // Se o cadastro não está completo, mostra o modal
      if (!isRegistrationComplete) {
        setShowCompleteRegistration(true);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header profile={profile} onProfileUpdate={loadData} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <SubscriptionCard 
              subscription={subscription} 
              allSubscriptions={allSubscriptions}
              onPlanChange={loadData}
            />
            <ReferralCard
              referralCode={profile?.referral_code || ''}
              totalCommission={Number(profile?.total_commission) || 0}
              referrals={referrals}
              subscribersCount={subscribersCount}
              userId={user?.id}
              monthlyPrice={subscription?.plan?.monthly_price || undefined}
              subscriptionId={subscription?.id || undefined}
              planType={subscription?.plan?.plan_type || null}
              subscriptionExpirationDate={subscription?.expiration_date || null}
            />
            <WithdrawalStatus userId={user!.id} />
            <TransactionsCard transactions={transactions} />
          </div>

          <div className="space-y-6">
            <PaymentCard
              userId={user!.id}
              planType={subscription?.plan?.plan_type || subscription?.plan_id || null}
              onPaymentSuccess={loadData}
            />
          </div>
        </div>
      </main>

      <WhatsAppButton />

      {/* Modal de Completar Cadastro */}
      {showCompleteRegistration && profile && (
        <CompleteRegistrationModal
          profile={profile}
          onClose={() => setShowCompleteRegistration(false)}
          onUpdate={loadData}
        />
      )}
    </div>
  );
}
