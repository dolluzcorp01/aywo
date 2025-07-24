const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const multer = require("multer");
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
    let query = `SELECT COUNT(*) AS count FROM dforms WHERE user_id = ? AND title = ?`;
    let params = [userId, title];

    if (formId) {
        // Exclude the current form ID when checking for duplicates
        query += ` AND id != ?`;
        params.push(formId);
    }

    const result = await queryPromise(db, query, params);
    return result[0].count > 0;
};

router.post("/create", verifyJWT, async (req, res) => {
    const { title } = req.body;
    const userId = req.user_id;

    if (!userId) {
        return res.status(401).json({ message: "User ID is missing. Unauthorized access." });
    }

    if (!title || title.trim() === "") {
        return res.status(400).json({ message: "Form title is required" });
    }

    try {
        const isDuplicate = await checkDuplicateFormTitle(userId, title);
        if (isDuplicate) {
            return res.status(409).json({ message: "Form title already exists" });
        }

        // Insert into dforms
        const formQuery = `
            INSERT INTO dforms (
                user_id, title, internal_note, starred, is_closed,
                published, background_color, questions_background_color,
                primary_color, questions_color, answers_color, font, created_at
            ) VALUES (?, ?, '', 0, 0, 0, '#f8f9fa', '#fff', '#3b82f6', '#333333', '#rgb(55, 65, 81)', '', NOW())
        `;
        const formResult = await queryPromise(db, formQuery, [userId, title]);
        const formId = formResult.insertId;

        // Insert first page
        const pageQuery = `
            INSERT INTO dform_pages (form_id, page_title, sort_order, page_number)
            VALUES (?, 'page', 1, 1)
        `;
        const pageResult = await queryPromise(db, pageQuery, [formId]);

        // Insert "Thank You" field into dform_fields
        const thankYouFieldQuery = `
            INSERT INTO dform_fields (
                form_id, page_id, type, label, placeholder, caption, default_value,
                description, alert_type, font_size, required, sort_order,
                min_value, max_value, fields_version, created_at
            ) VALUES (?, ?, 'ThankYou', 'ThankYou', '', '', '', '', 'info', 16, 'No', 0, NULL, NULL, 1, NOW())
        `;
        const thankYouFieldResult = await queryPromise(db, thankYouFieldQuery, [formId, 'end']);
        const fieldId = thankYouFieldResult.insertId;

        // Insert into dform_thankyou
        const thankYouQuery = `
            INSERT INTO dform_thankyou (form_id, field_id)
            VALUES (?, ?)
        `;
        await queryPromise(db, thankYouQuery, [formId, fieldId]);

        res.status(200).json({
            form_id: formId,
            page_id: '1',
            thank_you_field_id: fieldId,
            message: "Form, page, and thank you components created successfully"
        });

    } catch (error) {
        console.error("❌ Insert error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.post("/createnewpage", verifyJWT, async (req, res) => {
    const { form_id, title } = req.body;
    const userId = req.user_id;

    if (!userId) {
        return res.status(401).json({ message: "User ID is missing. Unauthorized access." });
    }

    if (!form_id || !title || title.trim() === "") {
        return res.status(400).json({ message: "Form ID and page title are required" });
    }

    try {
        // Get max sort_order and max page_number
        const [[{ max_order }], [{ max_page_number }]] = await Promise.all([
            queryPromise(db, `SELECT MAX(sort_order) AS max_order FROM dform_pages WHERE form_id = ?`, [form_id]),
            queryPromise(db, `SELECT MAX(page_number) AS max_page_number FROM dform_pages WHERE form_id = ?`, [form_id])
        ]);

        const nextSortOrder = (max_order || 0) + 1;
        const nextPageNumber = (max_page_number || 0) + 1;

        const pageQuery = `
            INSERT INTO dform_pages (form_id, page_title, sort_order, page_number)
            VALUES (?, ?, ?, ?)
        `;
        const pageResult = await queryPromise(db, pageQuery, [form_id, title, nextSortOrder, nextPageNumber]);

        res.status(200).json({
            page_id: pageResult.insertId,
            page_number: nextPageNumber,
            form_id,
            message: "Page created successfully"
        });
    } catch (error) {
        console.error("❌ Page creation error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Multer storage for field file uploads
const saveFormUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            if (file.fieldname === "backgroundImage") {
                cb(null, "form_bg_img_uploads/");
            } else {
                cb(null, "field_file_uploads/");
            }
        },
        filename: (req, file, cb) => {
            cb(null, Date.now() + "-" + file.originalname);
        }
    }),
    limits: { fileSize: 50 * 1024 * 1024 }
});

// ✅ Save or update a form
router.post("/save-form", verifyJWT, saveFormUpload.any(), async (req, res) => {
    const userId = req.user_id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const {
        title = "Untitled Form",
        form_id: existingFormId,
        background_color = "#ffffff",
        questions_background_color = "#f1f1f1",
        primary_color = "#007bff",
        questions_color = "#333333",
        answers_color = "#000000",
        font = "",
        fields
    } = req.body;

    let parsedFields;
    try {
        parsedFields = JSON.parse(fields);
        console.log("Parsed Fields:", parsedFields);
    } catch (err) {
        console.error("❌ Failed to parse fields:", fields);
        return res.status(400).json({ error: "Invalid fields JSON" });
    }

    if (!Array.isArray(parsedFields) || parsedFields.length === 0) {
        return res.status(400).json({ error: "At least one field is required." });
    }

    const uploadedFilesMap = {};
    let backgroundImagePath = null;

    if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
            if (file.fieldname === "backgroundImage") {
                backgroundImagePath = file.path;
            } else {
                uploadedFilesMap[file.fieldname] = file.path;
            }
        }
    }

    if (!backgroundImagePath && req.body.backgroundImagePath) {
        const fullPath = req.body.backgroundImagePath;
        const index = fullPath.indexOf('form_bg_img_uploads');
        if (index !== -1) {
            backgroundImagePath = fullPath.substring(index); // Extract only the relative path
        } else {
            backgroundImagePath = fullPath; // fallback, store as-is if pattern not found
        }
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

        let formId = existingFormId;

        if (formId) {
            // 📝 Update form styling and title
            await new Promise((resolve, reject) => {
                connection.query(
                    `UPDATE dforms SET
            title = ?, background_color = ?, questions_background_color = ?,
            primary_color = ?, questions_color = ?, answers_color = ?, font = ?,
            background_image = ?, updated_at = NOW()
         WHERE id = ? AND user_id = ?`,
                    [
                        title, background_color, questions_background_color,
                        primary_color, questions_color, answers_color, font,
                        backgroundImagePath || null,
                        formId, userId
                    ],
                    (err) => {
                        if (err) return reject(err);
                        resolve();
                    }
                );
            });

        } else {
            // ➕ Insert new form
            const [formResult] = await new Promise((resolve, reject) => {
                connection.query(`INSERT INTO dforms (
            user_id, form_title, internal_note, starred, is_closed, published,
            background_color, questions_background_color, primary_color,
            questions_color, answers_color, font, background_image, created_at
        ) VALUES (?, ?, '', 0, 0, 0, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                    [
                        userId, title, background_color, questions_background_color,
                        primary_color, questions_color, answers_color, font,
                        backgroundImagePath || null
                    ], (err, result) => {
                        if (err) return reject(err);
                        resolve([result]);
                    });
            });

            formId = formResult.insertId;
        }

        let fieldVersion = 1;

        if (existingFormId) {
            const versionResult = await new Promise((resolve, reject) => {
                connection.query(
                    `SELECT MAX(fields_version) AS maxVersion FROM dform_fields WHERE form_id = ?`,
                    [formId],
                    (err, results) => {
                        if (err) return reject(err);
                        resolve(results);
                    }
                );
            });

            const maxVersion = versionResult[0]?.maxVersion || 0;
            fieldVersion = maxVersion + 1;
        }

        // Insert fields (same as before)
        for (const field of parsedFields) {
            const fieldResult = await new Promise((resolve, reject) => {
                connection.query(
                    `INSERT INTO dform_fields (
                        form_id, page_id, type, label, placeholder, caption, default_value, description, alert_type, font_size, required, sort_order,
                        min_value, max_value, heading_alignment, btnalignment, btnbgColor, btnlabelColor, fields_version
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        formId,
                        field.page_id,
                        field.type,
                        field.label || "",
                        field.placeholder || "",
                        field.caption || "",
                        typeof field.default_value === "object" ? JSON.stringify(field.default_value) : field.default_value || "",
                        field.description || "",
                        field.alert_type || "info",
                        parseInt(field.font_size) || 14,
                        field.required ? "Yes" : "No",
                        field.sortOrder || 0,
                        field.min_value || null,
                        field.max_value || null,
                        field.alignment || "",
                        field.btnalignment || "",
                        field.btnbgColor || "",
                        field.btnlabelColor || "",
                        fieldVersion
                    ],
                    (err, result) => {
                        if (err) return reject(err);
                        resolve(result);
                    }
                );
            });

            const fieldId = fieldResult.insertId;

            // ✅ Insert into dfield_file_uploads 
            if (["Image", "PDF", "Video"].includes(field.type)) {

                if (field.file && typeof field.file === 'object' && field.file.name) {
                    // Skip appending here (this is server-side)
                    // Do nothing on server, file already uploaded via multer
                } else if (field.uploads?.length > 0) {
                    const upload = field.uploads[0];
                    field.file_path = upload.file_path;
                    field.file_type = upload.file_type;
                    field.previewSize = upload.file_field_size;
                    field.alignment = upload.file_field_Alignment;
                }

                const fileKey = field.file; // should be 'field_file_0_0' or similar
                const uploadedFilename = uploadedFilesMap[fileKey] || field.file_path;

                if (uploadedFilename) {
                    const alignment = field.alignment || "center";
                    const previewSize = field.previewSize || 300;

                    await connection.query(`
                    INSERT INTO dfield_file_uploads (field_id, form_id, file_type, file_path, file_field_size, file_field_Alignment)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [
                        fieldId,
                        formId,
                        field.type,
                        uploadedFilename,
                        previewSize,
                        alignment
                    ]);
                }
            }

            // ✅ Insert into dfield_file_uploads 
            if (["YouTubeVideo"].includes(field.type)) {
                const previewSize = field.previewSize || 300;

                await connection.query(`
                        INSERT INTO dfield_file_uploads (field_id, form_id, file_type, file_path, youtube_url, file_field_size, file_field_Alignment)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `, [
                    fieldId,
                    formId,
                    field.type,
                    '',
                    field.youtubeUrl,
                    previewSize,
                    ''
                ]);
            }

            // Insert options
            if (field.options && Array.isArray(field.options)) {
                for (const opt of field.options) {
                    let savedFilePath = null;
                    if (opt.image_path) {
                        savedFilePath = uploadedFilesMap[opt.image_path] || opt.image_path;
                    }

                    await connection.query(`
                        INSERT INTO dfield_options (
                            field_id, option_text, options_style, sort_order, image_path
                        ) VALUES (?, ?, ?, ?, ?)
                    `, [fieldId, opt.option_text || '', field.style || '', opt.sortOrder || 0, savedFilePath]);
                }
            }

            // Insert matrix
            if (field.matrix) {
                const { rows = [], columns = [] } = field.matrix;

                for (const row of rows) {
                    await connection.query(`
                        INSERT INTO dfield_matrix (field_id, row_label, column_label)
                        VALUES (?, ?, NULL)
                    `, [fieldId, row]);
                }

                for (const col of columns) {
                    await connection.query(`
                        INSERT INTO dfield_matrix (field_id, row_label, column_label)
                        VALUES (?, NULL, ?)
                    `, [fieldId, col]);
                }
            }

            // Insert default values
            if (field.default_value) {
                await connection.query(`
                    INSERT INTO dfield_default_values (
                        form_id, field_id, field_value, submitted_at
                    ) VALUES (?, ?, ?, NOW())
                `, [formId, fieldId, typeof field.default_value === 'object' ? JSON.stringify(field.default_value) : field.default_value]);
            }

            if (field.type === "ThankYou") {
                await connection.query(`
                INSERT INTO dform_thankyou (
                    form_id, field_id, show_tick_icon, thankyou_heading, thankyou_subtext, created_at
                ) VALUES (?, ?, ?, ?, ?, NOW())
            `, [
                    formId,
                    fieldId,
                    field.show_tick_icon === true,
                    field.thankyou_heading || 'Thank you',
                    field.thankyou_subtext || 'Made with dForms, the easy way to make stunning forms'
                ]);
            }

        }

        await connection.commit();
        res.status(200).json({
            success: true,
            formId,
            message: existingFormId ? "Form updated successfully!" : "Form saved successfully!"
        });

    } catch (error) {
        console.error("Error saving form:", error);
        if (connection) await new Promise((resolve) => connection.rollback(resolve));
        res.status(500).json({ error: "Internal server error. Please try again." });
    } finally {
        if (connection) connection.release();
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
        const result = await queryPromise(db, "UPDATE dforms SET title = ? WHERE id = ? AND user_id = ?", [title, formId, userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Form not found or unauthorized" });
        }

        res.json({ message: "Form renamed successfully" });
    } catch (error) {
        console.error("Error renaming form:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.put("/rename-page/:pageId", verifyJWT, async (req, res) => {
    const { pageId } = req.params;
    const { title } = req.body;
    const userId = req.user_id;

    if (!title || !userId) {
        return res.status(400).json({ error: "Missing data" });
    }

    try {
        // Check page ownership
        const page = await queryPromise(db, `
      SELECT dp.* FROM dform_pages dp 
      JOIN dforms f ON dp.form_id = f.id 
      WHERE dp.id = ? AND f.user_id = ?
    `, [pageId, userId]);

        if (!page.length) {
            return res.status(404).json({ error: "Page not found or unauthorized" });
        }

        await queryPromise(db, `UPDATE dform_pages SET page_title = ? WHERE id = ?`, [title, pageId]);
        res.json({ message: "Page renamed successfully" });
    } catch (err) {
        console.error("Error renaming page:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Fetch user forms (Protected Route)
router.get("/get-forms", verifyJWT, async (req, res) => {
    try {
        const userId = req.user_id;
        const rawFormId = req.query.formId;
        const formId = rawFormId ? rawFormId.match(/\d+$/)?.[0] : null;
        const sortBy = req.query.sortBy || "created_at_desc";

        let orderClause = "ORDER BY f.created_at DESC";
        if (sortBy === "created_at_asc") orderClause = "ORDER BY f.created_at ASC";
        if (sortBy === "title_asc") orderClause = "ORDER BY f.title ASC";
        if (sortBy === "title_desc") orderClause = "ORDER BY f.title DESC";
        if (sortBy === "responses_desc") orderClause = "ORDER BY response_count DESC";
        if (sortBy === "responses_asc") orderClause = "ORDER BY response_count ASC";

        let query = `
            SELECT 
                f.id AS form_id,
                first_page.page_number AS page_id,
                f.user_id,
                f.title,
                f.internal_note,
                f.starred,
                f.is_closed,
                f.published,
                f.background_color,
                f.questions_background_color,
                f.primary_color,
                f.questions_color,
                f.answers_color,
                f.font,
                f.created_at, 
                COUNT(fr.response_id) AS response_count 
            FROM dforms f
            LEFT JOIN (
                SELECT page_number, form_id
                FROM (
                    SELECT 
                        page_number,
                        form_id,
                        ROW_NUMBER() OVER (PARTITION BY form_id ORDER BY sort_order ASC) AS rn
                    FROM dform_pages
                ) ranked_pages
                WHERE rn = 1
            ) AS first_page ON f.id = first_page.form_id
            LEFT JOIN dform_responses fr ON f.id = fr.form_id
            WHERE f.user_id = ? 
        `;

        const params = [userId];

        if (formId) {
            query += ` AND f.id = ?`;
            params.push(formId);
        }

        query += `  GROUP BY 
                        f.id,
                        first_page.page_number,
                        f.user_id,
                        f.title,
                        f.internal_note,
                        f.starred,
                        f.is_closed,
                        f.published,
                        f.background_color,
                        f.questions_background_color,
                        f.primary_color,
                        f.questions_color,
                        f.answers_color,
                        f.font,
                        f.created_at `;

        if (!formId) {
            query += `${orderClause}`;
        }

        const forms = await queryPromise(db, query, params);

        // Always send valid JSON
        if (formId) {
            if (forms.length === 0) {
                return res.status(404).json({ error: "Form not found" });
            }
            return res.json(forms[0]);
        } else {
            return res.json(forms); // Even if empty, it's still valid JSON
        }

    } catch (error) {
        console.error("Error fetching forms:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Fetch Templates (Protected Route)
router.get("/get-templates", verifyJWT, async (req, res) => {
    try {
        const userId = req.user_id;
        const rawFormId = req.query.formId;
        const formId = rawFormId ? rawFormId.match(/\d+$/)?.[0] : null;

        if (formId) {
            let query = `
                        SELECT 
                        f.id AS form_id,
                        f.user_id,
                        f.title,
                        f.created_at,
                        p.id AS page_id,
                        p.page_number,
                        p.page_title,
                        p.sort_order
                        FROM temlpates_dforms f
                        LEFT JOIN temlpates_dform_pages p ON f.id = p.form_id
                        WHERE f.id = ?
                    `;
            const params = [formId];
            const result = await queryPromise(db, query, params);
            if (result.length === 0) {
                return res.status(404).json({ error: "Template not found" });
            }
            return res.json({
                form_id: result[0].form_id,
                user_id: result[0].user_id,
                title: result[0].title,
                created_at: result[0].created_at,
                pages: result.map(r => ({
                    page_id: r.page_id,
                    page_number: r.page_number,
                    page_title: r.page_title,
                    sort_order: r.sort_order
                }))
            });
        } else {
            // Return all templates for user
            let query = `
                        SELECT 
                        f.id AS form_id,
                        f.user_id,
                        f.title,
                        f.created_at
                        FROM temlpates_dforms f
                        WHERE f.user_id = ?
                    `;
            const forms = await queryPromise(db, query, [userId]);
            return res.json(forms);
        }


    } catch (error) {
        console.error("Error fetching forms:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Fetch all page names
router.get("/get-form-pages/:formId", async (req, res) => {
    const { formId } = req.params;

    try {
        const pagesQuery = `
            SELECT id, form_id, page_number, page_title, sort_order 
            FROM dform_pages 
            WHERE form_id = ? 
            ORDER BY sort_order ASC
        `;
        const pages = await queryPromise(db, pagesQuery, [formId]);

        res.json({ pages });
    } catch (error) {
        console.error("❌ Error fetching form pages:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST /api/form_builder/update-page-order
router.post("/update-page-order", verifyJWT, async (req, res) => {
    const { pages } = req.body;
    const userId = req.user_id;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    let connection;
    try {
        // Fix: getConnection using callback pattern wrapped in a Promise
        connection = await new Promise((resolve, reject) => {
            db.getConnection((err, conn) => {
                if (err) return reject(err);
                resolve(conn);
            });
        });

        await new Promise((resolve, reject) => {
            connection.beginTransaction(err => {
                if (err) return reject(err);
                resolve();
            });
        });

        for (const page of pages) {
            await new Promise((resolve, reject) => {
                connection.query(
                    "UPDATE dform_pages SET sort_order = ? WHERE id = ?",
                    [page.sort_order, page.id],
                    (err) => {
                        if (err) return reject(err);
                        resolve();
                    }
                );
            });
        }

        await new Promise((resolve, reject) => {
            connection.commit(err => {
                if (err) return reject(err);
                resolve();
            });
        });

        res.json({ success: true });

    } catch (err) {
        if (connection) {
            await new Promise(resolve => connection.rollback(resolve));
        }
        console.error("❌ Error updating sort order:", err);
        res.status(500).json({ error: "Failed to update page order" });
    } finally {
        if (connection) connection.release();
    }
});

router.post("/check-pages-btnfields", verifyJWT, async (req, res) => {
    const { pageIds, lastPageId, formId } = req.body;
    if (!Array.isArray(pageIds)) return res.status(400).json({ error: "Invalid page IDs" });

    let connection;
    try {
        connection = await new Promise((resolve, reject) => {
            db.getConnection((err, conn) => (err ? reject(err) : resolve(conn)));
        });

        const placeholders = pageIds.map(() => '?').join(',');

        // 1. Get page mappings including page_number and sort_order
        const pageMappings = await new Promise((resolve, reject) => {
            connection.query(
                `SELECT id, page_number, sort_order FROM form_builder.dform_pages WHERE id IN (${placeholders})`,
                pageIds,
                (err, results) => (err ? reject(err) : resolve(results))
            );
        });

        const idToPageNumber = {};
        const pageSortOrderMap = {};
        pageMappings.forEach(row => {
            idToPageNumber[row.id] = row.page_number;
            pageSortOrderMap[row.page_number] = row.sort_order;
        });

        // 2. Get latest fields_version per page_number
        const pageNumbers = pageIds.map(id => idToPageNumber[id]).filter(Boolean);
        const versionPlaceholders = pageNumbers.map(() => '?').join(',');

        const versionResults = await new Promise((resolve, reject) => {
            connection.query(
                `SELECT page_id, MAX(fields_version) as latest_version
                 FROM dform_fields
                 WHERE form_id = ? AND page_id IN (${versionPlaceholders})
                 GROUP BY page_id`,
                [formId, ...pageNumbers],
                (err, results) => (err ? reject(err) : resolve(results))
            );
        });

        const pageIdToVersion = {};
        versionResults.forEach(row => {
            pageIdToVersion[row.page_id] = row.latest_version;
        });

        // 3. Determine page_number and version for lastPageId
        const lastPageNumber = idToPageNumber[lastPageId];
        const lastPageVersion = pageIdToVersion[lastPageNumber] || 1;

        // 4. Get Submit button field from lastPage
        const [submitRow] = await new Promise((resolve, reject) => {
            connection.query(
                `SELECT id, page_id, label FROM dform_fields
         WHERE form_id = ? AND type = 'Submit' AND fields_version = ?
         LIMIT 1`,
                [formId, lastPageVersion],
                (err, results) => (err ? reject(err) : resolve(results))
            );
        });

        const submitbtnField = submitRow;

        if (submitbtnField) {
            const submitPageId = parseInt(submitbtnField.page_id);
            const submitPageOrder = pageSortOrderMap[submitPageId];
            const sortedOrders = Object.values(pageSortOrderMap).sort((a, b) => a - b);
            const maxOrder = sortedOrders[sortedOrders.length - 1];

            if (submitPageOrder !== maxOrder) {
                //❗Submit button is not on the last page, so update to Next button
                await new Promise((resolve, reject) => {
                    connection.query(
                        `UPDATE dform_fields SET type = 'Next', label = 'Next' WHERE id = ?`,
                        [submitbtnField.id],
                        (err) => (err ? reject(err) : resolve())
                    );
                });
                console.log("🔄 Converted Submit button to Next button because it's not on the last page.");
            } else {
                console.log("✅ Submit button is on the last page, no changes needed.");
            }
        }

        // 5. Get Next button
        // 5. Convert the Next button on the last page to Submit (if present)

        // Find page_id with max sort_order
        let maxSortOrder = -Infinity;
        let lastSortedPageId = null;
        for (const [pageId, sortOrder] of Object.entries(pageSortOrderMap)) {
            if (sortOrder > maxSortOrder) {
                maxSortOrder = sortOrder;
                lastSortedPageId = parseInt(pageId);
            }
        }

        const lastSortedPageVersion = pageIdToVersion[lastSortedPageId] || 1;

        // Now find Next button in that last page and update it to Submit
        const [lastPageNextRow] = await new Promise((resolve, reject) => {
            connection.query(
                `SELECT id, page_id, label FROM dform_fields
         WHERE form_id = ? AND page_id = ? AND type = 'Next' AND fields_version = ?
         LIMIT 1`,
                [formId, lastSortedPageId, lastSortedPageVersion],
                (err, results) => (err ? reject(err) : resolve(results))
            );
        });

        const finalNextBtn = lastPageNextRow;

        if (finalNextBtn) {
            await new Promise((resolve, reject) => {
                connection.query(
                    `UPDATE dform_fields SET type = 'Submit', label = 'Submit' WHERE id = ?`,
                    [finalNextBtn.id],
                    (err) => (err ? reject(err) : resolve())
                );
            });
            console.log("🔄 Converted Next button to Submit button on the last sorted page.");
        } else {
            console.log("ℹ️ No Next button found on the last sorted page.");
        }

        let updatedSubmitField = null;
        let updatedNextField = null;

        if (submitbtnField) {
            [updatedSubmitField] = await new Promise((resolve, reject) => {
                connection.query(
                    `SELECT id, page_id, type, label FROM dform_fields WHERE id = ?`,
                    [submitbtnField.id],
                    (err, results) => (err ? reject(err) : resolve(results))
                );
            });
        }

        if (finalNextBtn) {
            [updatedNextField] = await new Promise((resolve, reject) => {
                connection.query(
                    `SELECT id, page_id, type, label FROM dform_fields WHERE id = ?`,
                    [finalNextBtn.id],
                    (err, results) => (err ? reject(err) : resolve(results))
                );
            });
        }

        res.json({
            submitbtnField: updatedSubmitField,
            nextbtnfield: updatedNextField
        });

    } catch (err) {
        console.error("❌ Error checking fields:", err);
        res.status(500).json({ error: "Failed to check fields" });
    } finally {
        if (connection) connection.release();
    }
});

// ✅ Fetch a specific form or template by ID
router.get("/get-specific-form/:formId/page/:pageId", verifyJWT, async (req, res) => {
    const { formId, pageId } = req.params;
    const userId = req.user_id;
    const { version } = req.query;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        // 1. Fetch form
        const formQuery = `
            SELECT id, user_id, title, internal_note, starred, is_closed, published,
                   background_color, background_image, questions_background_color, primary_color,
                   questions_color, answers_color, font, created_at
            FROM dforms
            WHERE id = ? AND user_id = ?
        `;
        const [form] = await queryPromise(db, formQuery, [formId, userId]);

        if (!form) {
            return res.status(404).json({ error: "Form not found or unauthorized" });
        }

        // 2. Fetch the page
        const pageQuery = `
            SELECT id, form_id, page_number, page_title, sort_order, created_at
            FROM dform_pages
            WHERE page_number = ? AND form_id = ?
        `;
        const [page] = await queryPromise(db, pageQuery, [pageId, formId]);

        if (!page && pageId !== "end") {
            return res.status(404).json({ error: "Page not found for this form" });
        }

        // 3. Fetch fields belonging to this form and page
        let fieldsQuery = '';
        let fieldsParams = [];
        if (version) {
            // ✅ Use the specific version
            fieldsQuery = `
    SELECT * FROM dform_fields 
    WHERE form_id = ? AND page_id = ? AND fields_version = ?
  `;
            fieldsParams = [formId, pageId, version];
        } else {
            // ✅ Default to latest version
            fieldsQuery = `
    SELECT * FROM dform_fields 
    WHERE form_id = ? AND page_id = ? AND fields_version = (
      SELECT MAX(fields_version) FROM dform_fields WHERE form_id = ? AND page_id = ?
    )
  `;
            fieldsParams = [formId, pageId, formId, pageId];
        }

        const fields = await queryPromise(db, fieldsQuery, fieldsParams);

        // ✅ Version exists check
        if (version && fields.length === 0 && version !== '1') {
            return res.status(404).json({ error: `Version ${version} not found for this form/page.` });
        }

        // 4. Enrich each field with options and matrix data
        const enrichedFields = await Promise.all(
            fields.map(async (field) => {
                const fieldId = field.id;

                // Fetch field options
                const optionsQuery = `
                    SELECT id, option_text, options_style, sort_order, image_path
                    FROM dfield_options
                    WHERE field_id = ?
                    ORDER BY sort_order ASC
                `;
                const options = await queryPromise(db, optionsQuery, [fieldId]);

                // Fetch matrix rows/columns
                const matrixQuery = `
                    SELECT row_label, column_label
                    FROM dfield_matrix
                    WHERE field_id = ?
                `;
                const matrix = await queryPromise(db, matrixQuery, [fieldId]);

                // ✅ Fetch uploaded files
                const uploadsQuery = `
                    SELECT id, file_type, file_path, youtube_url, file_field_size, file_field_Alignment, uploaded_at
                    FROM dfield_file_uploads
                    WHERE field_id = ? AND form_id = ?
                `;
                const uploads = await queryPromise(db, uploadsQuery, [fieldId, formId]);

                // Fetch thank you data
                const thankyouQuery = `
                    SELECT show_tick_icon, thankyou_heading, thankyou_subtext
                    FROM dform_thankyou
                    WHERE form_id = ? AND field_id = ?
                    LIMIT 1
                `;
                const thankyouData = await queryPromise(db, thankyouQuery, [formId, fieldId]);

                return {
                    ...field,
                    options: options || [],
                    matrix: matrix || [],
                    uploads: uploads || [],
                    thankyouData
                };
            })
        );

        // 5. Return response
        res.json({
            ...form,
            fields: enrichedFields
        });

    } catch (error) {
        console.error("❌ Error fetching form:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Delete a form (Fixed Version)
function safeDelete(filePath) {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}

router.delete("/delete-form/:formId", verifyJWT, async (req, res) => {
    const { formId } = req.params;
    const userId = req.user_id;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    let connection;
    try {
        connection = await new Promise((resolve, reject) => {
            db.getConnection((err, conn) => (err ? reject(err) : resolve(conn)));
        });

        await connection.beginTransaction();

        // ✅ 1. Gather all file paths before deleting rows
        const [formRow] = await queryPromise(connection, `SELECT background_image FROM dforms WHERE id = ?`, [formId]);

        const uploadsInResponses = await queryPromise(
            connection,
            `SELECT answer FROM dform_response_fields WHERE response_id IN (
         SELECT response_id FROM dform_responses WHERE form_id = ?
      )`,
            [formId]
        );

        const uploadsInFileUploads = await queryPromise(
            connection,
            `SELECT file_path FROM dfield_file_uploads WHERE form_id = ?`,
            [formId]
        );

        const uploadsInOptions = await queryPromise(
            connection,
            `SELECT image_path FROM dfield_options WHERE field_id IN (
         SELECT id FROM dform_fields WHERE form_id = ?
      )`,
            [formId]
        );

        // ✅ 2. Delete DB rows in proper order
        await queryPromise(
            connection,
            `DELETE FROM dform_response_fields WHERE response_id IN (
        SELECT response_id FROM dform_responses WHERE form_id = ?
      )`, [formId]
        );
        await queryPromise(connection, `DELETE FROM dform_responses WHERE form_id = ?`, [formId]);

        const fields = await queryPromise(connection, `SELECT id FROM dform_fields WHERE form_id = ?`, [formId]);
        const fieldIds = fields.map(f => f.id);

        if (fieldIds.length) {
            // 🗑️ Delete dependent rows in dfield_default_values first
            await queryPromise(connection, `DELETE FROM dfield_default_values WHERE field_id IN (?)`, [fieldIds]);

            // ✅ Then the rest as you already have it:
            await queryPromise(connection, `DELETE FROM dfield_matrix WHERE field_id IN (?)`, [fieldIds]);
            await queryPromise(connection, `DELETE FROM dfield_options WHERE field_id IN (?)`, [fieldIds]);
            await queryPromise(connection, `DELETE FROM dfield_file_uploads WHERE field_id IN (?)`, [fieldIds]);
        }

        await queryPromise(connection, `DELETE FROM dform_thankyou WHERE form_id = ?`, [formId]);
        await queryPromise(connection, `DELETE FROM dform_fields WHERE form_id = ?`, [formId]);
        await queryPromise(connection, `DELETE FROM dform_pages WHERE form_id = ?`, [formId]);

        const result = await queryPromise(
            connection,
            `DELETE FROM dforms WHERE id = ? AND user_id = ?`, [formId, userId]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Form not found or unauthorized" });
        }

        await connection.commit();

        // ✅ 3. Delete physical files
        // -- background_image --
        if (formRow && formRow.background_image) {
            const bgPath = path.join(__dirname, "..", formRow.background_image.replace(/\\/g, "/"));
            safeDelete(bgPath);
        }

        // -- file uploads --
        uploadsInFileUploads.forEach(upload => {
            if (upload.file_path) {
                const filePath = path.resolve(process.cwd(), upload.file_path.replace(/\\/g, "/"));
                safeDelete(filePath);
            }
        });

        // -- option images --
        uploadsInOptions.forEach(opt => {
            if (opt.image_path) {
                const optPath = path.join(__dirname, "..", opt.image_path.replace(/\\/g, "/"));
                safeDelete(optPath);
            }
        });

        // -- response uploads --
        uploadsInResponses.forEach(resp => {
            if (resp.answer) {
                let parsed;
                try {
                    parsed = JSON.parse(resp.answer);
                } catch {
                    parsed = resp.answer;
                }

                if (Array.isArray(parsed)) {
                    parsed.forEach(val => {
                        if (typeof val === "string" && val.startsWith("/uploads/")) {
                            const ansPath = path.join(__dirname, "..", val);
                            safeDelete(ansPath);
                        }
                    });
                } else if (typeof parsed === "string" && parsed.startsWith("/uploads/")) {
                    const ansPath = path.join(__dirname, "..", parsed);
                    safeDelete(ansPath);
                }
            }
        });

        res.json({ message: "Form and files deleted successfully!" });

    } catch (err) {
        console.error("❌ Error deleting form:", err);
        if (connection) await connection.rollback();
        res.status(500).json({ error: "Internal server error" });
    } finally {
        if (connection) connection.release();
    }
});

router.delete("/delete-page/:pageId", verifyJWT, async (req, res) => {
    const { pageId } = req.params;
    const { page_number } = req.body;
    const userId = req.user_id;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    let connection;
    try {
        connection = await new Promise((resolve, reject) => {
            db.getConnection((err, conn) => (err ? reject(err) : resolve(conn)));
        });

        await connection.beginTransaction();

        // ✅ Check if page belongs to the user's form
        const [pageRow] = await queryPromise(
            connection,
            `SELECT form_id FROM dform_pages WHERE id = ?`,
            [pageId]
        );

        if (!pageRow) {
            await connection.rollback();
            return res.status(404).json({ error: "Page not found" });
        }

        const [formRow] = await queryPromise(
            connection,
            `SELECT id FROM dforms WHERE id = ? AND user_id = ?`,
            [pageRow.form_id, userId]
        );

        if (!formRow) {
            await connection.rollback();
            return res.status(403).json({ error: "Not authorized to delete this page" });
        }

        const formId = pageRow.form_id;

        // ✅ Gather file paths linked to fields on this page
        const fields = await queryPromise(
            connection,
            `SELECT id FROM dform_fields WHERE page_id = ? AND form_id = ?`,
            [page_number, formId]
        );
        const fieldIds = fields.map(f => f.id);

        let uploadsInFileUploads = [];
        let uploadsInOptions = [];

        if (fieldIds.length) {
            uploadsInFileUploads = await queryPromise(
                connection,
                `SELECT file_path FROM dfield_file_uploads WHERE field_id IN (?)`,
                [fieldIds]
            );

            uploadsInOptions = await queryPromise(
                connection,
                `SELECT image_path FROM dfield_options WHERE field_id IN (?)`,
                [fieldIds]
            );
        }

        // ✅ Delete related rows
        if (fieldIds.length) {
            await queryPromise(connection, `DELETE FROM dfield_default_values WHERE field_id IN (?)`, [fieldIds]);
            await queryPromise(connection, `DELETE FROM dfield_matrix WHERE field_id IN (?)`, [fieldIds]);
            await queryPromise(connection, `DELETE FROM dfield_options WHERE field_id IN (?)`, [fieldIds]);
            await queryPromise(connection, `DELETE FROM dfield_file_uploads WHERE field_id IN (?)`, [fieldIds]);
        }

        await queryPromise(connection, `DELETE FROM dform_fields WHERE page_id = ? AND form_id = ?`, [String(page_number), formId]);
        await queryPromise(connection, `DELETE FROM dform_pages WHERE id = ?`, [pageId]);

        await connection.commit();

        // ✅ Delete physical files
        uploadsInFileUploads.forEach(upload => {
            if (upload.file_path) {
                const filePath = path.resolve(process.cwd(), upload.file_path.replace(/\\/g, "/"));
                safeDelete(filePath);
            }
        });

        uploadsInOptions.forEach(opt => {
            if (opt.image_path) {
                const optPath = path.join(__dirname, "..", opt.image_path.replace(/\\/g, "/"));
                safeDelete(optPath);
            }
        });

        res.json({ message: "Page and files deleted successfully!" });

    } catch (err) {
        console.error("❌ Error deleting page:", err);
        if (connection) await connection.rollback();
        res.status(500).json({ error: "Internal server error" });
    } finally {
        if (connection) connection.release();
    }
});

// ✅ Publish or Unpublish a Form (Protected Route)
router.put("/publish-form/:formId", verifyJWT, async (req, res) => {
    const { formId } = req.params;
    const { published } = req.body;
    const userId = req.user_id;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
        const updateQuery = "UPDATE dforms SET published = ? WHERE id = ? AND user_id = ?";
        await queryPromise(db, updateQuery, [published, formId, userId]);

        res.json({ message: published ? "Form published successfully!" : "Form unpublished.", formId });
    } catch (error) {
        console.error("❌ Error publishing form:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

async function copyFileWithNewName(originalPath, destFolder) {
    return new Promise((resolve, reject) => {
        if (!originalPath) return resolve(null);

        const fileName = path.basename(originalPath);
        const newFileName = `${Date.now()}-${fileName}`;
        const destPath = path.join(destFolder, newFileName);

        fs.copyFile(originalPath, destPath, (err) => {
            if (err) {
                console.error("File copy error:", err);
                return reject(err);
            }
            resolve(destPath); // this is your new DB path
        });
    });
}

router.post("/duplicate-template/:formId", verifyJWT, async (req, res) => {
    const userId = req.user_id;
    const { formId } = req.params;
    const { title: newTitle } = req.body;

    let connection;

    try {
        connection = await new Promise((resolve, reject) => {
            db.getConnection((err, conn) => (err ? reject(err) : resolve(conn)));
        });

        await connection.beginTransaction();

        // 1️⃣ Get original form
        const [originalForm] = await queryPromise(connection, `SELECT * FROM temlpates_dforms WHERE id = ?`, [formId]);
        if (!originalForm) return res.status(404).json({ error: "Original form not found." });

        const newBgImagePath = await copyFileWithNewName(
            originalForm.background_image,
            "form_bg_img_uploads"
        );

        // 2️⃣ Insert new form
        const titleToUse = newTitle || (originalForm.form_title + " (Copy)");

        // ❗ Check for duplicate title
        const isDuplicate = await checkDuplicateFormTitle(userId, titleToUse);
        if (isDuplicate) {
            return res.status(400).json({ error: "A form with this title already exists." });
        }

        const formInsertQuery = `
      INSERT INTO dforms 
      (user_id, title, internal_note, starred, is_closed, published, background_color, background_image,
       questions_background_color, primary_color, questions_color, answers_color, font)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
        const { insertId: newFormId } = await queryPromise(connection, formInsertQuery, [
            userId,
            titleToUse,
            originalForm.internal_note,
            originalForm.starred,
            false,  // Not closed
            false,  // Not published
            originalForm.background_color,
            newBgImagePath,
            originalForm.questions_background_color,
            originalForm.primary_color,
            originalForm.questions_color,
            originalForm.answers_color,
            originalForm.font
        ]);

        // 3️⃣ Copy pages
        const pages = await queryPromise(connection, `SELECT * FROM temlpates_dform_pages WHERE form_id = ?`, [formId]);

        let versionCounter = 2;

        // 👇 Hardcode ThankYou field before the loop
        const thankYouFieldResult = await queryPromise(connection, `
        INSERT INTO dform_fields 
            (form_id, page_id, type, label, placeholder, caption, default_value, description, alert_type,
            font_size, required, sort_order, min_value, max_value, heading_alignment,
            btnalignment, btnbgColor, btnlabelColor, fields_version, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
            newFormId,
            "end",      // ✅ Hardcoded page_id for ThankYou
            "ThankYou",// ✅ type
            "ThankYou",// ✅ label
            "", "", "", "", "info",
            16,        // ✅ font_size
            "No",      // ✅ required
            0,         // ✅ sort_order
            null, null, null, null, null, null,
            1          // ✅ version for ThankYou field
        ]);

        // Extract the new ThankYou field ID
        const thankYouFieldId = thankYouFieldResult.insertId;

        for (const page of pages) {
            await queryPromise(connection, `
        INSERT INTO dform_pages (page_number, form_id, page_title, sort_order)
        VALUES (?, ?, ?, ?)
      `, [page.page_number, newFormId, page.page_title, page.sort_order]);

            // 4️⃣ Copy fields for each page
            // ✅ Correct query string
            const fieldsQuery = `
            SELECT * FROM temlpates_dform_fields 
            WHERE form_id = ? AND page_id = ? AND fields_version = (
                SELECT MAX(fields_version) 
                FROM temlpates_dform_fields 
                WHERE form_id = ? AND page_id = ?
            )`;

            const fieldsParams = [formId, page.page_number, formId, page.page_number];
            const fields = await queryPromise(connection, fieldsQuery, fieldsParams);

            const currentVersion = versionCounter++;

            for (const field of fields) {

                const { insertId: newFieldId } = await queryPromise(connection, `
          INSERT INTO dform_fields 
          (form_id, page_id, type, label, placeholder, caption, default_value, description, alert_type,
           font_size, required, sort_order, min_value, max_value, heading_alignment,
           btnalignment, btnbgColor, btnlabelColor, fields_version)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
                    newFormId,
                    page.page_number.toString(),
                    field.type,
                    field.label,
                    field.placeholder,
                    field.caption,
                    field.default_value,
                    field.description,
                    field.alert_type,
                    field.font_size,
                    field.required,
                    field.sort_order,
                    field.min_value,
                    field.max_value,
                    field.heading_alignment,
                    field.btnalignment,
                    field.btnbgColor,
                    field.btnlabelColor,
                    currentVersion
                ]);

                // 5️⃣ Copy options
                const options = await queryPromise(connection, `SELECT * FROM temlpates_dfield_options WHERE field_id = ?`, [field.id]);
                for (const opt of options) {
                    let newOptionImagePath = null;

                    if (opt.image_path) {
                        newOptionImagePath = await copyFileWithNewName(opt.image_path, "field_file_uploads");
                    }

                    await queryPromise(connection, `
            INSERT INTO dfield_options (field_id, option_text, options_style, sort_order, image_path)
            VALUES (?, ?, ?, ?, ?)
          `, [
                        newFieldId,
                        opt.option_text,
                        opt.options_style,
                        opt.sort_order,
                        newOptionImagePath
                    ]);
                }

                // 6️⃣ Copy matrix rows/columns
                const matrix = await queryPromise(connection, `SELECT * FROM temlpates_dfield_matrix WHERE field_id = ?`, [field.id]);
                for (const m of matrix) {
                    await queryPromise(connection, `
            INSERT INTO dfield_matrix (field_id, row_label, column_label)
            VALUES (?, ?, ?)
          `, [newFieldId, m.row_label, m.column_label]);
                }

                // 7️⃣ Copy file uploads if any
                const uploads = await queryPromise(connection, `SELECT * FROM temlpates_dfield_file_uploads WHERE field_id = ?`, [field.id]);
                for (const upload of uploads) {
                    let newUploadFilePath = null;

                    if (upload.file_path) {
                        newUploadFilePath = await copyFileWithNewName(upload.file_path, "field_file_uploads");
                    }

                    await queryPromise(connection, `
            INSERT INTO dfield_file_uploads
              (field_id, form_id, file_type, file_path, youtube_url, file_field_size, file_field_Alignment)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
                        newFieldId,
                        newFormId,
                        upload.file_type,
                        newUploadFilePath,
                        upload.youtube_url,
                        upload.file_field_size,
                        upload.file_field_Alignment
                    ]);
                }
            }
        }

        // 8️⃣ Duplicate thank you if exists
        const thankyou = await queryPromise(connection, `SELECT * FROM temlpates_dform_thankyou WHERE form_id = ?`, [formId]);
        if (thankyou.length) {
            const origTY = thankyou[0];
            await queryPromise(connection, `
        INSERT INTO dform_thankyou
          (form_id, field_id, show_tick_icon, thankyou_heading, thankyou_subtext)
        VALUES (?, ?, ?, ?, ?)
      `, [
                newFormId,
                thankYouFieldId,
                origTY.show_tick_icon,
                origTY.thankyou_heading,
                origTY.thankyou_subtext
            ]);
        }

        await connection.commit();
        res.json({ message: "Form created successfully!", newFormId });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error("❌ Error createding form:", err);
        res.status(500).json({ error: "Failed to created form" });
    } finally {
        if (connection) connection.release();
    }
});

router.post("/duplicate-form/:formId", verifyJWT, async (req, res) => {
    const userId = req.user_id;
    const { formId } = req.params;
    const { title: newTitle } = req.body;

    let connection;

    try {
        connection = await new Promise((resolve, reject) => {
            db.getConnection((err, conn) => (err ? reject(err) : resolve(conn)));
        });

        await connection.beginTransaction();

        // 1️⃣ Get original form
        const [originalForm] = await queryPromise(connection, `SELECT * FROM dforms WHERE id = ?`, [formId]);
        if (!originalForm) return res.status(404).json({ error: "Original form not found." });

        const newBgImagePath = await copyFileWithNewName(
            originalForm.background_image,
            "form_bg_img_uploads"
        );

        // 2️⃣ Insert new form
        const titleToUse = newTitle || (originalForm.form_title + " (Copy)");

        // ❗ Check for duplicate title
        const isDuplicate = await checkDuplicateFormTitle(userId, titleToUse);
        if (isDuplicate) {
            return res.status(400).json({ error: "A form with this title already exists." });
        }

        const formInsertQuery = `
      INSERT INTO dforms 
      (user_id, title, internal_note, starred, is_closed, published, background_color, background_image,
       questions_background_color, primary_color, questions_color, answers_color, font)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
        const { insertId: newFormId } = await queryPromise(connection, formInsertQuery, [
            userId,
            titleToUse,
            originalForm.internal_note,
            originalForm.starred,
            false,  // Not closed
            false,  // Not published
            originalForm.background_color,
            newBgImagePath,
            originalForm.questions_background_color,
            originalForm.primary_color,
            originalForm.questions_color,
            originalForm.answers_color,
            originalForm.font
        ]);

        // 3️⃣ Copy pages
        const pages = await queryPromise(connection, `SELECT * FROM dform_pages WHERE form_id = ?`, [formId]);

        let versionCounter = 2;

        // 👇 Hardcode ThankYou field before the loop
        const thankYouFieldResult = await queryPromise(connection, `
        INSERT INTO dform_fields 
            (form_id, page_id, type, label, placeholder, caption, default_value, description, alert_type,
            font_size, required, sort_order, min_value, max_value, heading_alignment,
            btnalignment, btnbgColor, btnlabelColor, fields_version, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
            newFormId,
            "end",      // ✅ Hardcoded page_id for ThankYou
            "ThankYou",// ✅ type
            "ThankYou",// ✅ label
            "", "", "", "", "info",
            16,        // ✅ font_size
            "No",      // ✅ required
            0,         // ✅ sort_order
            null, null, null, null, null, null,
            1          // ✅ version for ThankYou field
        ]);

        // Extract the new ThankYou field ID
        const thankYouFieldId = thankYouFieldResult.insertId;

        for (const page of pages) {
            await queryPromise(connection, `
        INSERT INTO dform_pages (page_number, form_id, page_title, sort_order)
        VALUES (?, ?, ?, ?)
      `, [page.page_number, newFormId, page.page_title, page.sort_order]);

            // 4️⃣ Copy fields for each page
            // ✅ Correct query string
            const fieldsQuery = `
            SELECT * FROM dform_fields 
            WHERE form_id = ? AND page_id = ? AND fields_version = (
                SELECT MAX(fields_version) 
                FROM dform_fields 
                WHERE form_id = ? AND page_id = ?
            )`;

            const fieldsParams = [formId, page.page_number, formId, page.page_number];
            const fields = await queryPromise(connection, fieldsQuery, fieldsParams);

            const currentVersion = versionCounter++;

            for (const field of fields) {

                const { insertId: newFieldId } = await queryPromise(connection, `
          INSERT INTO dform_fields 
          (form_id, page_id, type, label, placeholder, caption, default_value, description, alert_type,
           font_size, required, sort_order, min_value, max_value, heading_alignment,
           btnalignment, btnbgColor, btnlabelColor, fields_version)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
                    newFormId,
                    page.page_number.toString(),
                    field.type,
                    field.label,
                    field.placeholder,
                    field.caption,
                    field.default_value,
                    field.description,
                    field.alert_type,
                    field.font_size,
                    field.required,
                    field.sort_order,
                    field.min_value,
                    field.max_value,
                    field.heading_alignment,
                    field.btnalignment,
                    field.btnbgColor,
                    field.btnlabelColor,
                    currentVersion
                ]);

                // 5️⃣ Copy options
                const options = await queryPromise(connection, `SELECT * FROM dfield_options WHERE field_id = ?`, [field.id]);
                for (const opt of options) {
                    let newOptionImagePath = null;

                    if (opt.image_path) {
                        newOptionImagePath = await copyFileWithNewName(opt.image_path, "field_file_uploads");
                    }

                    await queryPromise(connection, `
            INSERT INTO dfield_options (field_id, option_text, options_style, sort_order, image_path)
            VALUES (?, ?, ?, ?, ?)
          `, [
                        newFieldId,
                        opt.option_text,
                        opt.options_style,
                        opt.sort_order,
                        newOptionImagePath
                    ]);
                }

                // 6️⃣ Copy matrix rows/columns
                const matrix = await queryPromise(connection, `SELECT * FROM dfield_matrix WHERE field_id = ?`, [field.id]);
                for (const m of matrix) {
                    await queryPromise(connection, `
            INSERT INTO dfield_matrix (field_id, row_label, column_label)
            VALUES (?, ?, ?)
          `, [newFieldId, m.row_label, m.column_label]);
                }

                // 7️⃣ Copy file uploads if any
                const uploads = await queryPromise(connection, `SELECT * FROM dfield_file_uploads WHERE field_id = ?`, [field.id]);
                for (const upload of uploads) {
                    let newUploadFilePath = null;

                    if (upload.file_path) {
                        newUploadFilePath = await copyFileWithNewName(upload.file_path, "field_file_uploads");
                    }

                    await queryPromise(connection, `
            INSERT INTO dfield_file_uploads
              (field_id, form_id, file_type, file_path, youtube_url, file_field_size, file_field_Alignment)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
                        newFieldId,
                        newFormId,
                        upload.file_type,
                        newUploadFilePath,
                        upload.youtube_url,
                        upload.file_field_size,
                        upload.file_field_Alignment
                    ]);
                }
            }
        }

        // 8️⃣ Duplicate thank you if exists
        const thankyou = await queryPromise(connection, `SELECT * FROM dform_thankyou WHERE form_id = ?`, [formId]);
        if (thankyou.length) {
            const origTY = thankyou[0];
            await queryPromise(connection, `
        INSERT INTO dform_thankyou
          (form_id, field_id, show_tick_icon, thankyou_heading, thankyou_subtext)
        VALUES (?, ?, ?, ?, ?)
      `, [
                newFormId,
                thankYouFieldId,
                origTY.show_tick_icon,
                origTY.thankyou_heading,
                origTY.thankyou_subtext
            ]);
        }

        await connection.commit();
        res.json({ message: "Form duplicated successfully!", newFormId });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error("❌ Error duplicating form:", err);
        res.status(500).json({ error: "Failed to duplicate form" });
    } finally {
        if (connection) connection.release();
    }
});

router.post("/duplicate-page", verifyJWT, async (req, res) => {
    const { pageId, formId, newPageTitle } = req.body;
    const pageTitle = newPageTitle || originalPage.page_title + " (Copy)";
    const userId = req.user_id;

    if (!userId || !pageId || !formId) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    try {
        // 🚨 Before inserting the new page
        const existingPageWithTitle = await queryPromise(
            db,
            `SELECT 1 FROM dform_pages WHERE form_id = ? AND page_title = ? LIMIT 1`,
            [formId, pageTitle]
        );

        if (existingPageWithTitle.length > 0) {
            return res.status(400).json({ error: "A page with this title already exists. Please choose a different title." });
        }

        const [[{ max_order }], [{ max_page_number }]] = await Promise.all([
            queryPromise(db, `SELECT MAX(sort_order) AS max_order FROM dform_pages WHERE form_id = ?`, [formId]),
            queryPromise(db, `SELECT MAX(page_number) AS max_page_number FROM dform_pages WHERE form_id = ?`, [formId])
        ]);

        const nextSortOrder = (max_order || 0) + 1;
        const nextPageNumber = (max_page_number || 0) + 1;

        const [originalPage] = await queryPromise(db, `SELECT * FROM dform_pages WHERE id = ?`, [pageId]);
        if (!originalPage) return res.status(404).json({ error: "Original page not found" });

        const insertPageResult = await queryPromise(db, `
      INSERT INTO dform_pages (page_number, form_id, page_title, sort_order)
      VALUES (?, ?, ?, ?)`,
            [nextPageNumber, formId, pageTitle, nextSortOrder]
        );

        const newPageId = insertPageResult.insertId;

        // Duplicate fields (latest version only)
        const fields = await queryPromise(db, `
      SELECT * FROM dform_fields 
      WHERE form_id = ? AND page_id = ? AND fields_version = (
        SELECT MAX(fields_version) 
        FROM dform_fields 
        WHERE form_id = ? AND page_id = ?
      )`,
            [formId, originalPage.page_number, formId, originalPage.page_number]
        );

        let newVersion = 1;

        for (const field of fields) {
            const { insertId: newFieldId } = await queryPromise(db, `
        INSERT INTO dform_fields
        (form_id, page_id, type, label, placeholder, caption, default_value, description, alert_type,
         font_size, required, sort_order, min_value, max_value, heading_alignment,
         btnalignment, btnbgColor, btnlabelColor, fields_version)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    formId, nextPageNumber.toString(), field.type, field.label, field.placeholder,
                    field.caption, field.default_value, field.description, field.alert_type,
                    field.font_size, field.required, field.sort_order, field.min_value,
                    field.max_value, field.heading_alignment, field.btnalignment,
                    field.btnbgColor, field.btnlabelColor, newVersion
                ]
            );

            // Options
            const options = await queryPromise(db, `SELECT * FROM dfield_options WHERE field_id = ?`, [field.id]);
            for (const opt of options) {
                let newOptionImagePath = null;
                if (opt.image_path) {
                    newOptionImagePath = await copyFileWithNewName(opt.image_path, "field_file_uploads");
                }

                await queryPromise(db, `
  INSERT INTO dfield_options (field_id, option_text, options_style, sort_order, image_path)
  VALUES (?, ?, ?, ?, ?)`,
                    [newFieldId, opt.option_text, opt.options_style, opt.sort_order, newOptionImagePath]
                );
            }

            // Matrix
            const matrix = await queryPromise(db, `SELECT * FROM dfield_matrix WHERE field_id = ?`, [field.id]);
            for (const m of matrix) {
                await queryPromise(db, `
          INSERT INTO dfield_matrix (field_id, row_label, column_label)
          VALUES (?, ?, ?)`,
                    [newFieldId, m.row_label, m.column_label]
                );
            }

            // File uploads
            const uploads = await queryPromise(db, `SELECT * FROM dfield_file_uploads WHERE field_id = ?`, [field.id]);
            for (const upload of uploads) {
                let newUploadFilePath = null;
                if (upload.file_path) {
                    newUploadFilePath = await copyFileWithNewName(upload.file_path, "field_file_uploads");
                }

                await queryPromise(db, `
  INSERT INTO dfield_file_uploads
  (field_id, form_id, file_type, file_path, youtube_url, file_field_size, file_field_Alignment)
  VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        newFieldId,
                        formId,
                        upload.file_type,
                        newUploadFilePath,
                        upload.youtube_url,
                        upload.file_field_size,
                        upload.file_field_Alignment
                    ]
                );
            }
        }

        res.json({
            message: "Page duplicated successfully!",
            newPageId,
            newPageNumber: nextPageNumber
        });

    } catch (err) {
        console.error("❌ Duplicate page error:", err);
        res.status(500).json({ error: "Internal server error" });
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
            "UPDATE dforms SET internal_note = ? WHERE id = ? AND user_id = ?",
            [note, formId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Form not found or unauthorized" });
        }

        // Return the updated form (optional)
        const [updatedForm] = await queryPromise(
            db,
            "SELECT * FROM dforms WHERE id = ?",
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
            "UPDATE dforms SET is_closed = ? WHERE id = ? AND user_id = ?",
            [is_closed, formId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Form not found or unauthorized" });
        }

        const [updatedForm] = await queryPromise(
            db,
            "SELECT * FROM dforms WHERE id = ?",
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
            "UPDATE dforms SET starred = ? WHERE id = ? AND user_id = ?",
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

// GET /api/form/:formId/version-history
router.get('/:formId/version-history', async (req, res) => {
    let { formId } = req.params;

    // ✅ Strip "form-" prefix if present
    if (formId.startsWith("form-")) {
        formId = formId.replace("form-", "");
    }

    try {
        const query = `
            SELECT fields_version, MIN(created_at) as created_at
            FROM dform_fields
            WHERE form_id = ?
            GROUP BY fields_version
            ORDER BY fields_version DESC
        `;
        const rows = await queryPromise(db, query, [formId]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching version history");
    }
});

router.get("/get-templates-form/:formId/:pageId", async (req, res) => {
    const { formId, pageId } = req.params;

    try {
        // ✅ 1. Fetch form
        let formQuery = "SELECT * FROM temlpates_dforms WHERE id = ?";
        const queryParams = [formId];


        const [form] = await queryPromise(db, formQuery, queryParams);

        if (!form) {
            return res.status(404).json({ error: "Form not found or not published" });
        }

        // ✅ 2. Fetch page data
        const pageQuery = "SELECT * FROM temlpates_dform_pages WHERE form_id = ? AND page_number = ?";
        const [page] = await queryPromise(db, pageQuery, [formId, pageId]);

        if (!page && pageId !== "end") {
            return res.status(404).json({ error: "Page not found" });
        }

        // ✅ 3. Fetch latest-version fields for this page
        const fieldsQuery = `
            SELECT * FROM temlpates_dform_fields f
            WHERE f.form_id = ? AND f.page_id = ?
            AND f.fields_version = (
                SELECT MAX(f2.fields_version)
                FROM temlpates_dform_fields f2
                WHERE f2.form_id = f.form_id AND f2.page_id = f.page_id 
            )
        `;
        const fields = await queryPromise(db, fieldsQuery, [formId, pageId]);

        const fieldIds = fields.map(f => f.id);
        let options = [], matrix = [], defaults = [], uploads = [];

        if (fieldIds.length > 0) {
            options = await queryPromise(db, `SELECT * FROM temlpates_dfield_options WHERE field_id IN (${fieldIds.join(",")})`);
            matrix = await queryPromise(db, `SELECT * FROM temlpates_dfield_matrix WHERE field_id IN (${fieldIds.join(",")})`);
            defaults = await queryPromise(db, `SELECT * FROM temlpates_dfield_default_values WHERE form_id = ?`, [formId]);
            uploads = await queryPromise(db, `SELECT * FROM temlpates_dfield_file_uploads WHERE form_id = ?`, [formId]);
            thankyou = await queryPromise(db, `SELECT * FROM temlpates_dform_thankyou WHERE field_id IN (${fieldIds.join(",")}) AND form_id = ? LIMIT 1`, [formId]);
        }

        const fieldsWithDetails = fields.map(field => ({
            ...field,
            options: options.filter(opt => opt.field_id === field.id),
            matrix: matrix.filter(m => m.field_id === field.id),
            default_value: defaults.find(def => def.field_id === field.id)?.field_value || null,
            uploads: uploads.filter(u => u.field_id === field.id),
            thankyou: thankyou.find(t => t.field_id === field.id) || null
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
