// Módulo para controlar a view "Adicionar Livro"
const Adicionar = {
    state: {
        todosOsLivros: [],
        resultadosApi: [],
    },
    cacheDOM: function() {
        this.formLivroEl = document.getElementById('form-livro');
        this.inputBuscaApiEl = document.getElementById('input-busca-api');
        this.btnBuscaApiEl = document.getElementById('btn-busca-api');
        this.resultadosBuscaApiEl = document.getElementById('resultados-busca-api');
        this.formContainerEl = document.getElementById('form-container');
        this.formTituloEl = document.getElementById('form-livro-titulo');
    },
    bindEvents: function() {
        this.formLivroEl.addEventListener('submit', this.salvar.bind(this));
        this.btnBuscaApiEl.addEventListener('click', this.buscarNaApi.bind(this));
        this.resultadosBuscaApiEl.addEventListener('click', this.selecionarResultadoApi.bind(this));
    },
    buscarNaApi: async function() {
        const termo = this.inputBuscaApiEl.value.trim();
        if (!termo) return alert('Digite um título ou autor.');
        const idioma = document.getElementById('select-idioma-api').value;
        this.resultadosBuscaApiEl.innerHTML = '<p>Buscando...</p>';
        this.formContainerEl.classList.add('hidden');
        try {
            let apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(termo)}&maxResults=12`;
            if (idioma !== 'all') apiUrl += `&langRestrict=${idioma}`;
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Falha na busca da API');
            const data = await response.json();
            this.state.resultadosApi = data.items || [];
            this.renderResultados();
        } catch (error) {
            this.resultadosBuscaApiEl.innerHTML = '<p>Erro na busca. Tente novamente.</p>';
            console.error("Erro na busca da API:", error);
        }
    },
    renderResultados: function() {
        if (this.state.resultadosApi.length === 0) {
            this.resultadosBuscaApiEl.innerHTML = '<p>Nenhum livro encontrado.</p>';
            return;
        }
        this.resultadosBuscaApiEl.innerHTML = this.state.resultadosApi.map((livro, index) => {
            const info = livro.volumeInfo;
            const capa = info.imageLinks?.thumbnail || 'placeholder.jpg';
            const autor = info.authors ? info.authors.join(', ') : 'Autor desconhecido';
            return `<div class="card-resultado-api"><img src="${capa}" alt="Capa de ${info.title}"><h5>${info.title}</h5><p>${autor}</p><button class="btn btn-primario btn-selecionar-api" data-index="${index}">Selecionar</button></div>`;
        }).join('');
    },
    selecionarResultadoApi: function(e) {
        if (!e.target.classList.contains('btn-selecionar-api')) return;
        const index = e.target.dataset.index;
        const livroSelecionado = this.state.resultadosApi[index];
        if (livroSelecionado) {
            this.preencherFormulario(livroSelecionado.volumeInfo);
        }
    },
    preencherFormulario: function(info, livroExistente = null) {
        this.formLivroEl.reset();
        this.formTituloEl.textContent = livroExistente ? 'Editar Livro' : 'Complete os dados e salve';
        document.getElementById('livro-id').value = livroExistente ? livroExistente.id : '';
        document.getElementById('nomeDoLivro').value = livroExistente ? livroExistente.nomeDoLivro : (info?.title || '');
        document.getElementById('autor').value = livroExistente ? livroExistente.autor : (info?.authors ? info.authors.join(', ') : '');
        document.getElementById('dataAquisicao').value = livroExistente ? livroExistente.dataAquisicao : new Date().toISOString().split('T')[0];
        document.getElementById('anoLancamento').value = livroExistente ? livroExistente.anoLancamento : (info?.publishedDate ? info.publishedDate.split('-')[0] : '');
        document.getElementById('editora').value = livroExistente ? livroExistente.editora : (info?.publisher || '');
        document.getElementById('colecao').value = livroExistente ? livroExistente.colecao : (info?.seriesInfo?.bookSeries?.[0]?.seriesName || '');
        document.getElementById('volume').value = livroExistente ? livroExistente.volume : (info?.volumeNumber || '');
        document.getElementById('paginas').value = livroExistente ? livroExistente.paginas : (info?.pageCount || '');
        document.getElementById('lingua').value = livroExistente ? livroExistente.lingua : ((info?.language || '').toUpperCase());
        document.getElementById('urlCapa').value = livroExistente ? livroExistente.urlCapa : (info?.imageLinks?.thumbnail || info?.imageLinks?.smallThumbnail || '');
        document.getElementById('categorias').value = livroExistente ? livroExistente.categorias : (info?.categories ? info.categories.join(', ') : '');
        document.getElementById('descricao').value = livroExistente ? livroExistente.descricao : (info?.description || '');
        this.formContainerEl.classList.remove('hidden');
        this.formContainerEl.scrollIntoView({ behavior: 'smooth' });
    },
salvar: async function(e) {
    e.preventDefault();
    const id = document.getElementById('livro-id').value;
    
    // Coleta os dados do formulário
    const livroData = {
        nomeDoLivro: document.getElementById('nomeDoLivro').value,
        autor: document.getElementById('autor').value,
        dataAquisicao: document.getElementById('dataAquisicao').value,
        anoLancamento: parseInt(document.getElementById('anoLancamento').value, 10) || null,
        editora: document.getElementById('editora').value,
        colecao: document.getElementById('colecao').value,
        volume: parseInt(document.getElementById('volume').value, 10) || null,
        paginas: parseInt(document.getElementById('paginas').value, 10) || null,
        lingua: document.getElementById('lingua').value,
        urlCapa: document.getElementById('urlCapa').value,
        categorias: document.getElementById('categorias').value,
        descricao: document.getElementById('descricao').value
    };

    // Delega a responsabilidade de salvar para o módulo App
    // O App saberá se deve CRIAR (POST) ou ATUALIZAR (PUT)
    try {
        await App.salvarLivro(livroData, id); // Passa os dados e o ID (se existir)
        alert('Livro salvo com sucesso!');
        this.formLivroEl.reset();
        this.formContainerEl.classList.add('hidden');
        App.navegarPara('view-estante');
    } catch (error) {
        console.error('Falha ao salvar:', error);
        alert('Falha ao salvar o livro. Tente novamente.');
    }
},
    modoEdicao: function(livroId) {
        const livro = this.state.todosOsLivros.find(l => l.id == livroId);
        if (livro) {
            this.resultadosBuscaApiEl.innerHTML = ''; // Limpa resultados da busca
            this.preencherFormulario(null, livro);
        }
    },
    init: function(livros) {
        this.state.todosOsLivros = livros;
        this.cacheDOM();
        this.bindEvents();
    }
};