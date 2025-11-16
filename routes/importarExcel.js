// routes/importarExcel.js

const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");

// 🚨 IMPORTAÇÃO CORRETA: Apenas importa o 'db' inicializado no server.js
// Caminho: '../' sobe da pasta 'routes' para a pasta 'backend'
const { db } = require('../server.js'); 

const router = express.Router();


// Configurar upload (arquivo ficará apenas em memória)
const upload = multer({ storage: multer.memoryStorage() });

// Função para converter "80 - 100 kcal" em números
function parseCalorias(texto) {
  if (!texto) return { min: 0, max: 0 };

  // Remove "kcal", espaços e divide por "-"
  const nums = texto.replace("kcal", "").trim().split("-");

  const min = parseInt(nums[0].trim());
  const max = nums[1] ? parseInt(nums[1].trim()) : min;

  return { min, max };
}

// Rota para importar o Excel
router.post("/importar-excel", upload.single("arquivo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ erro: "Envie um arquivo Excel." });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });

    const abasEsperadas = [
      "Café da Manhã",
      "Almoço",
      "Café da Tarde",
      "Janta",
      "Lanche"
    ];

    let registrosInseridos = 0;

    for (const aba of abasEsperadas) {
      const sheet = workbook.Sheets[aba];
      if (!sheet) continue;

      const linhas = XLSX.utils.sheet_to_json(sheet);

      let ultimoDia = null;

      for (const linha of linhas) {
        
        if (linha["Dia"] && linha["Dia"].trim() !== "") {
          ultimoDia = linha["Dia"].trim();
        }

        if (!ultimoDia) continue;

        const calorias = parseCalorias(linha["Calorias (Aprox.)"]);

        // Usa o 'db' importado do server.js
        await db.collection('refeicoes').add({
          refeicao: aba,
          dia: ultimoDia, 
          item: linha["Item"] || "",
          porcao: linha["Porção (Estimada)"] || "",
          caloriasMin: calorias.min,
          caloriasMax: calorias.max
        });

        registrosInseridos++;
      }
    }

    res.json({
      mensagem: "Importação concluída!",
      total: registrosInseridos
    });
  } catch (error) {
    // Este erro será o PERMISSION_DENIED se a API não estiver habilitada
    console.error("Erro ao importar (Firestore):", error);
    res.status(500).json({ erro: "Erro ao importar o arquivo." });
  }
});

module.exports = router;