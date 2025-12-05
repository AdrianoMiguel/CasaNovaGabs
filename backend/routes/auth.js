const express = require('express');
const passport = require('passport');
const router = express.Router();
const User = require('../models/User');

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

// Rota para obter usuário atual - COM POPULATE
router.get('/current-user', async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      // Busca o usuário e popula o presente escolhido
      const user = await User.findById(req.user._id)
        .populate('chosenGift', 'name description')
        .exec();
      
      if (!user) {
        return res.json({ user: null });
      }

      res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          photo: user.photo,
          isAdmin: user.isAdmin,
          hasChosenGift: user.hasChosenGift,
          chosenGift: user.chosenGift // Agora vem populado com { _id, name, description }
        }
      });
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      res.json({ user: null });
    }
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