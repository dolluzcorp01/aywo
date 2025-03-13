import Swal from "sweetalert2";
import { useNotification } from "./NotificationContext";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import "./Form_builder.css";

const FIELD_TYPES = [
    { type: "text", icon: "fa-font", label: "Short Answer" },
    { type: "dropdown", icon: "fa-list", label: "Dropdown" },
    { type: "radio", icon: "fa-dot-circle", label: "Multiple Choice" },
    { type: "checkbox", icon: "fa-check-square", label: "Checkbox" },
    { type: "date", icon: "fa-calendar", label: "Date" },
    { type: "textarea", icon: "fa-paragraph", label: "Paragraph" }
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

    return (
        <div ref={(node) => ref(drop(node))} className="input-field">
            <input
                type="text"
                className="field-label"
                value={field.label}
                onChange={(e) => updateLabel(index, e.target.value)}
                placeholder="Enter field label"
            />
            {field.type === "dropdown" ? (
                <select>
                    <option>Option 1</option>
                    <option>Option 2</option>
                </select>
            ) : field.type === "radio" || field.type === "checkbox" ? (
                <input type={field.type} />
            ) : field.type === "date" ? (
                <input type="date" />
            ) : field.type === "textarea" ? (
                <textarea placeholder="Enter text" />
            ) : (
                <input type="text" placeholder={`Enter ${field.type}`} />
            )}

            <div className="field-actions">
                <span className="drag-handle">☰</span>
                <button onClick={() => removeField(index)}><i className="fa-solid fa-trash"></i> Delete</button>
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
    const { formId } = useParams(); // Get form ID from URL

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

    // ✅ Fetch form data if formId exists
    useEffect(() => {
        if (formId) {
            const cleanFormId = formId.replace("form-", ""); // ✅ Remove 'form-' prefix
            console.log("Extracted Form ID:", cleanFormId); // Debugging log

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

    const addField = (type) => {
        setFields([...fields, { type, label: "", id: Date.now() }]);
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

    const saveForm = async () => {
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
            const response = await axios.post(
                "http://localhost:5000/api/form_builder/save-form",
                { title: formTitle, fields },
                { withCredentials: true }
            );

            Swal.fire("Success!", response.data.message, "success");
            setShowNotification(true);
        } catch (error) {
            console.error("Error saving form:", error);

            Swal.fire("Error", error.response?.data.error || "Failed to save form. Please try again.", "error");
        }
    };

    if (loading) return <p>Loading...</p>;

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="form-builder-container" style={{ backgroundColor: bgColor }}>
                <div className="form-builder-layout">
                    {/* Sidebar - Left Panel */}
                    <div className="sidebar">
                        <h3>Fields</h3>
                        {FIELD_TYPES.map(({ type, icon, label }) => (
                            <button key={type} onClick={() => addField(type)}>
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

                        {/* Save Button (Fixed at Bottom Right) */}
                        <button className="save-form-btn" onClick={saveForm}>Save Form</button>
                    </div>

                    {/* Dynamic Form - Right Panel */}
                    <div className="form-content">
                        <input className="form-title-input" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
                        {fields.map((field, index) => (
                            <Field key={field.id} field={field} index={index} moveField={moveField} removeField={removeField} updateLabel={updateLabel} />
                        ))}
                    </div>
                </div>
            </div>
        </DndProvider>
    );
};

export default FormBuilder;
