import express from 'express'
import 'dotenv/config';
import cors from 'cors';
import { connectDB } from './Config/Database.js';
import router from './Routes/ProductRoutes.js';
connectDB();
const app = express();
const allowedOrigins = [
    'https://daraz-store.vercel.app',
    'https://darazstore.vercel.app',
    'http://localhost:5173',
    'http://localhost:5174',
];
const vercelPreviewOriginRegex = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i;
const normalizeOrigin = (origin) => origin?.replace(/\/$/, '');
const corsOptions = {
    origin: (origin, callback) => {
        const normalizedOrigin = normalizeOrigin(origin);

        if (
            !normalizedOrigin ||
            allowedOrigins.includes(normalizedOrigin) ||
            vercelPreviewOriginRegex.test(normalizedOrigin)
        ) {
            callback(null, true);
            return;
        }

        callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Daraz Store API is running' });
});
app.use('/api/product', router);
app.use('/', router);
app.use((err, req, res, next) => {
    if (!err) {
        next();
        return;
    }

    const isFileSizeError = err.code === 'LIMIT_FILE_SIZE';
    res.status(isFileSizeError ? 413 : 400).json({
        message: isFileSizeError ? 'Image must be smaller than 5MB' : err.message || 'Upload failed',
    });
});

const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});