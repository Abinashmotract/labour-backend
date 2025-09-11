require("dotenv").config();
const multer = require("multer");
const { S3 } = require("@aws-sdk/client-s3");
const {
    SecretsManagerClient,
    GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");

const secretsManagerClient = new SecretsManagerClient({
    region: "us-east-1", // Secrets Manager region
});

const getAwsCredentials = async () => {

    try {
        const command = new GetSecretValueCommand({
            SecretId: process.env.AWS_SECRET_NAME || "braid-secret",
        });

        const data = await secretsManagerClient.send(command);

        if (!data.SecretString) {
            throw new Error("No secret string returned from AWS Secrets Manager");
        }

        const secret = data.SecretString
            ? JSON.parse(data.SecretString)
            : JSON.parse(Buffer.from(data.SecretBinary, 'base64').toString('ascii'));

        return {
            accessKeyId: secret.AWS_ACCESS_KEY_ID,
            secretAccessKey: secret.AWS_SECRET_ACCESS_KEY,
            bucketName: secret.AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME, // fallback to env
            region: secret.AWS_REGION || process.env.AWS_REGION || "us-east-1", // fallback
        };
    }
    catch (error) {
        console.error("Failed to get AWS credentials:", error);
        throw new Error("AWS credential configuration failed");
    }
};

// Create the S3 client instance
const getS3Client = async () => {
    const credentials = await getAwsCredentials();

    const s3Client = new S3({
        credentials: {
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey,
        },
        region: credentials.region,
    });

    return { s3Client, config: credentials };
};

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed!'), false);
    }
});

// ✅ Correct: define upload middleware for multiple fields
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


module.exports = { uploadToS3 };

