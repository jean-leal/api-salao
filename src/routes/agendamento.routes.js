const express = require('express');
const router = express.Router();
const moment = require('moment');
const util = require('../services/util');
const _ = require('lodash')

const Colaborador = require('../models/colaborador');
const Cliente = require('../models/cliente');
const Salao = require('../models/salao');
const Servico = require('../models/servico');
const Agendamento = require('../models/agendamento');
const Horarios = require('../models/horario');

router.post('/', async (req, res) =>{

  try {
    const {clientId, salaoId, servicoId, colaboradorId} = req.body;

    //fazer verificação se ainda existe o horario disponivel 

    // recuperar o cliente
    const cliente = await Cliente.findById(clientId).select('nome endereco');

    // recuperar o salão 
    const salao = await Salao.findById(salaoId);

    // recuperar o serviço 
    const servico = await Servico.findById(servicoId).select('preco titulo');

    // recuperar o clolaborador 
    const colaborador = await Colaborador.findById(colaboradorId);

    //criar agendamento
    const agendamento = await new Agendamento({
      ... req.body,
      valor: servico.preco
    }).save();

    res.json({ error: false, agendamento })
  } catch (err) {
    res.json({ error: true, message: err.message});
  }
});

router.post('/filter', async (req, res)=>{
  try {
    const {periodo, salaoId} = req.body;

    const agendamentos = await Agendamento.find({
      salaoId,
      data:{
        $gte: moment(periodo.inicio).startOf('day'),
        $lte: moment(periodo.final).endOf('day')
      }
    })
    .populate([
      {path: 'servicoId', select: 'titulo duracao'},
      {path: 'colaboradorId', select: 'nome'},
      {path: 'clienteId', select: 'nome'}
    ])

    res.json({ error: false, agendamentos });

  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

router.post('/dias-disponiveis', async (req, res) => {
  try {
   
    const {data, salaoId, servicoId} = req.body;
    const servico = await Servico.findById(servicoId).select('duracao');
    const horarios = await Horarios.find({salaoId});
    let agenda = [];
    let colaboradores = []
    let lastDay = moment(data);

    // duração do serviço
    const servicoMinutos = util.hourToMinutes(moment(servico.duracao).format('HH:mm'));
    
    const servicoSlots = util.sliceMinutes(
      moment(servico.duracao),
      moment(servico.duracao).add(servicoMinutos, 'minutes'),
      util.SLOT_DURATION
    ).length

    // procure nos próximos 365 dias ate a agenda conter 7 dias disponiveis
    for (let i = 0; i <= 365 && agenda.length < 7; i++ ){
      const espacosValidos = horarios.filter(horario => {
        //verificar o dia da semana
        const diaSemanaDisponivel = horario.dias.includes(moment(lastDay).day()); //0 - 6

        //verificar se o servico esta disponivel no dia
        const servicoDisponivel = horario.especialidadesId.includes(servicoId);

        return diaSemanaDisponivel && servicoDisponivel
      });

      // todos os colaboradores disponiveis no dia e seus 
      
      if (espacosValidos.length > 0) {
        let todosHorariosDia = {};

        for(let espaco of espacosValidos) {
          for(let colaboradorId of espaco.colaboradorId){
            if (!todosHorariosDia[colaboradorId]) {
              todosHorariosDia[colaboradorId] = []
            }

            // pegar todos os horarios de espaços e jogar para dentro do colaborador 
            todosHorariosDia[colaboradorId] = [
              ...todosHorariosDia[colaboradorId],
              ...util.sliceMinutes(
                util.mergeDateTime(lastDay, espaco.inicio),
                util.mergeDateTime(lastDay, espaco.fim),
                util.SLOT_DURATION
              )
            ]
          }
        }

        // ocupação de cada especialista no dia
        for (let colaboradorId of Object.keys(todosHorariosDia)){
          // recuperar os agendamentos 
          const agendamentos = Agendamento.find({
            colaboradorId, 
            data: {
              $gte: moment(lastDay).startOf('day'),
              $lte: moment(lastDay).endOf('day'),
            },
          })
          .select('data servicoId -_id')
          .populate('servicoId', 'duracao');

          // recuperar os horarios agendados 
          let horariosOcupados = (await agendamentos).map(agendamento => ({
            inicio: moment(agendamento.data),
            final: moment(agendamento.data).add(
              util.hourToMinutes(moment(agendamento.servicoId.duracao).format('HH:mm')
              ),
              'minutes')
          }));

          // recuperar todos os slots entre os agendamentos 
          horariosOcupados = horariosOcupados
            .map(horario => 
              util.sliceMinutes(
                horario.inicio,
                horario.final, 
                util.SLOT_DURATION
                )
              )
              .flat();   
          // remomendo todos os horarios / slots ocupados 
          let horariosLivres = util.splitByValue(todosHorariosDia[colaboradorId].map((horarioLivre) =>{
            return horariosOcupados.includes(horarioLivre) ? '-' : horarioLivre;
          }),
          '-'
          ).filter((space) => space.length > 0);
          
          // verificando de existe espaço suficiente no slot 
          horariosLivres = horariosLivres.filter(
            (horarios) => horarios.length >= servicoSlots
          );

          // verificando se os horarios dentro do horario tem a contidade necessaria
          horariosLivres = horariosLivres.map((slot) => slot.filter(
            (horario, index) => slot.length - index >= servicoSlots)
          ).flat();
          
          //formatando horarios de 2 em 2
          horariosLivres = _.chunk(horariosLivres, 2);

          // remover colaborador caso não tenha nenhum espaço 
          if (horariosLivres.length === 0) {
            todosHorariosDia = _.omit(todosHorariosDia, colaboradorId);
          } else {
            todosHorariosDia[colaboradorId] = horariosLivres;
          }
        
        }

        // verificar se tem colaborador disponivel naquele dia
        const totalColaborador = Object.keys(todosHorariosDia).length;

        if(totalColaborador > 0){
          colaboradores.push(Object.keys(todosHorariosDia));

          agenda.push({
            [lastDay.format('YYYY-MM-DD')]: todosHorariosDia,
          });
        } 
      
      }
 
      lastDay = lastDay.add(1, 'day')
    }

    //recuperando dados dos colaboradores
    colaboradores = _.uniq(colaboradores.flat());

    colaboradores = await Colaborador.find({
      _id: {$in: colaboradores},
    }).select('nome');

    colaboradores = colaboradores.map(c => ({
      ...c._doc, 
      nome: c.nome.split(' ')[0]
    }))

    res.json({ error: false,colaboradores, agenda })

  }catch (err) {
    res.json({ error: true, message: err.message });
  }
})

module.exports = router;