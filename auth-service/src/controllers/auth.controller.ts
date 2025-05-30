import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export const register = async (req: Request, res: Response) => {
  const { email, password, username } = req.body;
  const result = await AuthService.register(email, password, username);
  res.status(result.status).json(result.data);
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await AuthService.login(email, password);
  res.status(result.status).json(result.data);
};

export const getInfoUser = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const user = await AuthService.findById(userId);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  // kembalikan data sensitif minimal
  res.json({
    id: user.id,
    email: user.email,
    username: user.username,
    createdAt: user.createdAt,
    // modifiedAt: user.modifiedAt,
  });
};
