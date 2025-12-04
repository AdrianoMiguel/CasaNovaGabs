const express = require('express');
const router = express.Router();
const Gift = require('../models/Gift');
const User = require('../models/User');
const { isAuthenticated, isAdmin, hasNotChosenGift } = require('../middleware/auth');

// Listar presentes disponíveis (para usuários normais)
router.get('/', isAuthenticated, async (req, res) => {
  try {
    let gifts;
    
    if (req.user.isAdmin) {
      // Admin vê todos os presentes com detalhes
      gifts = await Gift.find()
        .populate('chosenBy', 'name email')
        .sort({ createdAt: 1 });
    } else {
      // Usuários normais veem apenas disponíveis
      gifts = await Gift.find({ available: true })
        .select('_id name description')
        .sort({ createdAt: 1 });
    }
    
    res.json({ gifts });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar presentes' });
  }
});

// Escolher um presente - SEM TRANSAÇÕES
router.post('/:id/choose', isAuthenticated, hasNotChosenGift, async (req, res) => {
  try {
    const giftId = req.params.id;
    
    // Atualiza o presente usando findOneAndUpdate para atomicidade
    // Só atualiza se ainda estiver disponível (available: true)
    const updatedGift = await Gift.findOneAndUpdate(
      { _id: giftId, available: true },
      {
        available: false,
        chosenBy: req.user._id,
        chosenAt: new Date()
      },
      { new: true }
    );
    
    // Se não conseguiu atualizar, significa que já foi escolhido
    if (!updatedGift) {
      return res.status(400).json({ 
        error: 'Este presente não está mais disponível ou já foi escolhido' 
      });
    }
    
    // Atualiza o usuário
    await User.findByIdAndUpdate(req.user._id, {
      hasChosenGift: true,
      chosenGift: updatedGift._id
    });
    
    res.json({ 
      message: 'Presente escolhido com sucesso!',
      gift: {
        id: updatedGift._id,
        name: updatedGift.name
      }
    });
  } catch (error) {
    console.error('Erro ao escolher presente:', error);
    res.status(500).json({ error: 'Erro ao escolher presente' });
  }
});

// Admin: Adicionar presente
router.post('/', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Nome do presente é obrigatório' });
    }
    
    const gift = new Gift({
      name,
      description: description || ''
    });
    
    await gift.save();
    res.status(201).json({ gift });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao adicionar presente' });
  }
});

// Admin: Editar presente
router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    const gift = await Gift.findById(req.params.id);
    
    if (!gift) {
      return res.status(404).json({ error: 'Presente não encontrado' });
    }
    
    if (gift.chosenBy) {
      return res.status(400).json({ error: 'Não é possível editar um presente já escolhido' });
    }
    
    gift.name = name || gift.name;
    gift.description = description !== undefined ? description : gift.description;
    
    await gift.save();
    res.json({ gift });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao editar presente' });
  }
});

// Admin: Deletar presente
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const gift = await Gift.findById(req.params.id);
    
    if (!gift) {
      return res.status(404).json({ error: 'Presente não encontrado' });
    }
    
    if (gift.chosenBy) {
      return res.status(400).json({ error: 'Não é possível deletar um presente já escolhido' });
    }
    
    await Gift.findByIdAndDelete(req.params.id);
    res.json({ message: 'Presente deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar presente' });
  }
});

// Admin: Relatório completo
router.get('/admin/report', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const gifts = await Gift.find()
      .populate('chosenBy', 'name email')
      .sort({ chosenAt: -1 });
    
    const stats = {
      total: gifts.length,
      chosen: gifts.filter(g => !g.available).length,
      available: gifts.filter(g => g.available).length
    };
    
    res.json({ gifts, stats });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
});

module.exports = router;