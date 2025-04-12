
<?php

class ExemploDAO
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function buscarTodos(): array
    {
        $stmt = $this->pdo->query("SELECT * FROM exemplos");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function inserir(string $nome): array
    {
        $stmt = $this->pdo->prepare("INSERT INTO exemplos (nome) VALUES (:nome) RETURNING *");
        $stmt->execute(['nome' => $nome]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
