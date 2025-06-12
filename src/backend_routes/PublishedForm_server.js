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

router.post("/submit-form", upload.any(), async (req, res) => {
    const { form_id } = req.body;
    let responses;

    try {
        // Parse `responses` correctly
        responses = JSON.parse(req.body.responses);
    } catch (error) {
        console.error("Error parsing responses:", error);
        responses = req.body.responses || {};
    }

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

        // ✅ Insert response into `dform_responses`
        const responseInsertQuery = "INSERT INTO dform_responses (form_id) VALUES (?)";
        const responseResult = await queryPromise(connection, responseInsertQuery, [parseInt(form_id)]);
        const response_id = responseResult.insertId;


        const files = req.files || [];
        const fieldIdToFileMap = {};

        files.forEach(file => {
            const match = file.fieldname.match(/^document_(\d+)$/); // Match document_1718
            if (match) {
                const fieldId = match[1];
                fieldIdToFileMap[fieldId] = file;
            }
        });

        // ✅ Insert individual field responses
        for (const [field_id, answer] of Object.entries(responses)) {
            let finalAnswer = answer.value;

            if (answer.type === "Choice Matrix" && typeof answer.value === "object" && !Array.isArray(answer.value)) {
                finalAnswer = JSON.stringify(answer.value); // 👈 Convert object to JSON string
            } else if (answer.type === "Address" && typeof answer.value === "object") {
                finalAnswer = JSON.stringify(answer.value);
            } else if (Array.isArray(answer.value)) {
                finalAnswer = JSON.stringify(answer.value);
            } else {
                finalAnswer = answer.value;
            }

            if (answer.type === "Document Type" && answer.value === "file_attached" && fieldIdToFileMap[field_id]) {
                const file = fieldIdToFileMap[field_id];
                finalAnswer = `/uploads/${file.filename}`;
            }

            if (!finalAnswer) {
                console.warn(`Skipping field_id ${field_id} because answer is empty.`);
                continue;
            }

            const responseFieldQuery = `
    INSERT INTO dform_response_fields (response_id, field_id, answer) 
    VALUES (?, ?, ?)`;

            if (Array.isArray(finalAnswer)) {
                finalAnswer = JSON.stringify(finalAnswer); // ✅ Convert array to JSON string
            }

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

router.get("/get-published-form/:formId/:pageId", async (req, res) => {
    const { formId, pageId } = req.params;

    try {
        // ✅ 1. Fetch the form if published
        const formQuery = "SELECT * FROM dforms WHERE id = ? AND published = 1";
        const [form] = await queryPromise(db, formQuery, [formId]);

        if (!form) {
            return res.status(404).json({ error: "Form not found or not published" });
        }

        // ✅ 2. Fetch page data
        const pageQuery = "SELECT * FROM dform_pages WHERE form_id = ? AND page_number = ?";
        const [page] = await queryPromise(db, pageQuery, [formId, pageId]);

        if (!page) {
            return res.status(404).json({ error: "Page not found" });
        }

        // ✅ 3. Fetch latest-version fields for this page
        const fieldsQuery = `
            SELECT * FROM dform_fields f
            WHERE f.form_id = ? AND f.page_id = ?
            AND f.fields_version = (
                SELECT MAX(f2.fields_version)
                FROM dform_fields f2
                WHERE f2.form_id = f.form_id AND f2.page_id = f.page_id 
            )
        `;
        const fields = await queryPromise(db, fieldsQuery, [formId, pageId]);

        const fieldIds = fields.map(f => f.id);
        let options = [], matrix = [], defaults = [], uploads = [];

        if (fieldIds.length > 0) {
            options = await queryPromise(db, `SELECT * FROM dfield_options WHERE field_id IN (${fieldIds.join(",")})`);
            matrix = await queryPromise(db, `SELECT * FROM dfield_matrix WHERE field_id IN (${fieldIds.join(",")})`);
            defaults = await queryPromise(db, `SELECT * FROM dfield_default_values WHERE form_id = ?`, [formId]);
            uploads = await queryPromise(db, `SELECT * FROM dfield_file_uploads WHERE form_id = ?`, [formId]);
        }

        const fieldsWithDetails = fields.map(field => ({
            ...field,
            options: options.filter(opt => opt.field_id === field.id),
            matrix: matrix.filter(m => m.field_id === field.id),
            default_value: defaults.find(def => def.field_id === field.id)?.field_value || null,
            uploads: uploads.filter(u => u.field_id === field.id)
        }));

        res.json({
            form,
            page,
            fields: fieldsWithDetails
        });

    } catch (error) {
        console.error("❌ Error fetching published form:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
