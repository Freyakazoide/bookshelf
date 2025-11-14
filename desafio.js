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
        this.modalCriarMetaEl = document.getElementById('modal-criar-meta');
        this.btnAbrirModalMetaEl = document.getElementById('btn-abrir-modal-meta');
        this.btnFecharModalMetaEl = document.getElementById('btn-fechar-modal-meta');
        
        this.listaMetasAtivasEl = document.getElementById('lista-metas-ativas');
        this.listaMetasConcluidasEl = document.getElementById('lista-metas-concluidas');
        this.metaDetalheContainerEl = document.getElementById('meta-detalhe-container');

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

        this.metaTabsContainerEl = document.getElementById('meta-tabs-container');
        this.metaTabButtons = document.querySelectorAll('.meta-detalhe-tabs .tab-button');
        this.metaTabContents = document.querySelectorAll('.meta-tab-content');

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
        this.btnAbrirModalMetaEl.addEventListener('click', () => this.abrirModalMeta());
        this.btnFecharModalMetaEl.addEventListener('click', () => this.modalCriarMetaEl.close());
        this.modalCriarMetaEl.addEventListener('close', () => this.formCriarMetaEl.reset());

        this.formCriarMetaEl.addEventListener('submit', (e) => {
            e.preventDefault();
            this.criarNovaMeta();
        });

        this.listaMetasAtivasEl.addEventListener('click', (e) => this.handleMetaCardClick(e));
        this.listaMetasConcluidasEl.addEventListener('click', (e) => this.handleMetaCardClick(e));

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

        this.metaTabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabId = e.target.dataset.tab;
                this.metaTabButtons.forEach(btn => btn.classList.remove('active'));
                this.metaTabContents.forEach(content => content.classList.remove('active'));
                e.target.classList.add('active');
                document.getElementById(tabId).classList.add('active');
            });
        });
    },

    init: function(livros) {
        this.state.livros = livros;
        this.cacheDOM();
        this.bindEvents();
        
        this.state.metas = App.state.challenges || [];
        if (!this.state.metaAtivaId && this.state.metas.length > 0) {
            this.state.metaAtivaId = this.state.metas.sort((a,b) => b.id - a.id)[0].id;
        }
        
        this.render();
    },
    
    abrirModalMeta: function() {
        this.popularFiltroDeAno();
        this.campoObjetivoContainerEl.style.display = this.selectMetaTipoEl.value === 'lista' ? 'none' : 'block';
        this.modalCriarMetaEl.showModal();
    },

    popularFiltroDeAno: function() {
        const anoAtual = new Date().getFullYear();
        let options = '';
        for (let i = anoAtual + 2; i >= anoAtual - 5; i--) {
            options += `<option value="${i}" ${i === anoAtual ? 'selected' : ''}>${i}</option>`;
        }
        this.selectMetaAnoEl.innerHTML = options;
    },

    handleMetaCardClick: function(e) {
        const card = e.target.closest('.meta-card');
        if (card) {
            this.state.metaAtivaId = parseInt(card.dataset.metaid, 10);
            this.state.paginaMetaAtual = 0;
            this.render();
        }
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
        this.modalCriarMetaEl.close();
        this.render();
        App.mostrarNotificacao(`Meta "${nome}" criada com sucesso!`);
    },

    deletarMetaAtiva: async function() {
        const idParaDeletar = this.state.metaAtivaId;
        this.state.metas = this.state.metas.filter(meta => meta.id !== idParaDeletar);
        this.state.metaAtivaId = null;
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
        
        await this.salvarMetasNoServidor();
        this.render();
    },

    salvarMetasNoServidor: async function() {
        await App.salvarMetas(this.state.metas);
    },

    getMetaAtiva: function() {
        if (!this.state.metaAtivaId) return null;
        return this.state.metas.find(m => m.id === this.state.metaAtivaId);
    },

    calcularProgressoMeta: function(meta) {
        let progresso = 0, objetivo = meta.objetivo, unidade = '';
        const anoAtual = new Date().getFullYear();

        const leiturasDoAno = this.state.livros
            .flatMap(livro => (livro.leituras || []).map(leitura => ({ ...leitura, livro })))
            .filter(leitura => leitura.dataFim && new Date(leitura.dataFim).getFullYear() === meta.ano);

        if (meta.tipo === 'lista') {
            const idsMeta = new Set(meta.livrosDaMeta);
            const livrosDaMeta = this.state.livros.filter(livro => idsMeta.has(livro.id));
            progresso = livrosDaMeta.filter(livro => 
                (livro.leituras || []).some(leitura => leitura.dataFim && new Date(leitura.dataFim).getFullYear() === meta.ano)
            ).length;
            objetivo = livrosDaMeta.length;
            unidade = 'livros';
        } else if (meta.tipo === 'livros') {
            progresso = leiturasDoAno.length;
            unidade = 'livros';
        } else if (meta.tipo === 'paginas') {
            progresso = leiturasDoAno.reduce((total, leitura) => total + (parseInt(leitura.livro.paginas) || 0), 0);
            unidade = 'páginas';
        }
        
        const porcentagem = objetivo > 0 ? (progresso / objetivo) * 100 : 0;
        const concluida = (progresso >= objetivo && objetivo > 0) || (meta.ano < anoAtual);
        
        return { progresso, objetivo, porcentagem, unidade, concluida };
    },

    render: function() {
        this.renderListaDeMetas();
        const metaAtiva = this.getMetaAtiva();

        if (metaAtiva) {
            this.desafioAtivoContainerEl.classList.remove('hidden');
            this.nenhumaMetaContainerEl.classList.remove('hidden');
            this.nenhumaMetaContainerEl.classList.add('hidden');
            this.renderDetalhesDaMeta(metaAtiva);
        } else {
            this.desafioAtivoContainerEl.classList.add('hidden');
            this.nenhumaMetaContainerEl.classList.remove('hidden');
            this.nenhumaMetaContainerEl.classList.add('active');
        }
    },

    renderListaDeMetas: function() {
        let ativasHTML = '';
        let concluidasHTML = '';
        const anoAtual = new Date().getFullYear();

        const metasOrdenadas = [...this.state.metas].sort((a, b) => b.ano - a.ano || a.nome.localeCompare(b.nome));

        if (metasOrdenadas.length === 0) {
            this.listaMetasAtivasEl.innerHTML = '<p class="info-empty">Nenhuma meta ativa.</p>';
            this.listaMetasConcluidasEl.innerHTML = '<p class="info-empty">Nenhuma meta concluída.</p>';
            return;
        }

        metasOrdenadas.forEach(meta => {
            const { progresso, objetivo, porcentagem, unidade, concluida } = this.calcularProgressoMeta(meta);
            const tipoMetaTexto = meta.tipo === 'lista' ? 'Lista' : (meta.tipo === 'livros' ? 'Livros' : 'Páginas');
            const selecionado = meta.id === this.state.metaAtivaId ? 'active' : '';

            const cardHTML = `
                <div class="meta-card ${selecionado}" data-metaid="${meta.id}">
                    <h4>${meta.nome}</h4>
                    <div class="meta-card-info">
                        <span>${tipoMetaTexto} (${meta.ano})</span>
                        <strong>${progresso.toLocaleString('pt-BR')} / ${objetivo.toLocaleString('pt-BR')}</strong>
                    </div>
                    <progress class="meta-card-progresso" value="${porcentagem}" max="100"></progress>
                </div>
            `;
            
            if (meta.ano < anoAtual || (concluida && meta.ano === anoAtual)) {
                concluidasHTML += cardHTML;
            } else {
                ativasHTML += cardHTML;
            }
        });

        this.listaMetasAtivasEl.innerHTML = ativasHTML || '<p class="info-empty" style="text-align: center; color: var(--cor-texto-secundario);">Nenhuma meta ativa.</p>';
        this.listaMetasConcluidasEl.innerHTML = concluidasHTML || '<p class="info-empty" style="text-align: center; color: var(--cor-texto-secundario);">Nenhuma meta concluída.</p>';
    },

    renderDetalhesDaMeta: function(meta) {
        this.metaAtivaTituloEl.textContent = meta.nome;
        let progressoAtual = 0, objetivo = meta.objetivo, unidade = '', livrosParaRenderizar = [];

        const leiturasDoAno = this.state.livros
            .flatMap(livro => (livro.leituras || []).map(leitura => ({ ...leitura, livro })))
            .filter(leitura => leitura.dataFim && new Date(leitura.dataFim).getFullYear() === meta.ano);

        if (meta.tipo === 'lista') {
            this.metaTabsContainerEl.style.display = 'flex';
            this.renderizarSeletorDeLivros();
            
            const idsMeta = new Set(meta.livrosDaMeta);
            livrosParaRenderizar = this.state.livros.filter(livro => idsMeta.has(livro.id));
            
            progressoAtual = livrosParaRenderizar.filter(livro => 
                (livro.leituras || []).some(leitura => leitura.dataFim && new Date(leitura.dataFim).getFullYear() === meta.ano)
            ).length;
            
            objetivo = livrosParaRenderizar.length;
            unidade = 'livros da lista';
        } else { 
            this.metaTabsContainerEl.style.display = 'none';

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
            this.livrosDaMetaEl.innerHTML = '<p style="text-align: center; width: 100%; color: var(--cor-texto-secundario); margin-top: 1rem;">Nenhum livro para exibir nesta meta.</p>';
            return;
        }

        const livrosUnicos = [...new Map(livros.map(item => [item.id, item])).values()];
        
        this.livrosDaMetaEl.innerHTML = livrosUnicos.map(livro => {
            const capaSrc = livro.urlCapa || 'placeholder.jpg';
            const leituraFinalizada = (livro.leituras || []).find(l => l.dataFim && new Date(l.dataFim).getFullYear() === anoMeta);
            const isLido = !!leituraFinalizada;
            const dataFimFormatada = isLido ? new Date(leituraFinalizada.dataFim).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '';
            
            let statusInfo = '';
            if (isLido) {
                statusInfo = `<div class="card-nota" style="border-color: var(--cor-acao-primaria); color: var(--cor-acao-primaria);">✔️ Lido em ${dataFimFormatada}</div>`;
            } else {
                statusInfo = `<div class="card-nota" style="border-color: var(--cor-amarelo-aviso); color: var(--cor-amarelo-aviso);">⏳ Pendente</div>`;
            }
            
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
        this.state.metas = App.state.challenges || [];
        this.render();
    }
};