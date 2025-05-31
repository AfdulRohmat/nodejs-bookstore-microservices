import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn
} from 'typeorm';

@Entity({ name: 'orders' })
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    userId!: string;

    @Column()
    bookId!: string;

    @Column('int')
    quantity!: number;

    // timestamps
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

    // audit user fields
    @Column({ name: 'created_by', type: 'varchar', nullable: true })
    createdBy?: string;

    @Column({ name: 'modified_by', type: 'varchar', nullable: true })
    modifiedBy?: string;

    @Column({ name: 'deleted_by', type: 'varchar', nullable: true })
    deletedBy?: string;
}
