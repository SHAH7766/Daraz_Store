import mongoose from 'mongoose';
export const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || process.env.mongo_uri;

        if (!mongoUri) {
            throw new Error('MongoDB connection string is missing. Set MONGO_URI in Railway variables.');
        }

        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}
