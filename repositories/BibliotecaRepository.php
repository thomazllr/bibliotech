<?php

require_once __DIR__ . '/../models/Biblioteca.php';
require_once __DIR__ . '/BaseRepository.php';

class BibliotecaRepository extends BaseRepository
{
    /**
     * Adiciona um livro à biblioteca do usuário (ignora se já existir).
     */
    public function adicionarLivro(Biblioteca $biblioteca)
    {
        // Verifica se o livro já está na biblioteca do usuário
        if ($this->existeNaBiblioteca($biblioteca)) {
            return false;
        }

        $sql = "INSERT INTO biblioteca (usuario_id, livro_id, data_adquirido) 
                VALUES (:usuario_id, :livro_id, NOW())";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(':usuario_id', $biblioteca->usuario_id, PDO::PARAM_INT);
        $stmt->bindValue(':livro_id', $biblioteca->livro_id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    /**
     * Lista todos os livros da biblioteca de um usuário.
     */
    public function listarPorUsuario($usuarioId)
    {
        $sql = "SELECT l.*, b.data_adquirido, g.nome AS nome_genero 
                FROM biblioteca b
                JOIN livros l ON b.livro_id = l.id
                LEFT JOIN generos g ON l.genero_id = g.id
                WHERE b.usuario_id = :usuario_id
                ORDER BY b.data_adquirido ASC";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(':usuario_id', $usuarioId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Verifica se um livro já está na biblioteca do usuário.
     */
    public function existeNaBiblioteca(Biblioteca $biblioteca)
    {
        $sql = "SELECT COUNT(*) FROM biblioteca 
                WHERE usuario_id = :usuario_id AND livro_id = :livro_id";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(':usuario_id', $biblioteca->usuario_id, PDO::PARAM_INT);
        $stmt->bindValue(':livro_id', $biblioteca->livro_id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchColumn() > 0;
    }

    public function buscarLivroDaBiblioteca(int $usuarioId, int $livroId): ?Livro
    {
        $sql = "
        SELECT l.*
        FROM biblioteca b
        INNER JOIN livros l ON b.livro_id = l.id
        WHERE b.usuario_id = :usuarioId AND b.livro_id = :livroId
        LIMIT 1
    ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            ':usuarioId' => $usuarioId,
            ':livroId' => $livroId
        ]);

        $data = $stmt->fetch(PDO::FETCH_ASSOC);

        return $data ? new Livro($data) : null;
    }
}
