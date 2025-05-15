<?php
session_start();
session_unset();
session_destroy();
require_once __DIR__ . '/cors.php';
header('Content-Type: application/json');
echo json_encode(['status' => 'success', 'message' => 'Logout realizado com sucesso.']);
