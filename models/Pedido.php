<?php
class Pedido
{
    public int $id;
    public int $usuario_id;
    public float $total;
    public string $status;
    public string $criado_em;
    public array $itens = [];

    public function __construct(array $data)
    {
        $this->id = (int) ($data['id'] ?? 0);
        $this->usuario_id = (int) ($data['usuario_id'] ?? 0);
        $this->total = (float) ($data['total'] ?? 0);
        $this->status = $data['status'] ?? 'pendente';
        $this->criado_em = $data['criado_em'] ?? date('Y-m-d H:i:s');
    }

    public function toArray(): array
    {
        $arr = [
            'id' => $this->id,
            'usuario_id' => $this->usuario_id,
            'total' => $this->total,
            'status' => $this->status,
            'criado_em' => $this->criado_em
        ];
        if (isset($this->itens)) {
            $arr['itens'] = $this->itens;
        }
        return $arr;
    }
}
