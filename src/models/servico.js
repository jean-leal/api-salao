const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const servico = new Schema({
  salaoId: {
    type: mongoose.Types.ObjectId,
    ref: 'Salao',
    required: true,
  }, 
  titulo: {
    type: String,
    required: true
  },
  preco: {
    type: Number,
    required: true
  },
  duracao: {
    type: Date, // duração em minutos
    required: true
  },
  descricao: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['A', 'I', 'E'],
    default: 'A'
  },
  dataCadastro: {
    type: Date, 
    default: Date.now,
  }
});

module.exports = mongoose.model('Servico', servico);