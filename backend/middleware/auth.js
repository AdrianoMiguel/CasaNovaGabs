// Middleware para verificar autenticação
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Não autenticado' });
};

// Middleware para verificar se é admin
const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
};

// Middleware para verificar se usuário já escolheu presente
const hasNotChosenGift = (req, res, next) => {
  if (!req.user.hasChosenGift) {
    return next();
  }
  res.status(403).json({ error: 'Você já escolheu um presente' });
};

module.exports = {
  isAuthenticated,
  isAdmin,
  hasNotChosenGift
};