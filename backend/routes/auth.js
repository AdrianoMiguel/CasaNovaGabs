const express = require('express');
const passport = require('passport');
const router = express.Router();

// Rota para iniciar autenticação Google
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Callback do Google
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: process.env.FRONTEND_URL }),
  (req, res) => {
    // Redireciona para o frontend após login
    res.redirect(process.env.FRONTEND_URL);
  }
);

// Rota para obter usuário atual
router.get('/current-user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        photo: req.user.photo,
        isAdmin: req.user.isAdmin,
        hasChosenGift: req.user.hasChosenGift,
        chosenGift: req.user.chosenGift
      }
    });
  } else {
    res.json({ user: null });
  }
});

// Rota para logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao fazer logout' });
    }
    req.session.destroy();
    res.json({ message: 'Logout realizado com sucesso' });
  });
});

module.exports = router;