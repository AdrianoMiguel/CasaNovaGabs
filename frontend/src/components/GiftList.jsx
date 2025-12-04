import React, { useState, useEffect } from 'react';
import { Gift, LogOut, CheckCircle, User } from 'lucide-react';
import { getGifts, chooseGift, logout } from '../services/api';

const GiftList = ({ user, onLogout }) => {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGift, setSelectedGift] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [choosing, setChoosing] = useState(false);

  useEffect(() => {
    loadGifts();
  }, []);

  const loadGifts = async () => {
    try {
      const response = await getGifts();
      setGifts(response.data.gifts);
    } catch (error) {
      console.error('Erro ao carregar presentes:', error);
      alert('Erro ao carregar presentes');
    } finally {
      setLoading(false);
    }
  };

  const handleGiftSelection = (gift) => {
    setSelectedGift(gift);
    setShowConfirmation(true);
  };

  const confirmGiftChoice = async () => {
    if (!selectedGift || choosing) return;

    setChoosing(true);
    try {
      await chooseGift(selectedGift._id);
      alert(`Presente "${selectedGift.name}" escolhido com sucesso! Você será desconectado.`);
      
      setTimeout(async () => {
        await logout();
        onLogout();
      }, 2000);
    } catch (error) {
      console.error('Erro ao escolher presente:', error);
      const message = error.response?.data?.error || 'Erro ao escolher presente';
      alert(message);
      setChoosing(false);
      setShowConfirmation(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      onLogout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: 'url(/background.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="text-center bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
          <Gift className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Carregando presentes...</p>
        </div>
      </div>
    );
  }

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

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Escolha seu presente
          </h2>
          <p className="text-gray-600 mb-6">
            Selecione apenas um presente. Sua escolha é definitiva!
          </p>

          {gifts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Gift className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Todos os presentes já foram escolhidos!</p>
              <p className="text-sm mt-2">Obrigado por participar.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {gifts.map(gift => (
                <button
                  key={gift._id}
                  onClick={() => handleGiftSelection(gift)}
                  className="w-full p-5 rounded-xl border-2 border-purple-300 bg-purple-50 hover:bg-purple-100 hover:border-purple-400 hover:shadow-md transition text-left group"
                >
                  <div className="flex items-center gap-4">
                    <Gift className="w-7 h-7 text-purple-600 group-hover:scale-110 transition-transform" />
                    <div className="flex-1">
                      <span className="font-semibold text-gray-800 text-lg block">
                        {gift.name}
                      </span>
                      {gift.description && (
                        <span className="text-sm text-gray-600 mt-1 block">
                          {gift.description}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {showConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
              <div className="text-center mb-6">
                <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  Confirmar escolha?
                </h3>
                <p className="text-gray-600 mb-4">
                  Você está prestes a escolher:
                </p>
                <div className="bg-purple-50 p-4 rounded-lg mb-4">
                  <p className="text-xl font-bold text-purple-600">
                    {selectedGift?.name}
                  </p>
                  {selectedGift?.description && (
                    <p className="text-sm text-gray-600 mt-2">
                      {selectedGift.description}
                    </p>
                  )}
                </div>
                <p className="text-sm text-red-600 font-medium">
                  ⚠️ Esta ação não pode ser desfeita!
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  disabled={choosing}
                  className="flex-1 py-3 px-4 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmGiftChoice}
                  disabled={choosing}
                  className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
                >
                  {choosing ? 'Confirmando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GiftList;