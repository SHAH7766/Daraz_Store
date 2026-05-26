import express from 'express'
import 'dotenv/config';
import cors from 'cors';
import { connectDB } from './Config/Database.js';
import router from './Routes/ProductRoutes.js';
connectDB();
const app = express();
const allowedOrigins = [
    'https://darazstore.vercel.app',
    'http://localhost:5174',
    'http://localhost:5173',
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }

        callback(new Error('Not allowed by CORS'));
    },
}));
app.use(express.json());
app.use('/api/product', router);
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
const server = app.listen(port, () => {
    console.log(`Daraz order tracker running on http://localhost:${port}`);
});

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Close the other backend terminal or run: npx kill-port ${port}`);
        process.exit(1);
    }

    throw error;
});
