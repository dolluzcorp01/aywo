import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch, API_BASE } from "./utils/api";
import Swal from "sweetalert2";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import Select from 'react-select';
import { FaStar } from "react-icons/fa";
import confetti from 'canvas-confetti';
import "./PublishedForm.css";

const PublishedForm = () => {
    const [form, setForm] = useState(null);
    const [formPages, setFormPages] = useState([]);
    const [fields, setFields] = useState([]);
    const [responses, setResponses] = useState({});
    const location = useLocation();
    const navigate = useNavigate();

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
    const [formbgImage, setFormbgImage] = useState(null);

    const match = location.pathname.match(/\/forms\/form-(\d+)\/page-(\w+)/);
    const formId = match ? match[1] : null;
    const pageId = match ? match[2] : null;

    const [formLoaded, setFormLoaded] = useState(false);

    useEffect(() => {
        const fetchPublishedForm = async () => {
            try {
                const response = await apiFetch(`/api/published_form/get-published-form/${formId}/${pageId}?mode=published`,
                    { method: 'GET' }
                );

                if (!response.ok) throw new Error("Failed to fetch form");

                const data = await response.json();
                if (data.form.background_image) {
                    setFormbgImage(`${API_BASE}/${data.form.background_image.replace(/\\/g, "/")}`);
                }
                setFormBgColor(data.form.background_color || "#f8f9fa");
                setformColor(data.form.questions_background_color || "#fff");
                setformPrimaryColor(data.form.primary_color || "#3b82f6");
                setformQuestionColor(data.form.questions_color || "black");
                setformAnswersColor(data.form.answers_color || "rgb(55, 65, 81)");

                document.documentElement.style.setProperty('--form-primary-color', data.form.primary_color);

                setColors({
                    background: data.form.background_color || "#f8f9fa",
                    questionsBackground: data.form.questions_background_color || "#fff",
                    primary: data.form.primary_color || "#3b82f6",
                    questions: data.form.questions_color || "#333333",
                    answers: data.form.answers_color || "#000000",
                });

                setForm(data.form);
                const processedFields = data.fields.map((field) => {
                    const normalizedRequired = field.required === "Yes" || field.required === true;

                    if (field.type === "Heading") {
                        return {
                            ...field,
                            required: normalizedRequired,
                            alignment: field.heading_alignment || "center" // 👈 map DB field to frontend field.alignment
                        };
                    }

                    if (field.type === "Choice Matrix" && Array.isArray(field.matrix)) {
                        const rows = field.matrix
                            .filter(m => m.row_label !== null)
                            .map(m => m.row_label);
                        const columns = field.matrix
                            .filter(m => m.column_label !== null)
                            .map(m => m.column_label);

                        return {
                            ...field,
                            required: normalizedRequired,
                            rows,
                            columns,
                            selectedMatrix: []
                        };
                    }

                    if (field.type === "Multiple Choice") {
                        const hasBubbleStyle = field.options?.some(opt => opt.options_style === "bubble");
                        return {
                            ...field,
                            required: normalizedRequired,
                            bubble: hasBubbleStyle,
                            selectedOption: null
                        };
                    }

                    if (field.type === "YouTubeVideo" && Array.isArray(field.uploads) && field.uploads.length > 0) {
                        return {
                            ...field,
                            required: normalizedRequired,
                            previewSize: field.uploads[0].file_field_size || "",
                            youtubeUrl: field.uploads[0].youtube_url || "",
                        };
                    }

                    return {
                        ...field,
                        required: normalizedRequired
                    };
                });

                setFields(processedFields);
                setFormLoaded(true);

            } catch (error) {
                Swal.fire("Error", "Form not found or unpublished.", "error");
            }
        };

        const fetchFormPages = async () => {
            try {
                const res = await fetch(`/api/form_builder/get-form-pages/${formId}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                const data = await res.json();
                if (res.ok) {
                    setFormPages(data.pages || []);
                } else {
                    Swal.fire("Error", data.error || "Unable to fetch pages", "error");
                }
            } catch (error) {
                console.error("❌ Error loading pages:", error);
            }
        };

        if (formId && pageId) {
            fetchPublishedForm();
            fetchFormPages();
        }
    }, [formId, pageId]);

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

    useEffect(() => {
        if (!formLoaded) return;

        const saved = localStorage.getItem(`form_${formId}_page_${pageId}`);
        if (saved) {
            const parsed = JSON.parse(saved);
            setResponses(parsed);

            // Optionally update field display values from localStorage too
            const updatedFields = fields.map(field => {
                const response = parsed[field.id];
                if (!response) return field;

                if (field.type === "Multiple Choice") {
                    const selectedIndex = field.options.findIndex(opt => {
                        const text = typeof opt === "object" ? opt.option_text : opt;
                        return text === response.value;
                    });
                    return { ...field, selectedOption: selectedIndex };
                }

                if (field.type === "Date Picker" || field.type === "Time Picker" || field.type === "Date Time Picker") {
                    return { ...field, default_value: response.value };
                }

                if (field.type === "Ranking") {
                    const savedRanking = response.value || []; // ["Option 2", "Option 1", "Option 3"]

                    const reorderedOptions = [];
                    const seen = new Set();

                    // Step 1: Place saved ranking in order
                    savedRanking.forEach(text => {
                        const match = field.options.find(opt => {
                            const label = typeof opt === "object" ? opt.option_text : opt;
                            return label === text;
                        });

                        if (match) {
                            reorderedOptions.push(match);
                            seen.add(text);
                        }
                    });

                    // Step 2: Add remaining options not in saved data (e.g., newly added ones)
                    const remainingOptions = field.options.filter(opt => {
                        const label = typeof opt === "object" ? opt.option_text : opt;
                        return !seen.has(label);
                    });

                    return {
                        ...field,
                        options: [...reorderedOptions, ...remainingOptions]
                    };
                }

                if (field.type === "Choice Matrix") {
                    const matrixValue = response.value || {};

                    const getText = (val) => typeof val === "object" ? val.option_text : val;

                    const selectedMatrix = (field.rows || []).map((rowItem) => {
                        const rowLabel = getText(rowItem).trim().toLowerCase();

                        const selectedColLabel = matrixValue[rowLabel];
                        const colIndex = (field.columns || []).findIndex(col => {
                            const colLabel = getText(col).trim().toLowerCase();
                            return colLabel === (selectedColLabel || "").trim().toLowerCase();
                        });

                        return colIndex >= 0 ? colIndex : null;
                    });

                    return { ...field, selectedMatrix };
                }

                if (field.type === "Checkbox") {
                    return { ...field, default_value: response.value };
                }

                if (typeof response.value === "string" || typeof response.value === "number") {
                    return { ...field, default_value: response.value };
                }

                return field;
            });

            setFields(updatedFields);
        }
    }, [formLoaded]);

    const handleFieldChange = (fieldId, fieldType, newValue) => {
        const updatedResponses = {
            ...responses,
            [fieldId]: {
                type: fieldType,
                value: newValue
            }
        };

        setResponses(updatedResponses);
        localStorage.setItem(`form_${formId}_page_${pageId}`, JSON.stringify(updatedResponses));
    };

    const renderField = (field) => {
        const commonProps = {
            className: "form-control",
            placeholder: field.placeholder || "",
            value: responses[field.id]?.value ?? field.default_value ?? "",
            style: {
                width: field.halfWidth ? "50%" : "100%",
                color: formAnswersColor,
                backgroundColor: inputfieldBgColor,
                boxShadow: "none",
                border: `1px solid ${focusedFieldId === field.id ? formPrimaryColor : "rgba(75, 85, 99, 0.2)"}`,
                fontFamily: selectedFont,
                fontSize: field.font_size || "16px",
            },
            onFocus: () => setFocusedFieldId(field.id),
            onBlur: () => setFocusedFieldId(null),
            onChange: (e) => {
                const updatedFields = fields.map(f =>
                    f.id === field.id ? { ...f, default_value: e.target.value } : f
                );
                setFields(updatedFields);
                handleFieldChange(field.id, field.type, e.target.value);
            }
        };

        switch (field.type) {
            case "text":
                return <input type="text" {...commonProps} />;
            case "Short Answer":
                return <input type="text" {...commonProps} />;
            case "Heading":
                const headingAlign = field.alignment || "center";

                return (
                    <div style={{ textAlign: headingAlign, border: "none", outline: "none", boxShadow: "none" }}>
                        <input
                            type="text"
                            value={field.label}
                            readOnly
                            onChange={(e) => {
                                const updatedFields = fields.map(f =>
                                    f.id === field.id ? { ...f, label: e.target.value } : f
                                );
                                setFields(updatedFields);
                            }}
                            style={{
                                fontSize: field.font_size || "24px",
                                fontWeight: "bold",
                                border: "none",
                                outline: "none",
                                background: "transparent",
                                width: "100%",
                                margin: "8px 0",
                                color: formAnswersColor,
                                fontFamily: selectedFont,
                                textAlign: headingAlign,
                                display: "block",
                            }}
                        />
                    </div>
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
                                readOnly
                                style={{
                                    fontWeight: "bold",
                                    color: style.textColor,
                                    border: "none",
                                    outline: "none",
                                    background: "transparent",
                                    width: "100%",
                                    fontSize: "18px",
                                    marginBottom: "8px",
                                    fontFamily: selectedFont
                                }}
                            />
                            <textarea
                                value={field.description || "Some description"}
                                readOnly
                                rows={4}
                                style={{
                                    color: style.textColor,
                                    width: "100%",
                                    resize: "vertical", // Allows the user to resize vertically
                                    minHeight: "80px",
                                    fontSize: "1rem",
                                    padding: "8px",
                                    border: "1px solid #ccc",
                                    outline: "none",
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
                                    f.id === field.id ? { ...f, default_value: value } : f
                                );
                                setFields(updatedFields);
                                handleFieldChange(field.id, field.type, value);
                            }
                        }}
                        value={responses[field.id]?.value ?? ""}  // ✅ fix here
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
                            checked={responses[field.id]?.value === "true"}
                            onChange={(e) => {
                                const isChecked = e.target.checked.toString(); // ✅ Get "true"/"false"
                                const updatedFields = fields.map(f =>
                                    f.id === field.id ? { ...f, default_value: isChecked } : f
                                );
                                setFields(updatedFields);
                                handleFieldChange(field.id, field.type, isChecked); // ✅ Pass correct value
                            }}
                            style={{ accentColor: formPrimaryColor }}
                        />
                    </div>
                );
            case "Multiple Select Checkboxes":
                return field.options.map((opt, idx) => (
                    <div key={idx} className="form-check">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            id={`checkbox-${field.id}-${idx}`}
                            name={`checkbox-${field.id}`}
                            checked={responses[field.id]?.value?.includes(opt.option_text) || false}
                            onChange={(e) => {
                                const isChecked = e.target.checked;
                                const prevSelections = responses[field.id]?.value || [];

                                let updatedSelections = [];
                                if (isChecked) {
                                    updatedSelections = [...prevSelections, opt.option_text];
                                } else {
                                    updatedSelections = prevSelections.filter(item => item !== opt.option_text);
                                }

                                setResponses(prev => ({
                                    ...prev,
                                    [field.id]: {
                                        type: field.type,
                                        value: updatedSelections
                                    }
                                }));

                                // 🔸 Store in localStorage
                                handleFieldChange(field.id, field.type, updatedSelections);
                            }}
                            style={{ accentColor: formPrimaryColor }}
                        />
                        <label
                            className="form-check-label"
                            style={{ color: formAnswersColor, fontFamily: selectedFont }}
                            htmlFor={`checkbox-${field.id}-${idx}`}
                        >
                            {opt.option_text}
                        </label>
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
                                const selectedValue = selectedOption ? selectedOption.value : "";
                                handleFieldChange(field.id, field.type, selectedValue);
                            }}
                            value={
                                responses[field.id]?.value
                                    ? optionsList.find(opt => opt.value === responses[field.id].value)
                                    : null
                            }
                            styles={{
                                control: (base) => ({
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
                            handleFieldChange(field.id, field.type, values);
                        }}
                        value={
                            Array.isArray(responses[field.id]?.value)
                                ? responses[field.id].value.map(val => ({
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
                const switchValue = responses[field.id]?.value === "true"; // convert string to boolean

                return (
                    <div className="form-check form-switch">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id={`switch-${field.id}`}
                            name={`switch-${field.id}`}
                            checked={switchValue}
                            onChange={(e) => {
                                const isChecked = e.target.checked.toString(); // "true" or "false"
                                handleFieldChange(field.id, field.type, isChecked);
                            }}
                            style={{
                                backgroundColor: switchValue ? formPrimaryColor : "",
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
                                        checked={
                                            responses[field.id]?.value ===
                                            (typeof opt === "object" ? opt.option_text : opt)
                                        }
                                        onChange={() => {
                                            const updatedFields = fields.map(f =>
                                                f.id === field.id ? { ...f, selectedOption: idx } : f
                                            );
                                            setFields(updatedFields);
                                            const selectedOption = field.options[idx];
                                            const optionText = typeof selectedOption === "object" ? selectedOption.option_text : selectedOption;
                                            handleFieldChange(field.id, field.type, optionText);
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
                                        checked={
                                            responses[field.id]?.value ===
                                            (typeof opt === "object" ? opt.option_text : opt)
                                        }
                                        onChange={() => {
                                            const updatedFields = fields.map(f =>
                                                f.id === field.id ? { ...f, selectedOption: idx } : f
                                            );
                                            setFields(updatedFields);

                                            const selectedOption = field.options[idx];
                                            const optionText = typeof selectedOption === "object" ? selectedOption.option_text : selectedOption;
                                            handleFieldChange(field.id, field.type, optionText);
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
                                                style={{ fontFamily: selectedFont, border: "none", outline: "none" }}
                                            />
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
                                                style={{ fontFamily: selectedFont, border: "none", outline: "none" }}
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
                                                        console.log("🔘 Radio changed:");
                                                        console.log("Row label:", row);
                                                        console.log("Col label:", col);
                                                        console.log("colIdx:", colIdx);

                                                        const updatedFields = fields.map(f => {
                                                            if (f.id === field.id) {
                                                                const newMatrix = [...(f.selectedMatrix || [])];
                                                                newMatrix[rowIdx] = colIdx;
                                                                return { ...f, selectedMatrix: newMatrix };
                                                            }
                                                            return f;
                                                        });

                                                        setFields(updatedFields);

                                                        const updatedMatrixValue = {
                                                            ...(responses[field.id]?.value || {}),
                                                            [row.trim().toLowerCase()]: (typeof col === "object" ? col.option_text : col).trim().toLowerCase()
                                                        };

                                                        console.log("⬆️ Saving updatedMatrixValue:", updatedMatrixValue);

                                                        handleFieldChange(field.id, field.type, updatedMatrixValue);
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
                    </div>
                );
            case "Date Picker":
                return (
                    <input
                        type="date"
                        className="form-control"
                        value={responses[field.id]?.value ?? field.default_value ?? ""}
                        style={{
                            width: field.halfWidth ? "50%" : "100%",
                            color: formAnswersColor,
                            backgroundColor: inputfieldBgColor,
                            boxShadow: "none",
                            border: `1px solid ${focusedFieldId === field.id ? formPrimaryColor : "rgba(75, 85, 99, 0.2)"}`,
                            fontFamily: selectedFont,
                            fontSize: field.font_size || "16px",
                        }}
                        onFocus={() => setFocusedFieldId(field.id)}
                        onBlur={() => setFocusedFieldId(null)}
                        onChange={(e) => {
                            const updatedFields = fields.map(f =>
                                f.id === field.id ? { ...f, default_value: e.target.value } : f
                            );
                            setFields(updatedFields);
                            handleFieldChange(field.id, field.type, e.target.value);
                        }}
                    />
                );
            case "Time Picker":
                return (
                    <input
                        type="time"
                        {...commonProps}
                        value={responses[field.id]?.value ?? field.default_value ?? ""}
                        onChange={(e) => {
                            const updatedFields = fields.map(f =>
                                f.id === field.id ? { ...f, default_value: e.target.value } : f
                            );
                            setFields(updatedFields);
                            handleFieldChange(field.id, field.type, e.target.value);
                        }}
                    />
                );
            case "Date Time Picker":
                return (
                    <input
                        type="datetime-local"
                        {...commonProps}
                        value={responses[field.id]?.value ?? field.default_value ?? ""}
                        onChange={(e) => {
                            const updatedFields = fields.map(f =>
                                f.id === field.id ? { ...f, default_value: e.target.value } : f
                            );
                            setFields(updatedFields);
                            handleFieldChange(field.id, field.type, e.target.value);
                        }}
                    />
                );
            case "Date Range":
                return (
                    <div className="d-flex gap-2">
                        <input
                            type="date"
                            {...commonProps}
                            placeholder="From"
                            value={responses[field.id]?.value?.from || ""}
                            onChange={(e) => {
                                const fromDate = e.target.value;
                                const current = responses[field.id]?.value || {};
                                const newValue = { ...current, from: fromDate };

                                setResponses(prev => ({
                                    ...prev,
                                    [field.id]: { type: field.type, value: newValue }
                                }));

                                const updatedFields = fields.map(f =>
                                    f.id === field.id
                                        ? { ...f, default_value: JSON.stringify(newValue) }
                                        : f
                                );
                                setFields(updatedFields);

                                handleFieldChange(field.id, field.type, newValue);
                            }}
                        />
                        <input
                            type="date"
                            {...commonProps}
                            placeholder="To"
                            value={responses[field.id]?.value?.to || ""}
                            onChange={(e) => {
                                const toDate = e.target.value;
                                const current = responses[field.id]?.value || {};
                                const newValue = { ...current, to: toDate };

                                setResponses(prev => ({
                                    ...prev,
                                    [field.id]: { type: field.type, value: newValue }
                                }));

                                const updatedFields = fields.map(f =>
                                    f.id === field.id
                                        ? { ...f, default_value: JSON.stringify(newValue) }
                                        : f
                                );
                                setFields(updatedFields);

                                handleFieldChange(field.id, field.type, newValue);
                            }}
                        />
                    </div>
                );
            case "Long Answer":
                return <textarea {...commonProps}></textarea>;
            case "Document Type":
                return (
                    <div>
                        <input
                            type="file"
                            className="form-control"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,image/*"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    if (file.size > 1 * 1024 * 1024) {
                                        Swal.fire({
                                            icon: 'error',
                                            title: 'File Too Large',
                                            text: 'Please select a file smaller than 1MB.',
                                        });
                                        return;
                                    }

                                    // ❗ Save only to in-memory state
                                    setResponses(prev => ({
                                        ...prev,
                                        [field.id]: {
                                            type: field.type,
                                            value: file
                                        }
                                    }));

                                    // ✅ Save minimal metadata in localStorage
                                    const localCopy = {
                                        name: file.name,
                                        type: file.type,
                                        size: file.size
                                    };

                                    const existing = JSON.parse(localStorage.getItem(`form_${formId}_page_${pageId}`) || '{}');
                                    localStorage.setItem(`form_${formId}_page_${pageId}`, JSON.stringify({
                                        ...existing,
                                        [field.id]: {
                                            type: field.type,
                                            value: localCopy
                                        }
                                    }));
                                }
                            }}
                        />

                        {responses[field.id]?.value && (
                            <small className="mt-1" style={{ color: formQuestionColor }}>
                                Selected: {responses[field.id].value.name}
                            </small>
                        )}
                    </div>
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

                            const rankedValues = reordered.map(opt => opt.option_text);
                            handleFieldChange(field.id, field.type, rankedValues);
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
                                                key={`rank-${field.id}-opt-${opt.id}`}
                                                draggableId={`rank-${field.id}-opt-${opt.id}`}
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
                                                            ...provided.draggableProps.style,
                                                        }}
                                                    >
                                                        {/* Rank number */}
                                                        <span style={{ width: "20px", textAlign: "center" }}>{idx + 1}</span>

                                                        {/* Option text (read-only during fill mode) */}
                                                        <input
                                                            type="text"
                                                            {...commonProps}
                                                            value={opt.option_text}
                                                            readOnly // Make editable only in edit mode
                                                            style={{
                                                                flex: 1,
                                                                width: field.halfWidth ? "50%" : "100%",
                                                                color: formAnswersColor,
                                                                backgroundColor: inputfieldBgColor,
                                                                boxShadow: "none",
                                                                border: `1px solid ${focusedOptionId === idx
                                                                    ? formPrimaryColor
                                                                    : "rgba(75, 85, 99, 0.2)"
                                                                    }`,
                                                                fontFamily: selectedFont,
                                                            }}
                                                        />

                                                        {/* Drag handle */}
                                                        <span
                                                            {...provided.dragHandleProps}
                                                            style={{ cursor: "grab", color: "gray" }}
                                                        >
                                                            <i className="fas fa-grip-vertical"></i>
                                                        </span>
                                                    </li>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </ol>
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
                                maxWidth: "400px",
                            }}
                            onMouseLeave={() => setHovered(null)}
                        >
                            {[...Array(field.max_value || 5)].map((_, i) => {
                                const isActive = hovered != null
                                    ? i <= hovered
                                    : i < (responses[field.id]?.value || 0);

                                return (
                                    <span
                                        key={i}
                                        style={{
                                            fontSize: "24px",
                                            color: isActive ? formPrimaryColor : "#ccc",
                                            cursor: "pointer",
                                            transition: "color 0.2s",
                                            width: "24px",
                                            textAlign: "center"
                                        }}
                                        onClick={() => {
                                            const newValue = responses[field.id]?.value === i + 1 ? 0 : i + 1;

                                            // Save selected star rating
                                            handleFieldChange(field.id, field.type, newValue);
                                        }}
                                        onMouseEnter={() => setHovered(i)}
                                    >
                                        <FaStar />
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                );
            case "Slider":
                const min = field.min_value ?? 0;
                const max = field.max_value ?? 100;
                const currentValue = responses[field.id]?.value ?? min;

                const percentage = ((currentValue - min) / (max - min)) * 100;

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
                            <span style={{ color: "#6b7280" }}>{currentValue} / {max}</span>
                        </div>
                        <input
                            type="range"
                            min={min}
                            max={max}
                            value={currentValue}
                            className="custom-slider"
                            style={{
                                ...sliderStyle,
                                '--slider-thumb-border': formPrimaryColor
                            }}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);

                                // ✅ Use central handler to save to state + localStorage
                                handleFieldChange(field.id, field.type, val);
                            }}
                        />
                    </div>
                );
            case "Opinion Scale":
                const selectedValue = responses[field.id]?.value ?? field.value ?? field.default_value ?? null;

                return (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(40px, 1fr))",
                            gap: "8px",
                            maxWidth: "640px",
                            color: formQuestionColor
                        }}
                    >
                        {[...Array((field?.max_value ?? 10) - (field?.min_value ?? 1) + 1)].map((_, i) => {
                            const val = (field?.min_value ?? 1) + i;
                            return (
                                <label key={val} style={{ textAlign: "center" }}>
                                    <input
                                        type="radio"
                                        name={`opinion_${field.id}`}
                                        checked={selectedValue === val}
                                        onChange={() => {
                                            const updatedFields = fields.map(f =>
                                                f.id === field.id ? { ...f, value: val } : f
                                            );
                                            setFields(updatedFields);
                                            handleFieldChange(field.id, field.type, val);
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
                        {/* Address */}
                        <input
                            type="text"
                            className="form-control mb-2"
                            placeholder="Address"
                            value={responses[field.id]?.value?.address || ""}
                            onChange={(e) => {
                                const updated = {
                                    ...responses[field.id]?.value,
                                    address: e.target.value,
                                };
                                handleFieldChange(field.id, field.type, updated);
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

                        {/* City, State, Zip */}
                        <div className="d-flex gap-2">
                            {["city", "state", "zip"].map((subField) => (
                                <input
                                    key={subField}
                                    type="text"
                                    className="form-control"
                                    placeholder={
                                        subField === "zip"
                                            ? "ZIP / Postal code"
                                            : subField.charAt(0).toUpperCase() + subField.slice(1)
                                    }
                                    value={responses[field.id]?.value?.[subField] || ""}
                                    onChange={(e) => {
                                        const updated = {
                                            ...responses[field.id]?.value,
                                            [subField]: e.target.value,
                                        };
                                        handleFieldChange(field.id, field.type, updated);
                                    }}
                                    onFocus={() => {
                                        setFocusedFieldId(field.id);
                                        setFocusedSubField(subField);
                                    }}
                                    onBlur={() => setFocusedSubField(null)}
                                    style={{
                                        color: formAnswersColor,
                                        backgroundColor: inputfieldBgColor,
                                        boxShadow: "none",
                                        border: `1px solid ${focusedFieldId === field.id && focusedSubField === subField
                                            ? formPrimaryColor
                                            : "rgba(75, 85, 99, 0.2)"
                                            }`,
                                        fontFamily: selectedFont,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                );
            case "Picture":
                const selectedPicValue = responses[field.id]?.value ?? (
                    typeof field.selectedOption === "number" && field.options?.[field.selectedOption]
                        ? field.options[field.selectedOption]?.option_text
                        : ""
                );

                const selectedPicIndex = field.options.findIndex(opt =>
                    (typeof opt === "object" ? opt.option_text : opt) === selectedPicValue
                );

                return (
                    <div>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(3, 1fr)",
                                gap: "12px",
                            }}
                        >
                            {field.options.map((opt, idx) => (
                                <div
                                    key={opt.id || idx}
                                    style={{
                                        border: "1px solid #ddd",
                                        borderRadius: "8px",
                                        padding: "8px",
                                        position: "relative",
                                        fontFamily: selectedFont,
                                    }}
                                    onMouseEnter={() => setHoveredOption(idx)}
                                    onMouseLeave={() => setHoveredOption(null)}
                                >
                                    <div
                                        style={{
                                            width: "100%",
                                            height: "100px",
                                            backgroundColor: opt.image_path
                                                ? "transparent"
                                                : pictureBgColors[idx % pictureBgColors.length],
                                            backgroundImage: opt.image_path
                                                ? opt.image_path.startsWith("data:")
                                                    ? `url(${opt.image_path})`
                                                    : `url(${API_BASE}/${opt.image_path.replace(/\\/g, "/")})`
                                                : undefined,
                                            backgroundSize: "cover",
                                            backgroundPosition: "center",
                                            borderRadius: "4px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    ></div>

                                    <div style={{ textAlign: "center", marginTop: "8px" }}>
                                        <input
                                            type="radio"
                                            className="form-check-input"
                                            name={`pic_${field.id}`}
                                            id={`pic-radio-${field.id}-${idx}`}
                                            checked={selectedPicIndex === idx}
                                            onChange={() => {
                                                const updatedFields = fields.map(f =>
                                                    f.id === field.id
                                                        ? { ...f, selectedOption: idx }
                                                        : f
                                                );
                                                setFields(updatedFields);

                                                const optionText = typeof opt === "object" ? opt.option_text : opt;
                                                handleFieldChange(field.id, field.type, optionText);
                                            }}
                                            style={{
                                                marginRight: "8px",
                                                boxShadow: "none",
                                                borderColor: selectedPicIndex === idx ? formPrimaryColor : "#ccc",
                                                backgroundColor: selectedPicIndex === idx ? formPrimaryColor : "transparent",
                                            }}
                                        />
                                        <span style={{ marginLeft: "6px", color: formAnswersColor }}>
                                            {opt.option_text}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
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
                    </div>
                );
            case "Video":
                const videoUrl =
                    field.file instanceof File
                        ? URL.createObjectURL(field.file)
                        : field.uploads?.[0]?.file_path
                            ? `${API_BASE}/${field.uploads[0].file_path.replace(/\\/g, "/")}`
                            : null;

                const videoAlignment = field.alignment || field.uploads?.[0]?.file_field_Alignment || "center";
                const videoPreviewSize = field.previewSize || field.uploads?.[0]?.file_field_size || 300;

                return (
                    <div className="media-preview-wrapper" style={{ textAlign: videoAlignment }}>
                        {videoUrl ? (
                            <video
                                key={videoUrl}
                                controls
                                width={`${videoPreviewSize}px`}
                                style={{
                                    maxHeight: `${videoPreviewSize * 1.2}px`,
                                    borderRadius: "8px",
                                    boxShadow: "none",
                                    border: "1px solid #ccc"
                                }}
                            >
                                <source src={videoUrl} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        ) : (
                            <div className="media-upload-placeholder">No video uploaded</div>
                        )}
                    </div>
                );
            case "YouTubeVideo":
                const youTubevideoUrl = field.youtubeUrl || "";
                const youTubevideoPreviewSize = field.previewSize || 250;

                return (
                    <div className="media-preview-wrapper">
                        {youTubevideoUrl ? (
                            <iframe
                                width={`${youTubevideoPreviewSize}`}
                                height={`${youTubevideoPreviewSize * 0.6}`}
                                src={`https://www.youtube.com/embed/${getYouTubeVideoId(youTubevideoUrl)}`}
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
                            readOnly
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
                            readOnly
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
                            onClick={() => {
                                window.open('/login', '_blank');
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
                        onClick={handleSubmitForm}
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
                        onClick={handleNextPage}
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

    const handleSubmitForm = async () => {
        const allRequiredFields = fields.filter(f => f.required);
        const formData = new FormData();
        const updatedResponses = { ...responses };

        for (const field of allRequiredFields) {
            const value = responses[field.id];
            if (field.type === "Address") {
                if (
                    !value ||
                    !value.value?.address?.trim() ||
                    !value.value?.city?.trim() ||
                    !value.value?.state?.trim() ||
                    !value.value?.zip?.trim()
                ) {
                    Swal.fire("Missing Field", `Please fill out all parts of "${field.label}"`, "warning");
                    return;
                }
            } else if (field.type === "Choice Matrix") {
                const expectedRows = field.rows || [];
                const answeredRows = value ? Object.keys(value.value || {}) : [];
                const missingRow = expectedRows.find(row => !answeredRows.includes(row));

                if (missingRow) {
                    Swal.fire("Missing Field", `Please select an option for "${missingRow}" in "${field.label}"`, "warning");
                    return;
                }
            }

            // Basic required check
            if (!value || value.value === undefined || value.value === "") {
                Swal.fire("Missing Field", `Please fill out "${field.label}"`, "warning");
                return;
            }
        }

        // ✅ Loop again through all fields (not just required)
        for (const field of fields) {
            if (field.type === "Document Type") {
                const value = responses[field.id];
                const file = value?.value;

                if (file instanceof File) {
                    formData.append(`document_${field.id}`, file);
                    updatedResponses[field.id] = {
                        ...value,
                        value: "file_attached"
                    };
                }
            }
        }

        formData.append("form_id", formId);
        formData.append("responses", JSON.stringify(updatedResponses));

        try {
            const res = await fetch("/api/published_form/submit-form", {
                method: "POST",
                body: formData
            });

            const data = await res.json();
            if (res.ok) {
                confetti({
                    particleCount: 200,
                    spread: 200,
                    origin: { y: 0.6 }
                });
                Swal.fire("Form Submitted", "Your form has been submitted successfully!", "success");

                Object.keys(localStorage).forEach((key) => {
                    if (key.startsWith("form_")) {
                        localStorage.removeItem(key);
                    }
                });
                setResponses({});

                // 🔁 Redirect to end page
                const currentPath = window.location.pathname; // e.g. /forms/form-1/page-1
                const formMatch = currentPath.match(/\/forms\/(form-\d+)\//); // extract "form-1"
                if (formMatch && formMatch[1]) {
                    const formId = formMatch[1];
                    window.location.href = `/forms/${formId}/page-end`;
                }
            } else {
                Swal.fire("Error", data.error || "Submission failed.", "error");
            }
        }
        catch (error) {
            console.error("❌ Error submitting form:", error);
            Swal.fire("Error", "Something went wrong while submitting the form.", "error");
        }
    };

    const handleNextPage = () => {
        const currentPageFields = fields.filter(f => f.page_id === pageId);

        for (const field of currentPageFields) {
            const value = responses[field.id];

            if (field.type === "Address" && field.required) {
                if (
                    !value ||
                    !value.address?.trim() ||
                    !value.city?.trim() ||
                    !value.state?.trim() ||
                    !value.zip?.trim()
                ) {
                    Swal.fire("Missing Field", `Please fill out all parts of "${field.label}"`, "warning");
                    return;
                }
            }
            else if (field.type === "Choice Matrix" && field.required) {
                const expectedRows = field.rows || [];
                const answeredRows = value ? Object.keys(value) : [];
                const missingRow = expectedRows.find(row => !answeredRows.includes(row));

                if (missingRow) {
                    Swal.fire("Missing Field", `Please select an option for "${missingRow}" in "${field.label}"`, "warning");
                    return;
                }
            }

            if (field.required && !responses[field.id]) {
                Swal.fire("Missing Field", `Please fill out "${field.label}"`, "warning");
                return;
            }
        }

        const currentPageId = parseInt(pageId);
        const sortedPages = [...formPages].sort((a, b) => a.sort_order - b.sort_order);

        const currentIndex = sortedPages.findIndex(p => p.page_number === currentPageId);

        if (currentIndex !== -1 && currentIndex < sortedPages.length - 1) {
            const nextPage = sortedPages[currentIndex + 1];
            navigate(`/forms/form-${formId}/page-${nextPage.page_number}`);
        } else {
            console.log("This is the last page or page not found");
        }
    };

    const handleBackPage = () => {
        const currentPageId = parseInt(pageId);
        const sortedPages = [...formPages].sort((a, b) => a.sort_order - b.sort_order);

        const currentIndex = sortedPages.findIndex(p => p.page_number === currentPageId);

        if (currentIndex > 0) {
            const previousPage = sortedPages[currentIndex - 1];
            navigate(`/forms/form-${formId}/page-${previousPage.page_number}`);
        } else {
            console.log("This is the first page");
        }
    };

    if (!form) return <p>Loading...</p>;

    return (
        <div className="Published-form-container">
            {(() => {
                const sortedPages = [...formPages].sort((a, b) => a.sort_order - b.sort_order);
                const isFirstPage = sortedPages.findIndex(p => p.page_number === parseInt(pageId)) === 0;

                return !isFirstPage && (
                    <div
                        onClick={handleBackPage}
                        style={{
                            position: "absolute",
                            top: "10px",
                            left: "30px",
                            cursor: "pointer",
                            fontSize: "1.5rem",
                            zIndex: 10
                        }}
                    >
                        <i className="fa-solid fa-arrow-left" style={{ color: form.questions_background_color }}></i>
                    </div>
                );
            })()}

            <div
                className={`Published-form-body ${formbgImage ? "with-bg-image" : ""}`}
                style={{
                    backgroundColor: formBgColor,
                    backgroundImage: formbgImage ? `url(${formbgImage})` : "none"
                }}
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
                                        {field.required && <span style={{ color: "red", marginLeft: "30px" }}>*</span>}
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
