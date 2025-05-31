import { Kafka, Consumer } from 'kafkajs';
import { transporter } from '../config/mailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Interface payload yang kita kirim dari OrderService.
 */
interface OrderMessage {
    id: string;
    userId: string;
    bookId: string;
    quantity: number;
    createdAt: string;
    user: {
        username: string;
        email: string;
    };
    book: {
        title: string;
        author: string;
    };
}

async function startOrderConsumer() {
    const kafka = new Kafka({
        clientId: process.env.KAFKA_CLIENT_ID || 'order-service',
        brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    });

    // 1) Pastikan topic ada (sama seperti sebelumnya)
    const admin = kafka.admin();
    await admin.connect();
    const topicName = process.env.KAFKA_TOPIC_ORDER!;
    const topics = await admin.listTopics();
    if (!topics.includes(topicName)) {
        await admin.createTopics({
            topics: [{ topic: topicName, numPartitions: 1, replicationFactor: 1 }],
        });
    }
    await admin.disconnect();

    // 2) Buat dan connect consumer
    const consumer: Consumer = kafka.consumer({ groupId: 'order-notifications-group' });
    await consumer.connect();
    console.log('✅ [Consumer] Connected to Kafka broker');

    await consumer.subscribe({ topic: topicName, fromBeginning: false });
    console.log(`✅ [Consumer] Subscribed to topic "${topicName}"`);

    // 3) Jalankan consumer, langsung kirim email dari payload
    await consumer.run({
        eachMessage: async ({ message }) => {
            const rawValue = message.value?.toString();
            if (!rawValue) return;

            // Parse payload langsung ke struktur yang lengkap
            const enrichedOrder: OrderMessage = JSON.parse(rawValue);
            console.log('🛎️ [Consumer] Received enriched order:', enrichedOrder);

            // 4) Ambil semua data dari payload
            const {
                id: orderId,
                quantity,
                createdAt,
                user: { username: userName, email: userEmail },
                book: { title: bookTitle, author: bookAuthor },
            } = enrichedOrder;

            // 5) Format Order Date ke Asia/Jakarta (GMT+7)
            const jakartaDate = new Date(createdAt).toLocaleString('id-ID', {
                timeZone: 'Asia/Jakarta',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });

            // 6) Menyusun dan kirim email
            const mailOptions = {
                from: `"Bookstore App" <${process.env.SMTP_USER}>`,
                to: userEmail,
                subject: `Order Confirmation (#${orderId})`,
                html: `
          <h2>Hi ${userName},</h2>
          <p>Terima kasih telah melakukan pembelian! Berikut detail pesanan Anda:</p>
          <ul>
            <li><strong>Order ID:</strong> ${orderId}</li>
            <li><strong>Book:</strong> ${bookTitle} — ${bookAuthor}</li>
            <li><strong>Quantity:</strong> ${quantity}</li>
            <li><strong>Order Date:</strong> ${jakartaDate} (GMT+7)</li>
          </ul>
          <p>Kami akan segera memproses pesanan Anda dan menginformasikan saat pengiriman.</p>
          <br/>
          <p>Salam hangat,<br/>Tim Bookstore</p>
        `
            };

            try {
                const info = await transporter.sendMail(mailOptions);
                console.log(`✅ [Consumer] Email terkirim ke ${userEmail}: ${info.messageId}`);
            } catch (err) {
                console.error('❌ [Consumer] Gagal mengirim email:', err);
            }
        },
    });
}

export { startOrderConsumer };
