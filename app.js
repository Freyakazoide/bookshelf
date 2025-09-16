const App = {
    state: {
        allBooks: [],
        allChallenges: {},
    },
    cacheDOM: function() {
        this.navLinks = document.querySelectorAll('.nav-link');
        this.views = document.querySelectorAll('.view');
    },
init: async function() {
    console.log("Aplicativo iniciando...");
    this.cacheDOM();
    this.bindNavEvents();
    try {
        console.log("Carregando dados dos livros...");
        const livrosResponse = await fetch('/api/livros');
        if (!livrosResponse.ok) {
            throw new Error(`Erro HTTP ao buscar livros: ${livrosResponse.status}`);
        }
        this.state.allBooks = await livrosResponse.json();
        console.log("Livros carregados com sucesso!");

        // Inicia os módulos com os dados dos livros
        Estante.init();
        Estante.atualizar(this.state.allBooks);
        Adicionar.init(this.state.allBooks);
        Dashboard.init(this.state.allBooks);
        Desafio.init(this.state.allBooks);
        
    } catch (error) {
        console.error("Falha crítica ao carregar os dados:", error);
        // Exibe uma mensagem de erro para o usuário na estante
        const estanteEl = document.getElementById('estante-de-livros');
        if(estanteEl) estanteEl.innerHTML = "<p class='erro-carregamento'>Não foi possível carregar os livros. Verifique se o servidor está rodando e tente recarregar a página.</p>";
    }
    this.navegarPara('view-estante');
},
    bindNavEvents: function() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navegarPara(link.dataset.view);
            });
        });
    },
    navegarPara: function(viewId, payload = null) {
        this.views.forEach(view => view.classList.remove('active'));
        this.navLinks.forEach(link => link.classList.remove('active'));
        document.getElementById(viewId)?.classList.add('active');
        document.querySelector(`.nav-link[data-view="${viewId}"]`)?.classList.add('active');
        
        // Lógica para carregar o modo de edição
        if (viewId === 'view-adicionar' && payload) {
            Adicionar.modoEdicao(payload);
        }
    },


// Funções de manipulação de dados
salvarLivro: async function(livroData, id) {
    if (id) {
        // --- LÓGICA DE ATUALIZAÇÃO (PUT) ---
        const response = await fetch(`/api/livros/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(livroData)
        });
        if (!response.ok) throw new Error('Falha na API ao atualizar');
        
        const livroAtualizado = await response.json();
        const index = this.state.allBooks.findIndex(l => l.id == id);
        if (index > -1) this.state.allBooks[index] = livroAtualizado;

    } else {
        // --- LÓGICA DE CRIAÇÃO (POST) ---
        const novoLivro = {
            ...livroData,
            id: Date.now(), // Gera um ID único
            situacao: 'Quero Ler', // Define valores padrão
            leituras: [] // Prepara para a próxima fase do roadmap
        };
        const response = await fetch('/api/livros', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novoLivro)
        });
        if (!response.ok) throw new Error('Falha na API ao criar');

        const livroCriado = await response.json();
        this.state.allBooks.push(livroCriado);
    }
    // Atualiza a estante com os novos dados
    Estante.atualizar(this.state.allBooks);
},

atualizarLivro: async function(id, dadosAtualizados) {
    // Esta função é chamada pelo Painel do Livro para pequenas atualizações
    const index = this.state.allBooks.findIndex(l => l.id == id);
    if (index > -1) {
        const livroParaAtualizar = { ...this.state.allBooks[index], ...dadosAtualizados };
        
        const response = await fetch(`/api/livros/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(livroParaAtualizar)
        });
        if (!response.ok) throw new Error('Falha na API ao atualizar livro');

        this.state.allBooks[index] = await response.json();
        Estante.atualizar(this.state.allBooks);
    }
},

excluirLivro: async function(id) {
    const response = await fetch(`/api/livros/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Falha na API ao excluir livro');
    
    // Atualiza o estado local APÓS a confirmação da API
    this.state.allBooks = this.state.allBooks.filter(l => l.id != id);
    Estante.atualizar(this.state.allBooks);
},


};

document.addEventListener('DOMContentLoaded', () => App.init());