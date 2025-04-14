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
                $paramNames = [];
                $pattern = preg_replace_callback('#\{(\w+)\}#', function ($matches) use (&$paramNames) {
                    $paramNames[] = $matches[1];
                    return '([^/]+)';
                }, $route->path);
                $pattern = "#^" . $pattern . "$#";

                if (preg_match($pattern, $requestPath, $matches) && $requestMethod === $route->method) {
                    array_shift($matches); // Remove o match completo
                    $params = [];

                    $refParams = $method->getParameters();
                    foreach ($refParams as $index => $param) {
                        $type = $param->getType()?->getName();
                        $value = $matches[$index] ?? null;

                        if ($type === 'int') {
                            if (!is_numeric($value)) {
                                continue 2; // pula para a próxima rota
                            }
                            $params[] = (int)$value;
                        } else {
                            $params[] = $value;
                        }
                    }

                    $method->invokeArgs($controller, $params);
                    exit;
                }
            }
        }
    }
}

http_response_code(404);
echo json_encode(['error' => 'Not found']);
