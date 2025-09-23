const express = require('express');
const router = express.Router();
const getDBConnection = require('../../config/db');
const { verifyJWT } = require('./Login_server');
const multer = require("multer");
const path = require("path");

// Generate a color based on user name
function generateColorFromText(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 60%)`;
}

// ✅ Get user profile details
router.get('/get-user-profile', verifyJWT, (req, res) => {
    if (!req.user_id) {
        return res.status(401).json({ error: 'Unauthorized access' });
    }

    const db = getDBConnection('form_builder');

    const query = `
        SELECT user_id, user_name, users_profile_img
        FROM form_builder.users WHERE user_id = ?;
    `;

    db.query(query, [req.user_id], (err, results) => {
        if (err) {
            console.error('❌ Error fetching profile details:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length > 0) {
            let user = results[0];

            // 🟢 Capitalize and limit to first two words
            let nameParts = user.user_name
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

            user.user_name = nameParts.slice(0, 2).join(' '); // Only keep first two names

            // 🟡 First letter only for profile display
            user.profile_letters = user.user_name.charAt(0).toUpperCase();

            // ✅ Generate profile color
            user.profile_color = generateColorFromText(user.user_name);

            return res.json(user);
        } else {
            return res.status(404).json({ error: 'Profile not found' });
        }
    });
});

// ✅ Logout API
router.post('/logout', (req, res) => {
    res.clearCookie('token', { httpOnly: true, secure: true, sameSite: 'None' });
    res.json({ success: true, message: 'Logged out successfully' });
});



const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "user_profile_uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage: storage });

router.post("/upload-profile-image", upload.single("profileImage"), async (req, res) => {
    const userId = req.body.userId;
    if (!userId) return res.status(400).json({ success: false, message: "User ID missing" });

    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

    const imagePath = req.file.path;

    try {
        const db = getDBConnection('form_builder');
        const sql = "UPDATE users SET users_profile_img = ? WHERE user_id = ?";
        db.query(sql, [imagePath, userId], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: "Database error" });
            }
            res.json({ success: true, message: "Profile image updated!", imagePath });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;
