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
            5
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
    } catch (err) {
        return res.status(400).json({ error: "Invalid fields format" });
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
                        min_value, max_value, btnalignment, btnbgColor, btnlabelColor, fields_version
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
                        field.fontSize || 14,
                        field.required ? "Yes" : "No",
                        field.sortOrder || 0,
                        field.min_value || null,
                        field.max_value || null,
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

                if (field.file instanceof File) {
                    const key = `field_file_${fieldIndex}`;
                    formData.append(key, field.file);
                    field.file = key;
                } else if (field.uploads?.length > 0) {
                    const upload = field.uploads[0];

                    // Retain existing upload metadata for old fields
                    field.file_path = upload.file_path;
                    field.file_type = upload.file_type;
                    field.previewSize = upload.file_field_size;
                    field.alignment = upload.file_field_Alignment;
                }

                const fileKey = field.file; // This would be like field_file_0_0
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
                    `, [fieldId, opt.option_text || '', opt.options_style || '', opt.sortOrder || 0, savedFilePath]);
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
                f.created_at
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
            WHERE f.user_id = ? 
        `;

        const params = [userId];

        if (formId) {
            query += ` AND f.id = ?`;
            params.push(formId);
        }

        if (!formId) {
            query += ` ${orderClause}`;
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

// ✅ Fetch all page names
router.get("/get-form-pages/:formId", verifyJWT, async (req, res) => {
    const { formId } = req.params;
    const userId = req.user_id;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

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
        const fieldsQuery = `
            SELECT * FROM dform_fields 
            WHERE form_id = ? AND page_id = ? AND fields_version = (
                SELECT MAX(fields_version) FROM dform_fields WHERE form_id = ? AND page_id = ?
            )
            ORDER BY sort_order ASC
        `;
        const fields = await queryPromise(db, fieldsQuery, [formId, pageId, formId, pageId]);

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
        const updateQuery = "UPDATE dforms SET published = ? WHERE id = ? AND user_id = ?";
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

module.exports = router;
