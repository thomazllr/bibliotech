<?php
require_once __DIR__ . '/../db/Database.php';
require_once __DIR__ . '/../dao/ExemploDAO.php';


header('Content-Type: application/json');

$pdo = Database::getInstance()->getConnection();
$dao = new ExemploDAO($pdo);
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGet($dao);
        break;
    case 'POST':
        handlePost($dao);
        break;
    default:
        http_response_code(405);
        echo json_encode(['erro' => 'Método não permitido']);
        break;
}

function handleGet(ExemploDAO $dao): void
{
    $dados = $dao->buscarTodos();
    echo json_encode($dados);
}

function handlePost(ExemploDAO $dao): void
{
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['nome']) || trim($data['nome']) === '') {
        http_response_code(400);
        echo json_encode(['erro' => 'Campo "nome" é obrigatório.']);
        return;
    }

    $exemplo = $dao->inserir($data['nome']);
    echo json_encode(['exemplo' => $exemplo]);
}
