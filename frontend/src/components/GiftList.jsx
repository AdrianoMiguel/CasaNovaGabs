import React, { useState, useEffect } from 'react';
// Adicionando MapPin e Calendar para a tela de confirmação
import { Gift, LogOut, CheckCircle, User, MapPin, Calendar } from 'lucide-react'; 
import { getGifts, chooseGift, logout } from '../services/api';

const GiftList = ({ user, onLogout }) => {
  const [gifts, setGifts] = useState([]);
  // Inicializa loading como false se já houver um presente escolhido no objeto 'user'
  const [loading, setLoading] = useState(false); 
  const [selectedGift, setSelectedGift] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [choosing, setChoosing] = useState(false);

  useEffect(() => {
    // Só carrega a lista se o usuário ainda não escolheu um presente
    if (!user.chosenGift) {
      setLoading(true);
      loadGifts();
    }
  }, [user.chosenGift]); // Recarrega se o estado do presente escolhido mudar

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
      
      // ATUALIZAÇÃO: Em vez de logout, atualiza o objeto user localmente
      // Isso faz com que o componente GiftList re-renderize e entre no bloco 'if (user.chosenGift)'
      // Precisamos garantir que o objeto user seja mutável ou que o App.jsx force o update.
      // Neste caso, vamos forçar uma atualização no próprio objeto `user` (prop) para o render
      user.chosenGift = { name: selectedGift.name };

      alert(`Presente "${selectedGift.name}" escolhido com sucesso!`);
      
      setChoosing(false);
      setShowConfirmation(false);

    } catch (error) {
      console.error('Erro ao escolher presente:', error);
      alert(`Erro ao escolher presente: ${error.response?.data?.error || error.message}`);
      setChoosing(false);
      setShowConfirmation(false);
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
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando presentes...</p>
        </div>
      </div>
    );
  }
  
  // ⬅️ NOVO BLOCO: Exibe o presente escolhido se ele já existir
  if (user.chosenGift) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          backgroundImage: 'url(/background.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="max-w-md w-full bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center">
          
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Escolha Concluída!
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Obrigado por sua contribuição. O presente foi reservado com sucesso.
          </p>

          <div className="bg-green-50/70 border border-green-200 p-5 rounded-xl mb-6 shadow-md">
            <p className="text-sm font-semibold text-green-800 mb-1">
              Seu presente escolhido:
            </p>
            <h2 className="text-2xl font-extrabold text-green-700">
              {user.chosenGift.name}
            </h2>
          </div>
          
          <div className="text-left space-y-3 p-4 bg-gray-50 rounded-lg shadow-inner">
            <h3 className="font-bold text-gray-800">Detalhes do Evento</h3>
            <p className="flex items-center gap-2 text-gray-700">
              <Calendar className="w-4 h-4 text-purple-600" />
              21 de Dezembro de 2025 - Domingo
            </p>
            <p className="flex items-start gap-2 text-gray-700">
              <MapPin className="w-4 h-4 text-purple-600 mt-1" />
              Salão de festas - Edifício Essenza, Rua 27 de Outubro, nº 244, Centro, Suzano - SP
            </p>
          </div>

          <button
            onClick={onLogout}
            className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
          >
            <LogOut className="w-5 h-5" />
            Sair e Fechar
          </button>
        </div>
      </div>
    );
  }


  // Estrutura principal da LISTA DE PRESENTES (se ainda não escolheu)
  return (
    <div 
      className="min-h-screen p-4 flex justify-center"
      style={{
        backgroundImage: 'url(/background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="max-w-4xl w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-10">
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Gift className="w-8 h-8 text-purple-600" />
              <h1 className="text-3xl font-bold text-gray-800">
                Lista de Presentes
              </h1>
            </div>
            <p className="text-gray-600">
              Olá, {user.name.split(' ')[0]}! Escolha seu presente especial.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="font-semibold text-sm text-gray-700">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <button
              onClick={onLogout}
              className="p-3 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {gifts.length === 0 && !loading ? (
          <div className="text-center p-10 bg-gray-50 rounded-lg">
            <p className="text-xl text-gray-600 font-semibold">
              Nenhum presente disponível no momento.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {gifts.map((gift) => (
              <div
                key={gift._id}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition duration-300 flex flex-col justify-between"
              >
                <div>
                  <h2 className="text-xl font-bold text-purple-700 mb-2">
                    {gift.name}
                  </h2>
                  {gift.description && (
                    <p className="text-gray-600 mb-4">{gift.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleGiftSelection(gift)}
                  className="mt-4 w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition shadow-md"
                >
                  Escolher este presente
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Confirmação */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-8 max-w-sm w-full shadow-2xl">
              <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                Confirmar Escolha
              </h3>
              <div className="mb-6 text-center">
                <p className="text-gray-700 mb-2">
                  Você está prestes a reservar o seguinte presente:
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