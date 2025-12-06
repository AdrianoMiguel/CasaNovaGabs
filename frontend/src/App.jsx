import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import GiftList from './components/GiftList';
import AdminPanel from './components/AdminPanel';
import AlreadyChosen from './components/AlreadyChosen';
import { getCurrentUser } from './services/api';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // CORREÇÃO ITP/SameSite: Detecta URL Handoff (user_id) e força reload.
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('user_id');
    
    if (userId) {
      console.log('✅ URL Handoff detectado, forçando reload para fixar sessão...');
      
      // 1. Limpa o parâmetro user_id da URL antes do reload.
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // 2. FORÇA O RELOAD IMEDIATO. Esta é a etapa CRÍTICA.
      window.location.reload(); 
      
      // Interrompe o checkAuth inicial, o reload irá disparar um novo App.
      return;
    }
    
    // Se não há userId, segue o fluxo normal (checkAuth).
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await getCurrentUser();
      if (response.data.user) {
        console.log('✅ Usuário recuperado:', response.data.user.email);
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
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
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (user.isAdmin) {
    return <AdminPanel user={user} onLogout={handleLogout} />;
  }

  // Se o usuário já escolheu um presente, mostra a tela de presente escolhido
  if (user.hasChosenGift) {
    return <AlreadyChosen user={user} onLogout={handleLogout} />;
  }

  // Se não escolheu ainda, mostra a lista de presentes
  return <GiftList user={user} onLogout={handleLogout} />;
}

export default App;