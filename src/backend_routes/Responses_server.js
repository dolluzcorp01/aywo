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

    // Extract numeric part (e.g., "form-14" -> 14)
    const numericFormId = parseInt(formId.replace("form-", ""), 10);

    if (isNaN(numericFormId)) {
        return res.status(400).json({ error: "Invalid formId format" });
    }

    try {
        const formResponsesQuery = "SELECT * FROM dform_responses WHERE form_id = ?";
        const formResponses = await queryPromise(db, formResponsesQuery, [numericFormId]);

        if (formResponses.length === 0) {
            return res.json([]);
        }

        const responseIds = formResponses.map(res => res.response_id);
        const responseFieldsQuery = `
            SELECT rf.response_id, rf.field_id, ff.label, rf.answer, ff.type 
            FROM dform_response_fields rf
            JOIN dform_fields ff ON rf.field_id = ff.id
            WHERE rf.response_id IN (${responseIds.map(() => "?").join(",")})
        `;
        const responseFields = await queryPromise(db, responseFieldsQuery, responseIds);

        const structuredResponses = formResponses.map(response => ({
            response_id: response.response_id,
            submitted_at: response.submitted_at,
            answers: responseFields
                .filter(({ response_id }) => response_id === response.response_id)
                .map(({ field_id, label, answer, type }) => {
                    const isFile = answer && answer.includes("/");
                    return {
                        field_id,
                        label,
                        answer: isFile ? answer.split("/").pop() : answer,
                        filePath: isFile ? answer : null,
                        type
                    };
                }),
        }));

        res.json(structuredResponses);
    } catch (err) {
        console.error("❌ Error fetching responses:", err);
        res.status(500).json({ error: "Failed to fetch responses" });
    }
});

module.exports = router;
