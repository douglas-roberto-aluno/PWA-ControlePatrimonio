if ("serviceWorker" in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
    })
}

const STORAGE_KEY = 'patrimonios';
let patrimonios = [];

let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;

    const installBtn = document.getElementById('installBtn');
    if(installBtn){
        installBtn.hidden = false;
    }
})


//Carregando

document.addEventListener('DOMContentLoaded', () => {
    carregaPatrimonios();
    renderizarPatrimonios();
    document.getElementById('patrimonioForm').addEventListener('submit', adicionarPatrimonio);

    const installBtn = document.getElementById('installBtn');
    if(installBtn){
        installBtn.addEventListener('click', async ()=>{
            if(!deferredPrompt) return; //Para por aqui

            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            deferredPrompt = null;
            installBtn.hidden = true;
        })
    }
})

//Carrega patrimonios dp localStorage
function carregaPatrimonios(){
    const dados = localStorage.getItem(STORAGE_KEY);
    try {
        patrimonios = dados ? JSON.parse(dados) : [];
        if (!Array.isArray(patrimonios)) {
            patrimonios = [];
        }
    } catch (erro) {
        console.error('Erro ao carregar patrimônios:', erro);
        patrimonios = [];
    }
}


//renderiza patrimonios na tela
function renderizarPatrimonios(){
    const lista = document.getElementById('patrimonioList');

    if(patrimonios.length === 0){
        lista.innerHTML = '<p class="empty-message">Nenhum patrimônio registrado.</p>';
        return; //Para por aqui
    }

    lista.innerHTML = patrimonios.map(p =>`
        <div class="patrimonio-item">
            <strong>${escapeHtml(p.numero)}</strong>
            <p>${escapeHtml(p.descricao)}</p>
            <div class="patrimonio-actions">

                <button class="btn btn-check ${p.conferido ? 'checked':''}"
                onclick="alternarConferencia(${p.id})">
                    ${p.conferido ?'Conferido': 'A Conferir'}
                </button>


                <button class="btn btn-delete" onclick="deletarPatrimonio(${p.id})">
                Remover
                </button>
            </div>
        </div>
        `).join()
}

//Alternar o toggle do formulário

function toggleFormSection() {
    const formSection = document.getElementById('formSection');

    if (!formSection) {
        console.error('Elemento #formSection não encontrado.');
        return;
    }

    formSection.classList.toggle('visible');

    if (formSection.classList.contains('visible')) {
        const numeroPatrimonio = document.getElementById('numeroPatrimonio');

        if (numeroPatrimonio) {
            numeroPatrimonio.focus();
        }
    }
}

//Notificação temporária

function mostrarNotificacao(mensagem){
    const el = document.createElement('div');
    el.textContent = mensagem;
    el.className = 'toast';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
}

//Salvar no localStorage
function salvarPatrimonios(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patrimonios))
}

//Adiciona novo registro
function adicionarPatrimonio(e){
    e.preventDefault();

    const numeroPatrimonio = document.getElementById('numeroPatrimonio').value.trim()
    const descricao = document.getElementById("descricao").value.trim()

   if(!numeroPatrimonio || !descricao){
        alert("Preencha todos os campos");
        return; //Para por aqui
   } 

   //Verifica id duplicado
   if(patrimonios.some(p => p.numero === numeroPatrimonio)){
    alert("Já existe um patrimônio com este número")
    return; //Para por aqui
   }

   const novoPatrimonio = {
    id: Date.now(),
    numero: numeroPatrimonio,
    descricao: descricao,
    conferido: false,
    dataCriacao: new Date().toLocaleString('pt-BR'),
    dataConferencia: null
   }

   patrimonios.push(novoPatrimonio)
   salvarPatrimonios();

   document.getElementById('patrimonioForm').reset();
   toggleFormSection();

   renderizarPatrimonios();

   mostrarNotificacao("Patrimônio adicionado!");
}

function alternarConferencia(id){
    const patrimonio = patrimonios.find(
        p => Number(p.id) === Number(id)
    );
    if(patrimonio){
        patrimonio.conferido = !patrimonio.conferido;
        patrimonio.dataConferencia = patrimonio.conferido
            ? new Date().toLocaleString("pt-BR")
            : null;

        salvarPatrimonios();
        renderizarPatrimonios();
        const status = patrimonio.conferido
            ? 'conferido'
            : 'marcado como não conferido';
        mostrarNotificacao(`Patrimônio ${status}`);
    }
}

//deletar patrimônio

function deletarPatrimonio(id) {
    if (confirm('Tem certeza que deseja apagar este patrimônio?')) {
        patrimonios = patrimonios.filter(
            p => Number(p.id) !== Number(id)
        );
        salvarPatrimonios();
        renderizarPatrimonios();
        mostrarNotificacao("Patrimônio removido com sucesso!");
    }
}

function escapeHtml(text){
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

