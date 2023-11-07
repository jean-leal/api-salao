const express = require('express');
const router = express.Router();
const Cliente = require('../models/cliente');
const SalaoCliente = require('../models/relationship/salaoCliente');

router.post('/', async (req, res) =>{
  try{
    const {cliente, salaoId} = req.body;
    let newCliente = null;

    //verificando se o cliente existe
    const existentCliente = await Cliente.findOne({
      $or: [
        {email: cliente.email},
        {telefone: cliente.telefone}
      ]
    })
    
    if (!existentCliente){
      // criando cliente
      newCliente = await new Cliente(cliente).save();
    }

    //relacionamento entre cliente e salão
    let clienteId = existentCliente
     ? existentCliente._id
     : newCliente._id;      
     
    //verifica se ja existe o relacionamento 
    const existentRelationship = await SalaoCliente.findOne({
      salaoId,
      clienteId,
      status: {$ne: 'E'},
    });
  
    // se não esta vinculado 
    if(!existentRelationship) {
      await new SalaoCliente({
        salaoId, 
        clienteId,   
      }).save();
    }
    // caso já exista o vinculo do cliente e salao 
    if (existentCliente){
      await SalaoCliente.findOneAndUpdate({
        salaoId,
        clienteId,
      }, {status: 'A'});
    }

    if(existentRelationship && existentCliente ){
      res.json({ error: true, message: 'Cliente já cadastrado.'})
    } else {
      res.json({error:false})
    }
  } catch (err){
    res.json({ error: true, error: err.message})
  }
});

router.post('/filter', async (req, res) =>{
  try {
    const clientes = await Cliente.find(req.body.filters);
    res.json({error: false, clientes})
  } catch (err) {
    res.json({error: true, message: err.message});
  }
});

router.get('/salao/:salaoId', async (req, res) =>{
  try {    
    const {salaoId} = req.params;

    //recuperar vinculos
    const clientes = await SalaoCliente.find({
      salaoId,
      status: { $ne: 'E' } // status diferente de "E"
    })
    .populate({path: 'clienteId', select: '-senha' })
    .select('clienteId dataCadastro')

    res.json({
      error: false,
      clientes: clientes.map((vinculo) =>({
        ... vinculo.clienteId._doc,
        vinculoId: vinculo._id,
        dataCadastro: vinculo.dataCadastro,
      }))
    })

  } catch (err) {
    res.json({error: true, message: err.message});
  }
});

router.delete('/vinculo/:id', async (req, res) =>{
  try{
    await SalaoCliente.findByIdAndUpdate(req.params.id, {status: 'E'});
    res.json({error: false});
  } catch (err){
    res.json({error: true, message: err.message});
  }
});


module.exports = router;

