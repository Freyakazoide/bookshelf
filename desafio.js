const Desafio = {
    state: {
        livros: [],
        metas: [],
        metaAtivaId: null
    },

    cacheDOM: function() {
        this.selectMetaAtivaEl = document.getElementById('select-meta-ativa');
        this.btnDeletarMetaAtivaEl = document.getElementById('btn-deletar-meta-ativa');
        this.inputNomeNovaMetaEl = document.getElementById('input-nome-nova-meta');
        this.btnCriarNovaMetaEl = document.getElementById('btn-criar-nova-meta');
        this.desafioAtivoContainerEl = document.getElementById('desafio-ativo-container');
        this.nenhumaMetaContainerEl = document.getElementById('nenhuma-meta-selecionada');
        this.formDesafioEl = document.getElementById('form-desafio');
        this.selectLivrosMetaEl = document.getElementById('select-livros-meta');
        this.btnSalvarMetaEl = document.getElementById('btn-salvar-meta');
        this.progressoTextoEl = document.getElementById('progresso-texto');
        this.progressoBarraEl = document.getElementById('progresso-barra');
        this.livrosDaMetaEl = document.getElementById('desafio-livros-da-meta');
    },

    bindEvents: function() {
        this.btnCriarNovaMetaEl.addEventListener('click', () => {
            const nome = this.inputNomeNovaMetaEl.value.trim();
            if (nome) {
                this.criarNovaMeta(nome);
                this.inputNomeNovaMetaEl.value = '';
            } else {
                App.mostrarNotificacao('Por favor, dê um nome para a sua nova meta.', 'erro');
            }
        });

        this.selectMetaAtivaEl.addEventListener('change', (e) => {
            this.state.metaAtivaId = e.target.value ? parseInt(e.target.value, 10) : null;
            this.render();
        });

        this.btnDeletarMetaAtivaEl.addEventListener('click', () => {
            if (!this.state.metaAtivaId) {
                App.mostrarNotificacao('Selecione uma meta para deletar.', 'erro');
                return;
            }
            const metaAtiva = this.getMetaAtiva();
            if (confirm(`Tem certeza que deseja deletar a meta "${metaAtiva.nome}"? Esta ação não pode ser desfeita.`)) {
                this.deletarMetaAtiva();
            }
        });

        this.formDesafioEl.addEventListener('submit', async (e) => {
            e.preventDefault();
            const metaAtiva = this.getMetaAtiva();
            if (!metaAtiva) return;

            const idsSelecionados = Array.from(this.selectLivrosMetaEl.selectedOptions).map(opt => parseInt(opt.value, 10));
            metaAtiva.livrosDaMeta = idsSelecionados;

            const metaSet = new Set(metaAtiva.livrosDaMeta);
            metaAtiva.livrosConcluidos = metaAtiva.livrosConcluidos.filter(id => metaSet.has(id));

            await this.salvarMetasNoServidor();
            this.render();
            App.mostrarNotificacao('Livros salvos na meta!');
        });

        this.livrosDaMetaEl.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-toggle-concluido')) {
                const card = e.target.closest('.card-livro');
                const livroId = parseInt(card.dataset.id, 10);
                this.toggleConcluido(livroId);
            }
        });
    },

    init: async function(livros) {
        this.state.livros = livros;
        this.cacheDOM();
        this.bindEvents();
        
        try {
            const response = await fetch('/api/challenges');
            if (response.ok) {
                this.state.metas = await response.json();
                if (this.state.metas.length > 0) {
                    this.state.metaAtivaId = this.state.metas[0].id;
                }
            }
        } catch (error) {
            console.error("Não foi possível carregar as metas.", error);
            App.mostrarNotificacao("Não foi possível carregar suas metas.", 'erro');
        }
        
        this.render();
    },

    criarNovaMeta: async function(nome) {
        const novaMeta = {
            id: Date.now(),
            nome: nome,
            livrosDaMeta: [],
            livrosConcluidos: []
        };
        this.state.metas.push(novaMeta);
        this.state.metaAtivaId = novaMeta.id;
        await this.salvarMetasNoServidor();
        this.render();
        App.mostrarNotificacao(`Meta "${nome}" criada com sucesso!`);
    },

    deletarMetaAtiva: async function() {
        const idParaDeletar = this.state.metaAtivaId;
        this.state.metas = this.state.metas.filter(meta => meta.id !== idParaDeletar);
        this.state.metaAtivaId = null;
        try {
            await this.salvarMetasNoServidor();
            this.render();
            App.mostrarNotificacao('Meta deletada com sucesso!');
        } catch (error) {
            console.error('Erro ao deletar meta:', error);
            App.mostrarNotificacao('Não foi possível deletar a meta.', 'erro');
        }
    },

    toggleConcluido: async function(livroId) {
        const metaAtiva = this.getMetaAtiva();
        if (!metaAtiva) return;

        const concluidosSet = new Set(metaAtiva.livrosConcluidos);
        if (concluidosSet.has(livroId)) {
            concluidosSet.delete(livroId);
        } else {
            concluidosSet.add(livroId);
        }
        metaAtiva.livrosConcluidos = Array.from(concluidosSet);

        await this.salvarMetasNoServidor();
        this.render();
    },

    salvarMetasNoServidor: async function() {
        try {
            const response = await fetch('/api/challenges', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.state.metas)
            });
            if (!response.ok) throw new Error('Falha ao salvar no servidor');
        } catch (error) {
            console.error("Erro ao salvar metas:", error);
            App.mostrarNotificacao("Ocorreu um erro ao salvar suas metas.", 'erro');
        }
    },

    getMetaAtiva: function() {
        if (!this.state.metaAtivaId) return null;
        return this.state.metas.find(m => m.id === this.state.metaAtivaId);
    },

    render: function() {
        this.renderSeletorDeMetas();
        const metaAtiva = this.getMetaAtiva();

        if (metaAtiva) {
            this.desafioAtivoContainerEl.classList.remove('hidden');
            this.nenhumaMetaContainerEl.classList.add('hidden');
            this.renderDetalhesDaMeta(metaAtiva);
        } else {
            this.desafioAtivoContainerEl.classList.add('hidden');
            this.nenhumaMetaContainerEl.classList.remove('hidden');
        }
    },

    renderSeletorDeMetas: function() {
        this.selectMetaAtivaEl.innerHTML = '<option value="">-- Nenhuma --</option>' + 
        this.state.metas.map(meta => {
            const selecionado = meta.id === this.state.metaAtivaId ? 'selected' : '';
            return `<option value="${meta.id}" ${selecionado}>${meta.nome}</option>`;
        }).join('');
    },

    renderDetalhesDaMeta: function(meta) {
        const concluidos = meta.livrosConcluidos.length;
        const total = meta.livrosDaMeta.length;
        this.progressoTextoEl.textContent = `${concluidos} de ${total} livros concluídos`;
        this.progressoBarraEl.value = total > 0 ? (concluidos / total) * 100 : 0;

        this.selectLivrosMetaEl.innerHTML = this.state.livros.map(livro => {
            const selecionado = meta.livrosDaMeta.includes(livro.id) ? 'selected' : '';
            return `<option value="${livro.id}" ${selecionado}>${livro.nomeDoLivro}</option>`;
        }).join('');

        const idsMeta = new Set(meta.livrosDaMeta);
        const idsConcluidos = new Set(meta.livrosConcluidos);
        const livrosParaRenderizar = this.state.livros.filter(livro => idsMeta.has(livro.id));

        if (livrosParaRenderizar.length === 0) {
            this.livrosDaMetaEl.innerHTML = '<p>Nenhum livro adicionado a esta meta ainda. Selecione na lista acima e salve.</p>';
            return;
        }

        this.livrosDaMetaEl.innerHTML = livrosParaRenderizar.map(livro => {
            const isConcluido = idsConcluidos.has(livro.id);
            const capaSrc = livro.urlCapa || 'placeholder.jpg';
            const concluidoClasse = isConcluido ? 'concluido' : '';
            const checkmarkDisplay = isConcluido ? `<div class="card-nota">✔️</div>` : '';
            const botaoTexto = isConcluido ? 'Desmarcar Leitura' : 'Concluir Leitura';
            return `
               <div class="card-livro ${concluidoClasse}" data-id="${livro.id}">
                   ${checkmarkDisplay}
                   <img src="${capaSrc}" alt="Capa de ${livro.nomeDoLivro}" onerror="this.src='placeholder.jpg';">
                   <div class="card-info">
                       <h3>${livro.nomeDoLivro}</h3>
                   </div>
                   <div class="card-controles">
                       <button class="btn btn-toggle-concluido">${botaoTexto}</button>
                   </div>
               </div>`;
        }).join('');
    },
    
    atualizar: function(livros) {
        this.init(livros);
    }
};