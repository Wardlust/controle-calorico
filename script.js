// script.js

// 🚨 URL CORRIGIDA: Aponta para o Backend no Render (o que está verde)
const BACKEND_URL = 'https://calorias-api-wardlust.onrender.com';

const mensagem = document.getElementById("mensagem");
const listaRefeicoes = document.getElementById("listaRefeicoes");
const seletorDia = document.getElementById("seletorDia");
let dadosSemana = []; // Variável global para armazenar os dados

// =========================================================
// 1. FUNÇÃO DE IMPORTAÇÃO (POST)
// =========================================================

async function importarExcel() {
    // 🚨 AVISO: Usando 'file-input', certifique-se de que o input de arquivo no seu HTML
    // TEM O ID 'file-input' para que isso funcione.
    const fileInput = document.getElementById('arquivoExcel');
    
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        alert('Por favor, selecione um arquivo Excel.');
        return;
    }

    const formData = new FormData();
    formData.append('excelFile', fileInput.files[0]);

    try {
        const resposta = await fetch(`${BACKEND_URL}/api/refeicoes/importar-excel`, {
            method: "POST",
            body: formData,
        });

        // Lógica de sucesso
        if (resposta.ok) {
            // Usa window.location.reload() para garantir que a listagem carregue os novos dados
            alert('Dados importados com sucesso! Recarregando a listagem...');
            window.location.reload(); 
        } else {
            const erro = await resposta.json();
            console.error('Erro de servidor na importação:', erro);
            alert('Erro ao importar dados: ' + (erro.erro || 'Erro desconhecido. Verifique o console.'));
        }

    } catch (error) {
        // Bloco CATCH
        console.error('Erro de rede ou na requisição:', error);
        alert('Erro ao conectar com o servidor. Verifique o console.');
    }
}


// =========================================================
// 2. FUNÇÃO DE INTERATIVIDADE E EXIBIÇÃO
// =========================================================

// Função para exibir APENAS o dia selecionado
function exibirDiaSelecionado(diaSelecionado) {
    document.querySelectorAll('.dia-container').forEach(div => {
        div.style.display = 'none';
    });

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
        // 🚨 URL CORRIGIDA AQUI TAMBÉM
        const resposta = await fetch(`${BACKEND_URL}/api/refeicoes`);
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
            
            htmlDias += `<option value="${diaNome}">${diaNome}</option>`;
        });

        seletorDia.innerHTML = htmlDias;
        
        // 2. Criar os containers de conteúdo para cada dia
        let htmlConteudo = "";
        
        dadosSemana.forEach(diaData => {
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
        listaRefeicoes.innerHTML = "<p>Erro ao carregar dados. Verifique a conexão com o servidor.</p>";
    }
}

// =========================================================
// 3. INICIALIZAÇÃO E EVENTOS (Limpeza e Consolidação)
// =========================================================

document.addEventListener('DOMContentLoaded', () => {

    // 1. Conecta o seletor de dias à função de exibição
    seletorDia.addEventListener('change', (event) => {
        exibirDiaSelecionado(event.target.value);
    });

    // 2. Conecta o botão de envio à função de importação
    // Assume que o botão agora tem o ID 'enviar-btn' (conforme correção anterior)
    const enviarBtn = document.getElementById('enviar-btn');
    
    if (enviarBtn) {
        enviarBtn.addEventListener('click', (event) => {
            event.preventDefault(); 
            importarExcel(); 
        });
    }

    // 3. Inicia o carregamento da listagem de refeições
    carregarRefeicoes();
});


