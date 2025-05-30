import { Request, Response } from 'express';
import { BookService } from '../services/book.service';

const bookService = new BookService();

export const getAll = async (req: Request, res: Response): Promise<void> => {
    // Ambil dan parse query params
    const page = parseInt(req.query.page as string) || undefined;
    const limit = parseInt(req.query.limit as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const token = req.headers.authorization as string | undefined;

    const result = await bookService.findAll({ page, limit, search, token });

    // Hitung totalPages
    const totalPages = Math.ceil(result.total / result.limit);

    res.json({
        data: result.items,
        meta: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages,
        },
    });
};

export const getById = async (req: Request, res: Response): Promise<void> => {
    const token = req.headers.authorization as string | undefined;
    const detail = await bookService.findByIdWithUser(req.params.id, token);
    if (!detail) {
        res.status(404).json({ message: 'Not found' });
        return;
    }
    res.json(detail);
};

export const create = async (req: Request, res: Response) => {
    const newBook = await bookService.create(req.body, (req as any).userId);
    res.status(201).json(newBook);
};

export const update = async (req: Request, res: Response) => {
    const updated = await bookService.update(req.params.id, req.body, (req as any).userId);
    if (!updated) {
        res.status(404).json({ message: 'Not found' });
        return;
    }
    res.json(updated);
};

export const softDelete = async (req: Request, res: Response) => {
    await bookService.softDelete(req.params.id, (req as any).userId);
    res.status(204).send();
};
