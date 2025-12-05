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
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await getCurrentUser();
      if (response.data.user) {
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