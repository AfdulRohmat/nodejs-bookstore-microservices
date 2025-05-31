import { AppDataSource } from './config/data-source';
import app from './app';
import { startOrderConsumer } from './consumers/order.consumer';

const PORT = process.env.PORT || 5003;

AppDataSource.initialize()
    .then(() => {
        console.log('✅ Order DB initialized');

        // Jalankan consumer, namun jangan tunggu (fire-and-forget)
        startOrderConsumer().catch((err) => {
            console.error('❌ [Consumer] Failed to start:', err);
        });

        app.listen(PORT, () => console.log(`Order Service running on ${PORT}`));
    })
    .catch(err => console.error('❌ DB init failed:', err));
