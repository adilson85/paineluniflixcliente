import { useState } from 'react';
import { X, Save, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface CompleteRegistrationModalProps {
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

export function CompleteRegistrationModal({ profile, onClose, onUpdate }: CompleteRegistrationModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [cpf, setCpf] = useState(profile?.cpf || '');
  const [dataNascimento, setDataNascimento] = useState(profile?.data_nascimento?.split('T')[0] || '');
  const [cep, setCep] = useState(profile?.cep || '');
  const [logradouro, setLogradouro] = useState(profile?.logradouro || '');
  const [numero, setNumero] = useState(profile?.numero || '');
  const [complemento, setComplemento] = useState(profile?.complemento || '');
  const [bairro, setBairro] = useState(profile?.bairro || '');
  const [cidade, setCidade] = useState(profile?.cidade || '');
  const [estado, setEstado] = useState(profile?.estado || '');

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

  // Validação de data
  const validateDate = (dateValue: string): boolean => {
    if (!dateValue) return false;
    const date = new Date(dateValue);
    const now = new Date();
    const minDate = new Date('1900-01-01');
    return date >= minDate && date <= now;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validações
    if (!cpf || !validateCPF(cpf)) {
      setError('CPF inválido');
      return;
    }

    if (!dataNascimento || !validateDate(dataNascimento)) {
      setError('Data de nascimento inválida');
      return;
    }

    if (!cep) {
      setError('CEP é obrigatório');
      return;
    }

    if (!logradouro) {
      setError('Logradouro é obrigatório');
      return;
    }

    if (!numero) {
      setError('Número é obrigatório');
      return;
    }

    if (!bairro) {
      setError('Bairro é obrigatório');
      return;
    }

    if (!cidade) {
      setError('Cidade é obrigatória');
      return;
    }

    if (!estado) {
      setError('Estado é obrigatório');
      return;
    }

    setLoading(true);

    try {
      const updateData: any = {
        cpf: cpf.replace(/\D/g, ''),
        data_nascimento: new Date(dataNascimento).toISOString(),
        cep: cep.replace(/\D/g, ''),
        logradouro: logradouro.trim(),
        numero: numero.trim(),
        complemento: complemento.trim(),
        bairro: bairro.trim(),
        cidade: cidade.trim(),
        estado: estado.trim().toUpperCase(),
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user?.id!);

      if (updateError) {
        throw updateError;
      }

      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar dados');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-6 h-6 text-white" />
                <h2 className="text-2xl font-bold text-white">Complete seu Cadastro</h2>
              </div>
              <p className="text-blue-100 text-sm">
                Para aproveitar todos os benefícios, precisamos de mais algumas informações
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Por que precisamos dessas informações?</strong>
              <br />
              Seus dados são importantes para garantir a segurança da sua conta, facilitar renovações e nos ajudar a oferecer um melhor atendimento.
            </p>
          </div>

          {/* CPF */}
          <div>
            <label htmlFor="cpf" className="block text-sm font-semibold text-gray-700 mb-2">
              CPF <span className="text-red-500">*</span>
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
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              required
            />
          </div>

          {/* Data de Nascimento */}
          <div>
            <label htmlFor="dataNascimento" className="block text-sm font-semibold text-gray-700 mb-2">
              Data de Nascimento <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="dataNascimento"
              value={dataNascimento}
              onChange={(e) => setDataNascimento(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              required
            />
          </div>

          {/* Divider */}
          <div className="pt-4 border-t-2 border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Endereço</h3>
            <p className="text-sm text-gray-600">Informe seu endereço completo</p>
          </div>

          {/* CEP */}
          <div>
            <label htmlFor="cep" className="block text-sm font-semibold text-gray-700 mb-2">
              CEP <span className="text-red-500">*</span>
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
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
              />
              {loadingCep && (
                <div className="flex items-center px-4">
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Digite o CEP e aguarde, buscaremos o endereço automaticamente</p>
          </div>

          {/* Logradouro */}
          <div>
            <label htmlFor="logradouro" className="block text-sm font-semibold text-gray-700 mb-2">
              Logradouro <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="logradouro"
              value={logradouro}
              onChange={(e) => setLogradouro(e.target.value)}
              placeholder="Rua, Avenida, etc."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              required
            />
          </div>

          {/* Número e Complemento */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="numero" className="block text-sm font-semibold text-gray-700 mb-2">
                Número <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="numero"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
              />
            </div>
            <div>
              <label htmlFor="complemento" className="block text-sm font-semibold text-gray-700 mb-2">
                Complemento
              </label>
              <input
                type="text"
                id="complemento"
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
                placeholder="Apto, Bloco, etc."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Bairro */}
          <div>
            <label htmlFor="bairro" className="block text-sm font-semibold text-gray-700 mb-2">
              Bairro <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="bairro"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              required
            />
          </div>

          {/* Cidade e Estado */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="cidade" className="block text-sm font-semibold text-gray-700 mb-2">
                Cidade <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="cidade"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
              />
            </div>
            <div>
              <label htmlFor="estado" className="block text-sm font-semibold text-gray-700 mb-2">
                Estado (UF) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="estado"
                value={estado}
                onChange={(e) => setEstado(e.target.value.toUpperCase())}
                maxLength={2}
                placeholder="SC"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex flex-col space-y-3 pt-6 border-t-2 border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Salvando...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <Save className="w-5 h-5 mr-2" />
                  Salvar e Continuar
                </span>
              )}
            </button>
            <p className="text-xs text-center text-gray-500">
              Essas informações são confidenciais e protegidas
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
