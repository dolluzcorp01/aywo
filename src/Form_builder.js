import React, { useState, useEffect } from "react";
import { Rnd } from "react-rnd";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { useNotification } from "./NotificationContext";
import { FaFont, FaEnvelope, FaHashtag, FaList, FaCheckSquare, FaCaretDown, FaCalendarAlt, FaAlignLeft, FaFileAlt, FaTrash, FaRuler, FaTable } from "react-icons/fa";
import "./Form_builder.css";
import { useLocation } from "react-router-dom";

const fieldIcons = {
    "Text Only": <FaFont color="#6c757d" />,
    "Short Answer": <FaFont color="#007bff" />,
    "Email": <FaEnvelope color="#28a745" />,
    "Number": <FaHashtag color="#17a2b8" />,
    "Multiple Choice": <FaList color="#ffc107" />,
    "Checkbox": <FaCheckSquare color="#dc3545" />,
    "Dropdown": <FaCaretDown color="#6610f2" />,
    "Date": <FaCalendarAlt color="#e83e8c" />,
    "Paragraph": <FaAlignLeft color="#fd7e14" />,
    "Document Type": <FaFileAlt color="#6f42c1" />,
    "Linear Scale": <FaRuler color="#ff5733" />,
    "Multiple Choice Grid": <FaTable color="#17a2b8" />
};

const FormBuilder = () => {
    const [formBgColor, setFormBgColor] = useState("gray");

    const [fields, setFields] = useState([]);
    const [selectedField, setSelectedField] = useState(null);
    const [lastPosition, setLastPosition] = useState({ x: 50, y: 80 });

    const [formTitle, setFormTitle] = useState("Untitled Form");
    const [formTitleX, setFormTitleX] = useState(50);
    const [formTitleY, setFormTitleY] = useState(20);
    const [formTitleWidth, setFormTitleWidth] = useState(300);
    const [formTitleHeight, setFormTitleHeight] = useState(50);
    const [formTitleColor, setFormTitleColor] = useState("#000000");
    const [formTitleBgColor, setFormTitleBgColor] = useState("#ffffff");
    const [formTitleFontSize, setFormTitleFontSize] = useState(24);

    const [submitBtnX, setSubmitBtnX] = useState(260);
    const [submitBtnY, setSubmitBtnY] = useState(500);
    const [submitBtnWidth, setSubmitBtnWidth] = useState(150);
    const [submitBtnHeight, setSubmitBtnHeight] = useState(50);
    const [submitBtnBgColor, setSubmitBtnBgColor] = useState("#28a745");
    const [submitBtnTextColor, setSubmitBtnTextColor] = useState("#ffffff");
    const [submitBtnFontSize, setSubmitBtnFontSize] = useState(16);

    const location = useLocation();
    const isEditableForm = /^\/form-builder\/form-\d+$/.test(location.pathname); // Checks if URL matches /form-builder/form-{number}

    // State for Global Customization
    const [globalSettings, setGlobalSettings] = useState({
        bgColor: "#ffffff",
        labelColor: "#000000",
        fontSize: 16,
        width: 200,
        height: 50,
    });
    const [lastFieldSize, setLastFieldSize] = useState({ width: 200, height: 50 });

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { formId } = useParams();
    const { setShowNotification } = useNotification();

    useEffect(() => {
        axios.get("http://localhost:5000/api/leftnavbar/get-user-profile", { withCredentials: true })
            .then((res) => {
                if (!res.data?.user_id) throw new Error("Unauthorized");
                setProfile(res.data);
            })
            .catch(() => navigate("/login"))
            .finally(() => setLoading(false));
    }, [navigate]);

    useEffect(() => {
        let isMounted = true; // Track if component is mounted

        if (formId) {
            axios.get(`http://localhost:5000/api/form_builder/get-specific-form/${formId}`, { withCredentials: true })
                .then((res) => {
                    if (isMounted) {
                        console.log(`Fetched form data:`, res.data);

                        setFormBgColor(res.data.form_background || "#ffffff");
                        setFormTitleColor(res.data.title_color || "#000000");
                        setFormTitleBgColor(res.data.title_background || "#ffffff");
                        setFormTitle(res.data.title || "Untitled Form");
                        setFormTitleFontSize(res.data.title_font_size ?? 24);
                        setFormTitleX(res.data.title_x ?? 50);
                        setFormTitleY(res.data.title_y ?? 20);
                        setFormTitleWidth(res.data.title_width ?? 300);
                        setFormTitleHeight(res.data.title_height ?? 50);

                        // ✅ Ensure that field types & options are properly set
                        setFields(res.data.fields ? res.data.fields.map(field => {
                            if (field.field_type === "Linear Scale") {
                                return {
                                    ...field,
                                    type: "Linear Scale",
                                    min: field.min_value,
                                    max: field.max_value
                                };
                            }

                            if (field.field_type === "Multiple Choice Grid") {
                                return {
                                    ...field,
                                    type: "Multiple Choice Grid",
                                    rows: field.grid_options ? field.grid_options.map(option => option.row_label) : [],
                                    columns: field.grid_options ? field.grid_options.map(option => option.column_label) : []
                                };
                            }

                            return field;
                        }) : []);

                        setSubmitBtnX(res.data.submit_button_x ?? 50);
                        setSubmitBtnY(res.data.submit_button_y ?? 400);
                        setSubmitBtnWidth(res.data.submit_button_width ?? 150);
                        setSubmitBtnHeight(res.data.submit_button_height ?? 50);
                        setSubmitBtnTextColor(res.data.submit_button_color || "#ffffff");
                        setSubmitBtnBgColor(res.data.submit_button_background || "#007bff");
                    }
                })
                .catch((err) => {
                    console.error("Error fetching form:", err);
                    Swal.fire("Error", "Failed to load form.", "error");
                });
        }

        return () => { isMounted = false; }; // Cleanup function
    }, [formId]);

    useEffect(() => {
        const updateFormHeight = () => {
            const formContainer = document.querySelector('.form-container');
            if (formContainer) {
                let maxBottom = 0;
                fields.forEach(field => {
                    let bottom = field.y + field.height;
                    if (bottom > maxBottom) {
                        maxBottom = bottom;
                    }
                });

                let submitButtonBottom = submitBtnY + submitBtnHeight;
                let newHeight = Math.max(maxBottom, submitButtonBottom) + 150; // Add extra padding

                formContainer.style.height = `${newHeight}px`; // Dynamically adjust height

                // Ensure scrolling
                if (newHeight > window.innerHeight) {
                    formContainer.style.overflowY = "auto";
                } else {
                    formContainer.style.overflowY = "hidden";
                }
            }
        };

        updateFormHeight();
    }, [fields, submitBtnY, submitBtnHeight]);

    // Function to check if a new field overlaps with existing fields
    const isOverlapping = (x, y, width, height, excludeId = null, isTitle = false) => {
        if (!isTitle) {
            return fields.some(field => (
                field.id !== excludeId &&
                !(x + width < field.x || x > field.x + field.width ||
                    y + height < field.y || y > field.y + field.height)
            ));
        }
        return false; // Don't check overlap when dragging the title
    };

    // Adjust position to avoid overlap
    const getValidPosition = (x, y, width, height, excludeId = null) => {
        let newX = x, newY = y;
        let attempts = 0;
        const maxAttempts = 50; // Prevent infinite loops

        while (isOverlapping(newX, newY, width, height, excludeId) && attempts < maxAttempts) {
            // Try shifting right first
            if (newX + width + 20 < 600) {
                newX += 20;
            }
            // If no space, move down
            else {
                newX = 50;
                newY += 60;
            }
            attempts++;
        }

        return { x: newX, y: newY };
    };

    // Add new field with no overlap
    const addField = (type) => {
        let newX = 50;
        let newY = lastPosition.y + lastFieldSize.height + 30; // Maintain spacing

        if (fields.length > 0) {
            const lastField = fields[fields.length - 1];
            newX = lastField.x;
            newY = lastField.y + lastFieldSize.height + 30;
        }

        const { x: validX, y: validY } = getValidPosition(newX, newY, lastFieldSize.width, lastFieldSize.height);

        const newField = {
            id: Date.now(),
            type,
            field_type: type,
            label: type,
            bgColor: "#FFFFFF",
            labelColor: "#000000",
            fontSize: 16,
            width: lastFieldSize.width,
            height: lastFieldSize.height,
            x: validX,
            y: validY,
            options: type === "Dropdown" || type === "Multiple Choice" ? ["Option 1", "Option 2"] : [],
            customized: {}
        };

        if (type === "Linear Scale") {
            newField.min = 1;
            newField.max = 5;
        } else if (type === "Multiple Choice Grid") {
            newField.rows = ["Row 1", "Row 2"];
            newField.columns = ["Column 1", "Column 2"];
            newField.options = {
                "Row 1": { "Column 1": "", "Column 2": "" },
                "Row 2": { "Column 1": "", "Column 2": "" }
            };
        }

        setFields([...fields, newField]);
        setLastPosition({ x: validX, y: validY });
    };

    const getInputType = (type, id) => {
        if (!fields || !Array.isArray(fields)) return null;

        const field = fields.find(f => f.id === id);
        if (!field) return null;

        const options = Array.isArray(field.options) ? field.options : [];

        const inputStyle = {
            width: "100%",
            height: "100%",
            fontSize: `${field.fontSize}px`,
            padding: "5px",
            boxSizing: "border-box",
        };

        switch (type) {
            case "Number":
                return <input type="number" style={inputStyle} inputMode="numeric" onKeyDown={(e) => e.key === 'e' && e.preventDefault()} />;
            case "Date":
                return <input type="date" style={inputStyle} />;
            case "Checkbox":
                return <input type="checkbox" style={{ width: "20px", height: "20px" }} />;
            case "Multiple Choice":
                return (
                    <div className="multiple-choice-container" style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        {options.map((opt, index) => (
                            <div key={index} className="multiple-choice-option">
                                <input type="radio" name={`multiple_choice_${id}`} value={opt} />
                                <span>{opt}</span>
                            </div>
                        ))}
                    </div>
                );
            case "Dropdown":
                return (
                    <select style={inputStyle}>
                        <option value="">Select an option</option>
                        {options.map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                        ))}
                    </select>
                );
            case "Document Type":
                return (
                    <input type="file" style={inputStyle} accept=".pdf,.doc,.docx" />
                );
            case "Text Only":
                return null;
            case "Linear Scale":
                return (
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        {Array.from({ length: field.max - field.min + 1 }, (_, i) => i + field.min).map((val) => (
                            <label key={val} style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                                <input type="radio" name={`linear_${id}`} value={val} style={{ appearance: "none", width: "20px", height: "20px", borderRadius: "50%", border: "1px solid #000", display: "inline-block", cursor: "pointer" }} />
                                <span>{val}</span>
                            </label>
                        ))}
                    </div>
                );
            case "Multiple Choice Grid":
                return (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr>
                                <th></th>
                                {field.columns.map((col, i) => (
                                    <th key={i} style={{ border: "1px solid #ddd", padding: "5px" }}>{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {field.rows.map((row, i) => (
                                <tr key={i}>
                                    <td style={{ border: "1px solid #ddd", padding: "5px" }}>{row}</td>
                                    {field.columns.map((col, j) => (
                                        <td key={j} style={{ border: "1px solid #ddd", padding: "5px", textAlign: "center" }}>
                                            <input type="radio" name={`grid_${id}_row${i}`} value={col} />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );
            default:
                return <input type="text" style={inputStyle} />;
        }
    };

    const updateGlobalSettings = (key, value) => {
        setGlobalSettings(prev => ({ ...prev, [key]: value }));
        setFields(prevFields =>
            prevFields.map(field =>
                !field.customized?.[key] ? { ...field, [key]: value } : field
            )
        );
    };

    const updateField = (id, key, value) => {
        if (key === "label" && !value.trim()) return;

        setFields(prevFields =>
            prevFields.map(field =>
                field.id === id ? { ...field, [key]: value, customized: { ...field.customized, [key]: true } } : field
            )
        );

        setSelectedField(prev => (prev?.id === id ? { ...prev, [key]: value } : prev));
    };

    const deleteField = (id) => {
        console.log("Deleting field with ID:", id);
        console.log("Before deletion:", fields);
        setFields(prevFields => prevFields.filter(field => field.id !== id));
        console.log("After deletion:", fields);
        if (selectedField && selectedField.id === id) {
            setSelectedField(null);
        }
    };

    const saveOrUpdateForm = async (isNew = false) => {
        if (!formTitle.trim()) {
            Swal.fire("Error", "Form title cannot be empty.", "error");
            return;
        }

        if (fields.length === 0) {
            Swal.fire("Error", "At least one field is required.", "error");
            return;
        }

        if (fields.some(field => !field.label.trim())) {
            Swal.fire("Error", "Field labels cannot be empty.", "error");
            return;
        }

        // Prepare fields with linear scale values and grid options
        const updatedFields = fields.map(field => {
            if (field.type === "Linear Scale") {
                return {
                    ...field,
                    min_value: field.min || 1, // Ensure min_value is set
                    max_value: field.max || 5  // Ensure max_value is set
                };
            }

            if (field.type === "Multiple Choice Grid") {
                return {
                    ...field,
                    grid_options: field.rows.map((row, rowIndex) => ({
                        row_label: row,
                        column_label: field.columns[rowIndex] || field.columns[0]  // Match row with correct column
                    }))
                };
            }

            return field;
        });
        
        const formData = {
            form_background: formBgColor,
            title_color: formTitleColor,
            title_background: formTitleBgColor,
            title: formTitle,
            title_font_size: formTitleFontSize,
            title_x: formTitleX,
            title_y: formTitleY,
            title_width: formTitleWidth,
            title_height: formTitleHeight,
            fields: updatedFields,
            submit_button_x: submitBtnX,
            submit_button_y: submitBtnY,
            submit_button_width: submitBtnWidth,
            submit_button_height: submitBtnHeight,
            submit_button_color: submitBtnTextColor,
            submit_button_background: submitBtnBgColor
        };
        
        try {
            if (!isNew && formId) {
                console.log("Updating form with fields:", fields);
                const cleanFormId = formId.replace("form-", "");
                const response = await axios.put(
                    `http://localhost:5000/api/form_builder/update-form/${cleanFormId}`,
                    formData,
                    { withCredentials: true }
                );
                Swal.fire("Success!", response.data.message, "success");
            } else {
                console.log("Saving form with fields:", fields);
                const response = await axios.post(
                    "http://localhost:5000/api/form_builder/save-form",
                    formData,
                    { withCredentials: true }
                );
                Swal.fire("Success!", response.data.message, "success");

                // ✅ Navigate to the newly created form page using the returned formId
                if (response.data.formId) {
                    navigate(`/form-builder/form-${response.data.formId}`);
                }
            }

            setShowNotification(true);
        } catch (error) {
            console.error("Error saving/updating form:", error);
            const errorMessage = error.response?.data?.error || "An error occurred";
            Swal.fire("Error", errorMessage, "error");
        }
    };

    const publishForm = async () => {
        if (!formId) {
            Swal.fire("Error", "Please save the form before publishing.", "error");
            return;
        }

        try {
            const cleanFormId = formId.replace("form-", "");
            const response = await axios.put(
                `http://localhost:5000/api/form_builder/publish-form/${cleanFormId}`,
                { published: true },
                { withCredentials: true }
            );

            const publicUrl = `${window.location.origin}/forms/${cleanFormId}`;

            // Copy link to clipboard
            await navigator.clipboard.writeText(publicUrl);

            // Show success alert
            Swal.fire({
                title: "Success!",
                html: `Form published successfully! <br> The link has been copied to clipboard: <br> <b>${publicUrl}</b>`,
                icon: "success"
            });

        } catch (error) {
            console.error("Error publishing form:", error);
            Swal.fire("Error", "Failed to publish the form.", "error");
        }
    };

    if (loading) return <p>Loading...</p>;

    return (
        <div className="form-builder">
            <div className="container">
                <div className="sidebar">
                    <h2>Field Types</h2>
                    {Object.keys(fieldIcons).map((type) => (
                        <button key={type} className="field-btn" onClick={() => addField(type)}>
                            {fieldIcons[type]} {type}
                        </button>
                    ))}

                    {/* Show "Update" and "Publish" buttons only if it's a form and not a template */}
                    {isEditableForm && (
                        <>
                            <button className="update-form-btn" onClick={() => saveOrUpdateForm(false)}>
                                Update Form
                            </button>
                            <button className="publish-form-btn" onClick={() => publishForm()}>
                                Publish Form
                            </button>
                        </>
                    )}

                    <button className="save-form-btn" onClick={() => saveOrUpdateForm(true)}>
                        Save Form
                    </button>

                </div>

                <div className="form-container" style={{ backgroundColor: formBgColor }}>
                    <Rnd
                        default={{ x: formTitleX, y: formTitleY, width: formTitleWidth, height: formTitleHeight }}
                        bounds="parent"
                        enableResizing={{
                            top: true,
                            right: true,
                            bottom: true,
                            left: true,
                            topRight: true,
                            bottomRight: true,
                            bottomLeft: true,
                            topLeft: true
                        }}
                        onDragStop={(e, d) => {
                            const { x, y } = getValidPosition(d.x, d.y, formTitleWidth, formTitleHeight, null, true);
                            setFormTitleX(x);
                            setFormTitleY(y);
                        }}
                        onResizeStop={(e, direction, ref, delta, position) => {
                            setFormTitleWidth(ref.offsetWidth);
                            setFormTitleHeight(ref.offsetHeight);
                            setFormTitleX(position.x);
                            setFormTitleY(position.y);
                        }}
                    >

                        <input
                            type="text"
                            value={formTitle}
                            onChange={(e) => setFormTitle(e.target.value)}
                            className="form-title"
                            style={{
                                color: formTitleColor,
                                backgroundColor: formTitleBgColor,
                                fontSize: `${formTitleFontSize}px`,
                                width: `${formTitleWidth}px`, // Change this from "100%" to dynamic width
                                height: `${formTitleHeight}px`, // Ensure height is dynamic too
                            }}
                        />
                    </Rnd>

                    {fields.map((field) => (
                        <Rnd
                            key={field.id}
                            position={{ x: field.x, y: field.y }}
                            size={{ width: field.width, height: field.height }}
                            bounds="parent"
                            enableResizing={{
                                top: true,
                                right: true,
                                bottom: true,
                                left: true,
                                topRight: true,
                                bottomRight: true,
                                bottomLeft: true,
                                topLeft: true
                            }}
                            onDragStop={(e, d) => {
                                let { x, y } = d;
                                const { x: validX, y: validY } = getValidPosition(x, y, field.width, field.height, field.id);

                                setFields((prevFields) =>
                                    prevFields.map(f =>
                                        f.id === field.id ? { ...f, x: validX, y: validY } : f
                                    )
                                );
                            }}
                            onResizeStop={(e, direction, ref, delta, position) => {
                                const updatedWidth = ref.offsetWidth;
                                const updatedHeight = ref.offsetHeight;

                                setFields(prevFields =>
                                    prevFields.map(f =>
                                        f.id === field.id
                                            ? { ...f, width: updatedWidth, height: updatedHeight }
                                            : f
                                    )
                                );

                                setLastFieldSize({ width: updatedWidth, height: updatedHeight }); // Update global last field size
                            }}
                        >

                            <div className="field" style={{
                                backgroundColor: field.bgColor,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-start",
                                padding: "5px",
                                borderRadius: "5px",
                                width: "100%",  // Makes it fully resizable
                                height: "100%", // Ensures height is taken from `Rnd`
                                minHeight: "40px" // Prevents collapsing
                            }} onClick={() => setSelectedField(field)}>
                                <span style={{ color: field.labelColor, fontSize: `${field.fontSize}px`, fontWeight: "bold", marginRight: "10px", marginBottom: "10px" }}>{field.label}</span>
                                <div style={{ display: "flex", alignItems: "center", flexGrow: 1, width: "100%" }}>
                                    {getInputType(field.type, field.id)}
                                    <button className="delete-btn" onClick={() => deleteField(field.id)} style={{ background: "red", color: "white", border: "none", borderRadius: "50%", width: "30px", height: "30px", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", marginLeft: "10px" }}>
                                        <FaTrash size={13} />
                                    </button>
                                </div>
                            </div>

                        </Rnd>
                    ))}

                    <Rnd
                        default={{
                            x: submitBtnX,
                            y: submitBtnY,
                            width: submitBtnWidth,
                            height: submitBtnHeight
                        }}
                        bounds="parent"
                        enableResizing={{ bottomRight: true }}
                        onDragStop={(e, d) => {
                            let newY = d.y;

                            // If submit button is near the bottom, increase container height
                            if (newY + submitBtnHeight > document.querySelector(".form-container").clientHeight - 20) {
                                document.querySelector(".form-container").style.height = `${newY + submitBtnHeight + 50}px`;
                            }

                            setSubmitBtnX(d.x);
                            setSubmitBtnY(newY);
                        }}
                        onResizeStop={(e, direction, ref, delta, position) => {
                            setSubmitBtnWidth(ref.offsetWidth);
                            setSubmitBtnHeight(ref.offsetHeight);
                            setSubmitBtnX(position.x);
                            setSubmitBtnY(position.y);
                        }}
                    >
                        <button
                            className="submit-form-btn"
                            style={{
                                backgroundColor: submitBtnBgColor,
                                color: submitBtnTextColor,
                                fontSize: `${submitBtnFontSize}px`,
                                width: "100%",
                                height: "100%",
                                border: "none",
                                borderRadius: "5px",
                                cursor: "pointer"
                            }}
                        >
                            Submit
                        </button>
                    </Rnd>

                </div>

                <div className="customize-section">
                    <h2>Customize</h2>
                    <label>Form Title:</label>
                    <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />

                    <label>Title Color:</label>
                    <input type="color" value={formTitleColor} onChange={(e) => setFormTitleColor(e.target.value)} />

                    <label>Title Background Color:</label>
                    <input type="color" value={formTitleBgColor} onChange={(e) => setFormTitleBgColor(e.target.value)} />

                    <label>Title Font Size:</label>
                    <input type="number" value={formTitleFontSize} onChange={(e) => setFormTitleFontSize(parseInt(e.target.value))} />

                    <label>Form Background Color:</label>
                    <input type="color" value={formBgColor} onChange={(e) => setFormBgColor(e.target.value)} />

                    <label>Submit Button Background:</label>
                    <input
                        type="color"
                        value={submitBtnBgColor}
                        onChange={(e) => setSubmitBtnBgColor(e.target.value)}
                    />

                    <label>Submit Button Text Color:</label>
                    <input
                        type="color"
                        value={submitBtnTextColor}
                        onChange={(e) => setSubmitBtnTextColor(e.target.value)}
                    />
                    <label>Submit Button Font Size</label>
                    <input type="number" value={submitBtnFontSize} onChange={(e) => setSubmitBtnFontSize(parseInt(e.target.value, 10) || 16)} />

                    <h2>Global Customization</h2>

                    <label>Global Background Color:</label>
                    <input
                        type="color"
                        value={globalSettings.bgColor}
                        onChange={(e) => updateGlobalSettings("bgColor", e.target.value)}
                    />

                    <label>Global Label Color:</label>
                    <input
                        type="color"
                        value={globalSettings.labelColor}
                        onChange={(e) => updateGlobalSettings("labelColor", e.target.value)}
                    />

                    <label>Global Font Size:</label>
                    <input
                        type="number"
                        value={globalSettings.fontSize}
                        onChange={(e) => updateGlobalSettings("fontSize", parseInt(e.target.value, 10))}
                    />

                    <label>Global Width:</label>
                    <input
                        type="number"
                        value={globalSettings.width}
                        onChange={(e) => updateGlobalSettings("width", parseInt(e.target.value, 10))}
                    />

                    <label>Global Height:</label>
                    <input
                        type="number"
                        value={globalSettings.height}
                        onChange={(e) => updateGlobalSettings("height", parseInt(e.target.value, 10))}
                    />

                    {selectedField && (
                        <>
                            <h3>Field Settings</h3>
                            <label>Label Text:</label>
                            <input type="text" value={selectedField.label} onChange={(e) => updateField(selectedField.id, "label", e.target.value)} />

                            <label>Label Background Color:</label>
                            <input type="color" value={selectedField.bgColor} onChange={(e) => updateField(selectedField.id, "bgColor", e.target.value)} />

                            <label>Label Color:</label>
                            <input type="color" value={selectedField.labelColor} onChange={(e) => updateField(selectedField.id, "labelColor", e.target.value)} />

                            <label>Label Font Size:</label>
                            <input type="number" value={selectedField.fontSize} onChange={(e) => updateField(selectedField.id, "fontSize", parseInt(e.target.value))} />

                            {/* Option Editing for Dropdown & Multiple Choice */}
                            {(selectedField.type === "Dropdown" || selectedField.type === "Multiple Choice") && (
                                <>
                                    <h4>Options</h4>
                                    {selectedField.options.map((option, index) => (
                                        <div key={index} style={{ display: "flex", gap: "10px", marginBottom: "5px" }}>
                                            <input
                                                type="text"
                                                value={option}
                                                onChange={(e) => {
                                                    const newOptions = [...selectedField.options];
                                                    newOptions[index] = e.target.value;
                                                    updateField(selectedField.id, "options", newOptions);
                                                }}
                                            />
                                            <button onClick={() => {
                                                const newOptions = selectedField.options.filter((_, i) => i !== index);
                                                updateField(selectedField.id, "options", newOptions);
                                            }}>❌</button>
                                        </div>
                                    ))}
                                    <button onClick={() => updateField(selectedField.id, "options", [...selectedField.options, `Option ${selectedField.options.length + 1}`])}>
                                        ➕ Add Option
                                    </button>
                                </>
                            )}

                            {selectedField?.type === "Linear Scale" && (
                                <>
                                    <label>Min Value:</label>
                                    <input type="number" value={selectedField.min} onChange={(e) => updateField(selectedField.id, "min", parseInt(e.target.value))} />
                                    <label>Max Value:</label>
                                    <input type="number" value={selectedField.max} onChange={(e) => updateField(selectedField.id, "max", parseInt(e.target.value))} />
                                </>
                            )}

                            {selectedField && selectedField.type === "Multiple Choice Grid" && (
                                <>
                                    <h3>Field Settings</h3>

                                    {/* Customize Rows */}
                                    <h4>Rows</h4>
                                    {selectedField.rows.map((row, index) => (
                                        <div key={index} style={{ display: "flex", gap: "10px", marginBottom: "5px" }}>
                                            <input
                                                type="text"
                                                value={row}
                                                onChange={(e) => {
                                                    const newRows = [...selectedField.rows];
                                                    newRows[index] = e.target.value;
                                                    updateField(selectedField.id, "rows", newRows);
                                                }}
                                            />
                                            <button onClick={() => {
                                                const newRows = selectedField.rows.filter((_, i) => i !== index);
                                                updateField(selectedField.id, "rows", newRows);
                                            }}>❌</button>
                                        </div>
                                    ))}
                                    <button onClick={() => updateField(selectedField.id, "rows", [...selectedField.rows, `Row ${selectedField.rows.length + 1}`])}>
                                        ➕ Add Row
                                    </button>

                                    {/* Customize Columns */}
                                    <h4>Columns</h4>
                                    {selectedField.columns.map((col, index) => (
                                        <div key={index} style={{ display: "flex", gap: "10px", marginBottom: "5px" }}>
                                            <input
                                                type="text"
                                                value={col}
                                                onChange={(e) => {
                                                    const newColumns = [...selectedField.columns];
                                                    newColumns[index] = e.target.value;
                                                    updateField(selectedField.id, "columns", newColumns);
                                                }}
                                            />
                                            <button onClick={() => {
                                                const newColumns = selectedField.columns.filter((_, i) => i !== index);
                                                updateField(selectedField.id, "columns", newColumns);
                                            }}>❌</button>
                                        </div>
                                    ))}
                                    <button onClick={() => updateField(selectedField.id, "columns", [...selectedField.columns, `Column ${selectedField.columns.length + 1}`])}>
                                        ➕ Add Column
                                    </button>
                                </>
                            )}

                        </>
                    )}

                </div>
            </div>
        </div >
    );
};

export default FormBuilder;