// script.js

const BACKEND_URL = 'https://calorias-api-wardlust.onrender.com';

const mensagem = document.getElementById("mensagem");
const listaRefeicoes = document.getElementById("listaRefeicoes");
const seletorDia = document.getElementById("seletorDia");
let dadosSemana = []; 

// =========================================================
// 1. FUNÇÃO DE IMPORTAÇÃO (POST)
// =========================================================

async function importarExcel() {
    
    try {
        const fileInput = document.getElementById('arquivoExcel');
        
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            alert('Por favor, selecione um arquivo Excel.');
            return;
        }

        const formData = new FormData();
        formData.append('excelFile', fileInput.files[0]); 

        const resposta = await fetch(`${BACKEND_URL}/api/refeicoes/importar-excel`, {
            method: "POST",
            body: formData,
        });

        if (resposta.ok) {
            alert('Dados importados com sucesso! Recarregando a listagem...');
            window.location.reload(); 
        } else {
            const erro = await resposta.json();
            console.error('Erro de servidor na importação:', erro);
            alert('Erro ao importar dados: ' + (erro.erro || 'Erro desconhecido. Verifique o console.'));
        }

    } catch (error) {
        console.error('Erro de rede ou na requisição:', error);
        alert('Erro ao conectar com o servidor. Verifique o console.');
    }
}


// =========================================================
// 2. FUNÇÃO DE INTERATIVIDADE E EXIBIÇÃO
// =========================================================

function exibirDiaSelecionado(diaSelecionado) {
    document.querySelectorAll('.dia-container').forEach(div => {
        div.style.display = 'none';
    });

    const divDia = document.getElementById(`dia-${diaSelecionado}`);
    if (divDia) {
        divDia.style.display = 'block';
    }
}

async function carregarRefeicoes() {
    listaRefeicoes.innerHTML = "<p>Carregando...</p>";
    seletorDia.innerHTML = ""; 
    dadosSemana = []; 

    try {
        const resposta = await fetch(`${BACKEND_URL}/api/refeicoes`);
        const dados = await resposta.json();

        if (!dados || dados.length === 0) {
            listaRefeicoes.innerHTML = "<p>Nenhuma refeição cadastrada.</p>";
            return;
        }

        dadosSemana = dados; 

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
                        <h4>
                            ${refeicao.nome} 
                            <small class="text-muted" style="font-size: 0.8em;">
                               (Total: ${refeicao.totalCalorias})
                            </small>
                        </h4>
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
            
            htmlConteudo += `</div>`; 
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
// 3. INICIALIZAÇÃO E EVENTOS
// =========================================================

document.addEventListener('DOMContentLoaded', () => {

    if (seletorDia) {
        seletorDia.addEventListener('change', (event) => {
            exibirDiaSelecionado(event.target.value);
        });
    }

    const enviarBtn = document.getElementById('enviar-btn');
    
    if (enviarBtn) {
        enviarBtn.addEventListener('click', (event) => {
            event.preventDefault(); 
            importarExcel(); 
        });
    }

    carregarRefeicoes();
});
