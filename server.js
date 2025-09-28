const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const LIVROS_DB_PATH = path.join(__dirname, 'livros.json');
const CHALLENGES_DB_PATH = path.join(__dirname, 'challenges.json');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// --- FUNÇÕES AUXILIARES MAIS SEGURAS ---
const lerDados = async (caminho) => {
    try {
        const dados = await fs.readFile(caminho, 'utf-8');
        return JSON.parse(dados);
    } catch (error) {
        if (error.code === 'ENOENT') return []; // Se o arquivo não existe, retorna array vazio
        throw error; // Propaga outros erros
    }
};

const escreverDados = async (caminho, dados) => {
    const tempPath = `${caminho}.tmp`;
    try {
        await fs.writeFile(tempPath, JSON.stringify(dados, null, 2), 'utf-8');
        await fs.rename(tempPath, caminho); // Renomeia para o nome final (operação atômica)
    } catch (error) {
        // Se der erro, tenta remover o arquivo temporário
        await fs.unlink(tempPath).catch(() => {});
        throw error;
    }
};

// --- API Endpoints ---

app.get('/api/livros', async (req, res) => {
    try {
        const livros = await lerDados(LIVROS_DB_PATH);
        res.json(livros);
    } catch (error) {
        res.status(500).json({ message: "Erro ao ler a base de dados de livros." });
    }
});

app.post('/api/livros', async (req, res) => {
    try {
        const livros = await lerDados(LIVROS_DB_PATH);
        const novoLivro = { ...req.body };
        livros.push(novoLivro);
        await escreverDados(LIVROS_DB_PATH, livros);
        res.status(201).json(novoLivro);
    } catch (error) {
        res.status(500).json({ message: "Erro ao salvar o novo livro." });
    }
});

app.put('/api/livros/:id', async (req, res) => {
    try {
        const livros = await lerDados(LIVROS_DB_PATH);
        const livroId = parseInt(req.params.id, 10);
        const index = livros.findIndex(l => l.id === livroId);
        if (index === -1) {
            return res.status(404).json({ message: "Livro não encontrado." });
        }
        livros[index] = { ...livros[index], ...req.body };
        await escreverDados(LIVROS_DB_PATH, livros);
        res.json(livros[index]);
    } catch (error) {
        res.status(500).json({ message: "Erro ao atualizar o livro." });
    }
});

app.delete('/api/livros/:id', async (req, res) => {
    try {
        let livros = await lerDados(LIVROS_DB_PATH);
        const livroId = parseInt(req.params.id, 10);
        const novosLivros = livros.filter(l => l.id !== livroId);
        if (livros.length === novosLivros.length) {
            return res.status(404).json({ message: "Livro não encontrado para deletar." });
        }
        await escreverDados(LIVROS_DB_PATH, novosLivros);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: "Erro ao deletar o livro." });
    }
});

app.get('/api/challenges', async (req, res) => {
    try {
        const metas = await lerDados(CHALLENGES_DB_PATH);
        res.json(metas);
    } catch (error) {
        res.status(500).json({ message: "Erro ao ler a base de dados de metas." });
    }
});

app.post('/api/challenges', async (req, res) => {
    try {
        const novasMetas = req.body;
        if (!Array.isArray(novasMetas)) {
            return res.status(400).json({ message: "O corpo da requisição deve ser um array de metas." });
        }
        await escreverDados(CHALLENGES_DB_PATH, novasMetas);
        res.status(200).json(novasMetas);
    } catch (error) {
        console.error('Erro ao salvar metas:', error);
        res.status(500).json({ message: "Erro ao salvar as metas." });
    }
});

// Rota para servir o index.html em qualquer rota não-API
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});