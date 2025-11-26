import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserPlus } from 'lucide-react';
import { validateCPF, formatCPF, cleanCPF } from '../../lib/validators';

interface SignUpFormProps {
  onToggleForm: () => void;
}

export function SignUpForm({ onToggleForm }: SignUpFormProps) {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [cpfError, setCpfError] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleCpfChange = (value: string) => {
    const formatted = formatCPF(value);
    setCpf(formatted);

    // Limpa erro quando usuário começa a digitar
    if (cpfError) {
      setCpfError('');
    }
  };

  const handleCpfBlur = () => {
    // Valida CPF quando o campo perde o foco
    if (cpf && !validateCPF(cpf)) {
      setCpfError('CPF inválido');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCpfError('');

    // Valida CPF antes de submeter
    if (cpf && !validateCPF(cpf)) {
      setCpfError('CPF inválido');
      return;
    }

    setLoading(true);

    // Remove formatação do CPF antes de enviar
    const cleanedCpf = cpf ? cleanCPF(cpf) : undefined;

    const { error } = await signUp(email, password, fullName, phone, cleanedCpf, referralCode);

    if (error) {
      setError('Erro ao criar conta. Tente novamente.');
    } else {
      setSuccess(true);
      setTimeout(() => {
        onToggleForm();
      }, 2000);
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Conta criada com sucesso!</h2>
          <p className="text-gray-600 mt-2">Redirecionando para o login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-4">
          <UserPlus className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Criar Conta</h2>
        <p className="text-gray-600 mt-2">Junte-se ao Uniflix hoje</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
            Nome Completo
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="João Silva"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="seu@email.com"
            required
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Telefone (opcional)
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="(11) 99999-9999"
          />
        </div>

        <div>
          <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-2">
            CPF (opcional)
          </label>
          <input
            id="cpf"
            type="text"
            value={cpf}
            onChange={(e) => handleCpfChange(e.target.value)}
            onBlur={handleCpfBlur}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition ${
              cpfError
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            placeholder="000.000.000-00"
            maxLength={14}
          />
          {cpfError && (
            <p className="mt-1 text-sm text-red-600">{cpfError}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Senha
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>

        <div>
          <label htmlFor="referralCode" className="block text-sm font-medium text-gray-700 mb-2">
            Código de Indicação (opcional)
          </label>
          <input
            id="referralCode"
            type="text"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="ABC123XY"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? 'Criando conta...' : 'Criar Conta'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Já tem uma conta?{' '}
          <button
            onClick={onToggleForm}
            className="text-blue-600 font-semibold hover:text-blue-700 transition"
          >
            Entrar
          </button>
        </p>
      </div>
    </div>
  );
}
