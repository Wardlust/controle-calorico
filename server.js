// =========================================================
// 1. IMPORTS
// =========================================================
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin'); 

// =========================================================
// 2. CONFIGURAÇÃO DO FIREBASE ADMIN SDK (Seguro para Render)
// =========================================================

// Verifica se a variável de ambiente secreta (do Render) existe.
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Firestore conectado via Variáveis de Ambiente (Render).');
} else {
    // Para rodar localmente, usando o arquivo JSON (que não deve estar no GitHub)
    const serviceAccount = require('./calorias-fb-e047bb038f2c.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Firestore conectado via arquivo JSON local.');
}

// Inicializa a referência ao Firestore.
const db = admin.firestore();
module.exports = { db }; 

// =========================================================
// 3. CONFIGURAÇÃO DO EXPRESS
// =========================================================
const app = express();
const PORT = process.env.PORT || 3000; 

// 🚨 CORREÇÃO FINAL DE CAMINHO: Aponta para a pasta 'routes' que será enviada
const importRoutes = require('./routes/importarExcel'); 

app.use(express.json());

// CONFIGURAÇÃO DE CORS
const allowedOrigins = [
    'http://localhost:5500', 
    'http://127.0.0.1:5500',
    'https://wardlust.github.io' 
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true); 
        const isAllowed = allowedOrigins.indexOf(origin) !== -1;
        const isProjectUrl = origin === 'https://wardlust.github.io/controle-calorico';

        if (isAllowed || isProjectUrl) {
            callback(null, true);
        } else {
            callback(new Error(`Not allowed by CORS: ${origin}`), false);
        }
    }
}));


// =========================================================
// 4. ROTAS
// =========================================================
app.use('/api/refeicoes', importRoutes); 

// Rota de Listagem (GET /api/refeicoes) - CÓDIGO INALTERADO AQUI

app.get('/api/refeicoes', async (req, res) => {
    try {
        const snapshot = await db.collection('refeicoes').get();
        const dadosCompletos = [];
        
        snapshot.forEach(doc => {
            dadosCompletos.push(doc.data()); 
        });

        const ordemRefeicoes = [
            "Café da Manhã",
            "Almoço",
            "Café da Tarde",
            "Janta",
            "Lanche"
        ];

        const agrupado = {};

        dadosCompletos.forEach(item => {
            const dia = item.dia;
            
            if (!agrupado[dia]) {
                agrupado[dia] = { dia: dia, refeicoes: {} };
            }
            
            const nomeRefeicao = item.refeicao;
            
            if (!agrupado[dia].refeicoes[nomeRefeicao]) {
                agrupado[dia].refeicoes[nomeRefeicao] = {
                    nome: nomeRefeicao,
                    itensMap: new Map() 
                };
            }
            
            const itemKey = `${item.item}|${item.porcao}`;
            
            agrupado[dia].refeicoes[nomeRefeicao].itensMap.set(itemKey, {
                item: item.item,
                porcao: item.porcao,
                calorias: `${item.caloriasMin} - ${item.caloriasMax} kcal`
            });
        });

        const resultadoFinal = Object.values(agrupado).map(dia => {
            
            const refeicoesDoDia = Object.values(dia.refeicoes).map(r => ({
                nome: r.nome,
                itens: Array.from(r.itensMap.values()) 
            }));

            refeicoesDoDia.sort((a, b) => {
                return ordemRefeicoes.indexOf(a.nome) - ordemRefeicoes.indexOf(b.nome);
            });

            return {
                ...dia,
                refeicoes: refeicoesDoDia
            };
        });

        res.json(resultadoFinal); 

    } catch (error) {
        console.error("Erro ao listar refeições (Firestore):", error);
        res.status(500).json({ erro: "Erro ao carregar dados do banco." });
    }
});


// =========================================================
// 5. INÍCIO DO SERVIDOR
// =========================================================
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
