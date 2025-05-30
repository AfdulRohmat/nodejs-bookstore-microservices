import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';

export class AuthService {
    static async register(email: string, password: string, username: string) {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return { status: 400, data: { message: 'Email already exists' } };

        const hashed = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({ data: { email, password: hashed, username } });

        return { status: 201, data: { message: 'User created', user: { id: user.id, username: username, email: user.email } } };
    }

    static async login(email: string, password: string) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return { status: 401, data: { message: 'Invalid credentials' } };

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return { status: 401, data: { message: 'Invalid credentials' } };

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET as string, { expiresIn: '1h' });

        return { status: 200, data: { token } };
    }

    static async findById(id: string) {
        return prisma.user.findUnique({ where: { id } });
    }
}
