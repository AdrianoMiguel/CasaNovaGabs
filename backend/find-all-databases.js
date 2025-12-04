require('dotenv').config();
const mongoose = require('mongoose');

async function findAllDatabases() {
  try {
    // Conecta SEM especificar database
    const baseUri = process.env.MONGODB_URI.split('?')[0].split('/').slice(0, -1).join('/');
    await mongoose.connect(baseUri);
    
    console.log('\n🔍 === BUSCANDO EM TODOS OS DATABASES ===\n');
    
    // Lista todos os databases
    const adminDb = mongoose.connection.db.admin();
    const { databases } = await adminDb.listDatabases();
    
    console.log(`📚 Encontrados ${databases.length} databases:\n`);
    
    for (const dbInfo of databases) {
      const dbName = dbInfo.name;
      console.log(`\n📦 Database: ${dbName}`);
      console.log(`   Tamanho: ${(dbInfo.sizeOnDisk / 1024 / 1024).toFixed(2)} MB`);
      
      // Conecta nesse database
      const db = mongoose.connection.client.db(dbName);
      
      // Lista collections
      const collections = await db.listCollections().toArray();
      
      if (collections.length === 0) {
        console.log('   ⚠️  Vazio (sem collections)');
        continue;
      }
      
      console.log(`   Collections (${collections.length}):`);
      
      for (const col of collections) {
        const count = await db.collection(col.name).countDocuments();
        console.log(`      - ${col.name}: ${count} documentos`);
        
        // Se for gifts ou users, mostra detalhes
        if (col.name === 'gifts' && count > 0) {
          const gifts = await db.collection('gifts').find().toArray();
          const chosen = gifts.filter(g => !g.available).length;
          console.log(`        → ${chosen} escolhidos, ${count - chosen} disponíveis`);
          
          gifts.filter(g => !g.available).forEach(g => {
            console.log(`        ✓ ${g.name} (escolhido)`);
          });
        }
        
        if (col.name === 'users' && count > 0) {
          const users = await db.collection('users').find().toArray();
          users.forEach(u => {
            console.log(`        → ${u.name} (${u.email}) - ${u.hasChosenGift ? 'escolheu' : 'não escolheu'}`);
          });
        }
      }
    }
    
    console.log('\n✅ Busca completa!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

findAllDatabases();