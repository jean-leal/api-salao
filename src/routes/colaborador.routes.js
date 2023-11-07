const express = require('express');
const router = express.Router();
const Colaborador = require('../models/colaborador');
const SalaoColaborador = require('../models/relationship/salaoColaborador');
const ColaboradorServico = require('../models/relationship/colaboradorServico');

router.post('/', async (req, res) =>{
  try{
    const {colaborador, salaoId} = req.body;
    let newColaborador = null;

    const existentColaborador = await Colaborador.findOne({
      $or: [
        {email: colaborador.email},
        {telefone: colaborador.telefone}
      ]
    })
    
    if (!existentColaborador){
      newColaborador = await new Colaborador(colaborador).save();
    }

    //relacionamento entre colaborador e salão
    let colaboradorId = existentColaborador
     ? existentColaborador._id
     : newColaborador._id;      
     
    //verifica se ja existe o relacionamento 
    const existentRelationship = await SalaoColaborador.findOne({
      salaoId,
      colaboradorId,
      status: {$ne: 'E'},
    });
  
    // se não esta vinculado 
    if(!existentRelationship) {
      await new SalaoColaborador ({
        salaoId, 
        colaboradorId,   
        status: colaborador.vinculo,     
      }).save();
    }
    // caso já exista o vinculo do colaborador e salao 
    if (existentColaborador){
      await SalaoColaborador.findOneAndUpdate({
        salaoId,
        colaboradorId,
      }, {status: colaborador.vinculo});
    }

    // relação com as especialidades 
    if (!existentRelationship){
      await ColaboradorServico.insertMany(
        colaborador.especialidades.map(servicoId => ({
         servicoId, 
         colaboradorId, 
         salaoId
        }))  )
    }
  

    if(existentRelationship && existentColaborador ){
      res.json({ error: true, message: 'Colaborador já cadastrado.'})
    } else {
      res.json({error:false})
    }
  } catch (err){
    res.json({ error: true, error: err.message})
  }
});

router.put('/:colaboradorId', async (req, res) =>{
  try{

    const { vinculo, vinculoId, especialidades, salaoId } = req.body;
    const {colaboradorId} = req.params;
  
    //vinculo 
    await SalaoColaborador.findByIdAndUpdate(vinculoId, {status : vinculo});

    //especialidades
    await ColaboradorServico.deleteMany({
      colaboradorId,
      salaoId
    });

    await ColaboradorServico.insertMany(
      especialidades.map(servicoId => ({
        servicoId, 
        colaboradorId, 
        salaoId
       })
       )
      )
    res.json({error: false})

  } catch (err) {
    res.json({error: true, message: err.message})
  }
});

router.delete('/vinculo/:id', async (req, res) =>{
  try{
    await SalaoColaborador.findByIdAndUpdate(req.params.id, {status: 'E'});
    res.json({error: false});
  } catch (err){
    res.json({error: true, message: err.message});
  }
});

router.post('/filter', async (req, res) =>{
  try {
    const colaboradores = await Colaborador.find(req.body.filters);
    res.json({error: false, colaboradores})
  } catch (err) {
    res.json({error: true, message: err.message});
  }
});

router.get('/salao/:salaoId', async (req, res) =>{
  try {
    console.log("chegou aqui")
    const {salaoId} = req.params;
    let listaColaboradores = [] ;

    //recuperar vinculos
    const salaoColaboradores = await SalaoColaborador.find({
      salaoId,
      status: { $ne: 'E' } // status diferente de "E"
    })
    .populate({path: 'colaboradorId', select: '-senha' })
    .select('colaboradorId dataCadastro status')

    for (let vinculo of salaoColaboradores) {
      const especialidades = await ColaboradorServico.find({
        colaboradorId : vinculo.colaboradorId._id
        
      },);
    
      listaColaboradores.push({
        ...vinculo._doc,
        especialidades: especialidades.map(especialidade => ( especialidade.servicoId ))
      })
    }
    
    res.json({
      error: false,
      colaboradores: listaColaboradores.map((vinculo) =>({
        ... vinculo.colaboradorId._doc,
        vinculoId: vinculo._id,
        vinculo: vinculo.status,
        especialidades: vinculo.especialidades,
        dataCadastro: vinculo.dataCadastro,
      }))
    })

  } catch (err) {
    res.json({error: true, message: err.message});
  }
});
module.exports = router;