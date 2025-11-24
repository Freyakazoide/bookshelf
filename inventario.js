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
        const livros = (window.App && window.App.state && window.App.state.todosOsLivros) ? window.App.state.todosOsLivros : [];
        const mapaItens = new Map();

        livros.forEach(livro => {
            if (livro.loot && !livro.loot.consumido) {
                const loot = livro.loot;
                
                if (!loot.categoria) {
                    if(loot.tipo === 'Consumível' || loot.efeito === 'xp') loot.categoria = 'consumivel';
                    else loot.categoria = 'equipamento';
                }
                
                const key = loot.idItem || loot.nome;

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
        this.state.itemSelecionado = this.state.itensAgrupados.find(i => i.idItem === idItem);
        if (!this.state.itemSelecionado) return;

        const item = this.state.itemSelecionado;
        
        document.querySelectorAll('.inv-slot').forEach(slot => slot.classList.remove('active'));

        this.previewIcon.innerHTML = `<i class="fa-solid ${item.icone}"></i>`;
        this.previewIcon.className = `item-preview-icon rarity-${item.tipo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`;
        this.previewTitle.textContent = item.nome;
        
        let corTipo = '#fff';
        if (item.categoria === 'consumivel') corTipo = '#10b981';
        if (item.categoria === 'equipamento') corTipo = '#3b82f6';
        if (item.categoria === 'colecionavel') corTipo = '#f59e0b';
        
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
        if(this.btnUsar) this.btnUsar.style.display = 'none';
    },

    usarItemSelecionado: async function() {
        const item = this.state.itemSelecionado;
        if (!item || item.categoria !== 'consumivel' || item.livrosOrigem.length === 0) return;

        const livroAlvo = item.livrosOrigem[0];
        
        if (!confirm(`Consumir 1x ${item.nome}?`)) return;

        const efeitoDiv = document.createElement('div');
        efeitoDiv.className = 'effect-popup';
        efeitoDiv.innerHTML = `<i class="fa-solid fa-bolt"></i> ${item.nome} Usado!<br>+${item.valor} XP`;
        document.body.appendChild(efeitoDiv);
        setTimeout(() => efeitoDiv.remove(), 2000);

        livroAlvo.loot.consumido = true;
        livroAlvo.loot.valor = item.valor; 
        
        await App.salvarLivro(livroAlvo, livroAlvo.firestoreId);
        
        Gamification.atualizarInterface(App.state.todosOsLivros);
        this.render();
        
        if (item.quantidade <= 1) this.limparPreview();
        else this.selecionarItem(item.idItem);
    },

    sincronizarLootAntigo: async function() {
        const livrosParaProcessar = App.state.todosOsLivros.filter(l => l.situacao === 'Lido' && !l.loot);
        
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