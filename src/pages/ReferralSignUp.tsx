import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Gift, CheckCircle, Smartphone, MessageCircle, Tv } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function ReferralSignUp() {
  const { user, signOut } = useAuth();
  const [referralCode, setReferralCode] = useState('');
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [device, setDevice] = useState('');
  const [deviceDetail, setDeviceDetail] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingReferrer, setLoadingReferrer] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [nameError, setNameError] = useState('');
  const [whatsappError, setWhatsappError] = useState('');
  const [isNameValid, setIsNameValid] = useState(false);
  const [isWhatsappValid, setIsWhatsappValid] = useState(false);
  const [showDuplicateAlert, setShowDuplicateAlert] = useState(false);
  const [duplicateWhatsapp, setDuplicateWhatsapp] = useState('');
  const [isExistingClient, setIsExistingClient] = useState(false); // Para diferenciar cliente offline

  // Captura o código de indicação da URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    
    if (ref) {
      setReferralCode(ref.toUpperCase());
      loadReferrerInfo(ref.toUpperCase());
    } else {
      setLoadingReferrer(false);
    }
  }, []);

  // Carrega informações do indicador
  const loadReferrerInfo = async (code: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('full_name')
        .eq('referral_code', code)
        .maybeSingle() as { data: any | null; error: any };

      if (error) {
        console.error('Erro ao buscar indicador:', error);
      } else if (data) {
        setReferrerName(data.full_name);
      }
    } catch (err) {
      console.error('Erro ao carregar informações do indicador:', err);
    } finally {
      setLoadingReferrer(false);
    }
  };

  // Opções de dispositivos
  const devices = [
    'TV Smart',
    'Tvbox',
    'Stick TV',
    'Fire TV',
    'Chrome Cast',
    'Celular/Tablet',
    'Computador',
  ];

  // Marcas de TV Smart
  const tvSmartBrands = [
    'Samsung',
    'LG',
    'Sony',
    'AOC',
    'TCL',
    'Philips',
    'Panasonic',
    'Philco',
    'SEMP',
    'Outra Marca de TV',
  ];

  // Modelos de Chrome Cast
  const chromeCastModels = [
    '1ª geração',
    '2ª geração',
    '3ª geração',
    'Ultra 4K',
    '4ª geração',
  ];

  // Sistemas operacionais para Celular/Tablet
  const mobileOS = ['Android', 'iOS (iPhone)'];

  // --- Validação WhatsApp Brasil (DDD válido + nono dígito) ---
  const VALID_DDDS = new Set([
    '11','12','13','14','15','16','17','18','19','21','22','24','27','28',
    '31','32','33','34','35','37','38','41','42','43','44','45','46','47','48','49',
    '51','53','54','55','61','62','63','64','65','66','67','68','69','71','73','74',
    '75','77','79','81','82','83','84','85','86','87','88','89','91','92','93','94',
    '95','96','97','98','99'
  ]);

  const onlyDigits = (v: string) => (v || "").replace(/\D/g, "");

  const stripBR = (raw: string) => {
    let d = onlyDigits(raw);
    if (d.startsWith("55")) d = d.slice(2); // remove DDI se vier (+55)
    return d;
  };

  const isObviousFake = (d: string) =>
    /^(\d)\1{10}$/.test(d) || /(012345|123456|234567|345678|456789|987654|876543)/.test(d);

  const isValidWhatsappBR = (raw: string): boolean => {
    const d = stripBR(raw);
    if (d.length !== 11) return false;             // celular = 11 dígitos
    if (!VALID_DDDS.has(d.slice(0,2))) return false; // DDD válido
    if (d[2] !== '9') return false;                // nono dígito obrigatório
    if (isObviousFake(d)) return false;            // bloqueia sequências óbvias
    return true;
  };

  const formatarTelefoneBR = (raw: string): string => {
    const d = stripBR(raw);
    if (d.length < 10) return d || "—";
    const ddd = d.slice(0,2);
    if (d.length === 11) {
      return `(${ddd}) ${d.slice(2,7)}-${d.slice(7,11)}`;
    }
    return `(${ddd}) ${d.slice(2,6)}-${d.slice(6,10)}`;
  };

  // Validação de nome completo (deve ter pelo menos 2 palavras)
  const isValidFullName = (name: string): boolean => {
    const nome = (name || "").trim();
    return nome.split(/\s+/).filter(Boolean).length >= 2;
  };

  // Handler para validação de nome
  const handleNameChange = (value: string) => {
    setFullName(value);
    const isValid = isValidFullName(value);
    setIsNameValid(isValid);
    setNameError(isValid ? '' : 'Digite seu nome completo (Nome e Sobrenome).');
  };

  // Handler para validação de WhatsApp
  const handleWhatsappChange = (value: string) => {
    setWhatsapp(value);
    const isValid = isValidWhatsappBR(value);
    setIsWhatsappValid(isValid);
    setWhatsappError(isValid ? '' : 'Informe um WhatsApp válido do Brasil (ex.: (47) 99999-9999 ou +55 47 99999-9999).');
  };

  // Verifica se precisa mostrar campo condicional
  const needsDeviceDetail = device === 'TV Smart' || device === 'Chrome Cast' || device === 'Celular/Tablet';

  // Reseta deviceDetail quando muda o dispositivo
  useEffect(() => {
    setDeviceDetail('');
  }, [device]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validações
    if (!isNameValid) {
      setError('Por favor, informe seu nome completo (Nome e Sobrenome).');
      setLoading(false);
      return;
    }

    if (!email) {
      setError('Por favor, informe seu e-mail.');
      setLoading(false);
      return;
    }

    if (!isWhatsappValid) {
      setError('Por favor, informe um WhatsApp válido do Brasil.');
      setLoading(false);
      return;
    }

    if (!device) {
      setError('Por favor, selecione um dispositivo.');
      setLoading(false);
      return;
    }

    if (needsDeviceDetail && !deviceDetail) {
      setError('Por favor, selecione a opção do dispositivo.');
      setLoading(false);
      return;
    }

    try {
      // Normaliza o WhatsApp para comparação (remove DDI e caracteres não numéricos)
      const whatsappNormalized = stripBR(whatsapp); // Remove +55 se existir e deixa só números

      // Busca todas as solicitações para verificar duplicatas
      // (busca por telefone normalizado ou formato original)
      const { data: allRequests, error: checkError } = await supabase
        .from('testes_liberados')
        .select('id, nome, telefone, created_at, assinante') as { data: any[] | null; error: any };

      if (checkError) {
        console.error('Erro ao verificar duplicata:', checkError);
      }

      // Verifica se já existe uma solicitação com este WhatsApp (normalizado)
      const existingRequest = allRequests?.find(req => {
        const reqPhoneNormalized = stripBR(req.telefone || ''); // Remove +55 para comparar
        return reqPhoneNormalized === whatsappNormalized;
      });

      // Se já existe uma solicitação com este WhatsApp
      if (existingRequest) {
        setDuplicateWhatsapp(whatsapp);
        setShowDuplicateAlert(true);
        setLoading(false);
        return;
      }

      // Verifica também se já existe como usuário cadastrado
      const { data: allUsers } = await supabase
        .from('users')
        .select('id, full_name, email, phone') as { data: any[] | null; error: any };

      const existingUser = allUsers?.find(user => {
        const userPhoneNormalized = stripBR(user.phone || ''); // Remove DDI para comparar
        return userPhoneNormalized === whatsappNormalized ||
               user.email?.toLowerCase() === email.toLowerCase();
      });

      if (existingUser) {
        setDuplicateWhatsapp(whatsapp);
        setIsExistingClient(true); // Cliente com acesso ao painel
        setShowDuplicateAlert(true);
        setLoading(false);
        return;
      }

      // Verifica também se já existe como cliente offline (paga via WhatsApp)
      const { data: offlineClients } = await supabase
        .from('offline_clients')
        .select('id, nome, telefone')
        .is('migrated_to_user_id', null) as { data: any[] | null; error: any }; // Apenas clientes que não foram migrados

      const existingOfflineClient = offlineClients?.find(client => {
        const clientPhoneNormalized = stripBR(client.telefone || ''); // Remove DDI para comparar
        return clientPhoneNormalized === whatsappNormalized;
      });

      if (existingOfflineClient) {
        setDuplicateWhatsapp(whatsapp);
        setIsExistingClient(true); // Marca como cliente existente
        setShowDuplicateAlert(true);
        setLoading(false);
        return;
      }

      // Busca o ID do indicador se houver
      let referrerIdBotconversa = null;
      if (referralCode) {
        const { data: referrer } = await supabase
          .from('users')
          .select('id, id_botconversa')
          .eq('referral_code', referralCode)
          .maybeSingle() as { data: any | null; error: any };
        referrerIdBotconversa = referrer?.id_botconversa || null;
      }

      // Monta o campo dispositivo com device e device_detail
      const dispositivo = deviceDetail
        ? `${device} ${deviceDetail}`
        : device;

      // Normaliza o telefone para salvar com DDI padrão do Brasil (+55)
      let phoneToSave = onlyDigits(whatsapp);
      // Se não começar com 55, adiciona o DDI do Brasil
      if (!phoneToSave.startsWith('55')) {
        phoneToSave = '55' + phoneToSave;
      }
      // Formata com o + na frente
      phoneToSave = '+' + phoneToSave;

      // Salva a solicitação na tabela testes_liberados
      const { error: dbError } = await supabase
        .from('testes_liberados')
        .insert({
          nome: fullName,
          telefone: phoneToSave, // Sempre salva com +55 (DDI do Brasil)
          email: email,
          dispositivo: dispositivo, // Ex: "TV Smart Samsung" ou "Chrome Cast 3ª geração"
          aplicativo: null, // Será informado via WhatsApp
          referral_code: referralCode, // Código de indicação usado
          data_teste: new Date().toISOString().split('T')[0], // Data no formato YYYY-MM-DD
          assinante: false, // Ainda não é assinante, apenas solicitou teste
          valor_pago: 0,
          quantidade_teste: 1,
          id_botconversa: referrerIdBotconversa || null, // ID do bot do indicador (será puxado depois se não houver)
        } as any);

      if (dbError) {
        console.error('Erro ao salvar solicitação:', dbError);
        // Verifica se é erro de duplicata
        if (dbError.code === '23505' || dbError.message?.includes('duplicate') || dbError.message?.includes('unique')) {
          setDuplicateWhatsapp(whatsapp);
          setShowDuplicateAlert(true);
        } else {
          setError('Erro ao salvar solicitação. Tente novamente ou entre em contato conosco.');
        }
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err: any) {
      setError('Erro ao enviar solicitação. Tente novamente.');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  // Formata WhatsApp para link
  const formatWhatsAppLink = (phone: string, message: string = '') => {
    // Remove caracteres não numéricos
    const numbers = phone.replace(/\D/g, '');
    const url = `https://wa.me/55${numbers}`;
    if (message) {
      return `${url}?text=${encodeURIComponent(message)}`;
    }
    return url;
  };

  // WhatsApp do suporte
  const supportWhatsApp = '4799906423'; // 47 9990-6423 (a função formatWhatsAppLink já adiciona o 55)
  const supportMessage = 'Olá! Já solicitei um teste anteriormente e gostaria de tirar dúvidas e assinar meu plano.';
  const supportWhatsAppLink = formatWhatsAppLink(supportWhatsApp, supportMessage);

  // Modal de alerta para WhatsApp duplicado
  if (showDuplicateAlert) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 text-center">
          <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          {isExistingClient ? (
            <>
              <h2 className="text-2xl font-bold text-white mb-4">Você já é nosso cliente!</h2>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Identifiquei que você já é nosso cliente.
                <br /><br />
                Se precisa de suporte, clique no botão abaixo para falar diretamente com nossa equipe pelo WhatsApp.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-white mb-4">Número já cadastrado</h2>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Este número de telefone já foi usado para solicitar teste anteriormente.
                <br /><br />
                Para assinar um plano ou tirar dúvidas, clique no botão abaixo e fale com nosso suporte pelo WhatsApp.
              </p>
            </>
          )}
          <div className="space-y-3">
            <a
              href={supportWhatsAppLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center space-x-2 w-full px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition transform hover:scale-[1.02]"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Falar com o Suporte no WhatsApp</span>
            </a>
            <button
              onClick={() => {
                setShowDuplicateAlert(false);
                setDuplicateWhatsapp('');
                setIsExistingClient(false);
                setWhatsapp('');
              }}
              className="w-full px-6 py-3 bg-gray-700 text-gray-300 font-semibold rounded-lg hover:bg-gray-600 transition"
            >
              Usar outro número
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loadingReferrer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Carregando informações...</p>
        </div>
      </div>
    );
  }

  if (!referralCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Código de Indicação Inválido</h2>
          <p className="text-gray-600 mb-6">
            O link de indicação não contém um código válido.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Voltar para o início
          </a>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Você já está logado</h2>
          <p className="text-gray-600 mb-6">
            Para solicitar um teste IPTV com este código de indicação, você precisa fazer logout primeiro.
          </p>
          <div className="space-y-3">
            <button
              onClick={async () => {
                await signOut();
                window.location.reload();
              }}
              className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              Fazer Logout e Continuar
            </button>
            <a
              href="/"
              className="block px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
            >
              Voltar para o Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Solicitação Enviada!</h2>
          <p className="text-gray-300 mb-6">
            Você vai receber uma mensagem no WhatsApp com as instruções para continuar a instalação. Aguarde uns minutos!
          </p>
          <a
            href={supportWhatsAppLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center space-x-2 w-full px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition transform hover:scale-[1.02]"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Falar com o Suporte no WhatsApp</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Logo UniFlix */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center space-x-3 mb-4">
            <div className="relative">
              <Tv className="w-12 h-12 text-red-600" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full"></div>
            </div>
            <div>
              <span className="text-4xl font-black text-red-600">Uni</span>
              <span className="text-4xl font-bold text-red-500">Flix</span>
            </div>
          </div>
        </div>

        {/* Banner de Indicação */}
        {referrerName && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-600/20 to-green-500/20 border border-green-500/30 rounded-xl text-white text-center backdrop-blur-sm">
            <Gift className="w-6 h-6 mx-auto mb-2 text-green-400" />
            <p className="text-sm font-semibold">
              Você foi indicado por <strong className="text-green-400">{referrerName}</strong>!
            </p>
            <p className="text-xs text-gray-300 mt-1">
              Código: <strong>{referralCode}</strong>
            </p>
          </div>
        )}

                {/* Mensagem de Apresentação */}
                <div className="mb-8 text-center">
                  {referrerName && (
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                      🎁 {referrerName} te enviou um presente!
                    </h1>
                  )}
                  {!referrerName && (
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                      🎁 Você recebeu um presente!
                    </h1>
                  )}
                  <p className="text-xl text-gray-300 mb-4 leading-relaxed font-semibold">
                    Você acaba de ganhar <span className="text-green-400 font-bold">R$ 10 de desconto</span> na sua primeira recarga da Uniflix.
                  </p>
                  <p className="text-lg text-gray-300 mb-3 leading-relaxed">
                    Entre agora, faça seu teste e descubra por que todo mundo está migrando pra cá!
                  </p>
                </div>

        <div className="p-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-white mb-2">
                        Nome Completo <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => handleNameChange(e.target.value)}
                        onBlur={(e) => handleNameChange(e.target.value)}
                        className={`w-full px-4 py-3 bg-slate-700/50 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 transition ${
                          nameError ? 'border-red-500' : isNameValid ? 'border-green-500' : 'border-slate-600'
                        }`}
                        placeholder="Digite seu nome completo (Nome e Sobrenome)"
                        required
                      />
                      {nameError && (
                        <p className="mt-1 text-sm text-red-400">{nameError}</p>
                      )}
                    </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                E-mail <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="whatsapp" className="block text-sm font-medium text-white mb-2">
                WhatsApp <span className="text-red-500">*</span>
              </label>
              <input
                id="whatsapp"
                type="tel"
                value={whatsapp}
                onChange={(e) => handleWhatsappChange(e.target.value)}
                onBlur={(e) => handleWhatsappChange(e.target.value)}
                inputMode="numeric"
                autoComplete="tel"
                pattern="^(?:\+?55\s*)?(?:\(?11|12|13|14|15|16|17|18|19|21|22|24|27|28|31|32|33|34|35|37|38|41|42|43|44|45|46|47|48|49|51|53|54|55|61|62|63|64|65|66|67|68|69|71|73|74|75|77|79|81|82|83|84|85|86|87|88|89|91|92|93|94|95|96|97|98|99\)?\s*)9\d{4}-?\d{4}$"
                title="Informe um WhatsApp válido do Brasil (ex.: (47) 99999-9999 ou +55 47 99999-9999)."
                className={`w-full px-4 py-3 bg-slate-700/50 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 transition ${
                  whatsappError ? 'border-red-500' : isWhatsappValid ? 'border-green-500' : 'border-slate-600'
                }`}
                placeholder="(47) 99999-9999"
                required
              />
              {whatsappError && (
                <p className="mt-1 text-sm text-red-400">{whatsappError}</p>
              )}
              {isWhatsappValid && whatsapp && (
                <p className="mt-1 text-sm text-green-400">
                  ✓ {formatarTelefoneBR(whatsapp)}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="device" className="block text-sm font-medium text-white mb-2">
                Qual dispositivo deseja testar? <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="device"
                  value={device}
                  onChange={(e) => setDevice(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition appearance-none cursor-pointer pr-10"
                  required
                >
                  <option value="" className="bg-slate-700">Selecione uma opção</option>
                  {devices.map((dev) => (
                    <option key={dev} value={dev} className="bg-slate-700">
                      {dev}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Campos Condicionais */}
            {device === 'TV Smart' && (
              <div>
                <label htmlFor="deviceDetail" className="block text-sm font-medium text-white mb-2">
                  Marca da TV <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="deviceDetail"
                    value={deviceDetail}
                    onChange={(e) => setDeviceDetail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition appearance-none cursor-pointer pr-10"
                    required
                  >
                    <option value="" className="bg-slate-700">Selecione a marca</option>
                    {tvSmartBrands.map((brand) => (
                      <option key={brand} value={brand} className="bg-slate-700">
                        {brand}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {device === 'Chrome Cast' && (
              <div>
                <label htmlFor="deviceDetail" className="block text-sm font-medium text-white mb-2">
                  Modelo do Chrome Cast <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="deviceDetail"
                    value={deviceDetail}
                    onChange={(e) => setDeviceDetail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition appearance-none cursor-pointer pr-10"
                    required
                  >
                    <option value="" className="bg-slate-700">Selecione o modelo</option>
                    {chromeCastModels.map((model) => (
                      <option key={model} value={model} className="bg-slate-700">
                        {model}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {device === 'Celular/Tablet' && (
              <div>
                <label htmlFor="deviceDetail" className="block text-sm font-medium text-white mb-2">
                  Sistema Operacional <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="deviceDetail"
                    value={deviceDetail}
                    onChange={(e) => setDeviceDetail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition appearance-none cursor-pointer pr-10"
                    required
                  >
                    <option value="" className="bg-slate-700">Selecione o sistema</option>
                    {mobileOS.map((os) => (
                      <option key={os} value={os} className="bg-slate-700">
                        {os}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

                    <button
                      type="submit"
                      disabled={loading || !isNameValid || !isWhatsappValid}
                      className="w-full py-4 px-6 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                    >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enviando...
                </span>
              ) : (
                'SOLICITAR TESTE IPTV'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
