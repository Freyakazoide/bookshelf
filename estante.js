// --- FUNÇÃO AUXILIAR ATUALIZADA PARA OBTER A NOTA FINAL DE UM LIVRO ---
function getNotaPrincipal(livro) {
    if (!livro.leituras || livro.leituras.length === 0) {
        return 0;
    }
    const leiturasFinalizadas = livro.leituras.filter(l => l.dataFim && l.notaFinal);
    if (leiturasFinalizadas.length === 0) {
        return 0;
    }
    // Ordena para pegar a leitura finalizada mais recente
    const ultimaLeitura = leiturasFinalizadas.sort((a, b) => new Date(b.dataFim) - new Date(a.dataFim))[0];
    return ultimaLeitura.notaFinal || 0;
}

// --- OBJETO PAINEL DO LIVRO (SEU CÓDIGO ORIGINAL) ---
const PainelDoLivro = {
    state: {
        livroAtual: null,
        leituraAtivaId: null,
        todosOsLivros: []
    },
    cacheDOM: function() {
        this.painelEl = document.getElementById('painel-livro');
        this.tituloEl = document.getElementById('painel-titulo');
        this.capaEl = document.getElementById('painel-capa');
        this.btnFecharEl = document.getElementById('btn-fechar-painel');
        this.btnSalvarEl = document.getElementById('painel-btn-salvar');
        this.btnEditarEl = document.getElementById('painel-btn-editar');
        this.btnExcluirEl = document.getElementById('painel-btn-excluir');
        this.btnNovaLeituraEl = document.getElementById('painel-btn-nova-leitura');
        this.tabs = this.painelEl.querySelectorAll('.tab-button');
        this.tabContents = this.painelEl.querySelectorAll('.tab-content');
        this.detalheAutor = document.getElementById('detalhe-autor');
        this.detalheEditora = document.getElementById('detalhe-editora');
        this.detalheAno = document.getElementById('detalhe-ano');
        this.detalhePaginas = document.getElementById('detalhe-paginas');
        this.detalheIdioma = document.getElementById('detalhe-lingua');
        this.detalheColecao = document.getElementById('detalhe-colecao');
        this.detalheVolume = document.getElementById('detalhe-volume');
        this.detalheCategorias = document.getElementById('detalhe-categorias');
        this.detalheDescricao = document.getElementById('detalhe-descricao');
        this.leiturasContainerEl = document.getElementById('leituras-container');
        this.formLeituraContainerEl = document.getElementById('form-leitura-container');
        this.avisoNotaBloqueadaEl = document.getElementById('aviso-nota-bloqueada');
        this.formNotasEl = document.getElementById('form-notas');
        this.notaFinalCalculadaEl = document.getElementById('nota-final-calculada');
        this.slidersDeNota = this.formNotasEl.querySelectorAll('input[type="range"]');
    },
    bindEvents: function() {
        this.btnFecharEl.addEventListener('click', () => this.fechar());
        this.btnSalvarEl.addEventListener('click', () => this.salvar());
        this.btnExcluirEl.addEventListener('click', () => this.excluir());
        this.btnEditarEl.addEventListener('click', () => this.editar());
        this.btnNovaLeituraEl.addEventListener('click', () => this.iniciarNovaLeitura());

        this.tabs.forEach(tab => {
            tab.addEventListener('click', (e) => this.mudarTab(e.currentTarget.dataset.tab));
        });

        this.leiturasContainerEl.addEventListener('click', (e) => {
            const btnEditar = e.target.closest('.btn-editar-leitura');
            if (btnEditar) {
                const leituraId = parseInt(btnEditar.closest('.leitura-card').dataset.leituraId, 10);
                this.selecionarLeitura(leituraId);
            }
        });

        this.formNotasEl.addEventListener('input', () => this.atualizarNotaFinalDisplay());
    },
    mudarTab: function(tabId) {
        this.tabs.forEach(t => t.classList.remove('active'));
        this.tabContents.forEach(c => c.classList.remove('active'));
        document.querySelector(`.tab-button[data-tab="${tabId}"]`).classList.add('active');
        document.getElementById(tabId).classList.add('active');
        this.btnSalvarEl.style.display = (tabId === 'tab-leitura' || tabId === 'tab-notas') ? 'block' : 'none';
    },
    selecionarLeitura: function(leituraId) {
        this.state.leituraAtivaId = leituraId;
        this.render();
    },
    atualizarNotaFinalDisplay: function() {
        const notas = Array.from(this.slidersDeNota).map(slider => parseFloat(slider.value));
        const soma = notas.reduce((acc, nota) => acc + nota, 0);
        const media = soma / notas.length;
        this.notaFinalCalculadaEl.textContent = media.toFixed(1);

        this.slidersDeNota.forEach(slider => {
            const spanId = `valor-${slider.id}`;
            const span = document.getElementById(spanId);
            if (span) span.textContent = slider.value;
        });
    },
    gerenciarEstadoDasNotas: function(leituraAtiva) {
        const bloqueado = !leituraAtiva || !leituraAtiva.dataFim;
        this.avisoNotaBloqueadaEl.classList.toggle('hidden', !bloqueado);
        this.formNotasEl.classList.toggle('hidden', bloqueado);

        if (!bloqueado) {
            const notas = leituraAtiva.notas || {};
            this.slidersDeNota.forEach(slider => {
                const tipoNota = slider.id.replace('nota-', '');
                slider.value = notas[tipoNota] || 5;
            });
            this.atualizarNotaFinalDisplay();
        }
    },
    render: function() {
        if (!this.state.livroAtual) return;
        const livro = this.state.livroAtual;
        const leituraAtiva = this.state.leituraAtivaId ? livro.leituras.find(l => l.idLeitura === this.state.leituraAtivaId) : null;

        this.tituloEl.textContent = livro.nomeDoLivro;
        this.capaEl.src = livro.urlCapa || 'placeholder.jpg';
        this.detalheAutor.textContent = livro.autor || 'N/A';
        this.detalheEditora.textContent = livro.editora || 'N/A';
        this.detalheAno.textContent = livro.anoLancamento || 'N/A';
        this.detalhePaginas.textContent = livro.paginas || 'N/A';
        this.detalheIdioma.textContent = livro.lingua || 'N/A';
        this.detalheColecao.textContent = livro.colecao || 'N/A';
        this.detalheVolume.textContent = livro.volume || 'N/A';
        this.detalheCategorias.textContent = livro.categorias || 'N/A';
        this.detalheDescricao.textContent = livro.descricao || 'Sem sinopse.';
        
        this.renderHistoricoLeituras(leituraAtiva);
        this.renderFormLeitura(leituraAtiva);
        this.btnNovaLeituraEl.disabled = !!livro.leituras.find(l => !l.dataFim);

        this.gerenciarEstadoDasNotas(leituraAtiva);
    },
    renderHistoricoLeituras: function(leituraAtiva) {
        const leituras = this.state.livroAtual.leituras || [];
        if (leituras.length === 0) {
            this.leiturasContainerEl.innerHTML = '<p>Nenhuma leitura registrada.</p>';
            return;
        }
        this.leiturasContainerEl.innerHTML = leituras.map((leitura, index) => {
            const inicio = leitura.dataInicio ? new Date(leitura.dataInicio).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A';
            const fim = leitura.dataFim ? new Date(leitura.dataFim).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Em andamento';
            const classeAtiva = (leituraAtiva && leitura.idLeitura === leituraAtiva.idLeitura) ? 'active' : '';

            return `
                <div class="leitura-card ${classeAtiva}" data-leitura-id="${leitura.idLeitura}">
                    <div class="leitura-card-info">
                        <h4>${index + 1}ª Leitura <small>${fim}</small></h4>
                        <p><strong>Início:</strong> ${inicio}</p>
                    </div>
                    <button class="btn btn-secundario btn-editar-leitura">Ver/Editar</button>
                </div>
            `;
        }).join('');
    },
    renderFormLeitura: function(leitura) {
        if (!leitura) {
            this.formLeituraContainerEl.classList.add('hidden');
            return;
        }

        this.formLeituraContainerEl.innerHTML = `
            <hr>
            <h4>Detalhes da Leitura</h4>
            <form id="form-leitura-ativa" class="painel-form">
                <div class="form-grid-painel">
                    <div class="form-campo">
                        <label for="painel-dataInicio">Início:</label>
                        <input type="date" id="painel-dataInicio" value="${leitura.dataInicio || ''}">
                    </div>
                    <div class="form-campo">
                        <label for="painel-dataFim">Fim:</label>
                        <input type="date" id="painel-dataFim" value="${leitura.dataFim || ''}">
                    </div>
                </div>
                <div class="form-campo">
                    <label for="painel-anotacoes-leitura">Anotações da Leitura</label>
                    <textarea id="painel-anotacoes-leitura" rows="4">${leitura.anotacoes || ''}</textarea>
                </div>
            </form>
        `;

        const dataFimInput = document.getElementById('painel-dataFim');
        dataFimInput.addEventListener('change', () => {
            const leituraAtiva = this.state.livroAtual.leituras.find(l => l.idLeitura === this.state.leituraAtivaId);
            if (leituraAtiva) {
                leituraAtiva.dataFim = dataFimInput.value;
                this.gerenciarEstadoDasNotas(leituraAtiva);
            }
        });
        this.formLeituraContainerEl.classList.remove('hidden');
    },
    iniciarNovaLeitura: function() {
        const livro = this.state.livroAtual;
        const novaLeitura = {
            idLeitura: Date.now(),
            dataInicio: new Date().toISOString().split('T')[0],
            dataFim: null,
            notas: null,
            notaFinal: null,
            anotacoes: ''
        };
        livro.leituras.push(novaLeitura);
        this.selecionarLeitura(novaLeitura.idLeitura);
    },
    salvar: async function() {
        const livro = this.state.livroAtual;
        const leituraAtivaId = this.state.leituraAtivaId;

        if (leituraAtivaId) {
            const leituraIndex = livro.leituras.findIndex(l => l.idLeitura === leituraAtivaId);
            if (leituraIndex > -1) {
                const leitura = livro.leituras[leituraIndex];
                leitura.dataInicio = document.getElementById('painel-dataInicio').value || null;
                leitura.dataFim = document.getElementById('painel-dataFim').value || null;
                leitura.anotacoes = document.getElementById('painel-anotacoes-leitura').value || '';
                
                if (leitura.dataFim) {
                    leitura.notas = {};
                    this.slidersDeNota.forEach(slider => {
                        const tipoNota = slider.id.replace('nota-', '');
                        leitura.notas[tipoNota] = parseFloat(slider.value);
                    });
                    leitura.notaFinal = parseFloat(this.notaFinalCalculadaEl.textContent);
                }
            }
        }

        if (livro.leituras && livro.leituras.length > 0) {
            const ultimaLeitura = livro.leituras.find(l => !l.dataFim) || livro.leituras[livro.leituras.length - 1];
            livro.situacao = ultimaLeitura.dataFim ? 'Lido' : 'Lendo';
        } else {
            livro.situacao = 'Quero Ler';
        }

        try {
            await App.atualizarLivro(livro.id, livro);
            this.fechar();
        } catch (error) {
            console.error("Erro ao salvar alterações:", error);
            App.mostrarNotificacao("Não foi possível salvar as alterações.", 'erro');
        }
    },
    abrir: function(livroId) {
        const livro = this.state.todosOsLivros.find(l => l.id == livroId);
        if (livro) {
            this.state.livroAtual = JSON.parse(JSON.stringify(livro));
            if (!this.state.livroAtual.leituras) this.state.livroAtual.leituras = [];
            
            const leituras = this.state.livroAtual.leituras;
            if (leituras.length > 0) {
                this.state.leituraAtivaId = leituras[leituras.length - 1].idLeitura;
            } else {
                this.state.leituraAtivaId = null;
            }

            this.render();
            this.mudarTab('tab-leitura');
            this.painelEl.showModal();
        }
    },
    fechar: function() {
        this.state.livroAtual = null;
        this.state.leituraAtivaId = null;
        this.painelEl.close();
    },
    excluir: function() {
        if (confirm('Tem certeza que deseja excluir este livro da sua estante? Esta ação não pode ser desfeita.')) {
            App.excluirLivro(this.state.livroAtual.id);
            this.fechar();
        }
    },
    editar: function() {
        App.navegarPara('view-adicionar', this.state.livroAtual.id);
        this.fechar();
    },
    init: function(livros) {
        this.state.todosOsLivros = livros;
        this.cacheDOM();
        this.bindEvents();
    }
};

// --- OBJETO ESTANTE (CORRIGIDO E COM PAGINAÇÃO) ---
const Estante = {
    state: {
        todosOsLivros: [],
        livrosVisiveis: [],
        filtroBusca: '',
        filtroStatus: 'Todos',
        ordenacao: 'data-adicao-desc',
        paginaAtual: 1,
        livrosPorPagina: 30,
    },
    cacheDOM: function() {
        this.estanteEl = document.getElementById('estante-de-livros');
        this.inputBuscaEl = document.getElementById('input-busca');
        this.contadorResultadosEl = document.getElementById('contador-resultados');
        this.filtrosStatusEl = document.querySelector('.grupo-filtros');
        this.selectOrdenacaoEl = document.getElementById('select-ordenacao');
        this.selectTamanhoPaginaEl = document.getElementById('select-tamanho-pagina');
        this.linksPaginacaoEl = document.getElementById('links-paginacao');
    },
    bindEvents: function() {
        this.inputBuscaEl.addEventListener('input', (e) => {
            this.state.filtroBusca = e.target.value;
            this.state.paginaAtual = 1;
            this.render();
        });

        this.filtrosStatusEl.addEventListener('click', (e) => {
            if (e.target.classList.contains('filtro-status')) {
                this.state.filtroStatus = e.target.dataset.status;
                this.state.paginaAtual = 1;
                this.render();
            }
        });

        this.selectOrdenacaoEl.addEventListener('change', (e) => {
            this.state.ordenacao = e.target.value;
            this.state.paginaAtual = 1;
            this.render();
        });

        this.selectTamanhoPaginaEl.addEventListener('change', (e) => {
            this.state.livrosPorPagina = parseInt(e.target.value, 10);
            this.state.paginaAtual = 1;
            this.render();
        });

        this.linksPaginacaoEl.addEventListener('click', (e) => {
            const target = e.target;
            if (target.tagName === 'BUTTON' && target.dataset.pagina) {
                const pagina = target.dataset.pagina;
                if (pagina === 'anterior') {
                    if (this.state.paginaAtual > 1) this.state.paginaAtual--;
                } else if (pagina === 'proxima') {
                    const totalPaginas = Math.ceil(this.state.livrosVisiveis.length / this.state.livrosPorPagina);
                    if (this.state.paginaAtual < totalPaginas) this.state.paginaAtual++;
                } else {
                    this.state.paginaAtual = parseInt(pagina, 10);
                }
                this.render();
            }
        });

        this.estanteEl.addEventListener('click', (e) => {
            const card = e.target.closest('.card-livro');
            if (card) {
                PainelDoLivro.abrir(card.dataset.id);
            }
        });
    },
    init: function(livros) {
        this.cacheDOM();
        this.bindEvents();
        this.state.todosOsLivros = livros;
        PainelDoLivro.init(livros);
        this.render();
    },
    aplicarFiltrosEOrdenacao: function() {
        let livrosFiltrados = [...this.state.todosOsLivros];

        if (this.state.filtroStatus !== 'Todos') {
            livrosFiltrados = livrosFiltrados.filter(livro => livro.situacao === this.state.filtroStatus);
        }

        const termoBusca = this.state.filtroBusca.toLowerCase().trim();
        if (termoBusca) {
            livrosFiltrados = livrosFiltrados.filter(livro =>
                (livro.nomeDoLivro && livro.nomeDoLivro.toLowerCase().includes(termoBusca)) ||
                (livro.autor && livro.autor.toLowerCase().includes(termoBusca))
            );
        }

        livrosFiltrados.sort((a, b) => {
            switch (this.state.ordenacao) {
                case 'nota-desc':
                    return getNotaPrincipal(b) - getNotaPrincipal(a);
                case 'titulo-asc':
                    return (a.nomeDoLivro || '').localeCompare(b.nomeDoLivro || '');
                case 'autor-asc':
                    return (a.autor || '').localeCompare(b.autor || '');
                case 'data-adicao-desc':
                default:
                    return (b.id || 0) - (a.id || 0);
            }
        });

        this.state.livrosVisiveis = livrosFiltrados;
    },
    render: function() {
        this.aplicarFiltrosEOrdenacao();

        const { livrosVisiveis, paginaAtual, livrosPorPagina } = this.state;
            this.contadorResultadosEl.textContent = `${livrosVisiveis.length} livros encontrados.`;

        const inicio = (paginaAtual - 1) * livrosPorPagina;
        const fim = inicio + livrosPorPagina;
        const livrosDaPagina = livrosVisiveis.slice(inicio, fim);

        if (livrosDaPagina.length === 0) {
            this.estanteEl.innerHTML = '<p>Nenhum livro encontrado com os filtros selecionados.</p>';
        } else {
            this.estanteEl.innerHTML = livrosDaPagina.map(livro => {
                const capaSrc = livro.urlCapa || 'placeholder.jpg';
                const notaPrincipal = getNotaPrincipal(livro);
                const notaDisplay = notaPrincipal > 0 ? `<div class="card-nota">⭐ ${notaPrincipal.toFixed(1)}</div>` : '';
                return `
                    <div class="card-livro" data-id="${livro.id}">
                        ${notaDisplay}
                        <img src="${capaSrc}" alt="Capa de ${livro.nomeDoLivro}" onerror="this.src='placeholder.jpg';">
                        <div class="card-info">
                            <h3>${livro.nomeDoLivro}</h3>
                            <p>${livro.autor}</p>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        this.renderControlesPaginacao();
        this.atualizarFiltrosStatusUI();
    },
    renderControlesPaginacao: function() {
        const { livrosVisiveis, paginaAtual, livrosPorPagina } = this.state;
        const totalPaginas = Math.ceil(livrosVisiveis.length / livrosPorPagina);

        if (totalPaginas <= 1) {
            this.linksPaginacaoEl.innerHTML = '';
            return;
        }

        let htmlPaginacao = '';
        htmlPaginacao += `<button data-pagina="anterior" ${paginaAtual === 1 ? 'disabled' : ''}>&laquo;</button>`;

        for (let i = 1; i <= totalPaginas; i++) {
            const activeClass = i === paginaAtual ? 'active' : '';
            htmlPaginacao += `<button class="${activeClass}" data-pagina="${i}">${i}</button>`;
        }

        htmlPaginacao += `<button data-pagina="proxima" ${paginaAtual === totalPaginas ? 'disabled' : ''}>&raquo;</button>`;
        
        this.linksPaginacaoEl.innerHTML = htmlPaginacao;
    },
    atualizarFiltrosStatusUI: function() {
        const botoes = this.filtrosStatusEl.querySelectorAll('.filtro-status');
        botoes.forEach(btn => {
            if (btn.dataset.status === this.state.filtroStatus) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    },
    atualizar: function(livros) {
        this.state.todosOsLivros = livros;
        PainelDoLivro.state.todosOsLivros = livros;
        this.render();
    }
};