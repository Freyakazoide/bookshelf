const Dashboard = {
    state: {
        todosOsLivros: [],
        anosDisponiveis: [],
        anoFiltro: ['all-time'], // Agora é um array, default 'all-time'
        ordenacaoTabelas: {},
        graficoResumoAnual: null,
        graficoLidosPorMes: null,
        graficoDistribuicaoNotas: null,
    },
    cacheDOM: function() {
        // Novo Filtro de Ano
        this.filtroAnoContainerEl = document.getElementById('filtro-ano-container');
        this.filtroAnoBtnEl = document.getElementById('filtro-ano-btn');
        this.filtroAnoDropdownEl = document.getElementById('filtro-ano-dropdown');

        // KPIs
        this.kpiHeroNovoEl = document.getElementById('kpi-hero-novo');
        this.kpiPaginasNovoEl = document.getElementById('kpi-paginas-novo');
        this.kpiNotaNovoEl = document.getElementById('kpi-nota-novo');
        this.kpiAutoresNovoEl = document.getElementById('kpi-autores-novo');

        // Destaques
        this.destaquesListaNovaEl = document.getElementById('destaques-lista-nova');

        // Widgets (Contêineres)
        this.widgetResumoPorAno = document.getElementById('resumo-por-ano');
        this.widgetMelhoresAutores = document.getElementById('melhores-autores');
        this.widgetListaLivrosAno = document.getElementById('lista-livros-ano');
        this.widgetMelhoresColecoes = document.getElementById('melhores-colecoes');
        this.widgetMelhoresEditoras = document.getElementById('melhores-editoras');
        this.widgetLidosPorMes = document.getElementById('widget-lidos-por-mes');
        this.widgetDistribuicaoNotas = document.getElementById('widget-distribuicao-notas');
        this.melhoresRankingContainerEl = document.querySelector('.melhores-ranking-container');

        // Títulos e Tabelas
        this.tituloTabelaLivrosAnoEl = document.getElementById('titulo-tabela-livros-ano');
        this.tituloGraficoMesEl = document.getElementById('titulo-grafico-mes');
        this.tabelaLivrosAnoEl = document.getElementById('tabela-livros-ano');
        this.tabelaMelhoresAutoresEl = document.getElementById('tabela-melhores-autores');
        this.tabelaMelhoresColecoesEl = document.getElementById('tabela-melhores-colecoes');
        this.tabelaMelhoresEditorasEl = document.getElementById('tabela-melhores-editoras');
        
        // Canvas dos Gráficos
        this.graficoResumoAnualEl = document.getElementById('grafico-resumo-anual');
        this.graficoLidosPorMesEl = document.getElementById('grafico-lidos-por-mes');
        this.graficoDistribuicaoNotasEl = document.getElementById('grafico-distribuicao-notas');
    },
    bindEvents: function() {
        // Abre/Fecha o dropdown de anos
        this.filtroAnoBtnEl.addEventListener('click', (e) => {
            e.stopPropagation();
            this.filtroAnoDropdownEl.classList.toggle('hidden');
            this.filtroAnoBtnEl.classList.toggle('open');
        });

        // Fecha o dropdown se clicar fora
        document.addEventListener('click', (e) => {
            if (!this.filtroAnoContainerEl.contains(e.target) && !this.filtroAnoDropdownEl.classList.contains('hidden')) {
                this.filtroAnoDropdownEl.classList.add('hidden');
                this.filtroAnoBtnEl.classList.remove('open');
            }
        });

        // Lida com a seleção de checkboxes no dropdown
        this.filtroAnoDropdownEl.addEventListener('change', (e) => {
            if (!e.target.matches('input[type="checkbox"]')) return;

            const checkbox = e.target;
            const valor = checkbox.value;
            let selecaoAtual = [...this.state.anoFiltro];

            if (valor === 'all-time') {
                selecaoAtual = ['all-time'];
            } else {
                selecaoAtual = selecaoAtual.filter(item => item !== 'all-time');
                if (checkbox.checked) {
                    selecaoAtual.push(valor);
                } else {
                    selecaoAtual = selecaoAtual.filter(item => item !== valor);
                }
            }

            if (selecaoAtual.length === 0) {
                selecaoAtual = ['all-time'];
            }
            
            this.state.anoFiltro = selecaoAtual;
            this.popularFiltroDeAno(); // Atualiza os checkboxes e o texto do botão
            this.render(); // Renderiza o dashboard com a nova seleção
        });

        // Eventos de ordenação das tabelas
        const tabelas = [
            this.tabelaLivrosAnoEl, this.tabelaMelhoresAutoresEl,
            this.tabelaMelhoresColecoesEl, this.tabelaMelhoresEditorasEl
        ];
        tabelas.forEach(tabela => {
            if (tabela) {
                tabela.addEventListener('click', (e) => {
                    const th = e.target.closest('th.sortable');
                    if (th) {
                        const tabelaId = tabela.id;
                        const coluna = th.dataset.coluna;
                        const ordenacaoAtual = this.state.ordenacaoTabelas[tabelaId] || {};
                        let direcao = 'desc';
                        if (ordenacaoAtual.coluna === coluna && ordenacaoAtual.direcao === 'desc') {
                            direcao = 'asc';
                        }
                        this.state.ordenacaoTabelas[tabelaId] = { coluna, direcao };
                        this.render();
                    }
                });
            }
        });
    },
    init: function(livros) {
        this.state.todosOsLivros = livros;
        const todasAsLeituras = this.state.todosOsLivros.flatMap(livro =>
            (livro.leituras || []).map(leitura => ({ ...leitura, livro }))
        ).filter(leitura => leitura.dataFim);
        
        const anos = new Set(todasAsLeituras.map(l => new Date(l.dataFim).getFullYear()));
        this.state.anosDisponiveis = Array.from(anos).sort((a, b) => b - a);

        this.cacheDOM();
        this.bindEvents();
        this.popularFiltroDeAno();
        this.render();
    },
    atualizar: function(livros) {
        this.state.todosOsLivros = livros;
        const todasAsLeituras = this.state.todosOsLivros.flatMap(livro =>
            (livro.leituras || []).map(leitura => ({ ...leitura, livro }))
        ).filter(leitura => leitura.dataFim);
        
        const anos = new Set(todasAsLeituras.map(l => new Date(l.dataFim).getFullYear()));
        this.state.anosDisponiveis = Array.from(anos).sort((a, b) => b - a);
        
        this.popularFiltroDeAno();
        this.render();
    },
    render: function() {
        if (!this.state.todosOsLivros || this.state.todosOsLivros.length === 0) {
            return;
        }

        const todasAsLeituras = this.state.todosOsLivros.flatMap(livro =>
            (livro.leituras || []).map(leitura => ({ ...leitura, livro }))
        ).filter(leitura => leitura.dataFim);
        
        const eTodoPeriodo = this.state.anoFiltro.includes('all-time');
        const eAnoUnico = !eTodoPeriodo && this.state.anoFiltro.length === 1;

        const leiturasFiltradas = eTodoPeriodo
            ? todasAsLeituras
            : todasAsLeituras.filter(l => this.state.anoFiltro.includes(new Date(l.dataFim).getFullYear().toString()));
        
        this.renderKPIs(leiturasFiltradas);
        this.renderDestaques(leiturasFiltradas);
        
        this.renderGraficoDistribuicaoNotas(leiturasFiltradas);

        // --- INÍCIO DA CORREÇÃO ---
        // A tabela de livros agora é SEMPRE visível.
        // Ela é a base da visualização.
        this.widgetListaLivrosAno.style.display = 'block';
        this.renderListaDeLivros(leiturasFiltradas); 

        if (eAnoUnico) {
            // MOSTRA VISÃO DE ANO ÚNICO
            this.widgetResumoPorAno.style.display = 'none';
            this.melhoresRankingContainerEl.style.display = 'none';
            this.widgetLidosPorMes.style.display = 'block'; // Mostra o gráfico de mês

            const ano = this.state.anoFiltro[0];
            this.tituloTabelaLivrosAnoEl.textContent = `Livros Lidos em ${ano}`; // Título específico
            this.tituloGraficoMesEl.textContent = `Leituras por Mês em ${ano}`;
            
            this.renderGraficoLidosPorMes(leiturasFiltradas);
        } else {
            // MOSTRA VISÃO DE RANKING (ALL-TIME OU MÚLTIPLOS ANOS)
            this.widgetResumoPorAno.style.display = 'block';
            this.melhoresRankingContainerEl.style.display = 'grid';
            this.widgetLidosPorMes.style.display = 'none'; // Esconde o gráfico de mês

            // Título genérico para a tabela de livros
            if (eTodoPeriodo) {
                 this.tituloTabelaLivrosAnoEl.textContent = `Todos os Livros Lidos`;
            } else {
                 this.tituloTabelaLivrosAnoEl.textContent = `Livros Lidos nos ${this.state.anoFiltro.length} anos selecionados`;
            }

            this.renderGraficoResumoAnual(leiturasFiltradas);
            this.renderMelhoresColecoes(leiturasFiltradas);
            this.renderMelhoresEditoras(leiturasFiltradas);
            this.renderMelhoresAutores(leiturasFiltradas);
        }
    },
    popularFiltroDeAno: function() {
        // Atualiza os checkboxes
        let htmlDropdown = `
            <div class="filtro-ano-item">
                <input type="checkbox" id="ano-all-time" value="all-time" ${this.state.anoFiltro.includes('all-time') ? 'checked' : ''}>
                <label for="ano-all-time">Todo o Período</label>
            </div>
        `;
        
        this.state.anosDisponiveis.forEach(ano => {
            htmlDropdown += `
                <div class="filtro-ano-item">
                    <input type="checkbox" id="ano-${ano}" value="${ano}" ${this.state.anoFiltro.includes(ano.toString()) ? 'checked' : ''}>
                    <label for="ano-${ano}">${ano}</label>
                </div>
            `;
        });
        this.filtroAnoDropdownEl.innerHTML = htmlDropdown;

        // Atualiza o texto do botão
        if (this.state.anoFiltro.includes('all-time') || this.state.anoFiltro.length === 0) {
            this.filtroAnoBtnEl.textContent = 'Todo o Período';
        } else if (this.state.anoFiltro.length === 1) {
            this.filtroAnoBtnEl.textContent = this.state.anoFiltro[0];
        } else {
            this.filtroAnoBtnEl.textContent = `${this.state.anoFiltro.length} anos selecionados`;
        }
    },
    renderKPIs: function(leituras) {
        const totalLivros = leituras.length;
        const totalPaginas = leituras.reduce((s, l) => s + (parseInt(l.livro.paginas, 10) || 0), 0);
        const leiturasComNota = leituras.filter(l => l.notaFinal);
        const notaMedia = leiturasComNota.length > 0 ? leiturasComNota.reduce((s, l) => s + (l.notaFinal || 0), 0) / leiturasComNota.length : 0;
        const totalAutores = new Set(leituras.map(l => l.livro.autor)).size;

        this.kpiHeroNovoEl.innerHTML = `
            <h4><i class="fa-solid fa-book-open"></i> Total de Livros</h4>
            <div class="valor-kpi-hero">${totalLivros}</div>
            <div class="subtitulo-kpi-hero">lidos neste período</div>
        `;
        this.kpiPaginasNovoEl.innerHTML = `
            <h4><i class="fa-solid fa-file-lines"></i> Páginas Lidas</h4>
            <div class="valor-kpi">${totalPaginas.toLocaleString('pt-BR')}</div>
        `;
        this.kpiNotaNovoEl.innerHTML = `
            <h4><i class="fa-solid fa-star"></i> Nota Média</h4>
            <div class="valor-kpi">${notaMedia.toFixed(2).replace('.',',')}</div>
        `;
        this.kpiAutoresNovoEl.innerHTML = `
            <h4><i class="fa-solid fa-pen-nib"></i> Autores Lidos</h4>
            <div class="valor-kpi">${totalAutores}</div>
        `;
    },
    renderDestaques: function(leituras) {
        const leiturasComNota = leituras.filter(l => l.notaFinal);
        const autorMaisLido = this.calcularMaisFrequente(leituras.map(l => l.livro.autor));
        const melhorLivro = leiturasComNota.length > 0 ? leiturasComNota.reduce((a, b) => a.notaFinal > b.notaFinal ? a : b) : null;
        const piorLivro = leiturasComNota.length > 0 ? leiturasComNota.reduce((a, b) => a.notaFinal < b.notaFinal ? a : b) : null;
        
        const leiturasComPaginas = leituras.filter(l => parseInt(l.livro.paginas, 10) > 0);
        let leituraRapida = null, leituraLenta = null, maisLongo = null, maisCurto = null;
        
        if (leiturasComPaginas.length > 0) {
            leiturasComPaginas.forEach(l => {
                const dias = ((new Date(l.dataFim) - new Date(l.dataInicio)) / (1000 * 60 * 60 * 24)) + 1;
                l.pagPorDia = (parseInt(l.livro.paginas, 10) || 0) / (dias > 0 ? dias : 1);
            });
            leituraRapida = leiturasComPaginas.reduce((max, l) => l.pagPorDia > max.pagPorDia ? l : max, leiturasComPaginas[0]);
            leituraLenta = leiturasComPaginas.reduce((min, l) => l.pagPorDia < min.pagPorDia ? l : min, leiturasComPaginas[0]);
            
            maisLongo = leiturasComPaginas.reduce((a, b) => (parseInt(a.livro.paginas, 10) || 0) > (parseInt(b.livro.paginas, 10) || 0) ? a : b);
            maisCurto = leiturasComPaginas.reduce((a, b) => (parseInt(a.livro.paginas, 10) || 0) < (parseInt(b.livro.paginas, 10) || 0) ? a : b);
        }
        
        const leiturasComTempo = leituras.filter(l => l.dataInicio && l.dataFim);
        const totalDias = leiturasComTempo.reduce((s, l) => {
            const dias = ((new Date(l.dataFim) - new Date(l.dataInicio)) / (1000 * 60 * 60 * 24)) + 1;
            return s + (dias > 0 ? dias : 1);
        }, 0);
        const tempoMedio = leiturasComTempo.length > 0 ? (totalDias / leiturasComTempo.length) : 0;
        
        const meses = leituras.reduce((acc, l) => {
            const mesAno = new Date(l.dataFim).toISOString().slice(0, 7);
            acc[mesAno] = (acc[mesAno] || 0) + 1;
            return acc;
        }, {});
        const mesProdutivo = Object.keys(meses).length > 0 ? Object.keys(meses).reduce((a, b) => meses[a] > meses[b] ? a : b) : null;

        let html = '';
        html += `
            <div class="destaque-item-novo">
                <h5><i class="fa-solid fa-trophy"></i> Melhor Livro</h5>
                <p class="destaque-valor">${melhorLivro ? melhorLivro.livro.nomeDoLivro : '-'}</p>
                <p class="destaque-sub">${melhorLivro ? `Nota ${melhorLivro.notaFinal.toFixed(1).replace('.',',')}` : ''}</p>
            </div>
        `;
        html += `
            <div class="destaque-item-novo">
                <h5><i class="fa-solid fa-thumbs-down"></i> Pior Livro</h5>
                <p class="destaque-valor">${piorLivro ? piorLivro.livro.nomeDoLivro : '-'}</p>
                <p class="destaque-sub">${piorLivro ? `Nota ${piorLivro.notaFinal.toFixed(1).replace('.',',')}` : ''}</p>
            </div>
        `;
        html += `
            <div class="destaque-item-novo">
                <h5><i class="fa-solid fa-pen-nib"></i> Autor Mais Lido</h5>
                <p class="destaque-valor">${autorMaisLido || '-'}</p>
            </div>
        `;
        html += `
            <div class="destaque-item-novo">
                <h5><i class="fa-solid fa-calendar-star"></i> Mês Mais Produtivo</h5>
                <p class="destaque-valor">${mesProdutivo ? new Date(mesProdutivo + '-02').toLocaleString('pt-BR', {month: 'long', year: 'numeric'}) : '-'}</p>
                <p class="destaque-sub">${mesProdutivo ? `${meses[mesProdutivo]} livros` : ''}</p>
            </div>
        `;
        html += `
            <div class="destaque-item-novo">
                <h5><i class="fa-solid fa-rocket"></i> Leitura Mais Rápida</h5>
                <p class="destaque-valor">${leituraRapida ? leituraRapida.livro.nomeDoLivro : '-'}</p>
                <p class="destaque-sub">${leituraRapida ? `${leituraRapida.pagPorDia.toFixed(0)} pág/dia` : ''}</p>
            </div>
        `;
        html += `
            <div class="destaque-item-novo">
                <h5><i class="fa-solid fa-person-walking"></i> Leitura Mais Lenta</h5>
                <p class="destaque-valor">${leituraLenta ? leituraLenta.livro.nomeDoLivro : '-'}</p>
                <p class="destaque-sub">${leituraLenta ? `${leituraLenta.pagPorDia.toFixed(1)} pág/dia` : ''}</p>
            </div>
        `;
         html += `
            <div class="destaque-item-novo">
                <h5><i class="fa-solid fa-hourglass-half"></i> Tempo Médio de Leitura</h5>
                <p class="destaque-valor">${tempoMedio.toFixed(1).replace('.',',')} dias</p>
                <p class="destaque-sub">por livro</p>
            </div>
        `;
        html += `
            <div class="destaque-item-novo">
                <h5><i class="fa-solid fa-file-arrow-up"></i> Livro Mais Longo</h5>
                <p class="destaque-valor">${maisLongo ? maisLongo.livro.nomeDoLivro : '-'}</p>
                <p class="destaque-sub">${maisLongo ? `${parseInt(maisLongo.livro.paginas, 10).toLocaleString('pt-BR')} pág` : ''}</p>
            </div>
        `;
        html += `
            <div class="destaque-item-novo">
                <h5><i class="fa-solid fa-file-arrow-down"></i> Livro Mais Curto</h5>
                <p class="destaque-valor">${maisCurto ? maisCurto.livro.nomeDoLivro : '-'}</p>
                <p class="destaque-sub">${maisCurto ? `${parseInt(maisCurto.livro.paginas, 10).toLocaleString('pt-BR')} pág` : ''}</p>
            </div>
        `;
        
        this.destaquesListaNovaEl.innerHTML = html;
    },
    getClasseNota: function(nota) {
        if (nota >= 9) return 'nota-excelente'; if (nota >= 7) return 'nota-boa'; if (nota >= 5) return 'nota-media';
        if (nota >= 3) return 'nota-ruim'; if (nota > 0) return 'nota-pessima'; return '';
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
                        case 'nome': return item.nome || '';
                        case 'nomeDoLivro': return item.nomeDoLivro || '';
                        
                        case 'dataFim': return item.dataFim ? new Date(item.dataFim).getTime() : 0;
                        case 'dataAquisicao': return item.dataAquisicao ? new Date(item.dataAquisicao).getTime() : 0;
                        case 'tempo': 
                            if (!item.dataFim || !item.dataInicio) return 0;
                            const diasTempo = ((new Date(item.dataFim) - new Date(item.dataInicio)) / (1000 * 60 * 60 * 24)) + 1;
                            return diasTempo > 0 ? diasTempo : 1;

                        case 'pagPorDia': 
                            if (!item.dataFim || !item.dataInicio) return 0;
                            const dias = ((new Date(item.dataFim) - new Date(item.dataInicio)) / (1000*60*60*24)) + 1; 
                            return (parseInt(livro.paginas, 10) || 0) / (dias > 0 ? dias : 1);
                        
                        case 'paginas': 
                            return parseInt(livro.paginas || item.paginas, 10) || 0;
                        
                        case 'notaFinal': 
                            return parseFloat(item.notaFinal) || 0;
                        case 'mediaNota': 
                            return parseFloat(item.mediaNota) || 0;
                        case 'count': 
                            return parseInt(item.count, 10) || 0;
                        case 'livros': 
                            return parseInt(item.livros, 10) || 0;
                        
                        default: 
                            const val = item[key];
                            if (typeof val === 'number') return val;
                            if (typeof val === 'string') return parseFloat(val.replace(',', '.')) || 0;
                            return 0;
                    }
                };
                let valA = getVal(a, ordenacao.coluna);
                let valB = getVal(b, ordenacao.coluna);
                
                if (typeof valA === 'string') {
                    return ordenacao.direcao === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                }
                return ordenacao.direcao === 'asc' ? valA - valB : valB - valA;
            });
        }
        const thead = `<thead><tr>${colunas.map(c => `<th class="${c.sortable ? 'sortable' : ''} ${ordenacao.coluna === c.key ? `sort-${ordenacao.direcao}` : ''}" data-coluna="${c.key}">${c.header}</th>`).join('')}</tr></thead>`;
        const body = dados.map(item => {
            const livro = item.livro || item;
            const tds = colunas.map(col => {
                let valor = '';
                switch(col.key) {
                    case 'titulo': valor = livro.nomeDoLivro; break;
                    case 'autor': valor = livro.autor; break;
                    case 'nomeDoLivro': valor = item.nomeDoLivro; break;
                    case 'paginas': 
                        valor = parseInt(livro.paginas, 10) || '-'; 
                        if(valor !== '-') valor = valor.toLocaleString('pt-BR');
                        break;
                    case 'notaFinal': valor = item.notaFinal ? item.notaFinal.toFixed(1).replace('.', ',') : '-'; break;
                    case 'dataFim': valor = new Date(item.dataFim).toLocaleDateString('pt-BR', {timeZone: 'UTC'}); break;
                    case 'dataAquisicao': valor = new Date(item.dataAquisicao).toLocaleDateString('pt-BR', {timeZone: 'UTC'}); break;
                    case 'tempo': 
                        const dias = item.dataInicio && item.dataFim ? Math.round((new Date(item.dataFim) - new Date(item.dataInicio)) / (1000 * 60 * 60 * 24)) + 1 : 0;
                        valor = dias > 0 ? `${dias} dias` : '-';
                        break;
                    case 'pagPorDia': 
                        const diasPag = item.dataInicio && item.dataFim ? ((new Date(item.dataFim) - new Date(item.dataInicio)) / (1000 * 60 * 60 * 24)) + 1 : 0;
                        valor = diasPag > 0 ? ((parseInt(livro.paginas, 10) || 0) / diasPag).toFixed(1).replace('.', ',') : '-';
                        break;
                    case 'ano': valor = item.ano; break;
                    case 'livros': valor = item.livros; break;
                    case 'mediaNota': valor = item.mediaNota.toFixed(2).replace('.', ','); break;
                    case 'nome': valor = item.nome; break;
                    case 'count': valor = item.count; break;
                    default: valor = item[col.key] || '-';
                }
                const classeNota = col.key === 'notaFinal' || col.key === 'mediaNota' ? this.getClasseNota(parseFloat(valor.replace(',','.'))) : '';
                return `<td class="${classeNota}">${valor}</td>`;
            }).join('');
            return `<tr>${tds}</tr>`;
        }).join('');
        el.innerHTML = `${thead}<tbody>${body || `<tr><td colspan="${colunas.length}">Nenhum dado encontrado.</td></tr>`}</tbody>`;
    },
    renderListaDeLivros: function(leituras) {
        this.renderTabela('tabela-livros-ano', this.tabelaLivrosAnoEl, leituras, [
            { header: 'Título', key: 'titulo', sortable: true },
            { header: 'Autor', key: 'autor', sortable: true },
            { header: 'Páginas', key: 'paginas', sortable: true },
            { header: 'Nota', key: 'notaFinal', sortable: true },
            { header: 'Terminei em', key: 'dataFim', sortable: true },
            { header: 'Tempo', key: 'tempo', sortable: true },
            { header: 'Pág/Dia', key: 'pagPorDia', sortable: true },
        ]);
    },
    renderMelhoresAutores: function(leituras) {
        const dados = this.calcularRanking(leituras, 'autor', 3);
        this.renderTabela('tabela-melhores-autores', this.tabelaMelhoresAutoresEl, dados, [
            { header: 'Autor', key: 'nome', sortable: true }, { header: 'Nota Média', key: 'mediaNota', sortable: true },
            { header: 'Livros', key: 'count', sortable: true }
        ]);
    },
    renderMelhoresColecoes: function(leituras) {
        const dados = this.calcularRanking(leituras.filter(l => l.livro.colecao && l.livro.colecao !== '-'), 'colecao', 3);
        this.renderTabela('tabela-melhores-colecoes', this.tabelaMelhoresColecoesEl, dados, [
            { header: 'Coleção', key: 'nome', sortable: true }, { header: 'Nota Média', key: 'mediaNota', sortable: true },
            { header: 'Livros', key: 'count', sortable: true }
        ]);
    },
    renderMelhoresEditoras: function(leituras) {
        const dados = this.calcularRanking(leituras.filter(l => l.livro.editora), 'editora', 3);
        this.renderTabela('tabela-melhores-editoras', this.tabelaMelhoresEditorasEl, dados, [
            { header: 'Editora', key: 'nome', sortable: true }, { header: 'Nota Média', key: 'mediaNota', sortable: true },
            { header: 'Livros', key: 'count', sortable: true }
        ]);
    },
    calcularMaisFrequente: function(array) {
        if (!array || array.length === 0) return null;
        const contagem = array.reduce((acc, val) => {
            if (val) acc[val] = (acc[val] || 0) + 1;
            return acc;
        }, {});
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
        if (this.state.graficoResumoAnual) {
            this.state.graficoResumoAnual.destroy();
        }
        const dadosPorAno = leituras.reduce((acc, l) => {
            const ano = new Date(l.dataFim).getFullYear();
            if (!acc[ano]) acc[ano] = { livros: 0, paginas: 0, ano };
            acc[ano].livros++;
            acc[ano].paginas += parseInt(l.livro.paginas, 10) || 0;
            return acc;
        }, {});

        const dadosOrdenados = Object.values(dadosPorAno).sort((a, b) => a.ano - b.ano);
        const labels = dadosOrdenados.map(d => d.ano);
        const dataLivros = dadosOrdenados.map(d => d.livros);
        const dataPaginas = dadosOrdenados.map(d => d.paginas);

        this.state.graficoResumoAnual = new Chart(this.graficoResumoAnualEl, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Livros Lidos',
                        data: dataLivros,
                        backgroundColor: 'rgba(45, 212, 191, 0.6)',
                        borderColor: 'rgba(45, 212, 191, 1)',
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Páginas Lidas',
                        data: dataPaginas,
                        backgroundColor: 'rgba(255, 159, 64, 0.6)',
                        borderColor: 'rgba(255, 159, 64, 1)',
                        borderWidth: 1,
                        yAxisID: 'y1',
                        type: 'line',
                        tension: 0.2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: 'Nº de Livros'}
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: { display: true, text: 'Nº de Páginas'},
                        grid: { drawOnChartArea: false }
                    }
                }
            }
        });
    },
    renderGraficoLidosPorMes: function(leituras) {
        if (this.state.graficoLidosPorMes) {
            this.state.graficoLidosPorMes.destroy();
        }
        
        const mesesLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const dadosMensais = new Array(12).fill(0);
        
        leituras.forEach(l => {
            const mesIndex = new Date(l.dataFim).getUTCMonth();
            dadosMensais[mesIndex]++;
        });

        this.state.graficoLidosPorMes = new Chart(this.graficoLidosPorMesEl, {
            type: 'bar',
            data: {
                labels: mesesLabels,
                datasets: [{
                    label: 'Livros Lidos',
                    data: dadosMensais,
                    backgroundColor: 'rgba(45, 212, 191, 0.6)',
                    borderColor: 'rgba(45, 212, 191, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                           stepSize: 1
                        },
                        title: { display: true, text: 'Nº de Livros'}
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    },
    renderGraficoDistribuicaoNotas: function(leituras) {
        if (this.state.graficoDistribuicaoNotas) {
            this.state.graficoDistribuicaoNotas.destroy();
        }
        
        const notas = new Array(11).fill(0);
        const labels = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
        
        leituras.filter(l => l.notaFinal != null).forEach(l => {
            const nota = Math.round(l.notaFinal);
            if (nota >= 0 && nota <= 10) {
                notas[nota]++;
            }
        });
        
        this.state.graficoDistribuicaoNotas = new Chart(this.graficoDistribuicaoNotasEl, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Nº de Livros',
                    data: notas,
                    backgroundColor: 'rgba(94, 234, 212, 0.6)',
                    borderColor: 'rgba(94, 234, 212, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 },
                        title: { display: true, text: 'Nº de Livros' }
                    },
                    x: {
                        title: { display: true, text: 'Nota' }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
};