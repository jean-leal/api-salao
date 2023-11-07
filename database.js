const mongoose = require('mongoose');
const URI = 'mongodb+srv://admin:admin@clusteragenda.k6as0sv.mongodb.net/agendamento?retryWrites=true&w=majority';

mongoose.set("strictQuery", false);

mongoose.connect(URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
      return console.log('Banco conectado');
  })
  .catch((err) =>console.log(err));