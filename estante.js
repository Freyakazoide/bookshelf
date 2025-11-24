const Estante = {
    state: {
        todosOsLivros: [],
        livrosFiltrados: [],
        livroAtivo: null,
        leituraAtivaId: null,
        metas: [],
        top10Ids: new Set(),
        isInitialized: false,
        filtros: {
            busca: '',
            status: 'Todos',
            ordenacao: 'data-adicao-desc',
            pagina: 0,
            porPagina: 30,
            visualizacao: 'grid',
            avancados: {
                nota: null,
                categorias: [],
                autores: [],
            }
        },
        criteriosDeNota: [
            'personagens', 'plot', 'desenvolvimento', 'pacing', 'prosa',
            'originalidade', 'temas', 'impacto', 'closing', 'releitura'
        ],
        allCategorias: [],
        allAutores: []
    },

    // --- CORREÇÃO CRÍTICA DE ID ---
    getId: function(livro) { 
        return livro.firestoreId || String(livro.id); 
    },

    cacheDOM: function() {
        this.estanteEl = document.getElementById('estante-de-livros');
        this.inputBuscaEl = document.getElementById('input-busca');
        this.filtrosStatusEl = document.querySelectorAll('.filtro-status');
        this.selectOrdenacaoEl = document.getElementById('select-ordenacao');
        this.contadorResultadosEl = document.getElementById('contador-resultados');
        this.selectTamanhoPaginaEl = document.getElementById('select-tamanho-pagina');
        this.linksPaginacaoEl = document.getElementById('links-paginacao');
        this.estantePlaceholderEl = document.getElementById('estante-placeholder');
        this.controlesPaginacaoEl = document.getElementById('controles-paginacao');

        // Painel Lateral
        this.painelLivroEl = document.getElementById('painel-livro');
        this.painelTituloEl = document.getElementById('painel-titulo');
        this.btnFecharPainelEl = document.getElementById('btn-fechar-painel');
        this.painelCapaEl = document.getElementById('painel-capa');
        this.btnEditarEl = document.getElementById('painel-btn-editar');
        this.btnExcluirEl = document.getElementById('painel-btn-excluir');
        this.painelBtnSalvarEl = document.getElementById('painel-btn-salvar');
        this.painelTabs = this.painelLivroEl.querySelectorAll('.painel-tabs .tab-button');
        this.painelTabContents = this.painelLivroEl.querySelectorAll('.tab-content');

        // Seção de Leituras e Notas
        this.leiturasContainerEl = document.getElementById('leituras-container');
        this.formLeituraContainerEl = document.getElementById('form-leitura-container');
        this.btnNovaLeituraEl = document.getElementById('painel-btn-nova-leitura');
        this.formNotasEl = document.getElementById('form-notas');
        this.avisoNotaBloqueadaEl = document.getElementById('aviso-nota-bloqueada');
        this.notaFinalCalculadaEl = document.getElementById('nota-final-calculada');
        this.infoDetalhesEl = document.getElementById('info-detalhes');

        // Visualização e Filtros
        this.btnsVisualizacao = document.querySelectorAll('.btn-visualizacao');
        this.btnFiltrosAvancados = document.getElementById('btn-filtros-avancados');
        this.btnFecharGaveta = document.getElementById('btn-fechar-gaveta');
        this.gavetaOverlayEl = document.getElementById('gaveta-overlay');
        this.gavetaFiltrosEl = document.getElementById('gaveta-filtros');
        this.btnLimparFiltros = document.getElementById('btn-limpar-filtros');
        this.btnAplicarFiltros = document.getElementById('btn-aplicar-filtros');
        this.filtroGrupoNotaEl = document.getElementById('filtro-grupo-nota');
        this.filtroBuscaCategoriaEl = document.getElementById('filtro-busca-categoria');
        this.filtroListaCategoriasEl = document.getElementById('filtro-lista-categorias');
        this.filtroBuscaAutorEl = document.getElementById('filtro-busca-autor');
        this.filtroListaAutoresEl = document.getElementById('filtro-lista-autores');

        // Novos Elementos (Gestor, Citações, Smart Filters)
        this.btnGestorLeitura = document.getElementById('btn-gestor-leitura');
        this.modalGestor = document.getElementById('modal-gestor-leituras');
        this.btnFecharGestor = document.getElementById('btn-fechar-gestor');
        
        this.btnAleatorio = document.getElementById('btn-aleatorio');
        this.btnTsundoku = document.getElementById('btn-tsundoku');
        this.btnCurtos = document.getElementById('btn-curtos');

        this.btnNovaCitacao = document.getElementById('btn-nova-citacao');
        this.formCitacaoEl = document.getElementById('form-citacao');
        this.listaCitacoesEl = document.getElementById('lista-citacoes');
        this.btnSalvarCitacao = document.getElementById('btn-salvar-citacao');
        this.btnCancelarCitacao = document.getElementById('btn-cancelar-citacao');
    },

    bindEvents: function() {
        // Buscas e Filtros Básicos
        this.inputBuscaEl.addEventListener('input', e => {
            this.state.filtros.busca = e.target.value.toLowerCase();
            this.state.filtros.pagina = 0;
            this.renderEstante();
        });

        this.filtrosStatusEl.forEach(btn => {
            btn.addEventListener('click', e => {
                this.filtrosStatusEl.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.state.filtros.status = e.target.dataset.status;
                this.state.filtros.pagina = 0;
                this.renderEstante();
            });
        });

        this.selectOrdenacaoEl.addEventListener('change', e => {
            this.state.filtros.ordenacao = e.target.value;
            this.renderEstante();
        });

        this.selectTamanhoPaginaEl.addEventListener('change', e => {
            this.state.filtros.porPagina = parseInt(e.target.value, 10);
            this.state.filtros.pagina = 0;
            this.renderEstante();
        });

        this.linksPaginacaoEl.addEventListener('click', e => {
            if (e.target.tagName === 'BUTTON' && e.target.dataset.pagina) {
                this.state.filtros.pagina = parseInt(e.target.dataset.pagina, 10);
                this.renderEstante();
            }
        });

        // Painel Principal
        this.btnFecharPainelEl.addEventListener('click', () => this.painelLivroEl.close());
        this.painelLivroEl.addEventListener('close', () => this.limparPainel());

        this.painelTabs.forEach(tab => {
            tab.addEventListener('click', e => {
                const tabId = e.target.dataset.tab;
                this.painelTabs.forEach(t => t.classList.remove('active'));
                this.painelTabContents.forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
                document.getElementById(tabId).classList.add('active');
            });
        });

        // Gestão de Leituras no Painel
        this.btnNovaLeituraEl.addEventListener('click', () => this.renderFormLeitura());

        this.formLeituraContainerEl.addEventListener('click', e => {
            if (e.target.id === 'btn-salvar-leitura') this.salvarLeitura();
            if (e.target.id === 'btn-cancelar-leitura') {
                this.formLeituraContainerEl.innerHTML = '';
                this.formLeituraContainerEl.classList.add('hidden');
            }
            if (e.target.classList.contains('btn-deletar-leitura')) {
                const id = parseInt(e.target.dataset.idleitura, 10);
                if (confirm('Excluir este registro de leitura?')) {
                    this.deletarLeitura(id);
                }
            }
        });

        this.leiturasContainerEl.addEventListener('click', e => {
            const itemLeitura = e.target.closest('.item-leitura');
            if (itemLeitura) {
                const idLeitura = parseInt(itemLeitura.dataset.idleitura, 10);
                this.state.leituraAtivaId = idLeitura;
                const leituraParaEditar = this.state.livroAtivo.leituras.find(l => l.idLeitura === idLeitura);
                if (leituraParaEditar) this.renderFormLeitura(leituraParaEditar);
                this.renderPainelLeituras();
            }
        });

        // Botões de Ação do Painel
        this.painelBtnSalvarEl.addEventListener('click', () => this.salvarNotas());
        
        this.btnEditarEl.addEventListener('click', () => {
            this.painelLivroEl.close();
            App.navegarPara('view-adicionar');
            Adicionar.modoEdicao(this.state.livroAtivo.id || this.state.livroAtivo.firestoreId);
        });
        
        this.btnExcluirEl.addEventListener('click', () => {
            if (confirm(`Excluir "${this.state.livroAtivo.nomeDoLivro}"?`)) {
                this.painelLivroEl.close();
                App.excluirLivro(this.state.livroAtivo.firestoreId);
            }
        });

        // Visualização Grid/Lista
        this.btnsVisualizacao.forEach(btn => {
            btn.addEventListener('click', e => this.toggleVisualizacao(e));
        });

        // Filtros Avançados
        this.btnFiltrosAvancados.addEventListener('click', () => this.abrirGavetaFiltros());
        this.btnFecharGaveta.addEventListener('click', () => this.fecharGavetaFiltros());
        this.gavetaOverlayEl.addEventListener('click', () => this.fecharGavetaFiltros());
        this.btnAplicarFiltros.addEventListener('click', () => this.aplicarFiltrosAvancados());
        this.btnLimparFiltros.addEventListener('click', () => this.limparFiltrosAvancados());

        // Citações
        if(this.btnNovaCitacao) this.btnNovaCitacao.addEventListener('click', () => {
            this.formCitacaoEl.classList.remove('hidden');
            document.getElementById('input-citacao-texto').focus();
        });
        if(this.btnCancelarCitacao) this.btnCancelarCitacao.addEventListener('click', () => {
            this.formCitacaoEl.classList.add('hidden');
            document.getElementById('input-citacao-texto').value = '';
        });
        if(this.btnSalvarCitacao) this.btnSalvarCitacao.addEventListener('click', () => this.salvarCitacao());
        
        this.listaCitacoesEl.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-delete-quote');
            if(btn) this.deletarCitacao(btn.dataset.idx);
        });

        // Smart Filters
        if (this.btnAleatorio) this.btnAleatorio.addEventListener('click', () => this.escolherLivroAleatorio());
        if (this.btnTsundoku) this.btnTsundoku.addEventListener('click', () => this.filtrarTsundoku());
        if (this.btnCurtos) this.btnCurtos.addEventListener('click', () => this.filtrarRapidinhas());
        
        // MODAL GESTOR DE LEITURAS (Event Delegation Seguro)
        if (this.btnGestorLeitura) this.btnGestorLeitura.addEventListener('click', () => this.abrirGestorLeituras());
        if (this.btnFecharGestor) this.btnFecharGestor.addEventListener('click', () => this.modalGestor.close());
        
        const listaGestor = document.getElementById('lista-gestor-leituras');
        if (listaGestor) {
            // Remove listeners antigos clonando o nodo
            const novoListaGestor = listaGestor.cloneNode(false);
            listaGestor.parentNode.replaceChild(novoListaGestor, listaGestor);
            
            novoListaGestor.addEventListener('click', (e) => {
                const btn = e.target.closest('button');
                if (!btn) return;
                
                const id = btn.dataset.id;
                const acao = btn.dataset.acao;
                
                if (acao === 'terminar') this.gestorTerminar(id);
                if (acao === 'erro') this.gestorCorrigirErro(id);
            });
        }

        this.bindGavetaEvents();
    },

    bindGavetaEvents: function() {
        this.filtroGrupoNotaEl.addEventListener('click', e => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const nota = btn.dataset.nota;
            const isActive = btn.classList.contains('active');
            this.filtroGrupoNotaEl.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            if (isActive) {
                this.state.filtros.avancados.nota = null;
            } else {
                btn.classList.add('active');
                this.state.filtros.avancados.nota = nota;
            }
        });
        
        const bindFilterList = (inputEl, listEl, stateKey) => {
            listEl.addEventListener('click', e => {
                const item = e.target.closest('.filtro-ano-item');
                if (item) {
                    const checkbox = item.querySelector('input[type="checkbox"]');
                    const value = checkbox.value;
                    const idx = this.state.filtros.avancados[stateKey].indexOf(value);
                    if (idx > -1) {
                        this.state.filtros.avancados[stateKey].splice(idx, 1);
                        checkbox.checked = false;
                    } else {
                        this.state.filtros.avancados[stateKey].push(value);
                        checkbox.checked = true;
                    }
                }
            });
            inputEl.addEventListener('input', e => {
                const busca = e.target.value.toLowerCase();
                listEl.querySelectorAll('.filtro-ano-item').forEach(item => {
                    const label = item.querySelector('label').textContent.toLowerCase();
                    item.style.display = label.includes(busca) ? 'flex' : 'none';
                });
            });
        };
        bindFilterList(this.filtroBuscaCategoriaEl, this.filtroListaCategoriasEl, 'categorias');
        bindFilterList(this.filtroBuscaAutorEl, this.filtroListaAutoresEl, 'autores');
    },

    bindEstanteEvents: function() {
        const estante = document.getElementById('estante-de-livros');
        if(!estante) return;
        
        const novaEstante = estante.cloneNode(false);
        estante.parentNode.replaceChild(novaEstante, estante);
        this.estanteEl = novaEstante;

        this.estanteEl.addEventListener('click', e => {
            const card = e.target.closest('.card-livro');
            const acaoBtn = e.target.closest('.card-acao-btn');

            if (acaoBtn) {
                e.stopPropagation();
                const livroId = acaoBtn.closest('.card-livro').dataset.id;
                this.abrirMenuAcoes(e, livroId);
                return;
            }
            if (card) {
                this.abrirPainel(card.dataset.id);
            }
        });
    },

    init: function(livros, metas) {
        this.state.todosOsLivros = livros;
        this.state.metas = metas || [];
        
        if (!this.state.isInitialized) {
            this.cacheDOM();
            this.bindEvents();
            this.bindEstanteEvents(); 
            this.state.isInitialized = true;
        }
        
        this.popularOpcoesFiltros();
        this.renderEstante();
    },

    atualizar: function(livros, metas) {
        this.state.todosOsLivros = livros;
        this.state.metas = metas || [];
        this.popularOpcoesFiltros();
        this.renderEstante();
    },

    getNotaRecente: function(livro) {
        if (!livro.leituras || livro.leituras.length === 0) return null;
        const leiturasComNota = livro.leituras.filter(l => l.dataFim && l.notaFinal).sort((a,b) => new Date(b.dataFim) - new Date(a.dataFim));
        return leiturasComNota.length > 0 ? leiturasComNota[0].notaFinal : null;
    },

    filtrarEOrdenarLivros: function() {
        const comNota = [...this.state.todosOsLivros].map(l => ({ id: this.getId(l), nota: this.getNotaRecente(l) })).filter(l => l.nota);
        comNota.sort((a, b) => b.nota - a.nota);
        this.state.top10Ids = new Set(comNota.slice(0, 10).map(l => l.id));

        let livros = [...this.state.todosOsLivros];
        const { busca, status, avancados } = this.state.filtros;

        if (busca) {
            livros = livros.filter(l => l.nomeDoLivro.toLowerCase().includes(busca) || (l.autor && l.autor.toLowerCase().includes(busca)));
        }

        if (status !== 'Todos') {
           livros = livros.filter(l => (l.situacao || null) === status);
        }

        if (avancados.nota) {
            livros = livros.filter(l => {
                const nota = this.getNotaRecente(l);
                if (avancados.nota === 'sem') return !nota;
                if (!nota) return false;
                return nota >= parseInt(avancados.nota, 10);
            });
        }

        if (avancados.categorias.length > 0) {
            livros = livros.filter(l => {
                if (!l.categorias) return false;
                const catsLivro = l.categorias.split(',').map(c => c.trim());
                return avancados.categorias.some(catFiltro => catsLivro.includes(catFiltro));
            });
        }
        
        if (avancados.autores.length > 0) {
            livros = livros.filter(l => l.autor && avancados.autores.includes(l.autor));
        }

        this.state.livrosFiltrados = livros;
        this.ordenarLivros();
    },

    ordenarLivros: function() {
        const { ordenacao } = this.state.filtros;
        this.state.livrosFiltrados.sort((a, b) => {
            switch (ordenacao) {
                case 'titulo-asc': return a.nomeDoLivro.localeCompare(b.nomeDoLivro);
                case 'autor-asc': return (a.autor || '').localeCompare(b.autor || '');
                case 'nota-desc': 
                    const notaA = this.getNotaRecente(a) || 0; const notaB = this.getNotaRecente(b) || 0;
                    return notaB - notaA;
                case 'data-aquisicao-asc': 
                    const dataAqA = a.dataAquisicao ? new Date(a.dataAquisicao).getTime() : 9999999999999;
                    const dataAqB = b.dataAquisicao ? new Date(b.dataAquisicao).getTime() : 9999999999999;
                    return dataAqA - dataAqB;
                case 'data-adicao-desc':
                default:
                    // Use a helper string to compare IDs properly
                    return (b.firestoreId || b.id) > (a.firestoreId || a.id) ? 1 : -1;
            }
        });
    },

    getRarityClass: function(nota) {
        if (!nota) return 'rarity-common';
        if (nota < 5.0) return 'rarity-uncommon';
        if (nota < 7.5) return 'rarity-rare';
        if (nota < 9.0) return 'rarity-epic';
        return 'rarity-legendary';
    },

 // --- RENDERIZAÇÃO DA ESTANTE (VERSÃO BLINDADA) ---
    renderEstante: function() {
        // 1. Segurança: Se não tem livros, para tudo.
        if (!this.state.todosOsLivros) return;

        this.filtrarEOrdenarLivros();
        
        // 2. Segurança: Verifica se a estante existe no HTML
        if (this.estanteEl) {
            if (this.state.filtros.visualizacao === 'list') this.estanteEl.classList.add('modo-lista');
            else this.estanteEl.classList.remove('modo-lista');
        }

        const { pagina, porPagina } = this.state.filtros;
        const inicio = pagina * porPagina;
        const fim = inicio + porPagina;
        const livrosDaPagina = this.state.livrosFiltrados.slice(inicio, fim);

        // 3. Segurança: Pega os elementos com cuidado
        const placeholder = document.getElementById('estante-placeholder');
        const paginacao = document.getElementById('controles-paginacao');
        const contador = document.getElementById('contador-resultados');

        if (livrosDaPagina.length === 0) {
            if(this.estanteEl) this.estanteEl.innerHTML = '';
            if(placeholder) placeholder.classList.remove('hidden');
            if(paginacao) paginacao.classList.add('hidden');
        } else {
            if(placeholder) placeholder.classList.add('hidden');
            if(paginacao) paginacao.classList.remove('hidden');

            if(this.estanteEl) {
                this.estanteEl.innerHTML = livrosDaPagina.map(livro => {
                    const id = this.getId(livro);
                    const capa = livro.urlCapa || 'placeholder.jpg';
                    const status = livro.situacao || 'Quero Ler';
                    
                    // GERAÇÃO SEGURA DOS DADOS DE RPG
                    // Tenta pegar do livro, se não tiver, gera na hora usando o Gamification novo
                    const mobData = livro.rpg || (typeof Gamification !== 'undefined' ? Gamification.gerarDadosMob(livro) : { level: 1, modifiers: [], typeIcon: 'fa-paw', typeLabel: 'Criatura' });
                    const mobColor = (typeof Gamification !== 'undefined') ? Gamification.getDifficultyColor(mobData.level) : '#94a3b8';
                    
                    const modifiersHTML = (mobData.modifiers || []).map(mod => 
                        `<span class="mob-modifier ${mod.id}"><i class="fa-solid ${mod.icon}"></i> ${mod.label}</span>`
                    ).join('');

                    let statusPillHTML = '';
                    if (status === 'Lendo') statusPillHTML = '<span class="status-pill lendo"><i class="fa-solid fa-glasses"></i> Lendo</span>';
                    else if (status === 'Lido') statusPillHTML = '<span class="status-pill lido"><i class="fa-solid fa-check"></i> Lido</span>';
                    else if (status === 'Quero Ler') statusPillHTML = '<span class="status-pill quero-ler"><i class="fa-solid fa-bookmark"></i> Quero Ler</span>';
                    else if (status === 'Abandonado') statusPillHTML = '<span class="status-pill abandonado"><i class="fa-solid fa-ban"></i> Abandonado</span>';

                    let xpBarHTML = '';
                    if (status === 'Lendo') {
                        const leituraAtual = (livro.leituras || []).find(l => !l.dataFim);
                        let pct = 5;
                        if (leituraAtual) {
                            const dias = Math.floor((new Date() - new Date(leituraAtual.dataInicio)) / (1000 * 60 * 60 * 24));
                            pct = Math.min(100, Math.max(10, dias * 5));
                        }
                        xpBarHTML = `<div class="rpg-xp-bar-container"><div class="rpg-xp-bar-fill" style="width: ${pct}%; background: linear-gradient(90deg, ${mobColor}, #fff);"></div></div>`;
                    }

                    const now = Date.now();
                    const hasOracleBuff = livro.oracle && livro.oracle.active && livro.oracle.expires > now;
                    const buffClass = hasOracleBuff ? 'buff-oracle' : '';

                    const isInMeta = this.state.metas.some(m => m.livrosDaMeta && m.livrosDaMeta.includes(id));
                    const isTop10 = this.state.top10Ids.has(id);
                    
                    let rarityClass = '';
                    if (isTop10) rarityClass = 'rarity-legendary';
                    else if (isInMeta) rarityClass = 'rarity-epic';
                    else if (status === 'Lendo') rarityClass = 'rarity-active';

                    const notaNum = this.getNotaRecente(livro);
                    const rarityClassNota = this.getRarityClass(notaNum);                
                    const notaHTML = notaNum ? `<div class="rpg-badge-nota ${rarityClassNota}">LVL ${notaNum.toFixed(1)}</div>` : '';

                    return `
                        <div class="card-livro ${rarityClass} ${buffClass}" style="border-color: ${mobColor}" data-id="${id}" data-status="${status}">
                            <div class="mob-header-badge" style="background: ${mobColor}">
                                Lv.${mobData.level} <i class="fa-solid ${mobData.typeIcon}"></i>
                            </div>
                            <div class="card-capa-container">
                                <img src="${capa}" alt="${livro.nomeDoLivro}" loading="lazy" onerror="this.src='placeholder.jpg';">
                                <div class="mob-modifiers-container">${modifiersHTML}</div>
                                ${xpBarHTML}
                            </div>
                            ${notaHTML}
                            <div class="card-info">
                                <h3>${livro.nomeDoLivro}</h3>
                                <p class="autor">${livro.autor || 'Desconhecido'}</p>
                                <div class="status-pill-container">${statusPillHTML}</div>
                            </div>
                            <button class="card-acao-btn" aria-label="Opções"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                        </div>
                    `;
                }).join('');
            }
        }
        if(contador) contador.textContent = `${this.state.livrosFiltrados.length} monstros.`;
        this.renderPaginacao();
    },

    renderPaginacao: function() {
        const totalLivros = this.state.livrosFiltrados.length;
        const { pagina, porPagina } = this.state.filtros;
        const totalPaginas = Math.ceil(totalLivros / porPagina);
        this.linksPaginacaoEl.innerHTML = '';
        if (totalPaginas <= 1) return;
        for (let i = 0; i < totalPaginas; i++) {
            const btn = document.createElement('button');
            btn.textContent = i + 1;
            btn.dataset.pagina = i;
            if (i === pagina) btn.classList.add('active');
            this.linksPaginacaoEl.appendChild(btn);
        }
    },

    // --- GESTOR DE LEITURAS (Com Loot) ---

    abrirGestorLeituras: function() {
        const leiturasAtivas = this.state.todosOsLivros.filter(l => l.situacao === 'Lendo');
        const container = document.getElementById('lista-gestor-leituras');
        const placeholder = document.getElementById('gestor-placeholder');

        if (leiturasAtivas.length === 0) {
            container.innerHTML = '';
            placeholder.classList.remove('hidden');
        } else {
            placeholder.classList.add('hidden');
            container.innerHTML = leiturasAtivas.map(l => {
                const idSafe = this.getId(l);
                const sessao = (l.leituras || []).find(s => !s.dataFim);
                const dataInicio = sessao ? new Date(sessao.dataInicio).toLocaleDateString('pt-BR') : '-';
                const dias = sessao ? Math.floor((new Date() - new Date(sessao.dataInicio)) / (1000 * 60 * 60 * 24)) : 0;

                return `
                <div class="item-gestor" style="border:1px solid #334155; padding:10px; margin-bottom:10px; border-radius:8px; display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.2);">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="${l.urlCapa || 'placeholder.jpg'}" style="width:40px; height:60px; object-fit:cover; border-radius:4px;">
                        <div>
                            <h4 style="color:#fff; margin:0;">${l.nomeDoLivro}</h4>
                            <p style="color:#94a3b8; margin:0; font-size:0.8rem;">${l.autor}</p>
                            <span style="font-size:0.7rem; color:#64748b;">Iniciado: ${dataInicio} (${dias} dias)</span>
                        </div>
                    </div>
                    <div style="display:flex; gap:5px;">
                        <button class="btn btn-primario" data-acao="terminar" data-id="${idSafe}">
                            <i class="fa-solid fa-check"></i> Terminar
                        </button>
                        <button class="btn btn-secundario" data-acao="erro" data-id="${idSafe}" style="border-color:#ef4444; color:#ef4444;">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>`;
            }).join('');
        }
        this.modalGestor.showModal();
    },

    gestorTerminar: async function(id) {
        const livro = this.state.todosOsLivros.find(l => this.getId(l) === id);
        if (!livro) return App.mostrarNotificacao("Erro ao localizar livro.", "erro");

        const sessao = (livro.leituras || []).find(s => !s.dataFim);
        if (sessao) { 
            sessao.dataFim = new Date().toISOString().split('T')[0]; 
        } else { 
            if (!livro.leituras) livro.leituras = [];
            livro.leituras.push({ idLeitura: Date.now(), dataInicio: new Date().toISOString().split('T')[0], dataFim: new Date().toISOString().split('T')[0], anotacoes: 'Finalizado via Gestor' });
        }
        
        livro.situacao = 'Lido';
        
        // --- LOOT SYSTEM ---
        const loot = Gamification.gerarLoot(livro);
        await App.salvarLivro(livro, livro.firestoreId);
        
        this.modalGestor.close();
        App.mostrarNotificacao(`Quest "${livro.nomeDoLivro}" Completa!`);
        Gamification.atualizarInterface(this.state.todosOsLivros);
    },

    gestorCorrigirErro: async function(id) {
        const livro = this.state.todosOsLivros.find(l => this.getId(l) === id);
        if (!livro) return;
        
        if (confirm(`Remover "${livro.nomeDoLivro}" de lendo?`)) {
            if (livro.leituras) livro.leituras = livro.leituras.filter(s => s.dataFim); 
            const jaFoiLido = livro.leituras && livro.leituras.length > 0;
            livro.situacao = jaFoiLido ? 'Lido' : 'Quero Ler';
            await App.salvarLivro(livro, livro.firestoreId);
            App.mostrarNotificacao('Status corrigido.');
            this.abrirGestorLeituras();
        }
    },

    // --- Smart Filters ---
    escolherLivroAleatorio: function() {
        const candidatos = this.state.todosOsLivros.filter(l => l.situacao !== 'Lido' && l.situacao !== 'Lendo' && l.situacao !== 'Abandonado');
        if (candidatos.length === 0) return App.mostrarNotificacao('Nenhum livro disponível.', 'erro');
        const escolhido = candidatos[Math.floor(Math.random() * candidatos.length)];
        this.abrirPainel(this.getId(escolhido));
        App.mostrarNotificacao('🎲 O destino escolheu este!');
    },
    filtrarTsundoku: function() {
        this.state.filtros.status = 'Todos';
        this.state.livrosFiltrados = this.state.todosOsLivros.filter(l => l.situacao !== 'Lido' && l.situacao !== 'Lendo').filter(l => l.dataAquisicao);
        this.state.filtros.ordenacao = 'data-aquisicao-asc';
        this.selectOrdenacaoEl.value = 'data-aquisicao-asc';
        this.state.livrosFiltrados.sort((a,b) => new Date(a.dataAquisicao) - new Date(b.dataAquisicao));
        this.renderEstanteSemRecalcular();
    },
    filtrarRapidinhas: function() {
        this.state.livrosFiltrados = this.state.todosOsLivros.filter(l => l.situacao !== 'Lido').filter(l => l.paginas && parseInt(l.paginas, 10) < 250);
        this.state.filtros.ordenacao = 'paginas-asc';
        this.state.livrosFiltrados.sort((a,b) => (parseInt(a.paginas)||0) - (parseInt(b.paginas)||0));
        this.renderEstanteSemRecalcular();
    },
    renderEstanteSemRecalcular: function() {
        this.estanteEl.innerHTML = this.state.livrosFiltrados.map(livro => {
             const id = this.getId(livro);
             const mobInfo = Gamification.getClassificacaoMob(parseInt(livro.paginas)||0);
             return `<div class="card-livro ${mobInfo.classe}" data-id="${id}" onclick="Estante.abrirPainel('${id}')"><div class="card-capa-container"><img src="${livro.urlCapa || 'placeholder.jpg'}" onerror="this.src='placeholder.jpg';"></div><div class="card-info"><h3>${livro.nomeDoLivro}</h3></div></div>`;
        }).join('');
        this.contadorResultadosEl.textContent = `${this.state.livrosFiltrados.length} livros filtrados.`;
        this.linksPaginacaoEl.innerHTML = '';
    },

    // --- Painel Principal ---
    abrirPainel: function(livroId) {
        this.state.livroAtivo = this.state.todosOsLivros.find(l => this.getId(l) == livroId);
        if (!this.state.livroAtivo) return;
        const leituras = (this.state.livroAtivo.leituras || []).sort((a,b) => new Date(b.dataInicio) - new Date(a.dataInicio));
        this.state.leituraAtivaId = leituras.length > 0 ? leituras[0].idLeitura : null;
        this.renderPainel();
        this.painelLivroEl.showModal();
    },
    limparPainel: function() {
        this.state.livroAtivo = null; this.state.leituraAtivaId = null;
        this.formLeituraContainerEl.innerHTML = ''; this.formLeituraContainerEl.classList.add('hidden'); this.formNotasEl.classList.add('hidden');
    },
    renderPainel: function() {
        if (!this.state.livroAtivo) return;
        this.painelTituloEl.textContent = this.state.livroAtivo.nomeDoLivro;
        this.painelCapaEl.src = this.state.livroAtivo.urlCapa || 'placeholder.jpg';
        this.renderPainelDetalhes();
        this.renderPainelLeituras();
        this.renderPainelCitacoes();
    },
    renderPainelDetalhes: function() {
        const l = this.state.livroAtivo;
        const campos = ['autor', 'editora', 'anoLancamento', 'paginas', 'lingua', 'colecao', 'volume', 'categorias', 'descricao'];
        const ids = ['autor', 'editora', 'ano', 'paginas', 'lingua', 'colecao', 'volume', 'categorias', 'descricao'];
        ids.forEach((id, i) => { document.getElementById(`detalhe-${id}`).textContent = l[campos[i]] || '-'; });
    },
    renderPainelLeituras: function() {
        if (!this.state.livroAtivo) return;
        const leituras = this.state.livroAtivo.leituras || [];
        if (leituras.length === 0) { this.leiturasContainerEl.innerHTML = '<p>Sem histórico.</p>'; } 
        else {
            this.leiturasContainerEl.innerHTML = [...leituras].sort((a,b) => new Date(b.dataInicio) - new Date(a.dataInicio)).map(l => {
                const inicio = new Date(l.dataInicio).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
                const fim = l.dataFim ? new Date(l.dataFim).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'Lendo';
                const activeClass = l.idLeitura === this.state.leituraAtivaId ? 'active' : '';
                return `<div class="item-leitura ${activeClass}" data-idleitura="${l.idLeitura}"><span>${inicio} - ${fim}</span></div>`;
            }).join('');
        }
        this.renderPainelNotas();
    },
    renderFormLeitura: function(leitura = null) {
        const id = leitura ? `value="${leitura.idLeitura}"` : '';
        const inicio = leitura ? leitura.dataInicio : new Date().toISOString().split('T')[0];
        const fim = leitura ? leitura.dataFim : '';
        const anotacoes = leitura ? leitura.anotacoes : '';
        const btn = leitura ? 'Salvar' : 'Criar';
        const delBtn = leitura ? `<button type="button" class="btn btn-perigo btn-deletar-leitura" data-idleitura="${leitura.idLeitura}">Excluir</button>` : '';
        this.formLeituraContainerEl.innerHTML = `
            <form id="form-leitura" class="painel-form">
                <input type="hidden" id="form-leitura-id" ${id}>
                <div class="form-grid-leitura"><div class="form-campo"><label>Início:</label><input type="date" id="form-data-inicio" value="${inicio}"></div><div class="form-campo"><label>Fim:</label><input type="date" id="form-data-fim" value="${fim}"></div><div class="form-campo full-width"><label>Notas:</label><textarea id="form-anotacoes">${anotacoes}</textarea></div></div>
                <div class="form-botoes">${delBtn}<button type="button" id="btn-cancelar-leitura" class="btn btn-secundario">Cancelar</button><button type="button" id="btn-salvar-leitura" class="btn btn-primario">${btn}</button></div>
            </form>`;
        this.formLeituraContainerEl.classList.remove('hidden');
    },
    atualizarPainelAposSalvar: async function(livroId) {
        await App.salvarLivro(this.state.livroAtivo, livroId);
        this.state.livroAtivo = this.state.todosOsLivros.find(l => this.getId(l) === livroId);
        this.renderPainelLeituras();
    },
    salvarLeitura: async function() {
        const idInput = document.getElementById('form-leitura-id');
        const id = idInput ? parseInt(idInput.value, 10) : null;
        const inicio = document.getElementById('form-data-inicio').value;
        const fim = document.getElementById('form-data-fim').value;
        const anotacoes = document.getElementById('form-anotacoes').value;
        
        if (!this.state.livroAtivo.leituras) this.state.livroAtivo.leituras = [];
        let leitura = this.state.livroAtivo.leituras.find(l => l.idLeitura === id);
        if (leitura) { leitura.dataInicio = inicio; leitura.dataFim = fim || null; leitura.anotacoes = anotacoes; }
        else { leitura = { idLeitura: Date.now(), dataInicio: inicio, dataFim: fim || null, anotacoes, notas: {} }; this.state.livroAtivo.leituras.push(leitura); }
        
        this.state.livroAtivo.situacao = fim ? 'Lido' : 'Lendo';
        this.formLeituraContainerEl.classList.add('hidden');
        await this.atualizarPainelAposSalvar(this.state.livroAtivo.firestoreId);
        App.mostrarNotificacao('Salvo!');
    },
    deletarLeitura: async function(id) {
        this.state.livroAtivo.leituras = this.state.livroAtivo.leituras.filter(l => l.idLeitura !== id);
        this.formLeituraContainerEl.classList.add('hidden');
        await this.atualizarPainelAposSalvar(this.state.livroAtivo.firestoreId);
        App.mostrarNotificacao('Excluído.');
    },
    renderPainelNotas: function() {
        if (!this.state.livroAtivo) return;
        const leitura = (this.state.livroAtivo.leituras || []).find(l => l.idLeitura === this.state.leituraAtivaId);
        if (!leitura || !leitura.dataFim) { this.formNotasEl.classList.add('hidden'); this.avisoNotaBloqueadaEl.classList.remove('hidden'); return; }
        this.avisoNotaBloqueadaEl.classList.add('hidden'); this.formNotasEl.classList.remove('hidden');
        const notas = leitura.notas || {};
        this.state.criteriosDeNota.forEach(c => {
            const s = document.getElementById(`nota-${c}`); const v = document.getElementById(`valor-nota-${c}`);
            if (s && v) { s.value = notas[c] || 5.0; v.textContent = parseFloat(s.value).toFixed(1); }
        });
        this.setupSliderEvents(); this.calcularNotaFinal();
    },
    setupSliderEvents: function() {
        this.state.criteriosDeNota.forEach(c => {
            const s = document.getElementById(`nota-${c}`);
            if (s && !s.dataset.listenerAttached) {
                s.dataset.listenerAttached = 'true';
                s.addEventListener('input', () => { document.getElementById(`valor-nota-${c}`).textContent = parseFloat(s.value).toFixed(1); this.calcularNotaFinal(); });
            }
        });
    },
    calcularNotaFinal: function() {
        let soma = 0, count = 0;
        this.state.criteriosDeNota.forEach(c => { const s = document.getElementById(`nota-${c}`); if (s) { soma += parseFloat(s.value); count++; } });
        this.notaFinalCalculadaEl.textContent = count > 0 ? (soma/count).toFixed(1) : '0.0';
    },
    salvarNotas: async function() {
        const leitura = (this.state.livroAtivo.leituras || []).find(l => l.idLeitura === this.state.leituraAtivaId);
        if (!leitura) return;
        if (!leitura.notas) leitura.notas = {};
        this.state.criteriosDeNota.forEach(c => { const s = document.getElementById(`nota-${c}`); if (s) leitura.notas[c] = parseFloat(s.value); });
        leitura.notaFinal = parseFloat(this.notaFinalCalculadaEl.textContent);
        await this.atualizarPainelAposSalvar(this.state.livroAtivo.firestoreId);
        App.mostrarNotificacao('Notas salvas!');
    },
    toggleVisualizacao: function(e) {
        const btn = e.target.closest('.btn-visualizacao'); if (!btn) return;
        this.state.filtros.visualizacao = btn.dataset.view;
        this.btnsVisualizacao.forEach(b => b.classList.remove('active')); btn.classList.add('active');
        this.renderEstante();
    },
    abrirGavetaFiltros: function() { this.gavetaOverlayEl.classList.add('is-open'); this.gavetaFiltrosEl.classList.add('is-open'); },
    fecharGavetaFiltros: function() { this.gavetaOverlayEl.classList.remove('is-open'); this.gavetaFiltrosEl.classList.remove('is-open'); },
    popularOpcoesFiltros: function() {
        const cats = new Set(), auts = new Set();
        this.state.todosOsLivros.forEach(l => {
            if(l.categorias) l.categorias.split(',').forEach(c => cats.add(c.trim()));
            if(l.autor) auts.add(l.autor.trim());
        });
        this.state.allCategorias = [...cats].sort(); this.state.allAutores = [...auts].sort();
        const html = (items, k) => items.map(i => `<div class="filtro-ano-item"><input type="checkbox" id="f-${k}-${i}" value="${i}"><label for="f-${k}-${i}">${i}</label></div>`).join('');
        this.filtroListaCategoriasEl.innerHTML = html(this.state.allCategorias, 'categorias');
        this.filtroListaAutoresEl.innerHTML = html(this.state.allAutores, 'autores');
    },
    aplicarFiltrosAvancados: function() { this.state.filtros.pagina = 0; this.renderEstante(); this.fecharGavetaFiltros(); },
    limparFiltrosAvancados: function() { this.state.filtros.avancados = { nota: null, categorias: [], autores: [] }; this.popularOpcoesFiltros(); this.renderEstante(); this.fecharGavetaFiltros(); },
    abrirMenuAcoes: function(e, livroId) {
        this.fecharMenuAcoes();
        const livro = this.state.todosOsLivros.find(l => this.getId(l) == livroId); if (!livro) return;
        const menu = document.createElement('div'); menu.className = 'card-acao-menu';
        menu.innerHTML = `<button data-id="${livroId}" data-acao="editar">Editar</button><button data-id="${livroId}" data-acao="excluir" class="perigo">Excluir</button>`;
        document.body.appendChild(menu);
        const rect = e.target.getBoundingClientRect();
        menu.style.top = `${rect.bottom + 5}px`; menu.style.left = `${rect.left - 50}px`;
        menu.addEventListener('click', ev => {
            const btn = ev.target.closest('button');
            if (btn) {
                if (btn.dataset.acao === 'editar') this.btnEditarEl.click();
                if (btn.dataset.acao === 'excluir') this.btnExcluirEl.click();
            }
            this.fecharMenuAcoes();
        });
        setTimeout(() => document.addEventListener('click', this.fecharMenuAcoes, { once: true }), 0);
    },
    fecharMenuAcoes: function() { const m = document.querySelector('.card-acao-menu'); if (m) m.remove(); },
    
    // Citações
    renderPainelCitacoes: function() {
        const cits = this.state.livroAtivo.citacoes || [];
        this.listaCitacoesEl.innerHTML = cits.length ? cits.map((c, i) => `<div class="card-citacao"><blockquote>"${c.texto}"</blockquote><div class="citacao-footer"><span>${c.pagina}</span><button class="btn-delete-quote" data-idx="${i}">X</button></div></div>`).join('') : '<p>Sem citações.</p>';
    },
    salvarCitacao: async function() {
        const t = document.getElementById('input-citacao-texto').value;
        const p = document.getElementById('input-citacao-pag').value;
        if (!t) return;
        if (!this.state.livroAtivo.citacoes) this.state.livroAtivo.citacoes = [];
        this.state.livroAtivo.citacoes.push({ texto: t, pagina: p, data: new Date().toISOString() });
        await this.atualizarPainelAposSalvar(this.state.livroAtivo.firestoreId);
        this.formCitacaoEl.classList.add('hidden');
        document.getElementById('input-citacao-texto').value = '';
        App.mostrarNotificacao('Citação salva!');
    },
    deletarCitacao: async function(idx) {
        if (confirm('Apagar?')) {
            this.state.livroAtivo.citacoes.splice(idx, 1);
            await this.atualizarPainelAposSalvar(this.state.livroAtivo.firestoreId);
            App.mostrarNotificacao('Apagado.');
        }
    }
};