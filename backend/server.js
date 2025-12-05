require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const cors = require('cors');
const User = require('./models/User');

const app = express();

// CORREÇÃO 1: Trust proxy
app.set('trust proxy', 1);

// Middlewares
app.use(express.json());

// CORREÇÃO 2: CORS mais permissivo
app.use(cors({
  origin: function(origin, callback) {
    // Permite requisições sem origin (mobile apps, Postman, etc)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:5000'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(null, true); // Permite todos temporariamente para debug
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['set-cookie']
}));

// CORREÇÃO 3: Sessão com configurações otimizadas para mobile
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: 'sessionId', // Nome customizado do cookie
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias (mais tempo para mobile)
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // true apenas em produção
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    // Remove domain para funcionar melhor cross-domain
  },
  proxy: true // Importante para Fly.io
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Configuração do Google OAuth
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    proxy: true // Importante para funcionar com Fly.io
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

// CORREÇÃO 4: Middleware de debug para sessões
app.use((req, res, next) => {
  console.log('📱 Request:', {
    method: req.method,
    path: req.path,
    hasSession: !!req.session,
    sessionID: req.sessionID,
    isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
    userAgent: req.get('user-agent')
  });
  next();
});

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