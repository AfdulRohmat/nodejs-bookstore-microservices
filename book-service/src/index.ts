import app from './app';
import { AppDataSource } from './config/data-source';

const PORT = process.env.PORT || 5002;

AppDataSource.initialize()
    .then(() => {
        console.log('✅ Data Source initialized');
        app.listen(PORT, () => console.log(`Book Service listening on ${PORT}`));
    })
    .catch((err) => {
        console.error('❌ Data Source initialization error:', err);
    });
