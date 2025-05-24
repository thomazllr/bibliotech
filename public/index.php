<?php

require_once __DIR__ . '/../routing/Route.php';
require_once __DIR__ . '/../routing/Router.php';
require_once __DIR__ . '/../controllers/LivroController.php';
require_once __DIR__ . '/../controllers/GeneroController.php';
require_once __DIR__ . '/../controllers/UsuarioController.php';
require_once __DIR__ . '/../controllers/ListaDesejoController.php';
require_once __DIR__ . '/../controllers/EditoraController.php';
require_once __DIR__ . '/../controllers/AuthController.php';
require_once __DIR__ . '/../controllers/CarrinhoController.php';
require_once __DIR__ . '/../controllers/PedidoController.php';
require_once __DIR__ . '/../db/Database.php';

$pdo = Database::getInstance()->getConnection();

$router = new Router();
$router->register(LivroController::class);
$router->register(GeneroController::class);
$router->register(UsuarioController::class);
$router->register(ListaDesejoController::class);
$router->register(EditoraController::class);
$router->register(AuthController::class);
$router->register(CarrinhoController::class);
$router->register(PedidoController::class);

$router->dispatch($_SERVER['REQUEST_URI'], $_SERVER['REQUEST_METHOD'], $pdo);
