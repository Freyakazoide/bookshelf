const Adicionar = {
    state: {
        isInitialized: false,
        todosOsLivros: [],
        resultadosApi: [],
        livroApiSelecionado: null,
        buscaApiTermo: '',
        buscaApiPagina: 0,
        buscaApiTotalItems: 0,
        buscaApiPorPagina: 40,
        debounceTimer: null,
    },
    cacheDOM: function() {
        this.formLivroEl = document.getElementById('form-livro');
        this.inputBuscaApiTituloEl = document.getElementById('input-busca-api-titulo');
        this.inputBuscaApiAutorEl = document.getElementById('input-busca-api-autor');
        this.btnBuscaApiEl = document.getElementById('btn-busca-api');
        this.resultadosBuscaApiEl = document.getElementById('resultados-busca-api');
        this.formContainerEl = document.getElementById('form-container');
        this.formTituloEl = document.getElementById('form-livro-titulo');
        this.painelSincronizacaoEl = document.getElementById('painel-sincronizacao');
        this.sincContainerEl = document.getElementById('sinc-container');
        this.btnFecharSincEl = document.getElementById('btn-fechar-sinc');
        this.adicionarManualContainerEl = document.getElementById('adicionar-manual-container');
        this.btnAdicionarManualEl = document.getElementById('btn-adicionar-manual');
        this.buscaApiPaginacaoEl = document.getElementById('busca-api-paginacao');
        this.btnBuscaAnteriorEl = document.getElementById('btn-busca-anterior');
        this.btnBuscaProximaEl = document.getElementById('btn-busca-proxima');
        this.buscaApiInfoPaginaEl = document.getElementById('busca-api-info-pagina');

        this.formCapaPreviewEl = document.getElementById('form-capa-preview');
        this.inputUrlCapaEl = document.getElementById('urlCapa');
        this.formTabs = document.querySelectorAll('.form-tabs .tab-button');
        this.formTabContents = document.querySelectorAll('.form-tab-content');
    },
    debounce: function(func, delay) {
        clearTimeout(this.state.debounceTimer);
        this.state.debounceTimer = setTimeout(func, delay);
    },
    bindEvents: function() {
        this.formLivroEl.addEventListener('submit', this.salvar.bind(this));
        this.btnBuscaApiEl.addEventListener('click', () => this.buscarNaApi(true));
        this.resultadosBuscaApiEl.addEventListener('click', this.selecionarResultadoApi.bind(this));
        this.btnFecharSincEl.addEventListener('click', () => this.painelSincronizacaoEl.classList.add('hidden'));
        this.sincContainerEl.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-sinc')) {
                const campo = e.target.dataset.campo;
                this.aplicarSincronizacao(campo);
            }
        });
        this.btnAdicionarManualEl.addEventListener('click', () => this.preencherFormulario(null));
        this.btnBuscaAnteriorEl.addEventListener('click', () => {
            if (this.state.buscaApiPagina > 0) {
                this.state.buscaApiPagina--;
                this.buscarNaApi(false);
            }
        });
        this.btnBuscaProximaEl.addEventListener('click', () => {
            this.state.buscaApiPagina++;
            this.buscarNaApi(false);
        });

        this.inputUrlCapaEl.addEventListener('input', () => {
            this.debounce(() => this.atualizarPreviewCapa(this.inputUrlCapaEl.value), 500);
        });

        this.formTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabId = e.target.dataset.tab;
                this.formTabs.forEach(t => t.classList.remove('active'));
                this.formTabContents.forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
                document.getElementById(tabId).classList.add('active');
            });
        });
    },
    atualizarPreviewCapa: function(url) {
        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
            this.formCapaPreviewEl.src = url;
        } else {
            this.formCapaPreviewEl.src = 'placeholder.jpg';
        }
        this.formCapaPreviewEl.onerror = () => {
            this.formCapaPreviewEl.src = 'placeholder.jpg';
        };
    },
init: function(livros) {
    if (!this.state.isInitialized) {
        this.cacheDOM();
        this.bindEvents();
        this.formContainerEl.classList.add('hidden');
        this.state.isInitialized = true;
    }
    
    this.state.todosOsLivros = livros;
},
    buscarNaApi: async function(novaBusca = true) {
        if (novaBusca) {
            const titulo = this.inputBuscaApiTituloEl.value.trim();
            const autor = this.inputBuscaApiAutorEl.value.trim();
            let query = '';
            if (titulo) query += `intitle:${titulo}`;
            if (autor) query += `${query ? '+' : ''}inauthor:${autor}`;
            this.state.buscaApiTermo = query;
            this.state.buscaApiPagina = 0;
        }
        if (!this.state.buscaApiTermo) return App.mostrarNotificacao('Digite um título ou autor.', 'erro');

        const fonteApi = document.querySelector('input[name="api-source"]:checked').value;
        this.resultadosBuscaApiEl.innerHTML = `<div class="loader-container" style="padding: 2rem 0;"><div class="loader"></div><p>Buscando página ${this.state.buscaApiPagina + 1}...</p></div>`;
        this.buscaApiPaginacaoEl.classList.add('hidden');
        this.adicionarManualContainerEl.classList.add('hidden');
        this.painelSincronizacaoEl.classList.add('hidden');
        
        const idLivroExistente = document.getElementById('livro-id').value;
        if (!idLivroExistente) {
            this.formContainerEl.classList.add('hidden');
        }

        try {
            let resultados = [];
            let totalItems = 0;

            if (fonteApi === 'google') {
                const googleData = await this.buscarNoGoogleBooks(this.state.buscaApiTermo, this.state.buscaApiPagina);
                resultados = googleData.items;
                totalItems = googleData.total;
            } else if (fonteApi === 'open') {
                resultados = await this.buscarNaOpenLibrary(this.state.buscaApiTermo);
            } else {
                const googleData = await this.buscarNoGoogleBooks(this.state.buscaApiTermo, this.state.buscaApiPagina);
                resultados = googleData.items;
                totalItems = googleData.total;
                if (!resultados || resultados.length === 0) {
                    this.resultadosBuscaApiEl.innerHTML = '<p>Não encontrado no Google. Tentando na Open Library...</p>';
                    await new Promise(resolve => setTimeout(resolve, 500));
                    resultados = await this.buscarNaOpenLibrary(this.state.buscaApiTermo);
                }
            }

            this.state.resultadosApi = resultados;
            this.state.buscaApiTotalItems = totalItems;
            this.renderResultados();
            this.adicionarManualContainerEl.classList.remove('hidden');

        } catch (error) {
            this.resultadosBuscaApiEl.innerHTML = '<p>Erro na busca. Tente novamente.</p>';
            this.adicionarManualContainerEl.classList.remove('hidden');
            console.error("Erro na busca da API:", error);
        }
    },
    buscarNoGoogleBooks: async function(termo, pagina) {
        const startIndex = pagina * this.state.buscaApiPorPagina;
        let apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(termo)}&maxResults=${this.state.buscaApiPorPagina}&startIndex=${startIndex}`;
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Falha na API do Google Books');
        const data = await response.json();
        const items = data.items ? data.items.map(item => ({ volumeInfo: item.volumeInfo, fonte: 'Google Books' })) : [];
        return { items, total: data.totalItems || 0 };
    },
    buscarNaOpenLibrary: async function(termo) {
        const query = encodeURIComponent(termo.replace(/\+/g, ' ').replace(/intitle:|inauthor:/g, ''));
        const apiUrl = `https://openlibrary.org/search.json?q=${query}&limit=40`;
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Falha na API da Open Library');
        const data = await response.json();
        if (!data.docs) return [];
        return data.docs.map(doc => ({
            volumeInfo: {
                title: doc.title,
                authors: doc.author_name || [],
                publishedDate: doc.first_publish_year ? doc.first_publish_year.toString() : '',
                description: Array.isArray(doc.first_sentence_value) ? doc.first_sentence_value[0] : (doc.first_sentence_value || ''),
                pageCount: doc.number_of_pages_median || null,
                categories: doc.subject ? doc.subject.slice(0, 3) : [],
                imageLinks: doc.cover_i ? { thumbnail: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` } : null,
                publisher: doc.publisher ? doc.publisher[0] : ''
            },
            fonte: 'Open Library'
        }));
    },
    renderResultados: function() {
        if (!this.state.resultadosApi || this.state.resultadosApi.length === 0) {
            this.resultadosBuscaApiEl.innerHTML = '<p style="text-align: center; padding: 2rem 0;">Nenhum livro encontrado.</p>';
            this.buscaApiPaginacaoEl.classList.add('hidden');
            return;
        }
        this.resultadosBuscaApiEl.innerHTML = this.state.resultadosApi.map((livro, index) => {
            const info = livro.volumeInfo;
            const capa = info.imageLinks?.thumbnail || 'placeholder.jpg';
            const autor = Array.isArray(info.authors) ? info.authors.join(', ') : (info.authors || 'Autor desconhecido');
            return `<div class="card-resultado-api"><img src="${capa}" alt="Capa de ${info.title}"><h5>${info.title}</h5><p>${autor}</p><p class="fonte-api">Fonte: ${livro.fonte}</p><button class="btn btn-primario btn-selecionar-api" data-index="${index}"><i class="fa-solid fa-check"></i> Selecionar</button></div>`;
        }).join('');
        this.renderPaginacaoBusca();
    },
    renderPaginacaoBusca: function() {
        const { buscaApiPagina, buscaApiPorPagina, buscaApiTotalItems } = this.state;
        const totalPaginas = Math.ceil(buscaApiTotalItems / buscaApiPorPagina);

        if (buscaApiTotalItems > buscaApiPorPagina) {
            this.buscaApiPaginacaoEl.classList.remove('hidden');
            this.btnBuscaAnteriorEl.disabled = (buscaApiPagina === 0);
            this.btnBuscaProximaEl.disabled = (buscaApiPagina + 1 >= totalPaginas);
            this.buscaApiInfoPaginaEl.textContent = `Página ${buscaApiPagina + 1} de ${totalPaginas}`;
        } else {
            this.buscaApiPaginacaoEl.classList.add('hidden');
        }
    },
    selecionarResultadoApi: function(e) {
        if (!e.target.classList.contains('btn-selecionar-api')) return;
        const index = e.target.dataset.index;
        const livroSelecionado = this.state.resultadosApi[index];
        if (!livroSelecionado) return;
        const idLivroExistente = document.getElementById('livro-id').value;
        if (idLivroExistente) {
            this.state.livroApiSelecionado = livroSelecionado.volumeInfo;
            this.renderPainelSincronizacao();
            this.painelSincronizacaoEl.classList.remove('hidden');
            this.painelSincronizacaoEl.scrollIntoView({ behavior: 'smooth' });
        } else {
            this.preencherFormulario(livroSelecionado.volumeInfo);
        }
    },
    renderPainelSincronizacao: function() {
        const infoApi = this.state.livroApiSelecionado;
        if (!infoApi) return;
        const campos = {
            nomeDoLivro: { label: 'Título', valorApi: infoApi.title },
            autor: { label: 'Autor', valorApi: Array.isArray(infoApi.authors) ? infoApi.authors.join(', ') : infoApi.authors },
            urlCapa: { label: 'Capa', valorApi: infoApi.imageLinks?.thumbnail },
            descricao: { label: 'Sinopse', valorApi: infoApi.description },
            paginas: { label: 'Páginas', valorApi: infoApi.pageCount },
            anoLancamento: { label: 'Ano Lançamento', valorApi: infoApi.publishedDate?.toString().split('-')[0] },
            editora: { label: 'Editora', valorApi: infoApi.publisher },
            categorias: { label: 'Categorias', valorApi: Array.isArray(infoApi.categories) ? infoApi.categories.join(', ') : infoApi.categories },
        };
        let html = '';
        for (const [key, value] of Object.entries(campos)) {
            const valorAtualEl = document.getElementById(key);
            if (!valorAtualEl) continue;
            const valorAtual = valorAtualEl.value;
            const valorApi = value.valorApi || '';
            if (valorApi && valorApi.toString().trim() !== valorAtual.trim()) {
                html += `<div class="sinc-campo"><h5>${value.label}</h5><p class="valor-atual"><b>Atual:</b> ${valorAtual || 'Vazio'}</p><p class="valor-api"><b>API:</b> ${valorApi}</p><button class="btn btn-primario btn-sinc" data-campo="${key}">Usar este</button></div>`;
            }
        }
        this.sincContainerEl.innerHTML = html;
    },
    aplicarSincronizacao: function(campo) {
        if (!this.state.livroApiSelecionado) return;
        const infoApi = this.state.livroApiSelecionado;
        let valorApi;
        switch (campo) {
            case 'nomeDoLivro': valorApi = infoApi.title; break;
            case 'autor': valorApi = Array.isArray(infoApi.authors) ? infoApi.authors.join(', ') : infoApi.authors; break;
            case 'urlCapa': valorApi = infoApi.imageLinks?.thumbnail; break;
            case 'descricao': valorApi = infoApi.description; break;
            case 'paginas': valorApi = infoApi.pageCount; break;
            case 'anoLancamento': valorApi = infoApi.publishedDate?.toString().split('-')[0]; break;
            case 'editora': valorApi = infoApi.publisher; break;
            case 'categorias': valorApi = Array.isArray(infoApi.categories) ? infoApi.categories.join(', ') : infoApi.categories; break;
        }
        if (typeof valorApi !== 'undefined') {
            const el = document.getElementById(campo);
            el.value = valorApi;
            if (campo === 'urlCapa') {
                this.atualizarPreviewCapa(valorApi);
            }
            App.mostrarNotificacao(`Campo "${campo}" atualizado!`);
            this.renderPainelSincronizacao();
        }
    },
    preencherFormulario: function(info, livroExistente = null) {
        this.formLivroEl.reset();
        this.formTituloEl.textContent = livroExistente ? 'Editando Cadastro do Livro' : 'Complete os dados e salve';
        const getVal = (existente, apiVal, fallback = '') => existente ?? (apiVal ?? fallback);
        const getArrayVal = (existente, apiVal) => existente ?? (Array.isArray(apiVal) ? apiVal.join(', ') : (apiVal || ''));
        
        const livroId = livroExistente ? (livroExistente.firestoreId || livroExistente.id) : '';
        document.getElementById('livro-id').value = livroId;

        document.getElementById('nomeDoLivro').value = getVal(livroExistente?.nomeDoLivro, info?.title);
        document.getElementById('autor').value = getArrayVal(livroExistente?.autor, info?.authors);
        document.getElementById('dataAquisicao').value = getVal(livroExistente?.dataAquisicao, new Date().toISOString().split('T')[0]);
        document.getElementById('anoLancamento').value = getVal(livroExistente?.anoLancamento, info?.publishedDate?.toString().split('-')[0]);
        document.getElementById('editora').value = getVal(livroExistente?.editora, info?.publisher);
        document.getElementById('colecao').value = getVal(livroExistente?.colecao);
        document.getElementById('volume').value = getVal(livroExistente?.volume);
        document.getElementById('paginas').value = getVal(livroExistente?.paginas, info?.pageCount);
        document.getElementById('lingua').value = getVal(livroExistente?.lingua, info?.language?.toUpperCase());
        const urlCapa = getVal(livroExistente?.urlCapa, info?.imageLinks?.thumbnail);
        document.getElementById('urlCapa').value = urlCapa;
        this.atualizarPreviewCapa(urlCapa);
        document.getElementById('categorias').value = getArrayVal(livroExistente?.categorias, info?.categories);
        document.getElementById('descricao').value = getVal(livroExistente?.descricao, info?.description);
        
        this.formTabs.forEach(t => t.classList.remove('active'));
        this.formTabContents.forEach(c => c.classList.remove('active'));
        this.formTabs[0].classList.add('active');
        this.formTabContents[0].classList.add('active');

        this.formContainerEl.classList.remove('hidden');
        this.formContainerEl.scrollIntoView({ behavior: 'smooth' });
    },
    salvar: async function(e) {
        e.preventDefault();
        const firestoreId = document.getElementById('livro-id').value;
        const livroData = {
            id: firestoreId ? (this.state.todosOsLivros.find(l => l.firestoreId === firestoreId)?.id || Date.now()) : Date.now(),
            nomeDoLivro: document.getElementById('nomeDoLivro').value,
            autor: document.getElementById('autor').value,
            dataAquisicao: document.getElementById('dataAquisicao').value,
            anoLancamento: parseInt(document.getElementById('anoLancamento').value, 10) || null,
            editora: document.getElementById('editora').value,
            colecao: document.getElementById('colecao').value,
            volume: document.getElementById('volume').value,
            paginas: parseInt(document.getElementById('paginas').value, 10) || null,
            lingua: document.getElementById('lingua').value,
            urlCapa: document.getElementById('urlCapa').value,
            categorias: document.getElementById('categorias').value,
            descricao: document.getElementById('descricao').value
        };

        try {
            await App.salvarLivro(livroData, firestoreId);
            App.mostrarNotificacao('Livro salvo com sucesso!');
            this.formLivroEl.reset();
            this.formContainerEl.classList.add('hidden');
            this.resultadosBuscaApiEl.innerHTML = '';
            this.adicionarManualContainerEl.classList.add('hidden');
            this.painelSincronizacaoEl.classList.add('hidden');
            this.buscaApiPaginacaoEl.classList.add('hidden');
            this.inputBuscaApiTituloEl.value = '';
            this.inputBuscaApiAutorEl.value = '';
            this.atualizarPreviewCapa('');
            App.navegarPara('view-estante');
        } catch (error) {
            console.error('Falha ao salvar:', error);
            App.mostrarNotificacao('Falha ao salvar o livro. Tente novamente.', 'erro');
        }
    },
    modoEdicao: function(livroId) {
        const livro = this.state.todosOsLivros.find(l => l.id == livroId);
        if (livro) {
            this.resultadosBuscaApiEl.innerHTML = '';
            this.painelSincronizacaoEl.classList.add('hidden');
            this.adicionarManualContainerEl.classList.add('hidden');
            this.buscaApiPaginacaoEl.classList.add('hidden');
            this.preencherFormulario(null, livro);
        }
    }
};