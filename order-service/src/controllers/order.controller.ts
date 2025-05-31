import { Request, Response } from 'express';
import { OrderService } from '../services/order.service';

const orderService = new OrderService();

export const createOrder = async (req: Request, res: Response) => {
    const token = req.headers.authorization as string | undefined;

    const userId = (req as any).userId as string;
    const { bookId, quantity } = req.body;
    const order = await orderService.create({ userId, bookId, quantity, token });
    res.status(201).json(order);
};

export const getOrders = async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const orders = await orderService.findAllByUser(userId);
    res.json(orders);
};

export const getOrderById = async (req: Request, res: Response) => {
    const order = await orderService.findById(req.params.id);
    if (!order) {
        res.status(404).json({ message: 'Not found' });
        return;
    }
    res.json(order);
};

export const updateOrder = async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const updated = await orderService.update(req.params.id, req.body, userId);
    if (!updated) {
        res.status(404).json({ message: 'Not found' });
        return;
    }
    res.json(updated);
};

export const deleteOrder = async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    await orderService.softDelete(req.params.id, userId);
    res.sendStatus(204);
};
