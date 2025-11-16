const mongoose = require("mongoose");

const RefeicaoSchema = new mongoose.Schema({
  refeicao: { type: String, required: true }, 
  dia: { type: String, required: true },
  item: { type: String, required: true },
  porcao: { type: String, required: true },
  caloriasMin: { type: Number, required: true },
  caloriasMax: { type: Number, required: true }
});

module.exports = mongoose.model("Refeicao", RefeicaoSchema);
