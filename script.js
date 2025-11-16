// script.js

const mensagem = document.getElementById("mensagem");
// 🚨 Nota: Garanta que o seu input de arquivo no HTML tenha o ID "arquivoExcel"
const input = document.getElementById("arquivoExcel"); 
const listaRefeicoes = document.getElementById("listaRefeicoes");
const seletorDia = document.getElementById("seletorDia");
let dadosSemana = []; // Variável global para armazenar os dados

// =========================================================
// 1. FUNÇÃO DE IMPORTAÇÃO (POST)
// =========================================================

async function importarExcel() {
    // 1. O CÓDIGO INTEIRO DA FUNÇÃO COMEÇA AQUI
    
    try {
        // CÓDIGO QUE PODE FALHAR (como o fetch)
        const fileInput = document.getElementById('file-input');
        const formData = new FormData();
        formData.append('excelFile', fileInput.files[0]);

        // 🚨 URL CORRIGIDA
        const resposta = await fetch("https://calorias-api-wardlust.onrender.com/api/refeicoes/importar-excel", {
            method: "POST",
            body: formData,
        });

        // Lógica de sucesso (Se o Status for 200, 201...)
        if (resposta.ok) {
            alert('Dados importados com sucesso!');
            // Se houver uma função para recarregar a listagem, chame-a aqui
            // carregarDados(); 
        } else {
            const erro = await resposta.json();
            alert('Erro ao importar dados: ' + erro.erro);
        }

    } catch (error) {
        // 2. O BLOCO CATCH (OBRIGATÓRIO) ESTÁ AQUI
        console.error('Erro de rede ou na requisição:', error);
        alert('Erro ao conectar com o servidor ou problema interno. Verifique o console.');
    }

    // 3. A FUNÇÃO TERMINA AQUI
}


// =========================================================
// 2. FUNÇÃO DE INTERATIVIDADE E EXIBIÇÃO
// =========================================================

// Função para exibir APENAS o dia selecionado
function exibirDiaSelecionado(diaSelecionado) {
    // Esconde todos os containers de dia
    document.querySelectorAll('.dia-container').forEach(div => {
        div.style.display = 'none';
    });

    // Exibe o container do dia selecionado
    const divDia = document.getElementById(`dia-${diaSelecionado}`);
    if (divDia) {
        divDia.style.display = 'block';
    }
}


// Função principal para carregar os dados
async function carregarRefeicoes() {
    listaRefeicoes.innerHTML = "<p>Carregando...</p>";
    seletorDia.innerHTML = ""; // Limpa o seletor
    dadosSemana = []; // Reseta a variável global

    try {
        // Busca os dados agrupados por Dia e Refeição com itens detalhados
        const resposta = await fetch("http://127.0.0.1:3000/api/refeicoes");
        const dados = await resposta.json();

        if (!dados || dados.length === 0) {
            listaRefeicoes.innerHTML = "<p>Nenhuma refeição cadastrada.</p>";
            return;
        }

        dadosSemana = dados; // Armazena os dados globalmente

        // 1. Preencher o seletor de dias
        let htmlDias = "";
        let primeiroDia = null;

        dadosSemana.forEach((diaData, index) => {
            const diaNome = diaData.dia;
            if (index === 0) primeiroDia = diaNome;
            
            // Adiciona a opção no seletor
            htmlDias += `<option value="${diaNome}">${diaNome}</option>`;
        });

        seletorDia.innerHTML = htmlDias;
        
        // 2. Criar os containers de conteúdo para cada dia
        let htmlConteudo = "";
        
        dadosSemana.forEach(diaData => {
            // Cria um container para o dia
            htmlConteudo += `<div id="dia-${diaData.dia}" class="dia-container" style="display: none;">`;
            
            diaData.refeicoes.forEach(refeicao => {
                htmlConteudo += `
                    <div class="refeicao-card mb-3 p-3 border rounded">
                        <h4>${refeicao.nome}</h4>
                        <ul>
                            ${refeicao.itens.map(item => 
                                `<li>
                                    <strong>${item.item}</strong> 
                                    (Porção: ${item.porcao || 'N/A'}, 
                                    Calorias: ${item.calorias || 'N/A'})
                                </li>`
                            ).join("")}
                        </ul>
                    </div>
                `;
            });
            
            htmlConteudo += `</div>`; // Fecha .dia-container
        });

        listaRefeicoes.innerHTML = htmlConteudo;
        
        // 3. Exibir o primeiro dia por padrão
        if (primeiroDia) {
            exibirDiaSelecionado(primeiroDia);
        }

    } catch (erro) {
        console.error("Erro ao carregar lista de refeições:", erro);
        listaRefeicoes.innerHTML = "<p>Erro ao carregar dados. Verifique a conexão com o servidor e a API do Firestore.</p>";
    }
}

// =========================================================
// 3. INICIALIZAÇÃO E EVENTOS
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
 
    const btnEnviar = document.querySelector('button[onclick="enviarArquivo()"]'); 
    
document.addEventListener('DOMContentLoaded', () => {

    const enviarBtn = document.getElementById('enviar-btn');
    
    if (enviarBtn) {
        enviarBtn.addEventListener('click', (event) => {

            event.preventDefault(); 

            importarExcel(); 
        });
    }

    // 3. INICIA A FUNÇÃO DE LISTAGEM, se ela existir e estiver no escopo.
    // listagemInicial(); 
});






    
    carregarRefeicoes();

});


