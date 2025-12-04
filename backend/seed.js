require('dotenv').config();
const mongoose = require('mongoose');
const Gift = require('./models/Gift');

const sampleGifts = [
  { name: 'Jogo de Panelas', description: 'Conjunto com 5 peças de alumínio' },
  { name: 'Liquidificador', description: 'Potência de 600W' },
  { name: 'Toalhas de Banho', description: 'Jogo com 4 peças' },
  { name: 'Conjunto de Copos', description: '12 copos de vidro' },
  { name: 'Cafeteira Elétrica', description: 'Para 12 xícaras' },
  { name: 'Ferro de Passar', description: 'A vapor com base cerâmica' },
  { name: 'Jogo de Cama', description: 'Casal, 100% algodão' },
  { name: 'Mixer', description: 'Com 3 velocidades' },
  { name: 'Assadeiras', description: 'Kit com 3 tamanhos' },
  { name: 'Tábua de Vidro', description: 'Para corte temperado' }
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    // Limpa a coleção de presentes
    await Gift.deleteMany({});
    console.log('🗑️  Presentes antigos removidos');

    // Adiciona presentes de exemplo
    await Gift.insertMany(sampleGifts);
    console.log('✅ Presentes de exemplo adicionados');

    console.log(`📦 Total: ${sampleGifts.length} presentes criados`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

seedDatabase();