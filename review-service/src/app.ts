// review-service/src/app.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { json } from 'body-parser';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { typeDefs } from './graphql/typeDefs';
import { resolvers } from './graphql/resolvers';
dotenv.config();

export async function createServer() {
    const app = express();

    // 1) Middleware umum
    app.use(cors());
    app.use(json());

    // 2) Inisialisasi ApolloServer
    const server = new ApolloServer<{ userId: string | null; token: string | null }>({
        typeDefs,
        resolvers,
    });
    await server.start();

    // 3) Middleware khusus untuk /graphql
    app.use(
        '/graphql',

        // a) Middleware Express untuk ekstrak token & userId
        (req: Request, res: Response, next: NextFunction) => {
            const authHeader = req.headers.authorization || '';
            if (authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                try {
                    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
                    (req as any).userId = payload.userId;
                    (req as any).token = token;     
                } catch {
                    (req as any).userId = null;
                    (req as any).token = null;
                }
            } else {
                (req as any).userId = null;
                (req as any).token = null;
            }
            next();
        },

        // b) expressMiddleware dari @apollo/server/express4
        expressMiddleware(server, {
            context: async ({ req }) => {
                return {
                    userId: (req as any).userId,
                    token: (req as any).token,
                };
            },
        })
    );

    return app;
}