// review-service/src/graphql/resolvers.ts
import axios from 'axios';
import { ReviewService } from '../services/review.service';
import dotenv from 'dotenv';
dotenv.config();

const reviewService = new ReviewService();

export const resolvers = {
    Query: {
        reviews: async (
            _: unknown,
            args: { bookId: string },
            context: { userId: string | null; token: string | null }
        ) => {
            return reviewService.getReviewsByBook(args.bookId);
        },

        review: async (
            _: unknown,
            args: { id: string },
            context: { userId: string | null; token: string | null }
        ) => {
            // 1) Ambil Review
            const review = await reviewService.getReviewById(args.id);
            if (!review) return null;

            // 2) Ambil User (butuh autentikasi)
            let userData: { id: string; username: string; email: string };
            try {
                const respUser = await axios.get<{
                    id: string;
                    username: string;
                    email: string;
                }>(
                    `${process.env.AUTH_URL}/auth/users/${review.userId}`,
                    {
                        headers: {
                            Authorization: context.token ? `Bearer ${context.token}` : '',
                        },
                    }
                );
                userData = respUser.data;
            } catch (err) {
                console.error('❌ [Resolver review] Gagal fetch User:', err);
                throw new Error('Failed to fetch user data');
            }

            // 3) Ambil Book (endpoint publik, biasanya tak perlu token)
            let bookData: { id: string; title: string; author: string };
            try {
                const respBook = await axios.get<{
                    id: string;
                    title: string;
                    author: string;
                }>(
                    `${process.env.BOOK_URL}/books/${review.bookId}`,
                    {
                        headers: {
                            // Jika Book Service perlu token, pakai context.token; jika tidak, boleh kosong
                            Authorization: context.token ? `Bearer ${context.token}` : '',
                        },
                    }
                );
                bookData = respBook.data;
            } catch (err) {
                console.error('❌ [Resolver review] Gagal fetch Book:', err);
                throw new Error('Failed to fetch book data');
            }

            // 4) Gabungkan data dan return
            return {
                id: review.id,
                userId: review.userId,
                bookId: review.bookId,
                rating: review.rating,
                comment: review.comment,
                createdAt: review.createdAt,
                modifiedAt: review.modifiedAt,
                deletedAt: review.deletedAt,
                createdBy: review.createdBy,
                modifiedBy: review.modifiedBy,
                deletedBy: review.deletedBy,
                user: {
                    id: userData.id,
                    username: userData.username,
                    email: userData.email,
                },
                book: {
                    id: bookData.id,
                    title: bookData.title,
                    author: bookData.author,
                },
            };
        },
    },

    Mutation: {
        createReview: async (
            _: unknown,
            args: { bookId: string; rating: number; comment: string },
            context: { userId: string | null; token: string | null }
        ) => {
            const userId = context.userId;
            if (!userId) throw new Error('Not authenticated');
            return reviewService.createReview({
                userId,
                bookId: args.bookId,
                rating: args.rating,
                comment: args.comment,
            });
        },

        updateReview: async (
            _: unknown,
            args: { id: string; rating?: number; comment?: string },
            context: { userId: string | null; token: string | null }
        ) => {
            const userId = context.userId;
            if (!userId) throw new Error('Not authenticated');
            return reviewService.updateReview(args.id, userId, {
                rating: args.rating,
                comment: args.comment,
            });
        },

        deleteReview: async (
            _: unknown,
            args: { id: string },
            context: { userId: string | null; token: string | null }
        ) => {
            const userId = context.userId;
            if (!userId) throw new Error('Not authenticated');
            return reviewService.deleteReview(args.id, userId);
        },
    },
};
