let alunosCarregados = [];

document.addEventListener('DOMContentLoaded', () => {
    carregarAlunos();

    const form = document.getElementById('form-matricula');
    form.addEventListener('submit', salvarMatricula);

    const filtroSerie = document.getElementById('filtro-serie');
    filtroSerie.addEventListener('change', (e) => {
        carregarAlunos(e.target.value);
    });
});

async function carregarAlunos(serie = '') {
    try {
        const url = serie ? `/alunos?serie=${encodeURIComponent(serie)}` : '/alunos';
        const resposta = await fetch(url);
        alunosCarregados = await resposta.json();

        const tbody = document.getElementById('tabela-alunos');
        tbody.innerHTML = '';

        if (alunosCarregados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">Nenhum aluno encontrado.</td></tr>';
            return;
        }

        alunosCarregados.forEach((item) => {
            const cpfFormatado = item.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
            const valorFormatado = Number(item.valor_mensalidade).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${item.aluno_nome}</strong></td>
                <td>${item.serie} (${item.turno})</td>
                <td>${item.responsavel_nome}</td>
                <td>${cpfFormatado}</td>
                <td>${valorFormatado}</td>
                <td>
                    <button class="btn-copiar" onclick="copiarDadosNF(${item.aluno_id}, this)">
                        Copiar Dados NF
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (erro) {
        console.error('Erro ao carregar alunos:', erro);
    }
}

async function salvarMatricula(evento) {
    evento.preventDefault();
    const statusEl = document.getElementById('mensagem-status');
    statusEl.textContent = 'Salvando...';
    statusEl.style.color = '#2563eb';

    const payload = {
        responsavel: {
            nome_completo: document.getElementById('resp-nome').value,
            cpf: document.getElementById('resp-cpf').value,
            telefone: document.getElementById('resp-telefone').value,
            email: document.getElementById('resp-email').value,
            cep: document.getElementById('resp-cep').value,
            logradouro: document.getElementById('resp-logradouro').value,
            numero: document.getElementById('resp-numero').value,
            complemento: document.getElementById('resp-complemento').value,
            bairro: document.getElementById('resp-bairro').value,
            cidade: document.getElementById('resp-cidade').value,
            uf: document.getElementById('resp-uf').value
        },
        aluno: {
            nome_completo: document.getElementById('aluno-nome').value,
            serie: document.getElementById('aluno-serie').value,
            turno: document.getElementById('aluno-turno').value,
            valor_mensalidade: parseFloat(document.getElementById('aluno-mensalidade').value)
        }
    };

    try {
        const resposta = await fetch('/matriculas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.detalhes || dados.erro || 'Erro ao salvar.');
        }

        statusEl.textContent = 'Matrícula salva com sucesso!';
        statusEl.style.color = '#059669';
        evento.target.reset();
        carregarAlunos(document.getElementById('filtro-serie').value);
    } catch (erro) {
        statusEl.textContent = `Erro: ${erro.message}`;
        statusEl.style.color = '#dc2626';
    }
}

// 3. Copia os dados prontos para colar no portal da prefeitura
async function copiarDadosNF(alunoId, botao) {
    const registro = alunosCarregados.find((a) => a.aluno_id === alunoId);
    if (!registro) return;

    const textoParaNota = [
        `Tomador: ${registro.responsavel_nome}`,
        `CPF: ${registro.cpf}`,
        `E-mail: ${registro.email}`,
        `Endereço: ${registro.logradouro}, ${registro.numero}${registro.complemento ? ' - ' + registro.complemento : ''}, ${registro.bairro}, ${registro.cidade}-${registro.uf}, CEP ${registro.cep}`,
        `Discriminação: Mensalidade escolar - Aluno(a) ${registro.aluno_nome} (${registro.serie})`,
        `Valor: R$ ${Number(registro.valor_mensalidade).toFixed(2).replace('.', ',')}`
    ].join('\n');

    await navigator.clipboard.writeText(textoParaNota);

    const textoOriginal = botao.textContent;
    botao.textContent = 'Copiado!';
    botao.style.backgroundColor = '#1e3a8a';

    setTimeout(() => {
        botao.textContent = textoOriginal;
        botao.style.backgroundColor = '#059669';
    }, 2000);
}