const express = require('express');
const app = express();
const morgan = require('morgan');
const busboy = require('connect-busboy');
const busboyBodyParser = require('busboy-body-parser');

require('./database');

const corsOptions ={// liberando acessos de qualquer url, sem essa permissão algumas urls são bloqueadas ao tentar a conexão 
  origin:'*', 
  credentials:true,            
  optionSuccessStatus:200,
}

//middlewars
app.use(morgan('dev'));
app.use(express.json());
app.use(busboy());
app.use(busboyBodyParser());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, PUT");
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

//rotas

app.use('/salao', require('./src/routes/salao.routes'));
app.use('/servico', require('./src/routes/servico.routes'));
app.use('/horario', require('./src/routes/horario.routes'));
app.use('/colaborador', require('./src/routes/colaborador.routes'));
app.use('/cliente', require('./src/routes/cliente.routes'));
app.use('/agendamento', require('./src/routes/agendamento.routes'));
app.use('/dias-disponiveis', require('./src/routes/agendamento.routes'));
app.use('/user', require('./src/routes/user.routes'));

//variables
app.set('port', 8000);

app.listen(app.get('port'), ()=>{
  console.log(`API Escutando na porta ${app.get('port')}`)
})

