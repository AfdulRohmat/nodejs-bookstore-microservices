import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
    userId: string;
    iat: number;
    exp: number;
}

export const validateJWT = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Missing or invalid Authorization header' });
        return;
    }

    const token = authHeader.split(' ')[1];
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
        // simpan userId di request
        (req as any).userId = payload.userId;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid or expired token' });
        return;
    }
};
