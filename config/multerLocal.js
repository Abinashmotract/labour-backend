const path = require("path");
const fs = require("fs");
const multer = require("multer");

const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeOriginal = file.originalname.replace(/\s+/g, "_");
    cb(null, `${timestamp}-${safeOriginal}`);
  },
});

const allowedTypes = ["image/png", "image/jpg", "image/jpeg", "image/webp"];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PNG, JPG, JPEG, and WEBP formats are allowed"), false);
    }
  },
});

const uploadToLocal = (req, res, next) => {
  const uploader = upload.single("profilePicture");
  uploader(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File too large! Max 5MB allowed",
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Upload failed",
      });
    }
    req.fileLocations = req.fileLocations || {};
    if (req.file && req.file.filename) {
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      req.fileLocations.profilePicture = `${baseUrl}/uploads/${req.file.filename}`;
    }
    next();
  });
};

module.exports = { uploadToLocal };
