require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const cors = require('cors');
const User = require('./models/User');

const app = express();

// CORREÇÃO ESSENCIAL 1: Informa ao Express que está atrás de um proxy (Fly.io).
// Isso é crucial para que o Express reconheça a conexão como HTTPS e permita
// que o cookie.secure: true funcione.
app.set('trust proxy', 1); 

// Middlewares
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

// Sessão
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  // Não precisamos mais de 'proxy: true' na sessão se usarmos app.set('trust proxy', 1)
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
    httpOnly: true,
    // CORREÇÃO ESSENCIAL 2: Para Cross-site (Vercel -> Fly.io) em HTTPS,
    // *ambos* sameSite: 'none' e secure: true são obrigatórios.
    secure: process.env.NODE_ENV === 'production' ? true : 'auto', 
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', 
    domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost'
  }
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Configuração do Google OAuth
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });
      
      if (user) {
        return done(null, user);
      }
      
      // Cria novo usuário
      const adminEmails = process.env.ADMIN_EMAIL.split(',').map(e => e.trim());
      const isAdmin = adminEmails.includes(profile.emails[0].value);
      
      user = new User({
        googleId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        photo: profile.photos[0]?.value,
        isAdmin
      });
      
      await user.save();
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ Erro ao conectar MongoDB:', err));

// Rotas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/gifts', require('./routes/gifts'));

// Rota de teste
app.get('/api/health', (req, res) => {
  res.status(200).send('OK');
});

// Outras rotas...
app.get('/api/auth/current-user', (req, res) => {
  if (req.user) {
    res.json({ user: req.user });
  } else {
    res.json({ user: null });
  }
});


// Servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 Frontend: ${process.env.FRONTEND_URL}`);
});