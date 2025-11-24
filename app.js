const Gamification = {
    config: { xpPorPagina: 1, xpBonusLivro: 50, fatorNivel: 0.15 },

    lootTable: [
        { id: 'pot_cafe', nome: 'Café Expresso', categoria: 'consumivel', tipo: 'Comum', icone: 'fa-mug-hot', desc: 'Um gole rápido de energia. +50 XP.', efeito: 'xp', valor: 50, dropRate: 30 },
        { id: 'pot_cha', nome: 'Chá de Camomila', categoria: 'consumivel', tipo: 'Comum', icone: 'fa-mug-saucer', desc: 'Acalma a mente. +60 XP.', efeito: 'xp', valor: 60, dropRate: 30 },
        { id: 'pot_energetico', nome: 'Energético Literário', categoria: 'consumivel', tipo: 'Incomum', icone: 'fa-bolt', desc: 'Foco laser! +150 XP.', efeito: 'xp', valor: 150, dropRate: 15 },
        { id: 'pot_sabedoria', nome: 'Elixir da Sabedoria', categoria: 'consumivel', tipo: 'Raro', icone: 'fa-flask', desc: 'Conhecimento puro. +300 XP.', efeito: 'xp', valor: 300, dropRate: 8 },
        { id: 'pot_memoria', nome: 'Frasco de Memória', categoria: 'consumivel', tipo: 'Épico', icone: 'fa-brain', desc: 'Lembrança total. +800 XP.', efeito: 'xp', valor: 800, dropRate: 3 },
        { id: 'eq_oculos', nome: 'Óculos de Leitura', categoria: 'equipamento', tipo: 'Comum', icone: 'fa-glasses', desc: 'Mais inteligente (+1 Charme).', dropRate: 20 },
        { id: 'eq_marcador', nome: 'Marcador de Papelão', categoria: 'equipamento', tipo: 'Comum', icone: 'fa-bookmark', desc: 'Simples e funcional.', dropRate: 20 },
        { id: 'eq_lupa', nome: 'Lupa de Detetive', categoria: 'equipamento', tipo: 'Incomum', icone: 'fa-magnifying-glass', desc: 'Encontra detalhes ocultos.', dropRate: 15 },
        { id: 'eq_kindle', nome: 'Tablet Arcano', categoria: 'equipamento', tipo: 'Raro', icone: 'fa-tablet-screen-button', desc: 'Milhares de mundos num vidro.', dropRate: 8 },
        { id: 'eq_pena', nome: 'Pena de Fênix', categoria: 'equipamento', tipo: 'Épico', icone: 'fa-feather-pointed', desc: 'Tinta infinita.', dropRate: 2 },
        { id: 'col_mapa_1', nome: 'Fragmento de Mapa (Norte)', categoria: 'colecionavel', tipo: 'Incomum', icone: 'fa-map', desc: 'Parte de um mapa antigo.', dropRate: 5 },
        { id: 'col_mapa_2', nome: 'Fragmento de Mapa (Sul)', categoria: 'colecionavel', tipo: 'Incomum', icone: 'fa-map-location', desc: 'Outra parte do mapa.', dropRate: 5 },
        { id: 'col_runa_antiga', nome: 'Runa Esquecida', categoria: 'colecionavel', tipo: 'Raro', icone: 'fa-cubes-stacked', desc: 'Pedra vibrante.', dropRate: 4 },
        { id: 'art_necro', nome: 'Página do Necronomicon', categoria: 'colecionavel', tipo: 'Lendário', icone: 'fa-book-skull', desc: 'Cuidado ao ler.', dropRate: 1 },
        { id: 'art_graal', nome: 'Cálice de Tinta', categoria: 'colecionavel', tipo: 'Lendário', icone: 'fa-wine-glass', desc: 'Inspiração infinita.', dropRate: 1 }
    ],

    archetypes: [
        { keys: ['paranormal', 'vampires', 'terror', 'horror', 'medo', 'thriller', 'suspense', 'dark', 'gothic', 'undead'], type: 'Undead', icon: 'fa-ghost', label: 'Espectro' },
        { keys: ['fantasy', 'discworld', 'beauty and the beast', 'cats', 'dungeons', 'dragons', 'fantasia', 'magic', 'mágica', 'wizard', 'epic', 'game'], type: 'Beast', icon: 'fa-dragon', label: 'Fera Mística' },
        { keys: ['science fiction', 'planets', 'extraterrestrial', 'alien', 'human-alien', 'ficção', 'sci-fi', 'space', 'cyber', 'future', 'robot'], type: 'Alien', icon: 'fa-satellite-dish', label: 'Alienígena' },
        { keys: ['biography', 'autobiography', 'humanoid', 'american', 'adventure', 'aventura', 'biografia', 'memoir', 'vida', 'alliances'], type: 'Humanoid', icon: 'fa-user-tie', label: 'Humanoide' },
        { keys: ['philosophy', 'history', 'história', 'guerra', 'war', 'sapiens', 'antigo', 'ancient', 'politics'], type: 'Ancient', icon: 'fa-scroll', label: 'Ancestral' },
        { keys: ['science', 'games & activities', 'técnico', 'dev', 'code', 'design', 'estudo', 'educação', 'marketing', 'business', 'software', 'tech'], type: 'Construct', icon: 'fa-robot', label: 'Constructo' },
        { keys: ['performing arts', 'drama', 'relationships', 'families', 'romance', 'love', 'amor', 'romantic', 'young adult', 'ya'], type: 'Elemental', icon: 'fa-heart-pulse', label: 'Elemental' },
        { keys: ['good and evil', 'religião', 'espiritual', 'faith', 'church', 'religion', 'christian', 'philosophy'], type: 'Celestial', icon: 'fa-sun', label: 'Celestial' },
        { keys: ['assassins', 'enemies', 'brigands', 'robbers', 'amnesiacs', 'mistério', 'mystery', 'crime', 'policial', 'detective', 'murder'], type: 'Shadow', icon: 'fa-user-secret', label: 'Sombra' },
        { keys: ['comics', 'graphic', 'gifted', 'hqs', 'manga', 'mangá'], type: 'Mutant', icon: 'fa-mask', label: 'Mutante' },
        { keys: ['fiction', 'juvenile', 'novel', 'literatura', 'literature'], type: 'Humanoid', icon: 'fa-user', label: 'Viajante' }
    ],

    gerarDadosMob: function(livro) {
        const paginas = parseInt(livro.paginas) || 200;
        const ano = parseInt(livro.anoLancamento) || 2025;
        const generos = (livro.categorias || '').toLowerCase();
        
        const nivel = Math.max(1, Math.floor(paginas / 50)); 
        const hp = paginas * 10;
        
        let archetype = { type: 'Minion', icon: 'fa-paw', label: 'Criatura' };
        
        for (const arch of this.archetypes) {
            if (arch.keys.some(k => generos.includes(k))) {
                archetype = arch;
                break;
            }
        }

        let modifiers = [];
        if (ano < 1980) modifiers.push({ id: 'ancient', label: 'Ancião', icon: 'fa-hourglass-half', rarity: 'rare' });
        if (paginas > 600) modifiers.push({ id: 'colossal', label: 'Colossal', icon: 'fa-mountain', rarity: 'epic' });
        if (paginas > 400 && ano < 2000) modifiers.push({ id: 'elite', label: 'Elite', icon: 'fa-star', rarity: 'uncommon' });

        const xpReward = Math.floor(paginas * 0.8);
        const goldReward = Math.floor(paginas * 0.4);

        return {
            level: nivel,
            hp: hp,
            hpMax: hp,
            type: archetype.type,
            typeLabel: archetype.label,
            typeIcon: archetype.icon,
            modifiers: modifiers,
            xpReward: xpReward,
            goldReward: goldReward,
            isBoss: paginas > 800
        };
    },

    getDifficultyColor: function(level) {
        if (level < 5) return '#94a3b8';
        if (level < 10) return '#10b981';
        if (level < 15) return '#3b82f6';
        if (level < 20) return '#a855f7';
        return '#ef4444';
    },

    calcularStats: function(livros) {
        if (!livros || !Array.isArray(livros)) {
            return { totalXP: 0, nivel: 1, xpProximo: 100, pctBarra: 0, classe: 'Novato' };
        }

        const livrosLidos = livros.filter(l => l && l.situacao === 'Lido');
        let totalXP = 0;
        
        livrosLidos.forEach(l => {
            const pags = parseInt(l.paginas, 10) || 0;
            totalXP += (pags * this.config.xpPorPagina) + this.config.xpBonusLivro;
        });

        livros.forEach(l => {
            if (l && l.loot && l.loot.consumido) {
                const valorXP = l.loot.valor || 0;
                totalXP += valorXP;
            }
        });

        const nivel = Math.floor(Math.sqrt(totalXP) * this.config.fatorNivel) + 1;
        const xpAtualNivelBase = Math.pow((nivel - 1) / this.config.fatorNivel, 2);
        const xpProximoNivel = Math.pow(nivel / this.config.fatorNivel, 2);
        
        let pctBarra = 0;
        if (xpProximoNivel > xpAtualNivelBase) {
            pctBarra = ((totalXP - xpAtualNivelBase) / (xpProximoNivel - xpAtualNivelBase)) * 100;
        }
        if(pctBarra > 100) pctBarra = 100; 
        if(pctBarra < 0) pctBarra = 0;

        const classesCount = {};
        livrosLidos.forEach(l => {
            const rpg = l.rpg || this.gerarDadosMob(l);
            const tipo = rpg.type || 'Minion';
            classesCount[tipo] = (classesCount[tipo] || 0) + 1;
        });
        
        const topTipo = Object.keys(classesCount).length > 0 
            ? Object.keys(classesCount).reduce((a, b) => classesCount[a] > classesCount[b] ? a : b) 
            : "Minion";
        
        return { totalXP, nivel, xpProximo: Math.floor(xpProximoNivel), pctBarra, classe: this.mapearClasseJogador(topTipo) };
    },

    mapearClasseJogador: function(tipoInimigoFavorito) {
        const map = {
            'Undead': 'Caçador de Sombras', 
            'Beast': 'Draconiano',         
            'Alien': 'Patrulheiro Estelar',
            'Ancient': 'Arqueólogo',       
            'Construct': 'Engenheiro',     
            'Humanoid': 'Diplomata',       
            'Elemental': 'Poeta',          
            'Shadow': 'Detetive',
            'Celestial': 'Paladino',
            'Mutant': 'Vigilante',
            'Minion': 'Aventureiro'
        };
        return map[tipoInimigoFavorito] || 'Novato';
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

        let isOracleBoosted = false;
        if (livro.oracle && livro.oracle.active) {
            isOracleBoosted = true;
            livro.oracle.active = false; 
        }

        let pool = [];
        if (isOracleBoosted) {
            this.lootTable.filter(i => i.tipo === 'Lendário' || i.tipo === 'Épico').forEach(item => pool.push(item));
             if(window.App) window.App.mostrarNotificacao('✨ A Profecia se Cumpriu! Loot Lendário!', 'sucesso');
        } else {
            this.lootTable.forEach(item => { for(let i=0; i < item.dropRate; i++) pool.push(item); });
        }
        
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
        btnColetar.onclick = () => { modal.close(); if(typeof Inventario !== 'undefined') Inventario.render(); };
    },
    
    atualizarInterface: function(livros) {
        if(!livros) return;
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

// --- APP PRINCIPAL ---
const App = {
    state: {
        todosOsLivros: [],
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

        if(this.authContainerEl) {
            this.authContainerEl.addEventListener('click', (e) => {
                const loginButton = e.target.closest('#btn-login');
                const logoutButton = e.target.closest('#btn-logout');
                if (loginButton) this.login();
                if (logoutButton) this.logout();
            });
        }
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
                
                if (user) {
                    this.carregarDadosDoFirebase();
                } else {
                    this.state.todosOsLivros = [];
                    this.state.challenges = [];
                    this.atualizarModulos();
                }
            });

        } catch (error) {
            console.error('Erro crítico:', error);
            this.mostrarNotificacao('Erro ao conectar.', 'erro');
        }
        
        // Botão Mágico (Só pra emergência, pode remover depois)
        setTimeout(() => this.criarBotaoMagico(), 3000);
    },

    // --- CORREÇÃO CRÍTICA AQUI: ROTA DO BANCO ---
    carregarDadosDoFirebase: async function() {
        this.mostrarNotificacao('Sincronizando dados...', 'info');
        try {
            // VOLTEI PARA A ROTA ANTIGA QUE FUNCIONAVA
            // Coleções na Raiz (Seu DB está aqui)
            
            this.state.db.collection('livros')
                .onSnapshot(snapshot => {
                    this.state.todosOsLivros = snapshot.docs.map(doc => ({ firestoreId: doc.id, ...doc.data() }));
                    this.atualizarModulos();
                });

            this.state.db.collection('challenges')
                .onSnapshot(snapshot => {
                    this.state.challenges = snapshot.docs.map(doc => ({ firestoreId: doc.id, ...doc.data() }));
                    this.atualizarModulos();
                });

            // Loja é um pouco mais complexa, vou assumir que está no usuário
            if (typeof Loja !== 'undefined') Loja.init();

        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            this.mostrarNotificacao("Falha ao carregar dados.", "erro");
        }
    },

    atualizarModulos: function() {
        if(typeof Estante !== 'undefined') Estante.init(this.state.todosOsLivros, this.state.challenges);
        if(typeof Dashboard !== 'undefined') Dashboard.init(this.state.todosOsLivros);
        if(typeof Inventario !== 'undefined') Inventario.render();
        if(typeof Gamification !== 'undefined') Gamification.atualizarInterface(this.state.todosOsLivros);
        if(typeof Oraculo !== 'undefined') Oraculo.render();
        if(typeof Desafio !== 'undefined') Desafio.init(this.state.challenges, this.state.todosOsLivros);
    },

    salvarLivro: async function(livro, id = null) {
        if (!this.state.user) return this.mostrarNotificacao("Faça login para salvar.", "erro");
        try {
            // VOLTEI PARA A ROTA ANTIGA NA RAIZ
            const collection = this.state.db.collection('livros');
            if (id) {
                await collection.doc(id).set(livro, {merge: true});
            } else {
                await collection.add(livro);
            }
        } catch (error) {
            console.error("Erro ao salvar:", error);
            this.mostrarNotificacao("Erro ao salvar.", "erro");
        }
    },

    excluirLivro: async function(id) {
        if (!this.state.user) return;
        try {
            // VOLTEI PARA A ROTA ANTIGA NA RAIZ
            await this.state.db.collection('livros').doc(id).delete();
            this.mostrarNotificacao("Livro removido.", "sucesso");
        } catch (error) {
            console.error("Erro ao excluir:", error);
        }
    },

    login: async function() {
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            await this.state.auth.signInWithPopup(provider);
            this.mostrarNotificacao("Login realizado!", "sucesso");
        } catch (error) {
            console.error(error);
            this.mostrarNotificacao("Erro no login.", "erro");
        }
    },

    logout: async function() {
        try {
            await this.state.auth.signOut();
            this.mostrarNotificacao("Desconectado.", "info");
            window.location.reload();
        } catch (error) {
            console.error(error);
        }
    },

    renderAuthUI: function() {
        if (this.state.user) {
            this.authContainerEl.innerHTML = `
                <div class="user-profile" style="display:flex; align-items:center; gap:10px;">
                    <img src="${this.state.user.photoURL}" alt="User" style="width:32px; height:32px; border-radius:50%;">
                    <div>
                        <span class="user-name" style="font-size:0.9rem; color:#fff; display:block;">${this.state.user.displayName}</span>
                        <button id="btn-logout" style="background:none; border:none; color:#94a3b8; font-size:0.7rem; cursor:pointer; padding:0;">Sair</button>
                    </div>
                </div>`;
        } else {
            this.authContainerEl.innerHTML = `<button id="btn-login" class="btn btn-primario" style="width:100%">Login com Google</button>`;
        }
    },

    toggleEditFeatures: function() {
        const editButtons = document.querySelectorAll('#painel-btn-editar, #painel-btn-excluir, #painel-btn-salvar, #form-notas, #painel-btn-nova-leitura');
        const addLink = document.querySelector('.nav-link[data-view="view-adicionar"]');
        const display = this.state.user ? 'block' : 'none';
        
        editButtons.forEach(btn => btn.style.display = display);
        if (addLink) addLink.style.display = display;
    },

    navegarPara: function(viewId) {
        this.views.forEach(v => v.classList.remove('active'));
        this.navLinks.forEach(l => l.classList.remove('active'));
        
        const target = document.getElementById(viewId);
        const link = document.querySelector(`.nav-link[data-view="${viewId}"]`);
        
        if (target) target.classList.add('active');
        if (link) link.classList.add('active');
        
        this.state.activeView = viewId;
        window.scrollTo(0, 0);
        
        if (viewId === 'view-dashboard' && typeof Dashboard !== 'undefined') Dashboard.atualizar(this.state.todosOsLivros);
        if (viewId === 'view-desafio' && typeof Desafio !== 'undefined') Desafio.atualizar(this.state.todosOsLivros);
        if (viewId === 'view-inventario' && typeof Inventario !== 'undefined') Inventario.render();
        if (viewId === 'view-loja' && typeof Loja !== 'undefined') Loja.render();
        if (viewId === 'view-oraculo' && typeof Oraculo !== 'undefined') Oraculo.render();
    },

    mostrarNotificacao: function(msg, tipo = 'info') {
        const notif = document.createElement('div');
        notif.className = `notificacao ${tipo}`;
        notif.innerHTML = `<i class="fa-solid ${tipo === 'sucesso' ? 'fa-check-circle' : tipo === 'erro' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i> ${msg}`;
        this.notificacaoContainerEl.appendChild(notif);
        setTimeout(() => notif.remove(), 3000);
    },

    criarBotaoMagico: function() {
        const antigo = document.getElementById('btn-magico-fix');
        if (antigo) antigo.remove();

        const btn = document.createElement('button');
        btn.id = 'btn-magico-fix';
        btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> CORRIGIR BESTIÁRIO';
        btn.style.cssText = "position:fixed; bottom:20px; left:20px; z-index:9999; padding:15px 25px; background:#a855f7; color:white; font-weight:bold; border:2px solid white; border-radius:8px; cursor:pointer; box-shadow:0 0 20px rgba(0,0,0,0.5); font-family:sans-serif; font-size:14px;";
        btn.onclick = () => this.rodarMigracaoInterna();
        document.body.appendChild(btn);
    },

    rodarMigracaoInterna: async function() {
        if (!confirm("Recalcular classes dos monstros agora?")) return;
        
        const btn = document.getElementById('btn-magico-fix');
        btn.disabled = true;
        btn.innerHTML = "⏳ Processando...";
        btn.style.background = "#334155";

        let count = 0;
        const livros = this.state.todosOsLivros;
        const delay = ms => new Promise(res => setTimeout(res, ms));

        for (const livro of livros) {
            const novoRPG = Gamification.gerarDadosMob(livro);
            const tipoAtual = (livro.rpg && livro.rpg.type) || 'Nenhum';
            
            if (tipoAtual !== novoRPG.type || tipoAtual === 'Minion') {
                livro.rpg = novoRPG;
                await this.salvarLivro(livro, livro.firestoreId);
                await delay(50); 
                count++;
                btn.innerHTML = `⏳ ${count} corrigidos...`;
            }
        }

        btn.innerHTML = `✅ SUCESSO! ${count} Livros`;
        btn.style.background = "#10b981";
        setTimeout(() => btn.remove(), 5000); 
    }
};

App.init();
window.App = App;