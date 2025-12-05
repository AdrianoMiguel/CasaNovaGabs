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
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
    httpOnly: true,
    // CORREÇÃO ESSENCIAL 2: sameSite: 'none' e secure: true para Cross-site (Vercel -> Fly.io) em HTTPS.
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
  res.json({ status: 'OK', message: 'Servidor funcionando' });
});

// ROTA CORRIGIDA PARA GARANTIR O POPULATE
app.get('/api/auth/current-user', async (req, res) => {
  if (req.user) {
    const userId = req.user._id;

    // 1. Loga o ID do presente que o usuário tem no seu registro
    console.log(`[DEBUG AUTH] Usuário logado ID: ${userId}`);
    console.log(`[DEBUG AUTH] Tentando buscar o presente com ID: ${req.user.chosenGift}`); 

    // Busca o usuário do banco e *popula* o presente escolhido.
    const userWithGift = await User.findById(userId)
      .populate('chosenGift') // Tira o 'select: name' para ser mais robusto (conforme a última sugestão)
      .exec(); 
      
    if (!userWithGift) {
      console.log(`[DEBUG AUTH] Falha na busca pelo ID ${userId} no DB.`);
      return res.json({ user: null });
    }
    
    // 2. Loga o resultado da população
    console.log(`[DEBUG AUTH] Resultado da População:`);
    // Verifica se o presente foi populado (se for um objeto, é sucesso; se for null, falhou)
    if (userWithGift.chosenGift && userWithGift.chosenGift.name) {
      console.log(`[DEBUG AUTH] SUCESSO! Nome do Presente encontrado: ${userWithGift.chosenGift.name}`);
    } else if (userWithGift.chosenGift === null && userWithGift.hasChosenGift) {
      console.log(`[DEBUG AUTH] FALHA DE POPULATE. chosenGift é null, mas tem hasChosenGift: true.`);
    } else {
      console.log(`[DEBUG AUTH] chosenGift: ${userWithGift.chosenGift}`);
    }

    res.json({ user: userWithGift });
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