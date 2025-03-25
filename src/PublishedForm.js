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
        axios.get(`http://localhost:5000/api/published_form/get-published-form/${formId}`)
            .then(res => {
                console.log("📥 Fetched published form:", res.data);
                setForm(res.data.form);
                setFields(res.data.fields);
                console.log("📌 Parsed Fields:", res.data.fields);
            })
            .catch(() => Swal.fire("Error", "Form not found or unpublished.", "error"));
    }, [formId]);

    const handleSubmit = () => {
        if (!form || fields.length === 0) {
            Swal.fire("Error", "Form data is missing.", "error");
            return;
        }

        if (Object.keys(responses).length < fields.length) {
            Swal.fire("Error", "Please fill out all fields before submitting.", "warning");
            return;
        }

        axios.post("http://localhost:5000/api/published_form/submit-form", {
            form_id: form.form_id,
            responses
        })
            .then(() => {
                Swal.fire("Success!", "Form submitted successfully!", "success");
                setResponses({});
            })
            .catch(() => {
                Swal.fire("Error", "Failed to submit form.", "error");
            });
    };

    if (!form) return <p>Loading...</p>;

    return (
        <div
            className="public-form-container"
            style={{
                backgroundColor: form.form_background,
                width: "100%",
                height: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
                overflow: "auto"
            }}
        >
            <div
                style={{
                    position: "relative",
                    width: "45%", // Adjust width as needed
                    height: "100%", // Adjust height as needed
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <h2
                    style={{
                        position: "absolute",
                        left: `${form.title_x}px`,
                        top: `${form.title_y}px`,
                        width: `${form.title_width}px`,
                        height: `${form.title_height}px`,
                        fontSize: `${form.title_font_size}px`,
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
                            minHeight: `${field.height}px`,  
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
                                    minHeight: "35px",
                                    fontSize: `${field.fontSize}px`,
                                    borderRadius: "5px",
                                    border: "1px solid #ccc",
                                    padding: "5px",
                                    boxSizing: "border-box",
                                }}
                                onChange={(e) => setResponses({ ...responses, [field.field_id]: e.target.value })}
                            />
                        )}

                        {/* Paragraph */}
                        {field.field_type === "Paragraph" && (
                            <textarea
                                style={{
                                    width: "100%",
                                    minHeight: `${field.height}px`,
                                    fontSize: `${field.fontSize}px`,
                                    borderRadius: "5px",
                                    border: "1px solid #ccc",
                                    padding: "5px",
                                    boxSizing: "border-box",
                                }}
                                onChange={(e) => setResponses({ ...responses, [field.field_id]: e.target.value })}
                            />
                        )}

                        {/* Number */}
                        {field.field_type === "Number" && (
                            <input
                                type="number"
                                style={{
                                    width: "100%",
                                    minHeight: "35px",
                                    fontSize: `${field.fontSize}px`,
                                    borderRadius: "5px",
                                    border: "1px solid #ccc",
                                    padding: "5px",
                                    boxSizing: "border-box",
                                    appearance: "textfield",
                                    MozAppearance: "textfield",
                                    WebkitAppearance: "none",
                                }}
                                onChange={(e) => setResponses({ ...responses, [field.field_id]: e.target.value })}
                                onWheel={(e) => e.target.blur()} // Prevents number scroll
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
    );

};

export default PublishedForm;
