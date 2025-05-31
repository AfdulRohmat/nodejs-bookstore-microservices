import express from 'express';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes';

const app = express();
app.use(express.json());

// log format: :method :url :status :res[content-length] - :response-time ms
app.use(morgan('dev'));

app.use('/auth', authRoutes);

export default app;
