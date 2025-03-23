const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === 'prof-image') {
            cb(null, 'PUBLIC/ASSETS/UPLOADS/profile_images/');
        } else if (file.fieldname === 'prof-pdf') {
            cb(null, 'PUBLIC/ASSETS/UPLOADS/cv_pdfs/');
        } else {
            cb(new Error('Invalid file field name'), false);
        }
    },
    filename: function (req, file, cb) {
        const applicantId = req.user?.id; // Extracting applicantId from JWT payload
        if (!applicantId) {
            return cb(new Error('Applicant ID is missing'), false);
        }
        const originalName = path.parse(file.originalname).name;
        const fileExtension = path.extname(file.originalname);
        const newFileName = `${originalName}-${applicantId}${fileExtension}`;
        cb(null, newFileName);
    }
});

const upload = multer({ storage: storage });

module.exports = upload; // ✅ Export only the `upload` instance
