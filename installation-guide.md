# 🎁 Guia de Instalação - Lista de Presentes

## Pré-requisitos
- Node.js 16+ instalado
- MongoDB instalado localmente OU conta no MongoDB Atlas (gratuita)
- Conta Google para OAuth

---

## 📝 PASSO 1: Configurar Google OAuth

1. Acesse: https://console.cloud.google.com/
2. Crie um novo projeto ou selecione um existente
3. Vá em **APIs & Services** > **Credentials**
4. Clique em **Create Credentials** > **OAuth 2.0 Client ID**
5. Configure:
   - Application type: **Web application**
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:5000/api/auth/google/callback`
6. Copie o **Client ID** e **Client Secret**
1052170724879-akv55vrbjun9mlffddtari766utf3tl8.apps.googleusercontent.com

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
---

## 📦 PASSO 2: Instalar Dependências

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
npx tailwindcss init
```

---

## ⚙️ PASSO 3: Configurar Variáveis de Ambiente

### Backend (.env na raiz do backend)
```env
MONGODB_URI=mongodb://localhost:27017/gift-list
GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
SESSION_SECRET=mude-para-algo-muito-seguro-e-aleatorio
ADMIN_EMAIL=seu-email@gmail.com
FRONTEND_URL=http://localhost:3000
PORT=5000
```

### Frontend (.env na raiz do frontend)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 🗄️ PASSO 4: Configurar Banco de Dados

### Opção A: MongoDB Local
1. Instale MongoDB: https://www.mongodb.com/try/download/community
2. Inicie o serviço: `mongod`
3. Use: `MONGODB_URI=mongodb://localhost:27017/gift-list`

### Opção B: MongoDB Atlas (Recomendado)
1. Crie conta gratuita: https://www.mongodb.com/cloud/atlas/register
2. Crie cluster gratuito
3. Em **Database Access**, crie um usuário
4. Em **Network Access**, adicione seu IP (ou 0.0.0.0/0 para teste)
5. Clique em **Connect** > **Connect your application**
6. Copie a string de conexão e substitua em `MONGODB_URI`

### Popular banco com dados de exemplo (opcional)
```bash
cd backend
node seed.js
```

---

## 🚀 PASSO 5: Iniciar a Aplicação

### Terminal 1 - Backend
```bash
cd backend
npm start
```
Backend rodará em: http://localhost:5000

### Terminal 2 - Frontend
```bash
cd frontend
npm start
```
Frontend abrirá automaticamente em: http://localhost:3000

---

## 🧪 PASSO 6: Testar

1. Acesse http://localhost:3000
2. Clique em **Entrar com Google**
3. Faça login com uma conta Google
4. Se for o email definido em `ADMIN_EMAIL`, você verá o painel admin
5. Caso contrário, verá a lista de presentes

---

## 🛠️ Comandos Úteis

### Backend
```bash
npm start          # Iniciar servidor
npm run dev        # Modo desenvolvimento (com nodemon)
node seed.js       # Popular banco com dados
```

### Frontend
```bash
npm start          # Iniciar desenvolvimento
npm run build      # Build para produção
```

---

## 📱 Deploy em Produção

### Backend (Render/Railway/Vercel)
1. Faça push do código para GitHub
2. Conecte o repositório na plataforma
3. Configure as variáveis de ambiente
4. Atualize `GOOGLE_CALLBACK_URL` e `FRONTEND_URL`

### Frontend (Vercel/Netlify)
1. Faça push do código para GitHub
2. Conecte o repositório
3. Configure `REACT_APP_API_URL` com URL do backend em produção
4. Atualize URLs no Google Console

---

## ❓ Problemas Comuns

### Erro: "Cannot find module"
```bash
# Reinstale dependências
npm install
```

### Erro: "MongoDB connection failed"
- Verifique se MongoDB está rodando
- Confirme MONGODB_URI no .env
- No Atlas, verifique Network Access

### Erro: "Google OAuth redirect_uri_mismatch"
- Verifique se as URLs no Google Console correspondem às configuradas
- URLs devem ser EXATAMENTE iguais

### Erro: "CORS"
- Verifique se FRONTEND_URL no backend está correto
- Certifique-se de usar `withCredentials: true`

---

## 🎯 Próximos Passos

1. Personalize os textos e cores
2. Adicione mais campos aos presentes (foto, preço, link)
3. Implemente notificações por email
4. Adicione autenticação de dois fatores
5. Crie página de estatísticas

---

## 📧 Suporte

Problemas? Verifique:
1. Todas as variáveis de ambiente estão corretas
2. Portas 3000 e 5000 estão livres
3. MongoDB está acessível
4. Google OAuth está configurado corretamente

Boa sorte! 🎉