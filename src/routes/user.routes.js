const express = require("express");
const Busboy = require("busboy");
const bcrypt = require("bcrypt");
const moment = require("moment");

const User = require("../models/user");
const mongoose = require("mongoose");

const aws = require("../services/aws.js");

const router = express.Router();

router.post("/", async (req, res) => {
  var busboy = new Busboy({ headers: req.headers });
  busboy.on("finish", async () => {
    try {
      const userId = mongoose.Types.ObjectId();
      let foto = "";

      if (req.files) {
        const file = req.files.foto;

        const nameParts = file.name.split(".");
        const fileName = `${userId}.${nameParts[nameParts.length - 1]}`;
        foto = `user/${fileName}`;
        console.log(foto)
        const response = await aws.uploadToS3(file, foto);

        if (response.error) {
          res.json({ error: true, message: response.message });
          return false;
        }
      }

      const senha = await bcrypt.hash(req.body.senha, 10);

      const user = await new User({
        ...req.body,
        _id: userId,
        senha,
        foto,
      }).save();

      res.json({ user });
    } catch (err) {
      res.json({ error: true, message: err.message });
    }
  });
  req.pipe(busboy);
});

router.post("/login", async (req, res) => {
  try {
    const {email, senha} = req.body;
    const user = await User.findOne({email, status: 'A'});

    if (!user){
      throw  new Error('Nenhum usuário encontado.')
    }

    const validacaoSenha = await bcrypt.compare(senha, user.senha);
    if(!validacaoSenha) {
      throw new Error("Combinação errada de E-mail / Senha.")
    }

    res.json({
      user,
    })
    
  } catch (err) {
    res.json({ error: true, message: err.message});
  }
})
module.exports = router;
