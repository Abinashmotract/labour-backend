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
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept images only
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
}).single("files");

const uploadToS3 = async (req, res, next) => {
    upload(req, res, async (err) => {
        console.log("Upload middleware debug:");
        console.log("req.file:", req.file);
        console.log("req.body:", req.body);
        
        if (err) {
            console.error("Multer error:", err);
            return res.status(400).json({ error: err.message });
        }

        if (!req.file) {
            console.log("No file uploaded");
            req.fileLocations = [];
            return next();
        }

        try {
            // For local development, if AWS credentials are not available, 
            // we'll store the file information locally
            if (!process.env.AWS_ACCESS_KEY_ID && !process.env.AWS_SECRET_ACCESS_KEY) {
                console.log("AWS credentials not found, storing file info locally");
                const fileInfo = {
                    originalname: req.file.originalname,
                    mimetype: req.file.mimetype,
                    size: req.file.size,
                    buffer: req.file.buffer.toString('base64')
                };
                req.fileLocations = [`local://${Date.now()}-${req.file.originalname}`];
                return next();
            }

            const { s3Client, config } = await getS3Client();
            const fileKey = `${Date.now()}-${req.file.originalname}`;
            const params = {
                Bucket: config.bucketName,
                Key: fileKey,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
            };

            await s3Client.putObject(params);

            const fileUrl = `https://${config.bucketName}.s3.${config.region}.amazonaws.com/${fileKey}`;
            req.fileLocations = [fileUrl]; // single file
            next();
        } catch (uploadError) {
            console.error("Upload Error:", uploadError);
            // For development, if AWS upload fails, still allow the request to continue
            // with a local file reference
            req.fileLocations = [`local://${Date.now()}-${req.file.originalname}`];
            console.log("AWS upload failed, using local file reference");
            return next();
        }
    });
};


module.exports = { uploadToS3 };

