import express from 'express';
const router = express.Router();
import { createProduct, getAllProducts, updateProduct, deleteProduct } from '../Controllers/ProductController.js';
import { upload } from '../Middleware/UploadMiddleware.js';


// Create a new product
router.post(
    '/products',
    upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'imageUrl', maxCount: 1 },
        { name: 'PaymentScreenShot', maxCount: 1 },
        { name: 'paymentScreenShot', maxCount: 1 },
    ]),
    createProduct
);

// Get all products
router.get('/products', getAllProducts);

// Update a product
router.put(
    '/products/:id',
    upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'imageUrl', maxCount: 1 },
        { name: 'PaymentScreenShot', maxCount: 1 },
        { name: 'paymentScreenShot', maxCount: 1 },
    ]),
    updateProduct
);

// Delete a product
router.delete('/products/:id', deleteProduct);

export default router;
