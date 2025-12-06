require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const User = require('./models/User');

const app = express();

// Trust proxy
app.set('trust proxy', 1);

// Middlewares
app.use(express.json());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
}));

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ Erro ao conectar MongoDB:', err));

// CORREÇÃO CRÍTICA iOS: Configuração que PREVINE rotação de sessionID
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: false,
  
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    touchAfter: 24 * 3600,
    crypto: {
      secret: process.env.SESSION_SECRET
    }
  }),
  
  name: 'sessionId',
  
  // CRÍTICO iOS: Cookie settings otimizados
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  },
  
  // REMOVIDO: rolling: true (causava renovação de sessionID)
  proxy: true,
  
  // CRÍTICO: Função customizada para gerar sessionID
  // Isso garante que o mesmo sessionID seja mantido
  genid: function(req) {
    // Se já existe sessionID no cookie, mantém ele
    if (req.cookies && req.cookies.sessionId) {
      console.log('🔄 Reutilizando sessionID existente:', req.cookies.sessionId);
      return req.cookies.sessionId;
    }
    // Senão, cria um novo
    const newId = require('crypto').randomBytes(16).toString('hex');
    console.log('🆕 Novo sessionID criado:', newId);
    return newId;
  }
});

// Middleware para parsear cookies ANTES da sessão
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// Aplica o middleware de sessão
app.use(sessionMiddleware);

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
  console.log('📦 Serializando:', user._id);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    console.log('📤 Desserializando:', user?._id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Middleware de debug
app.use((req, res, next) => {
  console.log('📱 Request:', {
    method: req.method,
    path: req.path,
    sessionID: req.sessionID,
    isAuth: req.isAuthenticated?.() || false,
    hasCookie: !!req.cookies.sessionId
  });
  next();
});

// Rotas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/gifts', require('./routes/gifts'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    session: {
      hasSession: !!req.session,
      sessionID: req.sessionID,
      isAuthenticated: req.isAuthenticated?.() || false
    }
  });
});

// Debug de sessão
app.get('/api/debug/session', (req, res) => {
  res.json({
    hasSession: !!req.session,
    sessionID: req.sessionID,
    cookieSessionId: req.cookies?.sessionId,
    isAuthenticated: req.isAuthenticated?.() || false,
    sessionData: req.session,
    user: req.user ? { 
      id: req.user._id, 
      email: req.user.email,
      hasChosenGift: req.user.hasChosenGift 
    } : null,
    cookies: req.cookies,
    headers: {
      cookie: req.get('cookie'),
      userAgent: req.get('user-agent'),
      origin: req.get('origin'),
      referer: req.get('referer')
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 Frontend: ${process.env.FRONTEND_URL}`);
  console.log(`🔒 Modo: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 MongoStore: ativado`);
  console.log(`🔧 SessionID fixo: habilitado`);
});