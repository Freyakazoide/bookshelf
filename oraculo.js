const Oraculo = {
    config: { 
        custoNormal: 50,    // Preço inicial
        custoReroll: 100,   // Preço para tentar de novo
        tempoBuffHoras: 48 
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
        this.balanceDisplay = document.getElementById('oracle-gold-value'); // Novo display
        this.custoInicialDisplay = document.querySelector('.custo-display span');
    },

    bindEvents: function() {
        if(this.btnInvocar) this.btnInvocar.addEventListener('click', () => this.girarRoleta(false));
        if(this.btnReroll) this.btnReroll.addEventListener('click', () => this.girarRoleta(true));
    },

    filtrarCandidatos: function() {
        // 1. Pega apenas "Quero Ler"
        let candidatos = App.state.livros.filter(l => l.situacao === 'Quero Ler');
        
        // 2. Filtra Volumes (Não sugerir Vol 2 se não leu Vol 1)
        const lidos = App.state.livros.filter(l => l.situacao === 'Lido');
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
        this.atualizarSaldoVisual(); // Mostra o dinheiro atual ao abrir
        
        // Atualiza display do custo inicial no HTML
        if(this.custoInicialDisplay) {
            this.custoInicialDisplay.innerHTML = `${this.config.custoNormal} <i class="fa-solid fa-coins"></i>`;
        }

        const livroAtivo = App.state.livros.find(l => l.oracle && l.oracle.active);
        if (livroAtivo) {
            this.mostrarResultado(livroAtivo, false);
        } else {
            this.mostrarSlotMachine();
        }
    },

    atualizarSaldoVisual: function() {
        if (typeof Loja !== 'undefined' && this.balanceDisplay) {
            this.balanceDisplay.innerHTML = `${Loja.state.gold} <i class="fa-solid fa-coins"></i>`;
        }
    },

    mostrarSlotMachine: function() {
        this.slotMachine.classList.remove('hidden');
        this.resultadoContainer.classList.add('hidden');
    },

    mostrarResultado: function(livro, animar) {
        if (!animar) { 
            this.slotMachine.classList.add('hidden'); 
            this.resultadoContainer.classList.remove('hidden'); 
        }

        // --- GERAÇÃO DO CARD RICO (COM DETALHES NA DIREITA) ---
        const capa = livro.urlCapa || 'placeholder.jpg';
        const paginas = parseInt(livro.paginas) || 0;
        const mob = Gamification.getClassificacaoMob(paginas);
        const notaMedia = Estante.getNotaRecente(livro) || '-';

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

        this.iniciarTimer(livro.oracle.expires);
        
        // Atualiza texto do botão de Reroll com preço correto
        this.btnReroll.innerHTML = `<i class="fa-solid fa-rotate"></i> Desafiar o Destino (Custo: ${this.config.custoReroll} <i class="fa-solid fa-coins"></i>)`;
    },

    iniciarTimer: function(expiryDate) {
        if (this.timerInterval) clearInterval(this.timerInterval);
        const update = () => {
            const diff = expiryDate - Date.now();
            if (diff <= 0) { 
                this.timerDisplay.textContent = "Buff Expirado"; 
                this.timerDisplay.style.color = "#ef4444";
                clearInterval(this.timerInterval); 
                return; 
            }
            const h = Math.floor(diff / 3600000); 
            const m = Math.floor((diff % 3600000) / 60000);
            this.timerDisplay.textContent = `Expira em: ${h}h ${m}m`;
        };
        update(); 
        this.timerInterval = setInterval(update, 60000);
    },

    girarRoleta: async function(isReroll) {
        if (typeof Loja === 'undefined') return App.mostrarNotificacao('Loja offline.', 'erro');
        
        const custo = isReroll ? this.config.custoReroll : this.config.custoNormal;
        
        // VALIDAÇÃO DE SALDO
        if (Loja.state.gold < custo) {
            return App.mostrarNotificacao(`Você precisa de ${custo} Ouro! Saldo atual: ${Loja.state.gold}`, 'erro');
        }

        const candidatos = this.filtrarCandidatos();
        if (candidatos.length === 0) return App.mostrarNotificacao('Nenhum livro apto na lista "Quero Ler"!', 'info');

        // DESCONTA E SALVA IMEDIATAMENTE
        Loja.state.gold -= custo;
        await Loja.salvarDados(); // Garante persistência
        this.atualizarSaldoVisual(); // Atualiza a tela AGORA

        // UI Updates
        this.slotMachine.classList.remove('hidden'); 
        this.resultadoContainer.classList.add('hidden');
        this.btnInvocar.disabled = true; 
        this.btnInvocar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> O DESTINO GIRA...';

        // Animação
        let htmlTrack = ''; 
        const lista = [...candidatos, ...candidatos].slice(0, 30); // Mais itens para giro longo
        const vencedor = candidatos[Math.floor(Math.random() * candidatos.length)];
        lista.push(vencedor); // O último é o vencedor visual

        this.slotTrack.innerHTML = lista.map(l => `<div class="slot-item"><img src="${l.urlCapa || 'placeholder.jpg'}"></div>`).join('');
        this.slotTrack.style.transition = 'none'; 
        this.slotTrack.style.transform = 'translateY(0)';
        
        // Force Reflow
        this.slotTrack.offsetHeight; 

        this.slotTrack.style.transition = 'transform 3s cubic-bezier(0.1, 0.7, 0.1, 1)';
        const cardHeight = 300; // Altura definida no CSS do slot-item
        this.slotTrack.style.transform = `translateY(-${(lista.length - 1) * cardHeight}px)`;

        setTimeout(async () => {
            // Limpa buffs anteriores
            App.state.livros.forEach(l => { if (l.oracle) delete l.oracle; }); 
            
            // Aplica novo buff
            vencedor.oracle = { 
                active: true, 
                timestamp: Date.now(), 
                expires: Date.now() + (this.config.tempoBuffHoras * 3600000) 
            };
            
            await App.salvarLivro(vencedor, vencedor.firestoreId);
            
            this.mostrarResultado(vencedor, true);
            this.btnInvocar.disabled = false; 
            this.btnInvocar.innerHTML = '<i class="fa-solid fa-hat-wizard"></i> INVOCAR O DESTINO';
            
            App.mostrarNotificacao('O Destino escolheu!', 'sucesso');
        }, 3000);
    }
};