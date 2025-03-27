const express = require('express');
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require('../../FUNCTION/uploadSetup')
const User = require("../models/User");
const Seller = require("../models/Seller");
const Recruiter = require("../models/Recruiter");
const Admin = require("../models/Admin");
const multer = require('multer');
const path = require('path');
const router = express.Router();

// 📌 Initial profile data submission
router.post(
    "/profileComplete",
    authMiddleware(["applicant"]),
    upload.fields([{ name: "profilePic", maxCount: 1 }]),
    async (req, res) => {
        try {
            console.log("Session User:", req.session?.user); // Debugging

            if (!req.session?.user || !req.session?.user._id) {
                return res.status(401).json({ msg: "Unauthorized: Session expired or user not found" });
            }

            if (!req.files || !req.files["profilePic"]) {
                return res.status(400).json({ msg: "No profile image uploaded" });
            }

            const { fname, lname, age, phoneno, exp, gender } = req.body;
            const profilePicPath = req.files["profilePic"][0].filename;

            const profileData = {
                applicant_id: req.session.user._id,
                first_name: fname,
                last_name: lname,
                age: age,
                mobile_no: phoneno,
                email_id: req.session.user.email,
                exp: exp,
                gender: gender,
                profile_pic_code: profilePicPath
            };

            console.log("Profile Data:", profileData);
            
            res.render("form/uploadForm", { pd: profileData });
        } catch (error) {
            console.error("Profile Complete Error:", error);
            res.status(500).json({ msg: "Server error", error: error.message });
        }
    }
);


// 📌 Complete profile update with resume
router.post('/updateProfile', authMiddleware(["applicant"]), 
    upload.fields([
        { name: 'prof-image', maxCount: 1 }, 
        { name: 'prof-pdf', maxCount: 1 }
    ]), 
    async (req, res) => {
        try {
            const userId = req.user._id;
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
        const userId = req.user._id;
        
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
                profilePic: user.profilePic,
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
        const userId = req.user._id;
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
            const userId = req.user._id;
            
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
            const userId = req.user._id;
            
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