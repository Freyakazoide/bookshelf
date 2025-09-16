const express = require('express');
const fs = require('fs/promises');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;
const LIVROS_JSON_PATH = path.join(__dirname, 'livros.json');
const CHALLENGES_JSON_PATH = path.join(__dirname, 'challenges.json');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname)); 

// ROTA DE API PARA BUSCAR OS LIVROS
app.get('/api/livros', async (req, res) => {
    try {
        const data = await fs.readFile(LIVROS_JSON_PATH, 'utf-8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Erro ao ler o arquivo livros.json:', error);
        res.status(500).json([]); 
    }
});

// Rota para CRIAR um novo livro (CREATE)
app.post('/api/livros', async (req, res) => {
    try {
        const newBook = req.body;
        
        // Lê os dados existentes
        const data = await fs.readFile(LIVROS_JSON_PATH, 'utf-8');
        const livros = JSON.parse(data);

        // Adiciona o novo livro à lista
        livros.push(newBook);
        
        // Salva a lista atualizada
        await fs.writeFile(LIVROS_JSON_PATH, JSON.stringify(livros, null, 2));
        
        // Retorna o livro criado com status 201 (Created)
        res.status(201).json(newBook);
    } catch (error) {
        console.error('Erro ao criar o livro:', error);
        res.status(500).json({ message: 'Erro ao criar o livro.' });
    }
});

// Rota para ATUALIZAR um livro existente (UPDATE)
app.put('/api/livros/:id', async (req, res) => {
    try {
        const bookId = parseInt(req.params.id, 10);
        const updatedBookData = req.body;
        
        const data = await fs.readFile(LIVROS_JSON_PATH, 'utf-8');
        const livros = JSON.parse(data);

        const bookIndex = livros.findIndex(l => l.id === bookId);

        if (bookIndex === -1) {
            return res.status(404).json({ message: 'Livro não encontrado.' });
        }

        // Atualiza o livro mantendo o ID original
const livroOriginal = livros[bookIndex];
        livros[bookIndex] = { ...livroOriginal, ...updatedBookData };
        const livroAtualizado = livros[bookIndex];

        await fs.writeFile(LIVROS_JSON_PATH, JSON.stringify(livros, null, 2));
        
        // --- INÍCIO DA AUTOMAÇÃO DO DESAFIO ---
        // Se o livro foi marcado como "Lido" nesta atualização...
if (livroAtualizado.situacao === 'Lido' && livroOriginal.situacao !== 'Lido') {
    const anoAtual = new Date().getFullYear().toString();
    try {
        const challengesData = await fs.readFile(CHALLENGES_JSON_PATH, 'utf-8');
        let challenges = JSON.parse(challengesData);
        const desafioAtual = challenges[anoAtual];

        // Verifica se o desafio existe, se o livro está na meta E se ele já não foi concluído
        if (desafioAtual && desafioAtual.livrosDaMeta.includes(livroAtualizado.id) && !desafioAtual.livrosConcluidos.includes(livroAtualizado.id)) {
            desafioAtual.livrosConcluidos.push(livroAtualizado.id);
            await fs.writeFile(CHALLENGES_JSON_PATH, JSON.stringify(challenges, null, 2));
            console.log(`Livro ${livroAtualizado.id} adicionado à conclusão do desafio de ${anoAtual}.`);
        }
    } catch (e) {
        console.log("Arquivo de desafio não encontrado para automação, pulando etapa.");
    }
}
        // --- FIM DA AUTOMAÇÃO ---

        res.status(200).json(livroAtualizado);
    } catch (error) {
        console.error('Erro ao atualizar o livro:', error);
        res.status(500).json({ message: 'Erro ao atualizar o livro.' });
    }
});

// Rota para DELETAR um livro (DELETE)
app.delete('/api/livros/:id', async (req, res) => {
    try {
        const bookId = parseInt(req.params.id, 10);
        
        const data = await fs.readFile(LIVROS_JSON_PATH, 'utf-8');
        let livros = JSON.parse(data);

        const initialLength = livros.length;
        livros = livros.filter(l => l.id !== bookId);

        if (livros.length === initialLength) {
            return res.status(404).json({ message: 'Livro não encontrado para deletar.' });
        }

        await fs.writeFile(LIVROS_JSON_PATH, JSON.stringify(livros, null, 2));
        
        // Retorna status 204 (No Content) que indica sucesso sem corpo de resposta
        res.status(204).send();
    } catch (error) {
        console.error('Erro ao deletar o livro:', error);
        res.status(500).json({ message: 'Erro ao deletar o livro.' });
    }
});

// Rota para BUSCAR o desafio de um ano específico
app.get('/api/challenges/:year', async (req, res) => {
    try {
        const year = req.params.year;
        const data = await fs.readFile(CHALLENGES_JSON_PATH, 'utf-8');
        const challenges = JSON.parse(data);
        if (challenges[year]) {
            res.json(challenges[year]);
        } else {
            res.status(404).json({ message: 'Nenhum desafio encontrado para este ano.' });
        }
    } catch (error) {
        // Se o arquivo não existir, retorna um desafio padrão zerado
        res.status(200).json({ meta: 0, livrosConcluidos: [] });
    }
});

// Rota para ATUALIZAR/CRIAR o desafio de um ano (com lista de livros)
app.put('/api/challenges/:year', async (req, res) => {
    try {
        const year = req.params.year;
        const { livrosDaMeta } = req.body; // Recebe a lista de IDs
        
        let challenges = {};
        try {
            const data = await fs.readFile(CHALLENGES_JSON_PATH, 'utf-8');
            challenges = JSON.parse(data);
        } catch (error) { /* Arquivo não existe, será criado */ }

        // Mantém os livros concluídos e atualiza a meta
        const livrosConcluidosAtuais = challenges[year] ? challenges[year].livrosConcluidos : [];
        challenges[year] = {
            livrosDaMeta: livrosDaMeta,
            livrosConcluidos: livrosConcluidosAtuais
        };

        await fs.writeFile(CHALLENGES_JSON_PATH, JSON.stringify(challenges, null, 2));
        res.status(200).json(challenges[year]);
    } catch (error) {
        console.error('Erro ao salvar o desafio:', error);
        res.status(500).json({ message: 'Erro ao salvar o desafio.' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log('Acesse a estante em: http://localhost:3000');
});