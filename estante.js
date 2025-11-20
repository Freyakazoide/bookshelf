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

        // Painel Lateral (Modal do Livro)
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

        // Filtros e Visualização
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

        // NOVOS ELEMENTOS (Gestor e Filtros Inteligentes)
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

    bindEstanteEvents: function() {
        this.estanteEl = document.getElementById('estante-de-livros');
        if (!this.estanteEl) return;

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

    bindEvents: function() {
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

        this.btnNovaLeituraEl.addEventListener('click', () => this.renderFormLeitura());

        this.formLeituraContainerEl.addEventListener('click', e => {
            if (e.target.id === 'btn-salvar-leitura') this.salvarLeitura();
            if (e.target.id === 'btn-cancelar-leitura') {
                this.formLeituraContainerEl.innerHTML = '';
                this.formLeituraContainerEl.classList.add('hidden');
            }
            if (e.target.classList.contains('btn-deletar-leitura')) {
                const id = parseInt(e.target.dataset.idleitura, 10);
                if (confirm('Tem certeza que deseja excluir este registro de leitura?')) {
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

        this.painelBtnSalvarEl.addEventListener('click', () => this.salvarNotas());
        
        this.btnEditarEl.addEventListener('click', () => {
            this.painelLivroEl.close();
            App.navegarPara('view-adicionar');
            Adicionar.modoEdicao(this.state.livroAtivo.id || this.state.livroAtivo.firestoreId);
        });
        
        this.btnExcluirEl.addEventListener('click', () => {
            if (confirm(`Tem certeza que deseja excluir "${this.state.livroAtivo.nomeDoLivro}"? Esta ação não pode ser desfeita.`)) {
                this.painelLivroEl.close();
                App.excluirLivro(this.state.livroAtivo.firestoreId);
            }
        });

        this.btnsVisualizacao.forEach(btn => {
            btn.addEventListener('click', e => this.toggleVisualizacao(e));
        });

        // Filtros Avançados
        this.btnFiltrosAvancados.addEventListener('click', () => this.abrirGavetaFiltros());
        this.btnFecharGaveta.addEventListener('click', () => this.fecharGavetaFiltros());
        this.gavetaOverlayEl.addEventListener('click', () => this.fecharGavetaFiltros());
        this.btnAplicarFiltros.addEventListener('click', () => this.aplicarFiltrosAvancados());
        this.btnLimparFiltros.addEventListener('click', () => this.limparFiltrosAvancados());
        
        // NOVOS EVENTOS: Gestor e Filtros Inteligentes
        if (this.btnGestorLeitura) this.btnGestorLeitura.addEventListener('click', () => this.abrirGestorLeituras());
        if (this.btnFecharGestor) this.btnFecharGestor.addEventListener('click', () => this.modalGestor.close());

        if(this.btnNovaCitacao) this.btnNovaCitacao.addEventListener('click', () => {
            this.formCitacaoEl.classList.remove('hidden');
            document.getElementById('input-citacao-texto').focus();
        });

        if(this.btnCancelarCitacao) this.btnCancelarCitacao.addEventListener('click', () => {
            this.formCitacaoEl.classList.add('hidden');
            document.getElementById('input-citacao-texto').value = '';
            document.getElementById('input-citacao-pag').value = '';
        });

        if(this.btnSalvarCitacao) this.btnSalvarCitacao.addEventListener('click', () => this.salvarCitacao());

        // Delegação para deletar citação
        this.listaCitacoesEl.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-delete-quote');
            if(btn) {
                const idx = btn.dataset.idx;
                this.deletarCitacao(idx);
            }
        });

        // Delegation para o Modal do Gestor
        const listaGestor = document.getElementById('lista-gestor-leituras');
        if (listaGestor) {
            listaGestor.addEventListener('click', (e) => {
                const btn = e.target.closest('button');
                if (!btn) return;
                const id = btn.dataset.id;
                const acao = btn.dataset.acao;
                if (acao === 'terminar') this.gestorTerminar(id);
                if (acao === 'erro') this.gestorCorrigirErro(id);
            });
        }

        if (this.btnAleatorio) this.btnAleatorio.addEventListener('click', () => this.escolherLivroAleatorio());
        if (this.btnTsundoku) this.btnTsundoku.addEventListener('click', () => this.filtrarTsundoku());
        if (this.btnCurtos) this.btnCurtos.addEventListener('click', () => this.filtrarRapidinhas());

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

    getId: function(livro) { return livro.id || livro.firestoreId; },

    getNotaRecente: function(livro) {
        if (!livro.leituras || livro.leituras.length === 0) return null;
        const leiturasComNota = livro.leituras.filter(l => l.dataFim && l.notaFinal).sort((a,b) => new Date(b.dataFim) - new Date(a.dataFim));
        return leiturasComNota.length > 0 ? leiturasComNota[0].notaFinal : null;
    },

    filtrarEOrdenarLivros: function() {
        // Recalcula Top 10
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
                    const idA = this.getId(a); const idB = this.getId(b);
                    return (typeof idB === 'string' ? 0 : idB) - (typeof idA === 'string' ? 0 : idA);
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

    // --- FUNÇÃO ATUALIZADA COM LÓGICA DE RPG (WAVE 2) ---
    renderEstante: function() {
        this.filtrarEOrdenarLivros();
        
        if (this.state.filtros.visualizacao === 'list') this.estanteEl.classList.add('modo-lista');
        else this.estanteEl.classList.remove('modo-lista');

        const { pagina, porPagina } = this.state.filtros;
        const inicio = pagina * porPagina;
        const fim = inicio + porPagina;
        const livrosDaPagina = this.state.livrosFiltrados.slice(inicio, fim);

        if (livrosDaPagina.length === 0) {
            this.estanteEl.innerHTML = '';
            this.estantePlaceholderEl.classList.remove('hidden');
            this.controlesPaginacaoEl.classList.add('hidden');
        } else {
            this.estantePlaceholderEl.classList.add('hidden');
            this.controlesPaginacaoEl.classList.remove('hidden');

            this.estanteEl.innerHTML = livrosDaPagina.map(livro => {
                const id = this.getId(livro);
                const capa = livro.urlCapa || 'placeholder.jpg';
                const status = livro.situacao || 'Quero Ler';
                const notaNum = this.getNotaRecente(livro);
                
                // 1. Lógica de Mobs/Bosses
                const paginas = parseInt(livro.paginas, 10) || 0;
                // Usa o objeto Gamification definido no app.js
                const mobInfo = Gamification.getClassificacaoMob(paginas);

                // 2. Determinar "Classes" do Card
                const isInMeta = this.state.metas.some(m => m.livrosDaMeta && m.livrosDaMeta.includes(id));
                const isTop10 = this.state.top10Ids.has(id);
                
                let rarityClass = '';
                if (isTop10) rarityClass = 'rarity-legendary';
                else if (isInMeta) rarityClass = 'rarity-epic';
                else if (status === 'Lendo') rarityClass = 'rarity-active';

                // 3. Badges (Ícones Laterais)
                let badgesHTML = '';
                
                // Badge do Mob (Dificuldade)
                badgesHTML += `
                    <div class="rpg-badge" style="background:${mobInfo.cor}; border-color:#fff;" title="${mobInfo.label} (${paginas} págs)">
                        <i class="fa-solid ${mobInfo.icone}"></i>
                    </div>
                `;

                if (isTop10) badgesHTML += `<div class="rpg-badge top10" title="Item Lendário"><i class="fa-solid fa-crown"></i></div>`;
                if (isInMeta) badgesHTML += `<div class="rpg-badge meta" title="Quest Ativa"><i class="fa-solid fa-scroll"></i></div>`;

                // 4. Badge de Nota (Level)
                const rarityClassNota = this.getRarityClass(notaNum);                
                const notaHTML = notaNum 
                    ? `<div class="rpg-badge-nota ${rarityClassNota}">LVL ${notaNum.toFixed(1)}</div>` 
                    : '';

                // 5. Status Pill
                let statusClass = status.toLowerCase().replace(' ', '-');
                let iconStatus = '';
                if(status === 'Lido') iconStatus = '<i class="fa-solid fa-check"></i>';
                if(status === 'Lendo') iconStatus = '<i class="fa-solid fa-gamepad"></i>';
                if(status === 'Abandonado') iconStatus = '<i class="fa-solid fa-skull"></i>';
                
                let bossLabelHTML = '';
                if (mobInfo.tipo === 'worldboss' || mobInfo.tipo === 'boss') {
                     bossLabelHTML = `<span class="status-pill" style="background:${mobInfo.cor}; color:#000; margin-left: 4px; border: 1px solid #fff;">${mobInfo.label}</span>`;
                }
                
                const statusPillHTML = `
                    <span class="status-pill ${statusClass}">
                        ${iconStatus} ${status}
                    </span>
                    ${bossLabelHTML}
                `;

                // 6. Barra de XP (Progresso na Capa)
                let xpBarHTML = '';
                if (status === 'Lendo') {
                    const leituraAtual = (livro.leituras || []).find(l => !l.dataFim);
                    let pct = 5;
                    if (leituraAtual) {
                        const dias = Math.floor((new Date() - new Date(leituraAtual.dataInicio)) / (1000 * 60 * 60 * 24));
                        pct = Math.min(100, Math.max(10, dias * 5));
                    }
                    
                    const isBoss = mobInfo.tipo === 'boss' || mobInfo.tipo === 'worldboss';
                    const barColor = isBoss ? `background: linear-gradient(90deg, ${mobInfo.cor}, #000);` : '';
                    
                    xpBarHTML = `
                        <div class="rpg-xp-bar-container">
                            <div class="rpg-xp-bar-fill" style="width: ${pct}%; ${barColor}"></div>
                        </div>
                    `;
                }

                // HTML Final
                return `
                    <div class="card-livro ${rarityClass} ${mobInfo.classe}" data-id="${id}" data-status="${status}">
                        <div class="rpg-badges-container">${badgesHTML}</div>
                        ${notaHTML}
                        <div class="card-capa-container">
                            <img src="${capa}" alt="${livro.nomeDoLivro}" loading="lazy" onerror="this.src='placeholder.jpg';">
                            ${xpBarHTML}
                        </div>
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

        this.contadorResultadosEl.textContent = `${this.state.livrosFiltrados.length} livros no inventário.`;
        this.renderPaginacao();
        window.scrollTo(0, 0);
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

    // --- FUNÇÕES DO GESTOR DE LEITURAS ---

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
                const sessao = (l.leituras || []).find(s => !s.dataFim);
                const dataInicio = sessao ? new Date(sessao.dataInicio).toLocaleDateString('pt-BR') : 'Data desconhecida';
                const dias = sessao ? Math.floor((new Date() - new Date(sessao.dataInicio)) / (1000 * 60 * 60 * 24)) : 0;

                return `
                <div class="item-gestor">
                    <img src="${l.urlCapa || 'placeholder.jpg'}">
                    <div class="info-gestor">
                        <h4>${l.nomeDoLivro}</h4>
                        <p>${l.autor}</p>
                        <span class="data-inicio"><i class="fa-solid fa-calendar"></i> Iniciado em ${dataInicio} (${dias} dias atrás)</span>
                    </div>
                    <div class="acoes-gestor">
                        <button class="btn btn-primario" data-acao="terminar" data-id="${this.getId(l)}">
                            <i class="fa-solid fa-check"></i> Terminei Hoje
                        </button>
                        <button class="btn btn-secundario" style="border-color: var(--cor-perigo); color: var(--cor-perigo);" data-acao="erro" data-id="${this.getId(l)}">
                            <i class="fa-solid fa-trash-alt"></i> Não estou lendo
                        </button>
                    </div>
                </div>`;
            }).join('');
        }
        this.modalGestor.showModal();
    },

gestorTerminar: async function(id) {
        const livro = this.state.todosOsLivros.find(l => this.getId(l) == id);
        if (!livro) return;
        
        const sessao = (livro.leituras || []).find(s => !s.dataFim);
        if (sessao) { sessao.dataFim = new Date().toISOString().split('T')[0]; } 
        else { 
            if (!livro.leituras) livro.leituras = [];
            livro.leituras.push({ idLeitura: Date.now(), dataInicio: new Date().toISOString().split('T')[0], dataFim: new Date().toISOString().split('T')[0], anotacoes: 'Finalizado via Gestor' });
        }
        
        livro.situacao = 'Lido';
        
        // --- GAMIFICATION: Gera ou Recupera Loot e Salva no Livro ---
        // A função gerarLoot agora modifica o objeto 'livro' adicionando 'livro.loot'
        const lootDropado = Gamification.gerarLoot(livro); 
        
        // Salva tudo (Status Lido + Loot) no Firebase
        await App.salvarLivro(livro, livro.firestoreId);
        
        this.modalGestor.close();
        
        // Atualiza a barra de XP
        Gamification.atualizarInterface(this.state.todosOsLivros);
        App.mostrarNotificacao(`Livro finalizado! Loot: ${lootDropado.nome}`);
    },

    gestorCorrigirErro: async function(id) {
        const livro = this.state.todosOsLivros.find(l => this.getId(l) == id);
        if (!livro) return;
        if (confirm(`Remover "${livro.nomeDoLivro}" de lendo? Isso volta para "Quero Ler".`)) {
            if (livro.leituras) livro.leituras = livro.leituras.filter(s => s.dataFim); 
            const jaFoiLido = livro.leituras && livro.leituras.length > 0;
            livro.situacao = jaFoiLido ? 'Lido' : 'Quero Ler';
            await App.salvarLivro(livro, livro.firestoreId);
            App.mostrarNotificacao(`Status de "${livro.nomeDoLivro}" corrigido.`);
            this.abrirGestorLeituras();
        }
    },

    // --- FILTROS INTELIGENTES ---

    escolherLivroAleatorio: function() {
        const candidatos = this.state.todosOsLivros.filter(l => l.situacao !== 'Lido' && l.situacao !== 'Lendo' && l.situacao !== 'Abandonado');
        if (candidatos.length === 0) return App.mostrarNotificacao('Nenhum livro "Quero Ler" disponível.', 'erro');
        
        const escolhido = candidatos[Math.floor(Math.random() * candidatos.length)];
        this.abrirPainel(this.getId(escolhido));
        App.mostrarNotificacao('🎲 O destino escolheu este livro!');
    },

    filtrarTsundoku: function() {
        this.filtrosStatusEl.forEach(b => b.classList.remove('active'));
        this.state.filtros.status = 'Todos';
        this.state.filtros.busca = '';
        this.inputBuscaEl.value = '';
        
        this.state.livrosFiltrados = this.state.todosOsLivros
            .filter(l => l.situacao !== 'Lido' && l.situacao !== 'Lendo')
            .filter(l => l.dataAquisicao);
        
        this.state.filtros.ordenacao = 'data-aquisicao-asc';
        this.selectOrdenacaoEl.value = 'data-aquisicao-asc';
        this.state.livrosFiltrados.sort((a,b) => new Date(a.dataAquisicao) - new Date(b.dataAquisicao));

        this.estanteEl.classList.remove('modo-lista');
        this.renderEstanteSemRecalcular();
        App.mostrarNotificacao('📚 Exibindo seus livros "encalhados" mais antigos.');
    },

    filtrarRapidinhas: function() {
        this.state.livrosFiltrados = this.state.todosOsLivros
            .filter(l => l.situacao !== 'Lido')
            .filter(l => l.paginas && parseInt(l.paginas, 10) < 250);
        
        this.state.filtros.ordenacao = 'paginas-asc';
        this.state.livrosFiltrados.sort((a,b) => (parseInt(a.paginas)||0) - (parseInt(b.paginas)||0));
        
        this.renderEstanteSemRecalcular();
        App.mostrarNotificacao('⚡ Exibindo livros com menos de 250 páginas.');
    },

    renderEstanteSemRecalcular: function() {
        this.estanteEl.innerHTML = this.state.livrosFiltrados.map(livro => {
             const id = this.getId(livro);
             const capa = livro.urlCapa || 'placeholder.jpg';
             const status = livro.situacao || null;
             // Lógica simplificada para filtros rápidos
             return `
                <div class="card-livro" data-id="${id}" data-status="${status}" style="border-color: var(--loot-common);">
                    <div class="card-capa-container">
                        <img src="${capa}" alt="Capa" onerror="this.src='placeholder.jpg';">
                    </div>
                    <div class="card-info">
                        <div><h3>${livro.nomeDoLivro}</h3><p>${livro.autor}</p></div>
                        <div class="status-pill-container"><span class="status-pill">${status||'Quero Ler'}</span></div>
                    </div>
                </div>`;
        }).join('');
        this.contadorResultadosEl.textContent = `${this.state.livrosFiltrados.length} livros filtrados.`;
        this.linksPaginacaoEl.innerHTML = '';
    },
    
    // --- Funcionalidades Padrão de Painel ---

    abrirPainel: function(livroId) {
        this.state.livroAtivo = this.state.todosOsLivros.find(l => this.getId(l) == livroId);
        if (!this.state.livroAtivo) return;
        const leiturasOrdenadas = (this.state.livroAtivo.leituras || []).sort((a,b) => new Date(b.dataFim || b.dataInicio) - new Date(a.dataFim || a.dataInicio));
        this.state.leituraAtivaId = leiturasOrdenadas.length > 0 ? leiturasOrdenadas[0].idLeitura : null;
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
        document.getElementById('detalhe-autor').textContent = l.autor || '-';
        document.getElementById('detalhe-editora').textContent = l.editora || '-';
        document.getElementById('detalhe-ano').textContent = l.anoLancamento || '-';
        document.getElementById('detalhe-paginas').textContent = l.paginas || '-';
        document.getElementById('detalhe-lingua').textContent = l.lingua || '-';
        document.getElementById('detalhe-colecao').textContent = l.colecao || '-';
        document.getElementById('detalhe-volume').textContent = l.volume || '-';
        document.getElementById('detalhe-categorias').textContent = l.categorias || '-';
        document.getElementById('detalhe-descricao').textContent = l.descricao || 'Nenhuma sinopse cadastrada.';
    },
    renderPainelLeituras: function() {
        if (!this.state.livroAtivo) return;
        const leituras = this.state.livroAtivo.leituras || [];
        if (leituras.length === 0) { this.leiturasContainerEl.innerHTML = '<p>Nenhum histórico de leitura. Clique em "Iniciar Nova Leitura".</p>'; } 
        else {
            this.leiturasContainerEl.innerHTML = [...leituras].sort((a,b) => new Date(b.dataInicio) - new Date(a.dataInicio)).map(l => {
                const inicio = new Date(l.dataInicio).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
                const fim = l.dataFim ? new Date(l.dataFim).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'Lendo';
                const nota = l.notaFinal ? `★ ${l.notaFinal.toFixed(1)}` : '';
                const activeClass = l.idLeitura === this.state.leituraAtivaId ? 'active' : '';
                return `<div class="item-leitura ${activeClass}" data-idleitura="${l.idLeitura}"><span>${inicio} - ${fim}</span><strong>${nota}</strong></div>`;
            }).join('');
        }
        this.renderPainelNotas();
    },
    renderFormLeitura: function(leitura = null) {
        const id = leitura ? `value="${leitura.idLeitura}"` : '';
        const inicio = leitura ? leitura.dataInicio : new Date().toISOString().split('T')[0];
        const fim = leitura ? leitura.dataFim : '';
        const anotacoes = leitura ? leitura.anotacoes : '';
        const btnTexto = leitura ? 'Salvar Edição' : 'Registrar Leitura';
        const deleteBtn = leitura ? `<button type="button" class="btn btn-perigo btn-deletar-leitura" data-idleitura="${leitura.idLeitura}">Excluir</button>` : '';

        this.formLeituraContainerEl.innerHTML = `
            <form id="form-leitura" class="painel-form">
                <input type="hidden" id="form-leitura-id" ${id}>
                <div class="form-grid-leitura">
                    <div class="form-campo"><label>Data Início:</label><input type="date" id="form-data-inicio" value="${inicio}" required></div>
                    <div class="form-campo"><label>Data Fim:</label><input type="date" id="form-data-fim" value="${fim}"></div>
                    <div class="form-campo full-width"><label>Anotações:</label><textarea id="form-anotacoes" rows="4">${anotacoes}</textarea></div>
                </div>
                <div class="form-botoes">${deleteBtn}<button type="button" id="btn-cancelar-leitura" class="btn btn-secundario">Cancelar</button><button type="button" id="btn-salvar-leitura" class="btn btn-primario">${btnTexto}</button></div>
            </form>`;
        this.formLeituraContainerEl.classList.remove('hidden');
    },
    atualizarPainelAposSalvar: async function(livroId) {
        await App.salvarLivro(this.state.livroAtivo, livroId);
        this.state.livroAtivo = this.state.todosOsLivros.find(l => this.getId(l) === livroId);
        if (this.state.livroAtivo) {
            const leiturasOrdenadas = (this.state.livroAtivo.leituras || []).sort((a,b) => new Date(b.dataFim || b.dataInicio) - new Date(a.dataFim || a.dataInicio));
            this.state.leituraAtivaId = leiturasOrdenadas.length > 0 ? leiturasOrdenadas[0].idLeitura : null;
            this.renderPainelLeituras();
        } else { this.painelLivroEl.close(); }
    },
    salvarLeitura: async function() {
        const idLeituraInput = document.getElementById('form-leitura-id');
        const idLeitura = idLeituraInput ? parseInt(idLeituraInput.value, 10) : null;
        const dataInicio = document.getElementById('form-data-inicio').value;
        const dataFim = document.getElementById('form-data-fim').value;
        const anotacoes = document.getElementById('form-anotacoes').value;
        if (!this.state.livroAtivo.leituras) this.state.livroAtivo.leituras = [];
        let leitura = this.state.livroAtivo.leituras.find(l => l.idLeitura === idLeitura);
        if (leitura) { leitura.dataInicio = dataInicio; leitura.dataFim = dataFim || null; leitura.anotacoes = anotacoes; } 
        else { leitura = { idLeitura: Date.now(), dataInicio, dataFim: dataFim || null, anotacoes, notas: {} }; this.state.livroAtivo.leituras.push(leitura); }
        if (dataFim) this.state.livroAtivo.situacao = 'Lido'; else this.state.livroAtivo.situacao = 'Lendo';
        this.state.leituraAtivaId = leitura.idLeitura;
        this.formLeituraContainerEl.innerHTML = ''; this.formLeituraContainerEl.classList.add('hidden');
        await this.atualizarPainelAposSalvar(this.state.livroAtivo.firestoreId);
        App.mostrarNotificacao('Registro de leitura salvo!');
    },
    deletarLeitura: async function(idLeitura) {
        this.state.livroAtivo.leituras = this.state.livroAtivo.leituras.filter(l => l.idLeitura !== idLeitura);
        this.formLeituraContainerEl.innerHTML = ''; this.formLeituraContainerEl.classList.add('hidden');
        if (this.state.leituraAtivaId === idLeitura) this.state.leituraAtivaId = null;
        await this.atualizarPainelAposSalvar(this.state.livroAtivo.firestoreId);
        App.mostrarNotificacao('Registro de leitura excluído.');
    },
    renderPainelNotas: function() {
        if (!this.state.livroAtivo) return;
        const leitura = (this.state.livroAtivo.leituras || []).find(l => l.idLeitura === this.state.leituraAtivaId);
        if (!leitura || !leitura.dataFim) { this.formNotasEl.classList.add('hidden'); this.avisoNotaBloqueadaEl.classList.remove('hidden'); return; }
        this.avisoNotaBloqueadaEl.classList.add('hidden'); this.formNotasEl.classList.remove('hidden');
        const notas = leitura.notas || {};
        this.state.criteriosDeNota.forEach(criterio => {
            const slider = document.getElementById(`nota-${criterio}`); const valorSpan = document.getElementById(`valor-nota-${criterio}`);
            if (slider && valorSpan) { slider.value = notas[criterio] || 5.0; valorSpan.textContent = parseFloat(slider.value).toFixed(1); }
        });
        this.setupSliderEvents(); this.calcularNotaFinal();
    },
    setupSliderEvents: function() {
        this.state.criteriosDeNota.forEach(criterio => {
            const slider = document.getElementById(`nota-${criterio}`);
            if (slider && !slider.dataset.listenerAttached) {
                slider.dataset.listenerAttached = 'true';
                slider.addEventListener('input', () => {
                    document.getElementById(`valor-nota-${criterio}`).textContent = parseFloat(slider.value).toFixed(1);
                    this.calcularNotaFinal();
                });
            }
        });
    },
    calcularNotaFinal: function() {
        let soma = 0; let count = 0;
        this.state.criteriosDeNota.forEach(criterio => { const slider = document.getElementById(`nota-${criterio}`); if (slider) { soma += parseFloat(slider.value); count++; } });
        const media = count > 0 ? soma / count : 0;
        this.notaFinalCalculadaEl.textContent = media.toFixed(1);
    },
    salvarNotas: async function() {
        const leitura = (this.state.livroAtivo.leituras || []).find(l => l.idLeitura === this.state.leituraAtivaId);
        if (!leitura) return App.mostrarNotificacao('Nenhuma leitura selecionada.', 'erro');
        if (!leitura.notas) leitura.notas = {};
        this.state.criteriosDeNota.forEach(criterio => { const slider = document.getElementById(`nota-${criterio}`); if (slider) leitura.notas[criterio] = parseFloat(slider.value); });
        leitura.notaFinal = parseFloat(this.notaFinalCalculadaEl.textContent);
        await this.atualizarPainelAposSalvar(this.state.livroAtivo.firestoreId);
        App.mostrarNotificacao('Notas salvas com sucesso!');
    },
    toggleVisualizacao: function(e) {
        const btn = e.target.closest('.btn-visualizacao'); if (!btn) return;
        const view = btn.dataset.view; this.state.filtros.visualizacao = view;
        this.btnsVisualizacao.forEach(b => b.classList.remove('active')); btn.classList.add('active');
        if (view === 'list') this.estanteEl.classList.add('modo-lista'); else this.estanteEl.classList.remove('modo-lista');
    },
    abrirGavetaFiltros: function() { this.gavetaOverlayEl.classList.add('is-open'); this.gavetaFiltrosEl.classList.add('is-open'); },
    fecharGavetaFiltros: function() { this.gavetaOverlayEl.classList.remove('is-open'); this.gavetaFiltrosEl.classList.remove('is-open'); },
    popularOpcoesFiltros: function() {
        const allCats = new Set(); const allAutores = new Set();
        this.state.todosOsLivros.forEach(l => {
            if (l.categorias) l.categorias.split(',').forEach(cat => { const c = cat.trim(); if (c) allCats.add(c); });
            if (l.autor) allAutores.add(l.autor.trim());
        });
        this.state.allCategorias = [...allCats].sort(); this.state.allAutores = [...allAutores].sort();
        const renderList = (items, stateKey) => items.map(item => `<div class="filtro-ano-item"><input type="checkbox" id="filtro-${stateKey}-${item}" value="${item}" ${this.state.filtros.avancados[stateKey].includes(item) ? 'checked' : ''}><label for="filtro-${stateKey}-${item}">${item}</label></div>`).join('');
        this.filtroListaCategoriasEl.innerHTML = renderList(this.state.allCategorias, 'categorias');
        this.filtroListaAutoresEl.innerHTML = renderList(this.state.allAutores, 'autores');
    },
    aplicarFiltrosAvancados: function() { this.state.filtros.pagina = 0; this.renderEstante(); this.fecharGavetaFiltros(); },
    limparFiltrosAvancados: function() {
        this.state.filtros.avancados = { nota: null, categorias: [], autores: [] };
        this.filtroGrupoNotaEl.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        this.filtroListaCategoriasEl.querySelectorAll('input').forEach(chk => chk.checked = false);
        this.filtroListaAutoresEl.querySelectorAll('input').forEach(chk => chk.checked = false);
        this.state.filtros.pagina = 0; this.renderEstante(); this.fecharGavetaFiltros();
    },
    abrirMenuAcoes: function(e, livroId) {
        this.fecharMenuAcoes();
        const livro = this.state.todosOsLivros.find(l => this.getId(l) == livroId); if (!livro) return;
        const status = livro.situacao || 'Quero Ler';
        const menu = document.createElement('div'); menu.className = 'card-acao-menu';
        let botoesStatus = '';
        if (status !== 'Lido') botoesStatus += `<button data-id="${livroId}" data-status="Lido"><i class="fa-solid fa-check-circle"></i> Mover para Lidos</button>`;
        if (status !== 'Lendo') botoesStatus += `<button data-id="${livroId}" data-status="Lendo"><i class="fa-solid fa-book-open-reader"></i> Mover para Lendo</button>`;
        if (status === 'Lendo') botoesStatus += `<button data-id="${livroId}" data-status="Abandonado" class="perigo"><i class="fa-solid fa-pause"></i> Pausar Leitura</button>`;

        menu.innerHTML = `${botoesStatus}<div class="separador-menu"></div><button data-id="${livroId}" data-acao="editar"><i class="fa-solid fa-edit"></i> Editar Livro</button><button data-id="${livroId}" data-acao="excluir" class="perigo"><i class="fa-solid fa-trash-alt"></i> Excluir Livro</button>`;
        document.body.appendChild(menu);
        const rect = e.target.getBoundingClientRect(); const menuRect = menu.getBoundingClientRect();
        let top = rect.bottom + 8; let left = rect.right - menuRect.width;
        if (top + menuRect.height > window.innerHeight) top = rect.top - menuRect.height - 8;
        if (left < 0) left = rect.left;
        menu.style.top = `${top}px`; menu.style.left = `${left}px`;
        menu.addEventListener('click', e => {
            const btn = e.target.closest('button'); if (!btn) return;
            const id = btn.dataset.id; const novoStatus = btn.dataset.status; const acao = btn.dataset.acao;
            if (novoStatus) this.moverLivroStatus(livroId, novoStatus);
            if (acao === 'editar') this.editarLivro(livroId);
            if (acao === 'excluir') this.excluirLivro(livroId);
            this.fecharMenuAcoes();
        });
        setTimeout(() => { document.addEventListener('click', this.fecharMenuAcoes, { once: true }); }, 0);
    },
    fecharMenuAcoes: function() { const menu = document.querySelector('.card-acao-menu'); if (menu) menu.remove(); document.removeEventListener('click', this.fecharMenuAcoes); },
    moverLivroStatus: async function(livroId, novoStatus) {
        const livro = this.state.todosOsLivros.find(l => this.getId(l) == livroId); if (!livro) return;
        livro.situacao = novoStatus;
        if (novoStatus === 'Lendo' && (!livro.leituras || livro.leituras.length === 0)) {
            if (!livro.leituras) livro.leituras = [];
            livro.leituras.push({ idLeitura: Date.now(), dataInicio: new Date().toISOString().split('T')[0], dataFim: null, anotacoes: 'Iniciado via ação rápida.', notas: {} });
        }
        await App.salvarLivro(livro, livro.firestoreId); App.mostrarNotificacao(`Livro movido para "${novoStatus}"`);
    },
    editarLivro: function(livroId) { this.abrirPainel(livroId); },
    excluirLivro: function(livroId) {
       const livro = this.state.todosOsLivros.find(l => this.getId(l) == livroId); if (!livro) return;
       if (confirm(`Tem certeza que deseja excluir "${livro.nomeDoLivro}"?`)) { App.excluirLivro(livro.firestoreId); }
    },
    renderPainelCitacoes: function() {
        if (!this.state.livroAtivo) return;
        const citacoes = this.state.livroAtivo.citacoes || [];
        
        if (citacoes.length === 0) {
            this.listaCitacoesEl.innerHTML = `
                <div class="placeholder-container" style="min-height: 150px;">
                    <i class="fa-solid fa-quote-left" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <p>Nenhuma citação salva ainda.</p>
                </div>`;
        } else {
            this.listaCitacoesEl.innerHTML = citacoes.map((c, index) => `
                <div class="card-citacao">
                    <blockquote>"${c.texto}"</blockquote>
                    <div class="citacao-footer">
                        <span><i class="fa-solid fa-bookmark"></i> ${c.pagina || 'Ref. Geral'}</span>
                        <button class="btn-acao btn-delete-quote" data-idx="${index}" title="Apagar"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            `).join('');
        }
    },

    salvarCitacao: async function() {
        const texto = document.getElementById('input-citacao-texto').value;
        const pagina = document.getElementById('input-citacao-pag').value;
        
        if (!texto) return App.mostrarNotificacao('Digite a citação.', 'erro');
        
        if (!this.state.livroAtivo.citacoes) this.state.livroAtivo.citacoes = [];
        
        this.state.livroAtivo.citacoes.push({
            texto,
            pagina,
            data: new Date().toISOString()
        });
        
        await App.salvarLivro(this.state.livroAtivo, this.state.livroAtivo.firestoreId);
        
        // Limpa form
        document.getElementById('input-citacao-texto').value = '';
        document.getElementById('input-citacao-pag').value = '';
        this.formCitacaoEl.classList.add('hidden');
        
        this.renderPainelCitacoes();
        App.mostrarNotificacao('Citação salva!');
    },

    deletarCitacao: async function(idx) {
        if(confirm('Apagar esta citação?')) {
            this.state.livroAtivo.citacoes.splice(idx, 1);
            await App.salvarLivro(this.state.livroAtivo, this.state.livroAtivo.firestoreId);
            this.renderPainelCitacoes();
            App.mostrarNotificacao('Citação removida.');
        }
    }
};