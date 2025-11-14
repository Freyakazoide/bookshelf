const App = {
    state: {
        livros: [],
        challenges: [],
        activeView: 'view-estante',
        db: null,
        auth: null,
        user: null,
    },

    cacheDOM: function() {
        this.navLinks = document.querySelectorAll('.nav-link');
        this.views = document.querySelectorAll('.view');
        this.notificacaoContainerEl = document.getElementById('notificacao-container');
        this.authContainerEl = document.getElementById('auth-container');
    },

    bindEvents: function() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navegarPara(e.target.dataset.view);
            });
        });

        this.authContainerEl.addEventListener('click', (e) => {
            const loginButton = e.target.closest('#btn-login');
            const logoutButton = e.target.closest('#btn-logout');

            if (loginButton) {
                this.login();
            }
            if (logoutButton) {
                this.logout();
            }
        });
    },

    init: async function() {
        console.log('Aplicativo iniciando com Firebase...');
        this.cacheDOM();
        this.bindEvents();
        
        try {
            firebase.initializeApp(firebaseConfig);
            this.state.db = firebase.firestore();
            this.state.auth = firebase.auth();
            console.log('Firebase conectado com sucesso!');
            
            this.state.auth.onAuthStateChanged(user => {
                if (user) {
                    console.log('Usuário logado:', user.displayName, 'UID:', user.uid);
                    this.state.user = user;
                } else {
                    console.log('Nenhum usuário logado.');
                    this.state.user = null;
                }
                this.renderAuthUI();
                this.toggleEditFeatures();
            });
            
            await this.carregarDadosDoFirebase();

        } catch (error) {
            console.error('Falha crítica ao conectar ou carregar dados do Firebase:', error);
            this.mostrarNotificacao('Falha ao carregar dados. Verifique o console.', 'erro');
        }
    },

    carregarDadosDoFirebase: async function() {
        this.mostrarNotificacao('Carregando dados da nuvem...', 'info');
        try {
            const livrosSnapshot = await this.state.db.collection('livros').get();
            this.state.livros = livrosSnapshot.docs.map(doc => ({
                firestoreId: doc.id,
                ...doc.data()
            }));

            const challengesSnapshot = await this.state.db.collection('challenges').get();
            this.state.challenges = challengesSnapshot.docs.map(doc => ({
                firestoreId: doc.id,
                ...doc.data()
            }));

            console.log(`Carregados ${this.state.livros.length} livros e ${this.state.challenges.length} desafios.`);
            this.mostrarNotificacao('Dados carregados com sucesso!');

           Estante.init(this.state.livros, this.state.challenges);
            Adicionar.init(this.state.livros);
            Dashboard.init(this.state.livros);
            Desafio.init(this.state.livros, this.state.challenges);

        } catch (error) {
            console.error("Erro ao buscar dados do Firestore:", error);
            this.mostrarNotificacao('Não foi possível carregar os dados do banco de dados.', 'erro');
        }
    },
    
    login: async function() {
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            await this.state.auth.signInWithPopup(provider);
            this.mostrarNotificacao('Login efetuado com sucesso!');
        } catch (error) {
            console.error("Erro ao fazer login:", error);
            this.mostrarNotificacao('Falha no login. Tente novamente.', 'erro');
        }
    },

    logout: async function() {
        try {
            await this.state.auth.signOut();
            this.mostrarNotificacao('Você foi desconectado.');
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
        }
    },

    renderAuthUI: function() {
        if (this.state.user) {
            this.authContainerEl.innerHTML = `
                <div class="auth-info">
                    <img src="${this.state.user.photoURL}" alt="Foto de perfil">
                    <p>${this.state.user.displayName}</p>
                    <button id="btn-logout" class="btn-logout"><i class="fa-solid fa-sign-out-alt"></i> Sair</button>
                </div>
            `;
        } else {
            this.authContainerEl.innerHTML = `
                <button id="btn-login" class="btn-login">
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" width="18">
                    <span>Login com Google</span>
                </button>
            `;
        }
    },

    toggleEditFeatures: function() {
        const editButtons = document.querySelectorAll('#painel-btn-editar, #painel-btn-excluir, #painel-btn-salvar, #form-notas, #painel-btn-nova-leitura');
        const addLink = document.querySelector('.nav-link[data-view="view-adicionar"]');
        
        if (this.state.user) {
            editButtons.forEach(btn => btn.style.display = 'block');
            if (addLink) addLink.style.display = 'block';
        } else {
            editButtons.forEach(btn => btn.style.display = 'none');
            if (addLink) addLink.style.display = 'none';
        }
    },

    salvarLivro: async function(livroData, firestoreId) {
        if (!this.state.user) {
            this.mostrarNotificacao('Você precisa estar logado para salvar alterações.', 'erro');
            return false;
        }
        const dadosParaSalvar = { ...livroData };
        delete dadosParaSalvar.firestoreId;
        try {
            if (firestoreId) {
                await this.state.db.collection('livros').doc(firestoreId).set(dadosParaSalvar, { merge: true });
            } else {
                await this.state.db.collection('livros').add(dadosParaSalvar);
            }
            await this.carregarDadosDoFirebase();
            return true;
        } catch (error) {
            console.error('Erro ao salvar livro:', error);
            this.mostrarNotificacao('Erro ao salvar o livro.', 'erro');
            return false;
        }
    },
    
    excluirLivro: async function(firestoreId) {
        if (!this.state.user) {
            this.mostrarNotificacao('Você precisa estar logado para excluir.', 'erro');
            return;
        }
        if (!firestoreId) return;
        try {
            await this.state.db.collection('livros').doc(firestoreId).delete();
            await this.carregarDadosDoFirebase();
            this.mostrarNotificacao('Livro excluído com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir livro:', error);
            this.mostrarNotificacao('Erro ao excluir o livro.', 'erro');
        }
    },
    
    salvarMetas: async function(metas) {
        if (!this.state.user) {
            this.mostrarNotificacao('Você precisa estar logado para salvar metas.', 'erro');
            return;
        }
        try {
            const batch = this.state.db.batch();
            const collectionRef = this.state.db.collection('challenges');
            const snapshot = await collectionRef.get();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            metas.forEach(meta => {
                const { firestoreId, ...metaData } = meta;
                const docRef = firestoreId ? collectionRef.doc(firestoreId) : collectionRef.doc();
                batch.set(docRef, metaData);
            });
            await batch.commit();
            console.log('Metas salvas no Firestore com sucesso.');
        } catch (error) {
            console.error("Erro ao salvar metas no Firestore:", error);
            this.mostrarNotificacao('Ocorreu um erro ao salvar suas metas.', 'erro');
        }
    },

    navegarPara: function(viewId) {
        this.views.forEach(v => v.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');
        this.navLinks.forEach(l => l.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-link[data-view="${viewId}"]`);
        if (activeLink) activeLink.classList.add('active');
        this.state.activeView = viewId;
        window.scrollTo(0, 0);
        if (viewId === 'view-dashboard') {
            Dashboard.atualizar(this.state.livros);
        }
        if (viewId === 'view-desafio') {
            Desafio.atualizar(this.state.livros);
        }
    },

    mostrarNotificacao: function(mensagem, tipo = 'sucesso') {
        const notificacao = document.createElement('div');
        notificacao.className = `notificacao ${tipo}`;
        notificacao.textContent = mensagem;
        this.notificacaoContainerEl.appendChild(notificacao);
        setTimeout(() => {
            notificacao.remove();
        }, 3000);
    }
};

App.init();