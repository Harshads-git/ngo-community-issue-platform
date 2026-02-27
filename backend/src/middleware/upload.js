const multer = require('multer');
const path = require('path');

// Configure local storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, process.env.UPLOAD_PATH);
    },
    filename: function (req, file, cb) {
        // Generate a unique file name: photo_userId_timestamp.ext
        cb(null, `photo_${req.user.id}_${Date.now()}${path.extname(file.originalname)}`);
    }
});

// Check file type
const fileFilter = (req, file, cb) => {
    const allowedTypes = process.env.ALLOWED_FILE_TYPES
        ? process.env.ALLOWED_FILE_TYPES.split(',')
        : ['image/jpeg', 'image/jpg', 'image/png'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        // Return error if file type is not allowed
        cb(new Error(`Please upload only the following types: ${allowedTypes.join(', ')}`), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        // Ensure size falls back to 5MB if not defined
        fileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5000000
    },
    fileFilter: fileFilter
});

module.exports = upload;
