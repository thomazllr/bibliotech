<?php
require_once __DIR__ . '/../db/Database.php';
require_once __DIR__ . '/../dao/UsuarioDAO.php';
require_once __DIR__ . '/cors.php';

header('Content-Type: application/json');

try {
    $pdo = Database::getInstance()->getConnection();
    $dao = new UsuarioDAO($pdo);

    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['nome'], $data['email'], $data['senha'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Todos os campos são obrigatórios.']);
        exit;
    }

    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'E-mail inválido.']);
        exit;
    }

    if (strlen($data['senha']) < 6) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'A senha deve ter no mínimo 6 caracteres.']);
        exit;
    }

    if ($dao->getUsuarioByEmail($data['email'])) {
        http_response_code(409);
        echo json_encode(['status' => 'error', 'message' => 'Este e-mail já está em uso.']);
        exit;
    }

    $success = $dao->createUsuario([
        'nome' => $data['nome'],
        'email' => $data['email'],
        'senha' => $data['senha']
    ]);

    if ($success) {
        http_response_code(201);
        echo json_encode(['status' => 'success', 'message' => 'Usuário cadastrado com sucesso!']);
    } else {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Erro ao cadastrar usuário.']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erro inesperado no servidor.',
        'details' => $e->getMessage()
    ]);
}
