<?php
require_once __DIR__ . '/../db/Database.php';
require_once __DIR__ . '/../dao/GeneroDAO.php';
require_once __DIR__ . '/cors.php';
header('Content-Type: application/json');

$pdo = Database::getInstance()->getConnection();
$dao = new GeneroDAO($pdo);
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            if (isset($_GET['id'])) {
                $id = intval($_GET['id']);
                $genero = $dao->getGeneroById($id);
                if ($genero) {
                    http_response_code(200);
                    echo json_encode(['status' => 'success', 'data' => $genero]);
                } else {
                    http_response_code(404);
                    echo json_encode(['status' => 'error', 'message' => 'Gênero não encontrado.']);
                }
            } else {
                $generos = $dao->getAllGeneros();
                http_response_code(200);
                echo json_encode(['status' => 'success', 'data' => $generos]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Erro na requisição: ' . $e->getMessage()]);
        }
        break;
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        if (isset($data['nome'])) {
            $nome = $data['nome'];
            if ($dao->insertGenero($nome)) {
                http_response_code(201);
                echo json_encode(['status' => 'success', 'message' => 'Gênero inserido com sucesso!']);
            } else {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'Erro ao inserir gênero.']);
            }
        } else {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Nome do gênero é obrigatório.']);
        }
        break;
    case 'DELETE':
        if (isset($_GET['id'])) {
            $id = intval($_GET['id']);
            try {
                if ($dao->deleteGenero($id)) {
                    http_response_code(200);
                    echo json_encode(['status' => 'success', 'message' => 'Gênero excluído com sucesso!']);
                } else {
                    http_response_code(404);
                    echo json_encode(['status' => 'error', 'message' => 'Erro ao excluir gênero.']);
                }
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => 'Erro ao excluir: ' . $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'ID do gênero é obrigatório.']);
        }
        break;
    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Método não permitido.']);
        break;
}
