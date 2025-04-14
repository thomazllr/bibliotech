<?php
// src/Controllers/LivroController.php
require_once __DIR__ . '/Route.php';

header('Content-Type: application/json');

class Livro
{
    public string $titulo;
    public string $autor;

    public function __construct(string $titulo, string $autor)
    {
        $this->titulo = $titulo;
        $this->autor = $autor;
    }

    public function jsonSerialize(): mixed
    {
        return [
            'titulo' => $this->titulo,
            'autor' => $this->autor
        ];
    }
}

class LivroController
{
    #[Route('/livros', method: 'GET')]
    public function listarLivros()
    {
        echo json_encode(['livros' => ['Dom Casmurro', '1984', 'O Hobbit']]);
    }


    #[Route('/livros/todos', method: 'GET')]
    public function listarTodosLivros()
    {
        $livros = [
            new Livro('Dom Casmurro', 'Machado de Assis'),
            new Livro('1984', 'George Orwell'),
            new Livro('O Hobbit', 'J.R.R. Tolkien'),
            new Livro('Grande Sertão: Veredas', 'João Guimarães Rosa'),
            new Livro('A Revolução dos Bichos', 'George Orwell')
        ];

        echo json_encode($livros, JSON_UNESCAPED_UNICODE);
    }
}
