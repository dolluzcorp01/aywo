import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

const PublishedForm = () => {
    const { formId } = useParams();
    const [form, setForm] = useState(null);
    const [fields, setFields] = useState([]);
    const [responses, setResponses] = useState({});

    useEffect(() => {
        const style = document.createElement("style");
        style.innerHTML = `
            .Published-form-container {
                flex: 1;
                display: flex;
                flex-direction: column;
                height: calc(100vh - 80px);
                overflow: hidden;
                position: relative;
                background-color: white;
            }
    
            .Published-form-body {
                display: flex;
                justify-content: center;
                overflow-y: auto;
                padding: 50px 20px;
                height: 100%;
            }
    
            .Published-form-content {
                display: flex;
                flex-direction: column;
                position: relative;
                border-radius: 15px;
                overflow: visible;
                max-width: 700px;
                width: 100%;
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style); // Cleanup when component unmounts
        };
    }, []);

    useEffect(() => {
        axios.get(`http://localhost:5000/api/published_form/get-published-form/${formId}`)
            .then(res => {
                console.log("📥 Fetched published form:", res.data);
                setForm(res.data.form);
                setFields(res.data.fields);
                console.log("📌 Parsed Fields:", res.data.fields);
            })
            .catch(() => Swal.fire("Error", "Form not found or unpublished.", "error"));
    }, [formId]);

    useEffect(() => {
        const updateFormHeight = () => {
            const formContainer = document.querySelector('.Published-form-content');
            if (!formContainer) return;

            let maxBottom = 0;
            fields.forEach(field => {
                const bottom = field.y + field.height;
                if (bottom > maxBottom) maxBottom = bottom;
            });

            // ✅ Use form values instead of undefined vars
            const submitBottom = form?.submit_button_y + form?.submit_button_height;
            const contentHeight = Math.max(maxBottom, submitBottom) + 100;

            const currentHeight = parseInt(formContainer.style.height || "0");
            if (currentHeight !== contentHeight) {
                formContainer.style.height = `${contentHeight}px`;
            }
        };

        // Run after DOM updates
        setTimeout(updateFormHeight, 0);
    }, [fields, form]);

    const handleSubmit = () => {
        if (!form || fields.length === 0) {
            Swal.fire("Error", "Form data is missing.", "error");
            return;
        }

        if (Object.keys(responses).length < fields.length) {
            Swal.fire("Error", "Please fill out all fields before submitting.", "warning");
            return;
        }

        const formData = new FormData();
        formData.append("form_id", form.form_id);

        const responsesObject = {}; // Store responses in an object

        Object.entries(responses).forEach(([key, value]) => {
            if (value instanceof File) {
                formData.append("document", value);
                responsesObject[key] = "file_attached"; // Placeholder, backend handles file separately
            } else {
                responsesObject[key] = value;
            }
        });

        // Append stringified JSON of responses
        formData.append("responses", JSON.stringify(responsesObject));

        console.log("Final FormData:", Object.fromEntries(formData.entries())); // Debugging

        axios.post("http://localhost:5000/api/published_form/submit-form", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        })
            .then(() => {
                Swal.fire("Success!", "Form submitted successfully!", "success");

                // Clear all input fields
                setResponses({});
                document.querySelectorAll("input, textarea, select").forEach((element) => {
                    if (element.type === "checkbox" || element.type === "radio") {
                        element.checked = false;
                    } else if (element.type === "file") {
                        element.value = "";
                    } else {
                        element.value = "";
                    }
                });
            })
            .catch(() => {
                Swal.fire("Error", "Failed to submit form.", "error");
            });
    };

    if (!form) return <p>Loading...</p>;

    return (
        <div className="Published-form-container">
            <div
                className="Published-form-body"
                style={{ backgroundColor: form.form_background_color }}
            >
                <div
                    className="Published-form-content"
                    style={{ backgroundColor: form.form_color }}
                >
                    <h2
                        style={{
                            position: "absolute",
                            left: `${form.title_x}px`,
                            fontSize: `${form.title_font_size}px`,
                            top: `${form.title_y}px`,
                            width: `${form.title_width}px`,
                            height: `${form.title_height}px`,
                            color: form.title_color,
                            backgroundColor: form.title_background,
                            textAlign: "center",
                            borderRadius: "5px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        {form.title}
                    </h2>

                    {fields.map((field) => (
                        <div
                            key={field.field_id}
                            style={{
                                position: "absolute",
                                left: `${field.x}px`,
                                top: `${field.y}px`,
                                width: `${field.width}px`,
                                height: `${field.height}px`,
                                backgroundColor: field.bgColor,
                                padding: "5px",
                                borderRadius: "5px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-start",
                                justifyContent: "center",
                                boxSizing: "border-box",
                            }}
                        >
                            <label
                                style={{
                                    fontSize: `${field.fontSize}px`,
                                    fontWeight: "bold",
                                    color: field.labelColor,
                                    marginBottom: "8px",
                                }}
                            >
                                {field.label}
                            </label>

                            {/* Text, Short Answer, and Email Fields */}
                            {(field.field_type === "Text Only" || field.field_type === "Short Answer" || field.field_type === "Email") && (
                                <input
                                    type={field.field_type === "Email" ? "email" : "text"}
                                    style={{
                                        width: "100%",
                                        height: "100%", // Ensures input stretches inside the field
                                        fontSize: `${field.fontSize}px`,
                                        borderRadius: "5px",
                                        border: "1px solid #ccc",
                                        padding: "5px",
                                        boxSizing: "border-box",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                    onChange={(e) => setResponses({ ...responses, [field.field_id]: e.target.value })}
                                />
                            )}

                            {/* Paragraph */}
                            {field.field_type === "Paragraph" && (
                                <textarea
                                    style={{
                                        width: "100%",
                                        height: "100%", // Ensures input stretches inside the field
                                        fontSize: `${field.fontSize}px`,
                                        borderRadius: "5px",
                                        border: "1px solid #ccc",
                                        padding: "5px",
                                        boxSizing: "border-box",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                    onChange={(e) => setResponses({ ...responses, [field.field_id]: e.target.value })}
                                />
                            )}

                            {/* Number */}
                            {field.field_type === "Number" && (
                                <input
                                    type="text" // Keeps it as a text field
                                    inputMode="numeric" // Brings up a numeric keyboard on mobile
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        fontSize: `${field.fontSize}px`,
                                        borderRadius: "5px",
                                        border: "1px solid #ccc",
                                        padding: "5px",
                                        boxSizing: "border-box",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                    value={responses[field.field_id] || ""}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, ""); // Remove non-numeric characters
                                        setResponses((prev) => ({ ...prev, [field.field_id]: value }));
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "e" || e.key === "E" || e.key === "-" || e.key === "+") {
                                            e.preventDefault(); // Block 'e', 'E', '-', '+'
                                        }
                                    }}
                                />
                            )}

                            {/* Date */}
                            {field.field_type === "Date" && (
                                <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                                    <input
                                        type="date"
                                        style={{
                                            flexGrow: 1,
                                            minHeight: "35px",
                                            fontSize: `${field.fontSize}px`,
                                            borderRadius: "5px",
                                            border: "1px solid #ccc",
                                            padding: "5px",
                                            boxSizing: "border-box",
                                        }}
                                        onChange={(e) => setResponses({ ...responses, [field.field_id]: e.target.value })}
                                    />
                                </div>
                            )}

                            {/* Checkbox */}
                            {field.field_type === "Checkbox" && (
                                <input
                                    type="checkbox"
                                    style={{ transform: "scale(1.5)" }}
                                    onChange={(e) => setResponses({ ...responses, [field.field_id]: e.target.checked })}
                                />
                            )}

                            {/* Multiple Choice */}
                            {field.field_type === "Multiple Choice" && field.options?.length > 0 && (
                                <div>
                                    {field.options.map((option, index) => (
                                        <label key={`${field.field_id}-option-${index}`} style={{ display: "block", marginBottom: "5px" }}>
                                            <input
                                                type="radio"
                                                name={`multiple_choice_${field.field_id}`}
                                                value={option}
                                                onChange={(e) => setResponses({ ...responses, [field.field_id]: e.target.value })}
                                            />
                                            {option}
                                        </label>
                                    ))}
                                </div>
                            )}

                            {/* Dropdown */}
                            {field.field_type === "Dropdown" && field.options?.length > 0 && (
                                <select
                                    style={{
                                        width: "100%",
                                        minHeight: "35px",
                                        fontSize: `${field.fontSize}px`,
                                        borderRadius: "5px",
                                        border: "1px solid #ccc",
                                        padding: "5px",
                                        boxSizing: "border-box",
                                    }}
                                    onChange={(e) => setResponses({ ...responses, [field.field_id]: e.target.value })}
                                >
                                    <option value="">Select an option</option>
                                    {field.options.map((option, index) => (
                                        <option key={`${field.field_id}-dropdown-${index}`} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            )}

                            {/* Document Upload Field */}
                            {field.field_type === "Document Type" && (
                                <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                                    <span role="img" aria-label="Document Icon" style={{ marginRight: "8px" }}>
                                        📄
                                    </span>
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                                        style={{
                                            flexGrow: 1,
                                            minHeight: "35px",
                                            fontSize: `${field.fontSize}px`,
                                            borderRadius: "5px",
                                            border: "1px solid #ccc",
                                            padding: "5px",
                                            boxSizing: "border-box",
                                        }}
                                        onChange={(e) => setResponses({ ...responses, [field.field_id]: e.target.files[0] })}
                                    />
                                </div>
                            )}

                        </div>
                    ))}

                    <button
                        onClick={handleSubmit}
                        style={{
                            position: "absolute",
                            left: `${form.submit_button_x}px`,
                            top: `${form.submit_button_y}px`,
                            width: `${form.submit_button_width}px`,
                            height: `${form.submit_button_height}px`,
                            fontSize: `${form.submit_button_font_size}px`,
                            backgroundColor: form.submit_button_background,
                            color: form.submit_button_color,
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                        }}
                    >
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );

};

export default PublishedForm;
