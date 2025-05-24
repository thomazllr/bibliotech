<?php

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../repositories/PedidoRepository.php';
require_once __DIR__ . '/../repositories/PedidoItemRepository.php';
require_once __DIR__ . '/../repositories/CarrinhoRepository.php';
require_once __DIR__ . '/../repositories/LivroRepository.php';
require_once __DIR__ . '/../models/Pedido.php';
require_once __DIR__ . '/../models/PedidoItem.php';

class PedidoController extends BaseController
{
    private PedidoRepository $pedidoRepository;
    private PedidoItemRepository $itemRepository;
    private CarrinhoRepository $carrinhoRepository;
    private LivroRepository $livroRepository;

    public function __construct(private PDO $pdo)
    {
        session_start();
        $this->pedidoRepository = new PedidoRepository($pdo);
        $this->itemRepository = new PedidoItemRepository($pdo);
        $this->carrinhoRepository = new CarrinhoRepository($pdo);
        $this->livroRepository = new LivroRepository($pdo);
    }

    #[Route('/pedido/finalizar', 'POST')]
    public function finalizar()
    {
        if (!$this->isAuthenticated()) {
            return $this->response(401, [
                'status' => 'error',
                'message' => 'Usuário não autenticado.'
            ]);
        }

        $usuarioId = $_SESSION['userId'];

        $pendente = $this->pedidoRepository->buscarPedidoPendenteDoUsuario($usuarioId);

        if ($pendente) {
            return $this->response(400, [
                'status' => 'error',
                'message' => 'Você já tem um pedido pendente. Aguarde o processamento antes de fazer outro.'
            ]);
        }

        $carrinho = $this->carrinhoRepository->listarPorUsuario($usuarioId);

        if (empty($carrinho)) {
            return $this->response(400, [
                'status' => 'error',
                'message' => 'Carrinho vazio.'
            ]);
        }

        $total = 0;
        $itensPedido = [];

        foreach ($carrinho as $item) {
            // Verifica se está acessando como array
            $livroId = is_array($item) ? $item['livro_id'] : $item->livro_id;
            $quantidade = is_array($item) ? $item['quantidade'] : $item->quantidade;

            // Busca o livro no repositório
            $livro = $this->livroRepository->findById($livroId);

            if (!$livro) {
                return $this->response(400, [
                    'status' => 'error',
                    'message' => "Livro com ID $livroId não encontrado."
                ]);
            }

            $subtotal = $livro->preco * $quantidade;
            $total += $subtotal;

            $itensPedido[] = new PedidoItem([
                'livro_id' => $livroId,
                'quantidade' => $quantidade,
                'preco_unitario' => $livro->preco
            ]);
        }

        $pedido = new Pedido([
            'usuario_id' => $usuarioId,
            'total' => $total,
            'status' => 'pendente'
        ]);

        $pedidoId = $this->pedidoRepository->criar($pedido);

        foreach ($itensPedido as $item) {
            $item->pedido_id = $pedidoId;
            $this->itemRepository->criar($item);
        }

        $this->carrinhoRepository->limparCarrinho($usuarioId);

        return $this->response(200, [
            'status' => 'success',
            'message' => 'Pedido finalizado com sucesso!',
            'pedido_id' => $pedidoId
        ]);
    }

    #[Route('/pedido/confirmar', 'POST')]
    public function confirmar()
    {
        if (!$this->isAuthenticated()) {
            return $this->response(401, [
                'status' => 'error',
                'message' => 'Usuário não autenticado.'
            ]);
        }

        $usuarioId = $_SESSION['userId'];

        $pedido = $this->pedidoRepository->buscarPedidoPendenteDoUsuario($usuarioId);

        if (!$pedido) {
            return $this->response(404, [
                'status' => 'error',
                'message' => 'Nenhum pedido pendente encontrado para confirmação.'
            ]);
        }

        $pedido->status = 'confirmado';
        $this->pedidoRepository->atualizarStatus($pedido->id, 'confirmado');

        return $this->response(200, [
            'status' => 'success',
            'message' => 'Pedido confirmado com sucesso.',
            'pedido_id' => $pedido->id
        ]);
    }

    #[Route('/pedido', 'GET')]
    public function listarPedidosDoUsuario()
    {
        if (!$this->isAuthenticated()) {
            return $this->response(401, [
                'status' => 'error',
                'message' => 'Usuário não autenticado.'
            ]);
        }

        $usuarioId = $_SESSION['userId'];
        $pedidos = $this->pedidoRepository->buscarPorUsuario($usuarioId);

        // Para cada pedido, busque os itens/livros
        foreach ($pedidos as &$pedido) {
            $pedidoId = is_object($pedido) ? $pedido->id : $pedido['id'];
            $itens = $this->itemRepository->buscarPorPedido($pedidoId);
            if (is_object($pedido)) {
                $pedido->itens = $itens;
            } else {
                $pedido['itens'] = $itens;
            }
        }

        return $this->response(200, [
            'status' => 'success',
            'data' => array_map(fn($p) => $p->toArray(), $pedidos)
        ]);
    }

    #[Route('/pedido/{id}', 'GET')]
    public function buscarPedidoCompleto(int $id)
    {
        if (!$this->isAuthenticated()) {
            return $this->response(401, [
                'status' => 'error',
                'message' => 'Usuário não autenticado.'
            ]);
        }

        $pedido = $this->pedidoRepository->buscarPedidoCompletoPorId($id);

        if (!$pedido) {
            return $this->response(404, [
                'status' => 'error',
                'message' => 'Pedido não encontrado.'
            ]);
        }

        return $this->response(200, [
            'status' => 'success',
            'data' => $pedido
        ]);
    }
}
