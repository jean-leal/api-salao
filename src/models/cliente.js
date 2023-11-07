const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cliente = new Schema({
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
    required: [true, 'Senha é obrigatório.'],
  },
  foto: String,  
  cpf: {
    type: String, 
    require: [true, 'CPF é obrigatório']
  },
  status: {
    type: String,
    required: true,
    enum: ['A', 'I', 'E'],
    default: 'A'
  },
  dataNascimento: {
    type: Date
  },
  rua: String,
  cidade: String,
  uf: String,
  cep: String,
  numero: String,
  dataCadastro: {
    type: Date, 
    default: Date.now,
  }
});

module.exports = mongoose.model('Cliente', cliente);