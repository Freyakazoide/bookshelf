const App = {
    state: {
        livros: [],
        challenges: [],
        activeView: 'view-estante',
        db: null,
        auth: null,
        user: null,
    },

    cacheDOM: function() {
        this.navLinks = document.querySelectorAll('.nav-link');
        this.views = document.querySelectorAll('.view');
        this.notificacaoContainerEl = document.getElementById('notificacao-container');
        this.authContainerEl = document.getElementById('auth-container');
    },

    bindEvents: function() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetLink = e.target.closest('.nav-link');
                if (targetLink) this.navegarPara(targetLink.dataset.view);
            });
        });

        this.authContainerEl.addEventListener('click', (e) => {
            const loginButton = e.target.closest('#btn-login');
            const logoutButton = e.target.closest('#btn-logout');
            if (loginButton) this.login();
            if (logoutButton) this.logout();
        });
    },

    init: async function() {
        console.log('Aplicativo iniciando com Firebase...');
        this.cacheDOM();
        this.bindEvents();
        
        try {
            firebase.initializeApp(firebaseConfig);
            this.state.db = firebase.firestore();
            this.state.auth = firebase.auth();
            console.log('Firebase conectado!');
            
            this.state.auth.onAuthStateChanged(user => {
                this.state.user = user || null;
                this.renderAuthUI();
                this.toggleEditFeatures();
            });
            
            await this.carregarDadosDoFirebase();

        } catch (error) {
            console.error('Erro crítico:', error);
            this.mostrarNotificacao('Erro ao conectar.', 'erro');
        }
    },

    carregarDadosDoFirebase: async function() {
        this.mostrarNotificacao('Sincronizando dados...', 'info');
        try {
            const livrosSnapshot = await this.state.db.collection('livros').get();
            this.state.livros = livrosSnapshot.docs.map(doc => ({
                firestoreId: doc.id,
                ...doc.data()
            }));

            const challengesSnapshot = await this.state.db.collection('challenges').get();
            this.state.challenges = challengesSnapshot.docs.map(doc => ({
                firestoreId: doc.id,
                ...doc.data()
            }));

            Gamification.atualizarInterface(this.state.livros);
            Estante.init(this.state.livros, this.state.challenges);
            Adicionar.init(this.state.livros);
            Dashboard.init(this.state.livros);
            Desafio.init(this.state.livros, this.state.challenges);
            
            if(this.state.activeView === 'view-inventario') Inventario.render();

        } catch (error) {
            console.error("Erro Firestore:", error);
            this.mostrarNotificacao('Erro ao carregar dados.', 'erro');
        }
    },
    
    login: async function() {
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            await this.state.auth.signInWithPopup(provider);
            this.mostrarNotificacao('Logado com sucesso!');
        } catch (error) {
            this.mostrarNotificacao('Erro no login.', 'erro');
        }
    },

    logout: async function() {
        try {
            await this.state.auth.signOut();
            this.mostrarNotificacao('Desconectado.');
        } catch (error) { console.error(error); }
    },

    renderAuthUI: function() {
        if (this.state.user) {
            this.authContainerEl.innerHTML = `
                <div class="auth-info">
                    <img src="${this.state.user.photoURL}" alt="Foto">
                    <p>${this.state.user.displayName}</p>
                    <button id="btn-logout" class="btn-logout"><i class="fa-solid fa-sign-out-alt"></i></button>
                </div>`;
        } else {
            this.authContainerEl.innerHTML = `
                <button id="btn-login" class="btn-login">
                    <i class="fa-brands fa-google"></i> Login
                </button>`;
        }
    },

    toggleEditFeatures: function() {
        const editButtons = document.querySelectorAll('#painel-btn-editar, #painel-btn-excluir, #painel-btn-salvar, #form-notas, #painel-btn-nova-leitura');
        const addLink = document.querySelector('.nav-link[data-view="view-adicionar"]');
        const display = this.state.user ? 'block' : 'none';
        
        editButtons.forEach(btn => btn.style.display = display);
        if (addLink) addLink.style.display = display;
    },

    salvarLivro: async function(livroData, firestoreId) {
        if (!this.state.user) {
            this.mostrarNotificacao('Faça login para salvar.', 'erro');
            return false;
        }
        const dadosParaSalvar = { ...livroData };
        delete dadosParaSalvar.firestoreId; 
        
        try {
            if (firestoreId) {
                await this.state.db.collection('livros').doc(firestoreId).set(dadosParaSalvar, { merge: true });
                const index = this.state.livros.findIndex(l => l.firestoreId === firestoreId);
                if (index !== -1) {
                    this.state.livros[index] = { firestoreId, ...dadosParaSalvar };
                }
            } else {
                const docRef = await this.state.db.collection('livros').add(dadosParaSalvar);
                this.state.livros.push({ firestoreId: docRef.id, ...dadosParaSalvar });
            }
            return true;
        } catch (error) {
            console.error('Erro salvar:', error);
            this.mostrarNotificacao('Erro ao salvar.', 'erro');
            return false;
        }
    },
    
    excluirLivro: async function(firestoreId) {
        if (!this.state.user) return this.mostrarNotificacao('Faça login.', 'erro');
        try {
            await this.state.db.collection('livros').doc(firestoreId).delete();
            this.state.livros = this.state.livros.filter(l => l.firestoreId !== firestoreId);
            this.carregarDadosDoFirebase(); 
            this.mostrarNotificacao('Excluído.');
        } catch (error) { this.mostrarNotificacao('Erro ao excluir.', 'erro'); }
    },
    
    salvarMetas: async function(metas) {
        if (!this.state.user) return;
        try {
            const batch = this.state.db.batch();
            const collectionRef = this.state.db.collection('challenges');
            const snapshot = await collectionRef.get();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            metas.forEach(meta => {
                const { firestoreId, ...metaData } = meta;
                const docRef = firestoreId ? collectionRef.doc(firestoreId) : collectionRef.doc();
                batch.set(docRef, metaData);
            });
            await batch.commit();
        } catch (error) { console.error(error); }
    },

    navegarPara: function(viewId) {
        this.views.forEach(v => v.classList.remove('active'));
        const viewEl = document.getElementById(viewId);
        if(viewEl) viewEl.classList.add('active');
        
        this.navLinks.forEach(l => l.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-link[data-view="${viewId}"]`);
        if (activeLink) activeLink.classList.add('active');
        
        this.state.activeView = viewId;
        window.scrollTo(0, 0);
        
        if (viewId === 'view-dashboard') Dashboard.atualizar(this.state.livros);
        if (viewId === 'view-desafio') Desafio.atualizar(this.state.livros);
        if (viewId === 'view-inventario') Inventario.render();
    },

    mostrarNotificacao: function(mensagem, tipo = 'sucesso') {
        const notificacao = document.createElement('div');
        notificacao.className = `notificacao ${tipo}`;
        notificacao.textContent = mensagem;
        this.notificacaoContainerEl.appendChild(notificacao);
        setTimeout(() => notificacao.remove(), 3000);
    }
};

// --- GAMIFICATION & LOOT SYSTEM 2.0 ---
const Gamification = {
    config: { xpPorPagina: 1, xpBonusLivro: 50, fatorNivel: 0.15 },

    // Tabela de Loot Expandida e Criativa
    lootTable: [
        // 1. CONSUMÍVEIS (XP e Buffs Rápidos)
        { id: 'pot_cafe', nome: 'Café Expresso', categoria: 'consumivel', tipo: 'Comum', icone: 'fa-mug-hot', desc: 'Um gole rápido de energia. +50 XP.', efeito: 'xp', valor: 50, dropRate: 30 },
        { id: 'pot_cha', nome: 'Chá de Camomila', categoria: 'consumivel', tipo: 'Comum', icone: 'fa-mug-saucer', desc: 'Acalma a mente para absorver melhor a história. +60 XP.', efeito: 'xp', valor: 60, dropRate: 30 },
        { id: 'pot_energetico', nome: 'Energético Literário', categoria: 'consumivel', tipo: 'Incomum', icone: 'fa-bolt', desc: 'Foco laser! +150 XP.', efeito: 'xp', valor: 150, dropRate: 15 },
        { id: 'pot_sabedoria', nome: 'Elixir da Sabedoria', categoria: 'consumivel', tipo: 'Raro', icone: 'fa-flask', desc: 'Conhecimento puro engarrafado. +300 XP.', efeito: 'xp', valor: 300, dropRate: 8 },
        { id: 'pot_memoria', nome: 'Frasco de Memória', categoria: 'consumivel', tipo: 'Épico', icone: 'fa-brain', desc: 'Você se lembra de cada detalhe. +800 XP.', efeito: 'xp', valor: 800, dropRate: 3 },

        // 2. EQUIPAMENTOS (Prestígio)
        { id: 'eq_oculos', nome: 'Óculos de Leitura', categoria: 'equipamento', tipo: 'Comum', icone: 'fa-glasses', desc: 'Faz você parecer mais inteligente (+1 Charme).', dropRate: 20 },
        { id: 'eq_marcador', nome: 'Marcador de Papelão', categoria: 'equipamento', tipo: 'Comum', icone: 'fa-bookmark', desc: 'Simples, mas funciona.', dropRate: 20 },
        { id: 'eq_lupa', nome: 'Lupa de Detetive', categoria: 'equipamento', tipo: 'Incomum', icone: 'fa-magnifying-glass', desc: 'Para encontrar detalhes escondidos no plot.', dropRate: 15 },
        { id: 'eq_kindle', nome: 'Tablet Arcano', categoria: 'equipamento', tipo: 'Raro', icone: 'fa-tablet-screen-button', desc: 'Contém milhares de mundos em um vidro negro.', dropRate: 8 },
        { id: 'eq_pena', nome: 'Pena de Fênix', categoria: 'equipamento', tipo: 'Épico', icone: 'fa-feather-pointed', desc: 'Dizem que a tinta nunca acaba.', dropRate: 2 },

        // 3. COLECIONÁVEIS (LORE - Partes de um todo)
        { id: 'col_mapa_1', nome: 'Fragmento de Mapa (Norte)', categoria: 'colecionavel', tipo: 'Incomum', icone: 'fa-map', desc: 'Parte de um mapa antigo de uma biblioteca perdida.', dropRate: 5 },
        { id: 'col_mapa_2', nome: 'Fragmento de Mapa (Sul)', categoria: 'colecionavel', tipo: 'Incomum', icone: 'fa-map-location', desc: 'Outra parte do mapa. Onde isso leva?', dropRate: 5 },
        { id: 'col_runa_antiga', nome: 'Runa Esquecida', categoria: 'colecionavel', tipo: 'Raro', icone: 'fa-cubes-stacked', desc: 'Uma pedra vibrando com histórias antigas.', dropRate: 4 },
        
        // 4. ARTEFATOS LENDÁRIOS
        { id: 'art_necro', nome: 'Página do Necronomicon', categoria: 'colecionavel', tipo: 'Lendário', icone: 'fa-book-skull', desc: 'Cuidado. Não leia em voz alta à meia-noite.', dropRate: 1 },
        { id: 'art_graal', nome: 'Cálice de Tinta', categoria: 'colecionavel', tipo: 'Lendário', icone: 'fa-wine-glass', desc: 'A inspiração infinita dos grandes autores.', dropRate: 1 }
    ],

    calcularStats: function(livros) {
        const livrosLidos = livros.filter(l => l.situacao === 'Lido');
        let totalXP = 0;
        
        // XP dos Livros
        livrosLidos.forEach(l => {
            const pags = parseInt(l.paginas, 10) || 0;
            totalXP += (pags * this.config.xpPorPagina) + this.config.xpBonusLivro;
        });

        // XP dos Itens Consumidos
        App.state.livros.forEach(l => {
            if (l.loot && l.loot.consumido) {
                const valorXP = l.loot.valor || 0;
                totalXP += valorXP;
            }
        });

        const nivel = Math.floor(Math.sqrt(totalXP) * this.config.fatorNivel) + 1;
        const xpAtualNivelBase = Math.pow((nivel - 1) / this.config.fatorNivel, 2);
        const xpProximoNivel = Math.pow(nivel / this.config.fatorNivel, 2);
        let pctBarra = ((totalXP - xpAtualNivelBase) / (xpProximoNivel - xpAtualNivelBase)) * 100;
        if(pctBarra > 100) pctBarra = 100; if(totalXP === 0) pctBarra = 0;
        if(pctBarra < 0) pctBarra = 0;

        // Classe Baseada no Gênero
        const generos = {};
        livrosLidos.forEach(l => { if(l.categorias) l.categorias.split(',').forEach(c => { const t=c.trim(); if(t) generos[t]=(generos[t]||0)+1; }); });
        const topGenero = Object.keys(generos).reduce((a, b) => generos[a] > generos[b] ? a : b, "Novato");

        return { totalXP, nivel, xpProximo: Math.floor(xpProximoNivel), pctBarra, classe: this.mapearClasse(topGenero) };
    },

    mapearClasse: function(genero) {
        const m = { 
            'Fantasia':'Arcanista', 'Ficção Científica':'Tecnomante', 'Terror':'Caçador de Sombras', 
            'Romance':'Bardo', 'Técnico':'Artífice', 'História':'Cronista', 'Mistério':'Investigador',
            'Autoajuda':'Monge', 'Poesia':'Poeta', 'HQ':'Herói'
        };
        return m[genero] || 'Aventureiro';
    },

    getClassificacaoMob: function(paginas) {
        const p = parseInt(paginas, 10) || 0;
        if (p >= 1000) return { tipo: 'worldboss', label: '☠️ WORLD BOSS', classe: 'mob-worldboss', icone: 'fa-dragon', cor: '#f59e0b' };
        if (p >= 700) return { tipo: 'boss', label: 'Raid Boss', classe: 'mob-boss', icone: 'fa-skull', cor: '#ef4444' };
        if (p >= 300) return { tipo: 'elite', label: 'Elite', classe: 'mob-elite', icone: 'fa-shield-halved', cor: '#3b82f6' };
        return { tipo: 'minion', label: 'Minion', classe: 'mob-minion', icone: 'fa-ghost', cor: '#94a3b8' };
    },

    gerarLoot: function(livro) {
        if (livro.loot) return livro.loot; 

        let pool = [];
        this.lootTable.forEach(item => { for(let i=0; i < item.dropRate; i++) pool.push(item); });
        const itemSorteado = pool[Math.floor(Math.random() * pool.length)];

        const lootData = {
            idItem: itemSorteado.id,
            nome: itemSorteado.nome,
            tipo: itemSorteado.tipo,
            categoria: itemSorteado.categoria,
            icone: itemSorteado.icone,
            desc: itemSorteado.desc,
            efeito: itemSorteado.efeito || null,
            valor: itemSorteado.valor || 0,
            dataDrop: new Date().toISOString(),
            consumido: false
        };

        livro.loot = lootData;
        this.mostrarModalLoot(lootData, false);
        return lootData;
    },

    mostrarModalLoot: function(item, isReplay) {
        const modal = document.getElementById('modal-loot');
        if(!modal) return;
        const container = modal.querySelector('.loot-container');
        const rarityText = document.getElementById('loot-rarity-text');
        const cardContent = document.getElementById('loot-card-content');
        const descText = document.getElementById('loot-desc-text');
        const btnColetar = document.getElementById('btn-coletar-loot');
        const titleMain = modal.querySelector('.loot-title');

        const raridadeClass = item.tipo === 'Comum' ? 'common' : item.tipo === 'Incomum' ? 'uncommon' : item.tipo === 'Raro' ? 'rare' : item.tipo === 'Épico' ? 'epic' : 'legendary';
        container.className = `loot-container loot-${raridadeClass}`;
        
        // TRATAMENTO PARA CATEGORIA UNDEFINED VISUAL
        const catExibicao = (item.categoria || 'Outros').toUpperCase();
        
        titleMain.textContent = isReplay ? "Inspecionando Item" : "Quest Complete!";
        rarityText.textContent = `${item.tipo} | ${catExibicao}`;
        descText.textContent = item.desc;
        cardContent.innerHTML = `<i class="fa-solid ${item.icone} loot-icon"></i><div class="loot-title">${item.nome}</div>`;

        if (isReplay) {
            btnColetar.innerHTML = '<i class="fa-solid fa-check"></i> Fechar';
        } else {
            btnColetar.innerHTML = '<i class="fa-solid fa-hand-holding-medical"></i> COLETAR PARA MOCHILA';
        }

        modal.showModal();
        btnColetar.onclick = () => { modal.close(); Inventario.render(); };
    },
    
    atualizarInterface: function(livros) {
        const stats = this.calcularStats(livros);
        const elNivel = document.getElementById('player-level-badge');
        const elXP = document.getElementById('xp-current');
        const elBarra = document.getElementById('xp-bar-fill');
        const elClasse = document.getElementById('player-class');
        const elProx = document.getElementById('xp-next');
        
        if(elNivel) {
            elNivel.textContent = stats.nivel;
            elXP.textContent = `${Math.floor(stats.totalXP)} XP`;
            elBarra.style.width = `${stats.pctBarra}%`;
            if(elClasse) elClasse.textContent = stats.classe;
            if(elProx) elProx.textContent = `Próx: ${stats.xpProximo}`;
        }
    }
};

// --- INVENTÁRIO (MOCHILA) 4.0 ---
const Inventario = {
    state: { 
        filtroAtual: 'Todos',
        itemSelecionado: null,
        itensAgrupados: []
    },

    init: function() {
        this.cacheDOM();
    },

    cacheDOM: function() {
        this.gridEl = document.getElementById('grid-inventario');
        this.sidebar = document.querySelector('.inventario-sidebar');
        this.previewIcon = document.getElementById('inv-preview-icon');
        this.previewTitle = document.getElementById('inv-preview-title');
        this.previewType = document.getElementById('inv-preview-type');
        this.previewDesc = document.getElementById('inv-preview-desc');
        this.btnUsar = document.getElementById('btn-inv-usar');
        this.statsTotal = document.getElementById('inv-total-items');
        this.statsGold = document.getElementById('inv-gold-value');
        
        if(this.btnUsar) {
            const novoBtn = this.btnUsar.cloneNode(true);
            this.btnUsar.parentNode.replaceChild(novoBtn, this.btnUsar);
            this.btnUsar = novoBtn;
            this.btnUsar.addEventListener('click', () => this.usarItemSelecionado());
        }
    },

    agruparItens: function() {
        const livros = App.state.livros || [];
        const mapaItens = new Map();

        livros.forEach(livro => {
            if (livro.loot && !livro.loot.consumido) {
                const loot = livro.loot;
                
                // --- CORREÇÃO DE DADOS LEGADOS (MIGRAÇÃO EM TEMPO REAL) ---
                // Se o item antigo não tem categoria, atribuímos 'outros' ou tentamos inferir
                if (!loot.categoria) {
                    if(loot.tipo === 'Consumível' || loot.efeito === 'xp') loot.categoria = 'consumivel';
                    else loot.categoria = 'equipamento';
                }
                
                const key = loot.idItem || loot.nome; // Fallback para nome se id faltar

                if (mapaItens.has(key)) {
                    const grupo = mapaItens.get(key);
                    grupo.quantidade++;
                    grupo.livrosOrigem.push(livro);
                } else {
                    mapaItens.set(key, {
                        ...loot,
                        quantidade: 1,
                        livrosOrigem: [livro]
                    });
                }
            }
        });

        this.state.itensAgrupados = Array.from(mapaItens.values());
    },

    filtrar: function(filtro) {
        this.state.filtroAtual = filtro;
        document.querySelectorAll('.filtro-status-inv').forEach(btn => {
            if(btn.dataset.tipo === filtro) btn.classList.add('active');
            else btn.classList.remove('active');
        });
        this.renderGrid();
    },

    render: function() {
        this.init();
        this.agruparItens();
        this.renderGrid();
        this.limparPreview();
    },

    renderGrid: function() {
        if (!this.gridEl) return;
        
        let itensExibidos = this.state.itensAgrupados;
        if (this.state.filtroAtual !== 'Todos') {
            itensExibidos = itensExibidos.filter(i => i.categoria === this.state.filtroAtual);
        }

        const totalItens = this.state.itensAgrupados.reduce((acc, item) => acc + item.quantidade, 0);
        if(this.statsTotal) this.statsTotal.textContent = totalItens;
        if(this.statsGold) this.statsGold.innerHTML = `${totalItens * 10} <i class="fa-solid fa-coins"></i>`;

        if (itensExibidos.length === 0) {
            this.gridEl.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:2rem; color:#64748b;">Mochila vazia.</div>`;
            for(let i=0; i<12; i++) this.gridEl.innerHTML += `<div class="inv-slot empty"></div>`;
            return;
        }

        this.gridEl.innerHTML = itensExibidos.map(item => {
            const raridadeClass = `rarity-${item.tipo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`;
            const itemJson = encodeURIComponent(JSON.stringify(item));
            
            return `
                <div class="inv-slot ${raridadeClass}" onclick="Inventario.selecionarItem('${item.idItem}')">
                    <i class="fa-solid ${item.icone}"></i>
                    <span class="item-count">${item.quantidade}</span>
                </div>`;
        }).join('');

        const slotsVazios = Math.max(0, 24 - itensExibidos.length);
        for(let i=0; i<slotsVazios; i++) {
            this.gridEl.innerHTML += `<div class="inv-slot empty"></div>`;
        }
    },

    selecionarItem: function(idItem) {
        // Busca pelo ID, se falhar, busca pelo item que foi passado (para garantir compatibilidade)
        this.state.itemSelecionado = this.state.itensAgrupados.find(i => i.idItem === idItem);
        if (!this.state.itemSelecionado) return;

        const item = this.state.itemSelecionado;
        
        document.querySelectorAll('.inv-slot').forEach(slot => slot.classList.remove('active'));
        // Adicionar active visualmente se possível via event target, mas focado no painel agora

        this.previewIcon.innerHTML = `<i class="fa-solid ${item.icone}"></i>`;
        this.previewIcon.className = `item-preview-icon rarity-${item.tipo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`;
        this.previewTitle.textContent = item.nome;
        
        let corTipo = '#fff';
        if (item.categoria === 'consumivel') corTipo = '#10b981';
        if (item.categoria === 'equipamento') corTipo = '#3b82f6';
        if (item.categoria === 'colecionavel') corTipo = '#f59e0b';
        
        // TRATAMENTO PARA "UNDEFINED" NO PAINEL
        const catDisplay = item.categoria ? item.categoria.toUpperCase() : "GERAL";
        
        this.previewType.textContent = `${item.tipo} | ${catDisplay}`;
        this.previewType.style.color = corTipo;
        this.previewType.style.border = `1px solid ${corTipo}`;
        this.previewType.style.background = `${corTipo}20`;
        
        this.previewDesc.textContent = item.desc;

        if (item.categoria === 'consumivel') {
            this.btnUsar.style.display = 'flex';
            this.btnUsar.innerHTML = `<i class="fa-solid fa-sparkles"></i> USAR (${item.quantidade})`;
            this.btnUsar.className = 'btn btn-primario btn-usar-item active';
        } else {
            this.btnUsar.style.display = 'none';
        }
    },

    limparPreview: function() {
        this.state.itemSelecionado = null;
        this.previewIcon.innerHTML = '<i class="fa-solid fa-sack-dollar"></i>';
        this.previewIcon.className = 'item-preview-icon';
        this.previewTitle.textContent = 'Selecione um Item';
        this.previewType.textContent = '---';
        this.previewType.style = '';
        this.previewDesc.textContent = 'Clique em um item na mochila para ver detalhes.';
        this.btnUsar.style.display = 'none';
    },

    usarItemSelecionado: async function() {
        const item = this.state.itemSelecionado;
        if (!item || item.categoria !== 'consumivel' || item.livrosOrigem.length === 0) return;

        const livroAlvo = item.livrosOrigem[0];
        
        if (!confirm(`Consumir 1x ${item.nome}?`)) return;

        // FEEDBACK VISUAL DE USO
        const efeitoDiv = document.createElement('div');
        efeitoDiv.className = 'effect-popup';
        efeitoDiv.innerHTML = `<i class="fa-solid fa-bolt"></i> ${item.nome} Usado!<br>+${item.valor} XP`;
        document.body.appendChild(efeitoDiv);
        setTimeout(() => efeitoDiv.remove(), 2000);

        livroAlvo.loot.consumido = true;
        livroAlvo.loot.valor = item.valor; 
        
        await App.salvarLivro(livroAlvo, livroAlvo.firestoreId);
        
        Gamification.atualizarInterface(App.state.livros);
        this.render();
        
        // Se acabou o item, limpa o preview
        if (item.quantidade <= 1) this.limparPreview();
        else this.selecionarItem(item.idItem); // Atualiza contador no botão
    },

    sincronizarLootAntigo: async function() {
        const livrosParaProcessar = App.state.livros.filter(l => l.situacao === 'Lido' && !l.loot);
        
        if (livrosParaProcessar.length === 0) {
            return App.mostrarNotificacao('Todos os seus livros lidos já possuem loot!', 'info');
        }

        if(!confirm(`Encontramos ${livrosParaProcessar.length} livros lidos sem itens. Deseja abrir esses baús agora?`)) return;

        let novosItens = 0;
        for (const livro of livrosParaProcessar) {
            const loot = Gamification.gerarLoot(livro); 
            await App.salvarLivro(livro, livro.firestoreId);
            novosItens++;
        }
        
        const modal = document.getElementById('modal-loot');
        if(modal) modal.close();

        App.mostrarNotificacao(`${novosItens} novos itens adicionados!`, 'sucesso');
        this.render();
    }
};

App.init();