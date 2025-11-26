import { LoginForm } from '../components/Auth/LoginForm';

export function AuthPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex items-center justify-center gap-8">
        <div className="hidden lg:block flex-1">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-3xl shadow-xl mb-6">
              <span className="text-5xl font-bold bg-gradient-to-br from-blue-600 to-blue-800 bg-clip-text text-transparent">
                U
              </span>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Bem-vindo ao Uniflix
            </h1>
            <p className="text-xl text-gray-700 mb-8">
              Seu portal completo de streaming
            </p>
            <div className="space-y-4 text-left max-w-md mx-auto">
              <div className="flex items-start space-x-3 p-4 bg-white/50 backdrop-blur rounded-xl">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Acesso aos Apps</h3>
                  <p className="text-sm text-gray-600">Credenciais e informações do seu plano</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 bg-white/50 backdrop-blur rounded-xl">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Programa de Indicações</h3>
                  <p className="text-sm text-gray-600">Ganhe 10% de comissão por indicação</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
