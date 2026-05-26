import Product from '../Models/Product.model.js';
import cloudinary from '../Config/Cloudinary.js';
import { Readable } from 'stream';

const uploadToCloudinary = (file, folder) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder, resource_type: 'image' },
            (error, result) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(result.secure_url);
            }
        );

        const bufferStream = new Readable();
        bufferStream.push(file.buffer);
        bufferStream.push(null);
        bufferStream.pipe(uploadStream);
    });
};

const sendError = (res, message, error) => {
    console.error(message, error);
    res.status(500).json({ message, error: error.message });
};

const parseQuantity = (quantity) => {
    const parsed = Number(quantity);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

const parseAmount = (amount) => {
    const parsed = Number(amount);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

export const createProduct = async (req, res) => {
    try {
        const { name, price, quantity, finalPrice, PriceGivenAdvance, status } = req.body;
        const productImage = req.files?.image?.[0] || req.files?.imageUrl?.[0];
        const paymentImage = req.files?.PaymentScreenShot?.[0] || req.files?.paymentScreenShot?.[0];

        if (!productImage || !paymentImage) {
            return res.status(400).json({
                message: 'Product image and payment screenshot are required',
            });
        }

        const [imageUrl, PaymentScreenShot] = await Promise.all([
            uploadToCloudinary(productImage, 'daraz-store/products'),
            uploadToCloudinary(paymentImage, 'daraz-store/payment-screenshots'),
        ]);

        const newProduct = new Product({
            name,
            price,
            quantity: parseQuantity(quantity),
            finalPrice: parseAmount(finalPrice),
            imageUrl,
            PriceGivenAdvance,
            status,
            PaymentScreenShot
        });
        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        sendError(res, 'Error creating product', error);
    }
}

export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({});
        res.status(200).json(products);
    } catch (error) {
        sendError(res, 'Error fetching products', error);
    }
}

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const { name, price, quantity, finalPrice, PriceGivenAdvance, status } = req.body;

        if (name !== undefined) product.name = name;
        if (price !== undefined) product.price = price;
        if (quantity !== undefined) product.quantity = parseQuantity(quantity);
        if (finalPrice !== undefined) product.finalPrice = parseAmount(finalPrice);
        if (PriceGivenAdvance !== undefined) product.PriceGivenAdvance = PriceGivenAdvance;
        if (status !== undefined) product.status = status;

        const productImage = req.files?.image?.[0] || req.files?.imageUrl?.[0];
        const paymentImage = req.files?.PaymentScreenShot?.[0] || req.files?.paymentScreenShot?.[0];

        if (productImage) {
            product.imageUrl = await uploadToCloudinary(productImage, 'daraz-store/products');
        }

        if (paymentImage) {
            product.PaymentScreenShot = await uploadToCloudinary(paymentImage, 'daraz-store/payment-screenshots');
        }

        const updated = await product.save();
        res.status(200).json(updated);
    } catch (error) {
        sendError(res, 'Error updating product', error);
    }
}

export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Product.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        sendError(res, 'Error deleting product', error);
    }
}
