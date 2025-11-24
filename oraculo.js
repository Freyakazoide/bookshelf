const Oraculo = {
    config: { 
        custoNormal: 50,
        custoReroll: 100,
        tempoBuffHoras: 48 
    },

    // Variável para saber qual livro estamos olhando no painel principal
    selectedBookId: null,

    buffTypes: {
        fortune: {
            label: "A Roda da Fortuna",
            desc: "Loot Lendário (100%) garantido ao terminar.",
            icon: "fa-gem",
            color: "#a855f7"
        },
        hermit: {
            label: "O Eremita",
            desc: "Ganhe +50% de XP ao concluir esta leitura.",
            icon: "fa-graduation-cap",
            color: "#3b82f6"
        },
        emperor: {
            label: "O Imperador",
            desc: "Recompensa de Ouro em DOBRO ao terminar.",
            icon: "fa-crown",
            color: "#f59e0b"
        }
    },

    init: function() { 
        this.cacheDOM(); 
        this.bindEvents(); 
    },

    cacheDOM: function() {
        this.view = document.getElementById('view-oraculo');
        this.slotMachine = document.getElementById('oraculo-slot-machine');
        this.resultadoContainer = document.getElementById('oraculo-resultado');
        this.slotTrack = document.getElementById('slot-track');
        this.btnInvocar = document.getElementById('btn-invocar-oraculo');
        this.btnReroll = document.getElementById('btn-reroll');
        this.cardLocal = document.getElementById('card-livro-oraculo');
        this.timerDisplay = document.getElementById('oracle-timer');
        this.balanceDisplay = document.getElementById('oracle-gold-value');
        this.custoInicialDisplay = document.querySelector('.custo-display span');
        this.buffInfoContainer = document.querySelector('.buff-info-card');
        this.historyList = document.getElementById('oraculo-history-list');
    },

    bindEvents: function() {
        if(this.btnInvocar) this.btnInvocar.addEventListener('click', () => this.girarRoleta(false));
        if(this.btnReroll) this.btnReroll.addEventListener('click', () => this.girarRoleta(true));
    },

    // --- FIX CRÍTICO: Usa todosOsLivros e blinda contra undefined ---
    getLivros: function() {
        if (window.App && window.App.state && window.App.state.todosOsLivros) {
            return window.App.state.todosOsLivros;
        }
        return [];
    },

    filtrarCandidatos: function() {
        const livros = this.getLivros();
        if (livros.length === 0) return [];

        let candidatos = livros.filter(l => l.situacao === 'Quero Ler');
        const lidos = livros.filter(l => l.situacao === 'Lido');
        
        candidatos = candidatos.filter(livro => {
            if (!livro.colecao || !livro.volume) return true;
            const volAtual = parseInt(livro.volume);
            if (isNaN(volAtual) || volAtual <= 1) return true;
            return lidos.some(l => l.colecao === livro.colecao && parseInt(l.volume) === (volAtual - 1));
        });
        return candidatos;
    },

    render: function() {
        this.init(); 
        this.atualizarSaldoVisual();
        
        if(this.custoInicialDisplay) {
            this.custoInicialDisplay.innerHTML = `${this.config.custoNormal} <i class="fa-solid fa-coins"></i>`;
        }

        const livros = this.getLivros();
        if (livros.length === 0) return; // Não faz nada se ainda não carregou

        let livroParaMostrar = null;

        if (this.selectedBookId) {
            livroParaMostrar = livros.find(l => l.firestoreId === this.selectedBookId);
        } else {
            const ativos = livros
                .filter(l => l.oracle && l.oracle.active)
                .sort((a, b) => b.oracle.timestamp - a.oracle.timestamp);
            
            if (ativos.length > 0) livroParaMostrar = ativos[0];
        }

        this.renderHistory(livroParaMostrar ? livroParaMostrar.firestoreId : null);

        if (livroParaMostrar) {
            this.mostrarResultado(livroParaMostrar, false);
        } else {
            this.mostrarSlotMachine();
        }
    },

    verDetalhes: function(id) {
        this.selectedBookId = id;
        this.render(); 
    },

    renderHistory: function(activeId) {
        if (!this.historyList) return;
        
        const livros = this.getLivros();
        const historico = livros
            .filter(l => l.oracle) 
            .sort((a, b) => b.oracle.timestamp - a.oracle.timestamp);

        if (historico.length === 0) {
            this.historyList.innerHTML = '<div style="padding:20px; text-align:center; color:#64748b; font-style:italic;">Nenhuma visão revelada ainda.</div>';
            return;
        }

        this.historyList.innerHTML = historico.map(l => {
            const isActive = l.oracle.active;
            const isExpired = (l.oracle.expires < Date.now());
            const data = new Date(l.oracle.timestamp).toLocaleDateString();
            
            let visualClass = ''; 
            let badgeHtml = '';

            if (isActive && !isExpired) {
                visualClass = 'active-buff';
                badgeHtml = '<span class="hist-badge ativo">Ativo</span>';
            } else if (isActive && isExpired) {
                 visualClass = 'expired-buff';
                 badgeHtml = '<span class="hist-badge expirado">Expirado</span>';
            } else {
                badgeHtml = '<span class="hist-badge passado">Passado</span>';
            }

            if (l.firestoreId === activeId) visualClass += ' viewing';

            return `
                <div class="hist-card ${visualClass}" onclick="Oraculo.verDetalhes('${l.firestoreId}')">
                    <img src="${l.urlCapa || 'placeholder.jpg'}" class="hist-cover">
                    <div class="hist-info">
                        <h4>${l.nomeDoLivro}</h4>
                        <div class="hist-meta">
                            ${badgeHtml}
                            <span class="hist-date">${data}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    atualizarSaldoVisual: function() {
        if (typeof Loja !== 'undefined' && this.balanceDisplay) {
            this.balanceDisplay.innerHTML = `${Loja.state.gold} <i class="fa-solid fa-coins"></i>`;
        }
    },

    mostrarSlotMachine: function() {
        if(this.selectedBookId !== null) {
            // Lógica de reset visual
        }
        
        this.slotMachine.classList.remove('hidden');
        this.resultadoContainer.classList.add('hidden');
        
        if(this.btnInvocar) {
            this.btnInvocar.disabled = false;
            this.btnInvocar.innerHTML = '<i class="fa-solid fa-hat-wizard"></i> INVOCAR O DESTINO';
        }
    },

    mostrarResultado: function(livro, animar) {
        if (!animar) { 
            this.slotMachine.classList.add('hidden'); 
            this.resultadoContainer.classList.remove('hidden'); 
        }

        const capa = livro.urlCapa || 'placeholder.jpg';
        const paginas = parseInt(livro.paginas) || 0;
        
        // Usa Gamification se existir, senão fallback
        const mob = (typeof Gamification !== 'undefined') ? Gamification.getClassificacaoMob(paginas) : { cor: '#fff', label: 'Livro' };

        this.cardLocal.innerHTML = `
            <div class="oracle-rich-card">
                <div class="oracle-cover-col">
                    <img src="${capa}" class="oracle-cover-img">
                </div>
                <div class="oracle-info-col">
                    <span class="oracle-mob-badge" style="background:${mob.cor}; color:#000;">${mob.label}</span>
                    <h3>${livro.nomeDoLivro}</h3>
                    <p class="oracle-author">${livro.autor}</p>
                    
                    <div class="oracle-stats-grid">
                        <div class="o-stat"><i class="fa-solid fa-file"></i> ${paginas} págs</div>
                        <div class="o-stat"><i class="fa-solid fa-calendar"></i> ${livro.anoLancamento || 'N/A'}</div>
                        <div class="o-stat"><i class="fa-solid fa-layer-group"></i> ${livro.editora || 'N/A'}</div>
                        <div class="o-stat"><i class="fa-solid fa-tags"></i> ${livro.categorias || '-'}</div>
                    </div>
                </div>
            </div>
        `;

        const buffType = livro.oracle.type || 'fortune';
        const buffData = this.buffTypes[buffType];
        
        const expired = livro.oracle.expires < Date.now();
        const active = livro.oracle.active;

        this.buffInfoContainer.style.borderColor = buffData.color;
        this.buffInfoContainer.style.background = `linear-gradient(135deg, ${buffData.color}10, rgba(15, 23, 42, 0.4))`;
        
        let statusMsg = '';
        if (!active) statusMsg = '<div style="color:#64748b; margin-top:10px;">Buff Desativado/Substituído</div>';
        else if (expired) statusMsg = '<div style="color:#ef4444; margin-top:10px; font-weight:bold;">BUFF EXPIRADO</div>';
        else statusMsg = `<div class="timer-display" id="oracle-timer">Calculando...</div>`;

        this.buffInfoContainer.innerHTML = `
            <h4 style="color:${buffData.color}; margin-bottom:5px;"><i class="fa-solid ${buffData.icon}"></i> Carta: ${buffData.label}</h4>
            <p>${buffData.desc}</p>
            ${statusMsg}
        `;
        
        if (active && !expired) {
            this.timerDisplay = document.getElementById('oracle-timer');
            this.iniciarTimer(livro.oracle.expires);
        }

        if (active && !expired) {
            this.btnReroll.classList.remove('hidden');
            this.btnReroll.innerHTML = `<i class="fa-solid fa-rotate"></i> Desafiar o Destino (Custo: ${this.config.custoReroll} <i class="fa-solid fa-coins"></i>)`;
        } else {
            this.btnReroll.classList.add('hidden');
        }
    },

    iniciarTimer: function(expiryDate) {
        if (this.timerInterval) clearInterval(this.timerInterval);
        const update = () => {
            const diff = expiryDate - Date.now();
            if (diff <= 0) { 
                if(this.timerDisplay) {
                    this.timerDisplay.textContent = "EXPIRADO"; 
                    this.timerDisplay.style.color = "#ef4444";
                }
                clearInterval(this.timerInterval); 
                return; 
            }
            const h = Math.floor(diff / 3600000); 
            const m = Math.floor((diff % 3600000) / 60000);
            if(this.timerDisplay) this.timerDisplay.textContent = `Expira em: ${h}h ${m}m`;
        };
        update(); 
        this.timerInterval = setInterval(update, 60000);
    },

    sortearBuff: function() {
        const keys = Object.keys(this.buffTypes);
        return keys[Math.floor(Math.random() * keys.length)];
    },

    abrirNovoSorteio: function() {
        this.selectedBookId = null;
        this.render();
    },

    girarRoleta: async function(isReroll) {
        if (typeof Loja === 'undefined') return App.mostrarNotificacao('Loja offline.', 'erro');
        
        const custo = isReroll ? this.config.custoReroll : this.config.custoNormal;
        
        if (Loja.state.gold < custo) {
            return App.mostrarNotificacao(`Sem Ouro! Custo: ${custo} | Saldo: ${Loja.state.gold}`, 'erro');
        }

        let candidatos = this.filtrarCandidatos();
        
        if (isReroll && this.selectedBookId) {
            candidatos = candidatos.filter(l => l.firestoreId !== this.selectedBookId);
        }

        if (candidatos.length === 0) return App.mostrarNotificacao('Nenhum outro livro disponível para sorteio!', 'info');

        Loja.state.gold -= custo;
        await Loja.salvarDados();
        this.atualizarSaldoVisual();

        this.slotMachine.classList.remove('hidden'); 
        this.resultadoContainer.classList.add('hidden');
        this.btnInvocar.disabled = true; 
        this.btnInvocar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> O DESTINO GIRA...';
        if(this.btnReroll) this.btnReroll.disabled = true;

        const vencedor = candidatos[Math.floor(Math.random() * candidatos.length)];
        let listaVisual = [];
        for(let i=0; i<20; i++) listaVisual.push(candidatos[Math.floor(Math.random() * candidatos.length)]);
        listaVisual.push(vencedor);

        this.slotTrack.innerHTML = listaVisual.map(l => 
            `<div class="slot-item"><img src="${l.urlCapa || 'placeholder.jpg'}"></div>`
        ).join('');
        
        this.slotTrack.style.transition = 'none'; 
        this.slotTrack.style.transform = 'translateY(0)';
        this.slotTrack.offsetHeight; 

        this.slotTrack.style.transition = 'transform 3s cubic-bezier(0.1, 0.7, 0.1, 1)';
        const cardHeight = 270; 
        this.slotTrack.style.transform = `translateY(-${(listaVisual.length - 1) * cardHeight}px)`;

        setTimeout(async () => {
            if (isReroll && this.selectedBookId) {
                const livroAntigo = this.getLivros().find(l => l.firestoreId === this.selectedBookId);
                if (livroAntigo) {
                    livroAntigo.oracle.active = false; 
                    await App.salvarLivro(livroAntigo, livroAntigo.firestoreId);
                }
            }

            const novoBuffType = this.sortearBuff();

            vencedor.oracle = { 
                active: true, 
                type: novoBuffType,
                timestamp: Date.now(), 
                expires: Date.now() + (this.config.tempoBuffHoras * 3600000) 
            };
            
            await App.salvarLivro(vencedor, vencedor.firestoreId);
            
            this.selectedBookId = vencedor.firestoreId; 
            this.render(); 
            
            App.mostrarNotificacao(`Carta: ${this.buffTypes[novoBuffType].label}!`, 'sucesso');
            if(typeof Estante !== 'undefined') Estante.render(); 

        }, 3000);
    }
};