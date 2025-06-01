// src/__tests__/services/book.service.test.ts
import { BookService, BookListParams } from '../../services/book.service';
import { Book } from '../../entities/Book';
import { AppDataSource } from '../../config/data-source';
import axios from 'axios';


// --- 1) Create mocks for repository methods used across all tests: ---
let mockFindAndCount: jest.Mock<Promise<[Book[], number]>, any[]>;
let mockCreateQueryBuilder: jest.Mock<FakeQB, [string]>;
let mockFindOne: jest.Mock<Promise<Book | null>, any[]>;
let mockCreate: jest.Mock<Book, [Partial<Book>]>;
let mockSave: jest.Mock<Promise<Book>, any[]>;
let mockUpdate: jest.Mock<Promise<any>, any[]>;
let mockSoftDelete: jest.Mock<Promise<any>, any[]>;

// --- 2) Build a “fake” QueryBuilder type and helper: ---
type FakeQB = {
    where: jest.Mock<FakeQB, [string]>;
    andWhere: jest.Mock<FakeQB, [string, any]>;
    skip: jest.Mock<FakeQB, [number]>;
    take: jest.Mock<FakeQB, [number]>;
    getManyAndCount: jest.Mock<Promise<[Book[], number]>, []>;
};
const buildFakeQueryBuilder = (): FakeQB => {
    return {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn<Promise<[Book[], number]>, []>(),
    };
};

// --- 3) Mock axios globally so no real HTTP calls happen in findByIdWithUser: ---
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('BookService (all methods)', () => {
    let service: BookService;
    let repoMock: {
        findAndCount: typeof mockFindAndCount;
        createQueryBuilder: typeof mockCreateQueryBuilder;
        findOne: typeof mockFindOne;
        create: typeof mockCreate;
        save: typeof mockSave;
        update: typeof mockUpdate;
        softDelete: typeof mockSoftDelete;
    };

    beforeEach(() => {
        // --- 4) Reset & recreate our repository-method mocks before each test:
        mockFindAndCount = jest.fn<Promise<[Book[], number]>, any[]>();
        mockCreateQueryBuilder = jest.fn<FakeQB, [string]>();
        mockFindOne = jest.fn<Promise<Book | null>, any[]>();
        mockCreate = jest.fn<Book, [Partial<Book>]>();
        mockSave = jest.fn<Promise<Book>, any[]>();
        mockUpdate = jest.fn<Promise<any>, any[]>();
        mockSoftDelete = jest.fn<Promise<any>, any[]>();

        // --- 5) Build the “repoMock” object with all methods:
        repoMock = {
            findAndCount: mockFindAndCount,
            createQueryBuilder: mockCreateQueryBuilder,
            findOne: mockFindOne,
            create: mockCreate,
            save: mockSave,
            update: mockUpdate,
            softDelete: mockSoftDelete,
        };

        // --- 6) Spy on AppDataSource.getRepository(...) to return our repoMock:
        jest.spyOn(AppDataSource, 'getRepository').mockReturnValue(repoMock as any);

        // --- 7) Finally, instantiate BookService (it picks up repoMock internally):
        service = new BookService();
    });

    afterEach(() => {
        // Restore spied methods so they don't leak into other tests:
        jest.restoreAllMocks();
    });

    //
    // ======= EXISTING findAll() TESTS =======
    //
    describe('findAll()', () => {
        it('should return items & total by calling findAndCount when no search term is provided', async () => {
            const dummyBooks: Book[] = [
                {
                    id: 'uuid-1',
                    title: 'Test Book One',
                    author: 'Author A',
                    createdAt: new Date('2025-01-01T00:00:00Z'),
                    modifiedAt: new Date('2025-01-02T00:00:00Z'),
                    deletedAt: null!,
                    createdBy: 'user-123',
                    modifiedBy: null!,
                    deletedBy: null!,
                },
            ];
            mockFindAndCount.mockResolvedValueOnce([dummyBooks, 1]);

            const params: BookListParams = { page: 1, limit: 5 };
            const result = await service.findAll(params);

            expect(mockFindAndCount).toHaveBeenCalledWith({
                where: { deletedAt: null! },
                skip: 0,
                take: 5,
                order: { createdAt: 'DESC' },
            });
            expect(result).toEqual({
                items: dummyBooks,
                total: 1,
                page: 1,
                limit: 5,
            });
        });

        it('should apply ILIKE search logic via createQueryBuilder when search term is provided', async () => {
            const dummyBooks: Book[] = [
                {
                    id: 'uuid-2',
                    title: 'Searchable Book',
                    author: 'Author B',
                    createdAt: new Date('2025-02-01T00:00:00Z'),
                    modifiedAt: new Date('2025-02-02T00:00:00Z'),
                    deletedAt: null!,
                    createdBy: 'user-456',
                    modifiedBy: null!,
                    deletedBy: null!,
                },
            ];
            const totalCount = 1;

            const fakeQB = buildFakeQueryBuilder();
            fakeQB.getManyAndCount.mockResolvedValueOnce([dummyBooks, totalCount]);
            mockCreateQueryBuilder.mockReturnValueOnce(fakeQB);

            const params: BookListParams = { page: 2, limit: 3, search: ' searchTerm ' };
            const result = await service.findAll(params);

            expect(mockCreateQueryBuilder).toHaveBeenCalledWith('book');
            expect(fakeQB.where).toHaveBeenCalledWith('book.deleted_at IS NULL');
            expect(fakeQB.andWhere).toHaveBeenCalledWith(
                '(book.title ILIKE :search OR book.author ILIKE :search)',
                { search: `%searchTerm%` }
            );
            expect(fakeQB.skip).toHaveBeenCalledWith(3);
            expect(fakeQB.take).toHaveBeenCalledWith(3);
            expect(fakeQB.getManyAndCount).toHaveBeenCalled();

            expect(result).toEqual({
                items: dummyBooks,
                total: totalCount,
                page: 2,
                limit: 3,
            });
        });

        it('should throw an error when findAndCount rejects', async () => {
            mockFindAndCount.mockRejectedValueOnce(new Error('Database failure'));

            await expect(service.findAll({ page: 1, limit: 5 })).rejects.toThrow('Database failure');
        });
    });

    //
    // ======= NEW TESTS FOR OTHER METHODS =======
    //

    describe('findById()', () => {
        it('should return a Book when findOne resolves to an entity', async () => {
            const dummyBook: Book = {
                id: 'uuid-10',
                title: 'Found Book',
                author: 'Some Author',
                createdAt: new Date(),
                modifiedAt: new Date(),
                deletedAt: null!,
                createdBy: 'creator-1',
                modifiedBy: null!,
                deletedBy: null!,
            };
            mockFindOne.mockResolvedValueOnce(dummyBook);

            const result = await service.findById('uuid-10');
            expect(mockFindOne).toHaveBeenCalledWith({
                where: { id: 'uuid-10', deletedAt: expect.any(Object) },
            });
            expect(result).toEqual(dummyBook);
        });

        it('should return null! when findOne resolves to null!', async () => {
            mockFindOne.mockResolvedValueOnce(null!);

            const result = await service.findById('nonexistent-id');
            expect(mockFindOne).toHaveBeenCalledWith({
                where: { id: 'nonexistent-id', deletedAt: expect.any(Object) },
            });
            expect(result).toBeNull!();
        });
    });

    describe('findByIdWithUser()', () => {
        it('should return null! when no Book is found', async () => {
            mockFindOne.mockResolvedValueOnce(null!);

            const result = await service.findByIdWithUser('missing-id', 'any-token');
            expect(mockFindOne).toHaveBeenCalledWith({
                where: { id: 'missing-id', deletedAt: expect.any(Object) },
            });
            expect(result).toBeNull!();
        });

        it('should return Book with createdBy = null! when Book.createdBy is undefined', async () => {
            // Book has no createdBy (undefined), so it should skip axios.call:
            const dummyBook: Book = {
                id: 'uuid-20',
                title: 'No-Creator Book',
                author: 'Author X',
                createdAt: new Date(),
                modifiedAt: new Date(),
                deletedAt: null!,
                createdBy: undefined,
                modifiedBy: 'modifier-1',
                deletedBy: null!,
            };
            mockFindOne.mockResolvedValueOnce(dummyBook);

            const result = await service.findByIdWithUser('uuid-20', 'some-token');
            expect(mockFindOne).toHaveBeenCalledWith({
                where: { id: 'uuid-20', deletedAt: expect.any(Object) },
            });

            // createdBy was undefined, so no axios.get call:
            expect(mockedAxios.get).not.toHaveBeenCalled();

            expect(result).toEqual({
                ...dummyBook,
                createdBy: null!,
                modifiedBy: dummyBook.modifiedBy,
                deletedBy: dummyBook.deletedBy,
            });
        });

        it('should return Book with creator data when Book.createdBy exists and axios succeeds', async () => {
            const dummyBook: Book = {
                id: 'uuid-30',
                title: 'Has-Creator Book',
                author: 'Author Y',
                createdAt: new Date(),
                modifiedAt: new Date(),
                deletedAt: null!,
                createdBy: 'creator-123',
                modifiedBy: null!,
                deletedBy: null!,
            };
            mockFindOne.mockResolvedValueOnce(dummyBook);

            // Mock axios.get to return a UserDTO‐like object
            const fakeUserDTO = { id: 'creator-123', name: 'Creator Name' };
            mockedAxios.get.mockResolvedValueOnce({ data: fakeUserDTO });

            const result = await service.findByIdWithUser('uuid-30', 'Bearer token-abc');

            expect(mockFindOne).toHaveBeenCalledWith({
                where: { id: 'uuid-30', deletedAt: expect.any(Object) },
            });
            expect(mockedAxios.get).toHaveBeenCalledWith(
                `${service['authUrl']}/auth/users/creator-123`,
                { headers: { Authorization: 'Bearer token-abc' } }
            );
            expect(result).toEqual({
                ...dummyBook,
                createdBy: fakeUserDTO,
                modifiedBy: dummyBook.modifiedBy,
                deletedBy: dummyBook.deletedBy,
            });
        });

        it('should return Book with createdBy = null! when axios.get fails', async () => {
            const dummyBook: Book = {
                id: 'uuid-40',
                title: 'Error-Creator Book',
                author: 'Author Z',
                createdAt: new Date(),
                modifiedAt: new Date(),
                deletedAt: null!,
                createdBy: 'creator-999',
                modifiedBy: null!,
                deletedBy: null!,
            };
            mockFindOne.mockResolvedValueOnce(dummyBook);

            // Make axios.get reject:
            mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

            const result = await service.findByIdWithUser('uuid-40', 'Bearer token-xyz');

            expect(mockFindOne).toHaveBeenCalledWith({
                where: { id: 'uuid-40', deletedAt: expect.any(Object) },
            });
            expect(mockedAxios.get).toHaveBeenCalledWith(
                `${service['authUrl']}/auth/users/creator-999`,
                { headers: { Authorization: 'Bearer token-xyz' } }
            );
            expect(result).toEqual({
                ...dummyBook,
                createdBy: null!,
                modifiedBy: dummyBook.modifiedBy,
                deletedBy: dummyBook.deletedBy,
            });
        });
    });

    describe('create()', () => {
        it('should call repository.create and repository.save, then return the saved Book', async () => {
            const input: Partial<Book> = {
                title: 'New Book',
                author: 'Author New',
            };
            const partiallyBuilt: Book = {
                id: 'new-uuid',
                title: 'New Book',
                author: 'Author New',
                createdAt: new Date(),
                modifiedAt: new Date(),
                deletedAt: null!,
                createdBy: 'user-create',
                modifiedBy: null!,
                deletedBy: null!,
            };
            mockCreate.mockReturnValueOnce(partiallyBuilt);

            const fullySaved: Book = {
                ...partiallyBuilt,
                // (e.g. DB sets audit fields)
            };
            mockSave.mockResolvedValueOnce(fullySaved);

            const result = await service.create(input, 'user-create');

            expect(mockCreate).toHaveBeenCalledWith({
                ...input,
                createdBy: 'user-create',
            });
            expect(mockSave).toHaveBeenCalledWith(partiallyBuilt);

            expect(result).toEqual(fullySaved);
        });
    });

    describe('update()', () => {
        it('should call repository.update, then return the updated Book via findById', async () => {
            mockUpdate.mockResolvedValueOnce({ /* update result placeholder */ });

            const updatedBook: Book = {
                id: 'upd-uuid',
                title: 'Updated Title',
                author: 'Author U',
                createdAt: new Date(),
                modifiedAt: new Date(),
                deletedAt: null!,
                createdBy: 'user-u',
                modifiedBy: 'user-u',
                deletedBy: null!,
            };
            mockFindOne.mockResolvedValueOnce(updatedBook);

            const result = await service.update('upd-uuid', { title: 'Updated Title' }, 'user-u');

            expect(mockUpdate).toHaveBeenCalledWith('upd-uuid', {
                title: 'Updated Title',
                modifiedBy: 'user-u',
            });
            expect(mockFindOne).toHaveBeenCalledWith({
                where: { id: 'upd-uuid', deletedAt: expect.any(Object) },
            });
            expect(result).toEqual(updatedBook);
        });
    });

    describe('softDelete()', () => {
        it('should call repository.softDelete and return its result', async () => {
            const fakeDeleteResult = { affected: 1 };
            mockSoftDelete.mockResolvedValueOnce(fakeDeleteResult);

            const result = await service.softDelete('del-uuid', 'user-d');

            expect(mockSoftDelete).toHaveBeenCalledWith({ id: 'del-uuid' });
            expect(result).toEqual(fakeDeleteResult);
        });
    });
});
