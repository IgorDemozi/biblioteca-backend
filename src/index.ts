import express from 'express';
import db from '../db.json' assert { type: "json" };
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { Livro, RentHistory } from './types';
import multer from 'multer';

const dirname = path.dirname('./Backend');
const storage = multer.diskStorage({
   destination: (req: any, file: any, cb: any) => {
      cb(null, path.join(dirname, './upload/'));
   },
   filename: (req: any, file: any, cb: any) => {
      cb(null, `${Date.now()}-${file.originalname}`);
   }
});

const upload = multer({ storage: storage });
const port: number = 3000;
const app = express();
app.use('./upload', express.static('upload'));
app.use(cors());
app.use(express.json());

//autenticar usuario
app.post('/login', (request: any, response: any) => {
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

app.get('/upload/:filename', (request: any, response: any) => {
   return response.sendFile(`./upload/${request.params.filename}`, { root: dirname });
})

//listar todos os livros
app.get('/books', (request: any, response: any) => {
   db.books.sort((a, b) => a.title.localeCompare(b.title));
   return response.status(200).json(db.books);
})

//listar todos os generos
app.get('/books/generos', (request: any, response: any) => {
   let generos: string[] = [];

   db.books.forEach(item => {
      if (generos.includes(item.genre)) {
         return null
      } else {
         generos.push(item.genre);
      }
   });
   generos.sort((a, b) => a.localeCompare(b));
   return response.status(200).json(generos);
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
app.post('/books', upload.single('image'), (request: any, response: any) => {
   const img = request.file;
   let novoLivro: Livro = JSON.parse(request.body.novoLivro);
   novoLivro.id = crypto.randomUUID();
   novoLivro.image = img ? img.filename : novoLivro.image;

   db.books.push(novoLivro);
   fs.writeFileSync(path.join(dirname, "./db.json"), JSON.stringify(db, null, '\t'));

   return response.status(201).json(novoLivro);
})

//editar livro
app.patch('/books/:id', upload.single('image'), (request: any, response: any) => {
   const { id } = request.params;
   const img = request.file;
   const { title, author, genre, image, systemEntryDate, synopsis }: Livro = JSON.parse(request.body.newInfo);

   const livroIndex = db.books.findIndex(item => item.id.toString() === id);

   if (livroIndex < 0) {
      return response.status(404).json({ error: 'Livro não encontrado' })
   }

   db.books[livroIndex].title = title;
   db.books[livroIndex].author = author;
   db.books[livroIndex].genre = genre;
   db.books[livroIndex].image = img ? img.filename : image;
   db.books[livroIndex].systemEntryDate = systemEntryDate;
   db.books[livroIndex].synopsis = synopsis;

   fs.writeFileSync(path.join(dirname, "./db.json"), JSON.stringify(db, null, '\t'));

   return response.status(201).json(db.books[livroIndex]);
})

//listar todos os historicos
app.get('/emprestimos', (request: any, response: any) => {
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
app.patch('/biblioteca/emprestar/:id', (request: any, response: any, next: any) => {
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
app.patch('/biblioteca/devolver/:id', (request: any, response: any, next: any) => {
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