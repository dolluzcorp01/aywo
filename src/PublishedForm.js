import React, { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { apiFetch, API_BASE } from "./utils/api";
import Swal from "sweetalert2";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import Select from 'react-select';
import {
    FaStar, FaTimes
} from "react-icons/fa";

const PublishedForm = () => {
    const [form, setForm] = useState(null);
    const [fields, setFields] = useState([]);
    const [responses, setResponses] = useState({});
    const location = useLocation();

    const [focusedFieldId, setFocusedFieldId] = useState(null);
    const [focusedOptionId, setFocusedOptionId] = useState(null);
    const [focusedSubField, setFocusedSubField] = useState(null);

    const [formBgColor, setFormBgColor] = useState("lightgray");
    const [formColor, setformColor] = useState("white");
    const [formPrimaryColor, setformPrimaryColor] = useState("#3B82F6");
    const [formQuestionColor, setformQuestionColor] = useState("black");
    const [formAnswersColor, setformAnswersColor] = useState("rgb(55, 65, 81)");
    const [selectedFont, setSelectedFont] = useState("");

    const [hovered, setHovered] = useState(null);
    const [hoveredOption, setHoveredOption] = useState(null);
    const pictureBgColors = ["#ffb3ba", "#bae1ff", "#baffc9", "#ffffba", "#e3baff", "#ffdfba"];
    const [editImageOption, setEditImageOption] = useState(null);


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

    const match = location.pathname.match(/\/forms\/form-(\d+)\/page-(\w+)/);
    const formId = match ? match[1] : null;
    const pageId = match ? match[2] : null;

    useEffect(() => {
        const fetchPublishedForm = async () => {
            try {
                const response = await apiFetch(`/api/published_form/get-published-form/${formId}/${pageId}`, {
                    method: 'GET',
                });

                if (!response.ok) throw new Error("Failed to fetch form");

                const data = await response.json();

                setFormBgColor(data.form.background_color || "#f8f9fa");
                setformColor(data.form.questions_background_color || "#fff");
                setformPrimaryColor(data.form.primary_color || "#3b82f6");
                setformQuestionColor(data.form.questions_color || "black");
                setformAnswersColor(data.form.answers_color || "rgb(55, 65, 81)");

                setColors({
                    background: data.form.background_color || "#f8f9fa",
                    questionsBackground: data.form.questions_background_color || "#fff",
                    primary: data.form.primary_color || "#3b82f6",
                    questions: data.form.questions_color || "#333333",
                    answers: data.form.answers_color || "#000000",
                });

                setForm(data.form);
                setFields(data.fields);
            } catch (error) {
                Swal.fire("Error", "Form not found or unpublished.", "error");
            }
        };

        if (formId && pageId) {
            fetchPublishedForm();
        }
    }, [formId, pageId]);

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

    const [colors, setColors] = useState({
        background: "#F8F9FA",
        questionsBackground: "#FFFFFF",
        primary: "#3B82F6",
        questions: "#333333",
        answers: "rgb(55, 65, 81)",
    });

    const inputfieldBgColor = useMemo(() => getTextColor(formColor), [formColor]);

    function getTextColor(bgColor, overlayOpacity = 0.09) {
        if (!bgColor) return "#000000";
        if (bgColor.toLowerCase() === "white") bgColor = "#ffffff";
        if (bgColor.toLowerCase() === "#fff") bgColor = "#ffffff";

        // Convert hex to RGB
        const color = bgColor.startsWith("#") ? bgColor.slice(1) : bgColor;
        const r = parseInt(color.substring(0, 2), 16);
        const g = parseInt(color.substring(2, 4), 16);
        const b = parseInt(color.substring(4, 6), 16);

        // White color for blending
        const whiteR = 255;
        const whiteG = 255;
        const whiteB = 255;

        // Blend formula: result = (1 - alpha) * base + alpha * white
        const mixedR = Math.round((1 - overlayOpacity) * r + overlayOpacity * whiteR);
        const mixedG = Math.round((1 - overlayOpacity) * g + overlayOpacity * whiteG);
        const mixedB = Math.round((1 - overlayOpacity) * b + overlayOpacity * whiteB);

        // Convert back to hex
        const toHex = (val) => val.toString(16).padStart(2, '0');
        return `#${toHex(mixedR)}${toHex(mixedG)}${toHex(mixedB)}`;
    }

    // Function to reorder items
    const reorder = (list, startIndex, endIndex) => {
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return result;
    };

    const getYouTubeVideoId = (url) => {
        const match = url.match(/(?:https?:\/\/)?(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-]{11})/);
        return match ? match[1] : "";
    };

    const renderField = (field) => {
        const commonProps = {
            className: "form-control",
            placeholder: field.placeholder || "",
            default_value: field.default_value || "",
            style: {
                width: field.halfWidth ? "50%" : "100%",
                color: formAnswersColor,
                backgroundColor: inputfieldBgColor,
                boxShadow: "none",
                border: `1px solid ${focusedFieldId === field.id ? formPrimaryColor : "rgba(75, 85, 99, 0.2)"}`,
                fontFamily: selectedFont,
            },
            onFocus: () => setFocusedFieldId(field.id),
            onBlur: () => setFocusedFieldId(null),
        };

        switch (field.type) {
            case "text":
                return <input type="text" {...commonProps} />;
            case "Short Answer":
                return <input type="text" {...commonProps} />;
            case "Heading":
                return (
                    <input
                        type="text"
                        value={field.label}
                        onChange={(e) => {
                            const updatedFields = fields.map(f =>
                                f.id === field.id ? { ...f, label: e.target.value } : f
                            );
                            setFields(updatedFields);
                        }}
                        style={{
                            fontSize: field.fontSize || "24px",
                            fontWeight: "bold",
                            border: "none",
                            background: "transparent",
                            width: "100%",
                            margin: "8px 0",
                            color: formAnswersColor,
                            fontFamily: selectedFont
                        }}
                    />
                );
            case "Email":
                return (
                    <div style={{ position: "relative", width: field.halfWidth ? "50%" : "100%" }}>
                        <input
                            type="email"
                            {...commonProps}
                            style={{
                                ...commonProps.style,
                                paddingLeft: "35px" // space for icon
                            }}
                        />
                        <span
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: "10px",
                                transform: "translateY(-50%)",
                                color: "#999"
                            }}
                        >
                            <i className="fa-solid fa-envelope"></i>
                        </span>
                    </div>
                );
            case "Paragraph":
                return (
                    <textarea
                        {...commonProps}
                        rows={4}
                        style={{
                            ...commonProps.style,
                            resize: "vertical", // Allows the user to resize vertically
                            minHeight: "80px",
                            fontSize: "1rem",
                            padding: "8px",
                            borderRadius: "6px"
                        }}
                    />
                );
            case "Banner":
                const alert_type = field.alert_type || "info"; // Default to 'info'

                const alertStyles = {
                    warning: {
                        backgroundColor: "#fff8e1",
                        border: "1px solid #fbc02d",
                        icon: "fa-exclamation-triangle",
                        iconColor: "#fbc02d",
                        textColor: "#f57f17"
                    },
                    error: {
                        backgroundColor: "#fdecea",
                        border: "1px solid #f44336",
                        icon: "fa-times-circle",
                        iconColor: "#f44336",
                        textColor: "#d32f2f"
                    },
                    info: {
                        backgroundColor: "#e3f2fd",
                        border: "1px solid #2196f3",
                        icon: "fa-info-circle",
                        iconColor: "#2196f3",
                        textColor: "#1565c0"
                    },
                    success: {
                        backgroundColor: "#e8f5e9",
                        border: "1px solid #4caf50",
                        icon: "fa-check-circle",
                        iconColor: "#4caf50",
                        textColor: "#2e7d32"
                    }
                };

                const style = alertStyles[alert_type.toLowerCase()] || alertStyles.info;

                return (
                    <div
                        style={{
                            backgroundColor: style.backgroundColor,
                            border: style.border,
                            borderRadius: "10px",
                            padding: "16px",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            width: "100%",
                            boxSizing: "border-box"
                        }}
                    >
                        <i className={`fa ${style.icon}`} style={{ fontSize: "20px", color: style.iconColor }}></i>
                        <div style={{ backgroundColor: "#f5f5f5", padding: "8px 12px", borderRadius: "4px", width: "100%" }}>
                            <input
                                type="text"
                                value={field.label || "Banner title"}
                                onChange={(e) => {
                                    const updatedFields = fields.map(f =>
                                        f.id === field.id ? { ...f, label: e.target.value } : f
                                    );
                                    setFields(updatedFields);
                                }}
                                style={{
                                    fontWeight: "bold",
                                    color: style.textColor,
                                    border: "none",
                                    background: "transparent",
                                    width: "100%",
                                    fontSize: "18px",
                                    marginBottom: "8px",
                                    fontFamily: selectedFont
                                }}
                            />
                            <textarea
                                value={field.description || "Some description"}
                                onChange={(e) => {
                                    const updatedFields = fields.map(f =>
                                        f.id === field.id ? { ...f, description: e.target.value } : f
                                    );
                                    setFields(updatedFields);
                                }}
                                rows={4}
                                style={{
                                    color: style.textColor,
                                    width: "100%",
                                    resize: "vertical", // Allows the user to resize vertically
                                    minHeight: "80px",
                                    fontSize: "1rem",
                                    padding: "8px",
                                    border: "1px solid #ccc",
                                    borderRadius: "6px",
                                    fontFamily: selectedFont
                                }}
                            />
                        </div>
                    </div>
                );
            case "Number":
                return (
                    <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        {...commonProps}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d*$/.test(value)) {
                                const updatedFields = fields.map(f =>
                                    f.id === field.id ? { ...f, value } : f
                                );
                                setFields(updatedFields);
                            }
                        }}
                        value={field.value || field.default_value || ""}  // Use default_value  if value is not set
                    />
                );
            case "Checkbox":
                return (
                    <div className="form-check">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            id={`checkbox-${field.id}`}
                            name={`checkbox-${field.id}`}
                            checked={field.default_value === "true"}
                            onChange={(e) => {
                                const updatedFields = fields.map(f =>
                                    f.id === field.id
                                        ? { ...f, default_value: e.target.checked.toString() }
                                        : f
                                );
                                setFields(updatedFields);
                            }}
                            style={{ accentColor: formPrimaryColor }}
                        />
                    </div>
                );
            case "Checkboxes":
                return field.options.map((opt, idx) => (
                    <div key={idx} className="form-check">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            id={`checkbox-${field.id}-${idx}`}
                            style={{ accentColor: formPrimaryColor }}
                        />
                        <label className="form-check-label" style={{ color: formAnswersColor, fontFamily: selectedFont }} htmlFor={`checkbox-${field.id}-${idx}`}>{opt.option_text}</label>
                    </div>
                ));
            case "Dropdown":
                const optionsList = field.options.map(opt => ({
                    value: opt.option_text,
                    label: opt.option_text
                }));

                return (
                    <div onFocus={() => setFocusedFieldId(field.id)} onBlur={() => setFocusedFieldId(null)}>
                        <Select
                            options={optionsList}
                            isClearable
                            placeholder={field.placeholder || "Select an option..."}
                            onChange={(selectedOption) => {
                                const updatedFields = fields.map(f => {
                                    if (f.id === field.id) {
                                        return { ...f, value: selectedOption ? selectedOption.value : "" };
                                    }
                                    return f;
                                });
                                setFields(updatedFields);
                            }}
                            value={
                                field.value
                                    ? optionsList.find(opt => opt.value === field.value)
                                    : null
                            }
                            styles={{
                                control: (base, state) => ({
                                    ...base,
                                    border: `1px solid ${focusedFieldId === field.id ? formPrimaryColor : "rgba(75, 85, 99, 0.2)"}`,
                                    boxShadow: "none",
                                    backgroundColor: inputfieldBgColor,
                                    color: formAnswersColor,
                                    "&:hover": {
                                        border: `1px solid ${formPrimaryColor}`
                                    },
                                    fontFamily: selectedFont
                                }),
                                option: (base, state) => ({
                                    ...base,
                                    backgroundColor: state.isFocused || state.isSelected ? formPrimaryColor : "white",
                                    color: state.isFocused || state.isSelected ? "white" : "black",
                                    cursor: "pointer",
                                    fontFamily: selectedFont
                                }),
                                singleValue: (base) => ({
                                    ...base,
                                    color: formAnswersColor,
                                    fontFamily: selectedFont
                                }),
                                placeholder: (base) => ({
                                    ...base,
                                    color: "#888",
                                    fontFamily: selectedFont
                                })
                            }}
                        />
                    </div>
                );
            case "Multiple Select":
                return (
                    <Select
                        isMulti
                        options={field.options.map(opt => ({
                            value: opt.option_text,
                            label: opt.option_text
                        }))}
                        className="basic-multi-select"
                        classNamePrefix="select"
                        placeholder={field.placeholder || "Select an option..."}
                        onChange={(selectedOptions) => {
                            const values = selectedOptions.map(opt => opt.value);
                            const updatedFields = fields.map(f => {
                                if (f.id === field.id) {
                                    return { ...f, value: values };
                                }
                                return f;
                            });
                            setFields(updatedFields);
                        }}
                        value={
                            field.value
                                ? field.value.map(val => ({
                                    value: val,
                                    label: val
                                }))
                                : []
                        }
                        styles={{
                            control: (base, state) => ({
                                ...base,
                                border: `1px solid ${focusedFieldId === field.id ? formPrimaryColor : "rgba(75, 85, 99, 0.2)"}`,
                                boxShadow: "none",
                                backgroundColor: inputfieldBgColor,
                                color: formAnswersColor,
                                "&:hover": {
                                    border: `1px solid ${formPrimaryColor}`
                                },
                                fontFamily: selectedFont
                            }),
                            multiValue: (base) => ({
                                ...base,
                                backgroundColor: formPrimaryColor,
                                fontFamily: selectedFont
                            }),
                            multiValueLabel: (base) => ({
                                ...base,
                                color: formAnswersColor,
                                fontFamily: selectedFont
                            }),
                            multiValueRemove: (base) => ({
                                ...base,
                                color: formAnswersColor,
                                ':hover': {
                                    backgroundColor: "#fff",
                                    color: formPrimaryColor
                                },
                                fontFamily: selectedFont
                            }),
                            option: (base, { isSelected, isFocused }) => ({
                                ...base,
                                backgroundColor: isFocused || isSelected ? formPrimaryColor : "white",
                                color: isFocused || isSelected ? "white" : "black",
                                cursor: "pointer",
                                fontFamily: selectedFont
                            }),
                            placeholder: (base) => ({
                                ...base,
                                fontFamily: selectedFont
                            })
                        }}
                    />
                );
            case "Switch":
                return (
                    <div className="form-check form-switch">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id={`switch-${field.id}`}
                            name={`switch-${field.id}`}
                            checked={field.default_value === "true"}
                            onChange={(e) => {
                                const updatedFields = fields.map(f =>
                                    f.id === field.id
                                        ? { ...f, default_value: e.target.checked.toString() }
                                        : f
                                );
                                setFields(updatedFields);
                            }}
                            style={{
                                backgroundColor: field.default_value === "true" ? formPrimaryColor : "",
                                borderColor: formPrimaryColor,
                                boxShadow: "none",
                            }}
                        />
                    </div>
                );
            case "Multiple Choice":
                return (
                    <>
                        {field.options.map((opt, idx) => (
                            field.bubble ? (
                                // Bubble Style
                                <div
                                    key={idx}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        border: "1px solid #ccc",
                                        borderRadius: "12px",
                                        padding: "4px 8px",
                                        margin: "4px 0",
                                        backgroundColor: "#f1f1f1",
                                        position: "relative",
                                        width: "fit-content",
                                        minWidth: "200px",
                                    }}
                                >
                                    <input
                                        type="radio"
                                        className="form-check-input"
                                        name={`field_${field.id}`}
                                        id={`bubble-radio-${field.id}-${idx}`}
                                        checked={field.selectedOption === idx}
                                        onChange={() => {
                                            const updatedFields = fields.map(f =>
                                                f.id === field.id ? { ...f, selectedOption: idx } : f
                                            );
                                            setFields(updatedFields);
                                        }}
                                        style={{
                                            marginRight: "8px",
                                            boxShadow: "none",
                                            borderColor: field.selectedOption === idx ? formPrimaryColor : "#ccc",
                                            backgroundColor: field.selectedOption === idx ? formPrimaryColor : "transparent",
                                        }}
                                    />

                                    <input
                                        type="text"
                                        value={typeof opt === "object" ? opt.option_text : opt}
                                        onChange={(e) => {
                                            const newOptions = [...field.options];
                                            newOptions[idx] = typeof opt === "object"
                                                ? { ...opt, option_text: e.target.value }
                                                : e.target.value;

                                            const updatedFields = fields.map(f =>
                                                f.id === field.id ? { ...f, options: newOptions } : f
                                            );
                                            setFields(updatedFields);
                                        }}
                                        style={{
                                            border: "none",
                                            background: "transparent",
                                            outline: "none",
                                            flexGrow: 1,
                                            minWidth: "50px",
                                            color: formPrimaryColor,
                                            fontFamily: selectedFont
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            const newOptions = field.options.filter((_, i) => i !== idx);
                                            const updatedFields = fields.map(f =>
                                                f.id === field.id ? { ...f, options: newOptions } : f
                                            );
                                            setFields(updatedFields);
                                        }}
                                        style={{
                                            background: "transparent",
                                            border: "none",
                                            color: "#666",
                                            fontWeight: "bold",
                                            fontSize: "16px",
                                            marginLeft: "8px",
                                            cursor: "pointer",
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            ) : (
                                // Standard Style
                                <div
                                    key={idx}
                                    className="form-check d-flex align-items-center gap-2"
                                    style={{ position: "relative" }}
                                >
                                    <input
                                        type="radio"
                                        className="form-check-input"
                                        name={`field_${field.id}`}
                                        id={`standard-radio-${field.id}-${idx}`}
                                        checked={field.selectedOption === idx}
                                        onChange={() => {
                                            const updatedFields = fields.map(f =>
                                                f.id === field.id ? { ...f, selectedOption: idx } : f
                                            );
                                            setFields(updatedFields);
                                        }}
                                        style={{
                                            marginRight: "8px",
                                            boxShadow: "none",
                                            borderColor: field.selectedOption === idx ? formPrimaryColor : "#ccc",
                                            backgroundColor: field.selectedOption === idx ? formPrimaryColor : "transparent",
                                        }}
                                    />
                                    <input
                                        type="text"
                                        value={typeof opt === "object" ? opt.option_text : opt}
                                        onChange={(e) => {
                                            const newOptions = [...field.options];
                                            newOptions[idx] = typeof opt === "object"
                                                ? { ...opt, option_text: e.target.value }
                                                : e.target.value;

                                            const updatedFields = fields.map(f =>
                                                f.id === field.id ? { ...f, options: newOptions } : f
                                            );
                                            setFields(updatedFields);
                                        }}
                                        style={{
                                            border: "none",
                                            borderBottom: "1px solid #ccc",
                                            width: "auto",
                                            minWidth: "50px",
                                            padding: "2px 4px",
                                            background: "transparent",
                                            color: formAnswersColor,
                                            fontFamily: selectedFont
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            const newOptions = field.options.filter((_, i) => i !== idx);
                                            const updatedFields = fields.map(f =>
                                                f.id === field.id ? { ...f, options: newOptions } : f
                                            );
                                            setFields(updatedFields);
                                        }}
                                        style={{
                                            background: "transparent",
                                            border: "none",
                                            color: "#666",
                                            fontWeight: "bold",
                                            fontSize: "16px",
                                            marginLeft: "8px",
                                            cursor: "pointer",
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            )
                        ))}
                        <button
                            onClick={() => {
                                const updatedFields = fields.map(f =>
                                    f.id === field.id
                                        ? { ...f, options: [...f.options, `Option ${f.options.length + 1}`] }
                                        : f
                                );
                                setFields(updatedFields);
                            }}
                            style={{
                                marginTop: "10px",
                                color: "#2563eb",
                                textDecoration: "underline",
                                background: "none",
                                border: "none"
                            }}
                        >
                            Add option
                        </button>
                    </>
                );
            case "Choice Matrix":
                return (
                    <div className="Matrix-grid-wrapper"
                        style={{
                            color: formAnswersColor,
                            backgroundColor: inputfieldBgColor,
                            fontFamily: selectedFont,
                        }}>
                        <table className="table Matrix-table text-center"
                            style={{
                                color: formAnswersColor,
                                backgroundColor: inputfieldBgColor,
                                fontFamily: selectedFont,
                            }}
                        >
                            <thead
                                style={{
                                    backgroundColor: inputfieldBgColor, // ensure thead matches table
                                }}>
                                <tr>
                                    <th style={{ backgroundColor: inputfieldBgColor }}></th>
                                    {(field.columns || []).map((col, colIdx) => (
                                        <th key={colIdx} className="hover-cell" style={{ backgroundColor: inputfieldBgColor }}>
                                            <input
                                                type="text"
                                                className="form-control text-center"
                                                value={col}
                                                onChange={(e) => {
                                                    const updatedFields = fields.map(f => {
                                                        if (f.id === field.id) {
                                                            const newCols = [...f.columns];
                                                            newCols[colIdx] = e.target.value;
                                                            return { ...f, columns: newCols };
                                                        }
                                                        return f;
                                                    });
                                                    setFields(updatedFields);
                                                }}
                                                placeholder={`Col ${colIdx + 1}`}
                                                style={{ fontFamily: selectedFont }}
                                            />
                                            <i
                                                className="fas fa-xmark choice-martix-delete-icon"
                                                onClick={() => {
                                                    const updatedFields = fields.map(f => {
                                                        if (f.id === field.id) {
                                                            const newCols = [...f.columns];
                                                            newCols.splice(colIdx, 1);

                                                            const newMatrix = (f.selectedMatrix || []).map(sel =>
                                                                sel === colIdx ? null : sel > colIdx ? sel - 1 : sel
                                                            );

                                                            return { ...f, columns: newCols, selectedMatrix: newMatrix };
                                                        }
                                                        return f;
                                                    });
                                                    setFields(updatedFields);
                                                }}
                                            ></i>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(field.rows || []).map((row, rowIdx) => (
                                    <tr key={rowIdx}>
                                        <td className="hover-cell" style={{ backgroundColor: inputfieldBgColor }}>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={row}
                                                onChange={(e) => {
                                                    const updatedFields = fields.map(f => {
                                                        if (f.id === field.id) {
                                                            const newRows = [...f.rows];
                                                            newRows[rowIdx] = e.target.value;
                                                            return { ...f, rows: newRows };
                                                        }
                                                        return f;
                                                    });
                                                    setFields(updatedFields);
                                                }}
                                                placeholder={`Row ${rowIdx + 1}`}
                                                style={{ fontFamily: selectedFont }}
                                            />
                                            <i
                                                className="fas fa-xmark choice-martix-delete-icon"
                                                onClick={() => {
                                                    const updatedFields = fields.map(f => {
                                                        if (f.id === field.id) {
                                                            const newRows = [...f.rows];
                                                            newRows.splice(rowIdx, 1);

                                                            const newMatrix = (f.selectedMatrix || []).filter((_, i) => i !== rowIdx);

                                                            return { ...f, rows: newRows, selectedMatrix: newMatrix };
                                                        }
                                                        return f;
                                                    });
                                                    setFields(updatedFields);
                                                }}
                                            ></i>
                                        </td>
                                        {field.columns.map((col, colIdx) => (
                                            <td key={colIdx} style={{ backgroundColor: inputfieldBgColor }}>
                                                <input
                                                    type="radio"
                                                    name={`Matrix_${field.id}_row_${rowIdx}`}
                                                    value={col}
                                                    checked={field.selectedMatrix?.[rowIdx] === colIdx}
                                                    onChange={() => {
                                                        const updatedFields = fields.map(f => {
                                                            if (f.id === field.id) {
                                                                const newMatrix = [...(f.selectedMatrix || [])];
                                                                newMatrix[rowIdx] = colIdx;
                                                                return { ...f, selectedMatrix: newMatrix };
                                                            }
                                                            return f;
                                                        });
                                                        setFields(updatedFields);
                                                    }}
                                                    className="form-check-input"
                                                    style={{
                                                        marginRight: "8px",
                                                        boxShadow: "none",
                                                        borderColor: (field.selectedMatrix?.[rowIdx] === colIdx) ? formPrimaryColor : "#ccc",
                                                        backgroundColor: (field.selectedMatrix?.[rowIdx] === colIdx) ? formPrimaryColor : "transparent",
                                                    }}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Add Row / Add Column Buttons */}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button
                                className="btn btn-sm btn-link"
                                onClick={() => {
                                    const updatedFields = fields.map(f =>
                                        f.id === field.id
                                            ? { ...f, rows: [...f.rows, `Row ${f.rows.length + 1}`] }
                                            : f
                                    );
                                    setFields(updatedFields);
                                }}
                            >
                                Add row
                            </button>
                            <button
                                className="btn btn-sm btn-link"
                                onClick={() => {
                                    const updatedFields = fields.map(f =>
                                        f.id === field.id
                                            ? { ...f, columns: [...f.columns, `Col ${f.columns.length + 1}`] }
                                            : f
                                    );
                                    setFields(updatedFields);
                                }}
                            >
                                Add column
                            </button>
                        </div>
                    </div>
                );
            case "Date Picker":
                return (
                    <input
                        type="date"
                        {...commonProps}
                        value={field.default_value || ""}
                        onChange={(e) => {
                            const updatedFields = fields.map(f =>
                                f.id === field.id ? { ...f, default_value: e.target.value } : f
                            );
                            setFields(updatedFields);
                        }}
                    />
                );
            case "Time Picker":
                return (
                    <input
                        type="time"
                        {...commonProps}
                        value={field.default_value || ""}
                        onChange={(e) => {
                            const updatedFields = fields.map(f =>
                                f.id === field.id ? { ...f, default_value: e.target.value } : f
                            );
                            setFields(updatedFields);
                        }}
                    />
                );
            case "Date Time Picker":
                return (
                    <input
                        type="datetime-local"
                        {...commonProps}
                        value={field.default_value || ""}
                        onChange={(e) => {
                            const updatedFields = fields.map(f =>
                                f.id === field.id ? { ...f, default_value: e.target.value } : f
                            );
                            setFields(updatedFields);
                        }}
                    />
                );
            case "Date Range":
                return (
                    <div className="d-flex gap-2">
                        <input type="date"  {...commonProps} className="form-control" placeholder="From" />
                        <input type="date"  {...commonProps} className="form-control" placeholder="To" />
                    </div>
                );
            case "Long Answer":
                return <textarea {...commonProps}></textarea>;
            case "Document Type":
                return (
                    <input
                        type="file"
                        {...commonProps}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,image/*"
                        className="form-control-file"
                    />
                );
            case "Ranking":
                return (
                    <DragDropContext
                        onDragEnd={(result) => {
                            if (!result.destination) return;

                            const reordered = reorder(
                                field.options,
                                result.source.index,
                                result.destination.index
                            );

                            const updatedFields = fields.map(f =>
                                f.id === field.id ? { ...f, options: reordered } : f
                            );
                            setFields(updatedFields);
                        }}
                    >
                        <Droppable droppableId={`ranking-${field.id}`}>
                            {(provided) => (
                                <div>
                                    <ol
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="ranking-list"
                                    >
                                        {field.options.map((opt, idx) => (
                                            <Draggable
                                                key={idx}
                                                draggableId={`ranking-${field.id}-option-${idx}`}
                                                index={idx}
                                            >
                                                {(provided) => (
                                                    <li
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        className="ranking-item d-flex align-items-center"
                                                        style={{
                                                            gap: "10px",
                                                            padding: "8px",
                                                            border: "1px solid #ddd",
                                                            borderRadius: "5px",
                                                            marginBottom: "6px",
                                                            ...provided.draggableProps.style
                                                        }}
                                                    >
                                                        {/* Ranking number */}
                                                        <span style={{ width: "20px", textAlign: "center" }}>{idx + 1}</span>

                                                        {/* Editable input */}
                                                        <input
                                                            type="text"
                                                            {...commonProps}
                                                            value={opt.option_text}
                                                            onChange={(e) => {
                                                                const updatedOptions = [...field.options];
                                                                updatedOptions[idx] = { option_text: e.target.value };

                                                                const updatedFields = fields.map(f =>
                                                                    f.id === field.id ? { ...f, options: updatedOptions } : f
                                                                );
                                                                setFields(updatedFields);
                                                            }}
                                                            onFocus={() => setFocusedOptionId(idx)} // Focus on this specific option
                                                            onBlur={() => setFocusedOptionId(null)} // Reset focus
                                                            style={{
                                                                flex: 1,
                                                                width: field.halfWidth ? "50%" : "100%",
                                                                color: formAnswersColor,
                                                                backgroundColor: inputfieldBgColor,
                                                                boxShadow: "none",
                                                                border: `1px solid ${focusedOptionId === idx
                                                                    ? formPrimaryColor
                                                                    : "rgba(75, 85, 99, 0.2)"}`,
                                                                fontFamily: selectedFont
                                                            }}
                                                        />

                                                        {/* Drag handle */}
                                                        <span
                                                            {...provided.dragHandleProps}
                                                            style={{ cursor: "grab", color: "gray" }}
                                                        >
                                                            <i className="fas fa-grip-vertical"></i>
                                                        </span>

                                                        {/* Delete option */}
                                                        <span
                                                            style={{ color: "red", cursor: "pointer" }}
                                                            onClick={() => {
                                                                const updatedOptions = [...field.options];
                                                                updatedOptions.splice(idx, 1);
                                                                const updatedFields = fields.map(f =>
                                                                    f.id === field.id ? { ...f, options: updatedOptions } : f
                                                                );
                                                                setFields(updatedFields);
                                                            }}
                                                        >
                                                            <i className="fas fa-trash-alt"></i>
                                                        </span>
                                                    </li>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </ol>

                                    {/* Add Option Button */}
                                    <button
                                        onClick={() => {
                                            const updatedFields = fields.map(f =>
                                                f.id === field.id
                                                    ? {
                                                        ...f,
                                                        options: [...f.options, { option_text: `Option ${f.options.length + 1}` }]
                                                    }
                                                    : f
                                            );
                                            setFields(updatedFields);
                                        }}
                                        style={{
                                            marginTop: "10px",
                                            color: "#2563eb",
                                            textDecoration: "underline",
                                            background: "none",
                                            border: "none",
                                        }}
                                    >
                                        Add option
                                    </button>
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                );
            case "Star Rating":
                return (
                    <div>
                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "4px",
                                maxWidth: "400px", // 15 stars * 26px per star (adjust if needed)
                            }}
                            onMouseLeave={() => setHovered(null)}
                        >
                            {[...Array(field.max_value || 5)].map((_, i) => (
                                <span
                                    key={i}
                                    style={{
                                        fontSize: "24px",
                                        color:
                                            hovered != null
                                                ? i <= hovered
                                                    ? formPrimaryColor
                                                    : "#ccc"
                                                : i < field.value
                                                    ? formPrimaryColor
                                                    : "#ccc",
                                        cursor: "pointer",
                                        transition: "color 0.2s",
                                        width: "24px",
                                        textAlign: "center"
                                    }}
                                    onClick={() => {
                                        const newValue = field.value === i + 1 ? 0 : i + 1;
                                        const updatedFields = fields.map(f =>
                                            f.id === field.id ? { ...f, value: newValue } : f
                                        );
                                        setFields(updatedFields);
                                    }}
                                    onMouseEnter={() => setHovered(i)}
                                >
                                    <FaStar />
                                </span>
                            ))}
                        </div>
                    </div>
                );
            case "Slider":
                const currentValue = field.value ?? field.min_value;
                const percentage = ((currentValue - field.min_value) / (field.max_value - field.min_value)) * 100;

                const sliderStyle = {
                    background: `linear-gradient(to right, ${formPrimaryColor} 0%, ${formPrimaryColor} ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`
                };

                return (
                    <div style={{ width: "100%" }}>
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: "14px",
                            marginBottom: "4px"
                        }}>
                            <span></span>
                            <span style={{ color: "#6b7280" }}>{currentValue} / {field.max_value}</span>
                        </div>
                        <input
                            type="range"
                            min={field.min_value}
                            max={field.max_value}
                            value={currentValue}
                            className="custom-slider"
                            style={{
                                ...sliderStyle,
                                '--slider-thumb-border': formPrimaryColor
                            }}
                            onChange={(e) => {
                                const updatedFields = fields.map(f =>
                                    f.id === field.id ? { ...f, value: parseInt(e.target.value) } : f
                                );
                                setFields(updatedFields);
                            }}
                        />
                    </div>
                );
            case "Opinion Scale":
                return (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(40px, 1fr))",
                            gap: "8px",
                            maxWidth: "640px",
                        }}
                    >
                        {[...Array((field?.max_value ?? 10) - (field?.min_value ?? 1) + 1)].map((_, i) => {
                            const val = (field?.min_value ?? 1) + i;
                            return (
                                <label key={val} style={{ textAlign: "center" }}>
                                    <input
                                        type="radio"
                                        name={`opinion_${field.id}`}
                                        checked={field.value === val}
                                        onChange={() => {
                                            const updatedFields = fields.map(f =>
                                                f.id === field.id ? { ...f, value: val } : f
                                            );
                                            setFields(updatedFields);
                                        }}
                                        style={{ accentColor: formPrimaryColor }}
                                    />
                                    <div>{val}</div>
                                </label>
                            );
                        })}
                    </div>
                );
            case "Address":
                return (
                    <div className="address-field-wrapper">
                        <input
                            type="text"
                            className="form-control mb-2"
                            placeholder="Address"
                            value={field.address || ""}
                            onChange={(e) => {
                                const updatedFields = fields.map(f =>
                                    f.id === field.id ? { ...f, address: e.target.value } : f
                                );
                                setFields(updatedFields);
                            }}
                            onFocus={() => {
                                setFocusedFieldId(field.id);
                                setFocusedSubField("address");
                            }}
                            onBlur={() => setFocusedSubField(null)}
                            style={{
                                width: "100%",
                                color: formAnswersColor,
                                backgroundColor: inputfieldBgColor,
                                boxShadow: "none",
                                border: `1px solid ${focusedFieldId === field.id && focusedSubField === "address"
                                    ? formPrimaryColor
                                    : "rgba(75, 85, 99, 0.2)"
                                    }`,
                            }}
                        />

                        <div className="d-flex gap-2">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="City"
                                value={field.city || ""}
                                onChange={(e) => {
                                    const updatedFields = fields.map(f =>
                                        f.id === field.id ? { ...f, city: e.target.value } : f
                                    );
                                    setFields(updatedFields);
                                }}
                                onFocus={() => {
                                    setFocusedFieldId(field.id);
                                    setFocusedSubField("city");
                                }}
                                onBlur={() => setFocusedSubField(null)}
                                style={{
                                    color: formAnswersColor,
                                    backgroundColor: inputfieldBgColor,
                                    boxShadow: "none",
                                    border: `1px solid ${focusedFieldId === field.id && focusedSubField === "city"
                                        ? formPrimaryColor
                                        : "rgba(75, 85, 99, 0.2)"
                                        }`,
                                    fontFamily: selectedFont
                                }}
                            />
                            <input
                                type="text"
                                className="form-control"
                                placeholder="State"
                                value={field.state || ""}
                                onChange={(e) => {
                                    const updatedFields = fields.map(f =>
                                        f.id === field.id ? { ...f, state: e.target.value } : f
                                    );
                                    setFields(updatedFields);
                                }}
                                onFocus={() => {
                                    setFocusedFieldId(field.id);
                                    setFocusedSubField("state");
                                }}
                                onBlur={() => setFocusedSubField(null)}
                                style={{
                                    color: formAnswersColor,
                                    backgroundColor: inputfieldBgColor,
                                    boxShadow: "none",
                                    border: `1px solid ${focusedFieldId === field.id && focusedSubField === "state"
                                        ? formPrimaryColor
                                        : "rgba(75, 85, 99, 0.2)"
                                        }`,
                                    fontFamily: selectedFont
                                }}
                            />
                            <input
                                type="text"
                                className="form-control"
                                placeholder="ZIP / Postal code"
                                value={field.zip || ""}
                                onChange={(e) => {
                                    const updatedFields = fields.map(f =>
                                        f.id === field.id ? { ...f, zip: e.target.value } : f
                                    );
                                    setFields(updatedFields);
                                }}
                                onFocus={() => {
                                    setFocusedFieldId(field.id);
                                    setFocusedSubField("zip");
                                }}
                                onBlur={() => setFocusedSubField(null)}
                                style={{
                                    color: formAnswersColor,
                                    backgroundColor: inputfieldBgColor,
                                    boxShadow: "none",
                                    border: `1px solid ${focusedFieldId === field.id && focusedSubField === "zip"
                                        ? formPrimaryColor
                                        : "rgba(75, 85, 99, 0.2)"
                                        }`,
                                    fontFamily: selectedFont
                                }}
                            />
                        </div>
                    </div>
                );
            case "Picture":
                return (
                    <div>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(3, 1fr)",
                                gap: "12px"
                            }}
                        >
                            {field.options.map((opt, idx) => (
                                <div
                                    key={opt.id}
                                    style={{
                                        border: "1px solid #ddd",
                                        borderRadius: "8px",
                                        padding: "8px",
                                        position: "relative",
                                        fontFamily: selectedFont
                                    }}
                                    onMouseEnter={() => setHoveredOption(idx)}
                                    onMouseLeave={() => setHoveredOption(null)}
                                >
                                    {/* Close Icon */}
                                    <button
                                        onClick={() => {
                                            const updatedFields = fields.map(f =>
                                                f.id === field.id
                                                    ? {
                                                        ...f,
                                                        options: f.options.filter((_, i) => i !== idx)
                                                    }
                                                    : f
                                            );
                                            setFields(updatedFields);
                                        }}
                                        style={{
                                            position: "absolute",
                                            top: "-10px",
                                            right: "-10px",
                                            background: "rgb(107 114 128)",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "50%",
                                            width: "24px",
                                            height: "24px",
                                            display: hoveredOption === idx ? "flex" : "none",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            cursor: "pointer",
                                            zIndex: 10
                                        }}
                                    >
                                        <FaTimes size={14} />
                                    </button>

                                    <div
                                        style={{
                                            width: "100%",
                                            height: "100px",
                                            backgroundColor: opt.image_path ? "transparent" : pictureBgColors[idx % pictureBgColors.length],
                                            backgroundImage: opt.image_path
                                                ? opt.image_path.startsWith("data:")
                                                    ? `url(${opt.image_path})` // It's a base64 image from modal
                                                    : `url(${API_BASE}/${opt.image_path.replace(/\\/g, "/")})` // It's a saved image from DB
                                                : undefined,
                                            backgroundSize: "cover",
                                            backgroundPosition: "center",
                                            borderRadius: "4px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center"
                                        }}
                                    >
                                        <button
                                            onClick={() => setEditImageOption({ fieldId: field.id, index: idx })}
                                            style={{
                                                background: "rgba(0,0,0,0.5)",
                                                color: "white",
                                                border: "none",
                                                padding: "6px 12px",
                                                borderRadius: "4px",
                                                cursor: "pointer"
                                            }}
                                        >
                                            ✎ Edit
                                        </button>
                                    </div>
                                    <div style={{ textAlign: "center", marginTop: "8px" }}>
                                        <input
                                            type="radio"
                                            className="form-check-input"
                                            name={`pic_${field.id}`}
                                            id={`bubble-radio-${field.id}-${idx}`}
                                            checked={field.selectedOption === idx}
                                            onChange={() => {
                                                const updatedFields = fields.map(f =>
                                                    f.id === field.id ? { ...f, selectedOption: idx } : f
                                                );
                                                setFields(updatedFields);
                                            }}
                                            style={{
                                                marginRight: "8px",
                                                boxShadow: "none",
                                                borderColor: field.selectedOption === idx ? formPrimaryColor : "#ccc",
                                                backgroundColor: field.selectedOption === idx ? formPrimaryColor : "transparent",
                                            }}
                                        />
                                        <span style={{ marginLeft: "6px", color: formAnswersColor }}>{opt.option_text}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => {
                                const updatedFields = fields.map(f =>
                                    f.id === field.id
                                        ? {
                                            ...f,
                                            options: [...f.options, { id: Date.now(), option_text: `Option ${f.options.length + 1}`, image_path: null }]
                                        }
                                        : f
                                );
                                setFields(updatedFields);
                            }}
                            style={{
                                marginTop: "10px",
                                color: "#2563eb",
                                textDecoration: "underline",
                                background: "none",
                                border: "none"
                            }}
                        >
                            Add option
                        </button>
                    </div>
                );
            case "Divider":
                return (
                    <div style={{ position: "relative", margin: "20px 0", textAlign: "center" }}>
                        <div style={{
                            borderTop: "1px solid lightgray",
                            position: "relative",
                            height: "1px"
                        }}></div>
                        {field.label && (
                            <span style={{
                                position: "absolute",
                                top: "-0.6em",
                                left: "50%",
                                transform: "translateX(-50%)",
                                backgroundColor: "#fff", // or your form bg color
                                padding: "0 5px",
                                fontSize: "0.9rem",
                                color: "#666"
                            }}>
                                {field.label}
                            </span>
                        )}
                    </div>
                );
            case "Image":
                const imageUrl =
                    field.file instanceof File
                        ? URL.createObjectURL(field.file)
                        : field.uploads?.[0]?.file_path
                            ? `${API_BASE}/${field.uploads[0].file_path.replace(/\\/g, "/")}`
                            : null;

                const alignment = field.alignment || field.uploads?.[0]?.file_field_Alignment || "center";
                const previewSize = field.previewSize || field.uploads?.[0]?.file_field_size || 300;

                return (
                    <div className="media-preview-wrapper" style={{ textAlign: alignment }}>
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt="Uploaded"
                                style={{
                                    width: `${previewSize}px`,
                                    maxHeight: `${previewSize}px`,
                                    objectFit: "contain",
                                    borderRadius: "8px",
                                    boxShadow: "none"
                                }}
                            />
                        ) : (
                            <div className="media-upload-placeholder">No image uploaded</div>
                        )}

                        <input
                            type="file"
                            accept="image/*"
                            {...commonProps}
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file && file.size > 1 * 1024 * 1024) {
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'File Too Large',
                                        text: 'Please select a file smaller than 1MB.',
                                    });
                                    return;
                                }

                                if (file) {
                                    const updatedFields = fields.map(f =>
                                        f.id === field.id
                                            ? { ...f, file, previewSize: previewSize }
                                            : f
                                    );
                                    setFields(updatedFields);
                                }
                            }}
                            className="form-control mt-2"
                        />
                    </div>
                );
            case "PDF":
                const pdfUrl =
                    field.file instanceof File
                        ? URL.createObjectURL(field.file)
                        : field.uploads?.[0]?.file_path
                            ? `${API_BASE}/${field.uploads[0].file_path.replace(/\\/g, "/")}`
                            : null;

                const pdfAlignment = field.alignment || field.uploads?.[0]?.file_field_Alignment || "center";
                const pdfPreviewSize = field.previewSize || field.uploads?.[0]?.file_field_size || 300;

                return (
                    <div className="media-preview-wrapper" style={{ textAlign: pdfAlignment }}>
                        {pdfUrl ? (
                            <embed
                                src={pdfUrl}
                                type="application/pdf"
                                width={`${pdfPreviewSize}px`}
                                height={`${pdfPreviewSize * 1.2}px`}
                                style={{
                                    border: "1px solid #ccc",
                                    borderRadius: "8px"
                                }}
                            />
                        ) : (
                            <div className="media-upload-placeholder">No PDF uploaded</div>
                        )}

                        <input
                            type="file"
                            accept="application/pdf"
                            {...commonProps}
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file && file.size > 1 * 1024 * 1024) {
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'File Too Large',
                                        text: 'Please select a file smaller than 1MB.',
                                    });
                                    return;
                                }

                                if (file) {
                                    const updatedFields = fields.map(f =>
                                        f.id === field.id
                                            ? { ...f, file, previewSize: pdfPreviewSize }
                                            : f
                                    );
                                    setFields(updatedFields);
                                }
                            }}
                            className="form-control mt-2"
                        />
                    </div>
                );
            case "Video":
                const videoUrl = field.youtubeUrl || "";
                const videoPreviewSize = field.previewSize || 250;

                return (
                    <div className="media-preview-wrapper">
                        {videoUrl ? (
                            <iframe
                                width={`${videoPreviewSize}`}
                                height={`${videoPreviewSize * 0.6}`}
                                src={`https://www.youtube.com/embed/${getYouTubeVideoId(videoUrl)}`}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                style={{ borderRadius: "8px" }}
                            />
                        ) : (
                            <div className="media-upload-placeholder">No YouTube URL Provided</div>
                        )}
                    </div>
                );
            case 'ThankYou':
                return (
                    <div
                        className="thank-you-container"
                        style={{
                            padding: "2rem",
                            margin: "2rem auto",
                            textAlign: "center",
                            fontFamily: selectedFont,
                            color: formAnswersColor,
                            borderRadius: "10px"
                        }}
                    >
                        {!field.hideIcon && (
                            <div style={{
                                fontSize: "1.5rem",
                                width: "50px",
                                height: "50px",
                                borderRadius: "50%",
                                backgroundColor: "rgba(147, 197, 253, 0.3)",
                                color: formPrimaryColor,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                margin: "0 auto 1rem auto"
                            }}>
                                <i className="fa-solid fa-check"></i>
                            </div>
                        )}

                        <input
                            type="text"
                            className="form-control mb-2"
                            placeholder="Thank You"
                            value={field.thankyou_heading}
                            onChange={(e) => {
                                const updatedFields = fields.map(f =>
                                    f.id === field.id ? { ...f, thankyou_heading: e.target.value } : f
                                );
                                setFields(updatedFields);
                            }}
                            onFocus={() => {
                                setFocusedFieldId(field.id);
                                setFocusedSubField("thankyou_heading");
                            }}
                            onBlur={() => setFocusedSubField(null)}
                            style={{
                                textAlign: "center",
                                fontWeight: "bold",
                                fontSize: "1.5rem",
                                color: formAnswersColor,
                                border: "none",
                                background: "transparent",
                                outline: "none"
                            }}
                        />

                        <textarea
                            className="form-control"
                            placeholder="Made with dForms, the easy way to make stunning forms"
                            value={field.thankyou_subtext || "Made with dForms, the easy way to make stunning forms"}
                            onChange={(e) => {
                                const updatedFields = fields.map(f =>
                                    f.id === field.id ? { ...f, thankyou_subtext: e.target.value } : f
                                );
                                setFields(updatedFields);
                            }}
                            onFocus={() => {
                                setFocusedFieldId(field.id);
                                setFocusedSubField("thankyou_subtext");
                            }}
                            onBlur={() => setFocusedSubField(null)}
                            style={{
                                textAlign: "center",
                                fontSize: "0.9rem",
                                marginBottom: "1rem",
                                color: "rgb(155, 160, 168)",
                                border: "none",
                                background: "transparent",
                                resize: "none",
                                outline: "none",
                            }}
                        />

                        <button
                            style={{
                                background: inputfieldBgColor,
                                color: formAnswersColor,
                                padding: "0.5rem 1rem",
                                border: "1px solid #e0e0e0",
                                cursor: "pointer",
                                fontFamily: selectedFont,
                                boxShadow: "0 4px 10px rgba(0, 0, 0, 0.05)",
                                transition: "all 0.3s ease",
                                paddingTop: "5px"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = "0 6px 14px rgba(0, 0, 0, 0.1)";
                                e.currentTarget.style.border = `1px solid ${formPrimaryColor}`;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.05)";
                                e.currentTarget.style.border = "1px solid #e0e0e0";
                            }}
                        >
                            Make your own <span style={{ fontWeight: "900", fontSize: "1.3rem" }}>dForms</span>
                        </button>
                    </div>
                );
            case "Submit":
                const submitAlignment = field.btnalignment || "left";
                let submitAlignmentStyle = {};
                if (submitAlignment === "center") {
                    submitAlignmentStyle = { margin: "0 auto", display: "block" };
                } else if (submitAlignment === "right") {
                    submitAlignmentStyle = { marginLeft: "auto", display: "block" };
                } else {
                    submitAlignmentStyle = { display: "inline-block" };
                }

                return (
                    <button
                        type="submit"
                        className="btn"
                        style={{
                            padding: "6px 12px",
                            fontSize: "1.2rem",
                            fontFamily: selectedFont,
                            backgroundColor: field.btnbgColor || formPrimaryColor,
                            color: field.btnlabelColor || "#ffffff",
                            border: focusedFieldId === field.id ? "2px solid #007bff" : "1px solid lightgray",
                            borderRadius: "5px",
                            ...submitAlignmentStyle
                        }}
                        onFocus={() => setFocusedFieldId(field.id)}
                        onBlur={() => setFocusedFieldId(null)}
                    >
                        {field.label || "Submit"}
                    </button>
                );
            case "Next":
                const nextAlignment = field.btnalignment || "left";
                let nextAlignmentStyle = {};
                if (nextAlignment === "center") {
                    nextAlignmentStyle = { margin: "0 auto", display: "block" };
                } else if (nextAlignment === "right") {
                    nextAlignmentStyle = { marginLeft: "auto", display: "block" };
                } else {
                    nextAlignmentStyle = { display: "inline-block" };
                }

                return (
                    <button
                        type="button"
                        className="btn"
                        style={{
                            padding: "6px 12px",
                            fontSize: "1.2rem",
                            fontFamily: selectedFont,
                            backgroundColor: field.btnbgColor || formPrimaryColor,
                            color: field.btnlabelColor || "#ffffff",
                            border: focusedFieldId === field.id ? "2px solid #6c757d" : "1px solid lightgray",
                            borderRadius: "5px",
                            ...nextAlignmentStyle
                        }}
                        onFocus={() => setFocusedFieldId(field.id)}
                        onBlur={() => setFocusedFieldId(null)}
                    >
                        {field.label}
                        <i className="fa-solid fa-arrow-right ms-2"></i>
                    </button>
                );
            default:
                return <input type="text" {...commonProps} />;
        }
    };

    const handleSubmit = async () => {
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

        const responsesObject = {};

        Object.entries(responses).forEach(([key, value]) => {
            if (value instanceof File) {
                formData.append("document", value);
                responsesObject[key] = "file_attached";
            } else {
                responsesObject[key] = value;
            }
        });

        formData.append("responses", JSON.stringify(responsesObject));

        try {
            const response = await fetch("/api/published_form/submit-form", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Form submission failed");
            }

            Swal.fire("Success!", "Form submitted successfully!", "success");

            // Clear input fields
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
        } catch (error) {
            Swal.fire("Error", "Failed to submit form.", "error");
            console.error("Submit Error:", error);
        }
    };

    if (!form) return <p>Loading...</p>;

    return (
        <div className="Published-form-container">
            <div
                className="Published-form-body"
                style={{ backgroundColor: form.background_color }}
            >
                <div
                    className="Published-form-content"
                    style={{ backgroundColor: form.questions_background_color }}
                >
                    {fields.map((field) => (
                        <div
                            key={field.id}
                            style={{
                                marginBottom: "1rem",
                                padding: "0.5rem",
                                borderRadius: "6px"
                            }}
                        >
                            {/* Render label, required asterisk, and caption (only for applicable fields) */}
                            {!["Heading", "Banner", "Divider", "Image", "Video", "PDF", "ThankYou", "Next", "Submit"].includes(field.type) && (
                                <>
                                    <label
                                        style={{
                                            fontSize: "1rem",
                                            border: "none",
                                            background: "transparent",
                                            width: "fit-content",
                                            marginBottom: "2px",
                                            color: formQuestionColor,
                                            fontFamily: selectedFont
                                        }}
                                    >
                                        {field.label}
                                        {field.required === "Yes" && <span style={{ color: "red" }}>*</span>}
                                    </label>
                                    {field.caption && (
                                        <small
                                            style={{
                                                color: "gray",
                                                display: "block",
                                                marginBottom: "6px",
                                                fontFamily: form.selected_font || 'inherit'
                                            }}
                                        >
                                            {field.caption}
                                        </small>
                                    )}
                                </>
                            )}

                            {renderField(field)}
                        </div>
                    ))}
                </div>
            </div>
        </div >
    );

};

export default PublishedForm;
