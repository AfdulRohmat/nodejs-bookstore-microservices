import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Book } from './entities/Book';
import dotenv from 'dotenv';
dotenv.config();

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: +(process.env.DB_PORT || 5432),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'password',
    database: process.env.DB_NAME || 'book_db',
    synchronize: true,      // false di production; gunakan migrations
    logging: false,
    entities: [Book],
    migrations: ['src/migrations/*.ts'],
});
