import express from 'express';
import db from '../db.json' assert { type: "json" };
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import cors from 'cors';

const dirname = path.dirname('./Backend');
const port: number = 3000;
const app = express();
app.use(express.json());

const corsOptions = {
   origin: '*',
   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
   credentials: true,
   preflightContinue: false,
   optionSuccessStatus: 200,
};

app.use(cors(corsOptions));

type Livro = {
   id: string;
   title: string;
   author: string;
   genre: string;
   status: Status;
   image: string;
   systemEntryDate: string;
   synopsis: string;
   rentHistory: RentHistory[];
}

type RentHistory = {
   studentName: string;
   class: string;
   title?: string;
   withdrawalDate: string;
   deliveryDate: string
}

type Status = {
   isRented: boolean;
   isActive: boolean;
   description: string;
}

//autenticar usuario
app.post('/login', cors(corsOptions), (request: any, response: any) => {
   const { email, password }: { email: string, password: string } = request.body;
   const loginIndex = db.login.findIndex(item =>
      item.email === email && item.password === password
   );

   if (loginIndex < 0) {
      return response.status(404).json({ error: 'Usuário ou senha inválidos' });
   } else {
      return response.status(200).json({ auth: true });
   }
})

//listar todos os livros
app.get('/books', function (request: any, response: any) {
   return response.status(200).json(db.books);
})

//listar um livro
app.get('/books/:id', function (request: any, response: any) {
   const { id } = request.params;
   const livroIndex = db.books.findIndex(item => item.id.toString() === id);

   if (livroIndex < 0) {
      return response.status(404).json({ error: 'Livro não encontrado' })
   }

   return response.status(200).json(db.books[livroIndex]);
})

//cadastrar novo livro
app.post('/books', function (request: any, response: any) {
   let novoLivro: Livro = request.body;
   novoLivro.id = uuidv4();

   db.books.push(novoLivro);
   fs.writeFileSync(path.join(dirname, "./db.json"), JSON.stringify(db, null, '\t'));

   return response.status(201).json(novoLivro);
})

//editar livro
app.patch('/books/:id', function (request: any, response: any) {
   const { id } = request.params;
   const { title, author, genre, image, systemEntryDate, synopsis }: Livro = request.body;

   const livroIndex = db.books.findIndex(item => item.id === id);

   if (livroIndex < 0) {
      return response.status(404).json({ error: 'Livro não encontrado' })
   }

   db.books[livroIndex].title = title;
   db.books[livroIndex].author = author;
   db.books[livroIndex].genre = genre;
   db.books[livroIndex].image = image;
   db.books[livroIndex].systemEntryDate = systemEntryDate;
   db.books[livroIndex].synopsis = synopsis;

   fs.writeFileSync(path.join(dirname, "./db.json"), JSON.stringify(db, null, '\t'));

   return response.status(201).json(db.books[livroIndex]);
})

//listar todos os historicos
app.get('/emprestimos', function (request: any, response: any) {
   let historicos: RentHistory[] = [];

   db.books.forEach(livro => {
      if (livro.rentHistory.length > 0) {
         livro.rentHistory.forEach(rent => {
            historicos.push(rent);
         })
      }
   })

   return response.status(200).json(historicos);
})

//listar historico de um livro
app.get('/emprestimos/:id', function (request: any, response: any) {
   const { id } = request.params;
   const livroIndex = db.books.findIndex(item => item.id.toString() === id);

   return response.status(200).json(db.books[livroIndex].rentHistory);
})

//emprestar livro
app.patch('/biblioteca/emprestar/:id', function (request: any, response: any, next: any) {
   const { id } = request.params;
   const livroIndex = db.books.findIndex(item => item.id.toString() === id);
   const novoEmprestimo: RentHistory = request.body;

   if (livroIndex < 0) {
      return response.status(404).json({ error: 'Livro não encontrado' })
   }

   db.books[livroIndex].status.isRented = true;
   db.books[livroIndex].rentHistory.push(novoEmprestimo);

   fs.writeFileSync(path.join(dirname, "./db.json"), JSON.stringify(db, null, '\t'));

   return response.status(200).json(db.books[livroIndex]);
})

//devolver livro
app.patch('/biblioteca/devolver/:id', function (request: any, response: any, next: any) {
   const { id } = request.params;
   const livroIndex = db.books.findIndex(item => item.id.toString() === id);

   if (livroIndex < 0) {
      return response.status(404).json({ error: 'Livro não encontrado' })
   }

   db.books[livroIndex].status.isRented = false;

   fs.writeFileSync(path.join(dirname, "./db.json"), JSON.stringify(db, null, '\t'));

   return response.status(200).json(db.books[livroIndex]);
})

//desativar livro
app.patch('/biblioteca/desativar/:id', function (request: any, response: any, next: any) {
   const { id } = request.params;
   const { description } = request.body;
   const livroIndex = db.books.findIndex(item => item.id.toString() === id);

   if (livroIndex < 0) {
      return response.status(404).json({ error: 'Livro não encontrado' })
   }

   if (description) {
      db.books[livroIndex].status.isActive = false;
      db.books[livroIndex].status.description = description;

      fs.writeFileSync(path.join(dirname, "./db.json"), JSON.stringify(db, null, '\t'));

      return response.status(200).json(db.books[livroIndex]);
   } else {
      return response.status(400).json({ error: "É necessário dar um motivo para a desativação" });
   }
})

//ativar livro
app.patch('/biblioteca/ativar/:id', function (request: any, response: any, next: any) {
   const { id } = request.params;
   const livroIndex = db.books.findIndex(item => item.id.toString() === id);

   if (livroIndex < 0) {
      return response.status(404).json({ error: 'Livro não encontrado' })
   }

   db.books[livroIndex].status.isActive = true;
   db.books[livroIndex].status.description = '';

   fs.writeFileSync(path.join(dirname, "./db.json"), JSON.stringify(db, null, '\t'));

   return response.status(200).json(db.books[livroIndex]);
})

app.listen(port, () => { console.log(`Servidor executado no port ${port}`) });