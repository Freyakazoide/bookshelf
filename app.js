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

            // CORREÇÃO: Passa a lista de livros diretamente para a inicialização de cada módulo.
            Estante.init(this.state.allBooks);
            Adicionar.init(this.state.allBooks);
            Dashboard.init(this.state.allBooks);
            Desafio.init(this.state.allBooks);
            
        } catch (error) {
            console.error("Falha crítica ao carregar os dados:", error);
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
        
        if (viewId === 'view-adicionar' && payload) {
            Adicionar.modoEdicao(payload);
        }
    },
    salvarLivro: async function(livroData, id) {
        if (id) {
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
            const novoLivro = {
                ...livroData,
                id: Date.now(),
                situacao: 'Quero Ler',
                leituras: []
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
        
        Estante.atualizar(this.state.allBooks);
        Adicionar.init(this.state.allBooks); // Atualiza o Adicionar também
        Dashboard.atualizar(this.state.allBooks); // Atualiza o Dashboard
        Desafio.atualizar(this.state.allBooks); // Atualiza o Desafio
    },
    atualizarLivro: async function(id, dadosAtualizados) {
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
            Dashboard.atualizar(this.state.allBooks);
            Desafio.atualizar(this.state.allBooks);
        }
    },
    excluirLivro: async function(id) {
        const response = await fetch(`/api/livros/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Falha na API ao excluir livro');
        
        this.state.allBooks = this.state.allBooks.filter(l => l.id != id);
        Estante.atualizar(this.state.allBooks);
        Dashboard.atualizar(this.state.allBooks);
        Desafio.atualizar(this.state.allBooks);
    },
    mostrarNotificacao: function(mensagem, tipo = 'sucesso') {
        const container = document.getElementById('notificacao-container');
        
        const notificacaoEl = document.createElement('div');
        notificacaoEl.className = `toast ${tipo}`;
        notificacaoEl.textContent = mensagem;

        container.appendChild(notificacaoEl);

        setTimeout(() => {
            notificacaoEl.remove();
        }, 5000);
    },
};

document.addEventListener('DOMContentLoaded', () => App.init());