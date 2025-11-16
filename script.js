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
    // Limpa mensagens anteriores
    mensagem.textContent = "Importando arquivo...";
    mensagem.className = "text-info";
    
    // Verifica se um arquivo foi selecionado
    if (!input.files || input.files.length === 0) {
        mensagem.className = "text-danger";
        mensagem.textContent = "Selecione um arquivo para importar.";
        return;
    }

    const arquivo = input.files[0];
    const formData = new FormData();
    formData.append("arquivo", arquivo);

    try {
    const resposta = await fetch("https://calorias-api-wardlust.onrender.com/api/refeicoes/importar-excel", {
        method: "POST",
        body: formData,
    });
}

        if (resposta.ok) {
            const resultado = await resposta.json();
            mensagem.className = "text-success";
            mensagem.textContent = `${resultado.mensagem} (Total: ${resultado.total})`;
            
            // 🚨 CRÍTICO: Atualiza a lista após a importação bem-sucedida
            carregarRefeicoes(); 
        } else {
            const erro = await resposta.json();
            mensagem.className = "text-danger";
            mensagem.textContent = `Erro ao importar o arquivo: ${erro.erro || 'Erro desconhecido.'}`;
        }
    } catch (erro) {
        console.error("Erro na requisição de importação:", erro);
        mensagem.className = "text-danger";
        mensagem.textContent = "Erro ao conectar com o servidor. Verifique o console.";
    }
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
    // Assume que o botão de Enviar no HTML tem um onclick="importarExcel()"
    // OU que o botão tenha um ID específico (ex: 'btnEnviar') e essa linha o anexa
    const btnEnviar = document.querySelector('button[onclick="enviarArquivo()"]'); 
    
    // 🚨 CRÍTICO: Inicia o carregamento da lista ao abrir a página
    carregarRefeicoes();

});
