document.addEventListener('DOMContentLoaded', () => {
    const viewFinanceiro = document.getElementById('view-financeiro');
    if (!viewFinanceiro) return;

    const db = firebase.firestore();
    const auth = firebase.auth();
    let userId = null;

    const seletorDeMes = document.getElementById('select-mes-financeiro');
    const dashboardStep = document.getElementById('financeiro-dashboard-step');
    const categorizacaoStep = document.getElementById('financeiro-categorizacao-step');
    const faturaStep = document.getElementById('financeiro-fatura-step');
    const kpiReceitasEl = document.getElementById('kpi-receitas').querySelector('.valor-kpi');
    const kpiDespesasEl = document.getElementById('kpi-despesas').querySelector('.valor-kpi');
    const kpiSaldoEl = document.getElementById('kpi-saldo').querySelector('.valor-kpi');
    const listaContasFixasContainer = document.getElementById('lista-contas-fixas');
    const btnGerenciarContasFixas = document.getElementById('btn-gerenciar-contas-fixas');
    const modalGerenciarContas = document.getElementById('modal-gerenciar-contas');
    const btnFecharModalGerenciar = document.getElementById('btn-fechar-modal-gerenciar');
    const listaContasGerenciarContainer = document.getElementById('lista-contas-fixas-gerenciar');
    const formNovaContaFixa = document.getElementById('form-nova-conta-fixa');
    const inputContaNome = document.getElementById('input-conta-nome');
    const inputContaValor = document.getElementById('input-conta-valor');
    const modalImportacao = document.getElementById('modal-importacao');
    const btnAbrirModalImportar = document.getElementById('btn-abrir-modal-importar');
    const btnFecharModalImportar = document.getElementById('btn-fechar-modal-importar');
    const btnProcessarImportacao = document.getElementById('btn-processar-importacao');
    const inputDadosColados = document.getElementById('input-dados-colados');
    const modalLancamentoManual = document.getElementById('modal-lancamento-manual');
    const btnAbrirLancamentoManual = document.getElementById('btn-abrir-lancamento-manual');
    const btnFecharLancamentoManual = document.getElementById('btn-fechar-lancamento-manual');
    const formLancamentoManual = document.getElementById('form-lancamento-manual');
    const tbodyCategorizacao = document.getElementById('tbody-categorizacao');
    const btnSalvarExtratoFirebase = document.getElementById('btn-salvar-extrato-firebase');
    const btnCancelarImportacao = document.getElementById('btn-cancelar-importacao');
    const tbodyFatura = document.getElementById('tbody-fatura');
    const selectAssociarFatura = document.getElementById('select-associar-fatura');
    const btnSalvarFaturaFirebase = document.getElementById('btn-salvar-fatura-firebase');
    const btnCancelarFatura = document.getElementById('btn-cancelar-fatura');
    const canvasGastosCategoria = document.getElementById('canvas-gastos-categoria');
    const canvasTendenciaMensal = document.getElementById('canvas-tendencia-mensal');
    const listaMaioresDespesas = document.getElementById('lista-maiores-despesas');

    let contasFixas = [], transacoesDoMes = [], transacoesImportadas = [], faturaImportada = [];
    let categoriasDB = ['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Educação', 'Trabalho', 'Investimentos', 'Salário', 'Outras Receitas', 'Impostos', 'Outras Despesas'];
    let contasDB = ['Pix', 'Cartão de Crédito', 'Débito', 'Dinheiro', 'Vale-Alimentação'];
    let graficoCategorias = null, graficoTendencia = null;

    const formatarMoeda = (valor) => (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    const gerarCorConsistente = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        const color = "00000".substring(0, 6 - c.length) + c;
        return `#${color}`;
    };

    function renderizarGraficoCategorias() {
        if (!canvasGastosCategoria) return;
        const despesas = transacoesDoMes.filter(t => t.tipo === 'despesa');
        const gastosPorCategoria = despesas.reduce((acc, t) => {
            const categoria = t.categoria || 'Não categorizado';
            acc[categoria] = (acc[categoria] || 0) + Math.abs(t.valor);
            return acc;
        }, {});
        const labels = Object.keys(gastosPorCategoria);
        const data = Object.values(gastosPorCategoria);
        const backgroundColors = labels.map(label => gerarCorConsistente(label));
        if (graficoCategorias) graficoCategorias.destroy();
        if (labels.length > 0) {
            graficoCategorias = new Chart(canvasGastosCategoria, {
                type: 'doughnut', data: { labels, datasets: [{ label: 'Gastos', data, backgroundColor: backgroundColors, borderColor: '#1E293B', borderWidth: 2 }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#F1F5F9' } } } }
            });
        } else {
            const ctx = canvasGastosCategoria.getContext('2d');
            ctx.clearRect(0, 0, canvasGastosCategoria.width, canvasGastosCategoria.height);
            ctx.fillStyle = '#94A3B8'; ctx.textAlign = 'center';
            ctx.fillText('Nenhum dado de despesa para exibir.', canvasGastosCategoria.width / 2, canvasGastosCategoria.height / 2);
        }
    }

    async function renderizarGraficoTendencia() {
        if (!canvasTendenciaMensal || !userId) return;
        const labels = [];
        const receitasData = [];
        const despesasData = [];
        const hoje = new Date();

        for (let i = 5; i >= 0; i--) {
            const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
            const anoMes = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
            const nomeMes = data.toLocaleString('pt-BR', { month: 'short' });
            labels.push(nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1));
            
            const transacoesSnapshot = await db.collection('users').doc(userId).collection('financeiro').doc(anoMes).collection('transacoes').get();
            const transacoes = transacoesSnapshot.docs.map(doc => doc.data());
            
            const receitas = transacoes.filter(t => t.tipo === 'receita').reduce((acc, t) => acc + t.valor, 0);
            const despesas = transacoes.filter(t => t.tipo === 'despesa').reduce((acc, t) => acc + Math.abs(t.valor), 0);
            receitasData.push(receitas);
            despesasData.push(despesas);
        }

        if (graficoTendencia) graficoTendencia.destroy();
        graficoTendencia = new Chart(canvasTendenciaMensal, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    { label: 'Receitas', data: receitasData, backgroundColor: 'rgba(45, 212, 191, 0.7)' },
                    { label: 'Despesas', data: despesasData, backgroundColor: 'rgba(244, 63, 94, 0.7)' }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#F1F5F9' } } }, scales: { y: { ticks: { color: '#94A3B8' }, grid: { color: '#475569' } }, x: { ticks: { color: '#94A3B8' }, grid: { display: false } } } }
        });
    }

    function renderizarTopDespesas() {
        if (!listaMaioresDespesas) return;
        listaMaioresDespesas.innerHTML = '';
        const top5 = transacoesDoMes
            .filter(t => t.tipo === 'despesa')
            .sort((a, b) => Math.abs(b.valor) - Math.abs(a.valor))
            .slice(0, 5);

        if (top5.length === 0) {
            listaMaioresDespesas.innerHTML = '<p class="texto-secundario" style="padding: 1rem;">Nenhuma despesa registrada este mês.</p>';
            return;
        }

        top5.forEach(t => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="despesa-info">
                    <span class="despesa-descricao">${t.descricao}</span>
                    <span class="despesa-categoria">${t.categoria}</span>
                </div>
                <span class="despesa-valor">${formatarMoeda(t.valor)}</span>
            `;
            listaMaioresDespesas.appendChild(li);
        });
    }
    
    function atualizarDashboard() {
        const receitas = transacoesDoMes.filter(t => t.tipo === 'receita').reduce((acc, t) => acc + t.valor, 0);
        const despesas = transacoesDoMes.filter(t => t.tipo === 'despesa').reduce((acc, t) => acc + t.valor, 0);
        const saldo = receitas + despesas;
        kpiReceitasEl.textContent = formatarMoeda(receitas);
        kpiDespesasEl.textContent = formatarMoeda(despesas);
        kpiSaldoEl.textContent = formatarMoeda(saldo);
        renderizarGraficoCategorias();
        renderizarTopDespesas();
    }

    function popularSeletorDeMes() {
        if (!seletorDeMes) return;
        seletorDeMes.innerHTML = '';
        const hoje = new Date();
        for (let i = 0; i < 12; i++) {
            const dataOpcao = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
            const nomeMes = dataOpcao.toLocaleString('pt-BR', { month: 'long' });
            const ano = dataOpcao.getFullYear();
            const option = document.createElement('option');
            option.value = `${ano}-${String(dataOpcao.getMonth() + 1).padStart(2, '0')}`;
            option.textContent = `${nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)} de ${ano}`;
            seletorDeMes.appendChild(option);
        }
    }

    function renderizarContasFixas(statusDoMes = {}) {
        if (!listaContasFixasContainer) return;
        listaContasFixasContainer.innerHTML = '';
        contasFixas.forEach(conta => {
            const status = statusDoMes[conta.id] || 'pendente';
            const item = document.createElement('div');
            item.className = `item-checklist ${status}`;
            item.dataset.id = conta.id;
            const statusHtml = status === 'pendente' 
                ? `<button class="btn-marcar-pago">Marcar</button>` 
                : `<button class="btn-desmarcar-pago btn-secundario">Desfazer</button>`;
            item.innerHTML = `<div class="info"><p class="nome">${conta.nome}</p><p class="valor">${formatarMoeda(conta.valor)}</p></div>${statusHtml}`;
            listaContasFixasContainer.appendChild(item);
        });
    }

    function renderizarGerenciadorContasFixas() {
        if (!listaContasGerenciarContainer) return;
        listaContasGerenciarContainer.innerHTML = '';
        contasFixas.forEach(conta => {
            const item = document.createElement('div');
            item.className = 'item-checklist';
            item.dataset.id = conta.id;
            item.innerHTML = `<div class="info"><p class="nome">${conta.nome}</p><p class="valor">${formatarMoeda(conta.valor)}</p></div><button data-id="${conta.id}" class="btn-excluir-conta btn-perigo">Excluir</button>`;
            listaContasGerenciarContainer.appendChild(item);
        });
    }

    async function carregarDadosDoMes(anoMes) {
        if (!userId || !anoMes) return;
        
        const statusDoc = await db.collection('users').doc(userId).collection('financeiro').doc(anoMes).get();
        const statusData = statusDoc.exists ? statusDoc.data().statusContas || {} : {};
        renderizarContasFixas(statusData);

        const transacoesSnapshot = await db.collection('users').doc(userId).collection('financeiro').doc(anoMes).collection('transacoes').orderBy('data').get();
        transacoesDoMes = transacoesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        atualizarDashboard();
    }

    async function adicionarNovaContaFixa(e) {
        e.preventDefault();
        const nome = inputContaNome.value.trim();
        const valorStr = inputContaValor.value.trim().replace('.', '').replace(',', '.');
        const valor = parseFloat(valorStr);
        if (nome && !isNaN(valor) && userId) {
            const novaConta = { nome, valor };
            try {
                const docRef = await db.collection('users').doc(userId).collection('contasFixas').add(novaConta);
                contasFixas.push({ id: docRef.id, ...novaConta });
                renderizarGerenciadorContasFixas();
                renderizarContasFixas({});
                formNovaContaFixa.reset();
            } catch (error) {
                console.error("Erro ao adicionar conta:", error);
                alert("Não foi possível adicionar a nova conta.");
            }
        }
    }

    async function excluirContaFixa(id) {
        if (!userId) return;
        try {
            await db.collection('users').doc(userId).collection('contasFixas').doc(id).delete();
            contasFixas = contasFixas.filter(conta => conta.id !== id);
            renderizarGerenciadorContasFixas();
            renderizarContasFixas({});
        } catch (error) {
            console.error("Erro ao excluir conta:", error);
            alert("Não foi possível excluir a conta.");
        }
    }

    async function toggleStatusContaFixa(id, novoStatus) {
        const anoMes = seletorDeMes.value;
        if (!userId || !anoMes) return;
        
        const docRef = db.collection('users').doc(userId).collection('financeiro').doc(anoMes);
        try {
            await docRef.set({
                statusContas: {
                    [id]: novoStatus
                }
            }, { merge: true });
            carregarDadosDoMes(anoMes);
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
            alert("Não foi possível atualizar o status da conta.");
        }
    }

    function parseExtrato(texto) {
        return texto.split('\n').filter(linha => linha.trim() !== '').map(linha => {
            const colunas = linha.split('\t');
            if (colunas.length < 2) return null;
            const dataStr = colunas[0].trim();
            let valorStr = colunas[1].trim();
            const descricao = colunas.slice(2).join(' ').trim();
            if (valorStr.includes(',')) {
                valorStr = valorStr.replace(/\./g, '').replace(',', '.');
            }
            const valor = parseFloat(valorStr);
            if (!isNaN(valor) && dataStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                return { data: dataStr, valor, tipo: valor > 0 ? 'receita' : 'despesa', descricao, categoria: 'Não categorizado', conta: '' };
            }
            return null;
        }).filter(Boolean);
    }

    function parseFatura(texto) {
        return texto.split('\n').filter(linha => linha.trim() !== '').map(linha => {
            const colunas = linha.split('\t');
            if (colunas.length < 3) return null;
            const dataStr = colunas[0].trim();
            const descricao = colunas[1].trim();
            const valorStr = colunas[2].trim().replace(',', '.');
            const valor = parseFloat(valorStr);

            if (!isNaN(valor) && dataStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                 const [ano, mes, dia] = dataStr.split('-');
                 const dataFormatada = `${dia}/${mes}/${ano}`;
                return { data: dataFormatada, descricao, valor };
            }
            return null;
        }).filter(Boolean);
    }

    function renderizarTabelaCategorizacao() {
        tbodyCategorizacao.innerHTML = '';
        transacoesImportadas.forEach((transacao, index) => {
            if (!transacao) return;
            const tr = document.createElement('tr');
            tr.dataset.index = index;
            const valorClasse = transacao.tipo === 'despesa' ? 'despesa' : 'receita';
            const categoriasOptions = categoriasDB.map(cat => `<option value="${cat}">${cat}</option>`).join('');
            const contasOptions = contasDB.map(c => `<option value="${c}">${c}</option>`).join('');
            tr.innerHTML = `
                <td>${transacao.data}</td>
                <td><input type="text" class="input-descricao-linha" value="${transacao.descricao}"></td>
                <td><span class="${valorClasse}">${formatarMoeda(transacao.valor)}</span></td>
                <td><select class="select-conta-linha">${contasOptions}</select></td>
                <td><select class="select-categoria-linha">${categoriasOptions}</select></td>
                <td><button class="btn-excluir-item-extrato btn btn-perigo" style="padding: 5px 10px;">X</button></td>
            `;
            tbodyCategorizacao.appendChild(tr);
        });
    }

    function renderizarTabelaFatura() {
        tbodyFatura.innerHTML = '';
        faturaImportada.forEach((item, index) => {
            if (!item) return;
            const tr = document.createElement('tr');
            tr.dataset.index = index;
            const valorClasse = item.valor < 0 ? 'receita' : 'despesa';
            tr.innerHTML = `
                <td>${item.data}</td>
                <td><input type="text" class="input-descricao-linha" value="${item.descricao}"></td>
                <td><span class="${valorClasse}">${formatarMoeda(item.valor)}</span></td>
                <td><button class="btn-excluir-item-fatura btn btn-perigo" style="padding: 5px 10px;">X</button></td>
            `;
            tbodyFatura.appendChild(tr);
        });
        selectAssociarFatura.innerHTML = contasFixas
            .filter(c => c.nome.toLowerCase().includes('cartão'))
            .map(c => `<option value="${c.id}">${c.nome}</option>`)
            .join('');
    }
    
    function processarImportacao() {
        const tipoImportacao = document.querySelector('input[name="tipo-importacao"]:checked').value;
        const texto = inputDadosColados.value.trim();
        if (!texto) {
            alert('Por favor, cole os dados.');
            return;
        }

        modalImportacao.close();
        inputDadosColados.value = '';
        dashboardStep.classList.add('hidden');

        if (tipoImportacao === 'extrato') {
            transacoesImportadas = parseExtrato(texto);
             if (transacoesImportadas.length === 0) {
                alert('Nenhuma transação válida encontrada no extrato.');
                dashboardStep.classList.remove('hidden');
                return;
            }
            categorizacaoStep.classList.remove('hidden');
            renderizarTabelaCategorizacao();
        } else {
            faturaImportada = parseFatura(texto);
             if (faturaImportada.length === 0) {
                alert('Nenhum item válido encontrado na fatura.');
                dashboardStep.classList.remove('hidden');
                return;
            }
            faturaStep.classList.remove('hidden');
            renderizarTabelaFatura();
        }
    }

    async function salvarTransacoesFirebase() {
        const anoMes = seletorDeMes.value;
        if (!userId || !anoMes) return;

        const transacoesFinais = [];
        document.querySelectorAll('#tbody-categorizacao tr').forEach(linha => {
             const index = parseInt(linha.dataset.index);
             const transacaoOriginal = transacoesImportadas[index];
             if(transacaoOriginal){
                transacoesFinais.push({
                    ...transacaoOriginal,
                    descricao: linha.querySelector('.input-descricao-linha').value,
                    conta: linha.querySelector('.select-conta-linha').value,
                    categoria: linha.querySelector('.select-categoria-linha').value
                });
             }
        });
        
        btnSalvarExtratoFirebase.disabled = true;
        btnSalvarExtratoFirebase.textContent = 'Salvando...';

        try {
            const batch = db.batch();
            const colecaoTransacoes = db.collection('users').doc(userId).collection('financeiro').doc(anoMes).collection('transacoes');
            transacoesFinais.forEach(transacao => {
                const docRef = colecaoTransacoes.doc();
                batch.set(docRef, transacao);
            });
            await batch.commit();
            alert(`${transacoesFinais.length} transações salvas com sucesso!`);
            categorizacaoStep.classList.add('hidden');
            dashboardStep.classList.remove('hidden');
            carregarDadosDoMes(anoMes);
        } catch (error) {
            console.error("Erro ao salvar transações:", error);
            alert("Ocorreu um erro ao salvar.");
        } finally {
            btnSalvarExtratoFirebase.disabled = false;
            btnSalvarExtratoFirebase.textContent = 'Salvar Transações';
        }
    }

    async function salvarFaturaFirebase() {
        const anoMes = seletorDeMes.value;
        const contaFixaId = selectAssociarFatura.value;
        if (!userId || !anoMes || !contaFixaId) return;

        const faturaFinal = [];
        document.querySelectorAll('#tbody-fatura tr').forEach(linha => {
            const index = parseInt(linha.dataset.index);
            const itemOriginal = faturaImportada[index];
            if (itemOriginal) {
                faturaFinal.push({
                    ...itemOriginal,
                    descricao: linha.querySelector('.input-descricao-linha').value
                });
            }
        });
        
        btnSalvarFaturaFirebase.disabled = true;
        btnSalvarFaturaFirebase.textContent = 'Salvando...';

        try {
            const docRef = db.collection('users').doc(userId).collection('financeiro').doc(anoMes);
            await docRef.set({
                faturas: {
                    [contaFixaId]: faturaFinal
                }
            }, { merge: true });
            alert('Detalhes da fatura salvos com sucesso!');
            faturaStep.classList.add('hidden');
            dashboardStep.classList.remove('hidden');
        } catch(error) {
            console.error("Erro ao salvar fatura:", error);
            alert("Ocorreu um erro ao salvar os detalhes da fatura.");
        } finally {
            btnSalvarFaturaFirebase.disabled = false;
            btnSalvarFaturaFirebase.textContent = 'Salvar Detalhes da Fatura';
        }
    }
    
    async function salvarLancamentoManual(e) {
        e.preventDefault();
        const anoMes = seletorDeMes.value;
        if (!userId || !anoMes) return;

        const descricao = document.getElementById('manual-descricao').value.trim();
        const valorStr = document.getElementById('manual-valor').value.trim().replace(',', '.');
        const valor = parseFloat(valorStr);
        const dataInput = document.getElementById('manual-data').value;
        const conta = document.getElementById('manual-conta').value;
        const categoria = document.getElementById('manual-categoria').value;

        if (!descricao || isNaN(valor) || !dataInput || !conta || !categoria) {
            alert("Por favor, preencha todos os campos.");
            return;
        }

        const [ano, mes, dia] = dataInput.split('-');
        const dataFormatada = `${dia}/${mes}/${ano}`;

        const novaTransacao = {
            descricao, valor, data: dataFormatada, conta, categoria,
            tipo: valor >= 0 ? 'receita' : 'despesa'
        };

        try {
            const colecaoTransacoes = db.collection('users').doc(userId).collection('financeiro').doc(anoMes).collection('transacoes');
            await colecaoTransacoes.add(novaTransacao);
            alert("Lançamento salvo com sucesso!");
            formLancamentoManual.reset();
            modalLancamentoManual.close();
            carregarDadosDoMes(anoMes);
        } catch (error) {
            console.error("Erro ao salvar lançamento manual:", error);
            alert("Erro ao salvar lançamento.");
        }
    }

    function abrirModalLancamento() {
        if (!modalLancamentoManual) return;
        document.getElementById('manual-data').valueAsDate = new Date();
        const selectConta = document.getElementById('manual-conta');
        const selectCategoria = document.getElementById('manual-categoria');
        selectConta.innerHTML = contasDB.map(c => `<option value="${c}">${c}</option>`).join('');
        selectCategoria.innerHTML = categoriasDB.map(c => `<option value="${c}">${c}</option>`).join('');
        modalLancamentoManual.showModal();
    }

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            userId = user.uid;
            const contasSnapshot = await db.collection('users').doc(userId).collection('contasFixas').get();
            contasFixas = contasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            popularSeletorDeMes();
            const mesAtual = seletorDeMes.value;
            await carregarDadosDoMes(mesAtual);
            renderizarGraficoTendencia();
        } else {
            userId = null;
        }
    });

    if (seletorDeMes) seletorDeMes.addEventListener('change', async (e) => {
        await carregarDadosDoMes(e.target.value);
        renderizarGraficoTendencia(); // Re-renderiza o gráfico de tendência ao mudar de mês
    });

    if (listaContasFixasContainer) listaContasFixasContainer.addEventListener('click', (e) => {
        const target = e.target;
        const id = target.closest('.item-checklist')?.dataset.id;
        if (!id) return;
        if (target.classList.contains('btn-marcar-pago')) toggleStatusContaFixa(id, 'pago');
        if (target.classList.contains('btn-desmarcar-pago')) toggleStatusContaFixa(id, 'pendente');
    });

    if (btnGerenciarContasFixas) btnGerenciarContasFixas.addEventListener('click', () => {
        renderizarGerenciadorContasFixas();
        modalGerenciarContas.showModal();
    });

    if (btnFecharModalGerenciar) btnFecharModalGerenciar.addEventListener('click', () => modalGerenciarContas.close());

    if (formNovaContaFixa) formNovaContaFixa.addEventListener('submit', adicionarNovaContaFixa);

    if (listaContasGerenciarContainer) listaContasGerenciarContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-excluir-conta')) {
            const id = e.target.dataset.id;
            if (confirm('Tem certeza?')) excluirContaFixa(id);
        }
    });
    
    if (btnAbrirModalImportar) btnAbrirModalImportar.addEventListener('click', () => modalImportacao.showModal());

    if (btnFecharModalImportar) btnFecharModalImportar.addEventListener('click', () => modalImportacao.close());

    if (btnProcessarImportacao) btnProcessarImportacao.addEventListener('click', processarImportacao);
    
    if (btnSalvarExtratoFirebase) btnSalvarExtratoFirebase.addEventListener('click', salvarTransacoesFirebase);

    if (btnCancelarImportacao) btnCancelarImportacao.addEventListener('click', () => {
        if (confirm('Cancelar?')) {
            categorizacaoStep.classList.add('hidden');
            dashboardStep.classList.remove('hidden');
        }
    });

    if (btnSalvarFaturaFirebase) btnSalvarFaturaFirebase.addEventListener('click', salvarFaturaFirebase);
    
    if (btnCancelarFatura) btnCancelarFatura.addEventListener('click', () => {
        if (confirm('Cancelar?')) {
            faturaStep.classList.add('hidden');
            dashboardStep.classList.remove('hidden');
        }
    });
    
    if (btnAbrirLancamentoManual) btnAbrirLancamentoManual.addEventListener('click', abrirModalLancamento);

    if (btnFecharLancamentoManual) btnFecharLancamentoManual.addEventListener('click', () => modalLancamentoManual.close());
    
    if (formLancamentoManual) formLancamentoManual.addEventListener('submit', salvarLancamentoManual);

    if (tbodyFatura) {
        tbodyFatura.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-excluir-item-fatura')) {
                const linha = e.target.closest('tr');
                if (linha) {
                    const index = parseInt(linha.dataset.index);
                    faturaImportada[index] = null;
                    linha.remove();
                }
            }
        });
    }

    if (tbodyCategorizacao) {
        tbodyCategorizacao.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-excluir-item-extrato')) {
                const linha = e.target.closest('tr');
                if (linha) {
                    const index = parseInt(linha.dataset.index);
                    transacoesImportadas[index] = null;
                    linha.remove();
                }
            }
        });
    }
});

