import React, { useState, useEffect } from 'react';
import { Shield, Gift, LogOut, Plus, Trash2, Edit2, Download, User } from 'lucide-react';
import { getAdminReport, addGift, deleteGift, logout } from '../services/api';

const AdminPanel = ({ user, onLogout }) => {
  const [gifts, setGifts] = useState([]);
  const [stats, setStats] = useState({ total: 0, chosen: 0, available: 0 });
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGift, setNewGift] = useState({ name: '', description: '' });

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      const response = await getAdminReport();
      setGifts(response.data.gifts);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
      alert('Erro ao carregar relatório');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGift = async (e) => {
    e.preventDefault();
    if (!newGift.name.trim()) {
      alert('Nome do presente é obrigatório');
      return;
    }

    try {
      await addGift(newGift);
      setNewGift({ name: '', description: '' });
      setShowAddForm(false);
      await loadReport();
      alert('Presente adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar presente:', error);
      alert('Erro ao adicionar presente');
    }
  };

  const handleDeleteGift = async (giftId, giftName) => {
    if (!window.confirm(`Tem certeza que deseja deletar "${giftName}"?`)) {
      return;
    }

    try {
      await deleteGift(giftId);
      await loadReport();
      alert('Presente deletado com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar presente:', error);
      const message = error.response?.data?.error || 'Erro ao deletar presente';
      alert(message);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      onLogout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Presente', 'Status', 'Escolhido por', 'Email', 'Data'],
      ...gifts.map(gift => [
        gift.name,
        gift.available ? 'Disponível' : 'Escolhido',
        gift.chosenBy?.name || '-',
        gift.chosenBy?.email || '-',
        gift.chosenAt ? new Date(gift.chosenAt).toLocaleString('pt-BR') : '-'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `lista-presentes-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: 'url(/background.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="text-center bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
          <Shield className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen p-4"
      style={{
        backgroundImage: 'url(/background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {user.photo ? (
                <img 
                  src={user.photo} 
                  alt={user.name}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <Shield className="w-12 h-12 text-purple-600" />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Painel Admin</h1>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total de Presentes</p>
                <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <Gift className="w-12 h-12 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Escolhidos</p>
                <p className="text-3xl font-bold text-green-600">{stats.chosen}</p>
              </div>
              <User className="w-12 h-12 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Disponíveis</p>
                <p className="text-3xl font-bold text-blue-600">{stats.available}</p>
              </div>
              <Gift className="w-12 h-12 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Plus className="w-5 h-5" />
              Adicionar Presente
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Download className="w-5 h-5" />
              Exportar CSV
            </button>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <form onSubmit={handleAddGift} className="mt-6 p-4 bg-gray-50/80 backdrop-blur-sm rounded-lg">
              <h3 className="font-bold text-gray-800 mb-4">Novo Presente</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={newGift.name}
                    onChange={(e) => setNewGift({ ...newGift, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="Ex: Jogo de Panelas"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição (opcional)
                  </label>
                  <input
                    type="text"
                    value={newGift.description}
                    onChange={(e) => setNewGift({ ...newGift, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="Ex: Conjunto com 5 peças"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Adicionar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Gifts List */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Lista Completa</h2>
          
          <div className="space-y-3">
            {gifts.map(gift => (
              <div
                key={gift._id}
                className={`p-4 rounded-lg border-2 ${
                  gift.available
                    ? 'border-blue-300 bg-blue-50/80 backdrop-blur-sm'
                    : 'border-green-300 bg-green-50/80 backdrop-blur-sm'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className={`w-5 h-5 ${gift.available ? 'text-blue-600' : 'text-green-600'}`} />
                      <span className="font-bold text-gray-800">{gift.name}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        gift.available 
                          ? 'bg-blue-200 text-blue-800' 
                          : 'bg-green-200 text-green-800'
                      }`}>
                        {gift.available ? 'Disponível' : 'Escolhido'}
                      </span>
                    </div>
                    
                    {gift.description && (
                      <p className="text-sm text-gray-600 mb-2">{gift.description}</p>
                    )}
                    
                    {!gift.available && gift.chosenBy && (
                      <div className="text-sm text-gray-700 mt-2 p-2 bg-white rounded">
                        <p><strong>Escolhido por:</strong> {gift.chosenBy.name}</p>
                        <p><strong>Email:</strong> {gift.chosenBy.email}</p>
                        {gift.chosenAt && (
                          <p><strong>Data:</strong> {new Date(gift.chosenAt).toLocaleString('pt-BR')}</p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {gift.available && (
                    <button
                      onClick={() => handleDeleteGift(gift._id, gift.name)}
                      className="ml-4 p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                      title="Deletar"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;