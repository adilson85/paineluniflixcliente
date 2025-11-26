import { MessageCircle, X } from 'lucide-react';
import { useState } from 'react';

export function WhatsAppButton() {
  const [isExpanded, setIsExpanded] = useState(false);
  const whatsappNumber = '5547999906423';
  const message = 'Olá! Preciso de suporte com o Uniflix.';

  const handleWhatsAppClick = () => {
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-3">
        {isExpanded && (
          <div className="bg-white rounded-2xl shadow-2xl p-4 max-w-xs animate-fadeIn border border-gray-200">
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">Atendimento Uniflix</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Precisa de ajuda? Fale conosco pelo WhatsApp!
                </p>
                <button
                  onClick={handleWhatsAppClick}
                  className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition flex items-center justify-center space-x-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Iniciar Conversa</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 group"
          aria-label="Suporte WhatsApp"
        >
          {isExpanded ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <MessageCircle className="w-7 h-7 text-white group-hover:animate-pulse" />
          )}
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
