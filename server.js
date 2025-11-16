// =========================================================
// 1. IMPORTS
// =========================================================
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin'); 

// =========================================================
// 2. CONFIGURAÇÃO DO FIREBASE ADMIN SDK (Seguro para Heroku)
// =========================================================

// Verifica se a variável de ambiente secreta (do Heroku) existe.
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // 🌐 AMBIENTE DE PRODUÇÃO (Heroku)
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Firestore conectado via Variáveis de Ambiente (Heroku).');
} else {
    // 💻 AMBIENTE DE DESENVOLVIMENTO (PC Local)
    // Usa o arquivo JSON local, que não deve ser enviado para o GitHub.
    const serviceAccount = require('./calorias-fb-e047bb038f2c.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Firestore conectado via arquivo JSON local.');
}

// Inicializa a referência ao Firestore.
const db = admin.firestore();

// 🚨 EXPORTAÇÃO CRÍTICA: Exporta o DB IMEDIATAMENTE para evitar "undefined" nas rotas.
module.exports = { db }; 

// =========================================================
// 3. CONFIGURAÇÃO DO EXPRESS
// =========================================================
const app = express();
// 🚨 PORTA DINÂMICA: Usa a porta fornecida pelo Heroku ou 3000 localmente.
const PORT = process.env.PORT || 3000; 

// Importa as rotas DEPOIS que o DB foi exportado
const importRoutes = require('./routes/importarExcel'); 

app.use(express.json());

// 🌐 CONFIGURAÇÃO DE CORS (Ajustado para o seu GitHub Pages)
const allowedOrigins = [
    'http://localhost:5500', 
    'http://127.0.0.1:5500',
    // 🚨 DOMÍNIO BASE DO SEU GITHUB PAGES
    'https://wardlust.github.io' 
];

app.use(cors({
    origin: function (origin, callback) {
        // Permite requisições sem "origin" (como do Postman)
        if (!origin) return callback(null, true); 

        // 1. Verifica se a origem está na lista de domínios base permitidos
        const isAllowed = allowedOrigins.indexOf(origin) !== -1;

        // 2. Verifica se a origem é a URL completa do seu projeto no Pages
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

// Rota de Importação (POST /api/refeicoes/importar-excel)
app.use('/api/refeicoes', importRoutes); 

// Rota de Listagem (GET /api/refeicoes)
app.get('/api/refeicoes', async (req, res) => {
    try {
        const snapshot = await db.collection('refeicoes').get();
        const dadosCompletos = [];
        
        snapshot.forEach(doc => {
            dadosCompletos.push(doc.data()); 
        });

        // 🚨 LISTA DE ORDEM CRONOLÓGICA DAS REFEIÇÕES
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

        // 🚨 CONVERSÃO COM ORDENAÇÃO:
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
// 5. INÍCIO DO SERVIDOR (Ajustado para Heroku)
// =========================================================
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});