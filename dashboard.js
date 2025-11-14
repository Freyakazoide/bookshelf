const Dashboard = {
    state: {
        todosOsLivros: [],
        anoFiltro: new Date().getFullYear().toString(),
        ordenacaoTabelas: {},
        graficoResumoAnual: null,
        graficoGeneros: null,
    },
    cacheDOM: function() {
        this.selectAnoEl = document.getElementById('select-ano-dashboard');
        
        this.kpiTotalLivrosEl = document.getElementById('kpi-total-livros');
        this.kpiTotalPaginasEl = document.getElementById('kpi-total-paginas');
        this.kpiNotaMediaEl = document.getElementById('kpi-nota-media');

        this.destaqueMelhorLivroEl = document.getElementById('destaque-melhor-livro');
        this.destaquePiorLivroEl = document.getElementById('destaque-pior-livro');
        this.destaqueAutorMaisLidoEl = document.getElementById('destaque-autor-mais-lido');
        this.destaqueLeituraRapidaEl = document.getElementById('destaque-leitura-rapida');
        this.destaqueLeituraLentaEl = document.getElementById('destaque-leitura-lenta');
        this.destaqueMesProdutivoEl = document.getElementById('destaque-mes-produtivo');

        this.widgetResumoPorAno = document.getElementById('resumo-por-ano');
        this.widgetRankingGeneros = document.getElementById('ranking-generos');
        this.widgetMelhoresAutores = document.getElementById('melhores-autores');
        this.widgetListaLivrosAno = document.getElementById('lista-livros-ano');
        this.widgetMelhoresColecoes = document.getElementById('melhores-colecoes');
        this.widgetMelhoresEditoras = document.getElementById('melhores-editoras');
        this.widgetPrateleiraVergonha = document.getElementById('prateleira-vergonha');

        this.tituloTabelaLivrosAnoEl = document.getElementById('titulo-tabela-livros-ano');
        this.tabelaLivrosAnoEl = document.getElementById('tabela-livros-ano');
        this.tabelaMelhoresAutoresEl = document.getElementById('tabela-melhores-autores');
        this.tabelaMelhoresColecoesEl = document.getElementById('tabela-melhores-colecoes');
        this.tabelaMelhoresEditorasEl = document.getElementById('tabela-melhores-editoras');
        this.tabelaVergonhaEl = document.getElementById('tabela-vergonha');
        this.graficoResumoAnualEl = document.getElementById('grafico-resumo-anual');
        this.graficoGenerosEl = document.getElementById('grafico-generos');
    },
    bindEvents: function() {
        this.selectAnoEl.addEventListener('change', (e) => {
            this.state.anoFiltro = e.target.value;
            this.render();
        });

        const tabelas = [
            this.tabelaLivrosAnoEl, this.tabelaMelhoresAutoresEl,
            this.tabelaMelhoresColecoesEl, this.tabelaMelhoresEditorasEl, this.tabelaVergonhaEl
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
        this.cacheDOM();
        this.bindEvents();
        this.render();
    },
    atualizar: function(livros) {
        this.state.todosOsLivros = livros;
        this.render();
    },
    render: function() {
        if (!this.state.todosOsLivros || this.state.todosOsLivros.length === 0) {
            return;
        }

        const todasAsLeituras = this.state.todosOsLivros.flatMap(livro =>
            (livro.leituras || []).map(leitura => ({ ...leitura, livro }))
        ).filter(leitura => leitura.dataFim);
        
        this.popularFiltroDeAno(todasAsLeituras);

        const leiturasFiltradas = this.state.anoFiltro === 'all-time'
            ? todasAsLeituras
            : todasAsLeituras.filter(l => new Date(l.dataFim).getFullYear() == this.state.anoFiltro);
        
        this.renderKPIs(leiturasFiltradas);
        this.renderDestaques(leiturasFiltradas);
        
        this.renderGraficoGeneros(leiturasFiltradas);
        this.renderMelhoresAutores(leiturasFiltradas);

        if (this.state.anoFiltro === 'all-time') {
            this.widgetResumoPorAno.style.display = 'block';
            this.widgetPrateleiraVergonha.style.display = 'block';
            this.widgetMelhoresColecoes.style.display = 'block';
            this.widgetMelhoresEditoras.style.display = 'block';
            this.widgetListaLivrosAno.style.display = 'none';

            this.renderGraficoResumoAnual(todasAsLeituras);
            this.renderMelhoresColecoes(todasAsLeituras);
            this.renderMelhoresEditoras(todasAsLeituras);
            this.renderPrateleiraVergonha();
        } else {
            this.widgetResumoPorAno.style.display = 'none';
            this.widgetPrateleiraVergonha.style.display = 'none';
            this.widgetMelhoresColecoes.style.display = 'none';
            this.widgetMelhoresEditoras.style.display = 'none';
            this.widgetListaLivrosAno.style.display = 'block';

            this.tituloTabelaLivrosAnoEl.textContent = `Livros Lidos em ${this.state.anoFiltro}`;
            this.renderListaDeLivros(leiturasFiltradas);
        }
    },
    popularFiltroDeAno: function(leituras) {
        const anos = new Set(leituras.map(l => new Date(l.dataFim).getFullYear()));
        const anosOrdenados = Array.from(anos).sort((a, b) => b - a);
        const anoAtualFiltro = this.state.anoFiltro;
        
        let optionsHTML = '<option value="all-time">Todo o Período</option>';
        anosOrdenados.forEach(ano => {
            optionsHTML += `<option value="${ano}" ${ano == anoAtualFiltro ? 'selected' : ''}>${ano}</option>`;
        });
        this.selectAnoEl.innerHTML = optionsHTML;
    },
    renderKPIs: function(leituras) {
        const totalLivros = leituras.length;
        const totalPaginas = leituras.reduce((s, l) => s + (parseInt(l.livro.paginas, 10) || 0), 0);
        const leiturasComNota = leituras.filter(l => l.notaFinal);
        const notaMedia = leiturasComNota.length > 0 ? leiturasComNota.reduce((s, l) => s + (l.notaFinal || 0), 0) / leiturasComNota.length : 0;

        this.kpiTotalLivrosEl.innerHTML = `<div class="kpi-header"><i class="fa-solid fa-book-open kpi-icon"></i><h4>Livros Lidos</h4></div><p class="valor-kpi">${totalLivros}</p>`;
        this.kpiTotalPaginasEl.innerHTML = `<div class="kpi-header"><i class="fa-solid fa-file-lines kpi-icon"></i><h4>Páginas Lidas</h4></div><p class="valor-kpi">${totalPaginas.toLocaleString('pt-BR')}</p>`;
        this.kpiNotaMediaEl.innerHTML = `<div class="kpi-header"><i class="fa-solid fa-star kpi-icon"></i><h4>Nota Média</h4></div><p class="valor-kpi">${notaMedia.toFixed(2).replace('.',',')}</p>`;
    },
    renderDestaques: function(leituras) {
        const leiturasComNota = leituras.filter(l => l.notaFinal);
        const autorMaisLido = this.calcularMaisFrequente(leituras.map(l => l.livro.autor));
        const melhorLivro = leiturasComNota.length > 0 ? leiturasComNota.reduce((a, b) => a.notaFinal > b.notaFinal ? a : b) : null;
        const piorLivro = leiturasComNota.length > 0 ? leiturasComNota.reduce((a, b) => a.notaFinal < b.notaFinal ? a : b) : null;
        const leiturasComPaginas = leituras.filter(l => parseInt(l.livro.paginas, 10) > 0);
        let leituraRapida = null, leituraLenta = null;
        
        if (leiturasComPaginas.length > 0) {
            leiturasComPaginas.forEach(l => {
                const dias = ((new Date(l.dataFim) - new Date(l.dataInicio)) / (1000 * 60 * 60 * 24)) + 1;
                l.pagPorDia = (parseInt(l.livro.paginas, 10) || 0) / (dias > 0 ? dias : 1);
            });
            leituraRapida = leiturasComPaginas.reduce((max, l) => l.pagPorDia > max.pagPorDia ? l : max, leiturasComPaginas[0]);
            leituraLenta = leiturasComPaginas.reduce((min, l) => l.pagPorDia < min.pagPorDia ? l : min, leiturasComPaginas[0]);
        }
        
        const meses = leituras.reduce((acc, l) => {
            const mesAno = new Date(l.dataFim).toISOString().slice(0, 7);
            acc[mesAno] = (acc[mesAno] || 0) + 1;
            return acc;
        }, {});
        const mesProdutivo = Object.keys(meses).length > 0 ? Object.keys(meses).reduce((a, b) => meses[a] > meses[b] ? a : b) : null;

        this.destaqueMelhorLivroEl.innerHTML = `<h5><i class="fa-solid fa-trophy"></i> Melhor Livro</h5><p class="destaque-valor">${melhorLivro ? melhorLivro.livro.nomeDoLivro : '-'}</p><p class="destaque-sub">${melhorLivro ? `Nota ${melhorLivro.notaFinal.toFixed(1).replace('.',',')}` : ''}</p>`;
        this.destaquePiorLivroEl.innerHTML = `<h5><i class="fa-solid fa-thumbs-down"></i> Pior Livro</h5><p class="destaque-valor">${piorLivro ? piorLivro.livro.nomeDoLivro : '-'}</p><p class="destaque-sub">${piorLivro ? `Nota ${piorLivro.notaFinal.toFixed(1).replace('.',',')}` : ''}</p>`;
        this.destaqueAutorMaisLidoEl.innerHTML = `<h5><i class="fa-solid fa-pen-nib"></i> Autor Mais Lido</h5><p class="destaque-valor">${autorMaisLido || '-'}</p>`;
        this.destaqueLeituraRapidaEl.innerHTML = `<h5><i class="fa-solid fa-rocket"></i> Leitura Mais Rápida</h5><p class="destaque-valor">${leituraRapida ? leituraRapida.livro.nomeDoLivro : '-'}</p><p class="destaque-sub">${leituraRapida ? `${leituraRapida.pagPorDia.toFixed(0)} pág/dia` : ''}</p>`;
        this.destaqueLeituraLentaEl.innerHTML = `<h5><i class="fa-solid fa-person-walking"></i> Leitura Mais Lenta</h5><p class="destaque-valor">${leituraLenta ? leituraLenta.livro.nomeDoLivro : '-'}</p><p class="destaque-sub">${leituraLenta ? `${leituraLenta.pagPorDia.toFixed(1)} pág/dia` : ''}</p>`;
        this.destaqueMesProdutivoEl.innerHTML = `<h5><i class="fa-solid fa-calendar-star"></i> Mês Mais Produtivo</h5><p class="destaque-valor">${mesProdutivo ? new Date(mesProdutivo + '-02').toLocaleString('pt-BR', {month: 'long', year: 'numeric'}) : '-'}</p><p class="destaque-sub">${mesProdutivo ? `${meses[mesProdutivo]} livros` : ''}</p>`;
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
                        case 'titulo': return livro.nomeDoLivro;
                        case 'autor': return livro.autor;
                        case 'nome': return item.nome;
                        case 'dataFim': return new Date(item.dataFim);
                        case 'dataAquisicao': return new Date(item.dataAquisicao);
                        case 'tempo': return (new Date(item.dataFim) - new Date(item.dataInicio));
                        case 'pagPorDia': const dias = ((new Date(item.dataFim) - new Date(item.dataInicio)) / (1000*60*60*24)) + 1; return (parseInt(livro.paginas, 10) || 0) / (dias > 0 ? dias : 1);
                        default: return item[key] || 0;
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
                    case 'notaFinal': valor = item.notaFinal ? item.notaFinal.toFixed(1).replace('.', ',') : '-'; break;
                    case 'dataFim': valor = new Date(item.dataFim).toLocaleDateString('pt-BR', {timeZone: 'UTC'}); break;
                    case 'dataAquisicao': valor = new Date(item.dataAquisicao).toLocaleDateString('pt-BR', {timeZone: 'UTC'}); break;
                    case 'tempo': valor = `${Math.round((new Date(item.dataFim) - new Date(item.dataInicio)) / (1000 * 60 * 60 * 24)) + 1} dias`; break;
                    case 'pagPorDia': const dias = ((new Date(item.dataFim) - new Date(item.dataInicio)) / (1000 * 60 * 60 * 24)) + 1; valor = ((parseInt(livro.paginas, 10) || 0) / (dias > 0 ? dias : 1)).toFixed(1).replace('.', ','); break;
                    case 'ano': valor = item.ano; break;
                    case 'livros': valor = item.livros; break;
                    case 'paginas': valor = item.paginas.toLocaleString('pt-BR'); break;
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
            { header: 'Título', key: 'titulo', sortable: true }, { header: 'Autor', key: 'autor', sortable: true },
            { header: 'Nota', key: 'notaFinal', sortable: true }, { header: 'Terminei em', key: 'dataFim', sortable: true },
            { header: 'Tempo', key: 'tempo', sortable: true }, { header: 'Pág/Dia', key: 'pagPorDia', sortable: true },
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
            { header: 'Editora', key: 'nome', sortable: true }, { header: 'Nota Média', key: 'mediaNota', sortable: true }, { header: 'Livros', key: 'count', sortable: true }
        ]);
    },
    renderPrateleiraVergonha: function() {
        const livrosNaoLidos = this.state.todosOsLivros
            .filter(l => (l.situacao === 'Quero Ler' || l.situacao === 'Wishlist') && l.dataAquisicao)
            .sort((a, b) => new Date(a.dataAquisicao) - new Date(b.dataAquisicao));
        this.renderTabela('tabela-vergonha', this.tabelaVergonhaEl, livrosNaoLidos.slice(0, 20), [
            { header: 'Título', key: 'nomeDoLivro', sortable: true },
            { header: 'Autor', key: 'autor', sortable: true },
            { header: 'Adicionado em', key: 'dataAquisicao', sortable: true }
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
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        borderColor: 'rgba(75, 192, 192, 1)',
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
    renderGraficoGeneros: function(leituras) {
        if (this.state.graficoGeneros) {
            this.state.graficoGeneros.destroy();
        }
        const dados = this.calcularRanking(leituras.filter(l => l.livro.categorias), 'categorias', 1);
        const top10 = dados.slice(0, 10);
        const labels = top10.map(d => d.nome);
        const data = top10.map(d => d.count);

        this.state.graficoGeneros = new Chart(this.graficoGenerosEl, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Livros por Gênero',
                    data: data,
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                        '#FF9F40', '#C9CBCF', '#7CFFB2', '#FF6347', '#00CED1'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                    }
                }
            }
        });
    }
};