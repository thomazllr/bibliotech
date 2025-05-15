<?php
session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/cors.php';
if (isset($_SESSION['isLoggedIn']) && $_SESSION['isLoggedIn'] === true) {
    echo json_encode([
        'status' => 'success',
        'isLoggedIn' => true,
        'isAdmin' => $_SESSION['isAdmin'] ?? false,
        'userId' => $_SESSION['userId'] ?? null
    ]);
} else {
    echo json_encode([
        'status' => 'error',
        'isLoggedIn' => false,
        'message' => 'Usuário não está logado.'
    ]);
}
