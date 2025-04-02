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
        console.log("🔵 Route Hit: /profileComplete");

        try {
            console.log("Session User:", req.session?.user);

            if (!req.session?.user || !req.session?.user._id) {
                console.log("❌ Unauthorized: No session user found.");
                return res.status(401).json({ msg: "Unauthorized: Session expired or user not found" });
            }

            if (!req.files || !req.files["profilePic"]) {
                console.log("⚠️ No profile image uploaded");
                return res.status(400).json({ msg: "No profile image uploaded" });
            }

            const { fname, lname, age, phoneno, exp, gender } = req.body;
            console.log("🔹 Received Data:", { fname, lname, age, phoneno, exp, gender });

            const profilePicPath = req.files["profilePic"][0].filename;
            console.log("📷 Profile Pic Path:", profilePicPath);

            // Check if the user exists before updating
            const existingUser = await User.findById(req.session.user._id);
            if (!existingUser) {
                console.log("❌ User not found in database");
                return res.status(404).json({ msg: "User not found" });
            }

            // Update the user profile
            const updatedUser = await User.findByIdAndUpdate(
                req.session.user._id,
                {
                    first_name: fname,
                    last_name: lname,
                    age: parseInt(age), // Ensure proper type
                    mobileNo: phoneno,
                    exp: parseInt(exp),
                    gender: gender,
                    profilePic: profilePicPath,
                },
                { new: true } // Return updated document
            );

            if (!updatedUser) {
                console.log("❌ Failed to update profile");
                return res.status(500).json({ msg: "Failed to update profile" });
            }

            console.log("✅ Updated User:", updatedUser);

            // Update session
            req.session.user = updatedUser;
            req.session.save();

            res.render("form/uploadForm", { pd: updatedUser });
        } catch (error) {
            console.error("❗ Profile Complete Error:", error);
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