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
    // Gunakan fungsi DB: NOW() sudah otomatis +07 karena server Postgres di‐set TZ=Asia/Jakarta
    @Column({
        name: 'created_at',
        type: 'timestamp with time zone',
        default: () => 'NOW()'
    })
    createdAt!: Date;

    @Column({
        name: 'modified_at',
        type: 'timestamp with time zone',
        default: () => 'NOW()'
    })
    modifiedAt!: Date;

    @Column({
        name: 'deleted_at',
        type: 'timestamp with time zone',
        nullable: true
    })
    deletedAt?: Date;

    @Column({ name: 'created_by', nullable: true })
    createdBy?: string;

    @Column({ name: 'modified_by', nullable: true })
    modifiedBy?: string;

    @Column({ name: 'deleted_by', nullable: true })
    deletedBy?: string;
}
