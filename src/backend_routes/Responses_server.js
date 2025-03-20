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

// ✅ Get Responses for a Form
router.get("/get-responses/:formId", async (req, res) => {
    const { formId } = req.params;

    try {
        // ✅ Fetch responses for the given form ID
        const formResponsesQuery = "SELECT * FROM form_responses WHERE form_id = ?";
        const formResponses = await queryPromise(db, formResponsesQuery, [formId]);

        if (formResponses.length === 0) {
            return res.json([]); // Return empty array if no responses found
        }

        // ✅ Fetch response fields for all responses
        const responseIds = formResponses.map(res => res.response_id);
        const responseFieldsQuery = `
            SELECT rf.response_id, rf.field_id, ff.label, rf.answer 
            FROM response_fields rf
            JOIN form_fields ff ON rf.field_id = ff.field_id
            WHERE rf.response_id IN (${responseIds.map(() => "?").join(",")})
        `;
        const responseFields = await queryPromise(db, responseFieldsQuery, responseIds);

        // ✅ Organize responses in structured format
        const structuredResponses = formResponses.map(response => ({
            response_id: response.response_id,
            submitted_at: response.submitted_at,
            answers: responseFields
                .filter(field => field.response_id === response.response_id)
                .map(({ field_id, label, answer }) => ({ field_id, label, answer }))
        }));

        res.json(structuredResponses);
    } catch (err) {
        console.error("❌ Error fetching responses:", err);
        res.status(500).json({ error: "Failed to fetch responses" });
    }
});

module.exports = router;
