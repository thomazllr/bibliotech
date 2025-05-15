<?php
require_once __DIR__ . '/../db/Database.php';
require_once __DIR__ . '/../dao/LivroDAO.php';
require_once __DIR__ . '/../dao/EditoraDAO.php';
require_once __DIR__ . '/../dao/GeneroDAO.php';
require_once __DIR__ . '/cors.php';
// Enable error reporting for debugging
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Define response variables
$responseCode = 200;
$responseData = [];
$pdo = null;

// Set content type header
header('Content-Type: application/json');

try {
    // Get a fresh connection for this request
    $pdo = Database::getInstance()->getConnection();
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false); // Ensure this is set

    $dao = new LivroDAO($pdo);
    $editoraDAO = new EditoraDAO($pdo);
    $generoDAO = new GeneroDAO($pdo);

    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);

            if (isset($data['titulo'], $data['autor'], $data['genero_id'], $data['preco'], $data['editora_id'], $data['descricao'], $data['imagem_url'])) {
                // Validate publisher_id
                if (!$editoraDAO->getEditoraById($data['editora_id'])) {
                    $responseCode = 400;
                    $responseData = ['status' => 'error', 'message' => 'Editora inválida.'];
                    break;
                }

                // Validate genero_id
                if (!$generoDAO->getGeneroById($data['genero_id'])) {
                    $responseCode = 400;
                    $responseData = ['status' => 'error', 'message' => 'Gênero inválido.'];
                    break;
                }

                $livro = $dao->createBook($data['titulo'], $data['autor'], $data['genero_id'], $data['preco'], $data['editora_id'], $data['descricao'], $data['imagem_url']);
                if ($livro) {
                    $responseCode = 201;
                    $responseData = ['status' => 'success', 'message' => 'Livro cadastrado com sucesso!'];
                } else {
                    $responseCode = 400;
                    $responseData = ['status' => 'error', 'message' => 'Erro ao cadastrar livro.'];
                }
            } else {
                $responseCode = 400;
                $responseData = ['status' => 'error', 'message' => 'Todos os campos são obrigatórios.'];
            }
            break;

        case 'GET':
            if (isset($_GET['id'])) {
                $id = intval($_GET['id']);
                $livro = $dao->getBookById($id);

                if ($livro) {
                    $responseCode = 200;
                    $responseData = ['status' => 'success', 'data' => $livro];
                } else {
                    $responseCode = 404;
                    $responseData = ['status' => 'error', 'message' => 'Livro não encontrado.'];
                }
            } else {
                $termo = isset($_GET['q']) ? $_GET['q'] : null;
                $genero_id = isset($_GET['genero_id']) ? intval($_GET['genero_id']) : null;
                $ordem = isset($_GET['ordem']) && in_array(strtoupper($_GET['ordem']), ['ASC', 'DESC']) ? strtoupper($_GET['ordem']) : 'DESC';

                $livros = $dao->searchBooks($termo, $genero_id, $ordem);

                $responseCode = 200;
                $responseData = ['status' => 'success', 'data' => $livros];
            }
            break;

        case 'DELETE':
            if (isset($_GET['id'])) {
                $id = intval($_GET['id']);
                $deleted = $dao->deleteBook($id);

                if ($deleted) {
                    $responseCode = 200;
                    $responseData = ['status' => 'success', 'message' => 'Livro excluído com sucesso!'];
                } else {
                    $responseCode = 404;
                    $responseData = ['status' => 'error', 'message' => 'Erro ao excluir o livro.'];
                }
            } else {
                $responseCode = 400;
                $responseData = ['status' => 'error', 'message' => 'ID do livro não fornecido.'];
            }
            break;

        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);

            if (isset($data['id'], $data['titulo'], $data['autor'], $data['genero_id'], $data['preco'], $data['editora_id'], $data['descricao'], $data['imagem_url'])) {
                // Validate publisher_id
                if (!$editoraDAO->getEditoraById($data['editora_id'])) {
                    $responseCode = 400;
                    $responseData = ['status' => 'error', 'message' => 'Editora inválida.'];
                    break;
                }

                // Validate genero_id
                if (!$generoDAO->getGeneroById($data['genero_id'])) {
                    $responseCode = 400;
                    $responseData = ['status' => 'error', 'message' => 'Gênero inválido.'];
                    break;
                }

                $updated = $dao->updateBook(
                    $data['id'],
                    $data['titulo'],
                    $data['autor'],
                    $data['genero_id'],
                    $data['preco'],
                    $data['editora_id'],
                    $data['descricao'],
                    $data['imagem_url']
                );

                if ($updated) {
                    $responseCode = 200;
                    $responseData = ['status' => 'success', 'message' => 'Livro atualizado com sucesso!'];
                } else {
                    $responseCode = 404;
                    $responseData = ['status' => 'error', 'message' => 'Erro ao atualizar o livro.'];
                }
            } else {
                $responseCode = 400;
                $responseData = ['status' => 'error', 'message' => 'Todos os campos, incluindo o ID, são obrigatórios.'];
            }
            break;

        default:
            $responseCode = 405;
            $responseData = ['status' => 'error', 'message' => 'Método HTTP não suportado.'];
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

// Set the HTTP response code
http_response_code($responseCode);

// Output the JSON response
echo json_encode($responseData);
exit;
