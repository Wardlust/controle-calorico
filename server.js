// server.js

// =========================================================
// 1. IMPORTS E CONFIG FIREBASE
// =========================================================
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin'); 

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} else {
    const serviceAccount = require('./calorias-fb-e047bb038f2c.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
module.exports = { db }; 

// =========================================================
// 2. CONFIGURAÇÃO EXPRESS E CORS
// =========================================================
const app = express();
const PORT = process.env.PORT || 3000; 
const importRoutes = require('./routes/importarExcel'); 

app.use(express.json());

const allowedOrigins = [
    'http://localhost:5500', 'http://127.0.0.1:5500', 'https://wardlust.github.io' 
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true); 
        const isProjectUrl = origin === 'https://wardlust.github.io/controle-calorico';
        if (allowedOrigins.indexOf(origin) !== -1 || isProjectUrl) {
            callback(null, true);
        } else {
            callback(new Error(`Not allowed by CORS: ${origin}`), false);
        }
    }
}));


// =========================================================
// 3. ROTAS
// =========================================================
app.use('/api/refeicoes', importRoutes); 

// Rota de Listagem (GET /api/refeicoes)
app.get('/api/refeicoes', async (req, res) => {
    try {
        const snapshot = await db.collection('refeicoes').get();
        const dadosCompletos = [];
        snapshot.forEach(doc => { dadosCompletos.push(doc.data()); });

        const ordemRefeicoes = ["Café da Manhã", "Almoço", "Café da Tarde", "Janta", "Lanche"];
        const agrupado = {};

        dadosCompletos.forEach(item => {
            const dia = item.dia;
            
            if (!agrupado[dia]) { agrupado[dia] = { dia: dia, refeicoes: {} }; }
            
            const nomeRefeicao = item.refeicao;
            
            if (!agrupado[dia].refeicoes[nomeRefeicao]) {
                agrupado[dia].refeicoes[nomeRefeicao] = {
                    nome: nomeRefeicao,
                    itensMap: new Map(),
                    totalMin: 0,
                    totalMax: 0
                };
            }
            
            // 🚨 NOVO: Soma as calorias
            agrupado[dia].refeicoes[nomeRefeicao].totalMin += item.caloriasMin;
            agrupado[dia].refeicoes[nomeRefeicao].totalMax += item.caloriasMax;

            // 🚨 CORREÇÃO DE DUPLICIDADE: Normaliza a chave para agrupar itens idênticos
            const itemNomeNormalizado = (item.item || "").trim().toLowerCase();
            const porcaoNormalizada = (item.porcao || "").trim().toLowerCase();
            const itemKey = `${itemNomeNormalizado}|${porcaoNormalizada}`;
            
            if (!agrupado[dia].refeicoes[nomeRefeicao].itensMap.has(itemKey)) {
                
                agrupado[dia].refeicoes[nomeRefeicao].itensMap.set(itemKey, {
                    item: item.item, 
                    porcao: item.porcao,
                    calorias: `${item.caloriasMin} - ${item.caloriasMax} kcal`
                });
            }
        });

        const resultadoFinal = Object.values(agrupado).map(dia => {
            
            const refeicoesDoDia = Object.values(dia.refeicoes).map(r => ({
                nome: r.nome,
                itens: Array.from(r.itensMap.values()),
                // 🚨 NOVO: Adiciona o total de calorias
                totalCalorias: `${r.totalMin} - ${r.totalMax} kcal`
            }));

            refeicoesDoDia.sort((a, b) => {
                return ordemRefeicoes.indexOf(a.nome) - ordemRefeicoes.indexOf(b.nome);
            });

            return { ...dia, refeicoes: refeicoesDoDia };
        });

        res.json(resultadoFinal); 

    } catch (error) {
        console.error("Erro ao listar refeições (Firestore):", error);
        res.status(500).json({ erro: "Erro ao carregar dados do banco." });
    }
});


// =========================================================
// 4. INÍCIO DO SERVIDOR
// =========================================================
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
