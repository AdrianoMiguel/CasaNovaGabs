import React, { useState, useEffect } from 'react';
import { Gift } from 'lucide-react';
import { getCurrentUser } from '../services/api';

const Login = () => {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const userId = urlParams.get('user_id');
    
    // CORREÇÃO iOS: Se veio com user_id, tenta verificar autenticação múltiplas vezes
    if (userId) {
      console.log('✅ URL Handoff detectado, tentando recuperar sessão...');
      window.history.replaceState({}, document.title, window.location.pathname);
      setIsLoading(true);
      
      // Tenta verificar a autenticação com delay progressivo
      const checkAuthWithRetry = async (attempt = 0) => {
        if (attempt >= 5) {
          console.log('❌ Falha após 5 tentativas');
          setIsLoading(false);
          setErrorMessage('Não foi possível estabelecer a sessão. Tente novamente.');
          return;
        }
        
        try {
          console.log(`🔄 Tentativa ${attempt + 1} de verificar sessão...`);
          const response = await getCurrentUser();
          
          if (response.data.user) {
            console.log('✅ Sessão estabelecida! Recarregando...');
            window.location.reload();
            return;
          }
          
          // Se não autenticou, tenta novamente com delay crescente
          const delay = (attempt + 1) * 500; // 500ms, 1s, 1.5s, 2s, 2.5s
          console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
          setTimeout(() => checkAuthWithRetry(attempt + 1), delay);
          
        } catch (error) {
          console.error(`❌ Erro na tentativa ${attempt + 1}:`, error);
          const delay = (attempt + 1) * 500;
          setTimeout(() => checkAuthWithRetry(attempt + 1), delay);
        }
      };
      
      // Aguarda 300ms antes da primeira tentativa (dá tempo pro cookie ser setado)
      setTimeout(() => checkAuthWithRetry(0), 300);
      return;
    }
    
    // Trata erros
    if (error) {
      const errorMessages = {
        'auth_failed': 'Falha na autenticação. Tente novamente.',
        'session_save': 'Erro ao salvar sessão. Tente novamente.',
        'callback_exception': 'Erro no processo de autenticação.',
      };
      
      setErrorMessage(errorMessages[error] || 'Erro desconhecido. Tente novamente.');
      setIsLoading(false);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);
  
  const handleGoogleLogin = () => {
    setIsLoading(true);
    setErrorMessage('');
    console.log('🔐 Iniciando autenticação Google...');
    
    // Pequeno delay para garantir que o state foi atualizado
    setTimeout(() => {
      window.location.href = `${API_URL}/auth/google`;
    }, 100);
  };

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
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <Gift className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            CHÁ DE CASA NOVA<br/>
            Cintia & Gabriel
          </h2>

          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Venha comemorar com a gente essa nova fase!
          </h1>

          <div className="text-left bg-gray-50 p-4 rounded-lg shadow-inner">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              ONDE?
            </h2>
            <p className="text-gray-600 mb-3">
              Salão de festas - Edifício Essenza <br/>
              Rua 27 de Outubro, nº 244, Centro, Suzano - SP
            </p>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              QUANDO?
            </h2>
            <p className="text-gray-600">
              21 de Dezembro de 2025 - Domingo <br/>
              A partir das 12h00
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 text-center font-medium">
              {errorMessage}
            </p>
            <button
              onClick={() => setErrorMessage('')}
              className="text-xs text-red-500 underline mt-2 w-full"
            >
              Dispensar
            </button>
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full bg-white border-2 border-gray-300 text-gray-700 py-4 px-6 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition flex items-center justify-center gap-3 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-6 h-6 border-3 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              Estabelecendo sessão...
            </>
          ) : (
            <>
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Entrar com Google
            </>
          )}
        </button>

        <p className="text-sm text-gray-500 mt-6 text-center">
          {isLoading 
            ? 'Aguarde, isso pode levar alguns segundos no iOS...' 
            : 'Clique acima para entrar e escolher seu presente.'
          }
        </p>
      </div>
    </div>
  );
};

export default Login;