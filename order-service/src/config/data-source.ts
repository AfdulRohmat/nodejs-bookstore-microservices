// src/config/data-source.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Order } from '../entities/Order';
import dotenv from 'dotenv';
dotenv.config();

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: +process.env.DB_PORT!,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    synchronize: true,   // untuk dev; nanti di-prod pakai migrations
    logging: false,
    entities: [Order],
});
