require('dotenv').config();
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'uploads',
        format: async (req, file) => "png",
        public_id: (req, file) => file.fieldname + '-' + Date.now(),
    },
});


// Middleware to convert HEIC to PNG before uploading
const heicToPng = async (req, res, next) => {
    if (req.file && req.file.mimetype === 'image/heic') {
        try {
            // HEIC to PNG conversion with compression
            const convertedBuffer = await sharp(req.file.buffer)
                .toFormat('png', {
                    quality: 80, // Adjust quality (1-100), lower = more compression
                    compressionLevel: 6, // PNG compression level (0-9)
                    adaptiveFiltering: true // Better compression for small PNGs
                })
                .resize({
                    width: 1200, // Optional: set max width
                    height: 1200, // Optional: set max height
                    fit: 'inside', // Maintain aspect ratio
                    withoutEnlargement: true // Don't enlarge if smaller
                })
                .toBuffer();
            
            // Update the file object
            req.file.buffer = convertedBuffer;
            req.file.mimetype = 'image/png';
            req.file.originalname = req.file.originalname.replace(/\.heic$/i, '.png');
            
        } catch (error) {
            return next(error);
        }
    }
    next();
};

// Middleware to handle HEIC conversion for multiple files
const heicToPngArray = async (req, res, next) => {
    if (req.files && req.files.length > 0) {
        try {
            // Loop through all files
            await Promise.all(
                req.files.map(async (file, index) => {
                    if (file.mimetype === 'image/heic') {
                        // HEIC file ko PNG me convert karte hain
                        const convertedBuffer = await sharp(file.buffer)
                            .toFormat('png')
                            .toBuffer();
                        
                        // Original file object ko replace kar dete hain
                        req.files[index].buffer = convertedBuffer;
                        req.files[index].mimetype = 'image/png';
                    }
                })
            );
            next();
        } catch (error) {
            return next(error);
        }
    } else {
        next();
    }
};

const upload = multer({
    storage: storage,
    // limits: { fileSize: 10 * 1024 * 1024 }, 
    // fileFilter: (req, file, cb) => {
    //   // Optional: only accept images
    //   if (file.mimetype.startsWith('image/')) {
    //     cb(null, true);
    //   } else {
    //     cb(new Error('Only images are allowed!'), false);
    //   }
    // }
});

module.exports = { upload, cloudinary, heicToPng, heicToPngArray };