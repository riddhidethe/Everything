const express = require('express');
const authMiddleware = require("../middleware/authMiddleware");
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadPath = file.fieldname === 'prof-pdf' 
            ? path.join(__dirname, '../uploads/resumes') 
            : path.join(__dirname, '../uploads/profiles');
        cb(null, uploadPath);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const fileFilter = function(req, file, cb) {
    if (file.fieldname === 'prof-pdf') {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed for resume uploads!'), false);
        }
    } else if (file.fieldname === 'prof-image') {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed for profile pictures!'), false);
        }
    } else {
        cb(new Error('Unexpected field'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    }
});

// 📌 Initial profile data submission
router.post('/profileComplete', authMiddleware(["applicant"]), upload.single('prof-image'), async (req, res) => {
    try {
        const userId = req.user.id;
        const first_name = req.body.fname;
        const last_name = req.body.lname;
        const age = req.body.age;
        const mobile_no = req.body.phoneno;
        const exp = req.body.exp;
        const gender = req.body.gender;
        const profile_pic_code = req.file ? req.file.filename : null;

        // Prepare data for the next step
        const profileData = {
            applicant_id: userId,
            first_name: first_name,
            last_name: last_name,
            age: age,
            mobile_no: mobile_no,
            email_id: req.user.email,
            exp: exp,
            gender: gender,
            profile_pic_code: profile_pic_code
        };

        res.status(200).json({ 
            success: true, 
            msg: "Profile picture uploaded successfully",
            profileData 
        });
    } catch (error) {
        res.status(500).json({ success: false, msg: "Server error", error });
    }
});

// 📌 Complete profile update with resume
router.post('/updateProfile', authMiddleware(["applicant"]), 
    upload.fields([
        { name: 'prof-image', maxCount: 1 }, 
        { name: 'prof-pdf', maxCount: 1 }
    ]), 
    async (req, res) => {
        try {
            const userId = req.user.id;
            const {
                first_name,
                last_name,
                age,
                mobile_no,
                email_id,
                exp,
                gender,
                skills,
                profilePic
            } = req.body;

            // Determine profile picture filename
            let profile_pic_code;
            if (profilePic === "uploaded" && req.files['prof-image']) {
                profile_pic_code = req.files['prof-image'][0].filename;
            } else {
                profile_pic_code = profilePic;
            }

            // Get resume filename
            const cv = req.files['prof-pdf'][0].filename;

            // Update user profile in database
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                {
                    firstName: first_name,
                    lastName: last_name,
                    age: age,
                    mobileNo: mobile_no,
                    email: email_id,
                    skills: skills,
                    experienceLevel: exp,
                    gender: gender,
                    resume: cv,
                    profilePhoto: profile_pic_code
                },
                { new: true }
            );

            if (!updatedUser) {
                return res.status(404).json({ success: false, msg: "User not found" });
            }

            res.status(200).json({ 
                success: true, 
                msg: "Profile updated successfully", 
                user: updatedUser 
            });
        } catch (error) {
            res.status(500).json({ success: false, msg: "Server error", error });
        }
    }
);

// 📌 Get user profile
router.get('/profile', authMiddleware(["applicant"]), async (req, res) => {
    try {
        const userId = req.user.id;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, msg: "User not found" });
        }
        
        res.status(200).json({
            success: true,
            profile: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                age: user.age,
                mobileNo: user.mobileNo,
                experienceLevel: user.experienceLevel,
                gender: user.gender,
                skills: user.skills,
                profilePhoto: user.profilePhoto,
                resume: user.resume
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, msg: "Server error", error });
    }
});

// 📌 Update specific profile fields
router.patch('/update-fields', authMiddleware(["applicant"]), async (req, res) => {
    try {
        const userId = req.user.id;
        const updates = req.body;
        
        // Remove any fields that shouldn't be directly updated
        delete updates.password;
        delete updates._id;
        
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updates,
            { new: true }
        );
        
        if (!updatedUser) {
            return res.status(404).json({ success: false, msg: "User not found" });
        }
        
        res.status(200).json({
            success: true,
            msg: "Profile fields updated successfully",
            user: updatedUser
        });
    } catch (error) {
        res.status(500).json({ success: false, msg: "Server error", error });
    }
});

// 📌 Update just the profile picture
router.post('/update-profile-picture', authMiddleware(["applicant"]), 
    upload.single('prof-image'), 
    async (req, res) => {
        try {
            const userId = req.user.id;
            
            if (!req.file) {
                return res.status(400).json({ 
                    success: false, 
                    msg: "No profile picture uploaded" 
                });
            }
            
            const profilePicture = req.file.filename;
            
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { profilePhoto: profilePicture },
                { new: true }
            );
            
            if (!updatedUser) {
                return res.status(404).json({ success: false, msg: "User not found" });
            }
            
            res.status(200).json({
                success: true,
                msg: "Profile picture updated successfully",
                profilePhoto: profilePicture
            });
        } catch (error) {
            res.status(500).json({ success: false, msg: "Server error", error });
        }
    }
);

// 📌 Update just the resume/CV
router.post('/update-resume', authMiddleware(["applicant"]), 
    upload.single('prof-pdf'), 
    async (req, res) => {
        try {
            const userId = req.user.id;
            
            if (!req.file) {
                return res.status(400).json({ 
                    success: false, 
                    msg: "No resume uploaded" 
                });
            }
            
            const resume = req.file.filename;
            
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { resume: resume },
                { new: true }
            );
            
            if (!updatedUser) {
                return res.status(404).json({ success: false, msg: "User not found" });
            }
            
            res.status(200).json({
                success: true,
                msg: "Resume updated successfully",
                resume: resume
            });
        } catch (error) {
            res.status(500).json({ success: false, msg: "Server error", error });
        }
    }
);

module.exports = router;