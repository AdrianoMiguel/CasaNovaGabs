const express = require('express');
const passport = require('passport');
const router = express.Router();
const User = require('../models/User');

// CORREÇÃO 1: Iniciar autenticação Google 
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account', // Força seleção de conta
    accessType: 'offline' // Garante token de refresh
  })
);

// CORREÇÃO 2: Callback SIMPLIFICADO
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: process.env.FRONTEND_URL + '?error=auth_failed',
    failureMessage: true
  }),
  // Com SameSite=Lax e Domain configurado, o redirecionamento é direto.
  (req, res) => {
    try {
      console.log('✅ Callback recebido e autenticação concluída:', {
        userId: req.user._id,
        email: req.user.email,
        sessionID: req.sessionID,
      });
      
      // Redireciona diretamente para o frontend. O cookie já foi definido.
      res.redirect(process.env.FRONTEND_URL);
      
    } catch (error) {
      console.error('❌ Erro no callback:', error);
      res.redirect(process.env.FRONTEND_URL + '?error=callback_exception');
    }
  }
);

// CORREÇÃO 3: Current user com melhor logging e tratamento (Mantido)
router.get('/current-user', async (req, res) => {
  console.log('🔍 Verificando usuário atual:', {
    hasSession: !!req.session,
    sessionID: req.sessionID,
    isAuthenticated: req.isAuthenticated?.() || false,
    userId: req.user?._id,
    cookies: req.headers.cookie ? 'presente' : 'ausente'
  });

  if (!req.isAuthenticated || !req.isAuthenticated()) {
    console.log('❌ Usuário não autenticado');
    return res.json({ user: null });
  }

  try {
    const user = await User.findById(req.user._id)
      .populate('chosenGift', 'name description')
      .exec();
    
    if (!user) {
      console.log('⚠️ Usuário não encontrado no banco:', req.user._id);
      return res.json({ user: null });
    }

    console.log('✅ Usuário autenticado:', {
      id: user._id,
      email: user.email,
      hasChosenGift: user.hasChosenGift,
      isAdmin: user.isAdmin
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
});

// CORREÇÃO 4: Logout melhorado (Atualizado para SameSite=Lax)
router.post('/logout', (req, res) => {
  const userId = req.user?._id;
  console.log('👋 Logout solicitado:', { userId });
  
  if (!req.user) {
    return res.json({ message: 'Já deslogado' });
  }

  req.logout((err) => {
    if (err) {
      console.error('❌ Erro ao fazer logout:', err);
      return res.status(500).json({ error: 'Erro ao fazer logout' });
    }
    
    req.session.destroy((err) => {
      if (err) {
        console.error('❌ Erro ao destruir sessão:', err);
      }
      
      // Limpeza de cookie consistente com a nova configuração do SameSite/Domain
      res.clearCookie('sessionId', {
        path: '/',
        httpOnly: true,
        secure: process.env.FRONTEND_URL?.startsWith('https'),
        sameSite: 'lax',
        domain: process.env.COOKIE_DOMAIN || null
      });
      
      console.log('✅ Logout completo');
      res.json({ message: 'Logout realizado com sucesso' });
    });
  });
});

// NOVA ROTA: Verificar status de autenticação (útil para debug)
router.get('/status', (req, res) => {
  res.json({
    isAuthenticated: req.isAuthenticated?.() || false,
    hasSession: !!req.session,
    sessionID: req.sessionID,
    user: req.user ? {
      id: req.user._id,
      email: req.user.email
    } : null
  });
});

module.exports = router;