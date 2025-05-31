import { Repository, IsNull, ILike } from 'typeorm';
import { Book } from '../entities/Book';
import { AppDataSource } from '../config/data-source';
import { logger } from '../utils/logger';
import axios from 'axios';

export interface BookListParams {
    page?: number;
    limit?: number;
    search?: string;
    token?: string;
}

export class BookService {
    private bookRepository: Repository<Book>;
    private authUrl = process.env.AUTH_URL || 'http://localhost:5001';

    constructor() {
        this.bookRepository = AppDataSource.getRepository(Book);
    }

    async findAll(params: BookListParams) {
        const page = params.page && params.page > 0 ? params.page : 1;
        const limit = params.limit && params.limit > 0 ? params.limit : 10;
        const search = params.search?.trim();
        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = { deletedAt: null };
        if (search) {
            where['title'] = ILike(`%${search}%`);
            where['author'] = ILike(`%${search}%`);
            // Untuk OR-condition gunakan QueryBuilder
            const [items, total] = await this.bookRepository
                .createQueryBuilder('book')
                .where('book.deleted_at IS NULL')
                .andWhere(
                    '(book.title ILIKE :search OR book.author ILIKE :search)',
                    { search: `%${search}%` }
                )
                .skip(skip)
                .take(limit)
                .getManyAndCount();
            return { items, total, page, limit };
        }

        // Tanpa search: simple findAndCount
        const [items, total] = await this.bookRepository.findAndCount({
            where,
            skip,
            take: limit,
            order: { createdAt: 'DESC' },
        });

        return { items, total, page, limit };
    }



    findById(id: string) {
        return this.bookRepository.findOne({ where: { id, deletedAt: IsNull() } });
    }

    async findByIdWithUser(id: string, token?: string) {
        // Ambil book
        const book = await this.bookRepository.findOne({ where: { id, deletedAt: IsNull() } });
        if (!book) return null;

        // Ambil user detail jika ada createdBy
        let creator: UserDTO | null = null;
        if (book.createdBy && token) {
            try {
                const resp = await axios.get<UserDTO>(
                    `${this.authUrl}/auth/users/${book.createdBy}`,
                    { headers: { Authorization: token } }
                );
                console.log(resp);
                creator = resp.data;
            } catch {
                creator = null; // silakan log jika perlu
                console.log("gagal ambil data user")
            }
        }

        return {
            ...book,
            createdBy: creator,
            modifiedBy: book.modifiedBy,
            deletedBy: book.deletedBy,
        };
    }

    create(data: Partial<Book>, currentUserId?: string) {
        const book = this.bookRepository.create({
            ...data,
            createdBy: currentUserId,
        });
        return this.bookRepository.save(book);
    }

    async update(id: string, data: Partial<Book>, currentUserId?: string) {
        await this.bookRepository.update(id, {
            ...data,
            modifiedBy: currentUserId,
        });
        return this.findById(id);
    }

    softDelete(id: string, currentUserId?: string) {
        return this.bookRepository.softDelete({ id });
    }
}
