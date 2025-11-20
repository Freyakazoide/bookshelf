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

        const handleMetaClick = (e) => {
            const btnReward = e.target.closest('.btn-claim-reward');
            if (btnReward) {
                e.stopPropagation();
                this.reivindicarRecompensa(parseInt(btnReward.dataset.id, 10));
                return;
            }
            const card = e.target.closest('.meta-card');
            if (card) {
                this.state.metaAtivaId = parseInt(card.dataset.metaid, 10);
                this.state.paginaMetaAtual = 0;
                this.render();
            }
        };

        this.listaMetasAtivasEl.addEventListener('click', handleMetaClick);
        this.listaMetasConcluidasEl.addEventListener('click', handleMetaClick);

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
            const card = e.target.closest('.card-livro-seletor'); // Mudei a classe para evitar conflito
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

    init: function(livros, metas) {
        this.state.livros = livros;
        this.state.metas = metas || [];
        this.cacheDOM();
        this.bindEvents();
        
        if (!this.state.metaAtivaId && this.state.metas.length > 0) {
            this.state.metaAtivaId = this.state.metas.sort((a,b) => b.id - a.id)[0].id;
        }
        
        this.render();
    },
    
    atualizar: function(livros, metas) {
        this.state.livros = livros;
        if(metas) this.state.metas = metas;
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

    criarNovaMeta: async function() {
        const nome = this.inputMetaNomeEl.value.trim();
        const ano = parseInt(this.selectMetaAnoEl.value, 10);
        const tipo = this.selectMetaTipoEl.value;
        const objetivo = parseInt(this.inputMetaObjetivoEl.value, 10);

        if (!nome) return App.mostrarNotificacao('Preencha o nome.', 'erro');

        const novaMeta = {
            id: Date.now(),
            nome: nome,
            ano: ano,
            tipo: tipo,
            objetivo: tipo === 'lista' ? 0 : objetivo,
            livrosDaMeta: tipo === 'lista' ? [] : undefined,
            recompensada: false
        };
        
        this.state.metas.push(novaMeta);
        this.state.metaAtivaId = novaMeta.id;
        await App.salvarMetas(this.state.metas);
        this.formCriarMetaEl.reset();
        this.modalCriarMetaEl.close();
        this.render();
        App.mostrarNotificacao(`Meta "${nome}" criada!`);
    },

    deletarMetaAtiva: async function() {
        const idParaDeletar = this.state.metaAtivaId;
        this.state.metas = this.state.metas.filter(meta => meta.id !== idParaDeletar);
        this.state.metaAtivaId = null;
        await App.salvarMetas(this.state.metas);
        this.render();
        App.mostrarNotificacao('Meta deletada.');
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
        
        await App.salvarMetas(this.state.metas);
        this.render(); // Re-renderiza para atualizar visual
    },

    getMetaAtiva: function() {
        if (!this.state.metaAtivaId) return null;
        return this.state.metas.find(m => m.id === this.state.metaAtivaId);
    },

    calcularProgressoMeta: function(meta) {
        let progresso = 0, objetivo = meta.objetivo;
        const anoAtual = new Date().getFullYear();
        const anoMeta = meta.ano;

        const leiturasDoAno = this.state.livros
            .flatMap(livro => (livro.leituras || []).map(leitura => ({ ...leitura, livro })))
            .filter(leitura => leitura.dataFim && new Date(leitura.dataFim).getFullYear() === anoMeta);

        if (meta.tipo === 'lista') {
            const idsMeta = new Set(meta.livrosDaMeta || []);
            const livrosDaMeta = this.state.livros.filter(livro => idsMeta.has(livro.id));
            progresso = livrosDaMeta.filter(livro => 
                (livro.leituras || []).some(leitura => leitura.dataFim && new Date(leitura.dataFim).getFullYear() === anoMeta)
            ).length;
            objetivo = livrosDaMeta.length;
        } else if (meta.tipo === 'livros') {
            progresso = leiturasDoAno.length;
        } else if (meta.tipo === 'paginas') {
            progresso = leiturasDoAno.reduce((total, leitura) => total + (parseInt(leitura.livro.paginas) || 0), 0);
        }
        
        const porcentagem = objetivo > 0 ? (progresso / objetivo) * 100 : 0;
        const concluida = (progresso >= objetivo && objetivo > 0);
        
        return { progresso, objetivo, porcentagem, concluida };
    },

    calcularRankMeta: function(meta) {
        let score = 0;
        if (meta.tipo === 'paginas') score = meta.objetivo / 500;
        else score = meta.objetivo;

        if (score >= 50) return { label: 'Rank S', class: 'meta-rank-S', xp: 10000, loot: 'Lendário' };
        if (score >= 20) return { label: 'Rank A', class: 'meta-rank-A', xp: 5000, loot: 'Épico' };
        if (score >= 10) return { label: 'Rank B', class: 'meta-rank-B', xp: 1500, loot: 'Raro' };
        if (score >= 4)  return { label: 'Rank C', class: 'meta-rank-C', xp: 500, loot: 'Incomum' };
        return { label: 'Rank D', class: 'meta-rank-D', xp: 100, loot: 'Comum' };
    },

    reivindicarRecompensa: async function(metaId) {
        const meta = this.state.metas.find(m => m.id === metaId);
        if (!meta || meta.recompensada) return;

        const rank = this.calcularRankMeta(meta);
        if(!confirm(`Receber recompensa de ${rank.label}?`)) return;

        meta.recompensada = true;
        await App.salvarMetas(this.state.metas);

        const itemReward = {
            id: 'quest_reward_' + Date.now(),
            nome: `Baú de Guilda (${rank.label})`,
            tipo: rank.loot,
            icone: 'fa-box-open',
            desc: `Recompensa: ${meta.nome}`,
            dropRate: 0
        };

        Gamification.mostrarModalLoot(itemReward, false);
        this.render();
    },

    render: function() {
        this.renderListaDeMetas();
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

    renderListaDeMetas: function() {
        let ativasHTML = '';
        let concluidasHTML = '';
        
        const metasOrdenadas = [...this.state.metas].sort((a, b) => b.ano - a.ano || a.nome.localeCompare(b.nome));

        if (metasOrdenadas.length === 0) {
            this.listaMetasAtivasEl.innerHTML = '<p class="info-empty">Nenhuma meta.</p>';
            this.listaMetasConcluidasEl.innerHTML = '<p class="info-empty">Nenhuma meta.</p>';
            return;
        }

        metasOrdenadas.forEach(meta => {
            const stats = this.calcularProgressoMeta(meta);
            const rank = this.calcularRankMeta(meta);
            const activeClass = meta.id === this.state.metaAtivaId ? 'active' : '';
            
            let btnClaim = '';
            if (stats.concluida && !meta.recompensada) {
                btnClaim = `<button class="btn btn-claim-reward" data-id="${meta.id}"><i class="fa-solid fa-gift"></i> Resgatar</button>`;
            } else if (meta.recompensada) {
                btnClaim = `<div style="text-align:center; font-size:0.7rem; color:#10b981; margin-top:5px;"><i class="fa-solid fa-check"></i> Coletado</div>`;
            }

            const rankColor = rank.label === 'Rank S' ? '#f59e0b' : rank.label === 'Rank A' ? '#a855f7' : rank.label === 'Rank B' ? '#3b82f6' : rank.label === 'Rank C' ? '#10b981' : '#94a3b8';

            const html = `
                <div class="meta-card ${activeClass} ${rank.class}" data-metaid="${meta.id}">
                    <div class="meta-header">
                        <h4>${meta.nome}</h4>
                        <span class="meta-tag-rank" style="background:${rankColor}">${rank.label}</span>
                    </div>
                    <div class="meta-card-info">
                        <span>${meta.tipo.toUpperCase()} (${meta.ano})</span>
                        <strong>${stats.progresso}/${stats.objetivo}</strong>
                    </div>
                    <div class="quest-bar-bg">
                        <div class="quest-bar-fill" style="width: ${stats.porcentagem}%"></div>
                    </div>
                    ${btnClaim}
                </div>
            `;

            if (stats.concluida) concluidasHTML += html;
            else ativasHTML += html;
        });

        this.listaMetasAtivasEl.innerHTML = ativasHTML || '<p class="info-empty">Vazio</p>';
        this.listaMetasConcluidasEl.innerHTML = concluidasHTML || '<p class="info-empty">Vazio</p>';
    },

    renderDetalhesDaMeta: function(meta) {
        this.metaAtivaTituloEl.textContent = meta.nome;
        const stats = this.calcularProgressoMeta(meta);
        this.progressoTextoEl.textContent = `${stats.progresso}/${stats.objetivo} concluídos`;
        this.progressoBarraEl.value = stats.porcentagem;
        
        if (meta.tipo === 'lista') {
            this.metaTabsContainerEl.style.display = 'flex';
            // Renderiza o seletor (Esquerda ou Aba Gerenciar)
            this.renderizarSeletorDeLivros();
            
            // Renderiza a lista de progresso (Aba Progresso)
            const idsMeta = new Set(meta.livrosDaMeta || []);
            const livrosDaLista = this.state.livros.filter(livro => idsMeta.has(livro.id));
            this.renderListaDeLivrosDaMeta(livrosDaLista, meta.ano);
        } else { 
            this.metaTabsContainerEl.style.display = 'none';
            
            // Renderiza todos os lidos no ano
            const livrosDoAno = this.state.livros.filter(l => (l.leituras||[]).some(lei => lei.dataFim && new Date(lei.dataFim).getFullYear() === meta.ano));
            this.renderListaDeLivrosDaMeta(livrosDoAno, meta.ano);
        }
    },
    
    filtrarLivrosParaSeletor: function() {
        let livrosFiltrados = this.state.livros;
        if (this.state.buscaMetaTermo) {
            livrosFiltrados = livrosFiltrados.filter(livro => 
                livro.nomeDoLivro.toLowerCase().includes(this.state.buscaMetaTermo)
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

        // HTML LIMPO PARA O SELETOR (Grid de Capas)
        this.seletorLivrosMetaEl.innerHTML = livrosParaExibir.map(livro => {
            const capaSrc = livro.urlCapa || 'placeholder.jpg';
            const selecionadoClass = idsNaMeta.has(livro.id) ? 'selected' : '';
            
            return `
                <div class="card-livro-seletor ${selecionadoClass}" data-id="${livro.id}">
                    <div class="seletor-capa-wrapper">
                        <img src="${capaSrc}" alt="${livro.nomeDoLivro}" onerror="this.src='placeholder.jpg';">
                        ${idsNaMeta.has(livro.id) ? '<div class="seletor-overlay"><i class="fa-solid fa-check"></i></div>' : ''}
                    </div>
                    <div class="seletor-titulo">${livro.nomeDoLivro}</div>
                </div>`;
        }).join('');
        this.renderPaginacaoSeletorMeta();
    },

    renderPaginacaoSeletorMeta: function() {
        const todos = this.filtrarLivrosParaSeletor();
        const totalPaginas = Math.ceil(todos.length / this.state.livrosPorPaginaMeta);
        
        if (totalPaginas > 1) {
            this.paginacaoSeletorMetaEl.classList.remove('hidden');
            this.btnMetaAnteriorEl.disabled = (this.state.paginaMetaAtual === 0);
            this.btnMetaProximaEl.disabled = (this.state.paginaMetaAtual + 1 >= totalPaginas);
            this.infoPaginaMetaEl.textContent = `Pág ${this.state.paginaMetaAtual + 1} de ${totalPaginas}`;
        } else {
            this.paginacaoSeletorMetaEl.classList.add('hidden');
        }
    },

    renderListaDeLivrosDaMeta: function(livros, anoMeta) {
        if (!livros || livros.length === 0) {
            this.livrosDaMetaEl.innerHTML = '<p style="text-align: center; width: 100%; padding: 2rem; color: #94a3b8;">Nenhum livro na lista ainda.</p>';
            return;
        }

        // HTML LIMPO PARA O PROGRESSO (Grid Vertical)
        this.livrosDaMetaEl.innerHTML = livros.map(livro => {
            const capaSrc = livro.urlCapa || 'placeholder.jpg';
            const leituraFinalizada = (livro.leituras || []).find(l => l.dataFim && new Date(l.dataFim).getFullYear() === anoMeta);
            const isLido = !!leituraFinalizada;
            
            const statusClass = isLido ? 'status-lido' : 'status-pendente';
            const statusIcon = isLido ? '<i class="fa-solid fa-check-circle"></i>' : '<i class="fa-solid fa-circle-notch"></i>';
            const statusText = isLido ? 'Concluído' : 'Pendente';

            return `
               <div class="card-livro-meta ${statusClass}">
                   <div class="meta-livro-capa">
                       <img src="${capaSrc}" onerror="this.src='placeholder.jpg';">
                   </div>
                   <div class="meta-livro-info">
                       <h5>${livro.nomeDoLivro}</h5>
                       <p>${livro.autor}</p>
                       <span class="meta-livro-status">${statusIcon} ${statusText}</span>
                   </div>
               </div>`;
        }).join('');
    }
};