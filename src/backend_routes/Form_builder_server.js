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
const checkDuplicateFormTitle = async (userId, title, formId = null) => {
    let query = `SELECT COUNT(*) AS count FROM forms WHERE user_id = ? AND title = ?`;
    let params = [userId, title];

    if (formId) {
        // Exclude the current form ID when checking for duplicates
        query += ` AND form_id != ?`;
        params.push(formId);
    }

    const result = await queryPromise(db, query, params);
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

    if (!title.trim()) {
        return res.status(400).json({ error: "Form title cannot be empty." });
    }

    if (!fields || !Array.isArray(fields) || fields.length === 0) {
        return res.status(400).json({ error: "At least one field is required." });
    }

    let connection;
    try {
        connection = await new Promise((resolve, reject) => {
            db.getConnection((err, conn) => {
                if (err) reject(err);
                else resolve(conn);
            });
        });

        await connection.beginTransaction(); // ✅ Start transaction

        // ✅ Check for duplicate form title
        const isDuplicate = await checkDuplicateFormTitle(userId, title, null);
        if (isDuplicate) {
            await connection.rollback();
            return res.status(409).json({ error: "A form with this title already exists. Please choose a different name." }); // HTTP 409 Conflict
        }

        // ✅ Insert form
        const forms_insert_query = `INSERT INTO forms (user_id, title) VALUES (?, ?)`;
        const formResult = await queryPromise(connection, forms_insert_query, [userId, title]);
        const formId = formResult.insertId;
        console.log("✅ Form saved with ID:", formId);

        // ✅ Insert form fields (validate fields before inserting)
        const fieldQueries = [];
        for (const field of fields) {
            if (!field.label.trim()) {
                await connection.rollback();
                return res.status(400).json({ error: "Field labels cannot be empty." });
            }

            // Inside the for loop in /save-form
            const form_fields_insert_query = `INSERT INTO form_fields (form_id, field_type, label) VALUES (?, ?, ?)`;
            fieldQueries.push(queryPromise(connection, form_fields_insert_query, [formId, field.field_type, field.label]));
        }

        await Promise.all(fieldQueries);
        await connection.commit(); // ✅ Commit transaction if everything is fine

        res.json({ message: "Form saved successfully!", formId });

    } catch (error) {
        if (connection) await connection.rollback(); // ❌ Rollback on error
        console.error("❌ Server error:", error);
        res.status(500).json({ error: "Server error, please try again." });
    } finally {
        if (connection) connection.release(); // ✅ Release connection
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
        const isDuplicate = await checkDuplicateFormTitle(userId, title, formId);
        if (isDuplicate) {
            return res.status(409).json({ error: "A form with this title already exists. Please choose a different name." }); // HTTP 409 Conflict
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
        const userId = req.user_id;
        const sortBy = req.query.sortBy || "created_at_desc";

        let orderClause = "ORDER BY f.created_at DESC"; // Default sorting
        if (sortBy === "created_at_asc") orderClause = "ORDER BY f.created_at ASC";
        if (sortBy === "title_asc") orderClause = "ORDER BY f.title ASC";
        if (sortBy === "title_desc") orderClause = "ORDER BY f.title DESC";
        if (sortBy === "responses_desc") orderClause = "ORDER BY response_count DESC";
        if (sortBy === "responses_asc") orderClause = "ORDER BY response_count ASC";

        const query = `
            SELECT f.form_id, f.title, 
                COUNT(fr.response_id) AS response_count 
            FROM forms f
            LEFT JOIN form_responses fr ON f.form_id = fr.form_id
            WHERE f.user_id = ?
            GROUP BY f.form_id, f.title
            ${orderClause}
        `;

        const forms = await queryPromise(db, query, [userId]);
        res.json(forms);
    } catch (error) {
        console.error("Error fetching forms:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


// ✅ Fetch a specific form by ID (Protected Route)
router.get("/get-specific-form/:formId", verifyJWT, async (req, res) => {
    const { formId } = req.params;
    const userId = req.user_id; // Ensure the user is authenticated

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        // ✅ Fetch form title
        const formQuery = "SELECT title FROM forms WHERE form_id = ? AND user_id = ?";
        const formResult = await queryPromise(db, formQuery, [formId, userId]);

        if (formResult.length === 0) {
            return res.status(404).json({ error: "Form not found or unauthorized" });
        }

        // ✅ Fetch form fields
        const fieldsQuery = "SELECT field_id, field_type, label FROM form_fields WHERE form_id = ?";
        const fieldsResult = await queryPromise(db, fieldsQuery, [formId]);

        res.json({
            formId,
            title: formResult[0].title,
            fields: fieldsResult
        });

    } catch (error) {
        console.error("❌ Error fetching form:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Update form (using existing duplicate check function)
router.put("/update-form/:formId", verifyJWT, async (req, res) => {
    console.log("✅ Received request at /api/form_builder/update-form");

    const { formId } = req.params;
    const { title, fields } = req.body;
    const userId = req.user_id;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    if (!title.trim()) {
        return res.status(400).json({ error: "Form title cannot be empty." });
    }

    if (!fields || !Array.isArray(fields) || fields.length === 0) {
        return res.status(400).json({ error: "At least one field is required." });
    }

    let connection;
    try {
        connection = await new Promise((resolve, reject) => {
            db.getConnection((err, conn) => {
                if (err) reject(err);
                else resolve(conn);
            });
        });

        await connection.beginTransaction(); // ✅ Start transaction

        // ✅ Check if a different form with the same title already exists
        const isDuplicate = await checkDuplicateFormTitle(userId, title, formId);
        if (isDuplicate) {
            await connection.rollback();
            return res.status(409).json({ error: "A form with this title already exists. Please choose a different name." }); // HTTP 409 Conflict
        }

        // ✅ Update form title
        const updateFormQuery = `UPDATE forms SET title = ? WHERE form_id = ? AND user_id = ?`;
        await queryPromise(connection, updateFormQuery, [title, formId, userId]);

        // ✅ Delete old fields
        const deleteFieldsQuery = `DELETE FROM form_fields WHERE form_id = ?`;
        await queryPromise(connection, deleteFieldsQuery, [formId]);

        // ✅ Insert new fields
        for (const field of fields) {
            if (!field.label.trim()) {
                await connection.rollback();
                return res.status(400).json({ error: "Field labels cannot be empty." });
            }

            const insertFieldQuery = `INSERT INTO form_fields (form_id, field_type, label) VALUES (?, ?, ?)`;
            await queryPromise(connection, insertFieldQuery, [formId, field.field_type, field.label]);
        }

        await connection.commit();
        res.json({ message: "Form updated successfully!" });
    } catch (error) {
        console.error("Error updating form:", error);
        if (connection) await connection.rollback(); // ❌ Rollback on error
        res.status(500).json({ error: "Internal server error. Please try again." });
    } finally {
        if (connection) connection.release();
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
