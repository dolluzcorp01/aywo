const express = require("express");
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
