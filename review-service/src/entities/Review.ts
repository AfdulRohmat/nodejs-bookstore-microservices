// review-service/src/entities/Review.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
} from 'typeorm';

@Entity({ name: 'reviews' })
export class Review {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    userId!: string;

    @Column()
    bookId!: string;

    @Column('int')
    rating!: number;

    @Column()
    comment!: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'modified_at' })
    modifiedAt!: Date;

    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt?: Date;

    @Column({ name: 'created_by', nullable: true })
    createdBy?: string;

    @Column({ name: 'modified_by', nullable: true })
    modifiedBy?: string;

    @Column({ name: 'deleted_by', nullable: true })
    deletedBy?: string;
}
