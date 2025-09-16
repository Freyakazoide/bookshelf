const Dashboard = {
    state: {
        livros: [],
        graficoMes: null, // Armazenará a instância do gráfico
        graficoGeneros: null, // Armazenará a instância do gráfico
    },

    cacheDOM: function() {
        this.kpiTotalLivrosEl = document.getElementById('kpi-total-livros');
        this.kpiTotalPaginasEl = document.getElementById('kpi-total-paginas');
        this.kpiMediaGeralEl = document.getElementById('kpi-media-geral');
        this.canvasLivrosMes = document.getElementById('grafico-livros-mes');
        this.canvasGeneros = document.getElementById('grafico-generos');
    },

    init: function(livros) {
        console.log("Dashboard iniciado com", livros.length, "livros.");
        this.state.livros = livros;
        this.cacheDOM();
        this.render();
    },

    processarDados: function() {
        const livrosLidos = this.state.livros.filter(livro => 
            livro.leituras && livro.leituras.some(l => l.dataFim)
        );

        // --- 1. CÁLCULO DOS KPIs ---
        const totalLivrosLidos = livrosLidos.length;
        const totalPaginasLidas = livrosLidos.reduce((soma, livro) => soma + (livro.paginas || 0), 0);
        
        const notasFinais = livrosLidos
            .map(livro => getNotaPrincipal(livro))
            .filter(nota => nota > 0);
        const mediaGeral = notasFinais.length > 0 
            ? (notasFinais.reduce((soma, nota) => soma + nota, 0) / notasFinais.length).toFixed(1) 
            : "N/A";

        // --- 2. DADOS PARA O GRÁFICO DE LIVROS POR MÊS (Últimos 12 meses) ---
        const hoje = new Date();
        const labelsMeses = [];
        const dadosMeses = Array(12).fill(0);

        for (let i = 11; i >= 0; i--) {
            const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
            const mes = data.toLocaleString('pt-BR', { month: 'short' });
            const ano = data.getFullYear().toString().slice(-2);
            labelsMeses.push(`${mes.charAt(0).toUpperCase() + mes.slice(1)}/${ano}`);
        }

        livrosLidos.forEach(livro => {
            livro.leituras.forEach(leitura => {
                if (leitura.dataFim) {
                    const dataFim = new Date(leitura.dataFim);
                    const diffMeses = (hoje.getFullYear() - dataFim.getFullYear()) * 12 + (hoje.getMonth() - dataFim.getMonth());
                    if (diffMeses >= 0 && diffMeses < 12) {
                        dadosMeses[11 - diffMeses]++;
                    }
                }
            });
        });
        
        // --- 3. DADOS PARA O GRÁFICO DE GÊNEROS ---
        const contagemGeneros = {};
        livrosLidos.forEach(livro => {
            if (livro.categorias) {
                const generos = livro.categorias.split(',').map(g => g.trim());
                generos.forEach(genero => {
                    if (genero) {
                        contagemGeneros[genero] = (contagemGeneros[genero] || 0) + 1;
                    }
                });
            }
        });

        const labelsGeneros = Object.keys(contagemGeneros);
        const dadosGeneros = Object.values(contagemGeneros);

        return {
            kpis: { totalLivrosLidos, totalPaginasLidas, mediaGeral },
            graficoMes: { labels: labelsMeses, data: dadosMeses },
            graficoGeneros: { labels: labelsGeneros, data: dadosGeneros }
        };
    },

    render: function() {
        const dados = this.processarDados();

        // Atualiza os KPIs
        this.kpiTotalLivrosEl.textContent = dados.kpis.totalLivrosLidos;
        this.kpiTotalPaginasEl.textContent = dados.kpis.totalPaginasLidas.toLocaleString('pt-BR');
        this.kpiMediaGeralEl.textContent = `${dados.kpis.mediaGeral} ⭐`;
        
        // Renderiza os gráficos
        this.renderGraficoMes(dados.graficoMes);
        this.renderGraficoGeneros(dados.graficoGeneros);
    },

    renderGraficoMes: function(dados) {
        if (this.state.graficoMes) {
            this.state.graficoMes.destroy(); // Destrói o gráfico anterior para evitar bugs
        }
        this.state.graficoMes = new Chart(this.canvasLivrosMes, {
            type: 'bar',
            data: {
                labels: dados.labels,
                datasets: [{
                    label: 'Livros Lidos',
                    data: dados.data,
                    backgroundColor: 'rgba(197, 176, 205, 0.7)',
                    borderColor: 'rgba(197, 176, 205, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                responsive: true,
                maintainAspectRatio: false
            }
        });
    },
    
    renderGraficoGeneros: function(dados) {
        if (this.state.graficoGeneros) {
            this.state.graficoGeneros.destroy();
        }
        this.state.graficoGeneros = new Chart(this.canvasGeneros, {
            type: 'doughnut',
            data: {
                labels: dados.labels,
                datasets: [{
                    label: 'Livros',
                    data: dados.data,
                    backgroundColor: [
                        '#C5B0CD', '#415E72', '#F3E2D4', '#17313E', 
                        '#8d7b97', '#6b899d', '#d4c2b4', '#3c5a6a'
                    ],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
};