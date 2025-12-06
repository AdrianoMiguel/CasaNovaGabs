require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const cors = require('cors');
// ADICIONADO: Import do MongoStore
const MongoStore = require('connect-mongo');
const User = require('./models/User');

const app = express();

// CORREÇÃO 1: Trust proxy (Necessário para ambientes como Fly.io/Vercel)
app.set('trust proxy', 1);

// Middlewares
app.use(express.json());

// Verifica se está em ambiente de deploy (usando HTTPS)
const isHttps = process.env.FRONTEND_URL?.startsWith('https');

// CORREÇÃO 2: CORS com origem definida e credenciais
app.use(cors({
  origin: process.env.FRONTEND_URL, // Ex: https://lista.SEU-DOMINIO-RAIZ.com
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
}));

// CORREÇÃO 3: Sessão com configurações para subdomínio (SameSite=Lax + Domain)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: 'sessionId', 

  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions', 
    ttl: 7 * 24 * 60 * 60 * 1000, 
  }),

  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, 
    httpOnly: true, 
    // Secure deve ser TRUE em ambiente de produção com subdomínios HTTPS
    secure: isHttps, 
    // SameSite=Lax é o padrão seguro e agora funcional (same-site)
    sameSite: 'lax', 
    path: '/', 
    // CRÍTICO: Define o cookie para o domínio raiz (ex: .meudominio.com)
    // Se a variável não estiver setada, usa null (para ambiente local/dev)
    domain: process.env.COOKIE_DOMAIN || null, 
  },
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Configuração do Google OAuth
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    proxy: true 
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
  .then(() => {
    console.log('✅ MongoDB conectado');
    console.log('💾 MongoStore: ativado');
    console.log(`🔑 Cookie Domain: ${process.env.COOKIE_DOMAIN || 'não definido (local)'}`);
  })
  .catch(err => console.error('❌ Erro ao conectar MongoDB:', err));

// Rotas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/gifts', require('./routes/gifts'));

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor funcionando',
    session: {
      hasSession: !!req.session,
      sessionID: req.sessionID,
      isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false
    }
  });
});

// Rota de debug de sessão
app.get('/api/debug/session', (req, res) => {
  res.json({
    hasSession: !!req.session,
    sessionID: req.sessionID,
    isAuthenticated: req.isAuthenticated(),
    user: req.user ? { id: req.user._id, email: req.user.email } : null,
    cookies: req.cookies,
    headers: {
      cookie: req.get('cookie'),
      userAgent: req.get('user-agent'),
      origin: req.get('origin')
    }
  });
});

// Servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 Frontend: ${process.env.FRONTEND_URL}`);
  console.log(`🔒 Modo: ${process.env.NODE_ENV || 'development'}`);
});