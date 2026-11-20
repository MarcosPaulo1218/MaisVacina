// =============================================
// MaisVacina — Lógica unificada multipágina
// Login, e-mail, recuperação, perfil, vacinas, autenticação
// Compatível com: index.html, app.html, perfil.html,
//                 vacinas.html, autenticacao.html, sobre.html
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    const pagina = window.location.pathname.split('/').pop() || 'index.html';
    const logado = !!getSessao();

    // ---- Páginas que exigem login ----
    const paginasProtegidas = ['app.html', 'perfil.html', 'vacinas.html', 'autenticacao.html'];
    if (paginasProtegidas.includes(pagina) && !logado) {
        window.location.href = 'index.html';
        return;
    }

    // ---- Se já logado e está no index, vai direto ao app ----
    if (pagina === 'index.html' && logado) {
        window.location.href = 'app.html';
        return;
    }

    // ---- Helper seguro para addEventListener ----
    const on = (id, evento, handler) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener(evento, handler);
        return el;
    };

    // =============================================
    // MÁSCARA DE CPF (todas as páginas que tiverem)
    // =============================================
    ['login-cpf', 'cad-cpf', 'rec-cpf'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('input', e => {
            e.target.value = formatarCPF(e.target.value);
        });
    });

    // =============================================
    // ABAS LOGIN / CADASTRO (index.html)
    // =============================================
    document.querySelectorAll('.aba-login').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.aba-login').forEach(b => b.classList.remove('ativa'));
            document.querySelectorAll('.form-aba').forEach(f => f.classList.remove('ativa'));
            btn.classList.add('ativa');
            const alvo = btn.dataset.aba === 'login' ? 'form-login' : 'form-cadastro-conta';
            const elAlvo = document.getElementById(alvo);
            if (elAlvo) elAlvo.classList.add('ativa');
        });
    });

    // ---- Link "Esqueci minha senha" ----
    on('link-esqueci-senha', 'click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.aba-login').forEach(b => b.classList.remove('ativa'));
        document.querySelectorAll('.form-aba').forEach(f => f.classList.remove('ativa'));
        const rec = document.getElementById('form-recuperar');
        if (rec) rec.classList.add('ativa');
    });

    // ---- Link "Voltar ao login" ----
    on('link-voltar-login', 'click', (e) => {
        e.preventDefault();
        const rec = document.getElementById('form-recuperar');
        if (rec) rec.classList.remove('ativa');
        const abaLogin = document.querySelector('.aba-login[data-aba="login"]');
        if (abaLogin) abaLogin.classList.add('ativa');
        const formLogin = document.getElementById('form-login');
        if (formLogin) formLogin.classList.add('ativa');
    });

    // =============================================
    // LOGIN
    // =============================================
    on('form-login', 'submit', e => {
        e.preventDefault();
        const cpf = document.getElementById('login-cpf').value.replace(/\D/g, '');
        const senha = document.getElementById('login-senha').value;

        if (!validarCPF(cpf)) {
            exibirMsg('msg-login', '❌ CPF inválido.', 'erro');
            return;
        }
        const contas = getContas();
        const conta = contas[cpf];
        if (!conta) {
            exibirMsg('msg-login', '❌ CPF não cadastrado. Crie uma conta.', 'erro');
            return;
        }
        if (conta.senha !== senha) {
            exibirMsg('msg-login', '❌ Senha incorreta.', 'erro');
            return;
        }
        setSessao(cpf);
        window.location.href = 'app.html';
    });

    // =============================================
    // CADASTRO DE CONTA
    // =============================================
    on('form-cadastro-conta', 'submit', e => {
        e.preventDefault();
        const cpf = document.getElementById('cad-cpf').value.replace(/\D/g, '');
        const dados = {
            cpf,
            nome: document.getElementById('cad-nome').value.trim(),
            email: document.getElementById('cad-email').value.trim().toLowerCase(),
            sexo: document.getElementById('cad-sexo').value,
            nascimento: document.getElementById('cad-nascimento').value,
            telefone: document.getElementById('cad-telefone').value.trim(),
            endereco: document.getElementById('cad-endereco').value.trim(),
            senha: document.getElementById('cad-senha').value
        };
        const confirmar = document.getElementById('cad-confirmar').value;

        if (!validarCPF(cpf)) {
            exibirMsg('msg-cadastro-conta', '❌ CPF inválido.', 'erro');
            return;
        }
        if (!validarEmail(dados.email)) {
            exibirMsg('msg-cadastro-conta', '❌ E-mail inválido.', 'erro');
            return;
        }
        if (dados.senha !== confirmar) {
            exibirMsg('msg-cadastro-conta', '❌ As senhas não coincidem.', 'erro');
            return;
        }
        const contas = getContas();
        if (contas[cpf]) {
            exibirMsg('msg-cadastro-conta', '❌ Já existe uma conta com este CPF.', 'erro');
            return;
        }
        contas[cpf] = dados;
        salvarContas(contas);
        exibirMsg('msg-cadastro-conta', '✅ Conta criada! Faça login para entrar.', 'sucesso');
        setTimeout(() => {
            const abaLogin = document.querySelector('.aba-login[data-aba="login"]');
            if (abaLogin) abaLogin.click();
            const loginCpf = document.getElementById('login-cpf');
            if (loginCpf) loginCpf.value = formatarCPF(cpf);
            const formCad = document.getElementById('form-cadastro-conta');
            if (formCad) formCad.reset();
        }, 1200);
    });

    // =============================================
    // RECUPERAÇÃO DE SENHA
    // =============================================
    on('form-recuperar', 'submit', e => {
        e.preventDefault();
        const cpf = document.getElementById('rec-cpf').value.replace(/\D/g, '');
        const email = document.getElementById('rec-email').value.trim().toLowerCase();
        const novaSenha = document.getElementById('rec-nova-senha').value;
        const confirmar = document.getElementById('rec-confirmar').value;

        if (!validarCPF(cpf)) {
            exibirMsg('msg-recuperar', '❌ CPF inválido.', 'erro');
            return;
        }
        const contas = getContas();
        const conta = contas[cpf];

        if (!conta) {
            exibirMsg('msg-recuperar', '❌ CPF não encontrado.', 'erro');
            return;
        }
        if (conta.email !== email) {
            exibirMsg('msg-recuperar', '❌ E-mail não corresponde ao cadastrado.', 'erro');
            return;
        }
        if (novaSenha !== confirmar) {
            exibirMsg('msg-recuperar', '❌ As senhas não coincidem.', 'erro');
            return;
        }

        contas[cpf].senha = novaSenha;
        salvarContas(contas);

        exibirMsg('msg-recuperar', '✅ Senha redefinida! Faça login com a nova senha.', 'sucesso');
        setTimeout(() => {
            const formRec = document.getElementById('form-recuperar');
            if (formRec) formRec.reset();
            const linkVoltar = document.getElementById('link-voltar-login');
            if (linkVoltar) linkVoltar.click();
            const loginCpf = document.getElementById('login-cpf');
            if (loginCpf) loginCpf.value = formatarCPF(cpf);
        }, 1500);
    });

    // =============================================
    // LOGOUT (presente em todas as páginas autenticadas)
    // =============================================
    on('btn-logout', 'click', () => {
        limparSessao();
        window.location.href = 'index.html';
    });

    // =============================================
    // REGISTRAR VACINA (vacinas.html)
    // =============================================
    on('form-vacina', 'submit', e => {
        e.preventDefault();
        const cpf = getSessao();
        if (!cpf) return;
        const vacinas = getVacinas(cpf);
        vacinas.push({
            id: Date.now(),
            nome: document.getElementById('vacina-nome').value.trim(),
            data: document.getElementById('vacina-data').value,
            hora: document.getElementById('vacina-hora').value,
            local: document.getElementById('vacina-local').value.trim()
        });
        setVacinas(cpf, vacinas);
        e.target.reset();
        renderizarVacinas();
    });

    // =============================================
    // AUTENTICAÇÃO PROFISSIONAL (autenticacao.html)
    // =============================================
    on('form-autenticacao', 'submit', e => {
        e.preventDefault();
        const cpf = getSessao();
        if (!cpf) return;
        const tipo = document.getElementById('tipo-profissional').value;
        const registro = document.getElementById('registro-profissional').value.trim();
        const senha = document.getElementById('senha-profissional').value.trim();

        if (!tipo || !registro || !senha) {
            exibirMsg('msg-autenticacao', '❌ Preencha todos os campos.', 'erro');
            return;
        }
        localStorage.setItem('maisvacina_autenticacao_' + cpf, JSON.stringify({
            tipo, registro, dataAutenticacao: new Date().toISOString()
        }));
        atualizarStatusAutenticacao();
        exibirMsg('msg-autenticacao', '✅ Carteira autenticada com sucesso!', 'sucesso');
    });

    // =============================================
    // INICIALIZAÇÃO POR PÁGINA
    // =============================================
    const cpf = getSessao();

    if (logado && cpf) {
        const conta = getContas()[cpf];
        const nomeUser = document.getElementById('nome-usuario');
        if (nomeUser && conta) nomeUser.textContent = conta.nome;
    }

    // Páginas com renderizações dinâmicas
    if (pagina === 'app.html') {
        if (logado) {
            renderizarPerfil();
            renderizarVacinas();
            atualizarStatusAutenticacao();
        }
    } else if (pagina === 'perfil.html') {
        if (logado) renderizarPerfil();
    } else if (pagina === 'vacinas.html') {
        if (logado) renderizarVacinas();
    } else if (pagina === 'autenticacao.html') {
        if (logado) atualizarStatusAutenticacao();
    } else if (pagina === 'index.html') {
        // Já tratado acima (redireciona se logado)
    }
});

// =============================================
// FUNÇÕES UTILITÁRIAS
// =============================================

function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    for (let t = 9; t < 11; t++) {
        let d = 0;
        for (let c = 0; c < t; c++) {
            d += parseInt(cpf[c]) * ((t + 1) - c);
        }
        d = ((d * 10) % 11) % 10;
        if (parseInt(cpf[t]) !== d) return false;
    }
    return true;
}

function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function formatarCPF(value) {
    value = value.replace(/\D/g, '').slice(0, 11);
    return value
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function formatarData(iso) {
    if (!iso) return '';
    const [a, m, d] = iso.split('-');
    return `${d}/${m}/${a}`;
}

function exibirMsg(id, texto, tipo) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = texto;
    el.className = `mensagem ${tipo}`;
    setTimeout(() => { el.textContent = ''; }, 5000);
}

// =============================================
// CONTAS E SESSÃO
// =============================================
function getContas() {
    return JSON.parse(localStorage.getItem('maisvacina_accounts') || '{}');
}
function salvarContas(c) {
    localStorage.setItem('maisvacina_accounts', JSON.stringify(c));
}
function getSessao() {
    return localStorage.getItem('maisvacina_session');
}
function setSessao(cpf) {
    localStorage.setItem('maisvacina_session', cpf);
}
function limparSessao() {
    localStorage.removeItem('maisvacina_session');
}

// =============================================
// VACINAS POR CPF
// =============================================
function getVacinas(cpf) {
    return JSON.parse(localStorage.getItem('maisvacina_vacinas_' + cpf) || '[]');
}
function setVacinas(cpf, arr) {
    localStorage.setItem('maisvacina_vacinas_' + cpf, JSON.stringify(arr));
}
function getAutenticacao(cpf) {
    return JSON.parse(localStorage.getItem('maisvacina_autenticacao_' + cpf) || 'null');
}

// =============================================
// RENDERIZAÇÃO DE PERFIL
// =============================================
function renderizarPerfil() {
    const cpf = getSessao();
    const conta = getContas()[cpf];
    if (!conta) return;
    const view = document.getElementById('perfil-view');
    if (!view) return;

    view.innerHTML = `
        <div class="perfil-grid">
            <div class="perfil-item"><small>Nome</small><strong>${conta.nome}</strong></div>
            <div class="perfil-item"><small>CPF</small><strong>${formatarCPF(conta.cpf)}</strong></div>
            <div class="perfil-item"><small>E-mail</small><strong>${conta.email || '—'}</strong></div>
            <div class="perfil-item"><small>Sexo</small><strong>${conta.sexo}</strong></div>
            <div class="perfil-item"><small>Nascimento</small><strong>${formatarData(conta.nascimento)}</strong></div>
            <div class="perfil-item"><small>Telefone</small><strong>${conta.telefone}</strong></div>
            <div class="perfil-item" style="grid-column:1/-1;"><small>Endereço</small><strong>${conta.endereco}</strong></div>
        </div>
        <button class="btn-secundario" id="btn-editar-perfil" style="margin-top:12px;">Editar Dados</button>
    `;

    const btnEditar = document.getElementById('btn-editar-perfil');
    if (!btnEditar) return;

    btnEditar.addEventListener('click', () => {
        view.innerHTML = `
            <form id="form-editar-perfil">
                <div class="grid-2">
                    <div class="campo"><label>Nome</label><input type="text" id="edit-nome" value="${conta.nome}" required></div>
                    <div class="campo"><label>E-mail</label><input type="email" id="edit-email" value="${conta.email || ''}" required></div>
                    <div class="campo"><label>Sexo</label>
                        <select id="edit-sexo" required>
                            <option ${conta.sexo === 'Feminino' ? 'selected' : ''}>Feminino</option>
                            <option ${conta.sexo === 'Masculino' ? 'selected' : ''}>Masculino</option>
                            <option ${conta.sexo === 'Outro' ? 'selected' : ''}>Outro</option>
                            <option ${conta.sexo === 'Prefiro não informar' ? 'selected' : ''}>Prefiro não informar</option>
                        </select>
                    </div>
                    <div class="campo"><label>Nascimento</label><input type="date" id="edit-nascimento" value="${conta.nascimento}" required></div>
                    <div class="campo"><label>Telefone</label><input type="tel" id="edit-telefone" value="${conta.telefone}" required></div>
                    <div class="campo" style="grid-column:1/-1;"><label>Endereço</label><input type="text" id="edit-endereco" value="${conta.endereco}" required></div>
                </div>
                <button type="submit" class="btn-primario">Salvar Alterações</button>
                <button type="button" class="btn-secundario" id="btn-cancelar-edicao" style="margin-left:8px;">Cancelar</button>
            </form>
        `;

        const formEdit = document.getElementById('form-editar-perfil');
        if (formEdit) {
            formEdit.addEventListener('submit', ev => {
                ev.preventDefault();
                const novoEmail = document.getElementById('edit-email').value.trim().toLowerCase();
                if (!validarEmail(novoEmail)) {
                    alert('E-mail inválido.');
                    return;
                }
                const contas = getContas();
                contas[cpf].nome = document.getElementById('edit-nome').value.trim();
                contas[cpf].email = novoEmail;
                contas[cpf].sexo = document.getElementById('edit-sexo').value;
                contas[cpf].nascimento = document.getElementById('edit-nascimento').value;
                contas[cpf].telefone = document.getElementById('edit-telefone').value.trim();
                contas[cpf].endereco = document.getElementById('edit-endereco').value.trim();
                salvarContas(contas);
                const nomeUser = document.getElementById('nome-usuario');
                if (nomeUser) nomeUser.textContent = contas[cpf].nome;
                renderizarPerfil();
            });
        }

        const btnCancelar = document.getElementById('btn-cancelar-edicao');
        if (btnCancelar) btnCancelar.addEventListener('click', renderizarPerfil);
    });
}

// =============================================
// RENDERIZAÇÃO DE VACINAS
// =============================================
function renderizarVacinas() {
    const cpf = getSessao();
    const container = document.getElementById('lista-vacinas');
    if (!container) return;
    const vacinas = getVacinas(cpf);

    if (vacinas.length === 0) {
        container.innerHTML = '<p class="vazio">Nenhuma vacina registrada ainda.</p>';
        return;
    }
    container.innerHTML = vacinas.map(v => `
        <div class="item-vacina">
            <div>
                <strong>${v.nome}</strong><br>
                <small>📅 ${formatarData(v.data)} às ${v.hora} — 📍 ${v.local}</small>
            </div>
            <button onclick="removerVacina(${v.id})" style="background:none;border:none;color:#e63946;cursor:pointer;font-size:1.2rem;" title="Remover">✕</button>
        </div>
    `).join('');
}

window.removerVacina = function (id) {
    if (!confirm('Remover esta vacina do histórico?')) return;
    const cpf = getSessao();
    let vacinas = getVacinas(cpf);
    vacinas = vacinas.filter(v => v.id !== id);
    setVacinas(cpf, vacinas);
    renderizarVacinas();
};

// =============================================
// STATUS DE AUTENTICAÇÃO
// =============================================
function atualizarStatusAutenticacao() {
    const cpf = getSessao();
    const el = document.getElementById('status-autenticacao');
    if (!el) return;
    const auth = getAutenticacao(cpf);
    if (auth) {
        el.className = 'status-autenticado';
        el.innerHTML = `✅ Carteira autenticada por <strong>${auth.tipo}</strong> — Registro: <strong>${auth.registro}</strong>`;
    } else {
        el.className = 'status-pendente';
        el.innerHTML = 'Status da carteira: <strong>Aguardando autenticação</strong>';
    }
}