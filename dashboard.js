const Dashboard = {
    state: {
        todosOsLivros: [],
        anosDisponiveis: [],
        anoFiltro: ['all-time'],
        ordenacaoTabelas: {},
        // Referências aos gráficos para poder destruir e recriar
        graficos: {
            resumoAnual: null,
            lidosPorMes: null,
            distribuicaoNotas: null,
            dna: null,
            generos: null,
            ritmo: null,
            bestiario: null
        }
    },

    init: function(livros) {
        this.state.todosOsLivros = livros;
        this.atualizarDados();
        this.cacheDOM();
        this.bindEvents();
        this.popularFiltroDeAno();
        this.render();
    },
    
    atualizar: function(livros) {
        this.state.todosOsLivros = livros;
        this.atualizarDados();
        this.popularFiltroDeAno();
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
        // Controles e HUD
        this.filtroAnoContainerEl = document.getElementById('filtro-ano-container');
        this.filtroAnoBtnEl = document.getElementById('filtro-ano-btn');
        this.filtroAnoDropdownEl = document.getElementById('filtro-ano-dropdown');
        
        this.hudBanner = document.getElementById('hud-mission-banner');
        
        // KPIs
        this.kpiHero = document.getElementById('kpi-hero-novo');
        this.kpiPaginas = document.getElementById('kpi-paginas-novo');
        this.kpiBosses = document.getElementById('kpi-bosses-killed');
        this.kpiGold = document.getElementById('kpi-gold-accumulated');
        this.hallFama = document.getElementById('destaques-lista-nova');

        // Gráficos
        this.graficoBestiarioEl = document.getElementById('grafico-bestiario');
        this.graficoResumoAnualEl = document.getElementById('grafico-resumo-anual');
        this.graficoLidosPorMesEl = document.getElementById('grafico-lidos-por-mes');
        this.graficoDistribuicaoNotasEl = document.getElementById('grafico-distribuicao-notas');
        this.graficoDNAEl = document.getElementById('grafico-dna');
        this.graficoGenerosEl = document.getElementById('grafico-generos');
        this.graficoRitmoEl = document.getElementById('grafico-ritmo');

        // Tabelas e Containers
        this.widgetResumoPorAno = document.getElementById('resumo-por-ano');
        this.widgetLidosPorMes = document.getElementById('widget-lidos-por-mes');
        this.tituloTabelaLivrosAnoEl = document.getElementById('titulo-tabela-livros-ano');
        this.tituloGraficoMesEl = document.getElementById('titulo-grafico-mes');

        this.tabelaLivrosAnoEl = document.getElementById('tabela-livros-ano');
        this.tabelaMelhoresAutoresEl = document.getElementById('tabela-melhores-autores');
        this.tabelaMelhoresColecoesEl = document.getElementById('tabela-melhores-colecoes');
        this.tabelaMelhoresEditorasEl = document.getElementById('tabela-melhores-editoras');
    },

    bindEvents: function() {
        this.filtroAnoBtnEl.addEventListener('click', (e) => {
            e.stopPropagation();
            this.filtroAnoDropdownEl.classList.toggle('hidden');
            this.filtroAnoBtnEl.classList.toggle('open');
        });

        document.addEventListener('click', (e) => {
            if (this.filtroAnoContainerEl && !this.filtroAnoContainerEl.contains(e.target) && !this.filtroAnoDropdownEl.classList.contains('hidden')) {
                this.filtroAnoDropdownEl.classList.add('hidden');
                this.filtroAnoBtnEl.classList.remove('open');
            }
        });

        this.filtroAnoDropdownEl.addEventListener('change', (e) => {
            if (!e.target.matches('input[type="checkbox"]')) return;
            const checkbox = e.target;
            const valor = checkbox.value;
            let selecaoAtual = [...this.state.anoFiltro];

            if (valor === 'all-time') { selecaoAtual = ['all-time']; } 
            else {
                selecaoAtual = selecaoAtual.filter(item => item !== 'all-time');
                if (checkbox.checked) selecaoAtual.push(valor);
                else selecaoAtual = selecaoAtual.filter(item => item !== valor);
            }
            if (selecaoAtual.length === 0) selecaoAtual = ['all-time'];
            
            this.state.anoFiltro = selecaoAtual;
            this.popularFiltroDeAno();
            this.render();
        });

        // Ordenação Genérica de Tabelas
        [this.tabelaLivrosAnoEl, this.tabelaMelhoresAutoresEl, this.tabelaMelhoresColecoesEl, this.tabelaMelhoresEditorasEl].forEach(tabela => {
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

        // Prepara Dados
        const todasAsLeituras = this.state.todosOsLivros.flatMap(livro =>
            (livro.leituras || []).map(leitura => ({ ...leitura, livro }))
        ).filter(leitura => leitura.dataFim);
        
        const eTodoPeriodo = this.state.anoFiltro.includes('all-time');
        const eAnoUnico = !eTodoPeriodo && this.state.anoFiltro.length === 1;

        const leiturasFiltradas = eTodoPeriodo
            ? todasAsLeituras
            : todasAsLeituras.filter(l => this.state.anoFiltro.includes(new Date(l.dataFim).getFullYear().toString()));
        
        // Renderiza Componentes
        this.renderActiveQuest(); // Banner Topo
        this.renderKPIs(leiturasFiltradas); // Stats
        this.renderHallOfFame(leiturasFiltradas); // Troféus
        
        // Gráficos
        this.renderBestiaryChart(leiturasFiltradas); // Novo
        this.renderGraficoDNA(leiturasFiltradas);
        this.renderGraficoGeneros(leiturasFiltradas);
        this.renderGraficoRitmo(leiturasFiltradas);
        this.renderGraficoDistribuicaoNotas(leiturasFiltradas);

        // Lógica Ano vs Meses
        if (eAnoUnico) {
            this.widgetResumoPorAno.style.display = 'none';
            this.widgetLidosPorMes.style.display = 'block';
            const ano = this.state.anoFiltro[0];
            this.tituloTabelaLivrosAnoEl.textContent = `Log de Combate: ${ano}`;
            this.tituloGraficoMesEl.textContent = `XP Mensal (${ano})`;
            this.renderGraficoLidosPorMes(leiturasFiltradas);
        } else {
            this.widgetResumoPorAno.style.display = 'block';
            this.widgetLidosPorMes.style.display = 'none';
            this.tituloTabelaLivrosAnoEl.textContent = eTodoPeriodo ? `Log de Combate Completo` : `Log de Combate (${this.state.anoFiltro.length} anos)`;
            this.renderGraficoResumoAnual(leiturasFiltradas);
        }
        
        // Tabelas
        this.renderListaDeLivros(leiturasFiltradas);
        this.renderMelhoresColecoes(leiturasFiltradas);
        this.renderMelhoresEditoras(leiturasFiltradas);
        this.renderMelhoresAutores(leiturasFiltradas);
    },

    // --- COMPONENTES VISUAIS (NOVO LAYOUT) ---

    renderActiveQuest: function() {
        const lendo = this.state.todosOsLivros.filter(l => l.situacao === 'Lendo');
        lendo.sort((a, b) => {
            const dA = (a.leituras||[]).find(x=>!x.dataFim)?.dataInicio || 0;
            const dB = (b.leituras||[]).find(x=>!x.dataFim)?.dataInicio || 0;
            return new Date(dB) - new Date(dA);
        });

        const quest = lendo[0];
        
        if (!quest) {
            this.hudBanner.innerHTML = `<div style="color: var(--cor-texto-secundario); width:100%; text-align:center;"><i class="fa-solid fa-campground"></i> Nenhuma missão ativa. Vá à Guilda (Estante) pegar uma tarefa!</div>`;
            this.hudBanner.className = 'hud-banner';
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
                <img src="${quest.urlCapa || 'placeholder.jpg'}">
                <div class="hud-text">
                    <h3><span class="tag-lendo" style="font-size:0.6rem; background:${mobInfo.cor}; color:#000; padding:2px 6px; border-radius:4px; margin-right:8px;">${mobInfo.label}</span> ${quest.nomeDoLivro}</h3>
                    <p>${quest.autor} • Iniciado há ${dias} dias</p>
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
        const totalLivros = leituras.length;
        const totalPags = leituras.reduce((acc, l) => acc + (parseInt(l.livro.paginas)||0), 0);
        const bossesKilled = leituras.filter(l => (parseInt(l.livro.paginas)||0) >= 700).length;
        const gold = (totalLivros * 10) + (bossesKilled * 100);

        this.kpiHero.innerHTML = `<h4>Total Quests</h4><div class="valor-kpi-hero">${totalLivros}</div>`;
        this.kpiPaginas.innerHTML = `<h4>Dano (Págs)</h4><div class="valor-kpi">${totalPags.toLocaleString('pt-BR')}</div>`;
        this.kpiBosses.innerHTML = `<h4>Bosses Abatidos</h4><div class="valor-kpi" style="color:var(--cor-perigo)">${bossesKilled}</div>`;
        this.kpiGold.innerHTML = `<h4>Tesouro</h4><div class="valor-kpi" style="color:#fcd34d">${gold} <i class="fa-solid fa-coins" style="font-size:1.5rem"></i></div>`;
    },

    renderHallOfFame: function(leituras) {
        if (leituras.length === 0) { this.hallFama.innerHTML = '<p>Sem dados.</p>'; return; }
        const melhorLivro = leituras.filter(l=>l.notaFinal).sort((a,b) => b.notaFinal - a.notaFinal)[0];
        const autores = {}; leituras.forEach(l => { const a = l.livro.autor; if(a) autores[a] = (autores[a]||0)+1; });
        const topAutor = Object.keys(autores).reduce((a,b) => autores[a] > autores[b] ? a : b, null);
        const maiorLivro = [...leituras].sort((a,b) => (parseInt(b.livro.paginas)||0) - (parseInt(a.livro.paginas)||0))[0];

        this.hallFama.innerHTML = `
            <div class="trophy-card" style="border-left: 3px solid var(--loot-legendary)">
                <div class="trophy-icon" style="color: var(--loot-legendary)"><i class="fa-solid fa-crown"></i></div>
                <div class="trophy-info"><h5>MVP (Melhor Nota)</h5><p title="${melhorLivro?.livro.nomeDoLivro}">${melhorLivro ? melhorLivro.livro.nomeDoLivro : '-'}</p></div>
            </div>
            <div class="trophy-card" style="border-left: 3px solid var(--cor-perigo)">
                <div class="trophy-icon" style="color: var(--cor-perigo)"><i class="fa-solid fa-dragon"></i></div>
                <div class="trophy-info"><h5>Maior Desafio</h5><p title="${maiorLivro?.livro.nomeDoLivro}">${maiorLivro ? maiorLivro.livro.nomeDoLivro : '-'}</p></div>
            </div>
            <div class="trophy-card" style="border-left: 3px solid var(--loot-rare)">
                <div class="trophy-icon" style="color: var(--loot-rare)"><i class="fa-solid fa-user-graduate"></i></div>
                <div class="trophy-info"><h5>Mentor (Autor)</h5><p>${topAutor || '-'}</p></div>
            </div>
        `;
    },

    // --- GRÁFICOS (TODOS, INCLUINDO OS ANTIGOS) ---

    renderBestiaryChart: function(leituras) {
        const ctx = this.graficoBestiarioEl;
        if (!ctx) return;
        if (this.state.graficos.bestiario) this.state.graficos.bestiario.destroy();

        const tiers = { 'Minion': 0, 'Mob': 0, 'Elite': 0, 'Mini-Boss': 0, 'Boss': 0, 'World Boss': 0 };
        leituras.forEach(l => {
            const p = parseInt(l.livro.paginas, 10) || 0;
            const mob = Gamification.getClassificacaoMob(p);
            let key = mob.label.replace('☠️ ', '');
            if(key === 'Raid Boss') key = 'Boss'; if(key === 'Elite Mob') key = 'Elite'; if(key === 'Mob Comum') key = 'Mob';
            if (tiers[key] !== undefined) tiers[key]++;
        });

        this.state.graficos.bestiario = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(tiers),
                datasets: [{
                    data: Object.values(tiers),
                    backgroundColor: ['#94a3b8', '#10b981', '#3b82f6', '#a855f7', '#ef4444', '#f59e0b'],
                    borderWidth: 0
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#94a3b8', boxWidth: 10 } } } }
        });
    },

    renderGraficoResumoAnual: function(leituras) {
        if (this.state.graficos.resumoAnual) this.state.graficos.resumoAnual.destroy();
        const dadosPorAno = leituras.reduce((acc, l) => {
            const ano = new Date(l.dataFim).getFullYear();
            if (!acc[ano]) acc[ano] = { livros: 0, paginas: 0, ano };
            acc[ano].livros++; acc[ano].paginas += parseInt(l.livro.paginas, 10) || 0;
            return acc;
        }, {});
        const dadosOrdenados = Object.values(dadosPorAno).sort((a, b) => a.ano - b.ano);
        
        Chart.defaults.color = '#94a3b8'; Chart.defaults.borderColor = 'rgba(255,255,255,0.1)';
        this.state.graficos.resumoAnual = new Chart(this.graficoResumoAnualEl, {
            type: 'bar',
            data: {
                labels: dadosOrdenados.map(d => d.ano),
                datasets: [
                    { label: 'Livros', data: dadosOrdenados.map(d => d.livros), backgroundColor: 'rgba(45, 212, 191, 0.6)', borderColor: '#2dd4bf', borderWidth: 1, yAxisID: 'y' },
                    { label: 'Páginas', data: dadosOrdenados.map(d => d.paginas), backgroundColor: 'rgba(245, 158, 11, 0.2)', borderColor: '#f59e0b', borderWidth: 2, yAxisID: 'y1', type: 'line', tension: 0.3 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { position: 'left' }, y1: { position: 'right', grid: { drawOnChartArea: false } } } }
        });
    },

    renderGraficoLidosPorMes: function(leituras) {
        if (this.state.graficos.lidosPorMes) this.state.graficos.lidosPorMes.destroy();
        const dadosMensais = new Array(12).fill(0);
        leituras.forEach(l => dadosMensais[new Date(l.dataFim).getUTCMonth()]++);
        this.state.graficos.lidosPorMes = new Chart(this.graficoLidosPorMesEl, {
            type: 'bar',
            data: { labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'], datasets: [{ label: 'Livros', data: dadosMensais, backgroundColor: 'rgba(168, 85, 247, 0.6)', borderColor: '#a855f7', borderWidth: 1 }] },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }, plugins: { legend: { display: false } } }
        });
    },

    renderGraficoDistribuicaoNotas: function(leituras) {
        if (this.state.graficos.distribuicaoNotas) this.state.graficos.distribuicaoNotas.destroy();
        const notas = new Array(11).fill(0);
        leituras.filter(l => l.notaFinal != null).forEach(l => { const n = Math.round(l.notaFinal); if (n >= 0 && n <= 10) notas[n]++; });
        const colors = notas.map((_, i) => { if(i >= 9) return '#f59e0b'; if(i >= 7) return '#a855f7'; if(i >= 5) return '#3b82f6'; return '#94a3b8'; });

        this.state.graficos.distribuicaoNotas = new Chart(this.graficoDistribuicaoNotasEl, {
            type: 'bar',
            data: { labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], datasets: [{ label: 'Qtd', data: notas, backgroundColor: colors, borderWidth: 0, borderRadius: 4 }] },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }, plugins: { legend: { display: false } } }
        });
    },

    renderGraficoDNA: function(leituras) {
        if (this.state.graficos.dna) this.state.graficos.dna.destroy();
        const criterios = ['personagens', 'plot', 'desenvolvimento', 'pacing', 'prosa', 'originalidade', 'temas', 'impacto', 'closing', 'releitura'];
        const labels = ['Personagens', 'Enredo', 'Mundo', 'Ritmo', 'Prosa', 'Originalidade', 'Temas', 'Impacto', 'Final', 'Releitura'];
        const somas = new Array(10).fill(0); const contagens = new Array(10).fill(0);
        leituras.forEach(l => { if (l.notas) criterios.forEach((crit, i) => { if (l.notas[crit] !== undefined) { somas[i] += l.notas[crit]; contagens[i]++; } }); });
        const medias = somas.map((s, i) => contagens[i] > 0 ? s / contagens[i] : 0);
        
        this.state.graficos.dna = new Chart(this.graficoDNAEl, {
            type: 'radar',
            data: { labels: labels, datasets: [{ label: 'Meu DNA', data: medias, fill: true, backgroundColor: 'rgba(45, 212, 191, 0.2)', borderColor: '#2dd4bf', pointBackgroundColor: '#0f172a', pointBorderColor: '#2dd4bf' }] },
            options: { responsive: true, maintainAspectRatio: false, scales: { r: { angleLines: { color: 'rgba(255,255,255,0.1)' }, grid: { color: 'rgba(255,255,255,0.1)' }, pointLabels: { color: '#94A3B8', font: { size: 11 } }, ticks: { display: false }, min: 0, max: 10 } }, plugins: { legend: { display: false } } }
        });
    },

    renderGraficoGeneros: function(leituras) {
        if (this.state.graficos.generos) this.state.graficos.generos.destroy();
        const counts = {};
        leituras.forEach(l => { if (l.livro.categorias) l.livro.categorias.split(',').forEach(c => { const cat = c.trim(); if (cat) counts[cat] = (counts[cat] || 0) + 1; }); });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        const top5 = sorted.slice(0, 5); const outros = sorted.slice(5).reduce((acc, val) => acc + val[1], 0);
        const labels = top5.map(i => i[0]); const data = top5.map(i => i[1]);
        if (outros > 0) { labels.push('Outros'); data.push(outros); }
        
        this.state.graficos.generos = new Chart(this.graficoGenerosEl, {
            type: 'doughnut',
            data: { labels: labels, datasets: [{ data: data, backgroundColor: ['#2dd4bf', '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#94a3b8'], borderColor: '#0f172a', borderWidth: 2 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#94A3B8', boxWidth: 12 } } } }
        });
    },

    renderGraficoRitmo: function(leituras) {
        if (this.state.graficos.ritmo) this.state.graficos.ritmo.destroy();
        const dataPoints = leituras.filter(l => l.livro.paginas && l.dataInicio && l.dataFim).map(l => {
            const dias = Math.max(1, Math.round((new Date(l.dataFim) - new Date(l.dataInicio)) / (1000 * 60 * 60 * 24)));
            return { x: parseInt(l.livro.paginas, 10), y: dias, livro: l.livro.nomeDoLivro };
        });
        this.state.graficos.ritmo = new Chart(this.graficoRitmoEl, {
            type: 'scatter',
            data: { datasets: [{ label: 'Livros', data: dataPoints, backgroundColor: 'rgba(245, 158, 11, 0.7)', borderColor: '#f59e0b', borderWidth: 1, pointRadius: 4 }] },
            options: { responsive: true, maintainAspectRatio: false, scales: { x: { title: { display: true, text: 'Páginas' } }, y: { title: { display: true, text: 'Dias' } } }, plugins: { tooltip: { callbacks: { label: ctx => `${ctx.raw.livro}: ${ctx.raw.x} pág em ${ctx.raw.y} dias` } }, legend: { display: false } } }
        });
    },

    // --- TABELAS E HELPERS ---

    popularFiltroDeAno: function() {
        let htmlDropdown = `<div class="filtro-ano-item"><input type="checkbox" id="ano-all-time" value="all-time" ${this.state.anoFiltro.includes('all-time') ? 'checked' : ''}><label for="ano-all-time">Todo o Período</label></div>`;
        this.state.anosDisponiveis.forEach(ano => {
            htmlDropdown += `<div class="filtro-ano-item"><input type="checkbox" id="ano-${ano}" value="${ano}" ${this.state.anoFiltro.includes(ano.toString()) ? 'checked' : ''}><label for="ano-${ano}">${ano}</label></div>`;
        });
        this.filtroAnoDropdownEl.innerHTML = htmlDropdown;
        if (this.state.anoFiltro.includes('all-time') || this.state.anoFiltro.length === 0) this.filtroAnoBtnEl.textContent = 'Todo o Período';
        else if (this.state.anoFiltro.length === 1) this.filtroAnoBtnEl.textContent = this.state.anoFiltro[0];
        else this.filtroAnoBtnEl.textContent = `${this.state.anoFiltro.length} anos`;
    },

    getClasseNota: function(nota) {
        if (nota >= 9) return 'rarity-legendary';
        if (nota >= 7) return 'rarity-epic';
        if (nota >= 5) return 'rarity-rare';
        if (nota >= 3) return 'rarity-uncommon';
        return 'rarity-common';
    },

    renderTabela: function(tabelaId, el, dados, colunas) {
        const ordenacao = this.state.ordenacaoTabelas[tabelaId] || {};
        if (ordenacao.coluna) {
            dados.sort((a, b) => {
                const getVal = (item, key) => {
                    const livro = item.livro || item;
                    switch(key) {
                        case 'titulo': return livro.nomeDoLivro || '';
                        case 'autor': return livro.autor || '';
                        case 'notaFinal': return parseFloat(item.notaFinal) || 0;
                        case 'paginas': return parseInt(livro.paginas || item.paginas, 10) || 0;
                        case 'mediaNota': return parseFloat(item.mediaNota) || 0;
                        case 'count': return parseInt(item.count, 10) || 0;
                        default: return item[key];
                    }
                };
                let valA = getVal(a, ordenacao.coluna);
                let valB = getVal(b, ordenacao.coluna);
                if (typeof valA === 'string') return ordenacao.direcao === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                return ordenacao.direcao === 'asc' ? valA - valB : valB - valA;
            });
        }

        const thead = `<thead><tr>${colunas.map(c => `<th class="${c.sortable ? 'sortable' : ''} ${ordenacao.coluna === c.key ? `sort-${ordenacao.direcao}` : ''}" data-coluna="${c.key}">${c.header}</th>`).join('')}</tr></thead>`;
        const body = dados.map(item => {
            const livro = item.livro || item;
            const tds = colunas.map(col => {
                let valor = '';
                switch(col.key) {
                    case 'capa': valor = `<img src="${livro.urlCapa || 'placeholder.jpg'}" class="tabela-capa-img">`; break;
                    case 'titulo': valor = `<span class="tabela-titulo">${livro.nomeDoLivro}</span>`; break;
                    case 'autor': valor = `<span class="tabela-autor">${livro.autor}</span>`; break;
                    case 'paginas': valor = parseInt(livro.paginas, 10).toLocaleString('pt-BR') || '-'; break;
                    case 'notaFinal': valor = item.notaFinal ? `<span class="badge-nota ${this.getClasseNota(item.notaFinal)}">${item.notaFinal.toFixed(1)}</span>` : '-'; break;
                    case 'dataFim': valor = new Date(item.dataFim).toLocaleDateString('pt-BR'); break;
                    case 'mediaNota': valor = item.mediaNota ? `<span class="badge-nota ${this.getClasseNota(item.mediaNota)}">${item.mediaNota.toFixed(1)}</span>` : '-'; break;
                    case 'count': valor = item.count; break;
                    case 'nome': valor = `<span style="color:#fff; font-weight:bold;">${item.nome}</span>`; break;
                    // NOVO: Mostra Icone do Boss na tabela
                    case 'boss_icon': 
                        const mob = Gamification.getClassificacaoMob(parseInt(livro.paginas)||0);
                        valor = `<i class="fa-solid ${mob.icone}" style="color:${mob.cor}" title="${mob.label}"></i>`;
                        break;
                    default: valor = item[col.key] || '-';
                }
                return `<td>${valor}</td>`;
            }).join('');
            return `<tr>${tds}</tr>`;
        }).join('');
        el.innerHTML = `${thead}<tbody>${body || `<tr><td colspan="${colunas.length}" style="text-align:center; padding:2rem;">Nada encontrado.</td></tr>`}</tbody>`;
    },

    renderListaDeLivros: function(leituras) {
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