document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-import');
    const csvDataEl = document.getElementById('csv-data');
    const logsEl = document.getElementById('logs');

    startButton.addEventListener('click', async () => {
        const csvText = csvDataEl.value.trim();
        if (!csvText) {
            log('Por favor, cole os dados do CSV.', 'error');
            return;
        }

        startButton.disabled = true;
        startButton.textContent = 'Importando...';

        const livrosDoCsv = parseCSV(csvText);
        if (!livrosDoCsv || livrosDoCsv.length === 0) {
            log('Não foi possível processar o CSV. Verifique o formato.', 'error');
            startButton.disabled = false;
            startButton.textContent = 'Iniciar Importação';
            return;
        }

        log(`Encontrados ${livrosDoCsv.length} livros no CSV. Iniciando busca e cadastro...`, 'info');

        for (const livro of livrosDoCsv) {
            try {
                log(`Buscando: "${livro.nomeDoLivro}"...`, 'info');
                const apiData = await buscarInfoDoLivro(livro.nomeDoLivro, livro.autor);

                const livroFormatado = formatarLivro(livro, apiData);
                
                await salvarLivro(livroFormatado);
                log(`SUCESSO: "${livroFormatado.nomeDoLivro}" foi cadastrado.`, 'success');

                await new Promise(resolve => setTimeout(resolve, 500)); 

            } catch (error) {
                log(`ERRO ao processar "${livro.nomeDoLivro}": ${error.message}`, 'error');
            }
        }
        
        log('--- IMPORTAÇÃO CONCLUÍDA ---', 'info');
        startButton.disabled = false;
        startButton.textContent = 'Iniciar Importação';
    });

    function log(message, type = '') {
        const p = document.createElement('p');
        p.className = `log-item ${type}`;
        p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        logsEl.appendChild(p);
        logsEl.scrollTop = logsEl.scrollHeight;
    }

    function parseCSV(text) {
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const header = lines[0].split('\t').map(h => h.trim());
        const result = [];

        // ATUALIZADO: Mapeia TODAS as colunas relevantes do seu CSV
        const headerMap = {
            'Nome do livro': 'nomeDoLivro',
            'Autor': 'autor',
            'Ano lanç.': 'anoLancamento',
            'Editora': 'editora',
            'Coleção': 'colecao',
            'V.': 'volume',
            'Páginas': 'paginas',
            'Língua': 'lingua',
            'Situação': 'situacaoCsv', // Renomeado para não conflitar
            'Aquisição/Adição': 'dataAquisicao',
            'Nota': 'notaFinal',
            'Personagens': 'notaPersonagens',
            'Plot': 'notaPlot',
            'Desenv.': 'notaDesenv',
            'Pacing': 'notaPacing',
            'Closing': 'notaClosing',
            'Ínicio': 'dataInicio',
            'Fim': 'dataFim',
            'Já lido?': 'jaLido'
        };

        for (let i = 1; i < lines.length; i++) {
            const obj = {};
            const currentline = lines[i].split('\t');
            for (let j = 0; j < header.length; j++) {
                const key = headerMap[header[j]];
                if (key) {
                    obj[key] = currentline[j] ? currentline[j].trim() : '';
                }
            }
            result.push(obj);
        }
        return result;
    }

    async function buscarInfoDoLivro(titulo, autor) {
        const query = `intitle:${encodeURIComponent(titulo)}+inauthor:${encodeURIComponent(autor)}`;
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`);
        
        if (!response.ok) throw new Error('Falha na busca da API do Google Books.');
        
        const data = await response.json();
        return (data.items && data.items.length > 0) ? data.items[0].volumeInfo : null;
    }

    // Função para converter data de DD/MM/AAAA para AAAA-MM-DD
    function converterData(dataStr) {
        if (!dataStr || dataStr.length < 10) return null;
        const partes = dataStr.split('/');
        if (partes.length !== 3) return null;
        return `${partes[2]}-${partes[1]}-${partes[0]}`;
    }

    // Função para converter nota de '8,1' para 8.1
    function converterNota(notaStr) {
        if (!notaStr) return null;
        return parseFloat(notaStr.replace(',', '.'));
    }

    function formatarLivro(livroCsv, apiData) {
        const api = apiData || {};
        const livroFinal = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            nomeDoLivro: livroCsv.nomeDoLivro || api.title || 'Título não encontrado',
            autor: livroCsv.autor || (api.authors ? api.authors.join(', ') : 'Autor não encontrado'),
            dataAquisicao: converterData(livroCsv.dataAquisicao) || new Date().toISOString().split('T')[0],
            anoLancamento: livroCsv.anoLancamento || (api.publishedDate ? api.publishedDate.split('-')[0] : ''),
            editora: livroCsv.editora || api.publisher || '',
            colecao: livroCsv.colecao || '',
            volume: livroCsv.volume || '',
            paginas: livroCsv.paginas || api.pageCount || '',
            lingua: livroCsv.lingua || (api.language ? api.language.toUpperCase() : ''),
            urlCapa: api.imageLinks?.thumbnail || api.imageLinks?.smallThumbnail || '',
            descricao: api.description || '',
            categorias: api.categories ? api.categories.join(', ') : '',
            leituras: [],
            situacao: livroCsv.situacaoCsv || 'Quero Ler' // Usa a situação do CSV como padrão
        };

        // --- LÓGICA NOVA PARA ADICIONAR LEITURAS E NOTAS ---
        if (livroCsv.jaLido === 'SIM' && livroCsv.dataInicio && livroCsv.dataFim) {
            const leitura = {
                idLeitura: Date.now(),
                dataInicio: converterData(livroCsv.dataInicio),
                dataFim: converterData(livroCsv.dataFim),
                notaFinal: converterNota(livroCsv.notaFinal),
                notas: {
                    personagens: converterNota(livroCsv.notaPersonagens),
                    plot: converterNota(livroCsv.notaPlot),
                    desenvolvimento: converterNota(livroCsv.notaDesenv),
                    pacing: converterNota(livroCsv.notaPacing),
                    closing: converterNota(livroCsv.notaClosing)
                },
                anotacoes: ''
            };
            livroFinal.leituras.push(leitura);
            livroFinal.situacao = 'Lido'; // Sobrescreve a situação para 'Lido'
        }

        return livroFinal;
    }

    async function salvarLivro(livro) {
        const response = await fetch('/api/livros', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(livro)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro desconhecido ao salvar o livro.');
        }

        return await response.json();
    }
});