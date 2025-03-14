import Swal from "sweetalert2";
import { useNotification } from "./NotificationContext";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import "./Form_builder.css";

const FIELD_TYPES = [
    { field_type: "text", icon: "fa-font", label: "Short Answer" },
    { field_type: "dropdown", icon: "fa-list", label: "Dropdown" },
    { field_type: "radio", icon: "fa-dot-circle", label: "Multiple Choice" },
    { field_type: "checkbox", icon: "fa-check-square", label: "Checkbox" },
    { field_type: "date", icon: "fa-calendar", label: "Date" },
    { field_type: "textarea", icon: "fa-paragraph", label: "Paragraph" }
];

const Field = ({ field, index, moveField, removeField, updateLabel }) => {
    const [, ref] = useDrag({
        type: "field",
        item: { index },
    });

    const [, drop] = useDrop({
        accept: "field",
        hover: (draggedItem) => {
            if (draggedItem.index !== index) {
                moveField(draggedItem.index, index);
                draggedItem.index = index;
            }
        },
    });

    const fieldType = field.field_type || field.type; // Ensure backward compatibility

    return (
        <div ref={(node) => ref(drop(node))} className="input-field">
            <input
                type="text"
                className="field-label"
                value={field.label}
                onChange={(e) => updateLabel(index, e.target.value)}
                placeholder="Enter field label"
            />
            {fieldType === "dropdown" ? (
                <select>
                    <option>Option 1</option>
                    <option>Option 2</option>
                </select>
            ) : fieldType === "radio" || fieldType === "checkbox" ? (
                <input type={fieldType} />
            ) : fieldType === "date" ? (
                <input type="date" />
            ) : fieldType === "textarea" ? (
                <textarea placeholder="Enter text" />
            ) : (
                <input type="text" placeholder={`Enter ${fieldType}`} />
            )}

            <div className="field-actions">
                <span className="drag-handle">☰</span>
                <button onClick={() => removeField(index)}>
                    <i className="fa-solid fa-trash"></i> Delete
                </button>
            </div>
        </div>
    );
};

const FormBuilder = () => {
    const [formTitle, setFormTitle] = useState("Untitled Form");
    const [fields, setFields] = useState([]);
    const [bgColor, setBgColor] = useState("#ffffff");
    const { setShowNotification } = useNotification();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { formId } = useParams();

    useEffect(() => {
        axios.get("http://localhost:5000/api/header/get-user-profile", { withCredentials: true })
            .then((res) => {
                if (!res.data?.user_id) throw new Error("Unauthorized");
                setProfile(res.data);
            })
            .catch(() => navigate("/login"))
            .finally(() => setLoading(false));
    }, [navigate]);

    useEffect(() => {
        setTimeout(() => {
            const formBuilderLayout = document.querySelector(".form-content");
            if (formBuilderLayout) {
                formBuilderLayout.style.backgroundColor = bgColor;
            }
        }, 0);
    }, [bgColor]);

    useEffect(() => {
        if (formId) {
            const cleanFormId = formId.replace("form-", "");

            axios.get(`http://localhost:5000/api/form_builder/get-specific-form/${cleanFormId}`, { withCredentials: true })
                .then((res) => {
                    setFormTitle(res.data.title);
                    setFields(res.data.fields);
                })
                .catch((err) => {
                    console.error("Error fetching form:", err);
                    Swal.fire("Error", "Failed to load form.", "error");
                });
        }
    }, [formId]);

    const addField = (field_type) => {
        setFields([...fields, { field_id: null, field_type, label: "" }]);
    };

    const moveField = (fromIndex, toIndex) => {
        const updatedFields = [...fields];
        const [movedField] = updatedFields.splice(fromIndex, 1);
        updatedFields.splice(toIndex, 0, movedField);
        setFields(updatedFields);
    };

    const removeField = (index) => {
        setFields(fields.filter((_, i) => i !== index));
    };

    const updateLabel = (index, label) => {
        const updatedFields = [...fields];
        updatedFields[index].label = label;
        setFields(updatedFields);
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

        try {
            if (!isNew && formId) {
                const cleanFormId = formId.replace("form-", "");
                const response = await axios.put(
                    `http://localhost:5000/api/form_builder/update-form/${cleanFormId}`,
                    { title: formTitle, fields },
                    { withCredentials: true }
                );
                Swal.fire("Success!", response.data.message, "success");
            } else {
                const response = await axios.post(
                    "http://localhost:5000/api/form_builder/save-form",
                    { title: formTitle, fields },
                    { withCredentials: true }
                );
                Swal.fire("Success!", response.data.message, "success");
            }

            setShowNotification(true);
        } catch (error) {
            console.error("Error saving/updating form:", error);
            // ✅ Check for "already exists" in the correct place
            const errorMessage = error.response?.data?.error || "An error occurred";
            if (errorMessage.includes("already exists")) {
                Swal.fire("Duplicate Title", "A form with this title already exists. Please choose a different name.", "warning");
            } else {
                Swal.fire("Error", errorMessage, "error");
            }
        }
    };

    if (loading) return <p>Loading...</p>;

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="form-builder-container" style={{ backgroundColor: bgColor }}>
                <div className="form-builder-layout">
                    <div className="sidebar">
                        <h3>Fields</h3>
                        {FIELD_TYPES.map(({ field_type, icon, label }) => (
                            <button key={field_type} onClick={() => addField(field_type)}>
                                <i className={`fa-solid ${icon}`}></i> {label}
                            </button>
                        ))}
                        <label>Background Color:</label>
                        <input
                            type="color"
                            value={bgColor}
                            onChange={(e) => setBgColor(e.target.value)}
                            style={{ marginBottom: "10px" }}
                        />

                        <button
                            className="save-form-btn"
                            style={{ display: formId ? "inline-block" : "none" }}
                            onClick={() => saveOrUpdateForm(false)}
                        >
                            Update Form
                        </button>

                        <button className="save-form-btn" onClick={() => saveOrUpdateForm(true)}>
                            Save Form
                        </button>
                    </div>

                    <div className="form-content">
                        <input className="form-title-input" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
                        {fields.map((field, index) => (
                            <Field key={`${field.field_type || field.type}-${index}`} field={field} index={index} moveField={moveField} removeField={removeField} updateLabel={updateLabel} />
                        ))}
                    </div>
                </div>
            </div>
        </DndProvider>
    );
};

export default FormBuilder;
