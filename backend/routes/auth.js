const express = require('express');
const passport = require('passport');
const router = express.Router();
const User = require('../models/User');

// Rota para iniciar autenticação Google
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account' // Força seleção de conta
  })
);

// CORREÇÃO: Callback do Google com estratégia de correção para iOS/Safari
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: process.env.FRONTEND_URL,
    failureMessage: true
  }),
  async (req, res) => {
    try {
      console.log('✅ Autenticação bem-sucedida:', {
        userId: req.user._id,
        email: req.user.email,
        sessionID: req.sessionID
      });

      // ESTRATÉGIA DE CORREÇÃO PARA IOS/SAFARI (ITP):
      // Retorna um HTML com JavaScript que tenta forçar o navegador a aceitar
      // o cookie de sessão antes de redirecionar para o frontend.
      
      const successHtml = `
        <html>
          <head>
            <title>Autenticação Concluída</title>
          </head>
          <body>
            <script>
              // 1. Tenta redirecionar a janela principal (funciona se for um popup/nova janela)
              if (window.opener) {
                window.opener.location.href = '${process.env.FRONTEND_URL}';
                window.close();
              }
              
              // 2. Redireciona a própria janela (para o fluxo normal de redirect)
              window.location.href = '${process.env.FRONTEND_URL}';
            </script>
            Autenticação concluída. Redirecionando...
          </body>
        </html>
      `;

      // Enviamos o HTML de sucesso. O Passport já setou o cookie de sessão.
      res.setHeader('Content-Type', 'text/html');
      res.send(successHtml);

    } catch (error) {
      console.error('❌ Erro no callback:', error);
      res.redirect(process.env.FRONTEND_URL + '?error=callback');
    }
  }
);

// Rota para obter usuário atual
router.get('/current-user', async (req, res) => {
  // Logs de debug úteis que confirmam o status da sessão
  console.log('🔍 Verificando usuário atual:', {
    hasSession: !!req.session,
    sessionID: req.sessionID,
    isAuthenticated: req.isAuthenticated(),
    userId: req.user?._id
  });

  if (req.isAuthenticated()) {
    try {
      // Usa findById e populate para garantir que o presente escolhido seja carregado
      const user = await User.findById(req.user._id)
        .populate('chosenGift', 'name description') // Popula o nome e a descrição do presente
        .exec();
      
      if (!user) {
        console.log('⚠️ Usuário não encontrado no banco');
        return res.json({ user: null });
      }

      console.log('✅ Usuário autenticado:', {
        id: user._id,
        email: user.email,
        hasChosenGift: user.hasChosenGift
      });

      // Retorna apenas os campos necessários, incluindo o objeto chosenGift populado
      res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          photo: user.photo,
          isAdmin: user.isAdmin,
          hasChosenGift: user.hasChosenGift,
          chosenGift: user.chosenGift
        }
      });
    } catch (error) {
      console.error('❌ Erro ao buscar usuário:', error);
      res.json({ user: null });
    }
  } else {
    console.log('❌ Usuário não autenticado');
    res.json({ user: null });
  }
});

// Rota para logout
router.post('/logout', (req, res) => {
  console.log('👋 Logout:', { userId: req.user?._id });
  
  // Note: req.logout requer um callback a partir do Express 5
  req.logout((err) => {
    if (err) {
      console.error('❌ Erro ao fazer logout:', err);
      return res.status(500).json({ error: 'Erro ao fazer logout' });
    }
    req.session.destroy((err) => {
      if (err) {
        console.error('❌ Erro ao destruir sessão:', err);
      }
      res.clearCookie('sessionId');
      res.json({ message: 'Logout realizado com sucesso' });
    });
  });
});

module.exports = router;