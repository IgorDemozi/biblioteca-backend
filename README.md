# Library (backend)

Este é o backend do projeto Library, onde são feitas as requisições e validações necessárias do projeto.

## Tecnologias usadas no projeto:

- TypeScript - usado para fazer a tipagem do código escrito em JavaScript, o que dá diversas vantagens ao escrever o código.
- Node - é um ambiente em tempo de execução open-source (código aberto) e multiplataforma que permite aos desenvolvedores criarem todo tipo de aplicativos e ferramentas do lado servidor (backend) em JavaScript.
- Express - um framework Node que permite a gerenciação de requisições HTTP em diferentes URLs.
- Cors - é um mecanismo usado para adicionar cabeçalhos HTTP que informam aos navegadores para permitir que uma aplicação Web seja executada em uma origem e acesse recursos de outra origem diferente.
- Fs - permite a interação com o sistema de arquivos, permitindo criar e alterar arquivos.
- Multer - é um middleware que internamente utiliza a lib busboy para lidar com formulários multipart/form-data. Usado para interceptar arquivos mandados em requisições para que o fs possa salvá-los.
- Nodemon - é uma biblioteca que ajuda no desenvolvimento de sistemas com o Node reiniciando automaticamente o servidor ao detectar mudanças no código.

## Como usar

Instalando as dependências do projeto.

```sh
npm i
```

Iniciando o servidor

```sh
npm start
```

O servidor irá rodar no port 3000 (http://localhost:3000/)

## Rotas

POST "/login" - autenticar usuario <br>
GET "/books" - listar todos os livros <br>
GET "/books/generos" - listar todos os generos <br>
GET "/books/:id" - listar um livro <br>
POST "/books" - cadastrar novo livro <br>
PATCH "/books/:id" - editar livro<br>
GET "/emprestimos" - listar todos os historicos de empréstimos <br>
GET "/emprestimos/:id" - listar o historico de um livro <br>
PATCH "/biblioteca/emprestar/:id" - emprestar livro <br>
PATCH "/biblioteca/devolver/:id" - devolver livro <br>
PATCH "/biblioteca/desativar/:id" - desativar livro <br>
PATCH "/biblioteca/ativar/:id" - ativar livro
