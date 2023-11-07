const express = require('express');
const router = express.Router();
const Servico = require('../models/servico');

router.post('/', async (req, res)=>{
  try{
    //criando serviço 
    const servico = await new Servico(req.body).save();
    res.json({ servico });
  } catch (err) {
    res.json({error: true, message: err.message});
  }
});

router.get('/salao/:salaoId', async (req, res)=>{
  try{
    const servicos = await Servico.find({
      salaoId: req.params.salaoId,
      status: {$ne: 'E'},
    });
    res.json({
      servicos: servicos
    })
  } catch (err) {
    res.json({error: true, message: err.message});
  }
});

router.put('/:id', async (req, res)=>{
  try{
    //atulizando serviço 
    const servico = req.body;
    await Servico.findByIdAndUpdate(req.params.id, servico);
    res.json({ error: false });
  } catch (err) {
    res.json({error: true, message: err.message});
  }
});

router.delete('/:id', async (req, res) => {
   try{ 
    const {id} = req.params;
    await Servico.findByIdAndUpdate(id, {status: 'E'});
    res.json({ error: false });
  } catch (err) {
    res.json({error: true, message: err.message});
  }
})

module.exports = router;