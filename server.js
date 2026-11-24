const express = require('express');
const db = require('./db');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// ROTA 1: Cadastrar Responsável + Aluno (POST)
app.post('/matriculas', async (req, res) => {
    const { responsavel, aluno } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Remove pontos e traços do CPF e CEP antes de salvar
        const cpfLimpo = responsavel.cpf.replace(/\D/g, '');
        const cepLimpo = responsavel.cep.replace(/\D/g, '');

        // Verifica se o responsável já está cadastrado (caso de irmãos)
        const [existente] = await connection.query(
            'SELECT id FROM responsaveis WHERE cpf = ?',
            [cpfLimpo]
        );

        let responsavelId;

        if (existente.length > 0) {
            responsavelId = existente[0].id;
        } else {
            const [resResp] = await connection.query(
                `INSERT INTO responsaveis 
                (nome_completo, cpf, email, telefone, cep, logradouro, numero, complemento, bairro, cidade, uf) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    responsavel.nome_completo,
                    cpfLimpo,
                    responsavel.email,
                    responsavel.telefone,
                    cepLimpo,
                    responsavel.logradouro,
                    responsavel.numero,
                    responsavel.complemento || null,
                    responsavel.bairro,
                    responsavel.cidade,
                    responsavel.uf.toUpperCase()
                ]
            );
            responsavelId = resResp.insertId;
        }

        // Insere o aluno vinculado ao ID do responsável
        const [resAluno] = await connection.query(
            `INSERT INTO alunos 
            (nome_completo, serie, turno, valor_mensalidade, responsavel_id) 
            VALUES (?, ?, ?, ?, ?)`,
            [
                aluno.nome_completo,
                aluno.serie,
                aluno.turno,
                aluno.valor_mensalidade,
                responsavelId
            ]
        );

        await connection.commit();
        res.status(201).json({
            mensagem: 'Matrícula registrada com sucesso!',
            aluno_id: resAluno.insertId,
            responsavel_id: responsavelId
        });

    } catch (erro) {
        await connection.rollback();
        res.status(500).json({ erro: 'Erro ao registrar matrícula', detalhes: erro.message });
    } finally {
        connection.release();
    }
});

// ROTA 2: Listar Alunos ativos + Dados fiscais do Responsável (GET)
app.get('/alunos', async (req, res) => {
    const { serie } = req.query;

    try {
        let sql = `
            SELECT 
                a.id AS aluno_id,
                a.nome_completo AS aluno_nome,
                a.serie,
                a.turno,
                a.valor_mensalidade,
                r.id AS responsavel_id,
                r.nome_completo AS responsavel_nome,
                r.cpf,
                r.email,
                r.telefone,
                r.cep,
                r.logradouro,
                r.numero,
                r.complemento,
                r.bairro,
                r.cidade,
                r.uf
            FROM alunos a
            INNER JOIN responsaveis r ON a.responsavel_id = r.id
            WHERE a.ativo = TRUE
        `;
        const params = [];

        if (serie) {
            sql += ' AND a.serie = ?';
            params.push(serie);
        }

        sql += ' ORDER BY a.serie, a.nome_completo';

        const [linhas] = await db.query(sql, params);
        res.json(linhas);

    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao buscar alunos', detalhes: erro.message });
    }
});

async function testarConexao() {
    try {
        await db.query('SELECT 1');
        console.log('Conexão com o banco SQL estabelecida com sucesso!');
    } catch (erro) {
        console.error('Falha ao conectar no banco:', erro.message);
    }
}

app.listen(process.env.PORT || 3000, () => {
    console.log('Servidor rodando na porta 3000');
    testarConexao();
});