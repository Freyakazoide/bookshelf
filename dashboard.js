const Dashboard = {
    state: {
        todosOsLivros: [],
        anosDisponiveis: [],
        anoFiltro: ['all-time'],
        ordenacaoTabelas: {},
        graficoResumoAnual: null,
        graficoLidosPorMes: null,
        graficoDistribuicaoNotas: null,
        graficoDNA: null,
        graficoGeneros: null,
        graficoRitmo: null
    },

    cacheDOM: function() {
        this.filtroAnoContainerEl = document.getElementById('filtro-ano-container');
        this.filtroAnoBtnEl = document.getElementById('filtro-ano-btn');
        this.filtroAnoDropdownEl = document.getElementById('filtro-ano-dropdown');

        this.kpiHeroNovoEl = document.getElementById('kpi-hero-novo');
        this.kpiPaginasNovoEl = document.getElementById('kpi-paginas-novo');
        this.kpiNotaNovoEl = document.getElementById('kpi-nota-novo');
        this.kpiAutoresNovoEl = document.getElementById('kpi-autores-novo');

        this.containerLendoAgora = document.getElementById('container-lendo-agora');
        this.curiosidadesContainer = document.getElementById('curiosidades-stats');
        this.destaquesListaNovaEl = document.getElementById('destaques-lista-nova');

        this.widgetResumoPorAno = document.getElementById('resumo-por-ano');
        this.widgetLidosPorMes = document.getElementById('widget-lidos-por-mes');
        this.widgetListaLivrosAno = document.getElementById('lista-livros-ano');
        
        this.tabelaLivrosAnoEl = document.getElementById('tabela-livros-ano');
        this.tabelaMelhoresAutoresEl = document.getElementById('tabela-melhores-autores');
        this.tabelaMelhoresColecoesEl = document.getElementById('tabela-melhores-colecoes');
        this.tabelaMelhoresEditorasEl = document.getElementById('tabela-melhores-editoras');
        
        this.tituloTabelaLivrosAnoEl = document.getElementById('titulo-tabela-livros-ano');
        this.tituloGraficoMesEl = document.getElementById('titulo-grafico-mes');

        this.graficoResumoAnualEl = document.getElementById('grafico-resumo-anual');
        this.graficoLidosPorMesEl = document.getElementById('grafico-lidos-por-mes');
        this.graficoDistribuicaoNotasEl = document.getElementById('grafico-distribuicao-notas');
        this.graficoDNAEl = document.getElementById('grafico-dna');
        this.graficoGenerosEl = document.getElementById('grafico-generos');
        this.graficoRitmoEl = document.getElementById('grafico-ritmo');
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

            if (valor === 'all-time') {
                selecaoAtual = ['all-time'];
            } else {
                selecaoAtual = selecaoAtual.filter(item => item !== 'all-time');
                if (checkbox.checked) selecaoAtual.push(valor);
                else selecaoAtual = selecaoAtual.filter(item => item !== valor);
            }

            if (selecaoAtual.length === 0) selecaoAtual = ['all-time'];
            
            this.state.anoFiltro = selecaoAtual;
            this.popularFiltroDeAno();
            this.render();
        });

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
        
        this.renderKPIs(leiturasFiltradas);
        this.renderLivroAtual();
        this.renderCuriosidades(leiturasFiltradas);
        this.renderDestaques(leiturasFiltradas);
        
        this.renderGraficoDNA(leiturasFiltradas);
        this.renderGraficoGeneros(leiturasFiltradas);
        this.renderGraficoRitmo(leiturasFiltradas);
        this.renderGraficoDistribuicaoNotas(leiturasFiltradas);

        this.widgetListaLivrosAno.style.display = 'block';
        this.renderListaDeLivros(leiturasFiltradas); 

        if (eAnoUnico) {
            this.widgetResumoPorAno.style.display = 'none';
            this.widgetLidosPorMes.style.display = 'block';
            const ano = this.state.anoFiltro[0];
            this.tituloTabelaLivrosAnoEl.textContent = `Quest Log: ${ano}`;
            this.tituloGraficoMesEl.textContent = `XP Mensal (${ano})`;
            this.renderGraficoLidosPorMes(leiturasFiltradas);
        } else {
            this.widgetResumoPorAno.style.display = 'block';
            this.widgetLidosPorMes.style.display = 'none';
            this.tituloTabelaLivrosAnoEl.textContent = eTodoPeriodo ? `Quest Log Completo` : `Quest Log (${this.state.anoFiltro.length} anos)`;
            this.renderGraficoResumoAnual(leiturasFiltradas);
        }
        
        this.renderMelhoresColecoes(leiturasFiltradas);
        this.renderMelhoresEditoras(leiturasFiltradas);
        this.renderMelhoresAutores(leiturasFiltradas);
    },

    popularFiltroDeAno: function() {
        let htmlDropdown = `
            <div class="filtro-ano-item">
                <input type="checkbox" id="ano-all-time" value="all-time" ${this.state.anoFiltro.includes('all-time') ? 'checked' : ''}>
                <label for="ano-all-time">Todo o Período</label>
            </div>`;
        this.state.anosDisponiveis.forEach(ano => {
            htmlDropdown += `
                <div class="filtro-ano-item">
                    <input type="checkbox" id="ano-${ano}" value="${ano}" ${this.state.anoFiltro.includes(ano.toString()) ? 'checked' : ''}>
                    <label for="ano-${ano}">${ano}</label>
                </div>`;
        });
        this.filtroAnoDropdownEl.innerHTML = htmlDropdown;
        if (this.state.anoFiltro.includes('all-time') || this.state.anoFiltro.length === 0) this.filtroAnoBtnEl.innerHTML = '<i class="fa-solid fa-calendar"></i> Todo o Período';
        else if (this.state.anoFiltro.length === 1) this.filtroAnoBtnEl.innerHTML = `<i class="fa-solid fa-calendar"></i> ${this.state.anoFiltro[0]}`;
        else this.filtroAnoBtnEl.innerHTML = `<i class="fa-solid fa-calendar"></i> ${this.state.anoFiltro.length} anos`;
    },

    renderKPIs: function(leituras) {
        const totalLivros = leituras.length;
        const totalPaginas = leituras.reduce((s, l) => s + (parseInt(l.livro.paginas, 10) || 0), 0);
        const leiturasComNota = leituras.filter(l => l.notaFinal);
        const notaMedia = leiturasComNota.length > 0 ? leiturasComNota.reduce((s, l) => s + (l.notaFinal || 0), 0) / leiturasComNota.length : 0;
        const totalAutores = new Set(leituras.map(l => l.livro.autor)).size;

        this.kpiHeroNovoEl.innerHTML = `
            <h4><i class="fa-solid fa-dragon"></i> Quests Completas</h4>
            <div class="valor-kpi-hero">${totalLivros}</div>
            <div class="subtitulo-kpi-hero">Livros Lidos</div>
        `;
        this.kpiPaginasNovoEl.innerHTML = `
            <h4><i class="fa-solid fa-scroll"></i> Páginas Lidas</h4>
            <div class="valor-kpi">${totalPaginas.toLocaleString('pt-BR')}</div>
        `;
        this.kpiNotaNovoEl.innerHTML = `
            <h4><i class="fa-solid fa-star-half-stroke"></i> Nota Média</h4>
            <div class="valor-kpi" style="color: var(--loot-epic)">${notaMedia.toFixed(1)}</div>
        `;
        this.kpiAutoresNovoEl.innerHTML = `
            <h4><i class="fa-solid fa-users"></i> Autores</h4>
            <div class="valor-kpi">${totalAutores}</div>
        `;
    },

    renderLivroAtual: function() {
        const livrosLendo = this.state.todosOsLivros.filter(l => l.situacao === 'Lendo');
        
        livrosLendo.sort((a, b) => {
            const leituraA = (a.leituras || []).find(l => !l.dataFim);
            const leituraB = (b.leituras || []).find(l => !l.dataFim);
            const dataA = leituraA ? new Date(leituraA.dataInicio).getTime() : 0;
            const dataB = leituraB ? new Date(leituraB.dataInicio).getTime() : 0;
            return dataB - dataA; 
        });

        const lendoAgora = livrosLendo[0];

        if (lendoAgora) {
            const leituraAtual = (lendoAgora.leituras || []).find(l => !l.dataFim);
            const dataInicio = leituraAtual ? new Date(leituraAtual.dataInicio) : new Date();
            const diasLendo = Math.floor((new Date() - dataInicio) / (1000 * 60 * 60 * 24));
            
            // --- ONDA 2: Lógica de Boss ---
            const paginasTotal = parseInt(lendoAgora.paginas, 10) || 1;
            const mobInfo = Gamification.getClassificacaoMob(paginasTotal);
            
            let hudHTML = '';
            
            // SE FOR BOSS OU WORLD BOSS
            if(mobInfo.tipo === 'boss' || mobInfo.tipo === 'worldboss') {
                const isWorld = mobInfo.tipo === 'worldboss';
                
                hudHTML = `
                <div class="dash-card card-lendo-agora boss-hud" style="${isWorld ? 'border-color: var(--loot-legendary); background: linear-gradient(90deg, #451a03, #020617);' : ''}">
                    <div class="lendo-agora-capa">
                        <img src="${lendoAgora.urlCapa || 'placeholder.jpg'}" alt="Capa" style="${isWorld ? 'border-color: var(--loot-legendary); box-shadow: 0 0 20px var(--loot-legendary);' : 'border-color: var(--cor-perigo);'}">
                    </div>
                    <div class="lendo-agora-info" style="width: 100%">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span class="boss-badge" style="background: ${mobInfo.cor};">
                                <i class="fa-solid ${mobInfo.icone}"></i> ${mobInfo.label}
                            </span>
                            <span style="color:${mobInfo.cor}; font-weight:bold;">${paginasTotal} HP (Págs)</span>
                        </div>
                        
                        <h3 style="color: #fff; margin-top:5px;">${lendoAgora.nomeDoLivro}</h3>
                        <p class="autor">${lendoAgora.autor}</p>
                        
                        <div class="boss-hp-container" style="${isWorld ? 'border-color: var(--loot-legendary);' : ''}">
                            <div class="boss-hp-fill" style="width: 100%; background: ${isWorld ? 'linear-gradient(90deg, #f59e0b, #b45309)' : 'linear-gradient(90deg, #ef4444, #991b1b)'}; box-shadow: 0 0 10px ${mobInfo.cor};"></div>
                            <span style="position:absolute; top:0; left:50%; transform:translateX(-50%); font-size:0.6rem; font-weight:bold; color:#fff; text-shadow:0 1px 2px #000; line-height:14px;">
                                ${isWorld ? 'LENDÁRIO ATIVO' : 'INIMIGO ATIVO'}
                            </span>
                        </div>
                    </div>
                </div>`;
            } else {
                // MOBS NORMAIS (Minion, Common, Elite, Mini-Boss)
                // Usamos a cor que vem do objeto mobInfo
                hudHTML = `
                <div class="dash-card card-lendo-agora" style="border-left: 4px solid ${mobInfo.cor};">
                    <div class="lendo-agora-capa">
                        <img src="${lendoAgora.urlCapa || 'placeholder.jpg'}" alt="Capa" class="${mobInfo.classe}">
                    </div>
                    <div class="lendo-agora-info">
                        <span class="tag-lendo" style="color:${mobInfo.cor}; border-color:${mobInfo.cor}; background:rgba(0,0,0,0.3)">
                            <i class="fa-solid ${mobInfo.icone}"></i> ${mobInfo.label}
                        </span>
                        <h3>${lendoAgora.nomeDoLivro}</h3>
                        <p class="autor">${lendoAgora.autor}</p>
                        <div class="lendo-stats">
                            <span><i class="fa-solid fa-hourglass-half"></i> ${diasLendo} dias</span>
                            <span><i class="fa-solid fa-book"></i> ${paginasTotal} págs</span>
                        </div>
                    </div>
                </div>`;
            }
        }
    },

    renderCuriosidades: function(leituras) {
        const totalPaginas = leituras.reduce((s, l) => s + (parseInt(l.livro.paginas, 10) || 0), 0);
        const torreMetros = (totalPaginas * 0.01) / 100; 
        
        let abandonado = null;
        let maiorEspera = 0;
        
        this.state.todosOsLivros.forEach(l => {
            if(l.situacao === 'Lendo') {
                const leitura = (l.leituras || []).find(lei => !lei.dataFim);
                if(leitura) {
                    const dias = Math.floor((new Date() - new Date(leitura.dataInicio)) / (1000 * 60 * 60 * 24));
                    if(dias > 30 && dias > maiorEspera) {
                        maiorEspera = dias;
                        abandonado = l;
                    }
                }
            }
        });

        const html = `
            <div class="curiosidade-item">
                <i class="fa-solid fa-ruler-vertical"></i>
                <div>
                    <strong>Torre de Papel</strong>
                    <p>Loot acumulado: <span>${torreMetros.toFixed(2)} metros</span> de altura.</p>
                </div>
            </div>
            <div class="curiosidade-item">
                <i class="fa-solid fa-shoe-prints"></i>
                <div>
                    <strong>Maratona de XP</strong>
                    <p>Você atravessou <span>${totalPaginas.toLocaleString('pt-BR')} páginas</span>.</p>
                </div>
            </div>
             ${abandonado ? `
            <div class="curiosidade-item" style="border-color: var(--cor-perigo);">
                <i class="fa-solid fa-skull" style="color: var(--cor-perigo)"></i>
                <div>
                    <strong>Missão Esquecida</strong>
                    <p>"${abandonado.nomeDoLivro}" está no limbo há <span>${maiorEspera} dias</span>.</p>
                </div>
            </div>` : ''}
        `;
        this.curiosidadesContainer.innerHTML = html;
    },

    // Substitua a função renderDestaques dentro de dashboard.js

renderDestaques: function(leituras) {
    const leiturasComNota = leituras.filter(l => l.notaFinal);
    const autorMaisLido = this.calcularMaisFrequente(leituras.map(l => l.livro.autor));
    const melhorLivro = leiturasComNota.length > 0 ? leiturasComNota.reduce((a, b) => a.notaFinal > b.notaFinal ? a : b) : null;
    
    const leiturasComPaginas = leituras.filter(l => parseInt(l.livro.paginas, 10) > 0);
    let leituraRapida = null;
    if (leiturasComPaginas.length > 0) {
        leiturasComPaginas.forEach(l => {
            const dias = ((new Date(l.dataFim) - new Date(l.dataInicio)) / (1000 * 60 * 60 * 24)) + 1;
            l.pagPorDia = (parseInt(l.livro.paginas, 10) || 0) / (dias > 0 ? dias : 1);
        });
        leituraRapida = leiturasComPaginas.reduce((max, l) => l.pagPorDia > max.pagPorDia ? l : max, leiturasComPaginas[0]);
    }
    
    let html = '';
    
    // Item 1: MVP (Melhor Livro)
    html += `
    <div class="destaque-item-novo">
        <div class="destaque-icone" style="color: var(--loot-legendary); border-color: var(--loot-legendary);">
            <i class="fa-solid fa-crown"></i>
        </div>
        <div class="destaque-info">
            <h5>MVP do Período</h5>
            <p class="destaque-valor">${melhorLivro ? melhorLivro.livro.nomeDoLivro : '-'}</p>
            <p class="destaque-sub">${melhorLivro ? `Nota ${melhorLivro.notaFinal.toFixed(1)}` : ''}</p>
        </div>
    </div>`;

    // Item 2: Mestre (Autor)
    html += `
    <div class="destaque-item-novo">
        <div class="destaque-icone" style="color: var(--loot-epic); border-color: var(--loot-epic);">
            <i class="fa-solid fa-user-graduate"></i>
        </div>
        <div class="destaque-info">
            <h5>Classe Favorita</h5>
            <p class="destaque-valor">${autorMaisLido || '-'}</p>
            <p class="destaque-sub">Autor Mais Lido</p>
        </div>
    </div>`;

    // Item 3: Speedrun (Leitura Rápida)
    html += `
    <div class="destaque-item-novo">
        <div class="destaque-icone" style="color: var(--cor-acao-primaria); border-color: var(--cor-acao-primaria);">
            <i class="fa-solid fa-bolt"></i>
        </div>
        <div class="destaque-info">
            <h5>Speedrun Record</h5>
            <p class="destaque-valor">${leituraRapida ? leituraRapida.livro.nomeDoLivro : '-'}</p>
            <p class="destaque-sub">${leituraRapida ? `${leituraRapida.pagPorDia.toFixed(0)} pág/dia` : ''}</p>
        </div>
    </div>`;
    
    this.destaquesListaNovaEl.innerHTML = html;
},

    // --- CRUCIAL: Mapeia a nota para classes de Loot RPG ---
    getClasseNota: function(nota) {
        if (nota >= 9) return 'rarity-legendary'; // Gold/Orange
        if (nota >= 7) return 'rarity-epic';      // Purple
        if (nota >= 5) return 'rarity-rare';      // Blue
        if (nota >= 3) return 'rarity-uncommon';  // Green
        return 'rarity-common';                   // Gray
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
                        case 'tempo': if(!item.dataFim) return 0; return ((new Date(item.dataFim) - new Date(item.dataInicio))/(1000*60*60*24));
                        default: return item[key];
                    }
                };
                let valA = getVal(a, ordenacao.coluna);
                let valB = getVal(b, ordenacao.coluna);
                if (typeof valA === 'string') return ordenacao.direcao === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                return ordenacao.direcao === 'asc' ? valA - valB : valB - valA;
            });
        }

        // HTML do Header
        const thead = `
            <thead>
                <tr>
                    ${colunas.map(c => `
                        <th class="${c.sortable ? 'sortable' : ''} ${ordenacao.coluna === c.key ? `sort-${ordenacao.direcao}` : ''}" data-coluna="${c.key}">
                            ${c.header} ${c.sortable ? '<i class="fa-solid fa-sort"></i>' : ''}
                        </th>
                    `).join('')}
                </tr>
            </thead>`;
        
        const body = dados.map(item => {
            const livro = item.livro || item;
            const tds = colunas.map(col => {
                let valor = '';
                switch(col.key) {
                    case 'capa': 
                        // Força a classe de imagem do CSS
                        valor = `<img src="${livro.urlCapa || 'placeholder.jpg'}" class="tabela-capa-img" alt="Capa">`; 
                        break;
                    case 'titulo': valor = `<span class="tabela-titulo">${livro.nomeDoLivro}</span>`; break;
                    case 'autor': valor = `<span class="tabela-autor">${livro.autor}</span>`; break;
                    case 'paginas': valor = `<span style="font-family:monospace;">${parseInt(livro.paginas, 10).toLocaleString('pt-BR') || '-'}</span>`; break;
                    case 'notaFinal': 
                        // Usa a nova getClasseNota
                        valor = item.notaFinal 
                            ? `<span class="badge-nota ${this.getClasseNota(item.notaFinal)}">${item.notaFinal.toFixed(1)}</span>` 
                            : '-'; 
                        break;
                    case 'dataFim': valor = new Date(item.dataFim).toLocaleDateString('pt-BR'); break;
                    case 'pagPorDia': 
                         const diasPag = item.dataInicio && item.dataFim ? ((new Date(item.dataFim) - new Date(item.dataInicio)) / (1000 * 60 * 60 * 24)) + 1 : 0;
                         const ppd = diasPag > 0 ? ((parseInt(livro.paginas, 10) || 0) / diasPag).toFixed(0) : '-';
                         valor = `<span style="color:var(--cor-texto-destaque)">${ppd}</span>`;
                         break;
                    case 'mediaNota': 
                        valor = item.mediaNota ? `<span class="badge-nota ${this.getClasseNota(item.mediaNota)}">${item.mediaNota.toFixed(1)}</span>` : '-';
                        break;
                    case 'count': valor = `<strong>${item.count}</strong>`; break;
                    case 'nome': valor = `<span style="color: #fff; font-weight:600;">${item.nome}</span>`; break;
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
            { header: 'Capa', key: 'capa', sortable: false },
            { header: 'Título', key: 'titulo', sortable: true },
            { header: 'Autor', key: 'autor', sortable: true },
            { header: 'Páginas', key: 'paginas', sortable: true },
            { header: 'Rank', key: 'notaFinal', sortable: true },
            { header: 'Conclusão', key: 'dataFim', sortable: true },
            { header: 'Ritmo', key: 'pagPorDia', sortable: true },
        ]);
    },

    renderMelhoresAutores: function(leituras) {
        const dados = this.calcularRanking(leituras, 'autor', 1);
        this.renderTabela('tabela-melhores-autores', this.tabelaMelhoresAutoresEl, dados, [
            { header: 'Autor', key: 'nome', sortable: true }, 
            { header: 'Média', key: 'mediaNota', sortable: true }, 
            { header: 'Livros', key: 'count', sortable: true }
        ]);
    },

    renderMelhoresColecoes: function(leituras) {
        const dados = this.calcularRanking(leituras.filter(l => l.livro.colecao && l.livro.colecao !== '-'), 'colecao', 1);
        this.renderTabela('tabela-melhores-colecoes', this.tabelaMelhoresColecoesEl, dados, [
            { header: 'Coleção', key: 'nome', sortable: true }, 
            { header: 'Média', key: 'mediaNota', sortable: true }, 
            { header: 'Livros', key: 'count', sortable: true }
        ]);
    },

    renderMelhoresEditoras: function(leituras) {
        const dados = this.calcularRanking(leituras.filter(l => l.livro.editora), 'editora', 1);
        this.renderTabela('tabela-melhores-editoras', this.tabelaMelhoresEditorasEl, dados, [
            { header: 'Editora', key: 'nome', sortable: true }, 
            { header: 'Média', key: 'mediaNota', sortable: true }, 
            { header: 'Livros', key: 'count', sortable: true }
        ]);
    },

    calcularMaisFrequente: function(array) {
        if (!array || array.length === 0) return null;
        const contagem = array.reduce((acc, val) => { if (val) acc[val] = (acc[val] || 0) + 1; return acc; }, {});
        if (Object.keys(contagem).length === 0) return null;
        return Object.keys(contagem).reduce((a, b) => contagem[a] > contagem[b] ? a : b);
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
    },

    renderGraficoResumoAnual: function(leituras) {
        if (this.state.graficoResumoAnual) this.state.graficoResumoAnual.destroy();
        const dadosPorAno = leituras.reduce((acc, l) => {
            const ano = new Date(l.dataFim).getFullYear();
            if (!acc[ano]) acc[ano] = { livros: 0, paginas: 0, ano };
            acc[ano].livros++; acc[ano].paginas += parseInt(l.livro.paginas, 10) || 0;
            return acc;
        }, {});
        const dadosOrdenados = Object.values(dadosPorAno).sort((a, b) => a.ano - b.ano);
        
        // Configuração Dark/Neon para o ChartJS
        Chart.defaults.color = '#94a3b8';
        Chart.defaults.borderColor = 'rgba(255,255,255,0.1)';

        this.state.graficoResumoAnual = new Chart(this.graficoResumoAnualEl, {
            type: 'bar',
            data: {
                labels: dadosOrdenados.map(d => d.ano),
                datasets: [
                    { 
                        label: 'Livros', 
                        data: dadosOrdenados.map(d => d.livros), 
                        backgroundColor: 'rgba(45, 212, 191, 0.6)', 
                        borderColor: '#2dd4bf', 
                        borderWidth: 1, 
                        yAxisID: 'y',
                        hoverBackgroundColor: '#2dd4bf'
                    },
                    { 
                        label: 'Páginas', 
                        data: dadosOrdenados.map(d => d.paginas), 
                        backgroundColor: 'rgba(245, 158, 11, 0.2)', 
                        borderColor: '#f59e0b', 
                        borderWidth: 2, 
                        yAxisID: 'y1', 
                        type: 'line', 
                        tension: 0.3,
                        pointBackgroundColor: '#f59e0b'
                    }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { position: 'left', grid: {color: 'rgba(255,255,255,0.05)'} }, y1: { position: 'right', grid: { drawOnChartArea: false } } } }
        });
    },

    renderGraficoLidosPorMes: function(leituras) {
        if (this.state.graficoLidosPorMes) this.state.graficoLidosPorMes.destroy();
        const dadosMensais = new Array(12).fill(0);
        leituras.forEach(l => dadosMensais[new Date(l.dataFim).getUTCMonth()]++);
        
        this.state.graficoLidosPorMes = new Chart(this.graficoLidosPorMesEl, {
            type: 'bar',
            data: { 
                labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'], 
                datasets: [{ 
                    label: 'Livros', 
                    data: dadosMensais, 
                    backgroundColor: 'rgba(168, 85, 247, 0.6)', 
                    borderColor: '#a855f7', 
                    borderWidth: 1,
                    hoverBackgroundColor: '#a855f7'
                }] 
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }, plugins: { legend: { display: false } } }
        });
    },

    renderGraficoDistribuicaoNotas: function(leituras) {
        if (this.state.graficoDistribuicaoNotas) this.state.graficoDistribuicaoNotas.destroy();
        const notas = new Array(11).fill(0);
        leituras.filter(l => l.notaFinal != null).forEach(l => { const n = Math.round(l.notaFinal); if (n >= 0 && n <= 10) notas[n]++; });
        
        // Gradiente de cores baseado na nota
        const colors = notas.map((_, i) => {
            if(i >= 9) return '#f59e0b'; // Legendary
            if(i >= 7) return '#a855f7'; // Epic
            if(i >= 5) return '#3b82f6'; // Rare
            return '#94a3b8'; // Common
        });

        this.state.graficoDistribuicaoNotas = new Chart(this.graficoDistribuicaoNotasEl, {
            type: 'bar',
            data: { 
                labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], 
                datasets: [{ 
                    label: 'Quantidade', 
                    data: notas, 
                    backgroundColor: colors, 
                    borderWidth: 0,
                    borderRadius: 4
                }] 
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }, plugins: { legend: { display: false } } }
        });
    },

    renderGraficoDNA: function(leituras) {
        if (this.state.graficoDNA) this.state.graficoDNA.destroy();
        const criterios = ['personagens', 'plot', 'desenvolvimento', 'pacing', 'prosa', 'originalidade', 'temas', 'impacto', 'closing', 'releitura'];
        const labels = ['Personagens', 'Enredo', 'Mundo', 'Ritmo', 'Prosa', 'Originalidade', 'Temas', 'Impacto', 'Final', 'Releitura'];
        const somas = new Array(10).fill(0); const contagens = new Array(10).fill(0);
        
        leituras.forEach(l => { if (l.notas) criterios.forEach((crit, i) => { if (l.notas[crit] !== undefined) { somas[i] += l.notas[crit]; contagens[i]++; } }); });
        const medias = somas.map((s, i) => contagens[i] > 0 ? s / contagens[i] : 0);
        const minVal = Math.max(0, Math.min(...medias.filter(m => m > 0)) - 1);

        this.state.graficoDNA = new Chart(this.graficoDNAEl, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Meu DNA',
                    data: medias,
                    fill: true,
                    backgroundColor: 'rgba(45, 212, 191, 0.2)',
                    borderColor: '#2dd4bf',
                    pointBackgroundColor: '#0f172a',
                    pointBorderColor: '#2dd4bf',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#2dd4bf'
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, elements: { line: { borderWidth: 2 } },
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255,255,255,0.1)' },
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        pointLabels: { color: '#94A3B8', font: { size: 11 } },
                        ticks: { backdropColor: 'transparent', color: 'transparent', z: 1 }, // Esconde numeros do eixo
                        min: minVal,
                        max: 10
                    }
                },
                plugins: { legend: { display: false } }
            }
        });
    },

    renderGraficoGeneros: function(leituras) {
        if (this.state.graficoGeneros) this.state.graficoGeneros.destroy();
        const counts = {};
        leituras.forEach(l => { if (l.livro.categorias) l.livro.categorias.split(',').forEach(c => { const cat = c.trim(); if (cat) counts[cat] = (counts[cat] || 0) + 1; }); });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        const top5 = sorted.slice(0, 5); const outros = sorted.slice(5).reduce((acc, val) => acc + val[1], 0);
        const labels = top5.map(i => i[0]); const data = top5.map(i => i[1]);
        if (outros > 0) { labels.push('Outros'); data.push(outros); }
        
        this.state.graficoGeneros = new Chart(this.graficoGenerosEl, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{ 
                    data: data, 
                    backgroundColor: ['#2dd4bf', '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#94a3b8'], 
                    borderColor: '#0f172a', 
                    borderWidth: 2 
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#94A3B8', boxWidth: 12 } } } }
        });
    },

    renderGraficoRitmo: function(leituras) {
        if (this.state.graficoRitmo) this.state.graficoRitmo.destroy();
        const dataPoints = leituras.filter(l => l.livro.paginas && l.dataInicio && l.dataFim).map(l => {
            const dias = Math.max(1, Math.round((new Date(l.dataFim) - new Date(l.dataInicio)) / (1000 * 60 * 60 * 24)));
            return { x: parseInt(l.livro.paginas, 10), y: dias, livro: l.livro.nomeDoLivro };
        });
        this.state.graficoRitmo = new Chart(this.graficoRitmoEl, {
            type: 'scatter',
            data: { 
                datasets: [{ 
                    label: 'Livros', 
                    data: dataPoints, 
                    backgroundColor: 'rgba(245, 158, 11, 0.7)', 
                    borderColor: '#f59e0b', 
                    borderWidth: 1,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }] 
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: { x: { title: { display: true, text: 'Páginas', color: '#64748b' }, grid: {color:'rgba(255,255,255,0.05)'} }, y: { title: { display: true, text: 'Dias', color: '#64748b' }, grid: {color:'rgba(255,255,255,0.05)'} } },
                plugins: { tooltip: { callbacks: { label: ctx => `${ctx.raw.livro}: ${ctx.raw.x} pág em ${ctx.raw.y} dias` } }, legend: { display: false } }
            }
        });
    }
};