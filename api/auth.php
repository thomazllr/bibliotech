<?php
session_start();
require_once __DIR__ . '/../db/Database.php';
require_once __DIR__ . '/../dao/UsuarioDAO.php';
require_once __DIR__ . '/cors.php';

header('Content-Type: application/json');

$pdo = Database::getInstance()->getConnection();
$dao = new UsuarioDAO($pdo);

$data = json_decode(file_get_contents('php://input'), true);

if (isset($data['email']) && isset($data['senha'])) {
    $usuario = $dao->getUsuarioByEmail($data['email']);

    if ($usuario && password_verify($data['senha'], $usuario['senha'])) {
        $_SESSION['isLoggedIn'] = true;
        $_SESSION['isAdmin'] = $usuario['cargo_id'] == 2;
        $_SESSION['userId'] = $usuario['id'];

        echo json_encode([
            'status' => 'success',
            'message' => 'Login realizado com sucesso!',
            'is_admin' => $_SESSION['isAdmin']
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Email ou senha incorretos']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Email e senha são obrigatórios.']);
}
