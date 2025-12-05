import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import GiftList from './components/GiftList';
import AdminPanel from './components/AdminPanel';
import AlreadyChosen from './components/AlreadyChosen';
import { getCurrentUser, logout } from './services/api';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await getCurrentUser();
      if (response.data.user) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };
  
  // LÓGICA DE CORREÇÃO PARA IOS/SAFARI
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const userIdFromUrl = urlParams.get('user_id');

    // Verifica se a URL contém o ID do usuário (vindo do callback do Google)
    if (userIdFromUrl) {
      console.log('✅ URL Handoff detectado. Forçando checkAuth...');
      
      // 1. Limpa o parâmetro da URL imediatamente
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // 2. Força a verificação da sessão
      checkAuth();
      return;
    }
    
    // Se não houver URL Handoff, roda o checkAuth normal
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
    setUser(null);
    // Recarrega a página para limpar qualquer estado e garantir que o cookie foi apagado
    window.location.reload(); 
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

  if (user.hasChosenGift) {
    return <AlreadyChosen user={user} onLogout={handleLogout} />;
  }
  
  return <GiftList user={user} onLogout={handleLogout} />;
}

export default App;