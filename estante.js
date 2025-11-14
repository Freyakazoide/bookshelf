const Estante = {
    state: {
        todosOsLivros: [],
        livrosFiltrados: [],
        livroAtivo: null,
        leituraAtivaId: null,
        filtros: {
            busca: '',
            status: 'Todos',
            ordenacao: 'data-adicao-desc',
            pagina: 0,
            porPagina: 30,
        },
        criteriosDeNota: [
            'personagens', 'plot', 'desenvolvimento', 'pacing', 'prosa',
            'originalidade', 'temas', 'impacto', 'closing', 'releitura'
        ],
        initialized: false,
    },

    cacheDOM: function() {
        this.estanteEl = document.getElementById('estante-de-livros');
        this.inputBuscaEl = document.getElementById('input-busca');
        this.filtrosStatusEl = document.querySelectorAll('.filtro-status');
        this.selectOrdenacaoEl = document.getElementById('select-ordenacao');
        this.contadorResultadosEl = document.getElementById('contador-resultados');
        this.selectTamanhoPaginaEl = document.getElementById('select-tamanho-pagina');
        this.linksPaginacaoEl = document.getElementById('links-paginacao');
        this.painelLivroEl = document.getElementById('painel-livro');
        this.painelTituloEl = document.getElementById('painel-titulo');
        this.btnFecharPainelEl = document.getElementById('btn-fechar-painel');
        this.painelCapaEl = document.getElementById('painel-capa');
        this.btnEditarEl = document.getElementById('painel-btn-editar');
        this.btnExcluirEl = document.getElementById('painel-btn-excluir');
        this.painelBtnSalvarEl = document.getElementById('painel-btn-salvar');
        this.painelTabs = this.painelLivroEl.querySelectorAll('.painel-tabs .tab-button');
        this.painelTabContents = this.painelLivroEl.querySelectorAll('.tab-content');
        this.leiturasContainerEl = document.getElementById('leituras-container');
        this.formLeituraContainerEl = document.getElementById('form-leitura-container');
        this.btnNovaLeituraEl = document.getElementById('painel-btn-nova-leitura');
        this.formNotasEl = document.getElementById('form-notas');
        this.avisoNotaBloqueadaEl = document.getElementById('aviso-nota-bloqueada');
        this.notaFinalCalculadaEl = document.getElementById('nota-final-calculada');
        this.infoDetalhesEl = document.getElementById('info-detalhes');
    },

    bindEvents: function() {
        if (this.state.initialized) return;

        this.estanteEl.addEventListener('click', e => {
            const card = e.target.closest('.card-livro');
            if (card) this.abrirPainel(card.dataset.id);
        });
        this.inputBuscaEl.addEventListener('input', e => {
            this.state.filtros.busca = e.target.value.toLowerCase();
            this.state.filtros.pagina = 0;
            this.renderEstante();
        });
        this.filtrosStatusEl.forEach(btn => {
            btn.addEventListener('click', e => {
                this.filtrosStatusEl.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.state.filtros.status = e.target.dataset.status;
                this.state.filtros.pagina = 0;
                this.renderEstante();
            });
        });
        this.selectOrdenacaoEl.addEventListener('change', e => {
            this.state.filtros.ordenacao = e.target.value;
            this.renderEstante();
        });
        this.selectTamanhoPaginaEl.addEventListener('change', e => {
            this.state.filtros.porPagina = parseInt(e.target.value, 10);
            this.state.filtros.pagina = 0;
            this.renderEstante();
        });
        this.linksPaginacaoEl.addEventListener('click', e => {
            if (e.target.tagName === 'BUTTON' && e.target.dataset.pagina) {
                this.state.filtros.pagina = parseInt(e.target.dataset.pagina, 10);
                this.renderEstante();
            }
        });
        this.btnFecharPainelEl.addEventListener('click', () => this.painelLivroEl.close());
        this.painelLivroEl.addEventListener('close', () => this.limparPainel());
        this.painelTabs.forEach(tab => {
            tab.addEventListener('click', e => {
                const tabId = e.target.dataset.tab;
                this.painelTabs.forEach(t => t.classList.remove('active'));
                this.painelTabContents.forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
                document.getElementById(tabId).classList.add('active');
            });
        });
        this.btnNovaLeituraEl.addEventListener('click', () => this.renderFormLeitura());
        this.formLeituraContainerEl.addEventListener('click', e => {
            if (e.target.id === 'btn-salvar-leitura') this.salvarLeitura();
            if (e.target.id === 'btn-cancelar-leitura') {
                this.formLeituraContainerEl.innerHTML = '';
                this.formLeituraContainerEl.classList.add('hidden');
            }
            if (e.target.classList.contains('btn-deletar-leitura')) {
                const id = parseInt(e.target.dataset.idleitura, 10);
                if (confirm('Tem certeza que deseja excluir este registro de leitura?')) {
                    this.deletarLeitura(id);
                }
            }
        });
        this.leiturasContainerEl.addEventListener('click', e => {
            const itemLeitura = e.target.closest('.item-leitura');
            if (itemLeitura) {
                const idLeitura = parseInt(itemLeitura.dataset.idleitura, 10);
                this.state.leituraAtivaId = idLeitura;

                // FIX: Encontra a leitura e abre o formulário para edição
                const leituraParaEditar = this.state.livroAtivo.leituras.find(l => l.idLeitura === idLeitura);
                if (leituraParaEditar) {
                    this.renderFormLeitura(leituraParaEditar);
                }
                
                this.renderPainelLeituras(); // Atualiza a lista (para destacar o item)
            }
        });
        this.painelBtnSalvarEl.addEventListener('click', () => this.salvarNotas());
        this.btnEditarEl.addEventListener('click', () => {
            this.painelLivroEl.close();
            App.navegarPara('view-adicionar');
            Adicionar.modoEdicao(this.state.livroAtivo.id);
        });
        this.btnExcluirEl.addEventListener('click', () => {
            if (confirm(`Tem certeza que deseja excluir "${this.state.livroAtivo.nomeDoLivro}"? Esta ação não pode ser desfeita.`)) {
                this.painelLivroEl.close();
                App.excluirLivro(this.state.livroAtivo.firestoreId);
            }
        });
        this.state.criteriosDeNota.forEach(criterio => {
            const slider = document.getElementById(`nota-${criterio}`);
            if (slider) {
                slider.addEventListener('input', e => {
                    const valorSpan = document.getElementById(`valor-nota-${criterio}`);
                    valorSpan.textContent = parseFloat(e.target.value).toFixed(1);
                    this.calcularNotaFinal();
                });
            }
        });

        this.state.initialized = true;
    },

    init: function(livros) {
        this.state.todosOsLivros = livros;
        this.cacheDOM();
        this.bindEvents();
        this.renderEstante();
    },

    atualizar: function(livros) {
        this.state.todosOsLivros = livros;
        this.renderEstante();
    },

    filtrarEOrdenarLivros: function() {
        let livros = [...this.state.todosOsLivros];
        const { busca, status } = this.state.filtros;
        if (busca) {
            livros = livros.filter(l =>
                l.nomeDoLivro.toLowerCase().includes(busca) ||
                (l.autor && l.autor.toLowerCase().includes(busca))
            );
        }
        if (status !== 'Todos') {
            livros = livros.filter(l => {
                const temLeituraIniciada = (l.leituras || []).some(leitura => leitura.dataInicio);
                const temLeituraFinalizada = (l.leituras || []).some(leitura => leitura.dataFim);
                if (status === 'Lido') return temLeituraFinalizada;
                if (status === 'Lendo') return temLeituraIniciada && !temLeituraFinalizada;
                if (status === 'Quero Ler') return !temLeituraIniciada;
                return false;
            });
        }
        this.state.livrosFiltrados = livros;
        this.ordenarLivros();
    },

    ordenarLivros: function() {
        const { ordenacao } = this.state.filtros;
        this.state.livrosFiltrados.sort((a, b) => {
            switch (ordenacao) {
                case 'titulo-asc':
                    return a.nomeDoLivro.localeCompare(b.nomeDoLivro);
                case 'autor-asc':
                    return a.autor.localeCompare(b.autor);
                case 'nota-desc':
                    const notaA = (a.leituras && a.leituras[0]) ? a.leituras[0].notaFinal || 0 : 0;
                    const notaB = (b.leituras && b.leituras[0]) ? b.leituras[0].notaFinal || 0 : 0;
                    return notaB - notaA;
                case 'data-adicao-desc':
                default:
                    return b.id - a.id;
            }
        });
    },

    renderEstante: function() {
        this.filtrarEOrdenarLivros();
        const { pagina, porPagina } = this.state.filtros;
        const inicio = pagina * porPagina;
        const fim = inicio + porPagina;
        const livrosDaPagina = this.state.livrosFiltrados.slice(inicio, fim);

        this.estanteEl.innerHTML = livrosDaPagina.map(livro => {
            const capa = livro.urlCapa || 'placeholder.jpg';
            const leituraRecente = (livro.leituras && livro.leituras.length > 0) 
                ? [...livro.leituras].sort((a,b) => new Date(b.dataFim || 0) - new Date(a.dataFim || 0))[0]
                : null;
            const nota = (leituraRecente && leituraRecente.notaFinal)
                ? `<div class="card-nota">★ ${leituraRecente.notaFinal.toFixed(1)}</div>` : '';

            return `
                <div class="card-livro" data-id="${livro.firestoreId}">
                    ${nota}
                    <img src="${capa}" alt="Capa de ${livro.nomeDoLivro}" onerror="this.src='placeholder.jpg';">
                    <div class="card-info">
                        <h3>${livro.nomeDoLivro}</h3>
                        <p>${livro.autor}</p>
                    </div>
                </div>
            `;
        }).join('');

        this.contadorResultadosEl.textContent = `${this.state.livrosFiltrados.length} livros encontrados.`;
        this.renderPaginacao();
        window.scrollTo(0, 0);
    },

    renderPaginacao: function() {
        const totalLivros = this.state.livrosFiltrados.length;
        const { pagina, porPagina } = this.state.filtros;
        const totalPaginas = Math.ceil(totalLivros / porPagina);
        this.linksPaginacaoEl.innerHTML = '';
        if (totalPaginas <= 1) return;
        for (let i = 0; i < totalPaginas; i++) {
            const btn = document.createElement('button');
            btn.textContent = i + 1;
            btn.dataset.pagina = i;
            if (i === pagina) btn.classList.add('active');
            this.linksPaginacaoEl.appendChild(btn);
        }
    },
    
    abrirPainel: function(firestoreId) {
        this.state.livroAtivo = this.state.todosOsLivros.find(l => l.firestoreId === firestoreId);
        if (!this.state.livroAtivo) return;
        const leituraMaisRecente = this.state.livroAtivo.leituras && this.state.livroAtivo.leituras.length > 0
            ? [...this.state.livroAtivo.leituras].sort((a,b) => new Date(b.dataFim || 0) - new Date(a.dataFim || 0))[0]
            : null;
        this.state.leituraAtivaId = leituraMaisRecente ? leituraMaisRecente.idLeitura : null;
        this.renderPainel();
        this.painelLivroEl.showModal();
    },
    
    limparPainel: function() {
        this.state.livroAtivo = null;
        this.state.leituraAtivaId = null;
        this.formLeituraContainerEl.innerHTML = '';
        this.formNotasEl.classList.add('hidden');
    },

    renderPainel: function() {
        if (!this.state.livroAtivo) return;
        this.painelTituloEl.textContent = this.state.livroAtivo.nomeDoLivro;
        this.painelCapaEl.src = this.state.livroAtivo.urlCapa || 'placeholder.jpg';
        this.renderPainelDetalhes();
        this.renderPainelLeituras();
    },

    renderPainelDetalhes: function() {
        const l = this.state.livroAtivo;
        document.getElementById('detalhe-autor').textContent = l.autor || '-';
        document.getElementById('detalhe-editora').textContent = l.editora || '-';
        document.getElementById('detalhe-ano').textContent = l.anoLancamento || '-';
        document.getElementById('detalhe-paginas').textContent = l.paginas || '-';
        document.getElementById('detalhe-lingua').textContent = l.lingua || '-';
        document.getElementById('detalhe-colecao').textContent = l.colecao || '-';
        document.getElementById('detalhe-volume').textContent = l.volume || '-';
        document.getElementById('detalhe-categorias').textContent = l.categorias || '-';
        document.getElementById('detalhe-descricao').textContent = l.descricao || 'Nenhuma sinopse cadastrada.';
    },

    renderPainelLeituras: function() {
        const leituras = this.state.livroAtivo.leituras || [];
        if (leituras.length === 0) {
            this.leiturasContainerEl.innerHTML = '<p>Nenhum histórico de leitura. Clique em "Iniciar Nova Leitura".</p>';
        } else {
            this.leiturasContainerEl.innerHTML = [...leituras].sort((a,b) => new Date(b.dataInicio) - new Date(a.dataInicio)).map(l => {
                const inicio = new Date(l.dataInicio).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
                const fim = l.dataFim ? new Date(l.dataFim).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'Lendo';
                const nota = l.notaFinal ? `★ ${l.notaFinal.toFixed(1)}` : '';
                const activeClass = l.idLeitura === this.state.leituraAtivaId ? 'active' : '';
                return `
                    <div class="item-leitura ${activeClass}" data-idleitura="${l.idLeitura}">
                        <span>${inicio} - ${fim}</span>
                        <strong>${nota}</strong>
                    </div>
                `;
            }).join('');
        }
        this.renderPainelNotas();
    },

    renderFormLeitura: function(leitura = null) {
        const id = leitura ? `value="${leitura.idLeitura}"` : '';
        const inicio = leitura ? leitura.dataInicio : new Date().toISOString().split('T')[0];
        const fim = leitura ? leitura.dataFim : '';
        const anotacoes = leitura ? leitura.anotacoes : '';
        const btnTexto = leitura ? 'Salvar Edição' : 'Registrar Leitura';
        const deleteBtn = leitura ? `<button type="button" class="btn btn-perigo btn-deletar-leitura" data-idleitura="${leitura.idLeitura}">Excluir</button>` : '';

        this.formLeituraContainerEl.classList.remove('hidden');

        this.formLeituraContainerEl.innerHTML = `
            <form id="form-leitura" class="painel-form">
                <input type="hidden" id="form-leitura-id" ${id}>
                <div class="form-grid-leitura">
                    <div class="form-campo">
                        <label for="form-data-inicio">Data Início:</label>
                        <input type="date" id="form-data-inicio" value="${inicio}" required>
                    </div>
                    <div class="form-campo">
                        <label for="form-data-fim">Data Fim:</label>
                        <input type="date" id="form-data-fim" value="${fim}">
                    </div>
                    <div class="form-campo full-width">
                        <label for="form-anotacoes">Anotações:</label>
                        <textarea id="form-anotacoes" rows="4">${anotacoes}</textarea>
                    </div>
                </div>
                <div class="form-botoes">
                    ${deleteBtn}
                    <button type="button" id="btn-cancelar-leitura" class="btn btn-secundario">Cancelar</button>
                    <button type="button" id="btn-salvar-leitura" class="btn btn-primario">${btnTexto}</button>
                </div>
            </form>
        `;
    },

    salvarLeitura: async function() {
        const idLeitura = document.getElementById('form-leitura-id').value;
        const dataInicio = document.getElementById('form-data-inicio').value;
        const dataFim = document.getElementById('form-data-fim').value;
        const anotacoes = document.getElementById('form-anotacoes').value;
        
        if (!this.state.livroAtivo.leituras) this.state.livroAtivo.leituras = [];
        let leitura = this.state.livroAtivo.leituras.find(l => l.idLeitura == idLeitura);
        if (leitura) {
            leitura.dataInicio = dataInicio;
            leitura.dataFim = dataFim || null;
            leitura.anotacoes = anotacoes;
        } else {
            leitura = { idLeitura: Date.now(), dataInicio, dataFim: dataFim || null, anotacoes, notas: {} };
            this.state.livroAtivo.leituras.push(leitura);
        }
        this.state.leituraAtivaId = leitura.idLeitura;
        this.formLeituraContainerEl.innerHTML = '';
        this.formLeituraContainerEl.classList.add('hidden');
        await App.salvarLivro(this.state.livroAtivo, this.state.livroAtivo.firestoreId);
        App.mostrarNotificacao('Registro de leitura salvo!');
    },

    deletarLeitura: async function(idLeitura) {
        this.state.livroAtivo.leituras = this.state.livroAtivo.leituras.filter(l => l.idLeitura !== idLeitura);
        this.state.leituraAtivaId = null;
        await App.salvarLivro(this.state.livroAtivo, this.state.livroAtivo.firestoreId);
        App.mostrarNotificacao('Registro de leitura excluído.');
    },

    renderPainelNotas: function() {
        const leitura = (this.state.livroAtivo.leituras || []).find(l => l.idLeitura === this.state.leituraAtivaId);
        if (!leitura || !leitura.dataFim) {
            this.formNotasEl.classList.add('hidden');
            this.avisoNotaBloqueadaEl.classList.remove('hidden');
            return;
        }
        this.avisoNotaBloqueadaEl.classList.add('hidden');
        this.formNotasEl.classList.remove('hidden');
        const notas = leitura.notas || {};
        this.state.criteriosDeNota.forEach(criterio => {
            const slider = document.getElementById(`nota-${criterio}`);
            const valorSpan = document.getElementById(`valor-nota-${criterio}`);
            if (slider && valorSpan) {
                slider.value = notas[criterio] || 5.0;
                valorSpan.textContent = parseFloat(slider.value).toFixed(1);
            }
        });
        this.calcularNotaFinal();
    },

    calcularNotaFinal: function() {
        let soma = 0;
        let count = 0;
        this.state.criteriosDeNota.forEach(criterio => {
            const slider = document.getElementById(`nota-${criterio}`);
            if (slider) {
                soma += parseFloat(slider.value);
                count++;
            }
        });
        const media = count > 0 ? soma / count : 0;
        this.notaFinalCalculadaEl.textContent = media.toFixed(1);
    },

    salvarNotas: async function() {
        const leitura = (this.state.livroAtivo.leituras || []).find(l => l.idLeitura === this.state.leituraAtivaId);
        if (!leitura) return App.mostrarNotificacao('Nenhuma leitura selecionada para salvar as notas.', 'erro');
        if (!leitura.notas) leitura.notas = {};
        this.state.criteriosDeNota.forEach(criterio => {
            const slider = document.getElementById(`nota-${criterio}`);
            if (slider) {
                leitura.notas[criterio] = parseFloat(slider.value);
            }
        });
        leitura.notaFinal = parseFloat(this.notaFinalCalculadaEl.textContent);
        await App.salvarLivro(this.state.livroAtivo, this.state.livroAtivo.firestoreId);
        App.mostrarNotificacao('Notas salvas com sucesso!');
        this.renderPainelLeituras();
    }
};