const express = require("express");
const router = express.Router();
const getDBConnection = require("../../config/db"); // ✅ Use getDBConnection
const { verifyJWT } = require("../backend_routes/Login_server");

// ✅ Get database connection once
const db = getDBConnection("form_builder");

// Helper function to execute queries as Promises
const queryPromise = (db, sql, params) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) {
                console.error("❌ Database error:", err);
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};

// ✅ Function to check if a form title already exists for a user
const checkDuplicateFormTitle = async (userId, title) => {
    const query = `SELECT COUNT(*) AS count FROM forms WHERE user_id = ? AND title = ?`;
    const result = await queryPromise(db, query, [userId, title]);
    return result[0].count > 0;
};

// ✅ Save a new form (Protected Route)
router.post("/save-form", verifyJWT, async (req, res) => {
    console.log("✅ Received request at /api/form_builder/save-form");

    const { title, fields } = req.body;
    const userId = req.user_id;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        // ✅ Check for duplicate form title
        const isDuplicate = await checkDuplicateFormTitle(userId, title);
        if (isDuplicate) {
            return res.status(400).json({ error: "A form with this title already exists. Please choose a different name." });
        }

        // ✅ Insert form (if no duplicate found)
        const forms_insert_query = `INSERT INTO forms (user_id, title) VALUES (?, ?)`;
        const formResult = await queryPromise(db, forms_insert_query, [userId, title]);

        const formId = formResult.insertId;
        console.log("✅ Form saved with ID:", formId);

        // ✅ Insert form fields (if there are any)
        if (fields.length > 0) {
            const fieldQueries = fields.map((field) => {
                const form_fields_insert_query = `INSERT INTO form_fields (form_id, field_type, label) VALUES (?, ?, ?)`;
                return queryPromise(db, form_fields_insert_query, [formId, field.type, field.label]);
            });

            await Promise.all(fieldQueries);
            console.log("✅ All form fields inserted successfully");
        }

        res.json({ message: "Form saved successfully!", formId });

    } catch (error) {
        console.error("❌ Server error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ Rename a form (Protected Route)
router.put("/rename-form/:formId", verifyJWT, async (req, res) => {
    const { formId } = req.params;
    const { title } = req.body;
    const userId = req.user_id;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    if (!title) {
        return res.status(400).json({ error: "New title is required" });
    }

    try {
        // ✅ Check if a different form with the same title already exists
        const isDuplicate = await checkDuplicateFormTitle(userId, title);
        if (isDuplicate) {
            return res.status(409).json({ error: "A form with this title already exists." }); // HTTP 409 Conflict
        }

        // ✅ Proceed with renaming if no duplicate is found
        const result = await queryPromise(db, "UPDATE forms SET title = ? WHERE form_id = ? AND user_id = ?", [title, formId, userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Form not found or unauthorized" });
        }

        res.json({ message: "Form renamed successfully" });
    } catch (error) {
        console.error("Error renaming form:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Fetch user forms (Protected Route)
router.get("/get-forms", verifyJWT, async (req, res) => {
    try {
        const userId = req.user_id; // ✅ Corrected extraction of user ID

        const query = `
            SELECT f.form_id, f.title, 
                   COUNT(fr.response_id) AS response_count 
            FROM forms f
            LEFT JOIN form_responses fr ON f.form_id = fr.form_id
            WHERE f.user_id = ?
            GROUP BY f.form_id, f.title
            ORDER BY f.created_at DESC
        `;

        const forms = await queryPromise(db, query, [userId]);

        res.json(forms);
    } catch (error) {
        console.error("Error fetching forms:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Delete a form (Protected Route)
router.delete("/delete-form/:formId", verifyJWT, async (req, res) => {
    const { formId } = req.params;
    const userId = req.user_id;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        // ✅ Delete form fields first (to maintain foreign key constraints)
        await queryPromise(db, "DELETE FROM form_fields WHERE form_id = ?", [formId]);

        // ✅ Delete form itself
        const result = await queryPromise(db, "DELETE FROM forms WHERE form_id = ? AND user_id = ?", [formId, userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Form not found or unauthorized" });
        }

        res.json({ message: "Form deleted successfully" });
    } catch (error) {
        console.error("Error deleting form:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
