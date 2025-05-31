import express from 'express';
import dotenv from 'dotenv';
import { AppDataSource } from './config/data-source';
import bookRoutes from './routes/book.routes';

dotenv.config();

const app = express();
app.use(express.json());

app.use('/books', bookRoutes);

export default app;
