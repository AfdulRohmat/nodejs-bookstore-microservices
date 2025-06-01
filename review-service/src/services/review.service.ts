// review-service/src/services/review.service.ts
import { IsNull, Repository } from 'typeorm';
import { Review } from '../entities/Review';
import { AppDataSource } from '../config/data-source';

export type CreateReviewInput = {
    userId: string;
    bookId: string;
    rating: number;
    comment: string;
};

export type UpdateReviewInput = {
    rating?: number;
    comment?: string;
};

export class ReviewService {
    private reviewRepository: Repository<Review> = AppDataSource.getRepository(Review);

    /** Ambil semua review untuk satu buku (hanya yang belum dihapus), urut terbaru dulu */
    async getReviewsByBook(bookId: string) {
        return this.reviewRepository.find({
            where: { bookId, deletedAt: IsNull() },
            order: { createdAt: 'DESC' },
        });
    }

    /** Ambil satu review by ID (jika belum dihapus) */
    async getReviewById(id: string) {
        return this.reviewRepository.findOne({
            where: { id, deletedAt: IsNull() },
        });
    }

    /** Buat review baru; set createdBy = userId */
    async createReview(input: CreateReviewInput) {
        const { userId, bookId, rating, comment } = input;
        const review = this.reviewRepository.create({
            userId,
            bookId,
            rating,
            comment,
            createdBy: userId,
        });
        return this.reviewRepository.save(review);
    }

    /** Update review; hanya owner (createdBy) yang boleh. */
    async updateReview(id: string, userId: string, data: UpdateReviewInput) {
        const existing = await this.reviewRepository.findOne({ where: { id } });
        if (!existing || existing.deletedAt) {
            throw new Error('Review not found');
        }
        if (existing.userId !== userId) {
            throw new Error('Not authorized to update this review');
        }
        await this.reviewRepository.update(id, {
            ...data,
            modifiedBy: userId,
        });
        return this.getReviewById(id);
    }

    /** Soft-delete review; hanya owner yang boleh. */
    async deleteReview(id: string, userId: string) {
        // 1) Cek apakah review ada (tanpa mempedulikan status deletedAt)
        const existing = await this.reviewRepository.findOne({
            where: { id },
            withDeleted: false
        });
        if (!existing) {
            throw new Error('Review not found');
        }
        if (existing.userId !== userId) {
            throw new Error('Not authorized to delete this review');
        }

        // 2) Soft‐remove: ini akan mengisi deletedAt secara otomatis
        await this.reviewRepository.softRemove(existing);

        // 3) Karena softRemove tidak otomatis mengisi deletedBy, kita update ulang kolom deletedBy:
        await this.reviewRepository.update(id, {
            deletedBy: userId,
        });

        // 4) Ambil ulang review **termasuk yang sudah di‐soft‐delete**, agar kita dapat deletedAt & deletedBy
        const deletedReview = await this.reviewRepository.findOne({
            where: { id },
            withDeleted: true    // <— Penting: agar TypeORM tidak mengecualikan baris 'deleted'
        });
        if (!deletedReview) {
            // Seharusnya tidak mungkin, tapi untuk memastikan:
            throw new Error('Failed to fetch deleted review');
        }

        return deletedReview;
    }
}
