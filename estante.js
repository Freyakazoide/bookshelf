// --- FUNÇÃO AUXILIAR ATUALIZADA PARA OBTER A NOTA FINAL DE UM LIVRO ---
function getNotaPrincipal(livro) {
    if (!livro.leituras || livro.leituras.length === 0) {
        return 0;
    }
    const leiturasFinalizadas = livro.leituras.filter(l => l.dataFim && l.notaFinal);
    if (leiturasFinalizadas.length === 0) {
        return 0;
    }
    const ultimaLeitura = leiturasFinalizadas[leiturasFinalizadas.length - 1];
    return ultimaLeitura.notaFinal || 0;
}

// --- OBJETO PAINEL DO LIVRO ATUALIZADO ---
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
            if(span) span.textContent = slider.value;
        });
    },
    gerenciarEstadoDasNotas: function(leituraAtiva) {
        const bloqueado = !leituraAtiva || !leituraAtiva.dataFim;
        this.avisoNotaBloqueadaEl.classList.toggle('hidden', !bloqueado);
        this.formNotasEl.classList.toggle('hidden', bloqueado);

        if(!bloqueado) {
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
        // (Detalhes)
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
                <div class.form-grid-painel">
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
            if(leituraAtiva) {
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
        dataInicio: null, // <-- Correção: Inicia em branco
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

        if (livro.leituras.length > 0) {
            const ultimaLeitura = livro.leituras.sort((a,b) => (a.dataInicio > b.dataInicio) ? 1 : -1)[livro.leituras.length - 1];
            livro.situacao = ultimaLeitura.dataFim ? 'Lido' : 'Lendo';
        } else {
            livro.situacao = 'Quero Ler';
        }

        try {
            await App.atualizarLivro(livro.id, livro);
            this.fechar();
        } catch (error) {
            console.error("Erro ao salvar alterações:", error);
            alert("Não foi possível salvar as alterações.");
        }
    },
    abrir: function(livroId) {
        const livro = this.state.todosOsLivros.find(l => l.id == livroId);
        if (livro) {
            this.state.livroAtual = JSON.parse(JSON.stringify(livro));
            if (!this.state.livroAtual.leituras) this.state.livroAtual.leituras = [];
            
            const leituras = this.state.livroAtual.leituras;
            if(leituras.length > 0) {
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

// --- OBJETO ESTANTE (GARANTINDO QUE ELE EXISTA) ---
const Estante = {
    state: {
        livros: [],
        termoBusca: '',
        statusFiltro: 'Todos',
        ordenacao: 'data-adicao-desc'
    },
    cacheDOM: function() {
        this.estanteEl = document.getElementById('estante-de-livros');
        this.inputBuscaEl = document.getElementById('input-busca');
        this.botoesFiltroStatus = document.querySelectorAll('.filtro-status');
        this.selectOrdenacaoEl = document.getElementById('select-ordenacao');
    },
    bindEvents: function() {
        this.inputBuscaEl.addEventListener('input', () => {
            this.state.termoBusca = this.inputBuscaEl.value;
            this.render();
        });
        this.selectOrdenacaoEl.addEventListener('change', () => {
            this.state.ordenacao = this.selectOrdenacaoEl.value;
            this.render();
        });
        this.botoesFiltroStatus.forEach(botao => {
            botao.addEventListener('click', (e) => {
                this.botoesFiltroStatus.forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.state.statusFiltro = e.currentTarget.dataset.status;
                this.render();
            });
        });
        this.estanteEl.addEventListener('click', (e) => {
            const card = e.target.closest('.card-livro');
            if (card) {
                PainelDoLivro.abrir(card.dataset.id);
            }
        });
    },
    render: function() {
        let livrosParaRenderizar = [...this.state.livros];

        if (this.state.statusFiltro !== 'Todos') {
            livrosParaRenderizar = livrosParaRenderizar.filter(livro => livro.situacao === this.state.statusFiltro);
        }
        const termo = this.state.termoBusca.toLowerCase();
        if (termo) {
            livrosParaRenderizar = livrosParaRenderizar.filter(livro => (livro.nomeDoLivro && livro.nomeDoLivro.toLowerCase().includes(termo)) || (livro.autor && livro.autor.toLowerCase().includes(termo)));
        }

        switch (this.state.ordenacao) {
            case 'nota-desc':
                livrosParaRenderizar.sort((a, b) => getNotaPrincipal(b) - getNotaPrincipal(a));
                break;
            case 'titulo-asc':
                livrosParaRenderizar.sort((a, b) => (a.nomeDoLivro || '').localeCompare(b.nomeDoLivro || ''));
                break;
            case 'autor-asc':
                livrosParaRenderizar.sort((a, b) => (a.autor || '').localeCompare(b.autor || ''));
                break;
            default: // 'data-adicao-desc'
                livrosParaRenderizar.sort((a, b) => (b.id || 0) - (a.id || 0));
                break;
        }

        this.estanteEl.innerHTML = '';
        if (livrosParaRenderizar.length === 0) {
            this.estanteEl.innerHTML = "<p>Nenhum livro encontrado com os filtros atuais.</p>";
            return;
        }
        livrosParaRenderizar.forEach(livro => {
            const capaSrc = livro.urlCapa || 'placeholder.jpg';
            const notaPrincipal = getNotaPrincipal(livro);
            const notaDisplay = notaPrincipal > 0 ? `<div class="card-nota">⭐ ${notaPrincipal.toFixed(1)}</div>` : '';
            
            this.estanteEl.innerHTML += `
                <div class="card-livro" data-id="${livro.id}">
                    ${notaDisplay}
                    <img src="${capaSrc}" alt="Capa de ${livro.nomeDoLivro}" onerror="this.src='placeholder.jpg';">
                    <div class="card-info">
                        <h3>${livro.nomeDoLivro}</h3>
                        <p><em>por ${livro.autor}</em></p>
                    </div>
                </div>`;
        });
    },
    init: function() {
        this.cacheDOM();
        this.bindEvents();
        PainelDoLivro.init(this.state.livros);
    },
    atualizar: function(livros) {
        this.state.livros = livros;
        PainelDoLivro.state.todosOsLivros = livros;
        this.render();
    }
};