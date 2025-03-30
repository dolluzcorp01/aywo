const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const getDBConnection = require("../../config/db");

const db = getDBConnection("form_builder");

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

// ✅ Define `upload` before using it
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // Folder where files will be stored
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname); // Unique file name
    }
});

const upload = multer({ storage });

router.post("/submit-form", upload.single("document"), async (req, res) => {
    const { form_id } = req.body;
    let responses;

    try {
        // Parse `responses` correctly
        responses = JSON.parse(req.body.responses);
    } catch (error) {
        console.error("Error parsing responses:", error);
        responses = req.body.responses || {};
    }

    console.log("Received responses:", responses); // Debugging

    const file = req.file;
    if (!form_id || !responses || Object.keys(responses).length === 0) {
        return res.status(400).json({ error: "Form ID and responses are required." });
    }

    let connection;
    try {
        connection = await new Promise((resolve, reject) => {
            db.getConnection((err, conn) => {
                if (err) reject(err);
                else resolve(conn);
            });
        });

        await connection.beginTransaction();

        // ✅ Insert response into `form_responses`
        const responseInsertQuery = "INSERT INTO form_responses (form_id) VALUES (?)";
        const responseResult = await queryPromise(connection, responseInsertQuery, [form_id]);
        const response_id = responseResult.insertId;

        console.log("Inserted response_id:", response_id); // Debugging

        // ✅ Insert individual field responses
        for (const [field_id, answer] of Object.entries(responses)) {
            let finalAnswer = answer;

            // ✅ Check if this is the file input field
            if (file && answer === "file_attached") {
                finalAnswer = `/uploads/${file.filename}`;
            }

            // ✅ Prevent inserting empty values
            if (!finalAnswer) {
                console.warn(`Skipping field_id ${field_id} because answer is empty.`);
                continue;
            }

            console.log(`Inserting field_id ${field_id} with value:`, finalAnswer); // Debugging

            const responseFieldQuery = `
                INSERT INTO response_fields (response_id, field_id, answer) 
                VALUES (?, ?, ?)`;

            await queryPromise(connection, responseFieldQuery, [response_id, field_id, finalAnswer]);
        }

        await connection.commit();
        res.json({ message: "Form submitted successfully!", filePath: file ? `/uploads/${file.filename}` : null });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("❌ Error submitting form:", error);
        res.status(500).json({ error: "Internal server error" });
    } finally {
        if (connection) connection.release();
    }
});

router.get("/get-published-form/:formId", async (req, res) => {
    const { formId } = req.params;

    try {
        // ✅ Fetch form details
        const formQuery = "SELECT * FROM forms WHERE form_id = ? AND published = TRUE";
        const formResult = await queryPromise(db, formQuery, [formId]);

        if (formResult.length === 0) {
            return res.status(404).json({ error: "Form not found or not published" });
        }

        // ✅ Fetch all fields for the form
        const fieldsQuery = "SELECT * FROM form_fields WHERE form_id = ?";
        const fieldsResult = await queryPromise(db, fieldsQuery, [formId]);

        console.log("🗄️ Raw Fields Data from DB:", fieldsResult);

        // ✅ Fetch options for fields
        const fieldIds = fieldsResult.map(field => field.field_id);
        let optionsResult = [];

        if (fieldIds.length > 0) {
            const optionsQuery = `SELECT * FROM form_field_options WHERE field_id IN (${fieldIds.join(",")})`;
            optionsResult = await queryPromise(db, optionsQuery);
        }

        console.log("🎯 Raw Options Data from DB:", optionsResult);

        // ✅ Structure the fields with their respective options
        const fieldsWithOptions = fieldsResult.map(field => ({
            ...field,
            options: optionsResult
                .filter(option => option.field_id === field.field_id)
                .map(option => option.option_text) // Extract only option text
        }));

        console.log("✅ Parsed Fields with Options:", fieldsWithOptions);

        res.json({ form: formResult[0], fields: fieldsWithOptions });
    } catch (error) {
        console.error("❌ Error fetching published form:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
