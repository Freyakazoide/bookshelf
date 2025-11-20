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
                this.navegarPara(e.target.dataset.view);
            });
        });

        this.authContainerEl.addEventListener('click', (e) => {
            const loginButton = e.target.closest('#btn-login');
            const logoutButton = e.target.closest('#btn-logout');

            if (loginButton) {
                this.login();
            }
            if (logoutButton) {
                this.logout();
            }
        });
    },

    init: async function() {
        console.log('Aplicativo iniciando com Firebase...');
        this.cacheDOM();
        this.bindEvents();
        
        try {
            // Certifique-se que firebaseConfig está carregado no HTML antes deste arquivo
            firebase.initializeApp(firebaseConfig);
            this.state.db = firebase.firestore();
            this.state.auth = firebase.auth();
            console.log('Firebase conectado com sucesso!');
            
            this.state.auth.onAuthStateChanged(user => {
                if (user) {
                    console.log('Usuário logado:', user.displayName, 'UID:', user.uid);
                    this.state.user = user;
                } else {
                    console.log('Nenhum usuário logado.');
                    this.state.user = null;
                }
                this.renderAuthUI();
                this.toggleEditFeatures();
            });
            
            await this.carregarDadosDoFirebase();

        } catch (error) {
            console.error('Falha crítica ao conectar ou carregar dados do Firebase:', error);
            this.mostrarNotificacao('Falha ao carregar dados. Verifique o console.', 'erro');
        }
    },

    carregarDadosDoFirebase: async function() {
        this.mostrarNotificacao('Carregando dados da nuvem...', 'info');
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

            console.log(`Carregados ${this.state.livros.length} livros e ${this.state.challenges.length} desafios.`);
            this.mostrarNotificacao('Dados carregados com sucesso!');

            // CORREÇÃO: Passando this.state.livros
            Gamification.atualizarInterface(this.state.livros);
            
            Estante.init(this.state.livros, this.state.challenges);
            Adicionar.init(this.state.livros);
            Dashboard.init(this.state.livros);
            Desafio.init(this.state.livros, this.state.challenges);

        } catch (error) {
            console.error("Erro ao buscar dados do Firestore:", error);
            this.mostrarNotificacao('Não foi possível carregar os dados do banco de dados.', 'erro');
        }
    },
    
    login: async function() {
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            await this.state.auth.signInWithPopup(provider);
            this.mostrarNotificacao('Login efetuado com sucesso!');
        } catch (error) {
            console.error("Erro ao fazer login:", error);
            this.mostrarNotificacao('Falha no login. Tente novamente.', 'erro');
        }
    },

    logout: async function() {
        try {
            await this.state.auth.signOut();
            this.mostrarNotificacao('Você foi desconectado.');
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
        }
    },

    renderAuthUI: function() {
        if (this.state.user) {
            this.authContainerEl.innerHTML = `
                <div class="auth-info">
                    <img src="${this.state.user.photoURL}" alt="Foto de perfil">
                    <p>${this.state.user.displayName}</p>
                    <button id="btn-logout" class="btn-logout"><i class="fa-solid fa-sign-out-alt"></i> Sair</button>
                </div>
            `;
        } else {
            this.authContainerEl.innerHTML = `
                <button id="btn-login" class="btn-login">
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" width="18">
                    <span>Login com Google</span>
                </button>
            `;
        }
    },

    toggleEditFeatures: function() {
        const editButtons = document.querySelectorAll('#painel-btn-editar, #painel-btn-excluir, #painel-btn-salvar, #form-notas, #painel-btn-nova-leitura');
        const addLink = document.querySelector('.nav-link[data-view="view-adicionar"]');
        
        if (this.state.user) {
            editButtons.forEach(btn => btn.style.display = 'block');
            if (addLink) addLink.style.display = 'block';
        } else {
            editButtons.forEach(btn => btn.style.display = 'none');
            if (addLink) addLink.style.display = 'none';
        }
    },

    salvarLivro: async function(livroData, firestoreId) {
        if (!this.state.user) {
            this.mostrarNotificacao('Você precisa estar logado para salvar alterações.', 'erro');
            return false;
        }
        const dadosParaSalvar = { ...livroData };
        delete dadosParaSalvar.firestoreId;
        try {
            if (firestoreId) {
                await this.state.db.collection('livros').doc(firestoreId).set(dadosParaSalvar, { merge: true });
            } else {
                await this.state.db.collection('livros').add(dadosParaSalvar);
            }
            await this.carregarDadosDoFirebase();
            return true;
        } catch (error) {
            console.error('Erro ao salvar livro:', error);
            this.mostrarNotificacao('Erro ao salvar o livro.', 'erro');
            return false;
        }
    },
    
    excluirLivro: async function(firestoreId) {
        if (!this.state.user) {
            this.mostrarNotificacao('Você precisa estar logado para excluir.', 'erro');
            return;
        }
        if (!firestoreId) return;
        try {
            await this.state.db.collection('livros').doc(firestoreId).delete();
            await this.carregarDadosDoFirebase();
            this.mostrarNotificacao('Livro excluído com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir livro:', error);
            this.mostrarNotificacao('Erro ao excluir o livro.', 'erro');
        }
    },
    
    salvarMetas: async function(metas) {
        if (!this.state.user) {
            this.mostrarNotificacao('Você precisa estar logado para salvar metas.', 'erro');
            return;
        }
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
            console.log('Metas salvas no Firestore com sucesso.');
        } catch (error) {
            console.error("Erro ao salvar metas no Firestore:", error);
            this.mostrarNotificacao('Ocorreu um erro ao salvar suas metas.', 'erro');
        }
    },

    navegarPara: function(viewId) {
        this.views.forEach(v => v.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');
        this.navLinks.forEach(l => l.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-link[data-view="${viewId}"]`);
        if (activeLink) activeLink.classList.add('active');
        this.state.activeView = viewId;
        window.scrollTo(0, 0);
        if (viewId === 'view-dashboard') {
            Dashboard.atualizar(this.state.livros);
        }
        if (viewId === 'view-desafio') {
            Desafio.atualizar(this.state.livros);
        }
    },

    mostrarNotificacao: function(mensagem, tipo = 'sucesso') {
        const notificacao = document.createElement('div');
        notificacao.className = `notificacao ${tipo}`;
        notificacao.textContent = mensagem;
        this.notificacaoContainerEl.appendChild(notificacao);
        setTimeout(() => {
            notificacao.remove();
        }, 3000);
    }
};

// --- OBJETO GAMIFICATION (ATUALIZADO ONDA 3) ---
const Gamification = {
    config: {
        xpPorPagina: 1,
        xpBonusLivro: 50,
        fatorNivel: 0.15
    },

    // --- TABELA DE LOOT (ITEMS) ---
    lootTable: [
        // COMUM (50% chance)
        { id: 'c1', nome: 'Marcador de Papel', tipo: 'Comum', icone: 'fa-bookmark', desc: 'Um marcador simples, mas funcional.', dropRate: 50 },
        { id: 'c2', nome: 'Café Frio', tipo: 'Comum', icone: 'fa-mug-hot', desc: 'Melhor que nada para manter os olhos abertos.', dropRate: 50 },
        { id: 'c3', nome: 'Lápis Mordido', tipo: 'Comum', icone: 'fa-pencil', desc: 'Alguém estava nervoso nesse capítulo.', dropRate: 50 },
        
        // INCOMUM (30% chance)
        { id: 'u1', nome: 'Vela Aromática', tipo: 'Incomum', icone: 'fa-fire', desc: 'Ambiente perfeito para leitura.', dropRate: 30 },
        { id: 'u2', nome: 'Post-it Neon', tipo: 'Incomum', icone: 'fa-note-sticky', desc: 'Para marcar as melhores frases.', dropRate: 30 },
        { id: 'u3', nome: 'Playlist Lo-Fi', tipo: 'Incomum', icone: 'fa-headphones', desc: '+10% de concentração.', dropRate: 30 },

        // RARO (15% chance)
        { id: 'r1', nome: 'Edição Capa Dura', tipo: 'Raro', icone: 'fa-book', desc: 'Pesado, bonito e durável.', dropRate: 15 },
        { id: 'r2', nome: 'Óculos de Leitura', tipo: 'Raro', icone: 'fa-glasses', desc: 'Você parece mais inteligente com eles.', dropRate: 15 },

        // ÉPICO (4% chance)
        { id: 'e1', nome: 'Pena de Fênix', tipo: 'Épico', icone: 'fa-feather-pointed', desc: 'Dizem que escreve o futuro.', dropRate: 4 },
        { id: 'e2', nome: 'Luminária Mágica', tipo: 'Épico', icone: 'fa-lightbulb', desc: 'Permite ler no escuro total.', dropRate: 4 },

        // LENDÁRIO (1% chance)
        { id: 'l1', nome: 'O Necronomicon', tipo: 'Lendário', icone: 'fa-book-skull', desc: 'Cuidado ao ler em voz alta...', dropRate: 1 },
        { id: 'l2', nome: 'Ticket Dourado', tipo: 'Lendário', icone: 'fa-ticket', desc: 'Acesso à biblioteca secreta.', dropRate: 1 }
    ],

    // Calcula Stats (Mantido igual)
    calcularStats: function(livros) {
        const livrosLidos = livros.filter(l => l.situacao === 'Lido');
        let totalXP = 0;
        livrosLidos.forEach(l => {
            const pags = parseInt(l.paginas, 10) || 0;
            totalXP += (pags * this.config.xpPorPagina);
            totalXP += this.config.xpBonusLivro;
        });

        const nivel = Math.floor(Math.sqrt(totalXP) * this.config.fatorNivel) + 1;
        const xpAtualNivelBase = Math.pow((nivel - 1) / this.config.fatorNivel, 2);
        const xpProximoNivel = Math.pow(nivel / this.config.fatorNivel, 2);
        
        const range = xpProximoNivel - xpAtualNivelBase;
        const progresso = totalXP - xpAtualNivelBase;
        let pctBarra = (progresso / range) * 100;
        if(pctBarra > 100) pctBarra = 100;
        if(totalXP === 0) pctBarra = 0;

        const generos = {};
        livrosLidos.forEach(l => {
            if(l.categorias) {
                l.categorias.split(',').forEach(cat => {
                    const c = cat.trim();
                    if(c) generos[c] = (generos[c] || 0) + 1;
                });
            }
        });
        
        const topGenero = Object.keys(generos).reduce((a, b) => generos[a] > generos[b] ? a : b, "Novato");
        const classeRPG = this.mapearGeneroParaClasse(topGenero);

        return { totalXP, nivel, xpProximo: Math.floor(xpProximoNivel), pctBarra, classe: classeRPG, generoDominante: topGenero };
    },

    mapearGeneroParaClasse: function(genero) {
        const mapa = { 'Fantasia': 'Arcanista', 'Ficção Científica': 'Tecnomante', 'Sci-Fi': 'Tecnomante', 'Terror': 'Caçador', 'Horror': 'Caçador', 'Romance': 'Bardo', 'Poesia': 'Bardo', 'Thriller': 'Ladino', 'Suspense': 'Ladino', 'Policial': 'Investigador', 'Não-Ficção': 'Sábio', 'Biografia': 'Historiador', 'Técnico': 'Artífice', 'Programação': 'Netrunner', 'Novato': 'Aventureiro' };
        return mapa[genero] || 'Aventureiro';
    },

    getClassificacaoMob: function(paginas) {
        const pags = parseInt(paginas, 10) || 0;
        if (pags >= 1000) return { tipo: 'worldboss', label: '☠️ WORLD BOSS', classe: 'mob-worldboss', icone: 'fa-dragon', cor: '#f59e0b' };
        if (pags >= 700) return { tipo: 'boss', label: 'Raid Boss', classe: 'mob-boss', icone: 'fa-skull', cor: '#ef4444' };
        if (pags >= 500) return { tipo: 'miniboss', label: 'Mini-Boss', classe: 'mob-miniboss', icone: 'fa-dungeon', cor: '#a855f7' };
        if (pags >= 300) return { tipo: 'elite', label: 'Elite Mob', classe: 'mob-elite', icone: 'fa-shield-halved', cor: '#3b82f6' };
        if (pags >= 150) return { tipo: 'common', label: 'Mob', classe: 'mob-common', icone: 'fa-ghost', cor: '#10b981' };
        return { tipo: 'minion', label: 'Minion', classe: 'mob-minion', icone: 'fa-bug', cor: '#94a3b8' };
    },

    // --- FUNÇÃO NOVA: GERAR DROP ---
 gerarLoot: function(livro) {
        // 1. Anti-Exploit: Verifica se o livro JÁ TEM loot salvo
        if (livro.loot) {
            console.log("Loot recuperado da memória do livro:", livro.loot);
            // Opcional: Se quiser mostrar o modal novamente apenas para relembrar
            // this.mostrarModalLoot(livro.loot, true); 
            return livro.loot;
        }

        // 2. Se não tem, roda o RNG (Apenas na 1ª vez)
        let pool = [];
        this.lootTable.forEach(item => {
            for(let i=0; i < item.dropRate; i++) pool.push(item);
        });
        
        const itemSorteado = pool[Math.floor(Math.random() * pool.length)];
        
        // 3. Vincula o item ao livro (Cria o objeto loot)
        const lootData = {
            idItem: itemSorteado.id,
            nome: itemSorteado.nome,
            tipo: itemSorteado.tipo,
            icone: itemSorteado.icone,
            desc: itemSorteado.desc,
            dataDrop: new Date().toISOString()
        };

        // 4. Salva no objeto do livro (Isso será persistido no Firebase pelo estante.js)
        livro.loot = lootData;
        
        // 5. Mostra a recompensa
        this.mostrarModalLoot(lootData, false);
        
        return lootData;
    },

    mostrarModalLoot: function(item, isReplay) {
        const modal = document.getElementById('modal-loot');
        const container = modal.querySelector('.loot-container');
        const rarityText = document.getElementById('loot-rarity-text');
        const cardContent = document.getElementById('loot-card-content');
        const descText = document.getElementById('loot-desc-text');
        const btnColetar = document.getElementById('btn-coletar-loot');
        const titleMain = modal.querySelector('.loot-title');

        // Classes de cor
        container.className = `loot-container loot-${item.tipo === 'Comum' ? 'common' : item.tipo === 'Incomum' ? 'uncommon' : item.tipo === 'Raro' ? 'rare' : item.tipo === 'Épico' ? 'epic' : 'legendary'}`;
        
        titleMain.textContent = isReplay ? "Item Recuperado!" : "Quest Complete!";
        rarityText.textContent = `${item.tipo} Drop`;
        descText.textContent = item.desc;
        
        cardContent.innerHTML = `
            <i class="fa-solid ${item.icone} loot-icon"></i>
            <div class="loot-title">${item.nome}</div>
        `;

        modal.showModal();

        btnColetar.onclick = () => { modal.close(); };
    },

    atualizarInterface: function(livros) {
        const stats = this.calcularStats(livros);
        const elNivel = document.getElementById('player-level-badge');
        const elClasse = document.getElementById('player-class');
        const elXPAtual = document.getElementById('xp-current');
        const elXPProx = document.getElementById('xp-next');
        const elBarra = document.getElementById('xp-bar-fill');
        
        if(!elNivel) return;

        elNivel.textContent = stats.nivel;
        elClasse.textContent = stats.classe;
        elXPAtual.textContent = `${Math.floor(stats.totalXP)} XP`;
        elXPProx.textContent = `Prox: ${stats.xpProximo}`;
        elBarra.style.width = `${stats.pctBarra}%`;

        elClasse.className = 'player-class';
        if(['Arcanista', 'Bardo'].includes(stats.classe)) elClasse.classList.add('mago');
        if(['Ladino', 'Caçador', 'Netrunner'].includes(stats.classe)) elClasse.classList.add('ladino');
        if(['Sábio', 'Artífice', 'Historiador'].includes(stats.classe)) elClasse.classList.add('tank');
    }
};

const Inventario = {
    filtrar: function(raridade) {
        this.render(raridade);
    },

    render: function(filtroRaridade = 'Todos') {
        const grid = document.getElementById('grid-inventario');
        if (!grid) return;

        // Pega todos os livros carregados no App
        const livros = App.state.livros || [];
        
        // Filtra apenas livros LIDOS que tem LOOT
        // IMPORTANTE: Se o usuário reverteu para "Lendo", o livro.situacao não será 'Lido', 
        // então o item some do inventário (mas continua salvo no livro para o futuro).
        const itens = livros
            .filter(l => l.situacao === 'Lido' && l.loot)
            .map(l => ({ ...l.loot, livroOrigem: l.nomeDoLivro }));

        // Filtro de UI (Botões)
        const itensFiltrados = filtroRaridade === 'Todos' 
            ? itens 
            : itens.filter(i => i.tipo === filtroRaridade);

        // Stats
        document.getElementById('inv-total-items').textContent = itens.length;
        const valorTotal = itens.length * 10; // Exemplo: 10 gold por item
        document.getElementById('inv-gold-value').innerHTML = `${valorTotal} <i class="fa-solid fa-coins"></i>`;

        if (itensFiltrados.length === 0) {
            grid.innerHTML = '<p style="grid-column: span 3; text-align: center; color: #64748b; padding: 2rem;">Sua mochila está vazia.</p>';
            return;
        }

        grid.innerHTML = itensFiltrados.map(item => {
            const raridadeClass = `rarity-${item.tipo.toLowerCase().replace('é', 'e').replace('á', 'a')}`; // ex: rarity-epico
            return `
                <div class="item-slot ${raridadeClass}">
                    <i class="fa-solid ${item.icone}"></i>
                    <div class="item-tooltip">
                        <span class="tooltip-title" style="color: var(--loot-${item.tipo === 'Comum' ? 'common' : item.tipo === 'Incomum' ? 'uncommon' : item.tipo === 'Raro' ? 'rare' : item.tipo === 'Épico' ? 'epic' : 'legendary'})">${item.nome}</span>
                        <span class="tooltip-desc">${item.desc}</span>
                        <span class="tooltip-source">Drop: ${item.livroOrigem}</span>
                    </div>
                </div>
            `;
        }).join('');
    }
};

App.init();