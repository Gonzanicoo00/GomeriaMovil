<?php

namespace Gomeria\Core;

use Gomeria\Helpers\Response;

class Router
{
    private array $routes = [];
    private array $middlewareStack = [];

    public function get(string $path, callable $handler, array $middleware = []): void
    {
        $this->add('GET', $path, $handler, $middleware);
    }

    public function post(string $path, callable $handler, array $middleware = []): void
    {
        $this->add('POST', $path, $handler, $middleware);
    }

    public function put(string $path, callable $handler, array $middleware = []): void
    {
        $this->add('PUT', $path, $handler, $middleware);
    }

    public function delete(string $path, callable $handler, array $middleware = []): void
    {
        $this->add('DELETE', $path, $handler, $middleware);
    }

    private function add(string $method, string $path, callable $handler, array $middleware): void
    {
        $pattern = preg_replace('#\{[a-zA-Z_]+\}#', '([^/]+)', $path);
        $paramNames = [];
        preg_match_all('#\{([a-zA-Z_]+)\}#', $path, $matches);
        $paramNames = $matches[1];

        $this->routes[] = [
            'method' => $method,
            'pattern' => '#^' . $pattern . '$#',
            'paramNames' => $paramNames,
            'handler' => $handler,
            'middleware' => $middleware,
        ];
    }

    public function dispatch(string $method, string $uri): void
    {
        $path = parse_url($uri, PHP_URL_PATH);
        $basePath = $this->detectBasePath();

        if ($basePath !== '' && str_starts_with($path, $basePath)) {
            $path = substr($path, strlen($basePath));
        }

        $path = '/' . ltrim($path, '/');
        $path = rtrim($path, '/') ?: '/';

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            if (preg_match($route['pattern'], $path, $matches)) {
                array_shift($matches);
                $params = array_combine($route['paramNames'], $matches) ?: [];

                foreach ($route['middleware'] as $mw) {
                    $mw();
                }

                call_user_func($route['handler'], $params);
                return;
            }
        }

        Response::error('Recurso no encontrado', 404);
    }

    private function detectBasePath(): string
    {
        $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
        return rtrim(str_replace('\\', '/', dirname($scriptName)), '/');
    }
}
