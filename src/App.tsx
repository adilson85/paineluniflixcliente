import { useAuth } from './contexts/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import { PaymentSuccess } from './pages/PaymentSuccess';
import { PaymentFailure } from './pages/PaymentFailure';
import { ReferralSignUp } from './pages/ReferralSignUp';
import { ResetPassword } from './pages/ResetPassword';

function App() {
  const { user, loading } = useAuth();

  // Verifica se está em uma página de pagamento
  const path = window.location.pathname;
  const isPaymentSuccess = path.includes('/payment/success');
  const isPaymentFailure = path.includes('/payment/failure');
  const isPaymentPending = path.includes('/payment/pending');
  const isResetPassword = path.includes('/redefinir-senha');

  // Verifica se há código de indicação na URL (prioridade alta)
  const urlParams = new URLSearchParams(window.location.search);
  const hasReferralCode = urlParams.has('ref');

  // Se houver código de indicação, mostra a página de cadastro (mesmo se estiver logado)
  // O usuário pode fazer logout se quiser cadastrar outra pessoa
  if (hasReferralCode) {
    // Se estiver logado, mostra aviso mas permite continuar
    if (user) {
      // Pode mostrar um aviso ou permitir continuar
      // Por enquanto, vamos permitir continuar (pode ser para cadastrar outra pessoa)
    }
    return <ReferralSignUp />;
  }

  // Página de redefinição de senha (não requer autenticação)
  if (isResetPassword) {
    return <ResetPassword />;
  }

  if (loading && !isPaymentSuccess && !isPaymentFailure && !isPaymentPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Páginas de pagamento (não requerem autenticação)
  if (isPaymentSuccess) {
    return <PaymentSuccess />;
  }
  if (isPaymentFailure) {
    return <PaymentFailure />;
  }
  if (isPaymentPending) {
    return <PaymentSuccess />; // Trata pending como success por enquanto
  }

  // Páginas normais (requerem autenticação)
  return user ? <Dashboard /> : <AuthPage />;
}

export default App;
