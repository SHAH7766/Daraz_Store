import mongoose from 'mongoose';
const allowedStatuses = ['Shipped', 'Delievered', 'Return', 'Failed'];

const productschema = new mongoose.Schema({

    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    finalPrice: { type: Number, required: true, min: 0, default: 0 },
    imageUrl: { type: String, required: true },
    PriceGivenAdvance: { type: Number, required: true },
    status: { type: String, enum: allowedStatuses, required: true },
    PaymentScreenShot: { type: String, required: true },
});
const Product = mongoose.model('Product', productschema);
export default Product;
