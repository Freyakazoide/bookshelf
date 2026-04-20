const Desafio = {
    state: {
        metas: [],
        livros: [],
        metaAtiva: null,
        initialized: false,
        paginaSeletor: 0,
        buscaSeletor: '',
        filtroSeletor: 'Todos'
    },

    init: function(metas, livros) {
        // Atualiza os dados sempre que chamado
        this.state.metas = metas || [];
        this.state.livros = livros || [];
        
        // CORREÇÃO CRÍTICA AQUI:
        // Só faz o cache e o render inicial SE ainda não foi inicializado.
        // Se já foi, não faz NADA visualmente (o 'atualizar' cuidará disso).
        if (!this.state.initialized) {
            console.log('[DEBUG] Desafio.init: Inicializando pela primeira vez.');
            this.cacheDOM();
            this.bindEvents();
            this.state.initialized = true;
            this.render(); // <--- O render agora mora aqui dentro!
        } else {
            console.log('[DEBUG] Desafio.init: Já inicializado, ignorando render total.');
        }
    },

    atualizar: function(livros) {
        console.log('[DEBUG] Desafio.atualizar executando update suave.');
        this.state.livros = livros || [];
        
        if (window.App && window.App.state && window.App.state.challenges) {
             this.state.metas = window.App.state.challenges;
        }

        if (this.state.metaAtiva) {
            const idAtivo = this.state.metaAtiva.firestoreId || this.state.metaAtiva.id;
            const metaAtualizada = this.state.metas.find(m => 
                String(m.firestoreId) === String(idAtivo) || String(m.id) === String(idAtivo)
            );
            
            if (metaAtualizada) {
                // Atualiza o objeto da memória
                this.state.metaAtiva = metaAtualizada;
                // false = NÃO recria o HTML, apenas atualiza valores
                this.renderDetalhesMeta(false);
            } else {
                this.alternarVisualizacao(false);
            }
        }
        this.renderListaDeMetas();
    },

    cacheDOM: function() {
        this.listaMetasAtivas = document.getElementById('lista-metas-ativas');
        this.listaMetasConcluidas = document.getElementById('lista-metas-concluidas');
        this.modalCriarMeta = document.getElementById('modal-criar-meta');
        this.btnAbrirModal = document.getElementById('btn-abrir-modal-meta');
        this.btnFecharModal = document.getElementById('btn-fechar-modal-meta');
        this.formCriarMeta = document.getElementById('form-criar-meta');
        this.btnCriarSubmit = document.getElementById('btn-criar-nova-meta');
        this.containerDetalhe = document.getElementById('desafio-ativo-container'); 
        this.btnDeletarMeta = document.getElementById('btn-deletar-meta-ativa');
    },

    bindEvents: function() {
        if (this.btnAbrirModal) this.btnAbrirModal.onclick = (e) => { e.preventDefault(); this.abrirModalCriacao(); };
        if (this.btnFecharModal) this.btnFecharModal.onclick = (e) => { e.preventDefault(); this.modalCriarMeta.close(); };
        
        if (this.btnCriarSubmit) {
            const novoBtn = this.btnCriarSubmit.cloneNode(true);
            this.btnCriarSubmit.parentNode.replaceChild(novoBtn, this.btnCriarSubmit);
            this.btnCriarSubmit = novoBtn;
            this.btnCriarSubmit.addEventListener('click', (e) => { e.preventDefault(); this.criarNovaMeta(); });
        }

        if (this.btnDeletarMeta) this.btnDeletarMeta.onclick = (e) => { e.preventDefault(); this.deletarMetaAtiva(); };
    },

    render: function() {
        this.renderListaDeMetas();
        if (this.state.metaAtiva) {
            // true = Render inicial forçado (apenas quando chama via init ou troca de meta)
            this.renderDetalhesMeta(true); 
            this.alternarVisualizacao(true);
        } else {
            this.alternarVisualizacao(false);
        }
    },

    renderListaDeMetas: function() {
        if (!this.listaMetasAtivas) return;
        const rawMetas = this.state.metas || [];
        
        const todas = rawMetas.map(meta => {
            if(!meta) return null;
            const titulo = meta.titulo || meta.nome || 'Meta Sem Nome';
            const progresso = this.calcularProgressoMeta(meta);
            return { ...meta, titulo, progresso };
        }).filter(Boolean);

        todas.sort((a, b) => String(a.titulo).localeCompare(String(b.titulo)));
        const ativas = todas.filter(m => !m.progresso.concluida);
        const concluidas = todas.filter(m => m.progresso.concluida);

        const htmlCard = (m) => {
            const rank = this.calcularRankMeta(m.progresso.porcentagem);
            const mId = m.firestoreId || m.id;
            const activeId = this.state.metaAtiva ? (this.state.metaAtiva.firestoreId || this.state.metaAtiva.id) : null;
            const activeClass = (String(mId) === String(activeId)) ? 'active' : '';

            return `
                <div class="meta-card meta-rank-${rank} ${activeClass}" onclick="Desafio.selecionarMetaPorId('${mId}')">
                    <div class="meta-header">
                        <h4>${m.titulo}</h4>
                        <span class="meta-tag-rank">${rank}</span>
                    </div>
                    <div class="meta-card-info">
                        <span>${m.progresso.atual}/${m.progresso.total}</span>
                        <span>${m.progresso.porcentagem}%</span>
                    </div>
                    <div class="quest-bar-bg">
                        <div class="quest-bar-fill" style="width: ${m.progresso.porcentagem}%"></div>
                    </div>
                </div>`;
        };

        this.listaMetasAtivas.innerHTML = ativas.length ? ativas.map(htmlCard).join('') : '<p style="color:#64748b; padding:10px; text-align:center">Sem metas ativas.</p>';
        if(this.listaMetasConcluidas) this.listaMetasConcluidas.innerHTML = concluidas.length ? concluidas.map(htmlCard).join('') : '<p style="color:#64748b; padding:10px; text-align:center">Sem metas concluídas.</p>';
    },

    selecionarMetaPorId: function(id) {
        const meta = this.state.metas.find(m => String(m.firestoreId) === String(id) || String(m.id) === String(id));
        if (meta) this.selecionarMeta(meta);
    },

    selecionarMeta: function(meta) {
        this.state.metaAtiva = meta;
        this.alternarVisualizacao(true);
        this.buscaSeletor = '';
        this.paginaSeletor = 0;
        this.renderDetalhesMeta(true); // Trocou de meta, precisa reconstruir HTML
        this.renderListaDeMetas();
    },

    renderDetalhesMeta: function(forceRebuild = false) {
        const meta = this.state.metaAtiva;
        if(!meta || !this.containerDetalhe) return;

        // SE O HTML JÁ EXISTE e não forçado, só atualiza dados e aborta
        const jaExiste = document.getElementById('meta-titulo-dinamico');
        if (jaExiste && !forceRebuild) {
            this.atualizarInfoHeader();
            this.renderGridProgresso();
            this.renderSeletorLivros();
            return;
        }

        // HTML fixo e limpo
        const headerHTML = `
            <div class="meta-compact-header">
                <div style="display:flex; align-items:center; gap:15px; width:100%;">
                    <div style="flex-grow:1;">
                        <h2 id="meta-titulo-dinamico" style="margin:0; font-size:1.4rem; color:#fff; text-shadow:0 0 10px rgba(45,212,191,0.3);">---</h2>
                        <span id="meta-obj-dinamico" style="font-size:0.8rem; color:#94a3b8;">---</span>
                    </div>
                    <div style="text-align:right;">
                         <span id="meta-prog-texto" style="font-family:monospace; color:#2dd4bf; font-weight:bold; font-size:1.2rem;">0 / 0</span>
                         <div style="width:150px; height:6px; background:#334155; border-radius:4px; margin-top:5px; overflow:hidden;">
                            <div id="meta-prog-bar" style="width:0%; height:100%; background:#2dd4bf; box-shadow: 0 0 8px #2dd4bf;"></div>
                        </div>
                    </div>
                    <button type="button" class="btn btn-perigo" id="btn-deletar-interno" title="Abandonar Quest" style="padding:8px 12px; margin-left:10px;"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
            
            <div class="meta-detalhe-tabs">
                <button type="button" class="tab-button active" data-tab="tab-progresso-meta">Progresso</button>
                <button type="button" class="tab-button" data-tab="tab-gerenciar-livros">Gerenciar Livros</button>
            </div>

            <div class="painel-conteudo-tabs">
                <div id="tab-progresso-meta" class="meta-tab-content active">
                     <div id="grid-progresso-meta" class="grid-livros-meta"></div>
                </div>
                
                <div id="tab-gerenciar-livros" class="meta-tab-content">
                    <div class="controles-dashboard" style="flex-shrink:0; margin-bottom:10px; padding: 1.5rem 1.5rem 0 1.5rem;">
                         <div class="campo-com-icone" style="width:100%;">
                            <i class="fa-solid fa-search"></i>
                            <input type="text" id="input-busca-livros-meta" placeholder="Buscar livro para adicionar..." 
                                onkeyup="Desafio.buscaSeletor = this.value; Desafio.paginaSeletor = 0; Desafio.renderSeletorLivros()">
                        </div>
                        <div class="grupo-filtros" style="margin-top:10px;">
                            <button type="button" class="filtro-status-meta active" data-status="Todos" onclick="Desafio.mudarFiltro(this, 'Todos')">Todos</button>
                            <button type="button" class="filtro-status-meta" data-status="NaoLidos" onclick="Desafio.mudarFiltro(this, 'NaoLidos')">Pendentes</button>
                            <button type="button" class="filtro-status-meta" data-status="Selecionados" onclick="Desafio.mudarFiltro(this, 'Selecionados')">Já na Quest</button>
                        </div>
                    </div>
                    
                    <div id="seletor-livros-meta" style="flex-grow:1; overflow-y:auto; padding:10px;"></div>
                    
                    <div class="controles-paginacao" id="paginacao-seletor-meta" style="flex-shrink:0; padding: 1rem; border-top: 1px solid var(--ui-border); background: rgba(0,0,0,0.2);">
                        <button type="button" id="btn-meta-anterior" class="btn btn-secundario"><i class="fa-solid fa-arrow-left"></i></button>
                        <span id="info-pagina-meta" style="color:#fff; font-weight:bold;">1/1</span>
                        <button type="button" id="btn-meta-proxima" class="btn btn-secundario"><i class="fa-solid fa-arrow-right"></i></button>
                    </div>
                </div>
            </div>
        `;

        this.containerDetalhe.innerHTML = headerHTML;
        
        // RE-BIND DAS ABAS
        const tabs = document.querySelectorAll('.meta-detalhe-tabs .tab-button');
        tabs.forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                document.querySelectorAll('.meta-detalhe-tabs .tab-button').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.meta-tab-content').forEach(c => c.classList.remove('active'));
                
                e.target.classList.add('active');
                const tabId = e.target.dataset.tab;
                const tabConteudo = document.getElementById(tabId);
                if(tabConteudo) tabConteudo.classList.add('active');
                
                // Restaura o valor da busca se voltar pra aba gerenciar
                if (tabId === 'tab-gerenciar-livros') {
                    const input = document.getElementById('input-busca-livros-meta');
                    if (input) input.value = this.buscaSeletor;
                }
            };
        });

        const btnDel = document.getElementById('btn-deletar-interno');
        if(btnDel) btnDel.onclick = (e) => { e.preventDefault(); this.deletarMetaAtiva(); };

        this.cacheDOMDinamicamente();
        
        this.atualizarInfoHeader();
        this.renderGridProgresso();
        this.renderSeletorLivros();
    },

    atualizarInfoHeader: function() {
        const meta = this.state.metaAtiva;
        if (!meta) return;
        const progresso = this.calcularProgressoMeta(meta);

        const elTitulo = document.getElementById('meta-titulo-dinamico');
        const elObj = document.getElementById('meta-obj-dinamico');
        const elTexto = document.getElementById('meta-prog-texto');
        const elBarra = document.getElementById('meta-prog-bar');

        if(elTitulo) elTitulo.textContent = meta.titulo || 'Quest';
        if(elObj) elObj.textContent = `Objetivo: ${meta.tipo === 'paginas' ? meta.objetivo + ' Páginas' : meta.objetivo + ' Livros'}`;
        if(elTexto) elTexto.textContent = `${progresso.atual} / ${progresso.total}`;
        if(elBarra) elBarra.style.width = `${progresso.porcentagem}%`;
    },

    renderGridProgresso: function() {
        const container = document.getElementById('grid-progresso-meta');
        if (!container) return;
        
        const meta = this.state.metaAtiva;
        const idsVinculados = meta.livrosDaMeta || [];

        if (idsVinculados.length === 0) {
            container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:3rem; color:#64748b; font-style:italic;"><i class="fa-solid fa-ghost" style="font-size:2rem; margin-bottom:10px;"></i><br>Esta quest está vazia.<br>Vá na aba "Gerenciar Livros" para invocar companheiros.</div>';
            return;
        }

        const listaCards = idsVinculados.map(idMeta => {
            const idToCheck = (typeof idMeta === 'object' && idMeta.id) ? idMeta.id : idMeta;
            const l = this.state.livros.find(book => String(book.id) === String(idToCheck) || String(book.firestoreId) === String(idToCheck));
            
            if (!l) return ''; 

            const sit = String(l.situacao || '').trim().toLowerCase();
            const isLido = sit === 'lido' || sit === 'concluido';
            const capa = l.urlCapa || 'https://via.placeholder.com/150x220?text=Sem+Capa';
            const idReal = l.firestoreId || l.id;

            return `
                <div class="card-meta-active ${isLido ? 'lido' : ''}" onclick="Desafio.abrirDetalhesLivro('${idReal}')" title="${l.nomeDoLivro}">
                    <button type="button" class="btn-remove-quick" 
                        onclick="event.stopPropagation(); Desafio.toggleLivroMeta('${idToCheck}')" 
                        title="Remover desta Quest">
                        <i class="fa-solid fa-times"></i>
                    </button>
                    <img src="${capa}" alt="${l.nomeDoLivro}" onerror="this.src='https://via.placeholder.com/150x220?text=Erro'">
                    <div class="meta-book-info">
                        <span class="meta-book-title">${l.nomeDoLivro}</span>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = listaCards;
    },

    mudarFiltro: function(btn, status) {
        document.querySelectorAll('.filtro-status-meta').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.filtroSeletor = status;
        this.paginaSeletor = 0;
        this.renderSeletorLivros();
    },

    cacheDOMDinamicamente: function() {
        this.seletorLivros = document.getElementById('seletor-livros-meta');
        this.infoPaginaSeletor = document.getElementById('info-pagina-meta');
        this.btnAntSeletor = document.getElementById('btn-meta-anterior');
        this.btnProxSeletor = document.getElementById('btn-meta-proxima');
        
        if(this.btnAntSeletor) this.btnAntSeletor.onclick = (e) => { e.preventDefault(); if(this.paginaSeletor > 0) { this.paginaSeletor--; this.renderSeletorLivros(); } };
        if(this.btnProxSeletor) this.btnProxSeletor.onclick = (e) => { e.preventDefault(); this.paginaSeletor++; this.renderSeletorLivros(); };
    },

    renderSeletorLivros: function() {
        if (!this.seletorLivros) return;

        const metaItens = this.state.metaAtiva?.livrosDaMeta || [];
        
        let livrosFiltrados = this.state.livros.filter(l => {
            const termo = (this.buscaSeletor || '').toLowerCase();
            const titulo = (l.nomeDoLivro || '').toLowerCase();
            const autor = (l.autor || '').toLowerCase();
            const matchBusca = titulo.includes(termo) || autor.includes(termo);
            
            let matchStatus = true;
            const id = l.firestoreId || l.id;
            const estaNaMeta = metaItens.some(item => {
                 const itemId = (typeof item === 'object' && item.id) ? item.id : item;
                 return String(itemId) === String(id);
            });

            if (this.filtroSeletor === 'NaoLidos') matchStatus = l.situacao !== 'Lido' && l.situacao !== 'Concluido';
            else if (this.filtroSeletor === 'Selecionados') matchStatus = estaNaMeta;

            return matchBusca && matchStatus;
        });

        const porPagina = 20;
        const totalPaginas = Math.ceil(livrosFiltrados.length / porPagina);
        
        if (this.paginaSeletor >= totalPaginas) this.paginaSeletor = totalPaginas > 0 ? totalPaginas - 1 : 0;
        if (this.paginaSeletor < 0) this.paginaSeletor = 0;
        
        const inicio = this.paginaSeletor * porPagina;
        const fim = inicio + porPagina;
        const livrosPagina = livrosFiltrados.slice(inicio, fim);

        if (this.infoPaginaSeletor) this.infoPaginaSeletor.textContent = totalPaginas > 0 ? `${this.paginaSeletor + 1}/${totalPaginas}` : '0/0';

        if(livrosPagina.length === 0) {
            this.seletorLivros.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:20px; color:#64748b;">Nenhum livro encontrado com esses filtros.</div>';
            return;
        }

        this.seletorLivros.innerHTML = livrosPagina.map(l => {
            const id = l.firestoreId || l.id;
            const selecionado = metaItens.some(item => {
                 const itemId = (typeof item === 'object' && item.id) ? item.id : item;
                 return String(itemId) === String(id);
            });
            const capa = l.urlCapa || 'https://via.placeholder.com/150x220?text=Sem+Capa';
            const autor = l.autor || 'Desconhecido';
            const btnIcon = selecionado ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-plus"></i>';
            const textoBtn = selecionado ? 'Na Lista' : 'Adicionar';
            
            return `
                <div class="card-seletor-item ${selecionado ? 'selecionado' : ''}" 
                     onclick="Desafio.toggleLivroMeta('${id}')"
                     title="Clique para adicionar/remover da Quest">
                    <div class="seletor-img-wrapper">
                        <img src="${capa}" alt="Capa" loading="lazy">
                    </div>
                    <div class="seletor-body">
                        <div class="seletor-titulo" title="${l.nomeDoLivro}">${l.nomeDoLivro}</div>
                        <div class="seletor-autor">${autor}</div>
                        <div class="seletor-actions">
                            <button type="button" class="btn-seletor-acao btn-info" onclick="event.stopPropagation(); Desafio.abrirDetalhesLivro('${id}')"><i class="fa-solid fa-eye"></i></button>
                            <button type="button" class="btn-seletor-acao btn-toggle">${btnIcon} ${textoBtn}</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    abrirDetalhesLivro: function(idLivro) {
        if (typeof Estante !== 'undefined' && Estante.abrirPainelLivro) {
            Estante.abrirPainelLivro(idLivro);
        } else {
            alert("Detalhes indisponíveis.");
        }
    },

    toggleLivroMeta: async function(livroId) {
        if (!this.state.metaAtiva) return;
        const docId = this.state.metaAtiva.firestoreId;
        
        let listaAtual = [...(this.state.metaAtiva.livrosDaMeta || [])];
        const index = listaAtual.findIndex(item => {
            const itemId = (typeof item === 'object' && item.id) ? item.id : item;
            return String(itemId) === String(livroId);
        });
        
        if (index > -1) {
            listaAtual.splice(index, 1);
        } else {
            listaAtual.push({ id: String(livroId), dataAdicao: new Date().toISOString() });
        }
        
        // Atualiza Memória LOCALMENTE (Instantâneo)
        this.state.metaAtiva.livrosDaMeta = listaAtual;
        const metaGlobal = this.state.metas.find(m => String(m.firestoreId) === String(docId));
        if(metaGlobal) metaGlobal.livrosDaMeta = listaAtual;

        // Atualiza UI agora (sem piscar)
        this.atualizarInfoHeader();
        this.renderGridProgresso();
        this.renderSeletorLivros();

        if (window.App && window.App.state && window.App.state.db) {
            try {
                await window.App.state.db.collection('challenges').doc(docId).update({ livrosDaMeta: listaAtual });
                if (window.App.mostrarNotificacao) window.App.mostrarNotificacao('Salvo!', 'sucesso');
            } catch(e) {
                console.error(e);
                alert("Erro ao salvar no banco.");
            }
        }
    },

    calcularProgressoMeta: function(meta) {
        if (!meta) return { atual: 0, total: 0, porcentagem: 0, concluida: false };
        const ids = meta.livrosDaMeta || [];
        const totalObj = parseInt(meta.objetivo) || 0;
        const total = meta.tipo === 'paginas' ? totalObj : (totalObj > 0 ? totalObj : ids.length);
        
        let atual = 0;
        ids.forEach(idMeta => {
            const idToCheck = (typeof idMeta === 'object' && idMeta.id) ? idMeta.id : idMeta;
            const livro = this.state.livros.find(l => String(l.id) === String(idToCheck) || String(l.firestoreId) === String(idToCheck));
            if (livro) {
                const statusLimpo = String(livro.situacao || '').trim().toLowerCase();
                if (['lido', 'concluido', 'leitura concluída'].includes(statusLimpo)) {
                    atual += meta.tipo === 'paginas' ? (parseInt(livro.paginas) || 0) : 1;
                }
            }
        });

        let porcentagem = 0;
        if (total > 0) porcentagem = Math.round((atual / total) * 100);
        else if (total === 0 && atual > 0) porcentagem = 100;
        if (porcentagem > 100) porcentagem = 100;
        return { atual, total, porcentagem, concluida: porcentagem >= 100 };
    },

    calcularRankMeta: function(pct) {
        if (pct >= 100) return 'S';
        if (pct >= 75) return 'A';
        if (pct >= 50) return 'B';
        if (pct >= 25) return 'C';
        return 'D';
    },

    abrirModalCriacao: function() {
        if(this.modalCriarMeta) {
            this.modalCriarMeta.showModal();
            this.popularSelectAno();
        }
    },

    popularSelectAno: function() {
        const select = document.getElementById('select-meta-ano');
        if (!select) return;
        const anoAtual = new Date().getFullYear();
        select.innerHTML = '';
        for (let i = anoAtual; i >= anoAtual - 5; i--) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = i;
            select.appendChild(opt);
        }
    },

    criarNovaMeta: async function() {
        if (!window.App || !window.App.state.user) return alert("Faça login primeiro!");
        const nome = document.getElementById('input-meta-nome').value;
        const ano = document.getElementById('select-meta-ano').value;
        const tipo = document.getElementById('select-meta-tipo').value;
        const objetivo = document.getElementById('input-meta-objetivo').value;

        if (!nome || !objetivo) return alert("Preencha todos os campos obrigatórios!");

        const novaMeta = {
            titulo: nome,
            ano: parseInt(ano),
            tipo: tipo,
            objetivo: parseInt(objetivo),
            livrosDaMeta: [],
            criadoEm: new Date().toISOString(),
            userId: window.App.state.user.uid
        };

        if (window.App && window.App.state && window.App.state.db) {
            try {
                if (this.btnCriarSubmit) this.btnCriarSubmit.disabled = true;
                const docRef = await window.App.state.db.collection('challenges').add(novaMeta);
                novaMeta.firestoreId = docRef.id;
                this.state.metas.push(novaMeta);
                if (window.App.state && window.App.state.challenges) window.App.state.challenges.push(novaMeta);
                this.modalCriarMeta.close();
                this.formCriarMeta.reset();
                this.renderListaDeMetas();
                this.selecionarMeta(novaMeta);
                if (window.App.mostrarNotificacao) window.App.mostrarNotificacao('Nova Quest Iniciada!', 'sucesso');
            } catch(e) {
                alert("Erro ao criar meta: " + e.message);
            } finally {
                if (this.btnCriarSubmit) this.btnCriarSubmit.disabled = false;
            }
        }
    },

    deletarMetaAtiva: async function() {
        if (!this.state.metaAtiva || !confirm('Tem certeza? Isso apagará a meta para sempre.')) return;
        const id = this.state.metaAtiva.firestoreId;
        if (window.App && window.App.state && window.App.state.db) {
            try {
                await window.App.state.db.collection('challenges').doc(id).delete();
                this.state.metaAtiva = null;
                if (window.App.mostrarNotificacao) window.App.mostrarNotificacao('Quest deletada.', 'sucesso');
                this.alternarVisualizacao(false);
            } catch(e) {
                alert("Erro: " + e.message);
            }
        }
    },

    alternarVisualizacao: function(temMetaAtiva) {
        const vazio = document.getElementById('nenhuma-meta-selecionada');
        const ativo = document.getElementById('desafio-ativo-container');
        if (vazio && ativo) {
            vazio.style.display = temMetaAtiva ? 'none' : 'flex';
            ativo.style.display = temMetaAtiva ? 'block' : 'none';
            if(temMetaAtiva) ativo.classList.remove('hidden');
        }
    }
};