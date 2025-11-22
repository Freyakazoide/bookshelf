const Desafio = {
    state: {
        livros: [],
        metas: [],
        metaAtivaId: null,
        buscaMetaTermo: '',
        filtroMetaStatus: 'Todos',
        paginaMetaAtual: 0,
        livrosPorPaginaMeta: 12, 
    },

    cacheDOM: function() {
        this.modalCriarMetaEl = document.getElementById('modal-criar-meta');
        this.btnAbrirModalMetaEl = document.getElementById('btn-abrir-modal-meta');
        this.btnFecharModalMetaEl = document.getElementById('btn-fechar-modal-meta');
        
        this.listaMetasAtivasEl = document.getElementById('lista-metas-ativas');
        this.listaMetasConcluidasEl = document.getElementById('lista-metas-concluidas');
        
        this.metaDetalheContainerEl = document.getElementById('meta-detalhe-container');
        
        this.formCriarMetaEl = document.getElementById('form-criar-meta');
        this.inputMetaNomeEl = document.getElementById('input-meta-nome');
        this.selectMetaAnoEl = document.getElementById('select-meta-ano');
        this.selectMetaTipoEl = document.getElementById('select-meta-tipo');
        this.inputMetaObjetivoEl = document.getElementById('input-meta-objetivo');
        this.campoObjetivoContainerEl = document.getElementById('campo-objetivo-container');
        
        this.desafioAtivoContainerEl = document.getElementById('desafio-ativo-container');
        this.nenhumaMetaContainerEl = document.getElementById('nenhuma-meta-selecionada');
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

        // Delegação de eventos para elementos dinâmicos dentro do container de detalhes
        this.metaDetalheContainerEl.addEventListener('click', (e) => {
            // Deletar Meta
            if (e.target.closest('#btn-deletar-meta-ativa')) {
                this.confirmarDelecaoMeta();
            }
            
            // Abas
            const tabBtn = e.target.closest('.tab-button');
            if (tabBtn) {
                document.querySelectorAll('.quest-tabs .tab-button').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.meta-tab-content').forEach(c => c.classList.remove('active'));
                tabBtn.classList.add('active');
                document.getElementById(tabBtn.dataset.tab).classList.add('active');
            }

            // Paginação Seletor
            if (e.target.closest('#btn-meta-anterior')) {
                if (this.state.paginaMetaAtual > 0) {
                    this.state.paginaMetaAtual--;
                    this.renderizarSeletorDeLivros();
                }
            }
            if (e.target.closest('#btn-meta-proxima')) {
                const livros = this.filtrarLivrosParaSeletor();
                const totalPaginas = Math.ceil(livros.length / this.state.livrosPorPaginaMeta);
                if (this.state.paginaMetaAtual + 1 < totalPaginas) {
                    this.state.paginaMetaAtual++;
                    this.renderizarSeletorDeLivros();
                }
            }

            // Selecionar Livro no Grid
            const cardSeletor = e.target.closest('.card-livro-seletor');
            if (cardSeletor) {
                this.toggleLivroNaMeta(parseInt(cardSeletor.dataset.id, 10));
            }
            
            // Filtros do Seletor
            const filtroBtn = e.target.closest('.filtro-status-meta');
            if (filtroBtn) {
                document.querySelectorAll('.filtro-status-meta').forEach(b => b.classList.remove('active'));
                filtroBtn.classList.add('active');
                this.state.filtroMetaStatus = filtroBtn.dataset.status;
                this.state.paginaMetaAtual = 0;
                this.renderizarSeletorDeLivros();
            }
        });
        
        // Input de busca dinâmica (delegate ou direto se possível, mas como é recriado, melhor renderizar com evento inline ou re-bind)
        // Para simplificar, usaremos evento no container principal verificando ID
        this.metaDetalheContainerEl.addEventListener('input', (e) => {
            if (e.target.id === 'input-busca-livros-meta') {
                this.state.buscaMetaTermo = e.target.value.toLowerCase();
                this.state.paginaMetaAtual = 0;
                this.renderizarSeletorDeLivros();
            }
        });

        this.selectMetaTipoEl.addEventListener('change', (e) => {
            this.campoObjetivoContainerEl.style.display = e.target.value === 'lista' ? 'none' : 'block';
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
        App.mostrarNotificacao(`Quest "${nome}" aceita!`);
    },

    confirmarDelecaoMeta: async function() {
        if (!this.state.metaAtivaId) return;
        const metaAtiva = this.getMetaAtiva();
        if (confirm(`Abandonar a quest "${metaAtiva.nome}"?`)) {
            this.state.metas = this.state.metas.filter(meta => meta.id !== this.state.metaAtivaId);
            this.state.metaAtivaId = null;
            await App.salvarMetas(this.state.metas);
            this.render();
            App.mostrarNotificacao('Quest abandonada.');
        }
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
        this.render(); 
    },

    getMetaAtiva: function() {
        if (!this.state.metaAtivaId) return null;
        return this.state.metas.find(m => m.id === this.state.metaAtivaId);
    },

    calcularProgressoMeta: function(meta) {
        let progresso = 0, objetivo = meta.objetivo;
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
        
        const porcentagem = objetivo > 0 ? Math.min(100, (progresso / objetivo) * 100) : 0;
        const concluida = (progresso >= objetivo && objetivo > 0);
        
        return { progresso, objetivo, porcentagem, concluida };
    },

    calcularRankMeta: function(meta) {
        let score = 0;
        if (meta.tipo === 'paginas') score = meta.objetivo / 500;
        else score = meta.objetivo;

        if (score >= 50) return { label: 'Rank S', class: 'meta-rank-S', color: '#f59e0b', xp: 5000, loot: 'Lendário' };
        if (score >= 20) return { label: 'Rank A', class: 'meta-rank-A', color: '#a855f7', xp: 2500, loot: 'Épico' };
        if (score >= 10) return { label: 'Rank B', class: 'meta-rank-B', color: '#3b82f6', xp: 1000, loot: 'Raro' };
        if (score >= 4)  return { label: 'Rank C', class: 'meta-rank-C', color: '#10b981', xp: 500, loot: 'Incomum' };
        return { label: 'Rank D', class: 'meta-rank-D', color: '#94a3b8', xp: 200, loot: 'Comum' };
    },

    gerarFlavorText: function(rank, tipo) {
        const textos = {
            'Rank S': "Uma jornada lendária digna dos deuses antigos. Apenas os escolhidos sobrevivem.",
            'Rank A': "Um contrato de elite para aventureiros veteranos. A glória aguarda.",
            'Rank B': "Um desafio respeitável. Requer dedicação e disciplina constante.",
            'Rank C': "Uma missão padrão da guilda. Ótima para manter a forma.",
            'Rank D': "Uma tarefa introdutória. Perfeita para aquecer os motores."
        };
        return textos[rank.label] || "Sua jornada literária começa aqui.";
    },

    reivindicarRecompensa: async function(metaId) {
        const meta = this.state.metas.find(m => m.id === metaId);
        if (!meta || meta.recompensada) return;

        const rank = this.calcularRankMeta(meta);
        if(!confirm(`Completar Quest e receber ${rank.loot} Loot?`)) return;

        meta.recompensada = true;
        await App.salvarMetas(this.state.metas);

        const itemReward = {
            id: 'quest_reward_' + Date.now(),
            nome: `Baú de Guilda (${rank.label})`,
            tipo: rank.loot,
            icone: 'fa-box-open',
            desc: `Recompensa da Quest: ${meta.nome}`,
            dropRate: 0
        };

        // Adiciona XP
        Gamification.adicionarXP(rank.xp);

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
            this.listaMetasAtivasEl.innerHTML = '<div class="placeholder-container" style="padding:1rem"><small>Nenhuma quest ativa.</small></div>';
            this.listaMetasConcluidasEl.innerHTML = '';
            return;
        }

        metasOrdenadas.forEach(meta => {
            const stats = this.calcularProgressoMeta(meta);
            const rank = this.calcularRankMeta(meta);
            const activeClass = meta.id === this.state.metaAtivaId ? 'active' : '';
            
            let btnClaim = '';
            if (stats.concluida && !meta.recompensada) {
                btnClaim = `<button class="btn btn-claim-reward" data-id="${meta.id}"><i class="fa-solid fa-gift"></i> RESGATAR</button>`;
            } else if (meta.recompensada) {
                btnClaim = `<div style="text-align:center; font-size:0.6rem; color:${rank.color}; margin-top:8px; text-transform:uppercase; font-weight:bold;"><i class="fa-solid fa-check-double"></i> Quest Completa</div>`;
            }

            const html = `
                <div class="meta-card ${activeClass} ${rank.class}" data-metaid="${meta.id}" style="border-left-color: ${rank.color}">
                    <div class="meta-header">
                        <h4>${meta.nome}</h4>
                        <span class="meta-tag-rank" style="background:${rank.color}20; color:${rank.color}; border:1px solid ${rank.color}">${rank.label}</span>
                    </div>
                    <div class="meta-card-info">
                        <span><i class="fa-solid fa-scroll"></i> ${meta.tipo === 'lista' ? 'Lista' : 'Desafio'}</span>
                        <span>${Math.floor(stats.porcentagem)}%</span>
                    </div>
                    <div class="quest-bar-bg">
                        <div class="quest-bar-fill" style="width: ${stats.porcentagem}%; background: ${rank.color}; box-shadow: 0 0 10px ${rank.color}"></div>
                    </div>
                    ${btnClaim}
                </div>
            `;

            if (stats.concluida) concluidasHTML += html;
            else ativasHTML += html;
        });

        this.listaMetasAtivasEl.innerHTML = ativasHTML || '<div class="placeholder-container" style="padding:1rem"><small>Sem quests ativas.</small></div>';
        this.listaMetasConcluidasEl.innerHTML = concluidasHTML;
    },

    renderDetalhesDaMeta: function(meta) {
        const stats = this.calcularProgressoMeta(meta);
        const rank = this.calcularRankMeta(meta);
        const flavorText = this.gerarFlavorText(rank, meta.tipo);
        
        // Renderiza a estrutura completa do detalhe (reconstruindo o HTML para limpar eventos antigos e atualizar visual)
        this.desafioAtivoContainerEl.innerHTML = `
            <div class="quest-briefing-container">
                <div class="quest-info">
                    <span class="quest-rank-badge" style="background: ${rank.color}20; color: ${rank.color}; border: 1px solid ${rank.color}">${rank.label} Quest</span>
                    <h2>${meta.nome}</h2>
                    <p class="quest-desc">"${flavorText}"</p>
                    
                    <div class="rpg-progress-wrapper">
                        <div class="rpg-progress-track">
                            <div class="rpg-progress-fill" style="width: ${stats.porcentagem}%; background: linear-gradient(90deg, ${rank.color}40, ${rank.color}); box-shadow: 0 0 15px ${rank.color};"></div>
                        </div>
                        <div class="rpg-progress-text">${stats.progresso} / ${stats.objetivo} OBJETIVOS</div>
                    </div>
                </div>
                
                <div class="quest-rewards-card">
                    <h4>Recompensas Previstas</h4>
                    <div class="rewards-grid">
                        <div class="reward-item">
                            <i class="fa-solid fa-star"></i>
                            <span>+${rank.xp} XP</span>
                        </div>
                        <div class="reward-item">
                            <i class="fa-solid fa-box-open"></i>
                            <span style="color: ${rank.color}">${rank.loot}</span>
                        </div>
                    </div>
                </div>
            </div>

            <nav class="quest-tabs">
                <button class="tab-button active" data-tab="tab-meta-progresso"><i class="fa-solid fa-crosshairs"></i> Alvos da Missão</button>
                ${meta.tipo === 'lista' ? '<button class="tab-button" data-tab="tab-meta-gerenciar"><i class="fa-solid fa-pen-to-square"></i> Editar Lista</button>' : ''}
                <button class="btn btn-perigo" id="btn-deletar-meta-ativa" style="margin-left: auto; padding: 5px 15px; font-size: 0.8rem;"><i class="fa-solid fa-trash"></i> Abandonar</button>
            </nav>

            <div id="tab-meta-progresso" class="meta-tab-content active" style="padding: 2rem;">
                <div id="desafio-livros-da-meta" class="estante-de-livros list-view" style="grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));"></div>
            </div>

            <div id="tab-meta-gerenciar" class="meta-tab-content" style="padding: 2rem;">
                 <div class="desafio-meta">
                    <label style="display:block; margin-bottom:10px; color:var(--cor-texto-secundario);">Adicionar/Remover alvos da missão:</label>
                    <div class="controles-estante" style="margin-bottom: 1rem;">
                        <div class="campo-com-icone">
                            <i class="fa-solid fa-search"></i>
                            <input type="search" id="input-busca-livros-meta" placeholder="Filtrar acervo...">
                        </div>
                         <div class="grupo-filtros">
                            <button class="filtro-status-meta active" data-status="Todos">Todos</button>
                            <button class="filtro-status-meta" data-status="NaoLidos">Não Lidos</button>
                        </div>
                    </div>
                    <div id="seletor-livros-meta" class="estante-de-livros selecionavel" style="grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px;"></div>
                    <div class="controles-paginacao" id="paginacao-seletor-meta">
                        <button id="btn-meta-anterior" class="btn btn-secundario"><i class="fa-solid fa-arrow-left"></i></button>
                        <span id="info-pagina-meta"></span>
                        <button id="btn-meta-proxima" class="btn btn-primario"><i class="fa-solid fa-arrow-right"></i></button>
                    </div>
                </div>
            </div>
        `;
        
        // Renderização condicional baseada no tipo
        if (meta.tipo === 'lista') {
            this.renderizarSeletorDeLivros();
            const idsMeta = new Set(meta.livrosDaMeta || []);
            const livrosDaLista = this.state.livros.filter(livro => idsMeta.has(livro.id));
            this.renderListaDeLivrosDaMeta(livrosDaLista, meta.ano);
        } else {
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
        if (!metaAtiva || metaAtiva.tipo !== 'lista') return;

        const container = document.getElementById('seletor-livros-meta');
        if(!container) return;

        const todosLivrosFiltrados = this.filtrarLivrosParaSeletor();
        const inicio = this.state.paginaMetaAtual * this.state.livrosPorPaginaMeta;
        const fim = inicio + this.state.livrosPorPaginaMeta;
        const livrosParaExibir = todosLivrosFiltrados.slice(inicio, fim);
        const idsNaMeta = new Set(metaAtiva.livrosDaMeta);

        container.innerHTML = livrosParaExibir.map(livro => {
            const capaSrc = livro.urlCapa || 'placeholder.jpg';
            const selecionadoClass = idsNaMeta.has(livro.id) ? 'selected' : '';
            
            return `
                <div class="card-livro-seletor ${selecionadoClass}" data-id="${livro.id}">
                    <div class="seletor-capa-wrapper">
                        <img src="${capaSrc}" alt="${livro.nomeDoLivro}" onerror="this.src='placeholder.jpg';">
                        ${idsNaMeta.has(livro.id) ? '<div class="seletor-overlay"><i class="fa-solid fa-check"></i></div>' : ''}
                    </div>
                </div>`;
        }).join('');
        
        const infoPagina = document.getElementById('info-pagina-meta');
        const btnAnt = document.getElementById('btn-meta-anterior');
        const btnProx = document.getElementById('btn-meta-proxima');
        
        const totalPaginas = Math.ceil(todosLivrosFiltrados.length / this.state.livrosPorPaginaMeta);
        if(infoPagina) infoPagina.textContent = `Pág ${this.state.paginaMetaAtual + 1}/${totalPaginas || 1}`;
        if(btnAnt) btnAnt.disabled = this.state.paginaMetaAtual === 0;
        if(btnProx) btnProx.disabled = this.state.paginaMetaAtual + 1 >= totalPaginas;
    },

    renderListaDeLivrosDaMeta: function(livros, anoMeta) {
        const container = document.getElementById('desafio-livros-da-meta');
        if(!container) return;

        if (!livros || livros.length === 0) {
            container.innerHTML = '<div class="placeholder-container"><i class="fa-solid fa-scroll"></i><p>Nenhum alvo designado para esta missão.</p></div>';
            return;
        }

        container.innerHTML = livros.map(livro => {
            const capaSrc = livro.urlCapa || 'placeholder.jpg';
            const leituraFinalizada = (livro.leituras || []).find(l => l.dataFim && new Date(l.dataFim).getFullYear() === anoMeta);
            const isLido = !!leituraFinalizada;
            const eliminatedClass = isLido ? 'eliminated' : '';
            const statusIcon = isLido ? '<i class="fa-solid fa-check-circle"></i> Neutralizado' : '<i class="fa-solid fa-crosshairs"></i> Alvo Ativo';

            return `
               <div class="target-card ${eliminatedClass}">
                   <img src="${capaSrc}" class="target-thumb" onerror="this.src='placeholder.jpg';">
                   <div class="target-info">
                       <h4>${livro.nomeDoLivro}</h4>
                       <p>${livro.autor}</p>
                       <small style="color: ${isLido ? '#10b981' : '#94a3b8'}">${statusIcon}</small>
                   </div>
               </div>`;
        }).join('');
    }
};