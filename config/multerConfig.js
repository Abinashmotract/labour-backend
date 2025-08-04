const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create subdirectories for different types of uploads
const profileImagesDir = path.join(uploadsDir, "profile-images");
if (!fs.existsSync(profileImagesDir)) {
    fs.mkdirSync(profileImagesDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Store profile images in profile-images subdirectory
        cb(null, profileImagesDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        const fileName = file.fieldname + '-' + uniqueSuffix + fileExtension;
        cb(null, fileName);
    }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    }
});

// Middleware for single file upload
const uploadSingleFile = upload.single('profileImage');

// Middleware for handling file upload with error handling
const handleFileUpload = (req, res, next) => {
    uploadSingleFile(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // Multer error
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    status: 400,
                    message: "File size too large. Maximum size is 5MB."
                });
            }
            return res.status(400).json({
                success: false,
                status: 400,
                message: err.message
            });
        } else if (err) {
            // Other errors
            return res.status(400).json({
                success: false,
                status: 400,
                message: err.message
            });
        }

        // File uploaded successfully
        if (req.file) {
            // Create file URL for local storage
            const fileUrl = `/uploads/profile-images/${req.file.filename}`;
            req.fileLocations = [fileUrl];
        } else {
            req.fileLocations = [];
        }

        next();
    });
};

// Function to get full URL for uploaded files
const getFileUrl = (filename) => {
    if (!filename) return null;
    
    // If filename already has a full URL, return as is
    if (filename.startsWith('http')) {
        return filename;
    }
    
    // For local files, return the relative path
    return `/uploads/profile-images/${filename}`;
};

// Function to delete file from local storage
const deleteFile = (filename) => {
    if (!filename) return;
    
    try {
        const filePath = path.join(profileImagesDir, filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (error) {
        console.error('Error deleting file:', error);
    }
};

module.exports = {
    handleFileUpload,
    getFileUrl,
    deleteFile,
    upload
}; 