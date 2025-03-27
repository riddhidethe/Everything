const multer = require('multer');
const path = require('path');

// Define allowed file types
const fileTypes = {
    profilePic: ['.jpeg', '.jpg'],  // Allow only JPEG and JPG
    resume: ['.pdf']  // Allow only PDFs for resumes
};

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === 'profilePic') {
            cb(null, 'PUBLIC/ASSETS/UPLOADS/profile_images/');
        } else if (file.fieldname === 'resume') {
            cb(null, 'PUBLIC/ASSETS/UPLOADS/cv_pdfs/');
        } else {
            return cb(new Error('Invalid file field name'), false);
        }
    },
    filename: function (req, file, cb) {
        const applicantId = req.user?._id;
        if (!applicantId) {
            return cb(new Error('Applicant ID is missing'), false);
        }

        const fileExtension = path.extname(file.originalname).toLowerCase();
        const originalName = path.parse(file.originalname).name;
        const newFileName = `${originalName}-${applicantId}${fileExtension}`;

        cb(null, newFileName);
    }
});

// File Filter to Restrict File Types
const fileFilter = (req, file, cb) => {
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (file.fieldname === 'profilePic' && !fileTypes.profilePic.includes(fileExtension)) {
        return cb(new Error('Only JPEG and JPG images are allowed for profile pictures'), false);
    }

    if (file.fieldname === 'resume' && !fileTypes.resume.includes(fileExtension)) {
        return cb(new Error('Only PDF files are allowed for resumes'), false);
    }

    cb(null, true);
};

// Multer Upload Configuration
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024  // Max 2MB for both files
    }
});

module.exports = upload;
