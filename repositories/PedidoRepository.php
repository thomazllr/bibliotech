<?php

require_once 'BaseRepository.php';
require_once __DIR__ . '/../models/Pedido.php';

class PedidoRepository extends BaseRepository
{
    public function criar(Pedido $pedido): int
    {
        $stmt = $this->conn->prepare(
            "INSERT INTO pedidos (usuario_id, total, status, criado_em)
             VALUES (:usuario_id, :total, :status, :criado_em)"
        );

        $stmt->execute([
            ':usuario_id' => $pedido->usuario_id,
            ':total' => $pedido->total,
            ':status' => $pedido->status,
            ':criado_em' => $pedido->criado_em,
        ]);

        return (int) $this->conn->lastInsertId();
    }

    public function buscarPorUsuario(int $usuarioId): array
    {
        $stmt = $this->conn->prepare("SELECT * FROM pedidos WHERE usuario_id = :usuario_id ORDER BY criado_em DESC");
        $stmt->execute([':usuario_id' => $usuarioId]);

        $pedidos = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $pedidos[] = new Pedido($row);
        }

        return $pedidos;
    }

    public function buscarPorId(int $id): ?Pedido
    {
        $stmt = $this->conn->prepare("SELECT * FROM pedidos WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ? new Pedido($row) : null;
    }

    public function buscarPedidoCompletoPorId(int $pedidoId): ?array
    {
        $sql = "
        SELECT 
            p.id AS pedido_id,
            p.usuario_id,
            p.total,
            p.status,
            p.criado_em,
            i.id AS item_id,
            i.livro_id,
            i.quantidade,
            i.preco_unitario,
            l.titulo,
            l.imagem_url
        FROM pedidos p
        INNER JOIN pedido_itens i ON p.id = i.pedido_id
        INNER JOIN livros l ON l.id = i.livro_id
        WHERE p.id = :pedido_id
    ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([':pedido_id' => $pedidoId]);
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $result ?: null;
    }

    public function buscarPedidoPendenteDoUsuario(int $usuarioId): ?Pedido
    {
        $sql = "SELECT * FROM pedidos WHERE usuario_id = :usuario_id AND status = 'pendente' LIMIT 1";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(':usuario_id', $usuarioId);
        $stmt->execute();
        $data = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($data) {
            return new Pedido($data);
        }

        return null;
    }

    public function atualizarStatus(int $pedidoId, string $novoStatus): void
    {
        $stmt = $this->conn->prepare(
            "UPDATE pedidos SET status = :status WHERE id = :id"
        );

        $stmt->execute([
            ':status' => $novoStatus,
            ':id' => $pedidoId
        ]);
    }
}
