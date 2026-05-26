import multer from 'multer';

const storage = multer.memoryStorage();
const allowedImageExtensions = /\.(avif|gif|heic|heif|jfif|jpe?g|png|webp)$/i;

const fileFilter = (req, file, cb) => {
    const hasImageMimeType = file.mimetype?.startsWith('image/');
    const hasImageExtension = allowedImageExtensions.test(file.originalname);

    if (hasImageMimeType || hasImageExtension) {
        cb(null, true);
        return;
    }

    cb(new Error(`${file.originalname} is not an image file`));
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});
