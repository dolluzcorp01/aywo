const express = require('express');
const router = express.Router();
const getDBConnection = require('../../config/db');
const { verifyJWT } = require('./Login_server');

function generateColorFromText(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 60%)`;
}

router.get('/get-user-profile', verifyJWT, (req, res) => {
    console.log('POST /api/header called');
    console.log('Decoded user_id from JWT:', req.user_id);

    if (!req.user_id) {
        return res.status(401).json({ error: 'Unauthorized access' });
    }

    const db = getDBConnection('form_builder');

    const query = `
        SELECT user_name, LEFT(user_name, 1) AS profile_letters
        FROM form_builder.users WHERE user_id = ?;
    `;

    db.query(query, [req.user_id], (err, results) => {
        if (err) {
            console.error('❌ Error fetching profile details:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length > 0) {
            let user = results[0];
            user.profile_color = generateColorFromText(user.user_name); // ✅ Generate color dynamically
            return res.json(user);
        } else {
            return res.status(404).json({ error: 'Profile not found' });
        }
    });

});

module.exports = router;
