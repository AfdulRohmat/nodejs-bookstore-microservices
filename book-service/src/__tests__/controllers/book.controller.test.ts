import { Request, Response } from 'express';
import { BookService } from '../../services/book.service';
import * as controller from '../../controllers/book.controller'; // adjust path if needed

// Create a minimal mock of Express’s Response object:
const mockResponse = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res as Response);
    res.json = jest.fn().mockReturnValue(res as Response);
    res.send = jest.fn().mockReturnValue(res as Response);
    return res as Response;
};

// Create a minimal mock of Express’s Request object:
const mockRequest = (overrides: Partial<Request>): Request => {
    return overrides as Request;
};

describe('BookController', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('getAll', () => {
        it('should respond with data and meta when service returns items', async () => {
            // 1) Arrange: stub BookService.findAll to resolve a known result
            const fakeResult = {
                items: [{ id: '1', title: 'A', author: 'X', createdAt: new Date(), modifiedAt: new Date(), deletedAt: undefined, createdBy: 'u', modifiedBy: undefined, deletedBy: null! }],
                total: 12,
                page: 2,
                limit: 5,
            };
            jest.spyOn(BookService.prototype, 'findAll')
                .mockResolvedValueOnce(fakeResult);

            // 2) Build a fake Request with query params and headers
            const req = mockRequest({
                query: { page: '2', limit: '5', search: 'test' },
                headers: { authorization: 'Bearer token-abc' },
            });
            const res = mockResponse();

            // 3) Act
            await controller.getAll(req, res);

            // 4) Assert: findAll was called with parsed params
            expect(BookService.prototype.findAll).toHaveBeenCalledWith({
                page: 2,
                limit: 5,
                search: 'test',
                token: 'Bearer token-abc',
            });

            // 5) Assert: totalPages = ceil(12 / 5) = 3
            expect(res.json).toHaveBeenCalledWith({
                data: fakeResult.items,
                meta: {
                    total: 12,
                    page: 2,
                    limit: 5,
                    totalPages: 3,
                },
            });
        });

        it('should default page/limit to undefined if parsing fails', async () => {
            // Arrange: return an empty result
            const fakeResult = { items: [], total: 0, page: 1, limit: 10 };
            jest.spyOn(BookService.prototype, 'findAll')
                .mockResolvedValueOnce(fakeResult);

            // Provide non-numeric or missing query strings
            const req = mockRequest({
                query: { page: 'abc', limit: 'xyz' },
                headers: {},
            });
            const res = mockResponse();

            // Act
            await controller.getAll(req, res);

            // Assert: findAll called with page and limit undefined
            expect(BookService.prototype.findAll).toHaveBeenCalledWith({
                page: undefined,
                limit: undefined,
                search: undefined,
                token: undefined,
            });

            expect(res.json).toHaveBeenCalledWith({
                data: [],
                meta: {
                    total: 0,
                    page: 1,
                    limit: 10,
                    totalPages: 0, // ceil(0/10) = 0
                },
            });
        });
    });

    describe('getById', () => {
        it('should return 404 if service returns null', async () => {
            jest.spyOn(BookService.prototype, 'findByIdWithUser')
                .mockResolvedValueOnce(null);

            const req = mockRequest({
                params: { id: 'not-found-id' },
                headers: { authorization: undefined },
            });
            const res = mockResponse();

            await controller.getById(req, res);

            expect(BookService.prototype.findByIdWithUser).toHaveBeenCalledWith('not-found-id', undefined);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Not found' });
        });

        it('should return 200 and the detail if service returns a book', async () => {
            const fakeDetail = {
                id: 'abc-123',
                title: 'Book Title',
                author: 'Author Name',
                createdAt: new Date(),
                modifiedAt: new Date(),
                deletedAt: undefined,
                createdBy: {
                    id: 'u1',
                    name: 'User One',
                    username: 'userone',         // added
                    email: 'userone@example.com' // added
                },
                modifiedBy: undefined,
                deletedBy: undefined,
            };
            jest
                .spyOn(BookService.prototype, 'findByIdWithUser')
                .mockResolvedValueOnce(fakeDetail as any);

            const req = mockRequest({
                params: { id: 'abc-123' },
                headers: { authorization: 'Bearer token-xyz' },
            });
            const res = mockResponse();

            await controller.getById(req, res);

            expect(BookService.prototype.findByIdWithUser).toHaveBeenCalledWith(
                'abc-123',
                'Bearer token-xyz'
            );
            expect(res.json).toHaveBeenCalledWith(fakeDetail);
        });

    });

    describe('create', () => {
        it('should return 201 and the newly created book', async () => {
            const newBookPayload = { title: 'New', author: 'Auth' };
            const fakeSavedBook = {
                id: 'new-1',
                title: 'New',
                author: 'Auth',
                createdAt: new Date(),
                modifiedAt: new Date(),
                deletedAt: undefined,
                createdBy: 'u123',
                modifiedBy: undefined,
                deletedBy: undefined,
            };
            jest.spyOn(BookService.prototype, 'create')
                .mockResolvedValueOnce(fakeSavedBook);

            // Attach userId on the request (from middleware in real life)
            const req = mockRequest({
                body: newBookPayload,
                headers: {},
                // Express's Request doesn’t normally have userId, so we cast here
                // (controller reads (req as any).userId)
                ...({ userId: 'u123' } as any),
            });
            const res = mockResponse();

            await controller.create(req, res);

            expect(BookService.prototype.create).toHaveBeenCalledWith(newBookPayload, 'u123');
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(fakeSavedBook);
        });
    });

    describe('update', () => {
        it('should return 404 if service.update returns null', async () => {
            jest.spyOn(BookService.prototype, 'update')
                .mockResolvedValueOnce(null as any);

            const req = mockRequest({
                params: { id: 'does-not-exist' },
                body: { title: 'New Title' },
                ...({ userId: 'u1' } as any),
            });
            const res = mockResponse();

            await controller.update(req, res);

            expect(BookService.prototype.update).toHaveBeenCalledWith('does-not-exist', { title: 'New Title' }, 'u1');
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Not found' });
        });

        it('should return 200 and the updated book when service.update succeeds', async () => {
            const updatedBook = {
                id: 'upd-1',
                title: 'Updated Title',
                author: 'Auth',
                createdAt: new Date(),
                modifiedAt: new Date(),
                deletedAt: undefined,
                createdBy: 'u1',
                modifiedBy: 'u1',
                deletedBy: undefined,
            };
            jest.spyOn(BookService.prototype, 'update')
                .mockResolvedValueOnce(updatedBook as any);

            const req = mockRequest({
                params: { id: 'upd-1' },
                body: { title: 'Updated Title' },
                ...({ userId: 'u1' } as any),
            });
            const res = mockResponse();

            await controller.update(req, res);

            expect(BookService.prototype.update).toHaveBeenCalledWith('upd-1', { title: 'Updated Title' }, 'u1');
            expect(res.json).toHaveBeenCalledWith(updatedBook);
        });
    });

    describe('softDelete', () => {
        it('should return 204 and no content', async () => {
            jest.spyOn(BookService.prototype, 'softDelete')
                .mockResolvedValueOnce(undefined as any);

            const req = mockRequest({
                params: { id: 'del-1' },
                ...({ userId: 'u1' } as any),
            });
            const res = mockResponse();

            await controller.softDelete(req, res);

            expect(BookService.prototype.softDelete).toHaveBeenCalledWith('del-1', 'u1');
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
        });
    });
});
