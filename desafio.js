const Desafio = {
    state: {
        livros: [],
        metas: [],
        metaAtivaId: null,
        buscaMetaTermo: '',
        filtroMetaStatus: 'Todos',
        paginaMetaAtual: 0,
        livrosPorPaginaMeta: 20,
    },

    cacheDOM: function() {
        this.selectMetaAtivaEl = document.getElementById('select-meta-ativa');
        this.btnDeletarMetaAtivaEl = document.getElementById('btn-deletar-meta-ativa');
        
        this.formCriarMetaEl = document.getElementById('form-criar-meta');
        this.inputMetaNomeEl = document.getElementById('input-meta-nome');
        this.selectMetaAnoEl = document.getElementById('select-meta-ano');
        this.selectMetaTipoEl = document.getElementById('select-meta-tipo');
        this.inputMetaObjetivoEl = document.getElementById('input-meta-objetivo');
        this.campoObjetivoContainerEl = document.getElementById('campo-objetivo-container');
        
        this.desafioAtivoContainerEl = document.getElementById('desafio-ativo-container');
        this.nenhumaMetaContainerEl = document.getElementById('nenhuma-meta-selecionada');
        
        this.metaAtivaTituloEl = document.getElementById('meta-ativa-titulo');
        this.progressoTextoEl = document.getElementById('progresso-texto');
        this.progressoBarraEl = document.getElementById('progresso-barra');
        this.livrosDaMetaEl = document.getElementById('desafio-livros-da-meta');

        this.gerenciarListaContainerEl = document.getElementById('gerenciar-lista-container');
        this.inputBuscaLivrosMetaEl = document.getElementById('input-busca-livros-meta');
        this.filtrosStatusMeta = document.querySelectorAll('.filtro-status-meta');
        this.seletorLivrosMetaEl = document.getElementById('seletor-livros-meta');

        this.paginacaoSeletorMetaEl = document.getElementById('paginacao-seletor-meta');
        this.btnMetaAnteriorEl = document.getElementById('btn-meta-anterior');
        this.btnMetaProximaEl = document.getElementById('btn-meta-proxima');
        this.infoPaginaMetaEl = document.getElementById('info-pagina-meta');
    },

    bindEvents: function() {
        this.formCriarMetaEl.addEventListener('submit', (e) => {
            e.preventDefault();
            this.criarNovaMeta();
        });

        this.selectMetaAtivaEl.addEventListener('change', (e) => {
            this.state.metaAtivaId = e.target.value ? parseInt(e.target.value, 10) : null;
            this.state.paginaMetaAtual = 0;
            this.render();
        });

        this.btnDeletarMetaAtivaEl.addEventListener('click', () => {
            if (!this.state.metaAtivaId) return App.mostrarNotificacao('Selecione uma meta para deletar.', 'erro');
            const metaAtiva = this.getMetaAtiva();
            if (confirm(`Tem certeza que deseja deletar a meta "${metaAtiva.nome}"?`)) {
                this.deletarMetaAtiva();
            }
        });
        
        this.selectMetaTipoEl.addEventListener('change', (e) => {
            this.campoObjetivoContainerEl.style.display = e.target.value === 'lista' ? 'none' : 'block';
        });

        this.inputBuscaLivrosMetaEl.addEventListener('input', () => {
            this.state.buscaMetaTermo = this.inputBuscaLivrosMetaEl.value.toLowerCase();
            this.state.paginaMetaAtual = 0;
            this.renderizarSeletorDeLivros();
        });

        this.filtrosStatusMeta.forEach(button => {
            button.addEventListener('click', (e) => {
                this.filtrosStatusMeta.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                this.state.filtroMetaStatus = e.target.dataset.status;
                this.state.paginaMetaAtual = 0;
                this.renderizarSeletorDeLivros();
            });
        });

        this.seletorLivrosMetaEl.addEventListener('click', (e) => {
            const card = e.target.closest('.card-livro');
            if (card) {
                const livroId = parseInt(card.dataset.id, 10);
                this.toggleLivroNaMeta(livroId);
            }
        });

        this.btnMetaAnteriorEl.addEventListener('click', () => {
            if (this.state.paginaMetaAtual > 0) {
                this.state.paginaMetaAtual--;
                this.renderizarSeletorDeLivros();
            }
        });

        this.btnMetaProximaEl.addEventListener('click', () => {
            const livrosFiltrados = this.filtrarLivrosParaSeletor();
            const totalPaginas = Math.ceil(livrosFiltrados.length / this.state.livrosPorPaginaMeta);
            if (this.state.paginaMetaAtual + 1 < totalPaginas) {
                this.state.paginaMetaAtual++;
                this.renderizarSeletorDeLivros();
            }
        });
    },

    init: async function(livros) {
        this.state.livros = livros;
        this.cacheDOM();
        this.bindEvents();
        this.popularFiltroDeAno();
        
        try {
            const response = await fetch('/api/challenges');
            if (response.ok) {
                this.state.metas = await response.json();
                if (this.state.metas.length > 0) {
                    this.state.metaAtivaId = this.state.metas.sort((a,b) => b.id - a.id)[0].id;
                }
            }
        } catch (error) {
            console.error("Não foi possível carregar as metas.", error);
            App.mostrarNotificacao("Não foi possível carregar suas metas.", 'erro');
        }
        
        this.render();
    },
    
    popularFiltroDeAno: function() {
        const anoAtual = new Date().getFullYear();
        let options = '';
        for (let i = anoAtual + 2; i >= anoAtual - 5; i--) {
            options += `<option value="${i}" ${i === anoAtual ? 'selected' : ''}>${i}</option>`;
        }
        this.selectMetaAnoEl.innerHTML = options;
    },

    criarNovaMeta: async function() {
        const nome = this.inputMetaNomeEl.value.trim();
        const ano = parseInt(this.selectMetaAnoEl.value, 10);
        const tipo = this.selectMetaTipoEl.value;
        const objetivo = parseInt(this.inputMetaObjetivoEl.value, 10);

        if (!nome || (tipo !== 'lista' && (isNaN(objetivo) || objetivo <= 0))) {
            return App.mostrarNotificacao('Preencha o nome da meta e um objetivo válido.', 'erro');
        }

        const novaMeta = {
            id: Date.now(),
            nome: nome,
            ano: ano,
            tipo: tipo,
            objetivo: tipo === 'lista' ? 0 : objetivo,
            livrosDaMeta: tipo === 'lista' ? [] : undefined,
        };
        
        this.state.metas.push(novaMeta);
        this.state.metaAtivaId = novaMeta.id;
        await this.salvarMetasNoServidor();
        this.formCriarMetaEl.reset();
        this.popularFiltroDeAno();
        this.render();
        App.mostrarNotificacao(`Meta "${nome}" criada com sucesso!`);
    },

    deletarMetaAtiva: async function() {
        const idParaDeletar = this.state.metaAtivaId;
        this.state.metas = this.state.metas.filter(meta => meta.id !== idParaDeletar);
        this.state.metaAtivaId = this.state.metas.length > 0 ? this.state.metas.sort((a,b) => b.id - a.id)[0].id : null;
        await this.salvarMetasNoServidor();
        this.render();
        App.mostrarNotificacao('Meta deletada com sucesso!');
    },

    toggleLivroNaMeta: async function(livroId) {
        const metaAtiva = this.getMetaAtiva();
        if (!metaAtiva || metaAtiva.tipo !== 'lista') return;

        const index = metaAtiva.livrosDaMeta.indexOf(livroId);
        if (index > -1) {
            metaAtiva.livrosDaMeta.splice(index, 1);
        } else {
            metaAtiva.livrosDaMeta.push(livroId);
        }
        metaAtiva.objetivo = metaAtiva.livrosDaMeta.length;
        
        this.render(); 
        await this.salvarMetasNoServidor();
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
        const metasOrdenadas = [...this.state.metas].sort((a, b) => b.ano - a.ano || a.nome.localeCompare(b.nome));
        this.selectMetaAtivaEl.innerHTML = '<option value="">-- Nenhuma --</option>' + 
        metasOrdenadas.map(meta => {
            const selecionado = meta.id === this.state.metaAtivaId ? 'selected' : '';
            const tipoMetaTexto = meta.tipo === 'lista' ? 'Lista' : (meta.tipo === 'livros' ? 'Livros' : 'Páginas');
            return `<option value="${meta.id}" ${selecionado}>${meta.nome} (${tipoMetaTexto} - ${meta.ano})</option>`;
        }).join('');
    },

    renderDetalhesDaMeta: function(meta) {
        this.metaAtivaTituloEl.textContent = meta.nome;
        let progressoAtual = 0, objetivo = meta.objetivo, unidade = '', livrosParaRenderizar = [];

        if (meta.tipo === 'lista') {
            this.gerenciarListaContainerEl.classList.remove('hidden');
            this.campoObjetivoContainerEl.style.display = 'none';
            this.renderizarSeletorDeLivros();

            const idsMeta = new Set(meta.livrosDaMeta);
            livrosParaRenderizar = this.state.livros.filter(livro => idsMeta.has(livro.id));
            
            progressoAtual = livrosParaRenderizar.filter(livro => 
                (livro.leituras || []).some(leitura => leitura.dataFim && new Date(leitura.dataFim).getFullYear() === meta.ano)
            ).length;
            
            objetivo = livrosParaRenderizar.length;
            unidade = 'livros da lista';

        } else { 
            this.gerenciarListaContainerEl.classList.add('hidden');
            this.campoObjetivoContainerEl.style.display = 'block';

            const leiturasDoAno = this.state.livros
                .flatMap(livro => (livro.leituras || []).map(leitura => ({ ...leitura, livro })))
                .filter(leitura => leitura.dataFim && new Date(leitura.dataFim).getFullYear() === meta.ano);
            
            if (meta.tipo === 'livros') {
                progressoAtual = leiturasDoAno.length;
                unidade = 'livros';
            } else if (meta.tipo === 'paginas') {
                progressoAtual = leiturasDoAno.reduce((total, leitura) => total + (parseInt(leitura.livro.paginas) || 0), 0);
                unidade = 'páginas';
            }
            livrosParaRenderizar = leiturasDoAno.map(l => l.livro);
        }

        const porcentagem = objetivo > 0 ? (progressoAtual / objetivo) * 100 : 0;
        this.progressoTextoEl.textContent = `${progressoAtual.toLocaleString('pt-BR')} de ${objetivo.toLocaleString('pt-BR')} ${unidade} concluídos`;
        this.progressoBarraEl.value = porcentagem;
        
        this.renderListaDeLivrosDaMeta(livrosParaRenderizar, meta.ano);
    },
    
    filtrarLivrosParaSeletor: function() {
        let livrosFiltrados = this.state.livros;

        if (this.state.buscaMetaTermo) {
            livrosFiltrados = livrosFiltrados.filter(livro => 
                livro.nomeDoLivro.toLowerCase().includes(this.state.buscaMetaTermo) || 
                (livro.autor && livro.autor.toLowerCase().includes(this.state.buscaMetaTermo))
            );
        }

        if (this.state.filtroMetaStatus === 'NaoLidos') {
            livrosFiltrados = livrosFiltrados.filter(livro => 
                !(livro.leituras || []).some(leitura => leitura.dataFim)
            );
        }

        return livrosFiltrados.sort((a, b) => a.nomeDoLivro.localeCompare(b.nomeDoLivro));
    },

    renderizarSeletorDeLivros: function() {
        const metaAtiva = this.getMetaAtiva();
        if (!metaAtiva || metaAtiva.tipo !== 'lista') {
            this.seletorLivrosMetaEl.innerHTML = '';
            this.paginacaoSeletorMetaEl.classList.add('hidden');
            return;
        }

        const todosLivrosFiltrados = this.filtrarLivrosParaSeletor();
        const inicio = this.state.paginaMetaAtual * this.state.livrosPorPaginaMeta;
        const fim = inicio + this.state.livrosPorPaginaMeta;
        const livrosParaExibir = todosLivrosFiltrados.slice(inicio, fim);
        const idsNaMeta = new Set(metaAtiva.livrosDaMeta);

        this.seletorLivrosMetaEl.innerHTML = livrosParaExibir.map(livro => {
            const capaSrc = livro.urlCapa || 'placeholder.jpg';
            const selecionado = idsNaMeta.has(livro.id) ? 'selecionado' : '';
            return `
                <div class="card-livro ${selecionado}" data-id="${livro.id}">
                    <img src="${capaSrc}" alt="Capa de ${livro.nomeDoLivro}" onerror="this.src='placeholder.jpg';">
                    <div class="card-info">
                        <h5>${livro.nomeDoLivro}</h5>
                    </div>
                </div>`;
        }).join('');
        this.renderPaginacaoSeletorMeta();
    },

    renderPaginacaoSeletorMeta: function() {
        const todosLivrosFiltrados = this.filtrarLivrosParaSeletor();
        const totalPaginas = Math.ceil(todosLivrosFiltrados.length / this.state.livrosPorPaginaMeta);
        
        if (totalPaginas > 1) {
            this.paginacaoSeletorMetaEl.classList.remove('hidden');
            this.btnMetaAnteriorEl.disabled = (this.state.paginaMetaAtual === 0);
            this.btnMetaProximaEl.disabled = (this.state.paginaMetaAtual + 1 >= totalPaginas);
            this.infoPaginaMetaEl.textContent = `Página ${this.state.paginaMetaAtual + 1} de ${totalPaginas}`;
        } else {
            this.paginacaoSeletorMetaEl.classList.add('hidden');
        }
    },

    renderListaDeLivrosDaMeta: function(livros, anoMeta) {
        if (!livros || livros.length === 0) {
            this.livrosDaMetaEl.innerHTML = '<p style="text-align: center; width: 100%;">Nenhum livro para exibir nesta meta.</p>';
            return;
        }

        const livrosUnicos = [...new Map(livros.map(item => [item.id, item])).values()];
        
        this.livrosDaMetaEl.innerHTML = livrosUnicos.map(livro => {
            const capaSrc = livro.urlCapa || 'placeholder.jpg';
            const leituraFinalizada = (livro.leituras || []).find(l => l.dataFim && new Date(l.dataFim).getFullYear() === anoMeta);
            const isLido = !!leituraFinalizada;
            const dataFimFormatada = isLido ? new Date(leituraFinalizada.dataFim).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '';
            const statusInfo = isLido ? `<div class="card-nota">✔️ Lido em ${dataFimFormatada}</div>` : `<div class="card-nota status-pendente">⏳ Pendente</div>`;
            
            return `
               <div class="card-livro ${isLido ? 'concluido' : 'pendente'}" data-id="${livro.id}">
                   ${statusInfo}
                   <img src="${capaSrc}" alt="Capa de ${livro.nomeDoLivro}" onerror="this.src='placeholder.jpg';">
                   <div class="card-info">
                       <h3>${livro.nomeDoLivro}</h3>
                       <p>${livro.autor}</p>
                   </div>
               </div>`;
        }).join('');
    },
    
    atualizar: function(livros) {
        this.state.livros = livros;
        this.render();
    }
};