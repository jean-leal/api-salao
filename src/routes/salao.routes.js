const express = require('express');
const router = express.Router();
const Salao = require('../models/salao');
const Servico = require('../models/servico');
const Horario = require('../models/horario');

const util = require('../services/util')

router.post('/', async (req, res)=>{
  try{
    const salao = await new Salao(req.body).save();
    res.json({ salao });
  } catch (err) {
    res.json({error: true, message: err.message});
  }
});

router.get('/', async (req, res)=>{
  try{
    const saloes = await Salao.find({
      status: {$ne: 'E'},
    });
    res.json({
      saloes: saloes
    })
  } catch (err) {
    res.json({error: true, message: err.message});
  }
});

router.get('/servicos/:salaoId', async (req, res) =>{
  try{
    const {salaoId} = req.params;
    const servicos = await Servico.find({
      salaoId, 
      status: 'A'
    }).select('_id titulo');

    res.json({
      servicos: servicos.map(s => ({label : s.titulo, value: s._id}))
    })

  } catch (err) {
    res.json({error: true, message: err.message});
  }
});

router.get('/:id', async (req, res) =>{
  try{
    const horarios = await Horario.find({
      salaoId: req.params.id,
    }).select('dias inicio fim');

    const isOpened = await util.isOpened(horarios);


    const salao = await Salao.findById(req.params.id).select(
      'capa nome endereco.cidade telefone'
      );
    res.json({error: false, salao: { ...salao._doc, isOpened }})
  } catch (err) {
    res.json({error: true, message: err.message});
  }
})

module.exports = router;