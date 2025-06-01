// review-service/src/config/data-source.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Review } from '../entities/Review';
import dotenv from 'dotenv';
dotenv.config();

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    synchronize: true, // Di dev: biar otomatis buat tabel
    logging: false,
    entities: [Review],
});
