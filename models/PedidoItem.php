<?php
class PedidoItem
{
    public int $id;
    public int $pedido_id;
    public int $livro_id;
    public int $quantidade;
    public float $preco_unitario;

    public function __construct(array $data)
    {
        $this->id = (int) ($data['id'] ?? 0);
        $this->pedido_id = (int) ($data['pedido_id'] ?? 0);
        $this->livro_id = (int) ($data['livro_id'] ?? 0);
        $this->quantidade = (int) ($data['quantidade'] ?? 1);
        $this->preco_unitario = (float) ($data['preco_unitario'] ?? 0);
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'pedido_id' => $this->pedido_id,
            'livro_id' => $this->livro_id,
            'quantidade' => $this->quantidade,
            'preco_unitario' => $this->preco_unitario
        ];
    }
}
