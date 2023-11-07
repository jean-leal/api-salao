const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const colaborador = new Schema({
  nome: {
    type: String,
    required: [true, 'Nome é obrigatório.'],
  },
  telefone: {
    type: String,
    required: [true, 'Telefone é obrigatório.'],
  },
  email: {
    type: String,
    required: [true, 'E-mail é obrigatório.'],
  },
  senha: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    required: true,
    enum: ['A', 'I', 'E'],
    default: 'A'
  },
  foto: String,  
    
});

module.exports = mongoose.model('Colaborador', colaborador);