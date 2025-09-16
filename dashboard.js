const Dashboard = {
    state: {
        todosOsLivros: [],
        anoFiltro: new Date().getFullYear().toString(),
        abaAtiva: 'anual',
        ordenacaoTabelas: {},
    },
    cacheDOM: function() {
        this.tabs = document.querySelectorAll('.dashboard-tabs .tab-button');
        this.conteudoAnualEl = document.getElementById('dashboard-content-anual');
        this.conteudoHistoricoEl = document.getElementById('dashboard-content-historico');
        this.filtroAnoContainerEl = document.getElementById('filtro-ano-container');
        this.selectAnoEl = document.getElementById('select-ano-dashboard');
        this.kpiNotaMediaEl = document.getElementById('kpi-nota-media');
        this.kpiTotalLivrosEl = document.getElementById('kpi-total-livros');
        this.kpiTotalPaginasEl = document.getElementById('kpi-total-paginas');
        this.kpiMediaPaginasEl = document.getElementById('kpi-media-paginas');
        this.kpiVariedadeAutoresEl = document.getElementById('kpi-variedade-autores');
        this.kpiVelocidadeMediaEl = document.getElementById('kpi-velocidade-media');
        this.kpiAutorMaisLidoEl = document.getElementById('kpi-autor-mais-lido');
        this.kpiMelhorLivroEl = document.getElementById('kpi-melhor-livro');
        this.kpiPiorLivroEl = document.getElementById('kpi-pior-livro');
        this.kpiLeituraRapidaEl = document.getElementById('kpi-leitura-rapida');
        this.kpiLeituraLentaEl = document.getElementById('kpi-leitura-lenta');
        this.kpiMesProdutivoEl = document.getElementById('kpi-mes-produtivo');
        this.tabelaLivrosAnoEl = document.getElementById('tabela-livros-ano');
        this.tabelaResumoAnualEl = document.getElementById('tabela-resumo-anual');
        this.tabelaMelhoresAutoresEl = document.getElementById('tabela-melhores-autores');
        this.tabelaMelhoresColecoesEl = document.getElementById('tabela-melhores-colecoes');
        this.tabelaMelhoresEditorasEl = document.getElementById('tabela-melhores-editoras');
        this.tabelaGenerosEl = document.getElementById('tabela-generos');
        this.tabelaVergonhaEl = document.getElementById('tabela-vergonha');
    },
    bindEvents: function() {
        this.selectAnoEl.addEventListener('change', (e) => {
            this.state.anoFiltro = e.target.value;
            this.render();
        });
        this.tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.state.abaAtiva = e.target.dataset.tab;
                this.renderAbas();
            });
        });
        const tabelas = [
            this.tabelaLivrosAnoEl, this.tabelaResumoAnualEl, this.tabelaMelhoresAutoresEl,
            this.tabelaMelhoresColecoesEl, this.tabelaMelhoresEditorasEl, this.tabelaGenerosEl, this.tabelaVergonhaEl
        ];
        tabelas.forEach(tabela => {
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
        if (!this.state.todosOsLivros) return;
        const todasAsLeituras = this.state.todosOsLivros.flatMap(livro =>
            (livro.leituras || []).map(leitura => ({ ...leitura, livro }))
        ).filter(leitura => leitura.dataFim);
        this.popularFiltroDeAno(todasAsLeituras);
        const leiturasDoAno = this.state.anoFiltro === 'todos'
            ? todasAsLeituras
            : todasAsLeituras.filter(l => new Date(l.dataFim).getFullYear() == this.state.anoFiltro);
        this.renderKPIs(leiturasDoAno);
        this.renderListaDeLivros(leiturasDoAno);
        this.renderTabelaResumoAnual(todasAsLeituras);
        this.renderMelhoresAutores(todasAsLeituras);
        this.renderMelhoresColecoes(todasAsLeituras);
        this.renderMelhoresEditoras(todasAsLeituras);
        this.renderAnaliseGenero(todasAsLeituras);
        this.renderPrateleiraVergonha();
        this.renderAbas();
    },
    renderAbas: function() {
        this.tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.tab === this.state.abaAtiva));
        this.conteudoAnualEl.classList.toggle('active', this.state.abaAtiva === 'anual');
        this.conteudoHistoricoEl.classList.toggle('active', this.state.abaAtiva === 'historico');
        this.filtroAnoContainerEl.style.display = this.state.abaAtiva === 'anual' ? 'flex' : 'none';
    },
    popularFiltroDeAno: function(leituras) {
        const anos = new Set(leituras.map(l => new Date(l.dataFim).getFullYear()));
        const anosOrdenados = Array.from(anos).sort((a, b) => b - a);
        const anoAtualFiltro = this.state.anoFiltro;
        this.selectAnoEl.innerHTML = '<option value="todos">Todos os Tempos</option>';
        anosOrdenados.forEach(ano => {
            this.selectAnoEl.innerHTML += `<option value="${ano}" ${ano == anoAtualFiltro ? 'selected' : ''}>${ano}</option>`;
        });
    },
    renderKPIs: function(leituras) {
        const totalLivros = leituras.length;
        const totalPaginas = leituras.reduce((s, l) => s + (parseInt(l.livro.paginas, 10) || 0), 0);
        const leiturasComNota = leituras.filter(l => l.notaFinal);
        const notaMedia = leiturasComNota.length > 0 ? leiturasComNota.reduce((s, l) => s + (l.notaFinal || 0), 0) / leiturasComNota.length : 0;
        const mediaPaginas = totalLivros > 0 ? totalPaginas / totalLivros : 0;
        const variedadeAutores = new Set(leituras.map(l => l.livro.autor)).size;
        const totalDias = leituras.reduce((s, l) => s + (new Date(l.dataFim) - new Date(l.dataInicio)) / (1000 * 60 * 60 * 24) + 1, 0);
        const velocidadeMedia = totalLivros > 0 ? totalDias / totalLivros : 0;
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
        this.kpiNotaMediaEl.innerHTML = `<div class="kpi-header"><i class="fa-solid fa-star kpi-icon"></i><h4>Nota Média</h4></div><p class="valor-kpi">${notaMedia.toFixed(2).replace('.',',')}</p>`;
        this.kpiTotalLivrosEl.innerHTML = `<div class="kpi-header"><i class="fa-solid fa-book-open kpi-icon"></i><h4>Livros Lidos</h4></div><p class="valor-kpi">${totalLivros}</p>`;
        this.kpiTotalPaginasEl.innerHTML = `<div class="kpi-header"><i class="fa-solid fa-file-lines kpi-icon"></i><h4>Páginas Lidas</h4></div><p class="valor-kpi">${totalPaginas.toLocaleString('pt-BR')}</p>`;
        this.kpiMediaPaginasEl.innerHTML = `<div class="kpi-header"><i class="fa-solid fa-book-bookmark kpi-icon"></i><h4>Média Páginas</h4></div><p class="valor-kpi">${mediaPaginas.toFixed(0)}</p><p class="subtitulo-kpi">por livro</p>`;
        this.kpiVariedadeAutoresEl.innerHTML = `<div class="kpi-header"><i class="fa-solid fa-users kpi-icon"></i><h4>Autores Lidos</h4></div><p class="valor-kpi">${variedadeAutores}</p>`;
        this.kpiVelocidadeMediaEl.innerHTML = `<div class="kpi-header"><i class="fa-solid fa-gauge-high kpi-icon"></i><h4>Velocidade Média</h4></div><p class="valor-kpi">${velocidadeMedia.toFixed(1).replace('.',',')}</p><p class="subtitulo-kpi">dias/livro</p>`;
        this.kpiAutorMaisLidoEl.innerHTML = `<div class="kpi-header"><i class="fa-solid fa-pen-nib kpi-icon"></i><h4>Autor Mais Lido</h4></div><p class="valor-kpi" style="font-size: 1.5em;">${autorMaisLido || '-'}</p>`;
        this.kpiMelhorLivroEl.innerHTML = `<div class="kpi-header"><i class="fa-solid fa-trophy kpi-icon"></i><h4>Melhor Livro</h4></div><p class="valor-kpi">${melhorLivro ? melhorLivro.livro.nomeDoLivro : '-'}</p><p class="subtitulo-kpi">${melhorLivro ? `Nota ${melhorLivro.notaFinal.toFixed(1).replace('.',',')}` : ''}</p>`;
        this.kpiPiorLivroEl.innerHTML = `<div class="kpi-header"><i class="fa-solid fa-thumbs-down kpi-icon"></i><h4>Pior Livro</h4></div><p class="valor-kpi">${piorLivro ? piorLivro.livro.nomeDoLivro : '-'}</p><p class="subtitulo-kpi">${piorLivro ? `Nota ${piorLivro.notaFinal.toFixed(1).replace('.',',')}` : ''}</p>`;
        this.kpiLeituraRapidaEl.innerHTML = `<div class="kpi-header"><i class="fa-solid fa-rocket kpi-icon"></i><h4>Leitura Mais Rápida</h4></div><p class="valor-kpi">${leituraRapida ? leituraRapida.livro.nomeDoLivro : '-'}</p><p class="subtitulo-kpi">${leituraRapida ? `${leituraRapida.pagPorDia.toFixed(0)} pág/dia` : ''}</p>`;
        this.kpiLeituraLentaEl.innerHTML = `<div class="kpi-header"><i class="fa-solid fa-person-walking kpi-icon"></i><h4>Leitura Mais Lenta</h4></div><p class="valor-kpi">${leituraLenta ? leituraLenta.livro.nomeDoLivro : '-'}</p><p class="subtitulo-kpi">${leituraLenta ? `${leituraLenta.pagPorDia.toFixed(1)} pág/dia` : ''}</p>`;
        this.kpiMesProdutivoEl.innerHTML = `<div class="kpi-header"><i class="fa-solid fa-calendar-star kpi-icon"></i><h4>Mês Mais Produtivo</h4></div><p class="valor-kpi">${mesProdutivo ? new Date(mesProdutivo + '-02').toLocaleString('pt-BR', {month: 'long', year: 'numeric'}) : '-'}</p><p class="subtitulo-kpi">${mesProdutivo ? `${meses[mesProdutivo]} livros` : ''}</p>`;
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
                    case 'notaMedia': valor = item.notaMedia.toFixed(2).replace('.', ','); break;
                    case 'nome': valor = item.nome; break;
                    case 'count': valor = item.count; break;
                    default: valor = item[col.key] || '-';
                }
                const classeNota = col.key === 'notaFinal' || col.key === 'notaMedia' ? this.getClasseNota(parseFloat(valor.replace(',','.'))) : '';
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
    renderTabelaResumoAnual: function(leituras) {
        const dadosPorAno = leituras.reduce((acc, l) => {
            const ano = new Date(l.dataFim).getFullYear();
            if (!acc[ano]) acc[ano] = { livros: 0, paginas: 0, notas: [], ano };
            acc[ano].livros++;
            acc[ano].paginas += parseInt(l.livro.paginas, 10) || 0;
            if (l.notaFinal) acc[ano].notas.push(l.notaFinal);
            return acc;
        }, {});
        const dados = Object.values(dadosPorAno).map(d => ({...d, notaMedia: d.notas.length > 0 ? d.notas.reduce((s, n) => s + n, 0) / d.notas.length : 0}));
        this.renderTabela('tabela-resumo-anual', this.tabelaResumoAnualEl, dados, [
            { header: 'Ano', key: 'ano', sortable: true }, { header: 'Livros', key: 'livros', sortable: true },
            { header: 'Páginas', key: 'paginas', sortable: true }, { header: 'Nota Média', key: 'notaMedia', sortable: true }
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
    renderAnaliseGenero: function(leituras) {
        const dados = this.calcularRanking(leituras.filter(l => l.livro.categorias), 'categorias', 1);
        this.renderTabela('tabela-generos', this.tabelaGenerosEl, dados, [
            { header: 'Gênero', key: 'nome', sortable: true },
            { header: 'Nota Média', key: 'mediaNota', sortable: true },
            { header: 'Livros Lidos', key: 'count', sortable: true }
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
    }
};