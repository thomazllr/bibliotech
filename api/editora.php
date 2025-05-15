<?php
require_once __DIR__ . '/../db/Database.php';
require_once __DIR__ . '/../dao/EditoraDAO.php';
require_once __DIR__ . '/cors.php';
// Enable error reporting for debugging
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Set content type header
header('Content-Type: application/json');

// Initialize response variables
$responseCode = 200;
$responseData = [];
$db = null;

try {
    // Get a fresh connection for this request
    $db = Database::getInstance()->getConnection();
    $db->setAttribute(PDO::ATTR_EMULATE_PREPARES, false); // Ensure this is set

    $editoraDAO = new EditoraDAO($db);

    // Get request method
    $method = $_SERVER['REQUEST_METHOD'];

    // Handle different HTTP methods
    switch ($method) {
        case 'GET':
            // If ID is provided, get specific publisher
            if (isset($_GET['id'])) {
                $editora = $editoraDAO->getEditoraById($_GET['id']);
                if ($editora) {
                    $responseData = ['success' => true, 'data' => $editora];
                } else {
                    $responseCode = 404;
                    $responseData = ['success' => false, 'message' => 'Editora não encontrada'];
                }
            } else {
                // Otherwise get all publishers
                $editoras = $editoraDAO->getAllEditoras();
                $responseData = ['success' => true, 'data' => $editoras];
            }
            break;

        case 'POST':
            // Create a new publisher
            $data = json_decode(file_get_contents('php://input'), true);

            if (empty($data['nome'])) {
                $responseCode = 400;
                $responseData = ['success' => false, 'message' => 'Nome da editora é obrigatório'];
                break;
            }

            $id = $editoraDAO->createEditora($data['nome']);
            $responseData = ['success' => true, 'message' => 'Editora cadastrada com sucesso', 'id' => $id];
            break;

        case 'PUT':
            // Update an existing publisher
            $data = json_decode(file_get_contents('php://input'), true);

            if (empty($data['id']) || empty($data['nome'])) {
                $responseCode = 400;
                $responseData = ['success' => false, 'message' => 'ID e nome da editora são obrigatórios'];
                break;
            }

            $result = $editoraDAO->updateEditora($data['id'], $data['nome']);
            if ($result) {
                $responseData = ['success' => true, 'message' => 'Editora atualizada com sucesso'];
            } else {
                $responseCode = 404;
                $responseData = ['success' => false, 'message' => 'Editora não encontrada'];
            }
            break;

        case 'DELETE':
            // Delete a publisher
            $data = json_decode(file_get_contents('php://input'), true);

            if (empty($data['id'])) {
                $responseCode = 400;
                $responseData = ['success' => false, 'message' => 'ID da editora é obrigatório'];
                break;
            }

            $result = $editoraDAO->deleteEditora($data['id']);
            $responseData = ['success' => true, 'message' => 'Editora removida com sucesso'];
            break;

        default:
            $responseCode = 405;
            $responseData = ['success' => false, 'message' => 'Método não permitido'];
            break;
    }
} catch (PDOException $e) {
    // Close any open cursor/connection before returning error
    if (isset($stmt) && $stmt instanceof PDOStatement) {
        $stmt->closeCursor();
    }

    $responseCode = 500;
    $responseData = [
        'success' => false,
        'message' => 'Erro na base de dados: ' . $e->getMessage(),
        'code' => $e->getCode(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ];
} catch (Exception $e) {
    $responseCode = 500;
    $responseData = [
        'success' => false,
        'message' => 'Erro na requisição: ' . $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ];
} finally {
    // Ensure all statement cursors are closed
    if (isset($db) && $db instanceof PDO) {
        // Close any active prepared statements
        try {
            $query = "DEALLOCATE ALL";
            $db->query($query);
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
