require("dotenv").config();
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed!'), false);
    }
});

const uploadToS3 = (req, res, next) => {
    const uploader = upload.fields([
        { name: 'profilePicture', maxCount: 1 },
        { name: 'documents', maxCount: 5 }
    ]);

    uploader(req, res, async (err) => {
        console.log("req.files:", req.files);
        console.log("req.body:", req.body);

        if (err) return res.status(400).json({ error: err.message });

        try {
            const { s3Client, config } = await getS3Client();

            req.fileLocations = {};

            // Single profilePicture
            if (req.files['profilePicture'] && req.files['profilePicture'][0]) {
                const file = req.files['profilePicture'][0];
                const fileKey = `profile/${Date.now()}-${file.originalname}`;
                await s3Client.putObject({
                    Bucket: config.bucketName,
                    Key: fileKey,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                });
                req.fileLocations.profilePicture = `https://${config.bucketName}.s3.${config.region}.amazonaws.com/${fileKey}`;
            }

            // Multiple documents
            if (req.files['documents']) {
                req.fileLocations.documents = [];
                for (const file of req.files['documents']) {
                    const fileKey = `documents/${Date.now()}-${file.originalname}`;
                    await s3Client.putObject({
                        Bucket: config.bucketName,
                        Key: fileKey,
                        Body: file.buffer,
                        ContentType: file.mimetype,
                    });
                    req.fileLocations.documents.push(`https://${config.bucketName}.s3.${config.region}.amazonaws.com/${fileKey}`);
                }
            }

        } catch (uploadError) {
            console.error("AWS upload error:", uploadError);
        }

        next();
    });
};

module.exports = { uploadToS3 };


