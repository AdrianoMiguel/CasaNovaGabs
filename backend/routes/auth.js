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

// SOLUÇÃO FINAL iOS: Callback sem ANY modificação de sessão
router.get('/google/callback',
  (req, res, next) => {
    // CRÍTICO: Captura o sessionID ANTES do Passport
    const originalSessionID = req.sessionID;
    console.log('🔵 ANTES do Passport - sessionID:', originalSessionID);
    
    passport.authenticate('google', { 
      failureRedirect: process.env.FRONTEND_URL + '?error=auth_failed',
      failureMessage: true,
      // CRÍTICO: Não deixa o Passport mexer na sessão
      session: true
    })(req, res, next);
  },
  async (req, res) => {
    try {
      const sessionIDAntes = req.sessionID;
      console.log('✅ Callback recebido:', {
        userId: req.user._id,
        email: req.user.email,
        sessionID: sessionIDAntes,
        hasSession: !!req.session
      });

      // FORÇA o req.session a ter os dados do usuário
      req.session.passport = req.session.passport || {};
      req.session.passport.user = req.user._id.toString();
      
      console.log('📝 Dados forçados na sessão:', {
        passport: req.session.passport,
        sessionID: req.sessionID
      });

      // Salva SEM tocar no sessionID
      req.session.save((err) => {
        if (err) {
          console.error('❌ Erro ao salvar sessão:', err);
          return res.redirect(process.env.FRONTEND_URL + '?error=session_save');
        }
        
        const sessionIDDepois = req.sessionID;
        console.log('💾 Sessão salva:', {
          sessionIDAntes,
          sessionIDDepois,
          mudou: sessionIDAntes !== sessionIDDepois,
          userId: req.user._id
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

// Current user COM LOGS DETALHADOS
router.get('/current-user', async (req, res) => {
  console.log('🔍 Verificando usuário atual:', {
    hasSession: !!req.session,
    sessionID: req.sessionID,
    sessionPassport: req.session?.passport,
    isAuthenticated: req.isAuthenticated?.() || false,
    userId: req.user?._id,
    cookies: req.headers.cookie ? 'presente' : 'ausente',
    cookieHeader: req.headers.cookie || 'nenhum'
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