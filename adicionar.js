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
        buscaTipo: 'geral'
    },

    cacheDOM: function() {
        this.inputBuscaApiIsbnEl = document.getElementById('input-busca-api-isbn');
        this.inputBuscaApiTituloEl = document.getElementById('input-busca-api-titulo');
        this.inputBuscaApiAutorEl = document.getElementById('input-busca-api-autor');
        this.btnBuscaApiEl = document.getElementById('btn-busca-api');
        
        this.resultadosBuscaApiEl = document.getElementById('resultados-busca-api');
        this.controlesResultadosEl = document.getElementById('controles-resultados-api');
        this.formContainerEl = document.getElementById('form-container');
        this.painelSincronizacaoEl = document.getElementById('painel-sincronizacao');
        
        this.buscaApiPaginacaoEl = document.getElementById('busca-api-paginacao');
        this.btnBuscaAnteriorEl = document.getElementById('btn-busca-anterior');
        this.btnBuscaProximaEl = document.getElementById('btn-busca-proxima');
        this.buscaApiInfoPaginaEl = document.getElementById('busca-api-info-pagina');
        this.btnAdicionarManualEl = document.getElementById('btn-adicionar-manual');
        
        this.formLivroEl = document.getElementById('form-livro');
        this.formTituloEl = document.getElementById('form-livro-titulo');
        this.formCapaPreviewEl = document.getElementById('form-capa-preview');
        this.inputUrlCapaEl = document.getElementById('urlCapa');
        this.btnCacarCapaEl = document.getElementById('btn-cacar-capa');
        this.btnCancelarFormEl = document.getElementById('btn-cancelar-form');
        
        this.formTabs = document.querySelectorAll('.form-tabs .tab-button');
        this.formTabContents = document.querySelectorAll('.form-tab-content');
        this.sincContainerEl = document.getElementById('sinc-container');
        this.btnFecharSincEl = document.getElementById('btn-fechar-sinc');
    },

    init: function(livros) {
        this.state.todosOsLivros = livros;
        if (!this.state.isInitialized) {
            this.cacheDOM();
            this.bindEvents();
            this.limparInterface();
            this.state.isInitialized = true;
        }
    },

    limparInterface: function() {
        if (this.formContainerEl) this.formContainerEl.classList.add('hidden');
        if (this.resultadosBuscaApiEl) this.resultadosBuscaApiEl.innerHTML = '';
        if (this.controlesResultadosEl) this.controlesResultadosEl.classList.add('hidden');
        if (this.painelSincronizacaoEl) this.painelSincronizacaoEl.classList.add('hidden');
        if (this.inputBuscaApiTituloEl) this.inputBuscaApiTituloEl.value = '';
        if (this.inputBuscaApiAutorEl) this.inputBuscaApiAutorEl.value = '';
        if (this.inputBuscaApiIsbnEl) this.inputBuscaApiIsbnEl.value = '';
    },

    bindEvents: function() {
        this.btnBuscaApiEl.addEventListener('click', () => this.buscarNaApi(true));
        
        this.resultadosBuscaApiEl.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-selecionar-api');
            if (btn) this.selecionarResultadoApi(btn.dataset.index);
        });

        this.btnAdicionarManualEl.addEventListener('click', () => {
            this.resultadosBuscaApiEl.innerHTML = '';
            this.controlesResultadosEl.classList.add('hidden');
            this.preencherFormulario(null);
        });

        this.btnCancelarFormEl.addEventListener('click', () => {
            this.formContainerEl.classList.add('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        this.formLivroEl.addEventListener('submit', this.salvar.bind(this));

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

        this.btnCacarCapaEl.addEventListener('click', () => {
            const titulo = document.getElementById('nomeDoLivro').value;
            const autor = document.getElementById('autor').value;
            if (!titulo) return App.mostrarNotificacao('Preencha o título primeiro.', 'erro');
            const query = encodeURIComponent(`${titulo} ${autor} book cover high resolution`);
            window.open(`https://www.google.com/search?tbm=isch&q=${query}`, '_blank');
        });

        this.inputUrlCapaEl.addEventListener('input', () => {
            clearTimeout(this.state.debounceTimer);
            this.state.debounceTimer = setTimeout(() => this.atualizarPreviewCapa(this.inputUrlCapaEl.value), 500);
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

        this.btnFecharSincEl.addEventListener('click', () => this.painelSincronizacaoEl.classList.add('hidden'));
        this.sincContainerEl.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-sinc')) {
                this.aplicarSincronizacao(e.target.dataset.campo);
            }
        });
    },

    // --- FUNÇÃO HELPER INTELIGENTE PARA MINERAR DADOS DE STRINGS ---
    extrairDadosExtras: function(titulo, subtitulo, description) {
        let colecao = '';
        let volume = '';
        
        // Tenta achar padrões como "Vol. 1", "Book 2", "#3"
        const textoCompleto = `${titulo} ${subtitulo || ''}`;
        
        // Regex para Volume
        const regexVol = /(?:Vol\.|Volume|Book|Bk\.|Part|#)\s*(\d+)/i;
        const matchVol = textoCompleto.match(regexVol);
        if (matchVol) volume = matchVol[1];

        // Regex para Coleção (Geralmente algo antes do # ou entre parenteses)
        // Ex: "Harry Potter #1", "Harry Potter (Book 1)"
        const regexCol = /([a-zA-Z0-9\s\']+)(?:\s+#\d+|\s+\(Book\s+\d+\))/i;
        const matchCol = textoCompleto.match(regexCol);
        
        // Se achar padrão de série no título, usa
        if (matchCol) {
            colecao = matchCol[1].trim();
        } else if (subtitulo) {
            // Se não, as vezes o subtítulo É a coleção
            // Verifica se o subtítulo não é apenas uma descrição longa
            if (subtitulo.length < 50) colecao = subtitulo;
        }

        return { colecao, volume };
    },

    buscarNaApi: async function(novaBusca = true) {
        if (novaBusca) {
            const isbn = this.inputBuscaApiIsbnEl.value.replace(/[^0-9X]/ig, "");
            const titulo = this.inputBuscaApiTituloEl.value.trim();
            const autor = this.inputBuscaApiAutorEl.value.trim();
            
            let query = '';
            if (isbn.length >= 10) {
                query = `isbn:${isbn}`;
                this.state.buscaTipo = 'isbn';
            } else {
                if (titulo) query += `intitle:${titulo}`;
                if (autor) query += `${query ? '+' : ''}inauthor:${autor}`;
                this.state.buscaTipo = 'geral';
            }
            this.state.buscaApiTermo = query;
            this.state.buscaApiPagina = 0;
        }

        if (!this.state.buscaApiTermo) return App.mostrarNotificacao('Digite ISBN, título ou autor.', 'erro');

        this.btnBuscaApiEl.disabled = true;
        this.btnBuscaApiEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Rastreando...';
        this.resultadosBuscaApiEl.innerHTML = `<div class="loader-container" style="padding: 3rem; text-align:center;"><div class="loader"></div><p style="color:#94a3b8; margin-top:1rem;">Consultando os arquivos da biblioteca...</p></div>`;
        
        this.formContainerEl.classList.add('hidden'); 
        this.controlesResultadosEl.classList.add('hidden');

        const fonteApi = document.querySelector('input[name="api-source"]:checked').value;

        try {
            let resultados = [];
            let totalItems = 0;

            if (fonteApi === 'google' || fonteApi === 'ambos') {
                const googleData = await this.buscarNoGoogleBooks(this.state.buscaApiTermo, this.state.buscaApiPagina);
                resultados = googleData.items;
                totalItems = googleData.total;
            }
            
            if ((!resultados || resultados.length === 0 || fonteApi === 'open' || fonteApi === 'ambos') && this.state.buscaTipo !== 'isbn') {
                const openData = await this.buscarNaOpenLibrary(this.state.buscaApiTermo);
                resultados = [...resultados, ...openData]; 
            }

            this.state.resultadosApi = resultados;
            this.state.buscaApiTotalItems = totalItems;
            this.renderResultados();
            this.controlesResultadosEl.classList.remove('hidden');

        } catch (error) {
            this.resultadosBuscaApiEl.innerHTML = '<p style="text-align:center; padding:2rem; color:#ef4444;">Erro na comunicação com a biblioteca central.</p>';
            this.controlesResultadosEl.classList.remove('hidden');
            console.error(error);
        } finally {
            this.btnBuscaApiEl.disabled = false;
            this.btnBuscaApiEl.innerHTML = '<i class="fa-solid fa-search"></i> RASTREAR LIVRO';
        }
    },

    buscarNoGoogleBooks: async function(termo, pagina) {
        const startIndex = pagina * this.state.buscaApiPorPagina;
        const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(termo)}&maxResults=${this.state.buscaApiPorPagina}&startIndex=${startIndex}`;
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        const items = data.items ? data.items.filter(i=>i.volumeInfo).map(item => {
            const info = item.volumeInfo;
            // Tenta extrair dados extras usando a heurística
            const extras = this.extrairDadosExtras(info.title, info.subtitle, info.description);
            
            return {
                volumeInfo: {
                    ...info,
                    // Se a API não der, usa a nossa heurística
                    pageCount: info.pageCount || 0, // Garante 0 se vier vazio
                    colecao: extras.colecao,
                    volume: extras.volume
                }, 
                fonte: 'Google' 
            };
        }) : [];
        return { items, total: data.totalItems || 0 };
    },

    buscarNaOpenLibrary: async function(termo) {
        const query = termo.replace(/intitle:|inauthor:|isbn:/g, '').replace(/\+/g, ' ').trim();
        const apiUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`;
        const response = await fetch(apiUrl);
        const data = await response.json();
        if (!data.docs) return [];
        return data.docs.map(doc => ({
            volumeInfo: {
                title: doc.title,
                authors: doc.author_name || [],
                publishedDate: doc.first_publish_year ? doc.first_publish_year.toString() : '',
                description: doc.first_sentence_value ? doc.first_sentence_value[0] : '',
                // OpenLibrary tem nomes variados para páginas
                pageCount: doc.number_of_pages_median || doc.number_of_pages || null,
                // OpenLibrary tem campos de série!
                colecao: doc.series ? doc.series[0] : (doc.series_name ? doc.series_name[0] : ''), 
                volume: doc.series_sequence ? doc.series_sequence[0] : '',
                categories: doc.subject ? doc.subject.slice(0, 3) : [],
                imageLinks: doc.cover_i ? { thumbnail: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` } : null,
                publisher: doc.publisher ? doc.publisher[0] : ''
            },
            fonte: 'OpenLib'
        }));
    },

    renderResultados: function() {
        if (!this.state.resultadosApi || this.state.resultadosApi.length === 0) {
            this.resultadosBuscaApiEl.innerHTML = '<div class="placeholder-container" style="padding: 2rem 0;"><i class="fa-solid fa-ghost"></i><p>Nenhum livro encontrado.</p></div>';
            this.buscaApiPaginacaoEl.classList.add('hidden');
            return;
        }

        this.resultadosBuscaApiEl.innerHTML = this.state.resultadosApi.map((livro, index) => {
            const info = livro.volumeInfo;
            let capa = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || 'placeholder.jpg';
            capa = capa.replace('http://', 'https://');
            const autor = Array.isArray(info.authors) ? info.authors.join(', ') : (info.authors || 'Desconhecido');
            const ano = info.publishedDate ? info.publishedDate.substring(0,4) : '';
            // Mostra info extra no card se tiver
            const paginasInfo = info.pageCount ? ` • ${info.pageCount} págs` : '';

            return `
            <div class="card-resultado-api">
                <img src="${capa}" onerror="this.src='placeholder.jpg'">
                <div class="card-resultado-info">
                    <h5>${info.title}</h5>
                    <p>${autor} ${ano ? `(${ano})` : ''}${paginasInfo}</p>
                    <div class="tag-fonte">${livro.fonte}</div>
                    <button class="btn btn-primario btn-selecionar-api" data-index="${index}" style="width:100%; margin-top:auto;"><i class="fa-solid fa-file-import"></i> Escolher</button>
                </div>
            </div>`;
        }).join('');

        this.resultadosBuscaApiEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        this.renderPaginacaoBusca();
    },

    renderPaginacaoBusca: function() {
        const { buscaApiPagina, buscaApiPorPagina, buscaApiTotalItems } = this.state;
        const totalPaginas = Math.ceil(buscaApiTotalItems / buscaApiPorPagina);

        if (buscaApiTotalItems > buscaApiPorPagina && this.state.buscaTipo !== 'isbn') {
            this.buscaApiPaginacaoEl.classList.remove('hidden');
            this.btnBuscaAnteriorEl.disabled = (buscaApiPagina === 0);
            this.btnBuscaProximaEl.disabled = (buscaApiPagina + 1 >= totalPaginas) || (buscaApiPagina > 20);
            this.buscaApiInfoPaginaEl.textContent = `Pág ${buscaApiPagina + 1}`;
        } else {
            this.buscaApiPaginacaoEl.classList.add('hidden');
        }
    },

    selecionarResultadoApi: function(index) {
        const livroSelecionado = this.state.resultadosApi[index];
        if (!livroSelecionado) return;

        if(livroSelecionado.volumeInfo.imageLinks) {
            if(livroSelecionado.volumeInfo.imageLinks.thumbnail) {
                livroSelecionado.volumeInfo.imageLinks.thumbnail = livroSelecionado.volumeInfo.imageLinks.thumbnail.replace('http://', 'https://');
            }
        }

        const idLivroExistente = document.getElementById('livro-id').value;
        
        if (idLivroExistente) {
            this.state.livroApiSelecionado = livroSelecionado.volumeInfo;
            this.renderPainelSincronizacao();
            this.painelSincronizacaoEl.classList.remove('hidden');
        } else {
            this.preencherFormulario(livroSelecionado.volumeInfo);
        }
    },

    preencherFormulario: function(info, livroExistente = null) {
        this.formLivroEl.reset();
        this.formTituloEl.textContent = livroExistente ? 'Editando Tomo' : 'Catalogar Novo Livro';
        
        const getVal = (existente, apiVal, fallback = '') => existente ?? (apiVal ?? fallback);
        const getArrayVal = (existente, apiVal) => existente ?? (Array.isArray(apiVal) ? apiVal.join(', ') : (apiVal || ''));
        
        const livroId = livroExistente ? (livroExistente.firestoreId || livroExistente.id) : '';
        document.getElementById('livro-id').value = livroId;

        // Mapeamento Aprimorado com os novos campos minerados
        document.getElementById('nomeDoLivro').value = getVal(livroExistente?.nomeDoLivro, info?.title);
        document.getElementById('autor').value = getArrayVal(livroExistente?.autor, info?.authors);
        document.getElementById('dataAquisicao').value = getVal(livroExistente?.dataAquisicao, new Date().toISOString().split('T')[0]);
        document.getElementById('anoLancamento').value = getVal(livroExistente?.anoLancamento, info?.publishedDate?.toString().split('-')[0]);
        document.getElementById('editora').value = getVal(livroExistente?.editora, info?.publisher);
        
        // Tenta usar a coleção minerada se disponível
        document.getElementById('colecao').value = getVal(livroExistente?.colecao, info?.colecao);
        document.getElementById('volume').value = getVal(livroExistente?.volume, info?.volume);
        
        document.getElementById('paginas').value = getVal(livroExistente?.paginas, info?.pageCount);
        document.getElementById('lingua').value = getVal(livroExistente?.lingua, info?.language?.toUpperCase());
        document.getElementById('categorias').value = getArrayVal(livroExistente?.categorias, info?.categories);
        document.getElementById('descricao').value = getVal(livroExistente?.descricao, info?.description);
        
        let urlCapa = getVal(livroExistente?.urlCapa, info?.imageLinks?.thumbnail);
        if(urlCapa) urlCapa = urlCapa.replace('http://', 'https://');
        document.getElementById('urlCapa').value = urlCapa;
        this.atualizarPreviewCapa(urlCapa);

        this.formContainerEl.classList.remove('hidden');
        this.formContainerEl.scrollIntoView({ behavior: 'smooth' });
    },

    atualizarPreviewCapa: function(url) {
        this.formCapaPreviewEl.src = url || 'placeholder.jpg';
        this.formCapaPreviewEl.onerror = () => { this.formCapaPreviewEl.src = 'placeholder.jpg'; };
    },

    salvar: async function(e) {
        e.preventDefault();
        const firestoreId = document.getElementById('livro-id').value;
        
// Garante que o RPG data seja gerado se não existir
        const rpgData = Gamification.gerarDadosMob({
            paginas: document.getElementById('paginas').value,
            anoLancamento: document.getElementById('anoLancamento').value,
            categorias: document.getElementById('categorias').value
        });

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
            descricao: document.getElementById('descricao').value,
            leituras: firestoreId ? (this.state.todosOsLivros.find(l => l.firestoreId === firestoreId)?.leituras || []) : [],
            loot: firestoreId ? (this.state.todosOsLivros.find(l => l.firestoreId === firestoreId)?.loot || null) : null,
            citacoes: firestoreId ? (this.state.todosOsLivros.find(l => l.firestoreId === firestoreId)?.citacoes || []) : [],
            situacao: firestoreId ? (this.state.todosOsLivros.find(l => l.firestoreId === firestoreId)?.situacao || 'Quero Ler') : 'Quero Ler',
            
            rpg: firestoreId ? (this.state.todosOsLivros.find(l => l.firestoreId === firestoreId)?.rpg || rpgData) : rpgData
        };

        try {
            await App.salvarLivro(livroData, firestoreId);
            App.mostrarNotificacao('Livro catalogado com sucesso!');
            this.limparInterface();
            App.navegarPara('view-estante');
        } catch (error) {
            console.error('Falha ao salvar:', error);
            App.mostrarNotificacao('Falha ao salvar no arquivo.', 'erro');
        }
    },

    renderPainelSincronizacao: function() {
        const infoApi = this.state.livroApiSelecionado;
        if (!infoApi) return;
        const campos = {
            nomeDoLivro: { label: 'Título', valorApi: infoApi.title },
            autor: { label: 'Autor', valorApi: Array.isArray(infoApi.authors) ? infoApi.authors.join(', ') : infoApi.authors },
            paginas: { label: 'Páginas', valorApi: infoApi.pageCount },
            urlCapa: { label: 'Capa', valorApi: infoApi.imageLinks?.thumbnail },
            anoLancamento: { label: 'Ano', valorApi: infoApi.publishedDate?.toString().split('-')[0] },
            descricao: { label: 'Sinopse', valorApi: infoApi.description },
            editora: { label: 'Editora', valorApi: infoApi.publisher },
            colecao: { label: 'Coleção', valorApi: infoApi.colecao }, // Novo campo minerado
            volume: { label: 'Volume', valorApi: infoApi.volume }, // Novo campo minerado
            categorias: { label: 'Categorias', valorApi: Array.isArray(infoApi.categories) ? infoApi.categories.join(', ') : infoApi.categories }
        };
        let html = '';
        
        for (const [key, value] of Object.entries(campos)) {
            const valorAtualEl = document.getElementById(key);
            if (!valorAtualEl) continue;
            const valorAtual = valorAtualEl.value;
            const valorApi = value.valorApi || '';
            
            if (valorApi && valorApi.toString().trim() !== valorAtual.trim()) {
                html += `<div class="sinc-campo" style="background:rgba(0,0,0,0.2); padding:10px; border-radius:4px; margin-bottom:5px; border:1px solid var(--ui-border);">
                    <h5 style="color:var(--cor-acao-primaria); margin-bottom:5px;">${value.label}</h5>
                    <div style="display:grid; grid-template-columns: 1fr 1fr auto; gap:10px; align-items:center; font-size:0.85rem;">
                        <div style="opacity:0.7"><s>${valorAtual || 'Vazio'}</s></div>
                        <div style="color:#fff; font-weight:bold;">${valorApi}</div>
                        <button class="btn btn-primario btn-sinc" data-campo="${key}" style="padding:4px 8px; font-size:0.7rem;">Aceitar</button>
                    </div>
                </div>`;
            }
        }
        this.sincContainerEl.innerHTML = html || '<p style="text-align:center; padding:1rem;">Todos os campos já estão sincronizados!</p>';
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
            case 'colecao': valorApi = infoApi.colecao; break;
            case 'volume': valorApi = infoApi.volume; break;
            case 'categorias': valorApi = Array.isArray(infoApi.categories) ? infoApi.categories.join(', ') : infoApi.categories; break;
        }
        if (typeof valorApi !== 'undefined') {
            const el = document.getElementById(campo);
            if(el) {
                el.value = valorApi;
                if (campo === 'urlCapa') {
                    this.atualizarPreviewCapa(valorApi);
                }
                App.mostrarNotificacao(`Campo atualizado!`);
                this.renderPainelSincronizacao();
            }
        }
    },

    modoEdicao: function(livroId) {
        const livro = this.state.todosOsLivros.find(l => l.id == livroId || l.firestoreId == livroId);
        if (livro) {
            this.limparInterface();
            document.querySelector('.painel-busca-container').classList.add('hidden'); 
            this.preencherFormulario(null, livro);
        }
    }
};