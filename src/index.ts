import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import multer from 'multer';
import z from 'zod';

import db from '../db.json' assert { type: "json" };
import { Livro, RentHistory } from './types';

const dirname = path.dirname('./Backend');
const storage = multer.diskStorage({
   destination: (req, file, cb) => {
      cb(null, path.join(dirname, './upload/'));
   },
   filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
   }
});

const upload = multer({ storage: storage });
const port = 3000;
const app = express();
app.use('./upload', express.static('upload'));
app.use(cors());
app.use(express.json());

//autenticar usuario
app.post('/login', (request, response) => {
   const { email, password }: { email: string, password: string } = request.body;

   const usuario = z.object({
      email: z.string().email().min(1),
      password: z.string().min(1)
   })
   const validacao = usuario.parse({
      email: email,
      password: password
   })

   const login = db.login.find(item =>
      item.email === email && item.password === password
   );

   if (!login) {
      return response.status(404).json({ error: 'Usuário ou senha inválidos' });
   }
   return response.json({ auth: true });
})

//mandar imagem
app.get('/upload/:filename', (request, response) => {
   return response.sendFile(`./upload/${request.params.filename}`, { root: dirname });
})

//listar todos os livros
app.get('/books', (request, response) => {
   db.books.sort((a, b) => a.title.localeCompare(b.title));
   return response.json(db.books);
})

//listar todos os generos
app.get('/books/generos', (request, response) => {
   let generos: string[] = Array.from(new Set(db.books.map(book => book.genre)))
      .sort((a, b) => a.localeCompare(b))
   return response.json(generos);
})

//listar um livro
app.get('/books/:id', (request, response) => {
   const { id } = request.params;
   const livro = db.books.find(item => item.id.toString() === id);

   if (!livro) {
      return response.status(404).json({ error: 'Livro não encontrado' })
   }
   return response.json(livro);
})

//cadastrar novo livro
app.post('/books', upload.single('image'), (request, response) => {
   const img = request.file;
   const { title, author, genre, systemEntryDate, synopsis }: Livro = JSON.parse(request.body.novoLivro);

   const livro = z.object({
      title: z.string().min(1),
      author: z.string().min(1),
      genre: z.string().min(1),
      image: z.string().min(1),
      systemEntryDate: z.string().min(1),
      synopsis: z.string().min(1)
   })
   const validacao = livro.parse({
      title: title,
      author: author,
      genre: genre,
      image: img ? img.filename : '',
      systemEntryDate: systemEntryDate,
      synopsis: synopsis
   })
   let novoLivro: Livro = {
      id: crypto.randomUUID(),
      title: validacao.title,
      author: validacao.author,
      genre: validacao.genre,
      status: { isRented: false, isActive: true, description: '' },
      image: validacao.image,
      systemEntryDate: validacao.systemEntryDate,
      synopsis: validacao.synopsis,
      rentHistory: []
   };

   db.books.push(novoLivro);
   fs.writeFileSync(path.join(dirname, "./db.json"), JSON.stringify(db, null, '\t'));

   return response.status(201).json(novoLivro);
})

//editar livro
app.patch('/books/:id', upload.single('image'), (request, response, next) => {
   const { id } = request.params;
   const img = request.file;
   const { title, author, genre, image, systemEntryDate, synopsis }: Livro = JSON.parse(request.body.newInfo);
   const livro = db.books.find(item => item.id.toString() === id);
   const livroIndex = db.books.findIndex(item => item.id.toString() === id);

   if (!livro) {
      return response.status(404).json({ error: 'Livro não encontrado' })
   }

   const livroValidar = z.object({
      title: z.string().min(1),
      author: z.string().min(1),
      genre: z.string().min(1),
      image: z.string().min(1),
      systemEntryDate: z.string().min(1),
      synopsis: z.string().min(1)
   })
   const validacao = livroValidar.parse({
      title: title,
      author: author,
      genre: genre,
      image: image,
      systemEntryDate: systemEntryDate,
      synopsis: synopsis
   })

   db.books[livroIndex].title = validacao.title;
   db.books[livroIndex].author = validacao.author;
   db.books[livroIndex].genre = validacao.genre;
   db.books[livroIndex].image = img ? img.filename : image;
   db.books[livroIndex].systemEntryDate = validacao.systemEntryDate;
   db.books[livroIndex].synopsis = validacao.synopsis;

   fs.writeFileSync(path.join(dirname, "./db.json"), JSON.stringify(db, null, '\t'));

   return response.status(201).json(db.books[livroIndex]);
})

//listar todos os historicos
app.get('/emprestimos', (request, response) => {
   let historicos: RentHistory[] = [];

   db.books.forEach(livro => {
      livro.rentHistory.forEach(rent => {
         historicos.push(rent);
      })
   })

   return response.json(historicos);
})

//listar historico de um livro
app.get('/emprestimos/:id', (request, response) => {
   const { id } = request.params;
   const livro = db.books.find(item => item.id.toString() === id);

   if (!livro) {
      return response.status(404).json({ error: 'Livro não encontrado' })
   }

   return response.json(livro.rentHistory);
})

//emprestar livro
app.patch('/biblioteca/emprestar/:id', (request, response, next) => {
   const { id } = request.params;
   const livro = db.books.find(item => item.id.toString() === id);
   const livroIndex = db.books.findIndex(item => item.id.toString() === id);
   const novoEmprestimo: RentHistory = request.body;

   if (!livro) {
      return response.status(404).json({ error: 'Livro não encontrado' })
   }
   if (livro.status.isRented) {
      return response.status(400).json({ error: 'Livro já emprestado' })
   }
   if (livro.status.isActive === false) {
      return response.status(400).json({ error: 'Livro inativo' })
   }

   const rentHistory = z.object({
      studentName: z.string().min(1),
      class: z.string().min(1),
      withdrawalDate: z.string().min(1),
      deliveryDate: z.string().min(1)
   })
   const validacao = rentHistory.parse({
      studentName: novoEmprestimo.studentName,
      class: novoEmprestimo.class,
      withdrawalDate: novoEmprestimo.withdrawalDate,
      deliveryDate: novoEmprestimo.deliveryDate
   })

   db.books[livroIndex].status.isRented = true;
   db.books[livroIndex].rentHistory.push({
      studentName: validacao.studentName,
      class: validacao.class,
      withdrawalDate: validacao.withdrawalDate,
      deliveryDate: validacao.deliveryDate
   });

   fs.writeFileSync(path.join(dirname, "./db.json"), JSON.stringify(db, null, '\t'));

   return response.json(db.books[livroIndex]);
})

//devolver livro
app.patch('/biblioteca/devolver/:id', (request, response, next) => {
   const { id } = request.params;
   const livro = db.books.find(item => item.id.toString() === id);
   const livroIndex = db.books.findIndex(item => item.id.toString() === id);

   if (!livro) {
      return response.status(404).json({ error: 'Livro não encontrado' })
   }
   if (livro.status.isRented === false) {
      return response.status(400).json({ error: 'Livro não está emprestado' })
   }

   db.books[livroIndex].status.isRented = false;
   fs.writeFileSync(path.join(dirname, "./db.json"), JSON.stringify(db, null, '\t'));

   return response.json(db.books[livroIndex]);
})

//desativar livro
app.patch('/biblioteca/desativar/:id', (request, response, next) => {
   const { id } = request.params;
   const { description } = request.body;
   const livro = db.books.find(item => item.id.toString() === id);
   const livroIndex = db.books.findIndex(item => item.id.toString() === id);

   if (!description) {
      return response.status(400).json({ error: 'É necessário dar um motivo para a desativação' });
   }
   if (!livro) {
      return response.status(404).json({ error: 'Livro não encontrado' })
   }

   const descr = z.object({
      description: z.string().min(10)
   })
   const validacao = descr.parse({
      description: description
   })

   db.books[livroIndex].status.isActive = false;
   db.books[livroIndex].status.description = validacao.description;

   fs.writeFileSync(path.join(dirname, "./db.json"), JSON.stringify(db, null, '\t'));

   return response.json(db.books[livroIndex]);
})

//ativar livro
app.patch('/biblioteca/ativar/:id', (request, response, next) => {
   const { id } = request.params;
   const livro = db.books.find(item => item.id.toString() === id);
   const livroIndex = db.books.findIndex(item => item.id.toString() === id);

   if (!livro) {
      return response.status(404).json({ error: 'Livro não encontrado' })
   }
   if (livro.status.isActive) {
      return response.status(400).json({ error: 'Livro já está ativado' })
   }

   db.books[livroIndex].status.isActive = true;
   db.books[livroIndex].status.description = '';

   fs.writeFileSync(path.join(dirname, "./db.json"), JSON.stringify(db, null, '\t'));

   return response.json(db.books[livroIndex]);
})

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
   if (res.headersSent) {
      return next(err);
   }
   console.error(err);
   res.status(500);
   res.send({ message: err.message });
});

app.listen(port, () => { console.log(`Servidor executado no port ${port}`) });