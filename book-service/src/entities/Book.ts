import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, UpdateDateColumn, DeleteDateColumn
} from 'typeorm';

@Entity({ name: 'books' })
export class Book {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    title!: string;

    @Column()
    author!: string;

    // Audit fields
    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'modified_at', nullable: true })
    modifiedAt!: Date;

    @DeleteDateColumn({ name: 'deleted_at', nullable: true })
    deletedAt!: Date;

    @Column({ name: 'created_by', nullable: true })
    createdBy?: string;

    @Column({ name: 'modified_by', nullable: true })
    modifiedBy?: string;

    @Column({ name: 'deleted_by', nullable: true })
    deletedBy?: string;
}
