import { useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ProfileEditModalProps {
  profile: any;
  onClose: () => void;
  onUpdate: () => void;
}

interface AddressData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export function ProfileEditModal({ profile, onClose, onUpdate }: ProfileEditModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form fields
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [cpf, setCpf] = useState(profile?.cpf || '');
  const [dataNascimento, setDataNascimento] = useState(
    profile?.data_nascimento ? profile.data_nascimento.split('T')[0] : ''
  );
  const [cep, setCep] = useState(profile?.cep || '');
  const [logradouro, setLogradouro] = useState(profile?.logradouro || '');
  const [numero, setNumero] = useState(profile?.numero || '');
  const [complemento, setComplemento] = useState(profile?.complemento || '');
  const [bairro, setBairro] = useState(profile?.bairro || '');
  const [cidade, setCidade] = useState(profile?.cidade || '');
  const [estado, setEstado] = useState(profile?.estado || '');

  // Campos de senha
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Validação de CPF
  const validateCPF = (cpfValue: string): boolean => {
    const cleanCpf = cpfValue.replace(/\D/g, '');
    if (cleanCpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleanCpf)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cleanCpf.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cleanCpf.charAt(10))) return false;

    return true;
  };

  // Formatação de CPF
  const formatCPF = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  // Formatação de CEP
  const formatCEP = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return value;
  };

  // Validação de WhatsApp Brasil
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
    if (d.startsWith("55")) d = d.slice(2);
    return d;
  };

  const isObviousFake = (d: string) =>
    /^(\d)\1{10}$/.test(d) || /(012345|123456|2334567|345678|456789|987654|876543)/.test(d);

  const isValidWhatsappBR = (raw: string): boolean => {
    const d = stripBR(raw);
    if (d.length !== 11) return false;
    if (!VALID_DDDS.has(d.slice(0,2))) return false;
    if (d[2] !== '9') return false;
    if (isObviousFake(d)) return false;
    return true;
  };

  // Formatação de telefone
  const formatPhone = (value: string): string => {
    const numbers = onlyDigits(value);
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  // Buscar endereço via CEP
  const fetchAddressByCEP = async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setLoadingCep(true);
    setError(null);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data: AddressData = await response.json();

      if (data.erro) {
        setError('CEP não encontrado');
        setLoadingCep(false);
        return;
      }

      setLogradouro(data.logradouro || '');
      setBairro(data.bairro || '');
      setCidade(data.localidade || '');
      setEstado(data.uf || '');
      setComplemento(data.complemento || '');
    } catch (err) {
      setError('Erro ao buscar CEP. Tente novamente.');
    } finally {
      setLoadingCep(false);
    }
  };

  // Validação de email
  const validateEmail = (emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  // Validação de data de nascimento
  const validateDate = (dateValue: string): boolean => {
    if (!dateValue) return true; // Opcional
    const date = new Date(dateValue);
    const today = new Date();
    const minDate = new Date('1900-01-01');
    return date <= today && date >= minDate;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validações
    if (!fullName.trim()) {
      setError('Nome completo é obrigatório');
      return;
    }

    if (cpf && !validateCPF(cpf)) {
      setError('CPF inválido');
      return;
    }

    if (email && !validateEmail(email)) {
      setError('E-mail inválido');
      return;
    }

    if (phone && !isValidWhatsappBR(phone)) {
      setError('Telefone inválido. Digite um número de WhatsApp válido (DDD + 9 dígitos)');
      return;
    }

    if (dataNascimento && !validateDate(dataNascimento)) {
      setError('Data de nascimento inválida');
      return;
    }

    // Validação de senha
    if (newPassword || confirmPassword || currentPassword) {
      if (!currentPassword) {
        setError('Digite sua senha atual para alterar a senha');
        return;
      }
      if (!newPassword) {
        setError('Digite a nova senha');
        return;
      }
      if (newPassword.length < 6) {
        setError('A nova senha deve ter pelo menos 6 caracteres');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('As senhas não conferem');
        return;
      }
    }

    setLoading(true);

    try {
      let emailChangeRequested = false;
      let passwordChangeRequested = false;

      // Se a senha foi alterada, atualizar primeiro
      if (newPassword && currentPassword) {
        // Primeiro, validar a senha atual fazendo login
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user?.email!,
          password: currentPassword,
        });

        if (signInError) {
          throw new Error('Senha atual incorreta');
        }

        // Atualizar para a nova senha
        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (passwordError) {
          throw new Error(`Erro ao atualizar senha: ${passwordError.message}`);
        }

        passwordChangeRequested = true;
      }

      // Se o email mudou, atualizar no auth.users PRIMEIRO
      // O Supabase enviará automaticamente um email de confirmação
      if (email && email !== profile?.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: email.trim(),
        });

        if (emailError) {
          throw new Error(`Erro ao atualizar email: ${emailError.message}`);
        }

        emailChangeRequested = true;
      }

      // Preparar dados para atualização (SEM email - será sincronizado pelo trigger após confirmação)
      const updateData: any = {
        full_name: fullName.trim(),
        updated_at: new Date().toISOString(),
      };

      // NÃO incluir email aqui - será atualizado automaticamente pelo trigger após confirmação

      if (phone) {
        updateData.phone = onlyDigits(phone);
      }

      if (cpf) {
        updateData.cpf = cpf.replace(/\D/g, '');
      }

      if (dataNascimento) {
        updateData.data_nascimento = new Date(dataNascimento).toISOString();
      }

      // Campos de endereço
      if (cep) {
        updateData.cep = cep.replace(/\D/g, '');
      }
      if (logradouro) {
        updateData.logradouro = logradouro.trim();
      }
      if (numero) {
        updateData.numero = numero.trim();
      }
      if (complemento) {
        updateData.complemento = complemento.trim();
      }
      if (bairro) {
        updateData.bairro = bairro.trim();
      }
      if (cidade) {
        updateData.cidade = cidade.trim();
      }
      if (estado) {
        updateData.estado = estado.trim().toUpperCase();
      }

      // Remove campos undefined/null para evitar erros
      const cleanUpdateData: Record<string, any> = {};
      Object.keys(updateData).forEach((key: string) => {
        if (updateData[key] !== undefined && updateData[key] !== null && updateData[key] !== '') {
          cleanUpdateData[key] = updateData[key];
        }
      });

      // Atualizar tabela users (sem email)
      const { error: updateError } = await supabase
        .from('users')
        // @ts-ignore - Supabase type issue with dynamic updates
        .update(cleanUpdateData)
        .eq('id', user?.id!);

      if (updateError) {
        throw updateError;
      }

      // Mensagem de sucesso diferente se mudou email ou senha
      if (emailChangeRequested && passwordChangeRequested) {
        setSuccess(
          `✅ Dados atualizados!

🔒 Senha alterada com sucesso!

📧 Um email de confirmação foi enviado para ${email}.

⚠️ Você deve confirmar o novo email para que a alteração seja concluída. Até lá, continue usando o email atual para login.`
        );
      } else if (emailChangeRequested) {
        setSuccess(
          `✅ Dados atualizados!

📧 Um email de confirmação foi enviado para ${email}.

⚠️ Você deve confirmar o novo email para que a alteração seja concluída. Até lá, continue usando o email atual para login.`
        );
      } else if (passwordChangeRequested) {
        setSuccess('✅ Perfil atualizado com sucesso!\n\n🔒 Senha alterada com sucesso!');
      } else {
        setSuccess('Perfil atualizado com sucesso!');
      }

      setTimeout(() => {
        onUpdate();
        onClose();
      }, (emailChangeRequested || passwordChangeRequested) ? 3000 : 1500);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">Editar Perfil</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome Completo */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* E-mail */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              E-mail
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {email !== profile?.email && email && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  ⚠️ <strong>Alteração de email requer confirmação.</strong> Um email será enviado para {email} para você confirmar a mudança. Até lá, continue usando seu email atual para login.
                </p>
              </div>
            )}
          </div>

          {/* Telefone/WhatsApp */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Telefone/WhatsApp
            </label>
            <input
              type="text"
              id="phone"
              value={phone}
              onChange={(e) => {
                const formatted = formatPhone(e.target.value);
                setPhone(formatted);
              }}
              placeholder="(00) 00000-0000"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                phone && !isValidWhatsappBR(phone)
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
              }`}
            />
            {phone && !isValidWhatsappBR(phone) && (
              <p className="text-xs text-red-600 mt-1">
                Digite um número de WhatsApp válido (DDD + 9 dígitos)
              </p>
            )}
            {phone && isValidWhatsappBR(phone) && (
              <p className="text-xs text-green-600 mt-1">
                ✓ Número válido
              </p>
            )}
          </div>

          {/* CPF */}
          <div>
            <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-2">
              CPF
            </label>
            <input
              type="text"
              id="cpf"
              value={cpf}
              onChange={(e) => {
                const formatted = formatCPF(e.target.value);
                setCpf(formatted);
              }}
              maxLength={14}
              placeholder="000.000.000-00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Data de Nascimento */}
          <div>
            <label htmlFor="dataNascimento" className="block text-sm font-medium text-gray-700 mb-2">
              Data de Nascimento
            </label>
            <input
              type="date"
              id="dataNascimento"
              value={dataNascimento}
              onChange={(e) => setDataNascimento(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* CEP */}
          <div>
            <label htmlFor="cep" className="block text-sm font-medium text-gray-700 mb-2">
              CEP
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                id="cep"
                value={cep}
                onChange={(e) => {
                  const formatted = formatCEP(e.target.value);
                  setCep(formatted);
                }}
                onBlur={(e) => {
                  const cleanCep = e.target.value.replace(/\D/g, '');
                  if (cleanCep.length === 8) {
                    fetchAddressByCEP(cleanCep);
                  }
                }}
                maxLength={9}
                placeholder="00000-000"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {loadingCep && (
                <div className="flex items-center px-4">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Logradouro */}
          <div>
            <label htmlFor="logradouro" className="block text-sm font-medium text-gray-700 mb-2">
              Logradouro
            </label>
            <input
              type="text"
              id="logradouro"
              value={logradouro}
              onChange={(e) => setLogradouro(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Número e Complemento */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="numero" className="block text-sm font-medium text-gray-700 mb-2">
                Número
              </label>
              <input
                type="text"
                id="numero"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="complemento" className="block text-sm font-medium text-gray-700 mb-2">
                Complemento
              </label>
              <input
                type="text"
                id="complemento"
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
                placeholder="Apto, Bloco, etc."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Bairro */}
          <div>
            <label htmlFor="bairro" className="block text-sm font-medium text-gray-700 mb-2">
              Bairro
            </label>
            <input
              type="text"
              id="bairro"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Cidade e Estado */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="cidade" className="block text-sm font-medium text-gray-700 mb-2">
                Cidade
              </label>
              <input
                type="text"
                id="cidade"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-2">
                Estado (UF)
              </label>
              <input
                type="text"
                id="estado"
                value={estado}
                onChange={(e) => setEstado(e.target.value.toUpperCase())}
                maxLength={2}
                placeholder="SC"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Seção de Alteração de Senha */}
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Alterar Senha (opcional)</h4>

            {/* Senha Atual */}
            <div className="mb-4">
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Senha Atual
              </label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Digite sua senha atual"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Nova Senha */}
            <div className="mb-4">
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Nova Senha
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite a nova senha (mínimo 6 caracteres)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Confirmar Nova Senha */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Nova Senha
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite novamente a nova senha"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  confirmPassword && newPassword !== confirmPassword
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300'
                }`}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-600 mt-1">
                  As senhas não conferem
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600 whitespace-pre-line">{success}</p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

