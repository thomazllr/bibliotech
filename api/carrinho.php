<?php
require_once __DIR__ . '/../db/Database.php';
require_once __DIR__ . '/../dao/CarrinhoDAO.php';
require_once __DIR__ . '/cors.php';
// Enable error reporting for debugging
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Set content type header
header('Content-Type: application/json');

// Initialize response variables
$responseCode = 200;
$responseData = [];
$pdo = null;

try {
    // Get a fresh connection for this request
    $pdo = Database::getInstance()->getConnection();
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false); // Ensure this is set

    $dao = new CarrinhoDAO($pdo);
    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);

            if (!isset($data['id'], $data['userId'], $data['quantidade'])) {
                $responseCode = 400; // Bad Request
                $responseData = ['status' => 'error', 'message' => 'Dados obrigatórios ausentes.'];
                break;
            }

            $livroId = (int) $data['id'];
            $userId = (int) $data['userId'];
            $quantidade = (int) $data['quantidade'];

            if ($livroId <= 0 || $userId <= 0 || $quantidade <= 0) {
                $responseCode = 400; // Bad Request
                $responseData = ['status' => 'error', 'message' => 'ID e quantidade devem ser maiores que zero.'];
                break;
            }

            $result = $dao->addItem($livroId, $userId, $quantidade);
            if ($result) {
                $responseCode = 200; // OK
                $responseData = [
                    'status' => 'success',
                    'message' => 'Livro adicionado ao carrinho com sucesso!'
                ];
            } else {
                $responseCode = 400; // Bad Request
                $responseData = [
                    'status' => 'error',
                    'message' => 'Erro ao adicionar livro ao carrinho.'
                ];
            }
            break;

        case 'GET':
            if (!isset($_GET['userId'])) {
                $responseCode = 400; // Bad Request
                $responseData = ['status' => 'error', 'message' => 'ID do usuário é obrigatório.'];
                break;
            }

            $userId = (int) $_GET['userId'];
            if ($userId <= 0) {
                $responseCode = 400; // Bad Request
                $responseData = ['status' => 'error', 'message' => 'ID de usuário inválido.'];
                break;
            }

            $carrinho = $dao->getCarrinhoPorUsuario($userId);
            $responseCode = 200; // OK
            $responseData = ['status' => 'success', 'data' => $carrinho];
            break;

        case 'DELETE':
            $data = json_decode(file_get_contents("php://input"), true);

            if (!isset($data['id'], $data['userId'])) {
                $responseCode = 400; // Bad Request
                $responseData = ['status' => 'error', 'message' => 'ID do livro e do usuário são obrigatórios.'];
                break;
            }

            $livroId = (int) $data['id'];
            $userId = (int) $data['userId'];

            if ($livroId <= 0 || $userId <= 0) {
                $responseCode = 400; // Bad Request
                $responseData = ['status' => 'error', 'message' => 'IDs inválidos.'];
                break;
            }

            $result = $dao->removeItem($livroId, $userId);
            if ($result) {
                $responseCode = 200; // OK
                $responseData = [
                    'status' => 'success',
                    'message' => 'Livro removido do carrinho com sucesso!'
                ];
            } else {
                $responseCode = 404; // Not Found
                $responseData = [
                    'status' => 'error',
                    'message' => 'Erro ao remover livro do carrinho.'
                ];
            }
            break;

        case 'PUT':
            $data = json_decode(file_get_contents("php://input"), true);

            if (!isset($data['id'], $data['userId'], $data['quantidade'])) {
                $responseCode = 400; // Bad Request
                $responseData = ['status' => 'error', 'message' => 'Parâmetros obrigatórios ausentes.'];
                break;
            }

            $livroId = (int) $data['id'];
            $userId = (int) $data['userId'];
            $quantidade = (int) $data['quantidade'];

            if ($livroId <= 0 || $userId <= 0 || $quantidade <= 0) {
                $responseCode = 400; // Bad Request
                $responseData = ['status' => 'error', 'message' => 'ID e quantidade devem ser maiores que zero.'];
                break;
            }

            $result = $dao->atualizarQuantidade($livroId, $userId, $quantidade);
            if ($result) {
                $responseCode = 200; // OK
                $responseData = [
                    'status' => 'success',
                    'message' => 'Quantidade atualizada com sucesso.'
                ];
            } else {
                $responseCode = 404; // Not Found
                $responseData = [
                    'status' => 'error',
                    'message' => 'Falha ao atualizar quantidade.'
                ];
            }
            break;

        default:
            $responseCode = 405; // Method Not Allowed
            $responseData = ['status' => 'error', 'message' => 'Método não permitido.'];
            break;
    }
} catch (PDOException $e) {
    // Close any open cursor/connection before returning error
    if (isset($stmt) && $stmt instanceof PDOStatement) {
        $stmt->closeCursor();
    }

    $responseCode = 500;
    $responseData = [
        'status' => 'error',
        'message' => 'Erro na base de dados: ' . $e->getMessage(),
        'code' => $e->getCode(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ];
} catch (Exception $e) {
    $responseCode = 500;
    $responseData = [
        'status' => 'error',
        'message' => 'Erro na requisição: ' . $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ];
} finally {
    // Ensure all statement cursors are closed
    if (isset($pdo) && $pdo instanceof PDO) {
        // Close any active prepared statements
        try {
            $query = "DEALLOCATE ALL";
            $pdo->query($query);
        } catch (Exception $e) {
            // Ignore if this fails
        }
    }
}

// Set the HTTP response code and output the JSON response
http_response_code($responseCode);
echo json_encode($responseData);
exit;
