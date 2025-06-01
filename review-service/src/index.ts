// review-service/src/index.ts
import { createServer } from './app';
import { AppDataSource } from './config/data-source';

const PORT = parseInt(process.env.PORT || '5004', 10);

async function main() {
    // 1) Inisialisasi koneksi ke database
    try {
        await AppDataSource.initialize();
        console.log('✅ [ReviewService] Database connected');
    } catch (err) {
        console.error('❌ [ReviewService] Failed to connect to DB:', err);
        process.exit(1);
    }

    // 2) Buat dan jalankan server Express + Apollo
    const app = await createServer();
    app.listen(PORT, () => {
        console.log(`🚀 Review Service running at http://localhost:${PORT}/graphql`);
    });
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
