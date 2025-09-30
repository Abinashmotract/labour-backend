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

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed!"), false);
  },
});

const uploadToLocal = (req, res, next) => {
  const uploader = upload.single("profilePicture");
  uploader(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });

    req.fileLocations = req.fileLocations || {};
    if (req.file && req.file.filename) {
      req.fileLocations.profilePicture = `/uploads/${req.file.filename}`;
    }
    next();
  });
};

module.exports = { uploadToLocal };


