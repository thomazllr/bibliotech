<?php
require_once __DIR__ . '/Route.php';


$controllerDir = __DIR__ . '/';
foreach (glob($controllerDir . '*.php') as $file) {
    if ($file !== __FILE__) {
        require_once $file;
    }
}

$basePath = '/bibliotech/api';
$requestPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Remove o prefixo base
if (str_starts_with($requestPath, $basePath)) {
    $requestPath = substr($requestPath, strlen($basePath));
    if ($requestPath === '') {
        $requestPath = '/';
    }
}

$requestMethod = $_SERVER['REQUEST_METHOD'];

$controllerClasses = get_declared_classes();
foreach ($controllerClasses as $class) {
    if (str_ends_with($class, 'Controller')) {
        $controller = new $class();
        $reflector = new ReflectionClass($controller);
        $methods = $reflector->getMethods();

        foreach ($methods as $method) {
            $attributes = $method->getAttributes(Route::class);
            foreach ($attributes as $attribute) {
                $route = $attribute->newInstance();
                if ($route->path === $requestPath && $requestMethod === $route->method) {
                    $method->invoke($controller);
                    exit;
                }
            }
        }
    }
}

http_response_code(404);
echo json_encode(['error' => 'Not found']);
