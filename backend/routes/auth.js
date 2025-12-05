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

// CORREÇÃO: Callback do Google com melhor tratamento de erros
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

      // Força salvar a sessão antes de redirecionar
      req.session.save((err) => {
        if (err) {
          console.error('❌ Erro ao salvar sessão:', err);
          return res.redirect(process.env.FRONTEND_URL + '?error=session');
        }
        
        console.log('💾 Sessão salva, redirecionando...');
        res.redirect(process.env.FRONTEND_URL);
      });
    } catch (error) {
      console.error('❌ Erro no callback:', error);
      res.redirect(process.env.FRONTEND_URL + '?error=callback');
    }
  }
);

// CORREÇÃO: Rota para obter usuário atual com melhor logging
router.get('/current-user', async (req, res) => {
  console.log('🔍 Verificando usuário atual:', {
    hasSession: !!req.session,
    sessionID: req.sessionID,
    isAuthenticated: req.isAuthenticated(),
    userId: req.user?._id
  });

  if (req.isAuthenticated()) {
    try {
      // Busca o usuário e popula o presente escolhido
      const user = await User.findById(req.user._id)
        .populate('chosenGift', 'name description')
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