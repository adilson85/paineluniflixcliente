import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, User, Edit2 } from 'lucide-react';
import { ProfileEditModal } from './ProfileEditModal';

interface HeaderProps {
  profile: {
    full_name: string;
    email?: string | null;
    phone?: string | null;
    cpf?: string | null;
    data_nascimento?: string | null;
    cep?: string | null;
    logradouro?: string | null;
    numero?: string | null;
    complemento?: string | null;
    bairro?: string | null;
    cidade?: string | null;
    estado?: string | null;
  } | null;
  onProfileUpdate?: () => void;
}

export function Header({ profile, onProfileUpdate }: HeaderProps) {
  const { signOut } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);

  return (
    <>
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">U</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Uniflix</h1>
              <p className="text-sm text-gray-500">Portal do Assinante</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition group"
              >
              <User className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">
                {profile?.full_name || 'Carregando...'}
              </span>
                <Edit2 className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition" />
              </button>
            <button
              onClick={signOut}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Sair</span>
            </button>
          </div>
        </div>
      </div>
    </header>

      {showEditModal && profile && (
        <ProfileEditModal
          profile={profile}
          onClose={() => setShowEditModal(false)}
          onUpdate={() => {
            setShowEditModal(false);
            if (onProfileUpdate) {
              onProfileUpdate();
            }
          }}
        />
      )}
    </>
  );
}
