import { Repository, IsNull } from 'typeorm';
import { Order } from '../entities/Order';
import { AppDataSource } from '../config/data-source';
import { producer } from '../config/kafka';
import axios from 'axios';
import { config } from 'dotenv';

interface OrderPayload {
    id: string;
    userId: string;
    bookId: string;
    quantity: number;
    createdAt: string; // ISO string
    user: {
        username: string;
        email: string;
    };
    book: {
        title: string;
        author: string;
    };
}


export class OrderService {
    private orderRepository: Repository<Order> = AppDataSource.getRepository(Order);

    async create(data: { userId: string; bookId: string; quantity: number; token?: string }) {

        // --- Simpan Order ke Database ---
        const order = await this.saveOrderToDB(data.userId, data.bookId, data.quantity);

        // --- Ambil data user & buku (jika gagal, tetap kirim payload minimal) ---
        const userInfo = await this.fetchUserInfo(data.userId, data.token);
        const bookInfo = await this.fetchBookInfo(data.bookId, data.token);

        // --- Bentuk payload lengkap ---
        const payload: OrderPayload = this.buildOrderPayload(order, userInfo, bookInfo);

        // --- Publish payload ke Kafka ---
        await this.publishOrderToKafka(payload);

        return payload;
    }

    /** Simpan entity Order ke database dan kembalikan instance-nya. */
    private async saveOrderToDB(userId: string, bookId: string, quantity: number): Promise<Order> {
        const order = this.orderRepository.create({
            userId,
            bookId,
            quantity,
            createdBy: userId,
            // Jika kolom createdAt/modifiedAt otomatis di‐handle DB, tidak perlu set di sini.
        });
        return this.orderRepository.save(order);
    }

    /** 
     * Panggil Auth Service untuk mendapatkan username & email.
     * Jika error, kembalikan object dengan string kosong. 
     */
    private async fetchUserInfo(
        userId: string,
        token?: string
    ): Promise<{ username: string; email: string }> {
        try {
            const resp = await axios.get<{ id: string; username: string; email: string }>(
                `${process.env.AUTH_URL}/auth/users/${userId}`,
                {
                    headers: {
                        Authorization: token ?? '',
                    },
                }
            );
            return {
                username: resp.data.username,
                email: resp.data.email,
            };
        } catch (err) {
            console.error('❌ [OrderService] Gagal mengambil data user:', err);
            return { username: '', email: '' };
        }
    }

    /** 
     * Panggil Book Service untuk mendapatkan title & author. 
     * Jika error, kembalikan object dengan string kosong.
     */
    private async fetchBookInfo(
        bookId: string,
        token?: string
    ): Promise<{ title: string; author: string }> {
        try {
            const resp = await axios.get<{ id: string; title: string; author: string }>(
                `${process.env.BOOK_URL}/books/${bookId}`,
                {
                    headers: {
                        Authorization: token ?? '',
                    },
                }
            );
            return {
                title: resp.data.title,
                author: resp.data.author,
            };
        } catch (err) {
            console.error('❌ [OrderService] Gagal mengambil data buku:', err);
            return { title: '', author: '' };
        }
    }

    /** Satukan data Order, User, dan Book ke dalam satu payload untuk Kafka. */
    private buildOrderPayload(
        order: Order,
        userInfo: { username: string; email: string },
        bookInfo: { title: string; author: string }
    ): OrderPayload {
        return {
            id: order.id,
            userId: order.userId,
            bookId: order.bookId,
            quantity: order.quantity,
            createdAt: order.createdAt.toISOString(),
            user: {
                username: userInfo.username,
                email: userInfo.email,
            },
            book: {
                title: bookInfo.title,
                author: bookInfo.author,
            },
        };
    }

    /** Publish payload ke Kafka topic. */
    private async publishOrderToKafka(payload: OrderPayload): Promise<void> {
        try {
            await producer.connect();
            const result = await producer.send({
                topic: process.env.KAFKA_TOPIC_ORDER!,
                messages: [
                    {
                        key: payload.id,
                        value: JSON.stringify(payload),
                    },
                ],
            });
            console.log(
                `✅ [Kafka] Published enriched order (ID: ${payload.id}) to topic=${process.env.KAFKA_TOPIC_ORDER} ` +
                `partition=${result[0].partition} offset=${result[0].offset}`
            );
        } catch (err) {
            console.error('❌ [Kafka] Gagal mengirim message:', err);
        }
    }

    /** List semua order milik user */
    findAllByUser(userId: string) {
        return this.orderRepository.find({
            where: { userId, deletedAt: IsNull() }
        });
    }

    /** Detail order */
    findById(id: string) {
        return this.orderRepository.findOne({ where: { id } });
    }

    /** Update order (contoh jika diinginkan) */
    async update(id: string, data: Partial<Order>, currentUser: string) {
        await this.orderRepository.update(id, {
            ...data,
            modifiedBy: currentUser
        });
        return this.findById(id);
    }

    /** Soft-delete order */
    async softDelete(id: string, currentUser: string) {
        // set deletedBy, then soft-delete sets deletedAt
        await this.orderRepository.update(id, { deletedBy: currentUser });
        await this.orderRepository.softDelete(id);
    }
}
