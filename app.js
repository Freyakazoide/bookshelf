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
                // Pega o elemento correto mesmo se clicar no ícone dentro do link
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
                if (user) {
                    this.state.user = user;
                } else {
                    this.state.user = null;
                }
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

            console.log(`Carregados: ${this.state.livros.length} livros.`);
            this.mostrarNotificacao('Dados atualizados!');

            Gamification.atualizarInterface(this.state.livros);
            
            Estante.init(this.state.livros, this.state.challenges);
            Adicionar.init(this.state.livros);
            Dashboard.init(this.state.livros);
            Desafio.init(this.state.livros, this.state.challenges);
            // Se já estiver na aba de inventário, renderiza ela
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
        delete dadosParaSalvar.firestoreId; // Não salva o ID dentro do documento
        
        try {
            if (firestoreId) {
                await this.state.db.collection('livros').doc(firestoreId).set(dadosParaSalvar, { merge: true });
                
                // ATUALIZAÇÃO CRÍTICA DO ESTADO LOCAL
                // Isso garante que a tela atualize sem precisar recarregar do Firebase
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
            this.carregarDadosDoFirebase(); // Recarrega visual
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
        // AQUI ESTAVA FALTANDO: Carregar o inventário ao entrar na aba
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

// --- GAMIFICATION ---
const Gamification = {
    config: { xpPorPagina: 1, xpBonusLivro: 50, fatorNivel: 0.15 },

    lootTable: [
        { id: 'c1', nome: 'Marcador de Papel', tipo: 'Comum', icone: 'fa-bookmark', desc: 'Um marcador simples, mas funcional.', dropRate: 50 },
        { id: 'c2', nome: 'Café Frio', tipo: 'Comum', icone: 'fa-mug-hot', desc: 'Melhor que nada para manter os olhos abertos.', dropRate: 50 },
        { id: 'u1', nome: 'Vela Aromática', tipo: 'Incomum', icone: 'fa-fire', desc: 'Ambiente perfeito para leitura.', dropRate: 30 },
        { id: 'u2', nome: 'Post-it Neon', tipo: 'Incomum', icone: 'fa-note-sticky', desc: 'Para marcar as melhores frases.', dropRate: 30 },
        { id: 'r1', nome: 'Edição Capa Dura', tipo: 'Raro', icone: 'fa-book', desc: 'Pesado, bonito e durável.', dropRate: 15 },
        { id: 'e1', nome: 'Pena de Fênix', tipo: 'Épico', icone: 'fa-feather-pointed', desc: 'Dizem que escreve o futuro.', dropRate: 4 },
        { id: 'l1', nome: 'O Necronomicon', tipo: 'Lendário', icone: 'fa-book-skull', desc: 'Cuidado ao ler em voz alta...', dropRate: 1 }
    ],

    calcularStats: function(livros) {
        const livrosLidos = livros.filter(l => l.situacao === 'Lido');
        let totalXP = 0;
        livrosLidos.forEach(l => {
            const pags = parseInt(l.paginas, 10) || 0;
            totalXP += (pags * this.config.xpPorPagina) + this.config.xpBonusLivro;
        });
        const nivel = Math.floor(Math.sqrt(totalXP) * this.config.fatorNivel) + 1;
        const xpAtualNivelBase = Math.pow((nivel - 1) / this.config.fatorNivel, 2);
        const xpProximoNivel = Math.pow(nivel / this.config.fatorNivel, 2);
        let pctBarra = ((totalXP - xpAtualNivelBase) / (xpProximoNivel - xpAtualNivelBase)) * 100;
        if(pctBarra > 100) pctBarra = 100; if(totalXP === 0) pctBarra = 0;

        const generos = {};
        livrosLidos.forEach(l => { if(l.categorias) l.categorias.split(',').forEach(c => { const t=c.trim(); if(t) generos[t]=(generos[t]||0)+1; }); });
        const topGenero = Object.keys(generos).reduce((a, b) => generos[a] > generos[b] ? a : b, "Novato");

        return { totalXP, nivel, xpProximo: Math.floor(xpProximoNivel), pctBarra, classe: this.mapearClasse(topGenero) };
    },

    mapearClasse: function(genero) {
        const m = { 'Fantasia':'Arcanista', 'Ficção Científica':'Tecnomante', 'Terror':'Caçador', 'Romance':'Bardo', 'Técnico':'Artífice' };
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
        if (livro.loot) return livro.loot; // Já tem loot

        let pool = [];
        this.lootTable.forEach(item => { for(let i=0; i < item.dropRate; i++) pool.push(item); });
        const itemSorteado = pool[Math.floor(Math.random() * pool.length)];

        const lootData = {
            idItem: itemSorteado.id,
            nome: itemSorteado.nome,
            tipo: itemSorteado.tipo,
            icone: itemSorteado.icone,
            desc: itemSorteado.desc,
            dataDrop: new Date().toISOString()
        };

        // Vincula ao livro NA MEMÓRIA para salvar depois
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
        
        titleMain.textContent = isReplay ? "Item Recuperado!" : "Quest Complete!";
        rarityText.textContent = `${item.tipo} Drop`;
        descText.textContent = item.desc;
        cardContent.innerHTML = `<i class="fa-solid ${item.icone} loot-icon"></i><div class="loot-title">${item.nome}</div>`;

        modal.showModal();
        btnColetar.onclick = () => { modal.close(); Inventario.render(); }; // Atualiza inventário ao fechar
    },

    atualizarInterface: function(livros) {
        const stats = this.calcularStats(livros);
        const elNivel = document.getElementById('player-level-badge');
        const elXP = document.getElementById('xp-current');
        const elBarra = document.getElementById('xp-bar-fill');
        if(elNivel) {
            elNivel.textContent = stats.nivel;
            elXP.textContent = `${Math.floor(stats.totalXP)} XP`;
            elBarra.style.width = `${stats.pctBarra}%`;
        }
    }
};

// --- INVENTÁRIO (MOCHILA) 2.0 ---
const Inventario = {
    state: { filtroAtual: 'Todos' },

    filtrar: function(raridade) {
        this.state.filtroAtual = raridade;
        document.querySelectorAll('.filtro-status').forEach(btn => {
            if(btn.textContent === raridade) btn.classList.add('active');
            else btn.classList.remove('active');
        });
        this.render();
    },

    render: function() {
        const grid = document.getElementById('grid-inventario');
        if (!grid) return;
        
        const livros = App.state.livros || [];
        
        // Filtra itens
        const itens = livros
            .filter(l => l.situacao === 'Lido' && l.loot)
            .map(l => ({ ...l.loot, livroOrigem: l.nomeDoLivro, idLivro: l.firestoreId }));

        const itensFiltrados = this.state.filtroAtual === 'Todos' 
            ? itens 
            : itens.filter(i => i.tipo === this.state.filtroAtual);

        // Atualiza Stats
        const elTotal = document.getElementById('inv-total-items');
        const elGold = document.getElementById('inv-gold-value');
        if(elTotal) elTotal.textContent = itens.length;
        if(elGold) elGold.innerHTML = `${itens.length * 15} <i class="fa-solid fa-coins"></i>`;

        if (itensFiltrados.length === 0) {
            grid.innerHTML = '<p style="grid-column: span 5; text-align: center; color: #64748b; padding: 2rem; width: 100%;">Nenhum item encontrado.</p>';
            return;
        }

        grid.innerHTML = itensFiltrados.map(item => {
            const raridadeClass = `rarity-${item.tipo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`;
            
            // Guarda os dados do item como string JSON no atributo data-item
            // (Usamos escape para evitar quebrar as aspas do HTML)
            const itemJson = encodeURIComponent(JSON.stringify(item));

            // Cores para o título do tooltip
            let color = '#fff';
            if(item.tipo === 'Incomum') color = '#10b981';
            if(item.tipo === 'Raro') color = '#3b82f6';
            if(item.tipo === 'Épico') color = '#a855f7';
            if(item.tipo === 'Lendário') color = '#f59e0b';

            return `
                <div class="item-slot ${raridadeClass}" onclick="Inventario.inspecionar('${itemJson}')">
                    <i class="fa-solid ${item.icone}"></i>
                    
                    <div class="item-tooltip">
                        <span class="tooltip-title" style="color: ${color}">${item.nome}</span>
                        <span class="tooltip-desc">${item.desc}</span>
                        <span class="tooltip-source"><i class="fa-solid fa-book"></i> ${item.livroOrigem}</span>
                        <span class="tooltip-source" style="margin-top:2px; color:#fff; opacity:0.5; font-size:0.6rem;">(Clique para detalhes)</span>
                    </div>
                </div>`;
        }).join('');
    },

    // Nova função: Abre o modal de loot em modo "Inspeção"
    inspecionar: function(itemJson) {
        const item = JSON.parse(decodeURIComponent(itemJson));
        // Reutiliza o modal de Loot da Gamification, mas passando true para "isReplay"
        Gamification.mostrarModalLoot(item, true);
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
            // ATENÇÃO: Aqui salvamos mas NÃO mostramos o modal 50 vezes para não travar a tela
            // Apenas salvamos no banco
            await App.salvarLivro(livro, livro.firestoreId);
            novosItens++;
        }

        // Fecha o modal se tiver ficado aberto pelo ultimo loot
        const modal = document.getElementById('modal-loot');
        if(modal) modal.close();

        App.mostrarNotificacao(`${novosItens} novos itens adicionados à mochila!`, 'sucesso');
        this.render();
    }
};

App.init();