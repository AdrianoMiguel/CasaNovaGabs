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

// CORREÇÃO 1: Trust proxy (importante para Fly.io)
app.set('trust proxy', 1);

// Middlewares básicos
app.use(express.json());

// CORREÇÃO 2: CORS otimizado para mobile
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:5000'
    ];
    
    // Permite requisições sem origin (apps mobile nativos)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Permite todos temporariamente
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Set-Cookie'],
  exposedHeaders: ['set-cookie']
}));

// Conectar ao MongoDB ANTES de configurar a sessão
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ Erro ao conectar MongoDB:', err));

// CORREÇÃO 3: Sessão com MongoStore (crucial para mobile)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  
  // IMPORTANTE: Usar MongoDB para persistir sessões
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    touchAfter: 24 * 3600, // Atualiza sessão apenas se mudou (performance)
    crypto: {
      secret: process.env.SESSION_SECRET
    }
  }),
  
  name: 'sessionId',
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  },
  proxy: true
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// CORREÇÃO 4: Configuração otimizada do Google OAuth
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    proxy: true,
    // IMPORTANTE: Força re-autenticação para evitar cache
    accessType: 'offline',
    prompt: 'consent'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('🔐 Autenticando usuário:', profile.emails[0].value);
      
      let user = await User.findOne({ googleId: profile.id });
      
      if (user) {
        console.log('✅ Usuário existente encontrado');
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
      console.log('✅ Novo usuário criado');
      done(null, user);
    } catch (error) {
      console.error('❌ Erro na autenticação:', error);
      done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
  console.log('📦 Serializando usuário:', user._id);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    console.log('📤 Desserializando usuário:', user?.email);
    done(null, user);
  } catch (error) {
    console.error('❌ Erro ao desserializar:', error);
    done(error, null);
  }
});

// Middleware de debug
app.use((req, res, next) => {
  console.log('📱 Request:', {
    method: req.method,
    path: req.path,
    hasSession: !!req.session,
    sessionID: req.sessionID,
    isAuth: req.isAuthenticated?.() || false,
    cookies: req.headers.cookie ? 'presente' : 'ausente'
  });
  next();
});

// Rotas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/gifts', require('./routes/gifts'));

// Health check expandido
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    session: {
      hasSession: !!req.session,
      sessionID: req.sessionID,
      isAuthenticated: req.isAuthenticated?.() || false,
      mongoStore: 'connected'
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      frontendUrl: process.env.FRONTEND_URL
    }
  });
});

// Debug de sessão
app.get('/api/debug/session', (req, res) => {
  res.json({
    hasSession: !!req.session,
    sessionID: req.sessionID,
    isAuthenticated: req.isAuthenticated?.() || false,
    user: req.user ? { 
      id: req.user._id, 
      email: req.user.email,
      hasChosenGift: req.user.hasChosenGift 
    } : null,
    cookies: req.headers.cookie || 'nenhum',
    headers: {
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
});