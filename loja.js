const Loja = {
    catalog: [
        // --- TEMAS GLOBAIS ---
        { id: 'theme_default', type: 'tema', name: 'Padrão da Guilda', price: 0, desc: 'O visual clássico do sistema.', cssClass: '' },
        { id: 'theme_pergaminho', type: 'tema', name: 'Pergaminho Antigo', price: 500, desc: 'Tons de sépia e fontes serifadas para historiadores.', cssClass: 'theme-pergaminho' },
        { id: 'theme_cyberpunk', type: 'tema', name: 'Cyberpunk 2077', price: 1200, desc: 'Neon, contraste alto e terminais de hack.', cssClass: 'theme-cyberpunk' },
        { id: 'theme_dracula', type: 'tema', name: 'Conde Drácula', price: 800, desc: 'Cores escuras, roxo vibrante e elegância gótica.', cssClass: 'theme-dracula' },

        // --- MOLDURAS DE AVATAR ---
        { id: 'frame_none', type: 'frame', name: 'Sem Moldura', price: 0, desc: 'Simples e limpo.', cssClass: '' },
        { id: 'frame_gold', type: 'frame', name: 'Borda de Ouro', price: 300, desc: 'Ostente sua riqueza.', cssClass: 'frame-gold' },
        { id: 'frame_fire', type: 'frame', name: 'Espírito de Fogo', price: 1500, desc: 'Animação de chamas para leitores vorazes.', cssClass: 'frame-fire' },

        // --- SKINS DE CARD (ESTANTE) ---
        { id: 'cardbg_default', type: 'cardbg', name: 'Padrão', price: 0, desc: 'Fundo escuro padrão.', cssClass: '' },
        { id: 'cardbg_leather', type: 'cardbg', name: 'Couro Gasto', price: 400, desc: 'Textura de couro para seus livros.', cssClass: 'cardbg-leather' },
    ],

    state: {
        gold: 0,
        unlocked: ['theme_default', 'frame_none', 'cardbg_default'],
        active: { theme: 'theme_default', frame: 'frame_none', cardbg: 'cardbg_default' },
        filter: 'todos'
    },

    init: async function() {
        this.cacheDOM();
        this.bindEvents();
        await this.carregarDadosUsuario(); // Carrega do Firebase
        this.render();
        this.aplicarVisuais(); // Aplica ao carregar a página
    },

    cacheDOM: function() {
        this.gridEl = document.getElementById('grid-loja');
        this.saldoEl = document.getElementById('loja-saldo-gold');
        this.tabs = document.querySelectorAll('.btn-tab-loja');
    },

    bindEvents: function() {
        this.tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.tabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.state.filter = e.target.dataset.cat;
                this.render();
            });
        });

        this.gridEl.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-comprar-item');
            if (btn) this.comprarOuEquipar(btn.dataset.id);
        });
    },

carregarDadosUsuario: async function() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    try {
        const doc = await firebase.firestore().collection('users').doc(user.uid).get();
        
        if (doc.exists) {
            const data = doc.data();
            this.state.gold = data.gold || 0;
            this.state.unlocked = data.unlockedCosmetics || this.state.unlocked;
            this.state.active = data.activeCosmetics || this.state.active;
        } else {
            const dadosIniciais = {
                gold: 1500, // Começa com 1500 de ouro
                unlockedCosmetics: ['theme_default', 'frame_none', 'cardbg_default'],
                activeCosmetics: {
                    theme: 'theme_default',
                    frame: 'frame_none',
                    cardBg: 'cardbg_default'
                }
            };
            
            await firebase.firestore().collection('users').doc(user.uid).set(dadosIniciais);
            
            this.state.gold = dadosIniciais.gold;
            this.state.unlocked = dadosIniciais.unlockedCosmetics;
            this.state.active = dadosIniciais.activeCosmetics;
        }
    } catch (e) { console.error("Erro ao carregar perfil:", e); }
},

    salvarDados: async function() {
        const user = firebase.auth().currentUser;
        if (!user) return;
        await firebase.firestore().collection('users').doc(user.uid).set({
            gold: this.state.gold,
            unlockedCosmetics: this.state.unlocked,
            activeCosmetics: this.state.active
        }, { merge: true });
        this.atualizarInterfaceApp();
    },

    comprarOuEquipar: function(itemId) {
        const item = this.catalog.find(i => i.id === itemId);
        const possui = this.state.unlocked.includes(itemId);

        if (possui) {
            // Equipar
            if (item.type === 'tema') this.state.active.theme = itemId;
            if (item.type === 'frame') this.state.active.frame = itemId;
            if (item.type === 'cardbg') this.state.active.cardbg = itemId;
            this.aplicarVisuais();
            this.salvarDados();
            this.render();
            App.mostrarNotificacao(`${item.name} equipado!`);
        } else {
            // Comprar
            if (this.state.gold >= item.price) {
                if(!confirm(`Comprar "${item.name}" por ${item.price} Gold?`)) return;
                
                this.state.gold -= item.price;
                this.state.unlocked.push(itemId);
                this.salvarDados();
                this.render();
                App.mostrarNotificacao('Compra realizada com sucesso!');
                
                // Toca som de moeda (opcional)
                // const audio = new Audio('coin.mp3'); audio.play();
            } else {
                App.mostrarNotificacao('Ouro insuficiente!', 'erro');
            }
        }
    },

    aplicarVisuais: function() {
        // 1. Temas
        document.body.className = ''; // Limpa classes anteriores
        const themeItem = this.catalog.find(i => i.id === this.state.active.theme);
        if (themeItem && themeItem.cssClass) document.body.classList.add(themeItem.cssClass);

        // 2. Frames (Manipula DOM do Avatar)
        const avatarContainer = document.querySelector('.player-avatar-container');
        if (avatarContainer) {
            avatarContainer.className = 'player-avatar-container'; // Reset
            const frameItem = this.catalog.find(i => i.id === this.state.active.frame);
            if (frameItem && frameItem.cssClass) avatarContainer.classList.add(frameItem.cssClass);
        }

        // 3. Card Backgrounds (Via Variável CSS Global)
        const bgItem = this.catalog.find(i => i.id === this.state.active.cardbg);
        if (bgItem) {
            // Define variável CSS que será usada nos cards
            // Ex: Definir --card-texture-url ou apenas classe no body que afeta cards
            if(bgItem.cssClass) document.body.setAttribute('data-card-skin', bgItem.cssClass);
            else document.body.removeAttribute('data-card-skin');
        }
    },

    render: function() {
        if (this.saldoEl) this.saldoEl.innerHTML = `${this.state.gold} <i class="fa-solid fa-coins"></i>`;

        let itensParaMostrar = this.catalog;
        if (this.state.filter !== 'todos') {
            itensParaMostrar = this.catalog.filter(i => i.type === this.state.filter);
        }

        this.gridEl.innerHTML = itensParaMostrar.map(item => {
            const possui = this.state.unlocked.includes(item.id);
            const equipado = (this.state.active.theme === item.id || this.state.active.frame === item.id || this.state.active.cardbg === item.id);
            
            let btnLabel = `<i class="fa-solid fa-coins"></i> ${item.price}`;
            let btnClass = '';
            
            if (possui) {
                btnLabel = equipado ? 'EQUIPADO' : 'EQUIPAR';
                btnClass = equipado ? 'btn-equipado' : 'btn-possuido';
            }

            return `
            <div class="loja-card ${possui ? 'owned' : ''} ${equipado ? 'equipped' : ''}">
                <div class="loja-card-preview" data-id="${item.id}" data-type="${item.type}">
                    ${item.type === 'frame' ? '<img src="https://ui-avatars.com/api/?name=User" class="preview-avatar">' : ''}
                    ${item.type === 'tema' ? '<div class="mini-ui-lines"><span></span><span></span></div>' : ''}
                </div>
                <div class="loja-card-info">
                    <h4>${item.name}</h4>
                    <p>${item.desc}</p>
                    <button class="btn btn-primario btn-comprar-item ${btnClass}" data-id="${item.id}" ${equipado ? 'disabled' : ''}>
                        ${btnLabel}
                    </button>
                </div>
            </div>`;
        }).join('');
    },
    
    atualizarInterfaceApp: function() {
        // Atualiza display de ouro em outros lugares se necessário
        const invGold = document.getElementById('inv-gold-value');
        if(invGold) invGold.innerHTML = `${this.state.gold} <i class="fa-solid fa-coins"></i> (Saldo)`;
    }
};