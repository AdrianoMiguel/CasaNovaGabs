const express = require('express');
const passport = require('passport');
const router = express.Router();
const User = require('../models/User');

// Iniciar autenticação Google
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account',
    accessType: 'offline'
  })
);

// CORREÇÃO MongoStore: Callback simplificado
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: process.env.FRONTEND_URL + '?error=auth_failed',
    failureMessage: true
  }),
  async (req, res) => {
    try {
      console.log('✅ Callback recebido:', {
        userId: req.user._id,
        email: req.user.email,
        sessionID: req.sessionID,
        hasSession: !!req.session,
        sessionPassport: req.session.passport
      });

      // O Passport JÁ autenticou e JÁ colocou o user na sessão
      // Não precisamos fazer nada além de salvar
      
      // AGUARDA um pouco para garantir que o Passport terminou
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('📝 Sessão após Passport:', {
        passport: req.session.passport,
        sessionID: req.sessionID
      });

      // Salva a sessão (que já tem os dados do Passport)
      req.session.save((err) => {
        if (err) {
          console.error('❌ Erro ao salvar sessão:', err);
          return res.redirect(process.env.FRONTEND_URL + '?error=session_save');
        }
        
        console.log('💾 Sessão salva com sucesso:', {
          sessionID: req.sessionID,
          userId: req.user._id,
          hasPassportData: !!req.session.passport
        });

        // Redireciona COM o user_id
        res.redirect(process.env.FRONTEND_URL + '?user_id=' + req.user._id);
      });
      
    } catch (error) {
      console.error('❌ Erro no callback:', error);
      res.redirect(process.env.FRONTEND_URL + '?error=callback_exception');
    }
  }
);

// Current user
router.get('/current-user', async (req, res) => {
  console.log('🔍 Verificando usuário atual:', {
    hasSession: !!req.session,
    sessionID: req.sessionID,
    sessionPassport: req.session?.passport,
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

// Logout
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
      
      res.clearCookie('sessionId', {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
      });
      
      console.log('✅ Logout completo');
      res.json({ message: 'Logout realizado com sucesso' });
    });
  });
});

// Status (para debug)
router.get('/status', (req, res) => {
  res.json({
    isAuthenticated: req.isAuthenticated?.() || false,
    hasSession: !!req.session,
    sessionID: req.sessionID,
    sessionPassport: req.session?.passport,
    user: req.user ? {
      id: req.user._id,
      email: req.user.email
    } : null,
    cookies: req.headers.cookie
  });
});

module.exports = router;