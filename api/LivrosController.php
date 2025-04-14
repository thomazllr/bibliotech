<?php
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

    #[Route('/livros/{id}', method: 'GET')]
    public function obterLivro(int $id)
    {

        $livros = [
            new Livro('Dom Casmurro', 'Machado de Assis'),
            new Livro('1984', 'George Orwell'),
            new Livro('O Hobbit', 'J.R.R. Tolkien')
        ];


        $id--; // ajusta para índice 0-based
        if (isset($livros[$id])) {
            echo json_encode($livros[$id], JSON_UNESCAPED_UNICODE);
        } else {
            http_response_code(404);
            echo json_encode(['erro' => 'Livro não encontrado']);
        }
    }


    #[Route('/livros', method: 'GET')]
    public function listarTodosLivros()
    {
        $livros = [
            new Livro('Dom Casmurro', 'Machado de Assis'),
            new Livro('1984', 'George Orwell'),
            new Livro('O Hobbit', 'J.R.R. Tolkien')
        ];

        echo json_encode($livros, JSON_UNESCAPED_UNICODE);
    }
}
