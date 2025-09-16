const Desafio = {
    state: {
        livros: [],
        desafio: { livrosDaMeta: [], livrosConcluidos: [] },
        ano: new Date().getFullYear().toString()
    },
    cacheDOM: function() {
        this.desafioAnoEl = document.getElementById('desafio-ano');
        this.formDesafioEl = document.getElementById('form-desafio');
        this.selectLivrosMetaEl = document.getElementById('select-livros-meta');
        this.btnSalvarMetaEl = document.getElementById('btn-salvar-meta');
        this.progressoTextoEl = document.getElementById('progresso-texto');
        this.progressoBarraEl = document.getElementById('progresso-barra');
        this.livrosConcluidosEl = document.getElementById('desafio-livros-concluidos');
    },
    bindEvents: function() {
        this.formDesafioEl.addEventListener('submit', async (e) => {
            e.preventDefault();
            const idsSelecionados = Array.from(this.selectLivrosMetaEl.selectedOptions).map(opt => parseInt(opt.value, 10));
            
            try {
                const response = await fetch(`/api/challenges/${this.state.ano}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ livrosDaMeta: idsSelecionados })
                });
                this.state.desafio = await response.json();
                this.render();
                alert('Desafio salvo com sucesso!');
            } catch (error) {
                console.error('Erro ao salvar desafio:', error);
                alert('Não foi possível salvar o desafio.');
            }
        });
    },
    init: async function(livros) {
        this.state.livros = livros;
        this.cacheDOM();
        this.bindEvents();
        try {
            const response = await fetch(`/api/challenges/${this.state.ano}`);
            this.state.desafio = await response.json();
        } catch (error) {
            console.log('Nenhum desafio para o ano, usando valores padrão.');
        }
        this.render();
    },
    render: function() {
        const meta = this.state.desafio.livrosDaMeta.length;
        const concluidos = this.state.desafio.livrosConcluidos.length;
        const progressoPercentual = meta > 0 ? (concluidos / meta) * 100 : 0;

        this.desafioAnoEl.textContent = this.state.ano;
        this.progressoTextoEl.textContent = `${concluidos} de ${meta} livros concluídos`;
        this.progressoBarraEl.value = progressoPercentual;
        
        this.popularSeletorDeLivros();
        this.renderLivrosDaMeta();
    },
    popularSeletorDeLivros: function() {
        this.selectLivrosMetaEl.innerHTML = this.state.livros.map(livro => {
            const selecionado = this.state.desafio.livrosDaMeta.includes(livro.id) ? 'selected' : '';
            return `<option value="${livro.id}" ${selecionado}>${livro.nomeDoLivro}</option>`;
        }).join('');
    },
renderLivrosDaMeta: function() {
    const idsMeta = new Set(this.state.desafio.livrosDaMeta);
    const idsConcluidos = new Set(this.state.desafio.livrosConcluidos);
    const livrosParaRenderizar = this.state.livros.filter(livro => idsMeta.has(livro.id));

    if (livrosParaRenderizar.length === 0) {
        this.livrosConcluidosEl.innerHTML = '<p>Nenhum livro selecionado para o desafio. Adicione alguns acima!</p>';
        return;
    }

    this.livrosConcluidosEl.innerHTML = livrosParaRenderizar.map(livro => {
         const capaSrc = livro.urlCapa || 'placeholder.jpg';
         // Adiciona a classe 'concluido' se o ID do livro estiver na lista de concluídos
         const concluidoClasse = idsConcluidos.has(livro.id) ? 'concluido' : '';
         // O display de nota agora é um checkmark de concluído
         const checkmarkDisplay = concluidoClasse ? `<div class="card-nota">✔️</div>` : '';

         return `
            <div class="card-livro ${concluidoClasse}" data-id="${livro.id}">
                ${checkmarkDisplay}
                <img src="${capaSrc}" alt="Capa de ${livro.nomeDoLivro}" onerror="this.src='placeholder.jpg';">
                <div class="card-info">
                    <h3>${livro.nomeDoLivro}</h3>
                </div>
            </div>`;
    }).join('');
},
    atualizar: function(livros) { // Adicione esta função para atualizações
        this.init(livros);
    }
};