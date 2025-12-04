require('dotenv').config();
const mongoose = require('mongoose');

async function verifyDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const dbName = mongoose.connection.db.databaseName;
    console.log('\n🔍 === INFORMAÇÕES DO BANCO ===');
    console.log(`📦 Database conectado: ${dbName}`);
    console.log(`🔗 URI: ${process.env.MONGODB_URI}\n`);
    
    // Listar todas as collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    console.log('📚 Collections encontradas:');
    for (const col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      console.log(`   - ${col.name}: ${count} documentos`);
    }
    
    // Buscar dados nas collections específicas
    console.log('\n📊 === DADOS ===\n');
    
    // Gifts
    const Gift = mongoose.model('Gift', new mongoose.Schema({}, { strict: false }));
    const gifts = await Gift.find();
    const giftsChosen = gifts.filter(g => !g.available);
    
    console.log('🎁 PRESENTES:');
    console.log(`   Total: ${gifts.length}`);
    console.log(`   Escolhidos: ${giftsChosen.length}`);
    console.log(`   Disponíveis: ${gifts.length - giftsChosen.length}`);
    
    if (giftsChosen.length > 0) {
      console.log('\n   Presentes escolhidos:');
      giftsChosen.forEach((g, i) => {
        console.log(`   ${i + 1}. ${g.name}`);
        console.log(`      - chosenBy: ${g.chosenBy}`);
        console.log(`      - chosenAt: ${g.chosenAt}`);
      });
    }
    
    // Users
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const users = await User.find();
    
    console.log('\n👥 USUÁRIOS:');
    console.log(`   Total: ${users.length}`);
    
    if (users.length > 0) {
      users.forEach((u, i) => {
        console.log(`\n   ${i + 1}. ${u.name}`);
        console.log(`      - Email: ${u.email}`);
        console.log(`      - Admin: ${u.isAdmin ? 'SIM' : 'NÃO'}`);
        console.log(`      - Escolheu: ${u.hasChosenGift ? 'SIM' : 'NÃO'}`);
        console.log(`      - Presente ID: ${u.chosenGift || 'nenhum'}`);
      });
    } else {
      console.log('   ⚠️  Nenhum usuário encontrado!');
    }
    
    console.log('\n✅ Verificação completa!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

verifyDatabase();