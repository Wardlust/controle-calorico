// routes/importarExcel.js

const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const { db } = require('../server.js'); 

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

function parseCalorias(texto) {
    if (!texto) return { min: 0, max: 0 };
    const nums = texto.replace("kcal", "").trim().split("-");
    const min = parseInt(nums[0].trim());
    const max = nums[1] ? parseInt(nums[1].trim()) : min;
    return { min, max };
}

// 🚨 NOVA FUNÇÃO: Limpa todos os registros do Firestore
async function limparRefeicoesExistentes() {
    const batch = db.batch();
    const snapshot = await db.collection('refeicoes').get();
    
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });

    await batch.commit();
    console.log("Limpeza de dados concluída antes da importação.");
}


// Rota para importar o Excel
router.post("/importar-excel", upload.single("excelFile"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ erro: "Envie um arquivo Excel." });
        }

        // 1. EXECUTA A LIMPEZA DE DADOS ANTES DE COMEÇAR
        await limparRefeicoesExistentes(); 
        
        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });

        const abasEsperadas = [
            "Café da Manhã", "Almoço", "Café da Tarde", "Janta", "Lanche"
        ];

        let registrosInseridos = 0;

        for (const aba of abasEsperadas) {
            const sheet = workbook.Sheets[aba];
            if (!sheet) continue;

            const linhas = XLSX.utils.sheet_to_json(sheet);

            let ultimoDia = null;

            for (const linha of linhas) {
                // 2. Filtra linhas sem 'Item'
                if (!linha["Item"] || linha["Item"].trim() === "") {
                    continue; 
                }
                
                if (linha["Dia"] && linha["Dia"].trim() !== "") {
                    ultimoDia = linha["Dia"].trim();
                }

                if (!ultimoDia) continue;

                const calorias = parseCalorias(linha["Calorias (Aprox.)"]);

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
        console.error("Erro ao importar (Firestore):", error);
        res.status(500).json({ erro: "Erro ao importar o arquivo. Verifique o console do servidor." });
    }
});

module.exports = router;
