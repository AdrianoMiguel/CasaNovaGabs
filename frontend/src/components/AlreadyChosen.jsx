import React from 'react';
import { Gift, LogOut, CheckCircle, User } from 'lucide-react';
import { logout } from '../services/api';

const AlreadyChosen = ({ user, onLogout }) => {
  const handleLogout = async () => {
    try {
      await logout();
      onLogout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div 
      className="min-h-screen p-4"
      style={{
        backgroundImage: 'url(/background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {user.photo ? (
                <img 
                  src={user.photo} 
                  alt={user.name}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <User className="w-10 h-10 text-purple-600" />
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  Olá, {user.name}!
                </h1>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>

        {/* Presente Escolhido */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-6" />
            
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              Presente já escolhido!
            </h2>
            
            <p className="text-gray-600 mb-6">
              Você já escolheu seu presente da lista
            </p>

            {user.chosenGift ? (
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl border-2 border-purple-300 mb-6">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Gift className="w-8 h-8 text-purple-600" />
                  <h3 className="text-2xl font-bold text-purple-600">
                    {user.chosenGift.name}
                  </h3>
                </div>
                
                {user.chosenGift.description && (
                  <p className="text-gray-700 text-lg">
                    {user.chosenGift.description}
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 p-6 rounded-xl mb-6">
                <p className="text-gray-600">
                  Você escolheu um presente, mas os detalhes não estão disponíveis no momento.
                </p>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Obrigado por participar!</strong><br/>
                Aguardamos você na festa para comemorar juntos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlreadyChosen;