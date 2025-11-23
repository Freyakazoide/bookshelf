const Dashboard = {
    state: {
        todosOsLivros: [],
        todasAsMetas: [],
        anosDisponiveis: [],
        anoFiltro: ['all-time'],
        ordenacaoTabelas: {
            'tabela-livros-ano': { coluna: 'dataFim', direcao: 'desc' }
        },
        graficos: {
            resumoAnual: null,
            lidosPorMes: null,
            distribuicaoNotas: null,
            lootRarity: null,
            generos: null,
            ritmo: null,
            bestiario: null
        }
    },

    init: function(livros) {
        this.state.todosOsLivros = livros;
        this.state.todasAsMetas = (window.App && window.App.state.challenges) ? window.App.state.challenges : [];
        this.atualizarDados();
        this.cacheDOM();
        this.bindEvents();
        this.popularFiltroDeAno();
        this.render();
    },
    
    atualizar: function(livros) {
        this.state.todosOsLivros = livros;
        this.state.todasAsMetas = (window.App && window.App.state.challenges) ? window.App.state.challenges : [];
        this.atualizarDados();
        if(this.state.anosDisponiveis.length === 0) this.popularFiltroDeAno(); 
        this.render();
    },

    atualizarDados: function() {
        const todasAsLeituras = this.state.todosOsLivros.flatMap(livro =>
            (livro.leituras || []).map(leitura => ({ ...leitura, livro }))
        ).filter(leitura => leitura.dataFim);
        const anos = new Set(todasAsLeituras.map(l => new Date(l.dataFim).getFullYear()));
        this.state.anosDisponiveis = Array.from(anos).sort((a, b) => b - a);
    },

    cacheDOM: function() {
        this.filtroAnoContainerEl = document.getElementById('filtro-ano-container');
        this.filtroAnoBtnEl = document.getElementById('filtro-ano-btn');
        this.filtroAnoDropdownEl = document.getElementById('filtro-ano-dropdown');
        this.hudBanner = document.getElementById('hud-mission-banner');
        
        this.kpiHero = document.getElementById('kpi-hero-novo');
        this.kpiPaginas = document.getElementById('kpi-paginas-novo');
        this.kpiBosses = document.getElementById('kpi-bosses-killed');
        this.kpiGold = document.getElementById('kpi-gold-accumulated');
        this.hallFama = document.getElementById('destaques-lista-nova');

        this.graficoBestiarioEl = document.getElementById('grafico-bestiario');
        this.graficoResumoAnualEl = document.getElementById('grafico-resumo-anual');
        this.graficoLidosPorMesEl = document.getElementById('grafico-lidos-por-mes');
        this.graficoDistribuicaoNotasEl = document.getElementById('grafico-distribuicao-notas');
        this.graficoDNAEl = document.getElementById('grafico-dna');
        this.graficoGenerosEl = document.getElementById('grafico-generos');
        this.graficoRitmoEl = document.getElementById('grafico-ritmo');

        this.widgetResumoPorAno = document.getElementById('resumo-por-ano');
        this.widgetLidosPorMes = document.getElementById('widget-lidos-por-mes');
        this.widgetDNA = document.getElementById('widget-dna');
        this.widgetGeneros = document.getElementById('widget-generos');
        this.widgetRitmo = document.getElementById('widget-ritmo');
        this.widgetNotas = document.getElementById('widget-distribuicao-notas');
        this.widgetBestiario = document.getElementById('widget-bestiary');
        
        this.tituloTabelaLivrosAnoEl = document.getElementById('titulo-tabela-livros-ano');
        this.tituloGraficoMesEl = document.getElementById('titulo-grafico-mes');

        this.tabelaLivrosAnoEl = document.getElementById('tabela-livros-ano');
        this.tabelaMelhoresAutoresEl = document.getElementById('tabela-melhores-autores');
        this.tabelaMelhoresColecoesEl = document.getElementById('tabela-melhores-colecoes');
        this.tabelaMelhoresEditorasEl = document.getElementById('tabela-melhores-editoras');
        
        const tables = document.querySelectorAll('.tabela-card .tabela-container');
        tables.forEach(el => el.classList.add('tabela-scroll-container'));
    },

    bindEvents: function() {
        if (this.filtroAnoBtnEl) {
            this.filtroAnoBtnEl.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.filtroAnoDropdownEl) this.filtroAnoDropdownEl.classList.toggle('hidden');
                const icon = this.filtroAnoBtnEl.querySelector('i');
                if(icon && this.filtroAnoDropdownEl) icon.className = this.filtroAnoDropdownEl.classList.contains('hidden') ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-up';
            });
        }

        document.addEventListener('click', (e) => {
            if (this.filtroAnoContainerEl && !this.filtroAnoContainerEl.contains(e.target)) {
                if (this.filtroAnoDropdownEl) this.filtroAnoDropdownEl.classList.add('hidden');
                const icon = this.filtroAnoBtnEl ? this.filtroAnoBtnEl.querySelector('i') : null;
                if(icon) icon.className = 'fa-solid fa-chevron-down';
            }
        });

        if (this.filtroAnoDropdownEl) {
            this.filtroAnoDropdownEl.addEventListener('change', (e) => {
                if (!e.target.matches('input[type="checkbox"]')) return;
                const checkbox = e.target;
                const valor = checkbox.value;
                let selecaoAtual = [...this.state.anoFiltro];

                if (valor === 'all-time') { 
                    selecaoAtual = ['all-time'];
                    this.filtroAnoDropdownEl.querySelectorAll('input').forEach(i => { if(i.value !== 'all-time') i.checked = false; });
                } else {
                    const allTimeInput = this.filtroAnoDropdownEl.querySelector('input[value="all-time"]');
                    if(allTimeInput) allTimeInput.checked = false;
                    
                    selecaoAtual = selecaoAtual.filter(item => item !== 'all-time');
                    if (checkbox.checked) selecaoAtual.push(valor);
                    else selecaoAtual = selecaoAtual.filter(item => item !== valor);
                }
                
                if (selecaoAtual.length === 0) {
                    selecaoAtual = ['all-time'];
                    const allTimeInput = this.filtroAnoDropdownEl.querySelector('input[value="all-time"]');
                    if(allTimeInput) allTimeInput.checked = true;
                }
                
                this.state.anoFiltro = selecaoAtual;
                this.popularFiltroDeAno(); // Atualiza texto do botão
                this.render();
            });
        }

        const tabelas = [this.tabelaLivrosAnoEl, this.tabelaMelhoresAutoresEl, this.tabelaMelhoresColecoesEl, this.tabelaMelhoresEditorasEl];
        tabelas.forEach(tabela => {
            if (tabela) {
                tabela.addEventListener('click', (e) => {
                    const th = e.target.closest('th.sortable');
                    if (th) {
                        const tabelaId = tabela.id;
                        const coluna = th.dataset.coluna;
                        const ordenacaoAtual = this.state.ordenacaoTabelas[tabelaId] || {};
                        let direcao = 'desc';
                        if (ordenacaoAtual.coluna === coluna && ordenacaoAtual.direcao === 'desc') direcao = 'asc';
                        this.state.ordenacaoTabelas[tabelaId] = { coluna, direcao };
                        this.render();
                    }
                });
            }
        });
    },

    render: function() {
        if (!this.state.todosOsLivros || this.state.todosOsLivros.length === 0) return;

        const todasAsLeituras = this.state.todosOsLivros.flatMap(livro =>
            (livro.leituras || []).map(leitura => ({ ...leitura, livro }))
        ).filter(leitura => leitura.dataFim);
        
        const eTodoPeriodo = this.state.anoFiltro.includes('all-time');
        const eAnoUnico = !eTodoPeriodo && this.state.anoFiltro.length === 1;

        const leiturasFiltradas = eTodoPeriodo
            ? todasAsLeituras
            : todasAsLeituras.filter(l => this.state.anoFiltro.includes(new Date(l.dataFim).getFullYear().toString()));
        
        // Tenta reorganizar, mas não trava se falhar
        try { this.reorganizarLayoutDOM(); } catch(e) { console.log('Layout não reorganizado:', e); }

        this.renderActiveQuest();
        this.renderKPIs(leiturasFiltradas);
        this.renderHallOfFame(leiturasFiltradas);
        
        this.renderBestiaryChart(leiturasFiltradas);
        this.renderLootChart();
        this.renderGraficoGeneros(leiturasFiltradas);
        
        this.renderGraficoRitmo(leiturasFiltradas);
        this.renderGraficoDistribuicaoNotas(leiturasFiltradas);

        if (eAnoUnico) {
            if(this.widgetResumoPorAno) this.widgetResumoPorAno.style.display = 'none';
            if(this.widgetLidosPorMes) this.widgetLidosPorMes.style.display = 'block';
            const ano = this.state.anoFiltro[0];
            if(this.tituloTabelaLivrosAnoEl) this.tituloTabelaLivrosAnoEl.textContent = `Log de Combate: ${ano}`;
            if(this.tituloGraficoMesEl) this.tituloGraficoMesEl.textContent = `XP Mensal (${ano})`;
            this.renderGraficoLidosPorMes(leiturasFiltradas);
        } else {
            if(this.widgetResumoPorAno) this.widgetResumoPorAno.style.display = 'block';
            if(this.widgetLidosPorMes) this.widgetLidosPorMes.style.display = 'none';
            if(this.tituloTabelaLivrosAnoEl) this.tituloTabelaLivrosAnoEl.textContent = eTodoPeriodo ? `Log de Combate Completo` : `Log de Combate (${this.state.anoFiltro.length} anos)`;
            this.renderGraficoResumoAnual(leiturasFiltradas);
        }
        
        this.renderListaDeLivros(leiturasFiltradas);
        this.renderMelhoresColecoes(leiturasFiltradas);
        this.renderMelhoresEditoras(leiturasFiltradas);
        this.renderMelhoresAutores(leiturasFiltradas);
    },

    reorganizarLayoutDOM: function() {
        const containerTimeline = document.querySelector('.timeline-row');
        const containerNotas = document.getElementById('widget-distribuicao-notas');
        const widgetDNA = document.getElementById('widget-dna');
        const widgetResumo = document.getElementById('resumo-por-ano');
        const widgetRitmo = document.getElementById('widget-ritmo');
        const widgetLidosMes = document.getElementById('widget-lidos-por-mes');
        
        if (!containerTimeline || !containerNotas || !widgetDNA || !widgetResumo || !widgetRitmo) return;

        const tituloDNA = widgetDNA.querySelector('h3');
        if(tituloDNA) tituloDNA.textContent = 'Economia (Loot Rarity)';

        if (!containerTimeline.classList.contains('dashboard-mixed-row')) {
            containerTimeline.className = 'dashboard-mixed-row';
            
            // Limpa container para reordenar
            while (containerTimeline.firstChild) {
                // Salva elementos que não são os que queremos mover, se houver
                if(containerTimeline.lastChild !== widgetResumo && containerTimeline.lastChild !== widgetLidosMes) {
                    containerTimeline.removeChild(containerTimeline.lastChild);
                } else {
                    break; // Break safety
                }
            }
            // Esvazia de verdade para garantir ordem
            containerTimeline.innerHTML = '';
            
            containerTimeline.appendChild(widgetResumo);
            if(widgetLidosMes) containerTimeline.appendChild(widgetLidosMes);
            containerTimeline.appendChild(containerNotas);
        }

        let containerSplit = document.getElementById('dynamic-split-row');
        if (!containerSplit) {
            containerSplit = document.createElement('div');
            containerSplit.id = 'dynamic-split-row';
            containerSplit.className = 'charts-split-row';
            if(containerTimeline.parentNode) containerTimeline.parentNode.insertBefore(containerSplit, containerTimeline.nextSibling);
            
            containerSplit.appendChild(widgetRitmo);
            // Se notas não foi movido para timeline (layout alternativo), move pra cá. 
            // Mas no layout pedido notas fica na timeline row (mixed row).
        }
    },

    renderActiveQuest: function() {
        const lendo = this.state.todosOsLivros.filter(l => l.situacao === 'Lendo');
        lendo.sort((a, b) => {
            const dA = (a.leituras||[]).find(x=>!x.dataFim)?.dataInicio || 0;
            const dB = (b.leituras||[]).find(x=>!x.dataFim)?.dataInicio || 0;
            return new Date(dB) - new Date(dA);
        });

        if (!this.hudBanner) return;

        const quest = lendo[0];
        if (!quest) {
            this.hudBanner.innerHTML = `<div style="color: var(--cor-texto-secundario); width:100%; text-align:center; display:flex; align-items:center; justify-content:center; gap:10px;"><i class="fa-solid fa-campground" style="font-size:1.5rem;"></i> <div><strong>Sem Missão Ativa</strong><br><small>Vá à Guilda (Estante) aceitar um contrato.</small></div></div>`;
            this.hudBanner.classList.remove('hidden');
            return;
        }

        const paginas = parseInt(quest.paginas, 10) || 0;
        const mobInfo = Gamification.getClassificacaoMob(paginas);
        const isBoss = mobInfo.tipo === 'boss' || mobInfo.tipo === 'worldboss';
        const sessao = (quest.leituras||[]).find(s => !s.dataFim);
        const dias = sessao ? Math.floor((new Date() - new Date(sessao.dataInicio)) / (1000 * 60 * 60 * 24)) : 0;

        this.hudBanner.className = `hud-banner ${isBoss ? 'boss-active' : ''}`;
        this.hudBanner.innerHTML = `
            <div class="hud-info">
                <img src="${quest.urlCapa || 'placeholder.jpg'}" onerror="this.src='placeholder.jpg'">
                <div class="hud-text">
                    <h3><span class="tag-lendo" style="font-size:0.6rem; background:${mobInfo.cor}; color:#000; padding:2px 6px; border-radius:4px; margin-right:8px;">${mobInfo.label}</span> ${quest.nomeDoLivro}</h3>
                    <p>${quest.autor} • <i class="fa-regular fa-clock"></i> Em combate há ${dias} dias</p>
                </div>
            </div>
            <div class="hud-progress">
                <span style="font-size:0.8rem; color:${mobInfo.cor}; font-weight:bold;">HP INIMIGO: ${paginas}</span>
                <div class="hud-hp-bar"><div class="hud-hp-fill" style="width: 100%"></div></div>
            </div>
        `;
        this.hudBanner.classList.remove('hidden');
    },

    renderKPIs: function(leituras) {
        if (!this.kpiHero) return;
        const totalLivros = leituras.length;
        const totalPags = leituras.reduce((acc, l) => acc + (parseInt(l.livro.paginas)||0), 0);
        const bossesKilled = leituras.filter(l => (parseInt(l.livro.paginas)||0) >= 700).length;
        const gold = (totalLivros * 10) + (bossesKilled * 100);
        const metasConcluidas = this.state.todasAsMetas.filter(m => Desafio.calcularProgressoMeta(m).concluida).length;
        const totalMetas = this.state.todasAsMetas.length;
        const metaRate = totalMetas > 0 ? Math.round((metasConcluidas / totalMetas) * 100) : 0;

        this.kpiHero.innerHTML = `<h4>Quest Completion</h4><div class="valor-kpi-hero">${metaRate}%</div><span class="subtitulo-kpi-hero">${metasConcluidas}/${totalMetas} Completas</span>`;
        this.kpiPaginas.innerHTML = `<h4>Dano Total</h4><div class="valor-kpi">${totalPags.toLocaleString('pt-BR')}</div><span class="label-kpi">Páginas Lidas</span>`;
        this.kpiBosses.innerHTML = `<h4>Bosses</h4><div class="valor-kpi" style="color:var(--cor-perigo)">${bossesKilled}</div>`;
        this.kpiGold.innerHTML = `<h4>Tesouro</h4><div class="valor-kpi" style="color:#fcd34d">${gold} <i class="fa-solid fa-coins" style="font-size:1.2rem"></i></div>`;
    },

    renderHallOfFame: function(leituras) {
        if (!this.hallFama) return;
        if (leituras.length === 0) { 
            this.hallFama.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #64748b;">Sem dados para o período selecionado.</p>'; 
            return; 
        }
        const melhorLivro = [...leituras].filter(l=>l.notaFinal).sort((a,b) => b.notaFinal - a.notaFinal)[0];
        const maiorLivro = [...leituras].sort((a,b) => (parseInt(b.livro.paginas)||0) - (parseInt(a.livro.paginas)||0))[0];
        const autores = {}; 
        leituras.forEach(l => { const a = l.livro.autor; if(a) autores[a] = (autores[a]||0)+1; });
        const topAutor = Object.keys(autores).length > 0 ? Object.keys(autores).reduce((a,b) => autores[a] >= autores[b] ? a : b) : '-';

        this.hallFama.innerHTML = `
            <div class="trophy-card" style="border-left: 3px solid var(--loot-legendary)">
                <div class="trophy-icon" style="color: var(--loot-legendary)"><i class="fa-solid fa-crown"></i></div>
                <div class="trophy-info"><h5>MVP (Nota)</h5><p title="${melhorLivro?.livro.nomeDoLivro}">${melhorLivro ? melhorLivro.livro.nomeDoLivro : '-'}</p></div>
            </div>
            <div class="trophy-card" style="border-left: 3px solid var(--cor-perigo)">
                <div class="trophy-icon" style="color: var(--cor-perigo)"><i class="fa-solid fa-dragon"></i></div>
                <div class="trophy-info"><h5>Maior Boss</h5><p title="${maiorLivro?.livro.nomeDoLivro}">${maiorLivro ? maiorLivro.livro.nomeDoLivro : '-'}</p></div>
            </div>
            <div class="trophy-card" style="border-left: 3px solid var(--loot-rare)">
                <div class="trophy-icon" style="color: var(--loot-rare)"><i class="fa-solid fa-user-graduate"></i></div>
                <div class="trophy-info"><h5>Mentor (Autor)</h5><p title="${topAutor}">${topAutor}</p></div>
            </div>
        `;
    },

    renderBestiaryChart: function(leituras) {
        const ctx = this.graficoBestiarioEl;
        if (!ctx) return;
        if (this.state.graficos.bestiario) this.state.graficos.bestiario.destroy();

        const tiers = { 'Minion': 0, 'Mob': 0, 'Elite': 0, 'Boss': 0, 'World Boss': 0 };
        
        leituras.forEach(l => {
            const p = parseInt(l.livro.paginas, 10) || 0;
            const mob = Gamification.getClassificacaoMob(p);
            let key = mob.label.replace('☠️ ', '').trim();
            if (key.toUpperCase() === 'WORLD BOSS') key = 'World Boss';
            else if (key === 'Raid Boss') key = 'Boss';
            else if (key.includes('Elite')) key = 'Elite';
            else if (key.includes('Mob')) key = 'Mob';
            else if (key.includes('Minion')) key = 'Minion';

            if (tiers[key] !== undefined) tiers[key]++;
        });

        this.state.graficos.bestiario = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(tiers),
                datasets: [{ data: Object.values(tiers), backgroundColor: ['#94a3b8', '#10b981', '#3b82f6', '#ef4444', '#f59e0b'], borderWidth: 0 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#94a3b8', boxWidth: 10, font: { size: 10 } } } }, cutout: '70%' }
        });
    },

    renderLootChart: function() {
        const ctx = this.graficoDNAEl;
        if (!ctx) return;
        if (this.state.graficos.lootRarity) this.state.graficos.lootRarity.destroy();
        const counts = { 'Comum': 0, 'Incomum': 0, 'Raro': 0, 'Épico': 0, 'Lendário': 0 };
        this.state.todosOsLivros.forEach(l => { if (l.loot) counts[l.loot.tipo]++; });
        this.state.graficos.lootRarity = new Chart(ctx, { type: 'pie', data: { labels: Object.keys(counts), datasets: [{ data: Object.values(counts), backgroundColor: ['#94a3b8', '#10b981', '#3b82f6', '#a855f7', '#f59e0b'], borderWidth: 1, borderColor: '#0f172a' }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#94a3b8', boxWidth: 10 } } } } });
    },

    renderGraficoGeneros: function(leituras) {
        const ctx = this.graficoGenerosEl;
        if (!ctx) return;
        if (this.state.graficos.generos) this.state.graficos.generos.destroy();
        const counts = {};
        leituras.forEach(l => { if (l.livro.categorias) l.livro.categorias.split(',').forEach(c => { const cat = c.trim(); if (cat) counts[cat] = (counts[cat] || 0) + 1; }); });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        const top = sorted.slice(0, 5); const outros = sorted.slice(5).reduce((a, v) => a + v[1], 0);
        const labels = top.map(i => i[0]); const data = top.map(i => i[1]); if (outros > 0) { labels.push('Outros'); data.push(outros); }
        this.state.graficos.generos = new Chart(ctx, { type: 'doughnut', data: { labels, datasets: [{ data, backgroundColor: ['#2dd4bf', '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#94a3b8'], borderColor: '#0f172a', borderWidth: 2 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#94A3B8', boxWidth: 10 } } }, cutout: '60%' } });
    },

    renderGraficoResumoAnual: function(leituras) {
        const ctx = this.graficoResumoAnualEl;
        if (!ctx) return;
        if (this.state.graficos.resumoAnual) this.state.graficos.resumoAnual.destroy();
        const dados = leituras.reduce((acc, l) => { const a = new Date(l.dataFim).getFullYear(); if(!acc[a]) acc[a]={l:0,p:0,a}; acc[a].l++; acc[a].p+=(parseInt(l.livro.paginas)||0); return acc; }, {});
        const sorted = Object.values(dados).sort((a, b) => a.a - b.a);
        Chart.defaults.color = '#94a3b8'; Chart.defaults.borderColor = 'rgba(255,255,255,0.05)';
        this.state.graficos.resumoAnual = new Chart(ctx, { type: 'bar', data: { labels: sorted.map(d=>d.a), datasets: [{ label: 'Livros', data: sorted.map(d=>d.l), backgroundColor: 'rgba(45,212,191,0.6)', borderRadius: 4, yAxisID: 'y' }, { label: 'Páginas', data: sorted.map(d=>d.p), backgroundColor: 'rgba(245,158,11,0.1)', borderColor: '#f59e0b', borderWidth: 2, type: 'line', yAxisID: 'y1', tension: 0.3 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { position: 'left', grid: { color: 'rgba(255,255,255,0.05)' } }, y1: { position: 'right', grid: { display: false } }, x: { grid: { display: false } } }, plugins: { legend: { display: true, labels: { boxWidth: 10 } } } } });
    },

    renderGraficoLidosPorMes: function(leituras) {
        const ctx = this.graficoLidosPorMesEl;
        if (!ctx) return;
        if (this.state.graficos.lidosPorMes) this.state.graficos.lidosPorMes.destroy();
        const d = new Array(12).fill(0); leituras.forEach(l => d[new Date(l.dataFim).getUTCMonth()]++);
        this.state.graficos.lidosPorMes = new Chart(ctx, { type: 'line', data: { labels: ['J','F','M','A','M','J','J','A','S','O','N','D'], datasets: [{ label: 'Livros', data: d, backgroundColor: 'rgba(168,85,247,0.2)', borderColor: '#a855f7', borderWidth: 2, fill: true }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }, plugins: { legend: { display: false } } } });
    },

    renderGraficoDistribuicaoNotas: function(leituras) {
        const ctx = this.graficoDistribuicaoNotasEl;
        if (!ctx) return;
        if (this.state.graficos.distribuicaoNotas) this.state.graficos.distribuicaoNotas.destroy();
        const n = new Array(11).fill(0); leituras.filter(l=>l.notaFinal!=null).forEach(l=>n[Math.round(l.notaFinal)]++);
        const c = n.map((_, i) => i>=9?'#f59e0b':i>=7?'#a855f7':i>=5?'#3b82f6':'#94a3b8');
        this.state.graficos.distribuicaoNotas = new Chart(ctx, { type: 'bar', data: { labels: ['0','1','2','3','4','5','6','7','8','9','10'], datasets: [{ label: 'Livros', data: n, backgroundColor: c, borderRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false } }, y: { display: false } }, plugins: { legend: { display: false } } } });
    },

    renderGraficoRitmo: function(leituras) {
        const ctx = this.graficoRitmoEl;
        if (!ctx) return;
        if (this.state.graficos.ritmo) this.state.graficos.ritmo.destroy();
        const data = leituras.filter(l=>l.livro.paginas && l.dataInicio && l.dataFim).map(l => ({ x: parseInt(l.livro.paginas), y: Math.max(1, Math.round((new Date(l.dataFim)-new Date(l.dataInicio))/(86400000))) }));
        this.state.graficos.ritmo = new Chart(ctx, { type: 'scatter', data: { datasets: [{ data, backgroundColor: 'rgba(245,158,11,0.6)', borderColor: '#f59e0b', borderWidth: 1 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { x: { title: { display: true, text: 'Páginas', color:'#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } }, y: { title: { display: true, text: 'Dias', color:'#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } } }, plugins: { legend: { display: false } } } });
    },

    popularFiltroDeAno: function() {
        if (!this.filtroAnoDropdownEl) return;
        let html = `<div class="filtro-ano-item"><input type="checkbox" id="ano-all-time" value="all-time" ${this.state.anoFiltro.includes('all-time')?'checked':''}><label for="ano-all-time">Todo o Período</label></div>`;
        this.state.anosDisponiveis.forEach(a => html += `<div class="filtro-ano-item"><input type="checkbox" value="${a}" ${this.state.anoFiltro.includes(a.toString())?'checked':''}><label>${a}</label></div>`);
        this.filtroAnoDropdownEl.innerHTML = html;
        
        if(this.filtroAnoBtnEl) {
            if (this.state.anoFiltro.includes('all-time')) this.filtroAnoBtnEl.innerHTML = `Todo o Período <i class="fa-solid fa-chevron-down"></i>`;
            else if (this.state.anoFiltro.length === 1) this.filtroAnoBtnEl.innerHTML = `${this.state.anoFiltro[0]} <i class="fa-solid fa-chevron-down"></i>`;
            else this.filtroAnoBtnEl.innerHTML = `${this.state.anoFiltro.length} anos <i class="fa-solid fa-chevron-down"></i>`;
        }
    },

    getClasseNota: function(nota) {
        if (nota >= 9) return 'rarity-legendary';
        if (nota >= 7) return 'rarity-epic';
        if (nota >= 5) return 'rarity-rare';
        if (nota >= 3) return 'rarity-uncommon';
        return 'rarity-common';
    },

    renderTabela: function(tabelaId, el, dados, colunas) {
        if (!el) return;
        const ordenacao = this.state.ordenacaoTabelas[tabelaId] || {};
        if (ordenacao.coluna) {
            dados.sort((a, b) => {
                const getVal = (item, key) => {
                    const livro = item.livro || item;
                    if (key === 'titulo') return livro.nomeDoLivro || '';
                    if (key === 'autor') return livro.autor || '';
                    if (key === 'notaFinal') return parseFloat(item.notaFinal) || 0;
                    if (key === 'paginas') return parseInt(livro.paginas || item.paginas, 10) || 0;
                    if (key === 'mediaNota') return parseFloat(item.mediaNota) || 0;
                    if (key === 'count') return parseInt(item.count, 10) || 0;
                    if (key === 'dataFim') return new Date(item.dataFim).getTime();
                    return item[key] || '';
                };
                let valA = getVal(a, ordenacao.coluna), valB = getVal(b, ordenacao.coluna);
                if (typeof valA === 'string') return ordenacao.direcao === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                return ordenacao.direcao === 'asc' ? valA - valB : valB - valA;
            });
        }
        const thead = `<thead><tr>${colunas.map(c => `<th class="${c.sortable?'sortable':''} ${ordenacao.coluna===c.key?`sort-${ordenacao.direcao}`:''}" data-coluna="${c.key}">${c.header}</th>`).join('')}</tr></thead>`;
        const body = dados.map(item => {
            const livro = item.livro || item;
            const tds = colunas.map(col => {
                let val = item[col.key] || '-';
                if(col.key === 'capa') val = `<img src="${livro.urlCapa||'placeholder.jpg'}" class="tabela-capa-img">`;
                else if(col.key === 'boss_icon') { const m = Gamification.getClassificacaoMob(parseInt(livro.paginas)||0); val = `<i class="fa-solid ${m.icone}" style="color:${m.cor}"></i>`; }
                else if(col.key === 'titulo') val = `<span class="tabela-titulo">${livro.nomeDoLivro}</span>`;
                else if(col.key === 'autor') val = `<span class="tabela-autor">${livro.autor}</span>`;
                else if(col.key === 'notaFinal' && item.notaFinal) val = `<span class="badge-nota ${this.getClasseNota(item.notaFinal)}">${item.notaFinal.toFixed(1)}</span>`;
                else if(col.key === 'dataFim') val = new Date(item.dataFim).toLocaleDateString('pt-BR');
                else if(col.key === 'mediaNota' && item.mediaNota) val = `<span class="badge-nota ${this.getClasseNota(item.mediaNota)}">${item.mediaNota.toFixed(1)}</span>`;
                else if(col.key === 'nome') val = `<span style="color:#fff;font-weight:600">${item.nome}</span>`;
                return `<td>${val}</td>`;
            }).join('');
            return `<tr>${tds}</tr>`;
        }).join('');
        el.innerHTML = `${thead}<tbody>${body || '<tr><td colspan="'+colunas.length+'" style="text-align:center;padding:2rem">Vazio</td></tr>'}</tbody>`;
    },

    renderListaDeLivros: function(leituras) {
        if (!this.state.ordenacaoTabelas['tabela-livros-ano']) {
             this.state.ordenacaoTabelas['tabela-livros-ano'] = { coluna: 'dataFim', direcao: 'desc' };
        }
        this.renderTabela('tabela-livros-ano', this.tabelaLivrosAnoEl, leituras, [
            { header: '', key: 'boss_icon', sortable: false },
            { header: '', key: 'capa', sortable: false },
            { header: 'Título', key: 'titulo', sortable: true },
            { header: 'Autor', key: 'autor', sortable: true },
            { header: 'Págs', key: 'paginas', sortable: true },
            { header: 'Nota', key: 'notaFinal', sortable: true },
            { header: 'Data', key: 'dataFim', sortable: true }
        ]);
    },

    renderMelhoresAutores: function(leituras) {
        const dados = this.calcularRanking(leituras, 'autor', 1);
        this.renderTabela('tabela-melhores-autores', this.tabelaMelhoresAutoresEl, dados, [{ header: 'Autor', key: 'nome', sortable: true }, { header: 'Média', key: 'mediaNota', sortable: true }, { header: 'Qtd', key: 'count', sortable: true }]);
    },

    renderMelhoresColecoes: function(leituras) {
        const dados = this.calcularRanking(leituras.filter(l => l.livro.colecao && l.livro.colecao !== '-'), 'colecao', 1);
        this.renderTabela('tabela-melhores-colecoes', this.tabelaMelhoresColecoesEl, dados, [{ header: 'Coleção', key: 'nome', sortable: true }, { header: 'Média', key: 'mediaNota', sortable: true }, { header: 'Qtd', key: 'count', sortable: true }]);
    },

    renderMelhoresEditoras: function(leituras) {
        const dados = this.calcularRanking(leituras.filter(l => l.livro.editora), 'editora', 1);
        this.renderTabela('tabela-melhores-editoras', this.tabelaMelhoresEditorasEl, dados, [{ header: 'Editora', key: 'nome', sortable: true }, { header: 'Média', key: 'mediaNota', sortable: true }, { header: 'Qtd', key: 'count', sortable: true }]);
    },

    calcularRanking: function(leituras, campo, minLivros) {
        const dados = {};
        leituras.forEach(l => {
            const chaves = (l.livro[campo] || '').split(',').map(c => c.trim()).filter(Boolean);
            chaves.forEach(chave => {
                if (!dados[chave]) dados[chave] = { notas: [], count: 0 };
                if (l.notaFinal) dados[chave].notas.push(l.notaFinal);
                dados[chave].count++;
            });
        });
        return Object.keys(dados).map(nome => {
            const item = dados[nome];
            const mediaNota = item.notas.length > 0 ? item.notas.reduce((s, n) => s + n, 0) / item.notas.length : 0;
            return { nome, mediaNota, count: item.count };
        }).filter(item => item.count >= minLivros).sort((a, b) => b.mediaNota - a.mediaNota);
    }
};