const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Dynamic storage: saves to uploads/kyc/<userId>/
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const userId = req.user?.userId || "unknown";
        const dir = path.join(__dirname, "../uploads/kyc", String(userId));
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = `${file.fieldname}_${Date.now()}${ext}`;
        cb(null, name);
    },
});

// File filter: only PDF, JPG, PNG
const fileFilter = (req, file, cb) => {
    const allowed = [".pdf", ".jpg", ".jpeg", ".png"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error("Only PDF, JPG, and PNG files are allowed"), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

module.exports = upload;
