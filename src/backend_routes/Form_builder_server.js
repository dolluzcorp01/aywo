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
    const { title, title_font_size, title_x, title_y, title_width, title_height, form_background_color, form_color, title_color, title_background,
        submit_button_x, submit_button_y, submit_button_width, submit_button_height, submit_button_color, submit_button_background,
        fields } = req.body;
    const userId = req.user_id;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (!title.trim()) return res.status(400).json({ error: "Form title cannot be empty." });
    if (!fields || !Array.isArray(fields) || fields.length === 0) return res.status(400).json({ error: "At least one field is required." });

    let connection;
    try {
        connection = await new Promise((resolve, reject) => {
            db.getConnection((err, conn) => {
                if (err) reject(err);
                else resolve(conn);
            });
        });

        await connection.beginTransaction();

        // ✅ Check for duplicate form title
        const isDuplicate = await checkDuplicateFormTitle(userId, title);
        if (isDuplicate) {
            await connection.rollback();
            return res.status(409).json({ error: "A form with this title already exists." });
        }

        // ✅ Insert form (including colors and button properties)
        const formInsertQuery = `
            INSERT INTO forms (user_id, title, title_font_size, title_x, title_y, title_width, title_height, form_background_color, form_color, title_color, title_background, 
                               submit_button_x, submit_button_y, submit_button_width, submit_button_height, submit_button_color, submit_button_background) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const formResult = await queryPromise(connection, formInsertQuery, [
            userId,
            title,
            title_font_size,
            title_x || 50,
            title_y || 20,
            title_width || 300,
            title_height || 50,
            form_background_color || "lightgray",
            form_color || "#ffffff",
            title_color || "#000000",
            title_background || "#ffffff",
            submit_button_x || 50,
            submit_button_y || 400,
            submit_button_width || 150,
            submit_button_height || 50,
            submit_button_color || "#ffffff",
            submit_button_background || "#007bff"
        ]);
        const formId = formResult.insertId;

        // ✅ Insert form fields (validate fields before inserting)
        for (const field of fields) {
            if (!field.label.trim()) {
                await connection.rollback();
                return res.status(400).json({ error: "Field labels cannot be empty." });
            }

            const formFieldsInsertQuery = `
            INSERT INTO form_fields (form_id, field_type, label, x, y, width, height, bgColor, labelColor, fontSize, min_value, max_value) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            const fieldResult = await queryPromise(connection, formFieldsInsertQuery, [
                formId,
                field.field_type,
                field.label,
                field.x || 50,
                field.y || 80,
                field.width || 200,
                field.height || 50,
                field.bgColor || "#8B5E5E",
                field.labelColor || "#FFFFFF",
                field.fontSize || 16,
                field.min_value || 1, // Default value of 1
                field.max_value || 5  // Default value of 5
            ]);

            const fieldId = fieldResult.insertId; // Get the newly inserted field ID

            // ✅ Insert options if the field is Dropdown or Multiple Choice
            if ((field.field_type === "Dropdown" || field.field_type === "Multiple Choice") && field.options && Array.isArray(field.options)) {
                for (const option of field.options) {
                    await queryPromise(connection, "INSERT INTO form_field_options (field_id, option_text) VALUES (?, ?)", [fieldId, option]);
                }
            }

            // ✅ Insert Multiple Choice Grid options
            if (field.field_type === "Multiple Choice Grid" && field.grid_options) {
                for (const { row_label, column_label } of field.grid_options) {
                    await queryPromise(connection,
                        "INSERT INTO form_field_grid_options (field_id, row_label, column_label) VALUES (?, ?, ?)",
                        [fieldId, row_label, column_label]
                    );
                }
            }
        }

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
        const formId = req.query.formId;
        const sortBy = req.query.sortBy || "created_at_desc";

        let orderClause = "ORDER BY f.created_at DESC";
        if (sortBy === "created_at_asc") orderClause = "ORDER BY f.created_at ASC";
        if (sortBy === "title_asc") orderClause = "ORDER BY f.title ASC";
        if (sortBy === "title_desc") orderClause = "ORDER BY f.title DESC";
        if (sortBy === "responses_desc") orderClause = "ORDER BY response_count DESC";
        if (sortBy === "responses_asc") orderClause = "ORDER BY response_count ASC";

        let query = `
            SELECT f.form_id, f.title, f.starred, f.is_closed, f.internal_note, f.published, 
                   COUNT(fr.response_id) AS response_count 
            FROM forms f
            LEFT JOIN form_responses fr ON f.form_id = fr.form_id
            WHERE f.user_id = ?
        `;
        const params = [userId];

        // ✅ If formId is provided, filter by it
        if (formId) {
            query += ` AND f.form_id = ?`;
            params.push(formId.replace("form-", ""));
        }

        query += `
            GROUP BY f.form_id, f.title
            ${formId ? "" : orderClause}  -- Don’t order if you're fetching a specific form
        `;

        const forms = await queryPromise(db, query, params);
        res.json(formId ? forms[0] : forms);  // ✅ Return single form object if filtering by formId
    } catch (error) {
        console.error("Error fetching forms:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Fetch a specific form or template by ID
router.get("/get-specific-form/:formId", verifyJWT, async (req, res) => {
    const { formId } = req.params;
    const userId = req.user_id;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Check if formId starts with "template-", otherwise assume it's a regular form
    const isTemplate = formId.startsWith("template-");
    const cleanId = isTemplate ? formId.replace("template-", "") : formId.replace("form-", "");

    // Use the correct table names
    const formTable = isTemplate ? "form_templates" : "forms";
    const fieldsTable = isTemplate ? "template_fields" : "form_fields";
    const optionsTable = isTemplate ? "template_field_options" : "form_field_options";
    const gridTable = isTemplate ? "template_field_grid_options" : "form_field_grid_options";
    const userCondition = isTemplate ? "" : "AND user_id = ?"; // Only check user_id for user-created forms

    try {
        // Fetch form/template details
        const formQuery = `
            SELECT title, title_font_size, title_x, title_y, title_width, title_height, 
                   form_background_color, form_color, title_color, title_background,
                   submit_button_x, submit_button_y, submit_button_width, 
                   submit_button_height, submit_button_color, submit_button_background
            FROM ${formTable} 
            WHERE ${isTemplate ? "template_id" : "form_id"} = ? ${userCondition}`;

        const queryParams = isTemplate ? [cleanId] : [cleanId, userId];
        const formResult = await queryPromise(db, formQuery, queryParams);

        if (formResult.length === 0) {
            return res.status(404).json({ error: "Form or template not found or unauthorized" });
        }

        // Fetch form/template fields
        const fieldsQuery = `
            SELECT ${isTemplate ? "template_field_id AS field_id" : "field_id"},  
            field_type, label, x, y, width, height, bgColor, labelColor, fontSize, 
            min_value, max_value 
            FROM ${fieldsTable} 
            WHERE ${isTemplate ? "template_id" : "form_id"} = ?`;
        const fieldsResult = await queryPromise(db, fieldsQuery, [cleanId]);

        // Fetch options for Dropdown and Multiple Choice fields
        const optionsQuery = `
        SELECT ${isTemplate ? "template_field_id AS field_id" : "field_id"}, option_text 
        FROM ${optionsTable} 
        WHERE ${isTemplate ? "template_field_id" : "field_id"} IN (
            SELECT ${isTemplate ? "template_field_id" : "field_id"} 
            FROM ${fieldsTable} 
            WHERE ${isTemplate ? "template_id" : "form_id"} = ?
        ) `;
        const optionsResult = await queryPromise(db, optionsQuery, [cleanId]);

        // Fetch grid options for Matrix/Grid fields
        const gridQuery = `
         SELECT ${isTemplate ? "template_field_id AS field_id" : "field_id"}, row_label, column_label
         FROM ${gridTable}
         WHERE ${isTemplate ? "template_field_id" : "field_id"} IN (
             SELECT ${isTemplate ? "template_field_id" : "field_id"}  
             FROM ${fieldsTable} 
             WHERE ${isTemplate ? "template_id" : "form_id"} = ?
         )`;
        const gridResult = await queryPromise(db, gridQuery, [cleanId]);

        // Group options by field_id
        const optionsMap = optionsResult.reduce((acc, row) => {
            if (!acc[row.field_id]) acc[row.field_id] = [];
            acc[row.field_id].push(row.option_text);
            return acc;
        }, {});

        // Group grid options by field_id
        const gridMap = gridResult.reduce((acc, row) => {
            if (!acc[row.field_id]) acc[row.field_id] = [];
            acc[row.field_id].push({ row_label: row.row_label, column_label: row.column_label });
            return acc;
        }, {});

        // Format fields and attach options
        const formattedFields = fieldsResult.map(field => ({
            id: field.field_id,
            field_type: field.field_type,
            label: field.label,
            x: field.x,
            y: field.y,
            width: field.width,
            height: field.height,
            bgColor: field.bgColor,
            labelColor: field.labelColor,
            fontSize: field.fontSize,
            min_value: field.min_value,
            max_value: field.max_value,
            options: (field.field_type === "Dropdown" || field.field_type === "Multiple Choice")
                ? optionsMap[field.field_id] || []
                : undefined,
            grid_options: field.field_type === "Multiple Choice Grid" ? gridMap[field.field_id] || [] : undefined
        }));

        res.json({
            formId,
            title: formResult[0].title,
            title_font_size: formResult[0].title_font_size,
            title_x: formResult[0].title_x,
            title_y: formResult[0].title_y,
            title_width: formResult[0].title_width,
            title_height: formResult[0].title_height,
            form_background_color: formResult[0].form_background_color || "lightgray",
            form_color: formResult[0].form_color || "#ffffff",
            title_color: formResult[0].title_color || "#000000",
            title_background: formResult[0].title_background || "#ffffff",
            submit_button_x: formResult[0].submit_button_x ?? 50,
            submit_button_y: formResult[0].submit_button_y ?? 400,
            submit_button_width: formResult[0].submit_button_width ?? 150,
            submit_button_height: formResult[0].submit_button_height ?? 50,
            submit_button_color: formResult[0].submit_button_color || "#ffffff",
            submit_button_background: formResult[0].submit_button_background || "#007bff",
            fields: formattedFields
        });

    } catch (error) {
        console.error("❌ Error fetching form/template:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Update form (Protected Route)
router.put("/update-form/:formId", verifyJWT, async (req, res) => {
    const { formId } = req.params;
    const { title, title_font_size, title_x, title_y, title_width, title_height, form_background_color, form_color, title_color, title_background,
        submit_button_x, submit_button_y, submit_button_width, submit_button_height, submit_button_color, submit_button_background, fields } = req.body;
    const userId = req.user_id;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (!title.trim()) return res.status(400).json({ error: "Form title cannot be empty." });

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

        await connection.beginTransaction();

        // ✅ Check for duplicate title (excluding the current form)
        const isDuplicate = await checkDuplicateFormTitle(userId, title, formId);
        if (isDuplicate) {
            await connection.rollback();
            return res.status(409).json({ error: "A form with this title already exists." });
        }

        // ✅ Update form details including colors and button properties
        const updateFormQuery = `
            UPDATE forms 
            SET title = ?, title_font_size = ?, title_x = ?, title_y = ?, title_width = ?, title_height = ?, 
                form_background_color = ?, form_color = ?, title_color = ?, title_background = ?, 
                submit_button_x = ?, submit_button_y = ?, submit_button_width = ?, submit_button_height = ?, 
                submit_button_color = ?, submit_button_background = ? 
            WHERE form_id = ? AND user_id = ?`;
        await queryPromise(connection, updateFormQuery, [
            title,
            title_font_size,
            title_x || 50,
            title_y || 20,
            title_width || 300,
            title_height || 50,
            form_background_color || "lightgray",
            form_color || "#ffffff",
            title_color || "#000000",
            title_background || "#ffffff",
            submit_button_x || 50,
            submit_button_y || 400,
            submit_button_width || 150,
            submit_button_height || 50,
            submit_button_color || "#ffffff",
            submit_button_background || "#007bff",
            formId,
            userId
        ]);

        // ✅ Delete old fields and associated options
        await queryPromise(connection, "DELETE FROM form_field_options WHERE field_id IN (SELECT field_id FROM form_fields WHERE form_id = ?)", [formId]);
        await queryPromise(connection, "DELETE FROM form_field_grid_options WHERE field_id IN (SELECT field_id FROM form_fields WHERE form_id = ?)", [formId]);
        await queryPromise(connection, "DELETE FROM form_fields WHERE form_id = ?", [formId]);

        // ✅ Insert updated fields
        for (const field of fields) {
            if (!field.label.trim()) {
                await connection.rollback();
                return res.status(400).json({ error: "Field labels cannot be empty." });
            }

            const insertFieldQuery = `
            INSERT INTO form_fields (form_id, field_type, label, x, y, width, height, bgColor, labelColor, fontSize, min_value, max_value) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            const result = await queryPromise(connection, insertFieldQuery, [
                formId,
                field.field_type,
                field.label,
                field.x || 50,
                field.y || 80,
                field.width || 200,
                field.height || 50,
                field.bgColor || "#8B5E5E",
                field.labelColor || "#FFFFFF",
                field.fontSize || 16,
                field.min_value || 1, // Default value of 1
                field.max_value || 5  // Default value of 5
            ]);

            const fieldId = result.insertId; // Get the newly inserted field ID

            // ✅ Insert options if the field is Dropdown or Multiple Choice
            if ((field.field_type === "Dropdown" || field.field_type === "Multiple Choice") && field.options && Array.isArray(field.options)) {
                for (const option of field.options) {
                    await queryPromise(connection, "INSERT INTO form_field_options (field_id, option_text) VALUES (?, ?)", [fieldId, option]);
                }
            }

            // Insert field and options (similar to save-form)
            if (field.field_type === "Multiple Choice Grid" && field.grid_options) {
                for (const { row_label, column_label } of field.grid_options) {
                    await queryPromise(connection,
                        "INSERT INTO form_field_grid_options (field_id, row_label, column_label) VALUES (?, ?, ?)",
                        [fieldId, row_label, column_label]
                    );
                }
            }
        }

        await connection.commit();
        res.json({ message: "Form updated successfully!" });
    } catch (error) {
        console.error("Error updating form:", error);
        if (connection) await connection.rollback();
        res.status(500).json({ error: "Internal server error. Please try again." });
    } finally {
        if (connection) connection.release();
    }
});

// ✅ Delete a form (Fixed Version)
router.delete("/delete-form/:formId", verifyJWT, async (req, res) => {
    const { formId } = req.params;
    const userId = req.user_id;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
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

        // ✅ Correct delete order
        await queryPromise(connection, "DELETE FROM response_fields WHERE response_id IN (SELECT response_id FROM form_responses WHERE form_id = ?)", [formId]);
        await queryPromise(connection, "DELETE FROM form_responses WHERE form_id = ?", [formId]);
        await queryPromise(connection, "DELETE FROM form_fields WHERE form_id = ?", [formId]);

        // ✅ Finally, delete the form itself
        const result = await queryPromise(connection, "DELETE FROM forms WHERE form_id = ? AND user_id = ?", [formId, userId]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Form not found or unauthorized" });
        }

        await connection.commit(); // ✅ Commit transaction if everything is fine
        res.json({ message: "Form deleted successfully" });

    } catch (error) {
        console.error("Error deleting form:", error);
        if (connection) await connection.rollback(); // ❌ Rollback if any issue occurs
        res.status(500).json({ error: "Internal server error" });
    } finally {
        if (connection) connection.release(); // ✅ Release database connection
    }
});

// ✅ Publish or Unpublish a Form (Protected Route)
router.put("/publish-form/:formId", verifyJWT, async (req, res) => {
    const { formId } = req.params;
    const { published } = req.body;
    const userId = req.user_id;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
        const updateQuery = "UPDATE forms SET published = ? WHERE form_id = ? AND user_id = ?";
        await queryPromise(db, updateQuery, [published, formId, userId]);

        res.json({ message: published ? "Form published successfully!" : "Form unpublished.", formId });
    } catch (error) {
        console.error("❌ Error publishing form:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post("/duplicate-form/:formId", verifyJWT, async (req, res) => {
    const userId = req.user_id;
    const { formId } = req.params;

    let connection;
    try {
        connection = await new Promise((resolve, reject) => {
            db.getConnection((err, conn) => (err ? reject(err) : resolve(conn)));
        });

        await connection.beginTransaction();

        // Get original form
        const [originalForm] = await queryPromise(connection, "SELECT * FROM forms WHERE form_id = ?", [formId]);
        if (!originalForm) return res.status(404).json({ error: "Original form not found." });

        const newTitle = originalForm.title + " (Copy)";

        // Insert new form
        const formInsertQuery = `INSERT INTO forms (user_id, title, title_font_size, title_x, title_y, title_width, title_height,
        form_background_color, form_color, title_color, title_background, submit_button_x, submit_button_y, submit_button_width, submit_button_height,
        submit_button_color, submit_button_background)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const { insertId: newFormId } = await queryPromise(connection, formInsertQuery, [
            userId, newTitle, originalForm.title_font_size, originalForm.title_x, originalForm.title_y,
            originalForm.title_width, originalForm.title_height, originalForm.form_background_color, originalForm.form_color,
            originalForm.title_color, originalForm.title_background,
            originalForm.submit_button_x, originalForm.submit_button_y, originalForm.submit_button_width,
            originalForm.submit_button_height, originalForm.submit_button_color, originalForm.submit_button_background
        ]);

        // Copy fields
        const formFields = await queryPromise(connection, "SELECT * FROM form_fields WHERE form_id = ?", [formId]);
        for (const field of formFields) {
            const { insertId: newFieldId } = await queryPromise(connection, `
          INSERT INTO form_fields (form_id, field_type, label, x, y, width, height, bgColor, labelColor, fontSize, min_value, max_value)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                newFormId, field.field_type, field.label, field.x, field.y, field.width,
                field.height, field.bgColor, field.labelColor, field.fontSize,
                field.min_value, field.max_value
            ]);

            // Copy options
            if (["Dropdown", "Multiple Choice"].includes(field.field_type)) {
                const options = await queryPromise(connection, "SELECT * FROM form_field_options WHERE field_id = ?", [field.field_id]);
                for (const option of options) {
                    await queryPromise(connection, "INSERT INTO form_field_options (field_id, option_text) VALUES (?, ?)", [newFieldId, option.option_text]);
                }
            }

            // Copy grid options
            if (field.field_type === "Multiple Choice Grid") {
                const gridOptions = await queryPromise(connection, "SELECT * FROM form_field_grid_options WHERE field_id = ?", [field.field_id]);
                for (const grid of gridOptions) {
                    await queryPromise(connection, `
              INSERT INTO form_field_grid_options (field_id, row_label, column_label)
              VALUES (?, ?, ?)`, [newFieldId, grid.row_label, grid.column_label]);
                }
            }
        }

        await connection.commit();
        res.json({ message: "Form duplicated successfully", newForm: { ...originalForm, form_id: newFormId, title: newTitle } });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error("Error duplicating form:", err);
        res.status(500).json({ error: "Failed to duplicate form" });
    } finally {
        if (connection) connection.release();
    }
});

// ✅ Save internal note (Protected Route)
router.post("/save-note/:formId", verifyJWT, async (req, res) => {
    const { formId } = req.params;
    const { note } = req.body;
    const userId = req.user_id;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const result = await queryPromise(
            db,
            "UPDATE forms SET internal_note = ? WHERE form_id = ? AND user_id = ?",
            [note, formId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Form not found or unauthorized" });
        }

        // Return the updated form (optional)
        const [updatedForm] = await queryPromise(
            db,
            "SELECT * FROM forms WHERE form_id = ?",
            [formId]
        );

        res.json({ message: "Note saved successfully", newForm: updatedForm });
    } catch (error) {
        console.error("Error saving internal note:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Close form (Protected Route)
router.post("/close-form/:formId", verifyJWT, async (req, res) => {
    const { formId } = req.params;
    const { is_closed } = req.body; // TRUE or FALSE
    const userId = req.user_id;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const result = await queryPromise(
            db,
            "UPDATE forms SET is_closed = ? WHERE form_id = ? AND user_id = ?",
            [is_closed, formId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Form not found or unauthorized" });
        }

        const [updatedForm] = await queryPromise(
            db,
            "SELECT * FROM forms WHERE form_id = ?",
            [formId]
        );

        const statusMsg = is_closed ? "closed" : "re-opened";
        res.json({ message: `Form ${statusMsg} successfully`, newForm: updatedForm });
    } catch (error) {
        console.error("Error updating form status:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Toggle Starred Status (Protected Route)
router.post("/toggle-star/:formId", verifyJWT, async (req, res) => {
    const { formId } = req.params;
    const { starred } = req.body;
    const userId = req.user_id;

    try {
        const result = await queryPromise(
            db,
            "UPDATE forms SET starred = ? WHERE form_id = ? AND user_id = ?",
            [starred, formId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Form not found or unauthorized" });
        }

        res.json({ message: `Form ${starred ? "starred" : "unstarred"} successfully` });
    } catch (error) {
        console.error("Error toggling star:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
