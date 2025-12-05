const express = require('express');
const passport = require('passport');
const router = express.Router();
const User = require('../models/User'); // Certifique-se de que o caminho está correto

// Rota para iniciar autenticação Google
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account' // Força seleção de conta
  })
);

// CORREÇÃO FINAL PARA SAFARI/iOS: Callback do Google com estratégia URL Handoff
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

      // Passamos o ID do usuário como parâmetro de query no redirecionamento.
      const redirectUrl = `${process.env.FRONTEND_URL}?user_id=${req.user._id}`;
      
      // Salvamos a sessão para garantir que ela esteja no MongoStore
      req.session.save((err) => {
        if (err) {
          console.error('❌ Erro ao salvar sessão (URL Handoff):', err);
          return res.redirect(process.env.FRONTEND_URL + '?error=session');
        }
        
        console.log(`💾 Sessão salva, redirecionando para: ${redirectUrl}`);
        res.redirect(redirectUrl);
      });
      
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
      res.status(500).json({ error: 'Erro interno ao buscar usuário' });
    }
  } else {
    console.log('❌ Usuário não autenticado');
    res.json({ user: null });
  }
});

// Rota para logout
router.post('/logout', (req, res) => {
  console.log('👋 Logout:', { userId: req.user?._id });
  
  req.logout((err) => {
    if (err) {
      console.error('❌ Erro ao fazer logout:', err);
      return res.status(500).json({ error: 'Erro ao fazer logout' });
    }
    req.session.destroy((err) => {
      if (err) {
        console.error('❌ Erro ao destruir sessão:', err);
      }
      res.clearCookie('connect.sid'); // Garante que o cookie seja limpo
      res.json({ message: 'Logout realizado com sucesso' });
    });
  });
});

module.exports = router;