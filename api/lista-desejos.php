<?php
require_once __DIR__ . '/../db/Database.php';
require_once __DIR__ . '/../dao/ListaDesejosDAO.php';
require_once __DIR__ . '/cors.php';
header('Content-Type: application/json');

$pdo = Database::getInstance()->getConnection();
$dao = new ListaDesejosDAO($pdo);

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);

        if (isset($data['usuario_id'], $data['livro_id'])) {
            try {
                $dao->addBook($data['usuario_id'], $data['livro_id']);
                echo json_encode(['status' => 'success', 'message' => 'Livro adicionado com sucesso!']);
            } catch (PDOException $e) {
                if ($e->getCode() === '23000') {
                    http_response_code(409); // Conflito
                    echo json_encode(['status' => 'error', 'message' => 'Livro já está na lista de desejos.']);
                } else {
                    http_response_code(500);
                    echo json_encode(['status' => 'error', 'message' => 'Erro interno: ' . $e->getMessage()]);
                }
            }
        } else {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Parâmetros ausentes']);
        }
        break;

    case 'DELETE':
        parse_str(file_get_contents("php://input"), $data);

        if (isset($data['usuario_id'], $data['livro_id'])) {
            try {
                $result = $dao->removeBook($data['usuario_id'], $data['livro_id']);
                if ($result) {
                    echo json_encode(['status' => 'success', 'message' => 'Livro removido com sucesso!']);
                } else {
                    http_response_code(404);
                    echo json_encode(['status' => 'error', 'message' => 'Livro não encontrado na lista de desejos.']);
                }
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => 'Erro ao remover livro: ' . $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Parâmetros ausentes.']);
        }
        break;

    case 'GET':
        try {
            if (isset($_GET['usuario_id']) && isset($_GET['livro_id'])) {
                $existe = $dao->checkBook($_GET['usuario_id'], $_GET['livro_id']);
                echo json_encode([
                    'status' => 'success',
                    'exists' => $existe
                ]);
            } elseif (isset($_GET['usuario_id'])) {
                $livros = $dao->listBooks($_GET['usuario_id']);
                echo json_encode(['status' => 'success', 'data' => $livros]);
            } else {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'ID do usuário não fornecido.']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Erro ao buscar lista de desejos: ' . $e->getMessage()]);
        }
        break;


    default:
        http_response_code(405); // Método não permitido
        echo json_encode(['status' => 'error', 'message' => 'Método HTTP não suportado.']);
        break;
}
