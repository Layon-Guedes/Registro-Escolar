create database sistema_registro;

use sistema_registro;

CREATE TABLE responsaveis(
id INT AUTO_INCREMENT PRIMARY KEY,
nome_completo VARCHAR (120) NOT NULL,
cpf VARCHAR (11) NOT NULL UNIQUE,
email VARCHAR (120) NOT NULL,
telefone VARCHAR(15) NOT NULL,
cep VARCHAR(8) NOT NULL,
logradouro VARCHAR(150) NOT NULL,
numero VARCHAR(20) NOT NULL,
complemento VARCHAR (80),
bairro VARCHAR(80) NOT NULL,
cidade VARCHAR(80) NOT NULL,
uf CHAR(2) NOT NULL,
criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE alunos(
id INT AUTO_INCREMENT PRIMARY KEY,
nome_completo VARCHAR (120) NOT NULL,
serie VARCHAR(30) NOT NULL,
turno VARCHAR(20) NOT NULL,
valor_mensalidade DECIMAL(10, 2) NOT NULL,
ativo BOOLEAN DEFAULT TRUE,
responsavel_id INT NOT NULL,
criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

CONSTRAINT fk_responsavel
	FOREIGN KEY (responsavel_id) 
	REFERENCES responsaveis(id)
	ON DELETE RESTRICT
);