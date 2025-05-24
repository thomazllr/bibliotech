<?php

require_once __DIR__ . '/../models/Carrinho.php';
require_once __DIR__ . '/BaseRepository.php';

class CarrinhoRepository extends BaseRepository
{
    public function adicionar(Carrinho $carrinho): bool
    {
        $sql = "SELECT quantidade FROM carrinho WHERE usuario_id = :usuario_id AND livro_id = :livro_id";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(':usuario_id', $carrinho->usuario_id);
        $stmt->bindValue(':livro_id', $carrinho->livro_id);
        $stmt->execute();

        $existente = $stmt->fetch(PDO::FETCH_ASSOC);
        $stmt->closeCursor();

        if ($existente) {
            $novaQuantidade = $existente['quantidade'] + $carrinho->quantidade;
            $update = "UPDATE carrinho SET quantidade = :quantidade WHERE usuario_id = :usuario_id AND livro_id = :livro_id";
            $stmt = $this->conn->prepare($update);
            $stmt->bindValue(':quantidade', $novaQuantidade);
        } else {
            $insert = "INSERT INTO carrinho (usuario_id, livro_id, quantidade) VALUES (:usuario_id, :livro_id, :quantidade)";
            $stmt = $this->conn->prepare($insert);
            $stmt->bindValue(':quantidade', $carrinho->quantidade);
        }

        $stmt->bindValue(':usuario_id', $carrinho->usuario_id);
        $stmt->bindValue(':livro_id', $carrinho->livro_id);
        $result = $stmt->execute();
        $stmt->closeCursor();

        return $result;
    }

    public function atualizarQuantidade(Carrinho $carrinho): bool
    {
        $sql = "UPDATE carrinho SET quantidade = :quantidade WHERE usuario_id = :usuario_id AND livro_id = :livro_id";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(':quantidade', $carrinho->quantidade);
        $stmt->bindValue(':usuario_id', $carrinho->usuario_id);
        $stmt->bindValue(':livro_id', $carrinho->livro_id);
        $result = $stmt->execute();
        $stmt->closeCursor();

        return $result;
    }

    public function remover(int $usuarioId, int $livroId): bool
    {
        $sql = "DELETE FROM carrinho WHERE usuario_id = :usuario_id AND livro_id = :livro_id";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(':usuario_id', $usuarioId);
        $stmt->bindValue(':livro_id', $livroId);
        $result = $stmt->execute();
        $stmt->closeCursor();

        return $result;
    }

    public function listarPorUsuario(int $usuarioId): array
    {
        $sql = "SELECT c.livro_id, l.titulo, l.imagem_url, l.autor, c.quantidade, l.preco
                FROM carrinho c
                JOIN livros l ON c.livro_id = l.id
                WHERE c.usuario_id = :usuario_id";

        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(':usuario_id', $usuarioId);
        $stmt->execute();
        $itens = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $stmt->closeCursor();

        return $itens;
    }

    public function limparCarrinho(int $usuarioId): bool
    {
        $sql = "DELETE FROM carrinho WHERE usuario_id = :usuario_id";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(':usuario_id', $usuarioId, PDO::PARAM_INT);
        $result = $stmt->execute();
        $stmt->closeCursor();

        return $result;
    }
}
