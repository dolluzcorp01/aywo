import React, { useState, useEffect } from "react";
import { Rnd } from "react-rnd";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { apiFetch } from "./utils/api";
import Swal from "sweetalert2";
import { useNotification } from "./NotificationContext";
import {
    FaEnvelope, FaHashtag, FaList, FaCheckSquare, FaCaretDown,
    FaCalendarAlt, FaAlignLeft, FaFileAlt, FaRegTrashAlt, FaRuler, FaTable,
    FaToggleOn, FaTh, FaCheck, FaImage, FaBoxes, FaGripHorizontal, FaSearch,
    FaGripVertical, FaCog, FaClone, FaExchangeAlt, FaHeading, FaChevronUp, FaChevronDown,
    FaClock, FaRegClock, FaCalendarCheck, FaSortNumericDown, FaStar, FaSlidersH, FaSmile,
    FaEquals, FaBars, FaMapMarkerAlt, FaVideo, FaFilePdf, FaMinus, FaTimes
} from "react-icons/fa";
import Select from 'react-select';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import "./Form_builder.css";

const fieldIcons = {
    "Heading": <FaHeading />,
    "Paragraph": <FaAlignLeft />,
    "Banner": <FaFileAlt />,

    "Dropdown": <FaCaretDown />,
    "Picture": <FaImage />,
    "Multiple Select": (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: "#F59E0B" }}>
            <FaChevronUp style={{ height: '0.45rem', width: '0.65rem' }} />
            <FaChevronDown style={{ height: '0.45rem', width: '0.65rem' }} />
        </div>
    ),
    "Switch": <FaToggleOn />,
    "Multiple Choice": <FaList />,
    "Checkboxes": <FaBoxes />,
    "Choice Matrix": <FaGripHorizontal />,
    "Checkbox": <FaCheckSquare />,

    "Date Picker": <FaCalendarAlt />,
    "Date Time Picker": <FaClock />,
    "Time Picker": <FaRegClock />,
    "Date Range": <FaCalendarCheck />,

    "Ranking": <FaSortNumericDown />,
    "Star Rating": <FaStar />,
    "Slider": <FaSlidersH />,
    "Opinion Scale": <FaSmile />,

    "Short Answer": <FaEquals />,
    "Long Answer": <FaBars />,

    "Email": <FaEnvelope />,
    "Number": <FaHashtag />,
    "Address": <FaMapMarkerAlt />,
    "Document Type": <FaFileAlt />,

    "Image": <FaImage />,
    "Video": <FaVideo />,
    "PDF": <FaFilePdf />,

    "Divider": <FaMinus />
};

const FormBuilder = () => {
    const [showDesignSidebar, setShowDesignSidebar] = useState(false);
    const [showFieldSidebar, setShowFieldSidebar] = useState(true);
    const [activeTab, setActiveTab] = useState("current");

    const [fields, setFields] = useState([]);
    const [fieldTypeMenu, setFieldTypeMenu] = useState(null); // stores id of field and position
    const [hovered, setHovered] = useState(null);
    const [editImageOption, setEditImageOption] = useState(null);

    const [formBgColor, setFormBgColor] = useState("lightgray");
    const [formColor, setformColor] = useState("white");

    const [searchTerm, setSearchTerm] = useState("");
    const [lastPosition, setLastPosition] = useState({ x: 50, y: 80 });
    const location = useLocation();

    const [submitBtnY, setSubmitBtnY] = useState(500);
    const [submitBtnHeight, setSubmitBtnHeight] = useState(50);

    const [showCustomize, setShowCustomize] = useState(true);

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const [selectedFieldId, setSelectedFieldId] = useState(null);
    const [customizeVisible, setCustomizeVisible] = useState(false);

    const pictureBgColors = ["#ffb3ba", "#bae1ff", "#baffc9", "#ffffba", "#e3baff", "#ffdfba"];
    const [hoveredOption, setHoveredOption] = useState(null);

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            const zoom = window.devicePixelRatio || 1;
            const screenWidth = window.innerWidth;

            // Consider as "mobile" if screen is small OR zoom is above 150%
            const isMobileCondition = screenWidth < 768 || (screenWidth / window.outerWidth) < 0.67;

            setIsMobile(isMobileCondition);
        };

        handleResize(); // run once on mount
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const MobileWarning = () => (
        <div
            style={{
                padding: "10px",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                backgroundColor: "#fff",
                maxWidth: "700px",
                width: "100%",
                margin: "20px auto",
                boxSizing: "border-box",
                overflowWrap: "break-word",
                wordBreak: "break-word",
                overflow: "hidden"
            }}
        >
            <div className="mobile-warning">
                <div className="icon" style={{ color: "#6B7280", fontSize: "1rem" }}>
                    <i className="fa-solid fa-desktop"></i>
                </div>
                <h2 style={{ fontWeight: "700", color: "#374151" }}>
                    The dForms editor works best on larger screens
                </h2>
                <p style={{ color: "#6B7280", fontWeight: "bolder" }}>
                    Note that the forms you build <u>will work</u> on mobile devices!
                </p>
            </div>
        </div>
    );

    useEffect(() => {
        const handleClickOutside = () => setFieldTypeMenu(null);
        window.addEventListener("click", handleClickOutside);
        return () => window.removeEventListener("click", handleClickOutside);
    }, []);

    const handleFieldClick = (id) => {
        if (selectedFieldId !== id) {
            setSelectedFieldId(id);
            setCustomizeVisible(true);
        }
    };

    const openSettings = (fieldId) => {
        if (selectedFieldId === fieldId) {
            // Toggle customize if already selected
            setCustomizeVisible(!customizeVisible);
        } else {
            setSelectedFieldId(fieldId);
            setCustomizeVisible(true); // Show customize on new field
        }
    };

    const changeFieldType = (id, event) => {
        event.stopPropagation(); // Prevent field selection
        const rect = event.currentTarget.getBoundingClientRect();
        setFieldTypeMenu({ id, top: rect.bottom + 8, left: rect.left });
    };

    const handleTypeChange = (fieldId, newType) => {
        setFields(prev =>
            prev.map(field =>
                field.id === fieldId ? { ...field, type: newType } : field
            )
        );
        setFieldTypeMenu(null); // close menu
    };

    const handleChange = (id, newValue) => {
        const updatedFields = fields.map(f => {
            if (f.id === id) {
                return { ...f, value: newValue };
            }
            return f;
        });
        setFields(updatedFields);
    };

    const duplicateField = (id) => {
        setFields(prevFields => {
            const index = prevFields.findIndex(field => field.id === id);
            if (index === -1) return prevFields;

            const original = prevFields[index];
            const newField = {
                ...original,
                id: Date.now(), // Or use uuid() for more robust id
            };

            const updated = [...prevFields];
            updated.splice(index + 1, 0, newField); // insert after original
            return updated;
        });
    };

    const deleteField = (id) => {
        setFields(prevFields => prevFields.filter(field => field.id !== id));
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await apiFetch("/api/leftnavbar/get-user-profile", {
                    method: "GET",
                });

                if (!response.ok) throw new Error("Unauthorized");

                const data = await response.json();

                if (!data?.user_id) throw new Error("Unauthorized");

                setProfile(data);
            } catch (error) {
                navigate("/login");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    useEffect(() => {
        const updateFormHeight = () => {
            const formContainer = document.querySelector('.form-content');
            if (!formContainer) return;

            // Get max bottom edge of all fields
            let maxBottom = 0;
            fields.forEach(field => {
                const bottom = field.y + field.height;
                if (bottom > maxBottom) maxBottom = bottom;
            });

            const submitBottom = submitBtnY + submitBtnHeight;
            const contentHeight = Math.max(maxBottom, submitBottom) + 100;

            // Only set if changed to prevent re-render flicker
            const currentHeight = parseInt(formContainer.style.height || "0");
            if (currentHeight !== contentHeight) {
                formContainer.style.height = `${contentHeight}px`;
            }
        };

        // Run after DOM updates
        setTimeout(updateFormHeight, 0);
    }, [fields, submitBtnY, submitBtnHeight]);

    // Add new field 
    const addField = (type) => {
        const newField = {
            id: Date.now(),
            type,
            field_type: type,
            label: type,
            bgColor: "#FFFFFF",
            labelColor: "#000000",
            fontSize: 16,
            options: ["Option 1", "Option 2"], // default for types with options
            customized: {}
        };

        switch (type) {
            case "Dropdown":
            case "Multiple Choice":
            case "Multiple Select":
            case "Checkbox":
            case "Checkboxes":
                newField.options = ["Option 1", "Option 2"];
                break;
            case "Opinion Scale":
                newField.min = 1;
                newField.max = 10; // ✅ set only 10 values for Opinion Scale
                break;
            case "Slider":
                newField.min = 1;
                newField.max = 100;
                break;
            case "Choice Matrix":
                newField.rows = ["Row 1", "Row 2"];
                newField.columns = ["Column 1", "Column 2"];
                newField.options = {
                    "Row 1": { "Column 1": "", "Column 2": "" },
                    "Row 2": { "Column 1": "", "Column 2": "" }
                };
                break;
            case "Ranking":
            case "Star Rating":
                newField.max = 5;
                newField.value = 0;
                break;
            case "Date Range":
                newField.range = { from: "", to: "" };
                break;
            case "Document Type":
                newField.file = null;
                break;
            case "Address":
                newField.address = "";
                newField.city = "";
                newField.state = "";
                newField.zip = "";
                break;
            case "Picture":
                newField.options = [
                    { id: Date.now(), label: "Option 1", image: null },
                    { id: Date.now() + 1, label: "Option 2", image: null }
                ];
                break;
            case "Divider":
            case "Image":
            case "Video":
            case "PDF":
            default:
                break;
        }

        setFields([...fields, newField]);

        // ✅ Make the new field selected and show the customize section
        setSelectedFieldId(newField.id);
        setCustomizeVisible(true);
    };

    const renderField = (field) => {
        const commonProps = {
            className: "form-control",
            placeholder: field.placeholder || "",
            defaultValue: field.defaultValue || "",
            style: { width: field.halfWidth ? "50%" : "100%" }
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
                            margin: "8px 0"
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
                            border: "1px solid #ccc",
                            borderRadius: "6px"
                        }}
                    />
                );
            case "Banner":
                const alertType = field.alertType || "info"; // Default to 'info'

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

                const style = alertStyles[alertType.toLowerCase()] || alertStyles.info;

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
                                    marginBottom: "8px"
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
                                    borderRadius: "6px"
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
                        value={field.value || field.defaultValue || ""}  // Use defaultValue if value is not set
                    />
                );
            case "Checkbox":
                return (
                    <div className="form-check">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            id={`checkbox-${field.id}`}
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
                        />
                        <label className="form-check-label" htmlFor={`checkbox-${field.id}-${idx}`}>{opt}</label>
                    </div>
                ));
            case "Dropdown":
                const optionsList = field.options.map(opt => ({ value: opt, label: opt }));

                return (
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
                                ? { value: field.value, label: field.value }
                                : null
                        }
                    />
                );
            case "Multiple Select":
                return (
                    <Select
                        isMulti
                        options={field.options.map(opt => ({ value: opt, label: opt }))}
                        className="basic-multi-select"
                        classNamePrefix="select"
                        placeholder={field.placeholder || "Select an option..."}
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
                            checked={field.defaultValue === "true"}
                            onChange={(e) => {
                                const updatedFields = fields.map(f =>
                                    f.id === field.id
                                        ? { ...f, defaultValue: e.target.checked.toString() }
                                        : f
                                );
                                setFields(updatedFields);
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
                                        style={{ marginRight: "8px" }}
                                    />
                                    <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => {
                                            const newOptions = [...field.options];
                                            newOptions[idx] = e.target.value;

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
                                    />
                                    <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => {
                                            const newOptions = [...field.options];
                                            newOptions[idx] = e.target.value;

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
                                            background: "transparent"
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
            case "Checkbox":
                return (
                    <div className="form-check">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            id={`checkbox-${field.id}`}
                            checked={field.defaultValue === "true"}
                            onChange={(e) => {
                                const updatedFields = fields.map(f =>
                                    f.id === field.id
                                        ? { ...f, defaultValue: e.target.checked.toString() }
                                        : f
                                );
                                setFields(updatedFields);
                            }}
                        />
                    </div>
                );
            case "Choice Matrix":
                return (
                    <div className="Matrix-grid-wrapper">
                        <table className="table Matrix-table text-center">
                            <thead>
                                <tr>
                                    <th></th>
                                    {field.columns.map((col, colIdx) => (
                                        <th key={colIdx}>
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
                                            />
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {field.rows.map((row, rowIdx) => (
                                    <tr key={rowIdx}>
                                        <td>
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
                                            />
                                        </td>
                                        {field.columns.map((col, colIdx) => (
                                            <td key={colIdx}>
                                                <input
                                                    type="radio"
                                                    name={`Matrix_${field.id}_row_${rowIdx}`}
                                                    value={col}
                                                    className="Matrix-radio"
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
                        value={field.defaultValue || ""}
                        onChange={(e) => {
                            const updatedFields = fields.map(f =>
                                f.id === field.id ? { ...f, defaultValue: e.target.value } : f
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
                        value={field.defaultValue || ""}
                        onChange={(e) => {
                            const updatedFields = fields.map(f =>
                                f.id === field.id ? { ...f, defaultValue: e.target.value } : f
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
                        value={field.defaultValue || ""}
                        onChange={(e) => {
                            const updatedFields = fields.map(f =>
                                f.id === field.id ? { ...f, defaultValue: e.target.value } : f
                            );
                            setFields(updatedFields);
                        }}
                    />
                );
            case "Date Range":
                return (
                    <div className="d-flex gap-2">
                        <input type="date" className="form-control" placeholder="From" />
                        <input type="date" className="form-control" placeholder="To" />
                    </div>
                );
            case "Long Answer":
                return <textarea {...commonProps}></textarea>;
            case "Document Type":
                return (
                    <input
                        type="file"
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
                                                            className="form-control"
                                                            value={opt}
                                                            onChange={(e) => {
                                                                const updatedOptions = [...field.options];
                                                                updatedOptions[idx] = e.target.value;

                                                                const updatedFields = fields.map(f =>
                                                                    f.id === field.id ? { ...f, options: updatedOptions } : f
                                                                );
                                                                setFields(updatedFields);
                                                            }}
                                                            style={{ flex: 1 }}
                                                        />

                                                        {/* Drag handle */}
                                                        <span {...provided.dragHandleProps} style={{ cursor: "grab", color: "gray" }}>
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
                                                        options: [...f.options, `Option ${f.options.length + 1}`]
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
                            {[...Array(field.max || 5)].map((_, i) => (
                                <span
                                    key={i}
                                    style={{
                                        fontSize: "24px",
                                        color:
                                            hovered != null
                                                ? i <= hovered
                                                    ? "rgb(59, 130, 246)"
                                                    : "#ccc"
                                                : i < field.value
                                                    ? "rgb(59, 130, 246)"
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
                const currentValue = field.value ?? field.min;
                const percentage = ((currentValue - field.min) / (field.max - field.min)) * 100;

                const sliderStyle = {
                    background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`
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
                            <span style={{ color: "#6b7280" }}>{currentValue} / {field.max}</span>
                        </div>
                        <input
                            type="range"
                            min={field.min}
                            max={field.max}
                            value={currentValue}
                            className="custom-slider"
                            style={sliderStyle}  // ← THIS updates the fill color dynamically
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
                            maxWidth: "640px", // 15 * 40px + gaps
                        }}
                    >
                        {[...Array((field?.max ?? 10) - (field?.min ?? 1) + 1)].map((_, i) => {
                            const val = field.min + i;
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
                                        position: "relative"
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
                                            backgroundColor: opt.image ? "transparent" : pictureBgColors[idx % pictureBgColors.length],
                                            backgroundImage: opt.image ? `url(${opt.image})` : undefined,
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
                                        <input type="radio" name={`pic_${field.id}`} />
                                        <span style={{ marginLeft: "6px" }}>{opt.label}</span>
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
                                            options: [...f.options, { id: Date.now(), label: `Option ${f.options.length + 1}`, image: null }]
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
                return (
                    <div
                        className="media-preview-wrapper"
                        style={{
                            textAlign: field.alignment || "center" // default to center
                        }}
                    >
                        {field.file ? (
                            <img
                                src={URL.createObjectURL(field.file)}
                                alt="Uploaded"
                                style={{
                                    width: `${field.previewSize}px`,
                                    maxHeight: `${field.previewSize}px`,
                                    objectFit: "contain",
                                    borderRadius: "8px"
                                }}
                            />
                        ) : (
                            <div className="media-upload-placeholder">No image uploaded</div>
                        )}

                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    const updatedFields = fields.map(f =>
                                        f.id === field.id
                                            ? {
                                                ...f,
                                                file,
                                                previewSize: f.previewSize || 300
                                            }
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
                return (
                    <div
                        className="media-preview-wrapper"
                        style={{ textAlign: field.alignment || "center" }}
                    >
                        {field.file ? (
                            <video
                                controls
                                style={{
                                    width: `${field.previewSize}px`,
                                    maxHeight: `${field.previewSize * 0.6}px`,
                                    borderRadius: "8px",
                                    objectFit: "contain"
                                }}
                                src={URL.createObjectURL(field.file)}
                            />
                        ) : (
                            <div className="media-upload-placeholder">No video uploaded</div>
                        )}
                        <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    const updatedFields = fields.map(f =>
                                        f.id === field.id
                                            ? { ...f, file, previewSize: f.previewSize || 300 }
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
                return (
                    <div
                        className="media-preview-wrapper"
                        style={{ textAlign: field.alignment || "center" }}
                    >
                        {field.file ? (
                            <embed
                                src={URL.createObjectURL(field.file)}
                                type="application/pdf"
                                width={`${field.previewSize}px`}
                                height={`${field.previewSize * 1.2}px`}
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
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    const updatedFields = fields.map(f =>
                                        f.id === field.id
                                            ? { ...f, file, previewSize: f.previewSize || 300 }
                                            : f
                                    );
                                    setFields(updatedFields);
                                }
                            }}
                            className="form-control mt-2"
                        />
                    </div>
                );
            default:
                return <input type="text" {...commonProps} />;
        }
    };

    const FieldButton = ({ type, section }) => {
        const getColor = () => {
            if (section === "Frequently used") return "#28a745";
            if (section === "Display text") return "#6c757d";
            if (section === "Choices") return "#F59E0B";
            if (section === "Time") return "#A855F7";
            if (section === "Rating & Ranking") return "rgb(239, 68, 68)";
            if (section === "Text") return "#28a745";
            if (section === "Contact Info") return "rgb(20, 184, 166)";
            if (section === "Navigation & Layout") return "#e83e8c";
            if (section === "Media") return "#3498db";
            return "#F59E0B";
        };

        const baseColor = getColor();

        const backgroundColor = `${baseColor}20`;
        const borderColor = baseColor;

        const icon = fieldIcons[type] || <FaCheck />;
        const modifiedIcon = React.cloneElement(icon, { color: baseColor, size: 12 }); // 👈 Smaller icon

        return (
            <button
                className="field-btn"
                onClick={() => addField(type)}
                style={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    padding: "12px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    width: "80px",
                    height: "80px",
                    boxSizing: "border-box"
                }}
            >
                <div
                    className="field-icon"
                    style={{
                        backgroundColor,
                        border: `1.5px solid ${borderColor}`,
                        borderRadius: "3px",
                        padding: "5px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: "5px"
                    }}
                >
                    {modifiedIcon}
                </div>
                <div className="field-label" style={{ color: "#1f2937", fontWeight: 500, fontSize: "0.65rem" }}>{type}</div>
            </button>
        );
    };

    // Function to reorder items
    const reorder = (list, startIndex, endIndex) => {
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return result;
    };

    const onDragEnd = (result) => {
        if (!result.destination) return;
        const newFields = reorder(fields, result.source.index, result.destination.index);
        setFields(newFields);
    };

    const reorderOptions = (fieldId, sourceIndex, destinationIndex) => {
        const updatedFields = fields.map(field => {
            if (field.id === fieldId) {
                const options = Array.from(field.options);
                const [removed] = options.splice(sourceIndex, 1);
                options.splice(destinationIndex, 0, removed);
                return { ...field, options };
            }
            return field;
        });

        setFields(updatedFields);
    };

    if (loading) return <p>Loading...</p>;

    return (
        <div className="form-builder">
            {isMobile ? (
                <MobileWarning />
            ) : (
                <>
                    {showFieldSidebar && (
                        <div className="form-fields-sidebar">
                            <div className="search-wrapper">
                                <FaSearch className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search fields"
                                    className="search-bar"
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="field-group-scrollable mt-2">
                                <div className="field-group mt-1">
                                    <h4>Frequently used</h4>
                                    <div className="field-grid">
                                        {["Short Answer", "Multiple Choice", "Email"]
                                            .filter(type => type.toLowerCase().includes(searchTerm.toLowerCase()))
                                            .map(type => <FieldButton key={type} type={type} section="Frequently used" />)}
                                    </div>
                                </div>

                                <div className="field-group mt-1">
                                    <h4>Display text</h4>
                                    <div className="field-grid">
                                        {["Heading", "Paragraph", "Banner"]
                                            .filter(type => type.toLowerCase().includes(searchTerm.toLowerCase()))
                                            .map(type => <FieldButton key={type} type={type} section="Display text" />)}
                                    </div>
                                </div>

                                <div className="field-group mt-1">
                                    <h4>Choices</h4>
                                    <div className="field-grid">
                                        {[
                                            "Dropdown", "Picture", "Multiple Select", "Switch", "Multiple Choice", "Checkbox",
                                            "Checkboxes", "Choice Matrix"
                                        ]
                                            .filter(type => type.toLowerCase().includes(searchTerm.toLowerCase()))
                                            .map(type => <FieldButton key={type} type={type} section="Choices" />)}
                                    </div>
                                </div>

                                <div className="field-group mt-1">
                                    <h4>Time</h4>
                                    <div className="field-grid">
                                        {["Date Picker", "Date Time Picker", "Time Picker", "Date Range"]
                                            .filter(type => type.toLowerCase().includes(searchTerm.toLowerCase()))
                                            .map(type => <FieldButton key={type} type={type} section="Time" />)}
                                    </div>
                                </div>

                                <div className="field-group mt-1">
                                    <h4>Rating & Ranking</h4>
                                    <div className="field-grid">
                                        {["Ranking", "Star Rating", "Slider", "Opinion Scale"]
                                            .filter(type => type.toLowerCase().includes(searchTerm.toLowerCase()))
                                            .map(type => <FieldButton key={type} type={type} section="Rating & Ranking" />)}
                                    </div>
                                </div>

                                <div className="field-group mt-1">
                                    <h4>Text</h4>
                                    <div className="field-grid">
                                        {["Short Answer", "Long Answer"]
                                            .filter(type => type.toLowerCase().includes(searchTerm.toLowerCase()))
                                            .map(type => <FieldButton key={type} type={type} section="Text" />)}
                                    </div>
                                </div>

                                <div className="field-group mt-1">
                                    <h4>Contact Info</h4>
                                    <div className="field-grid">
                                        {["Email", "Number", "Address", "Document Type"]
                                            .filter(type => type.toLowerCase().includes(searchTerm.toLowerCase()))
                                            .map(type => <FieldButton key={type} type={type} section="Contact Info" />)}
                                    </div>
                                </div>

                                <div className="field-group mt-1">
                                    <h4>Navigation & Layout</h4>
                                    <div className="field-grid">
                                        {["Divider"]
                                            .filter(type => type.toLowerCase().includes(searchTerm.toLowerCase()))
                                            .map(type => <FieldButton key={type} type={type} section="Navigation & Layout" />)}
                                    </div>
                                </div>

                                <div className="field-group mt-1">
                                    <h4>Media</h4>
                                    <div className="field-grid">
                                        {["Image", "Video", "PDF"]
                                            .filter(type => type.toLowerCase().includes(searchTerm.toLowerCase()))
                                            .map(type => <FieldButton key={type} type={type} section="Media" />)}
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}

                    {showDesignSidebar && (
                        <div className="form-designs-sidebar" style={{ color: "gray" }}>
                            <div
                                className="designbar-header"
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "5px",
                                    paddingLeft: "15px",
                                    paddingRight: "15px",
                                    paddingBottom: "20px",
                                    borderBottom: "1px solid #ccc",
                                    marginLeft: "-12px",
                                    marginRight: "-12px",
                                }}
                            >
                                <span style={{ fontWeight: "bold", fontSize: "16px" }}>
                                    Form Designer
                                </span>
                                <i
                                    className="fa-solid fa-xmark"
                                    style={{ fontSize: "20px", cursor: "pointer", color: "black" }}
                                    onClick={() => {
                                        setShowDesignSidebar(false);
                                        setShowFieldSidebar(true);
                                    }}
                                ></i>
                            </div>

                            {/* Tabs for Current / All themes */}
                            <div style={{ display: "flex", margin: "14px" }}>
                                <button
                                    style={{
                                        flex: 1,
                                        padding: "5px 10px",
                                        backgroundColor: "#374151",
                                        color: "white",
                                        fontWeight: "bold",
                                        border: "1px solid #ccc",
                                        borderRight: "none",
                                        borderTopLeftRadius: "6px",
                                        borderBottomLeftRadius: "6px",
                                        cursor: "pointer"
                                    }}
                                    onClick={() => setActiveTab("current")}
                                >
                                    Current
                                </button>
                                <button
                                    style={{
                                        flex: 1,
                                        padding: "5px 10px",
                                        backgroundColor: "white",
                                        color: "#374151",
                                        fontWeight: "500",
                                        border: "1px solid #ccc",
                                        borderLeft: "none",
                                        borderTopRightRadius: "6px",
                                        borderBottomRightRadius: "6px",
                                        cursor: "pointer"
                                    }}
                                    onClick={() => setActiveTab("themes")}
                                >
                                    All themes
                                </button>
                            </div>

                            {/* Content based on tab */}
                            <div style={{ padding: "14px" }}>
                                {activeTab === "current" ? (
                                    <>
                                        {/* Light Theme */}
                                        <div style={{ fontWeight: "bold", marginBottom: "10px" }}>Light</div>

                                        {/* Options */}
                                        <div style={{ marginBottom: "10px" }}>
                                            <div>Background</div>
                                            <input type="color" style={{ width: "100%" }} />
                                        </div>

                                        <div style={{ marginBottom: "10px" }}>
                                            <div>Questions Background</div>
                                            <input type="color" style={{ width: "100%" }} />
                                        </div>

                                        <div style={{ marginBottom: "10px" }}>
                                            <div>Primary</div>
                                            <input type="color" style={{ width: "100%" }} />
                                        </div>

                                        <div style={{ marginBottom: "10px" }}>
                                            <div>Questions</div>
                                            <input type="color" style={{ width: "100%" }} />
                                        </div>

                                        <div style={{ marginBottom: "10px" }}>
                                            <div>Answers</div>
                                            <input type="color" style={{ width: "100%" }} />
                                        </div>

                                        <div style={{ marginBottom: "10px" }}>
                                            <div>Font</div>
                                            <input type="text" placeholder="Default" style={{ width: "100%", padding: "5px" }} />
                                        </div>
                                    </>
                                ) : (
                                    <div>
                                        {/* Empty div for now */}
                                    </div>
                                )}
                            </div>
                        </div>

                    )}

                    <div className="form-container">
                        <div className="form-body" style={{ backgroundColor: formBgColor }}>

                            {/* Theme Button */}
                            <button
                                className="theme-button"
                                onClick={() => {
                                    setShowDesignSidebar(true);
                                    setShowFieldSidebar(false);
                                }}
                            >
                                <i className="fa-solid fa-paintbrush" style={{ marginRight: "3px" }}></i> Theme
                            </button>

                            <div className="form-content" style={{ backgroundColor: formColor }} onClick={() => setShowCustomize(true)}>
                                <DragDropContext onDragEnd={onDragEnd}>
                                    <Droppable droppableId="fields">
                                        {(provided) => (
                                            <div ref={provided.innerRef} {...provided.droppableProps}>
                                                {fields.map((field, index) => (
                                                    <Draggable key={field.id} draggableId={field.id.toString()} index={index}>
                                                        {(provided) => (
                                                            <div
                                                                className="form-field-wrapper"
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                onClick={() => handleFieldClick(field.id)}
                                                            >
                                                                <div className="drag-handle" {...provided.dragHandleProps}>
                                                                    <FaGripVertical />
                                                                </div>

                                                                <div className="form-field-content">
                                                                    {!["Heading", "Banner", "Divider", "Image", "Video", "PDF"].includes(field.type) ? (
                                                                        <>
                                                                            <input
                                                                                type="text"
                                                                                value={field.label}
                                                                                onChange={(e) => {
                                                                                    e.stopPropagation(); // Prevent field click from firing
                                                                                    const updatedFields = fields.map(f =>
                                                                                        f.id === field.id ? { ...f, label: e.target.value } : f
                                                                                    );
                                                                                    setFields(updatedFields);
                                                                                }}
                                                                                style={{
                                                                                    fontSize: "1rem",
                                                                                    border: "none",
                                                                                    background: "transparent",
                                                                                    width: "fit-content",
                                                                                    marginBottom: "2px"
                                                                                }}
                                                                            />
                                                                            {field.required && <span style={{ color: 'red' }}>*</span>}
                                                                            {field.caption && (
                                                                                <small style={{ color: 'gray', display: 'block', marginBottom: '6px' }}>
                                                                                    {field.caption}
                                                                                </small>
                                                                            )}
                                                                        </>
                                                                    ) : null}

                                                                    {renderField(field)}
                                                                </div>

                                                                {selectedFieldId === field.id && (
                                                                    <div className="field-actions">
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation(); // Prevent field click from firing
                                                                                openSettings(field.id);
                                                                            }}
                                                                            data-tooltip-title="Open field settings"
                                                                        >
                                                                            <FaCog
                                                                                style={{
                                                                                    color:
                                                                                        customizeVisible && selectedFieldId === field.id
                                                                                            ? 'rgb(59, 130, 246)'
                                                                                            : 'inherit'
                                                                                }}
                                                                            />
                                                                        </button>

                                                                        <button
                                                                            className="change-type"
                                                                            onClick={(e) => changeFieldType(field.id, e)}
                                                                            data-tooltip-title={`Change field type\A${field.type}`}
                                                                        >
                                                                            <FaExchangeAlt />
                                                                        </button>

                                                                        <button
                                                                            onClick={() => duplicateField(field.id)}
                                                                            data-tooltip-title="Duplicate field"
                                                                        >
                                                                            <FaClone />
                                                                        </button>

                                                                        <button
                                                                            className="delete"
                                                                            onClick={() => deleteField(field.id)}
                                                                            data-tooltip-title="Delete field"
                                                                        >
                                                                            <FaRegTrashAlt />
                                                                        </button>
                                                                    </div>
                                                                )}

                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </DragDropContext>
                            </div>

                        </div>
                        {fieldTypeMenu && (
                            <div
                                className="field-type-menu"
                                style={{
                                    position: "absolute",
                                    top: "calc(var(--menu-top, 155px))",
                                    left: "calc(var(--menu-left, 70%) + 50px)",
                                    background: "#fff",
                                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                                    borderRadius: "10px",
                                    padding: "16px",
                                    zIndex: 9999,
                                }}
                            >
                                <h4 style={{ marginBottom: 20, color: "rgb(156 163 175)", fontWeight: "400", fontSize: ".875rem" }}>Change to similar field:</h4>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                                    {[
                                        { type: "Paragraph", label: "Long answer", icon: <FaAlignLeft /> },
                                        { type: "Email", label: "Email input", icon: <FaEnvelope /> },
                                        { type: "Date Picker", label: "Date", icon: <FaCalendarAlt /> },
                                        { type: "Number", label: "Phone number", icon: <FaHashtag /> },
                                        { type: "Dropdown", label: "Dropdown", icon: <FaCaretDown /> },
                                        { type: "Checkbox", label: "Checkbox", icon: <FaCheckSquare /> },
                                    ].map((opt) => (
                                        <button
                                            key={opt.type}
                                            onClick={() => handleTypeChange(fieldTypeMenu.id, opt.type)}
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                border: "1px solid #e5e7eb",
                                                borderRadius: "10px",
                                                padding: "5px 7px",
                                                background: "#f9f9f9",
                                                cursor: "pointer",
                                                width: "70px",
                                                Height: "60px",
                                                overflow: "hidden",
                                                textAlign: "center",
                                                boxSizing: "border-box",
                                            }}
                                        >
                                            <div style={{ fontSize: "15px", color: "#0ea5e9" }}>{opt.icon}</div>
                                            <span
                                                style={{
                                                    fontSize: "12px",
                                                    marginTop: "6px",
                                                    color: "#1f2937",
                                                    lineHeight: "1.2",
                                                    wordWrap: "break-word",
                                                    whiteSpace: "normal",
                                                }}
                                            >
                                                {opt.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {editImageOption && (
                            <div className="image-option-modal-backdrop">
                                <div className="image-option-modal-box">
                                    <h5 style={{ fontWeight: "600", fontSize: "1.125rem", marginBottom: "20px" }}>Edit image option</h5>
                                    <span style={{ fontWeight: "500", fontSize: ".875rem" }}>Lable</span>
                                    <input
                                        style={{ marginBottom: "20px" }}
                                        type="text"
                                        className="form-control"
                                        value={fields.find(f => f.id === editImageOption.fieldId).options[editImageOption.index].label}
                                        onChange={(e) => {
                                            const updatedFields = fields.map(f => {
                                                if (f.id !== editImageOption.fieldId) return f;
                                                const updatedOptions = [...f.options];
                                                updatedOptions[editImageOption.index].label = e.target.value;
                                                return { ...f, options: updatedOptions };
                                            });
                                            setFields(updatedFields);
                                        }}
                                    />
                                    <span style={{ fontWeight: "500", fontSize: ".875rem" }}>Image</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="form-control mt-2"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (!file) return;
                                            const reader = new FileReader();
                                            reader.onload = () => {
                                                const updatedFields = fields.map(f => {
                                                    if (f.id !== editImageOption.fieldId) return f;
                                                    const updatedOptions = [...f.options];
                                                    updatedOptions[editImageOption.index].image = reader.result;
                                                    return { ...f, options: updatedOptions };
                                                });
                                                setFields(updatedFields);
                                            };
                                            reader.readAsDataURL(file);
                                        }}
                                    />
                                    <div className="modal-actions text-end mt-3">
                                        <button onClick={() => setEditImageOption(null)} className="btn btn-primary">
                                            Save
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {customizeVisible && selectedFieldId && (
                        <div className="customize-section" style={{ color: 'gray' }}>
                            <div className="customize-header" style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #ddd', paddingBottom: '10px', marginBottom: '20px' }}>
                                <i
                                    className="fa-solid fa-xmark"
                                    style={{ fontSize: "20px", cursor: "pointer", color: "black", marginRight: '20px' }}
                                    onClick={() => setCustomizeVisible(false)}
                                ></i>
                                <h4 style={{ fontWeight: '500', fontSize: '1.125rem', margin: 0 }}>
                                    {fields.find(f => f.id === selectedFieldId)?.type} settings
                                </h4>
                            </div>

                            <div>

                                {!["Divider", "Image", "Video", "PDF"].includes(fields.find(f => f.id === selectedFieldId)?.type) && (
                                    <>
                                        <label>Label</label>
                                        <div style={{ color: "#aaa", fontSize: ".875rem", marginBottom: "10px" }}>
                                            Click text on page to modify
                                        </div>
                                    </>
                                )}

                                {/* Show only Specific Fields */}
                                {!["Divider", "Image", "Video", "PDF"].includes(fields.find(f => f.id === selectedFieldId)?.type) && (
                                    <>
                                        <label>Caption</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={fields.find(f => f.id === selectedFieldId)?.caption || ""}
                                            onChange={(e) => {
                                                const updatedFields = fields.map(f =>
                                                    f.id === selectedFieldId ? { ...f, caption: e.target.value } : f
                                                );
                                                setFields(updatedFields);
                                            }}
                                        />
                                    </>
                                )}

                                {!["Heading", "Banner", "Multiple Choice", "Checkbox", "Picture", "Switch", "Choice Matrix", "Date Picker", "Date Time Picker", "Time Picker", "Date Range", "Ranking", "Star Rating", "Slider", "Opinion Scale", "Address", "Divider", "Image", "Video", "PDF", "Document Type"].includes(fields.find(f => f.id === selectedFieldId)?.type) && (
                                    <>
                                        <label>Placeholder</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={fields.find(f => f.id === selectedFieldId)?.placeholder || ""}
                                            onChange={(e) => {
                                                const updatedFields = fields.map(f =>
                                                    f.id === selectedFieldId ? { ...f, placeholder: e.target.value } : f
                                                );
                                                setFields(updatedFields);
                                            }}
                                        />
                                    </>
                                )}

                                {!["Heading", "Banner", "Multiple Choice", "Checkbox", "Dropdown", "Multiple Select", "Picture", "Switch", "Choice Matrix", "Date Picker", "Date Time Picker", "Time Picker", "Date Range", "Ranking", "Star Rating", "Slider", "Opinion Scale", "Number", "Address", "Divider", "Image", "Video", "PDF", "Document Type"].includes(fields.find(f => f.id === selectedFieldId)?.type) && (
                                    <>
                                        <label>Default value <span title="Initial value" style={{ cursor: "help" }}>🛈</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={fields.find(f => f.id === selectedFieldId)?.defaultValue || ""}
                                            onChange={(e) => {
                                                const updatedFields = fields.map(f =>
                                                    f.id === selectedFieldId ? { ...f, defaultValue: e.target.value } : f
                                                );
                                                setFields(updatedFields);
                                            }}
                                        />
                                    </>
                                )}

                                {["Switch", "Checkbox"].includes(fields.find(f => f.id === selectedFieldId)?.type) && (
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            marginBottom: "10px"
                                        }}
                                    >
                                        <label style={{ marginBottom: 0 }}>
                                            Default value{" "}
                                            <span title="Switch on to make this field true" style={{ cursor: "help" }}>🛈</span>
                                        </label>

                                        <span
                                            className={`custom-toggle ${fields.find(f => f.id === selectedFieldId)?.defaultValue === "true" ? 'active' : ''}`}
                                            onClick={() => {
                                                const updatedFields = fields.map(f =>
                                                    f.id === selectedFieldId
                                                        ? {
                                                            ...f,
                                                            defaultValue: f.defaultValue === "true" ? "false" : "true"
                                                        }
                                                        : f
                                                );
                                                setFields(updatedFields);
                                            }}
                                            style={{ cursor: "pointer" }}
                                        ></span>
                                    </div>
                                )}

                                {/* ✅ Style section for Heading */}
                                {fields.find(f => f.id === selectedFieldId)?.type === "Heading" && (
                                    <>
                                        <label>Font Size (px)</label>
                                        <input
                                            type="number"
                                            min={12}
                                            max={48}
                                            className="form-control"
                                            value={parseInt(fields.find(f => f.id === selectedFieldId)?.fontSize || "24")}
                                            onChange={(e) => {
                                                const updatedFields = fields.map(f =>
                                                    f.id === selectedFieldId ? { ...f, fontSize: `${e.target.value}px` } : f
                                                );
                                                setFields(updatedFields);
                                            }}
                                        />
                                    </>
                                )}

                                {/* ✅ Style section for Banner */}
                                {fields.find(f => f.id === selectedFieldId)?.type === "Banner" && (
                                    <div style={{ marginTop: "20px" }}>
                                        <label>Alert type</label>
                                        <select
                                            className="form-control"
                                            value={fields.find(f => f.id === selectedFieldId)?.alertType || "info"}
                                            onChange={(e) => {
                                                const updatedFields = fields.map(f =>
                                                    f.id === selectedFieldId ? { ...f, alertType: e.target.value } : f
                                                );
                                                setFields(updatedFields);
                                            }}
                                        >
                                            <option value="warning">🟨 Warning</option>
                                            <option value="error">🟥 Error</option>
                                            <option value="info">🟦 Info</option>
                                            <option value="success">🟩 Success</option>
                                        </select>
                                    </div>
                                )}

                                {["Dropdown", "Multiple Choice", "Multiple Select", "Checkboxes"].includes(fields.find(f => f.id === selectedFieldId)?.type) && (
                                    <div style={{ marginTop: "20px" }}>
                                        <label>Options</label>

                                        <DragDropContext onDragEnd={(result) => {
                                            const { source, destination } = result;
                                            if (!destination) return;
                                            reorderOptions(selectedFieldId, source.index, destination.index);
                                        }}>
                                            <Droppable droppableId="optionsList">
                                                {(provided) => (
                                                    <div ref={provided.innerRef} {...provided.droppableProps}>
                                                        {fields.find(f => f.id === selectedFieldId)?.options.map((opt, index) => (
                                                            <Draggable key={index} draggableId={`option-${index}`} index={index}>
                                                                {(provided) => (
                                                                    <div
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        style={{
                                                                            display: "flex",
                                                                            alignItems: "center",
                                                                            background: "#f9f9f9",
                                                                            padding: "8px",
                                                                            borderRadius: "6px",
                                                                            marginBottom: "6px",
                                                                            ...provided.draggableProps.style
                                                                        }}
                                                                    >
                                                                        <input
                                                                            type="text"
                                                                            value={opt}
                                                                            className="form-control"
                                                                            onChange={(e) => {
                                                                                const updatedFields = fields.map(field => {
                                                                                    if (field.id === selectedFieldId) {
                                                                                        const newOptions = [...field.options];
                                                                                        newOptions[index] = e.target.value;
                                                                                        return { ...field, options: newOptions };
                                                                                    }
                                                                                    return field;
                                                                                });
                                                                                setFields(updatedFields);
                                                                            }}
                                                                            style={{ flex: 1, marginRight: "10px" }}
                                                                        />
                                                                        <span {...provided.dragHandleProps} style={{ cursor: "grab", marginRight: "10px" }}>
                                                                            <i className="fas fa-grip-vertical"></i>
                                                                        </span>
                                                                        <span
                                                                            style={{ color: "red", cursor: "pointer" }}
                                                                            onClick={() => {
                                                                                const updatedFields = fields.map(field => {
                                                                                    if (field.id === selectedFieldId) {
                                                                                        const newOptions = [...field.options];
                                                                                        newOptions.splice(index, 1); // remove the option
                                                                                        return { ...field, options: newOptions };
                                                                                    }
                                                                                    return field;
                                                                                });
                                                                                setFields(updatedFields);
                                                                            }}
                                                                        >
                                                                            <i className="fas fa-trash-alt"></i>
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </Draggable>
                                                        ))}
                                                        {provided.placeholder}
                                                    </div>
                                                )}
                                            </Droppable>
                                        </DragDropContext>

                                        <button
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => {
                                                const updatedFields = fields.map(f =>
                                                    f.id === selectedFieldId ? { ...f, options: [...f.options, `Option ${f.options.length + 1}`] } : f
                                                );
                                                setFields(updatedFields);
                                            }}
                                            style={{ marginTop: "10px" }}
                                        >
                                            + Add Option
                                        </button>
                                    </div>
                                )}

                                {/* ✅ Style section for Multiple Choice */}
                                {fields.find(f => f.id === selectedFieldId)?.type === "Multiple Choice" && (
                                    <div style={{ marginTop: "20px" }}>
                                        <label style={{ fontWeight: 'bold' }}>Style</label>
                                        <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                                            <div
                                                onClick={() => {
                                                    const updatedFields = fields.map(f =>
                                                        f.id === selectedFieldId ? { ...f, bubble: true } : f
                                                    );
                                                    setFields(updatedFields);
                                                }}
                                                style={{
                                                    border: fields.find(f => f.id === selectedFieldId)?.bubble ? '2px solid #2563eb' : '1px solid #ccc',
                                                    padding: '10px',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    flex: '1',
                                                    textAlign: 'center'
                                                }}
                                            >
                                                <div style={{ fontSize: '20px', marginBottom: '5px' }}>☰</div>
                                                Bubble
                                            </div>

                                            <div
                                                onClick={() => {
                                                    const updatedFields = fields.map(f =>
                                                        f.id === selectedFieldId ? { ...f, bubble: false } : f
                                                    );
                                                    setFields(updatedFields);
                                                }}
                                                style={{
                                                    border: !fields.find(f => f.id === selectedFieldId)?.bubble ? '2px solid #2563eb' : '1px solid #ccc',
                                                    padding: '10px',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    flex: '1',
                                                    textAlign: 'center'
                                                }}
                                            >
                                                <div style={{ fontSize: '18px', marginBottom: '5px' }}>◯</div>
                                                Standard
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {["Date Picker", "Time Picker", "Date Time Picker"].includes(fields.find(f => f.id === selectedFieldId)?.type) && (
                                    <div style={{ marginBottom: "10px" }}>
                                        <label>
                                            Default value{" "}
                                            <span title="Set a default date/time for this field" style={{ cursor: "help" }}>🛈</span>
                                        </label>
                                        <input
                                            type={
                                                fields.find(f => f.id === selectedFieldId)?.type === "Date Picker" ? "date" :
                                                    fields.find(f => f.id === selectedFieldId)?.type === "Time Picker" ? "time" : "datetime-local"
                                            }
                                            className="form-control"
                                            value={fields.find(f => f.id === selectedFieldId)?.defaultValue || ""}
                                            onChange={(e) => {
                                                const updatedFields = fields.map(f =>
                                                    f.id === selectedFieldId ? { ...f, defaultValue: e.target.value } : f
                                                );
                                                setFields(updatedFields);
                                            }}
                                        />
                                    </div>
                                )}

                                {fields.find(f => f.id === selectedFieldId)?.type === "Star Rating" && (
                                    <div style={{ marginBottom: "10px" }}>
                                        <label>
                                            Max Stars{" "}
                                            <span title="Maximum number of stars to display (Max 50)" style={{ cursor: "help" }}>🛈</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="50"
                                            className="form-control"
                                            value={fields.find(f => f.id === selectedFieldId)?.max || 5}
                                            onChange={(e) => {
                                                const value = Math.min(50, parseInt(e.target.value, 10));
                                                const updatedFields = fields.map(f =>
                                                    f.id === selectedFieldId ? { ...f, max: value } : f
                                                );
                                                setFields(updatedFields);
                                            }}
                                        />
                                    </div>
                                )}

                                {fields.find(f => f.id === selectedFieldId)?.type === "Slider" && (
                                    <div style={{ marginBottom: "10px" }}>
                                        <label>
                                            Max Slider Value{" "}
                                            <span title="Set the maximum value for the slider (between 10 and 100)" style={{ cursor: "help" }}>🛈</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="10"
                                            max="100"
                                            className="form-control"
                                            value={fields.find(f => f.id === selectedFieldId)?.max || 100}
                                            onChange={(e) => {
                                                let value = parseInt(e.target.value, 10);
                                                value = Math.max(10, Math.min(100, value)); // clamp to 10–100

                                                const updatedFields = fields.map(f =>
                                                    f.id === selectedFieldId ? { ...f, max: value } : f
                                                );
                                                setFields(updatedFields);
                                            }}
                                        />
                                    </div>
                                )}

                                {fields.find(f => f.id === selectedFieldId)?.type === "Opinion Scale" && (
                                    <>
                                        <div style={{ marginBottom: "10px" }}>
                                            <label>
                                                Max Opinion
                                                <span title="Maximum scale value (Max 100)" style={{ cursor: "help" }}> 🛈</span>
                                            </label>
                                            <input
                                                type="number"
                                                min={fields.find(f => f.id === selectedFieldId)?.min + 1 || 2}
                                                max="100"
                                                className="form-control"
                                                value={fields.find(f => f.id === selectedFieldId)?.max || 10}
                                                onChange={(e) => {
                                                    const value = Math.min(100, parseInt(e.target.value, 10));
                                                    const updatedFields = fields.map(f =>
                                                        f.id === selectedFieldId ? { ...f, max: value } : f
                                                    );
                                                    setFields(updatedFields);
                                                }}
                                            />
                                        </div>
                                    </>
                                )}

                                {fields.find(f => f.id === selectedFieldId)?.type === "Number" && (
                                    <>
                                        <label>
                                            Default value{" "}
                                            <span title="Initial value" style={{ cursor: "help" }}>🛈</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            value={fields.find(f => f.id === selectedFieldId)?.defaultValue || ""}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (/^\d*$/.test(value)) { // Only digits
                                                    const updatedFields = fields.map(f =>
                                                        f.id === selectedFieldId ? { ...f, defaultValue: value } : f
                                                    );
                                                    setFields(updatedFields);
                                                }
                                            }}
                                        />
                                    </>
                                )}

                                {fields.find(f => f.id === selectedFieldId)?.type === "Divider" && (
                                    <>
                                        <label>
                                            Label{" "}
                                            <span title="This text appears in the center of the divider" style={{ cursor: "help" }}>🛈</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Enter divider text"
                                            value={fields.find(f => f.id === selectedFieldId)?.label || ""}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                const updatedFields = fields.map(f =>
                                                    f.id === selectedFieldId ? { ...f, label: value } : f
                                                );
                                                setFields(updatedFields);
                                            }}
                                        />
                                    </>
                                )}

                                {["Image", "Vedio", "PDF"].includes(fields.find(f => f.id === selectedFieldId)?.type) && (
                                    <>
                                        <label>Max Height</label>
                                        {/* Max Height UI can go here if you plan to add one */}

                                        {/* Image Resize Slider */}
                                        <div className="mt-2">
                                            <label>Size: {fields.find(f => f.id === selectedFieldId)?.previewSize}px</label>
                                            <input
                                                type="range"
                                                min="100"
                                                max="600"
                                                step="10"
                                                value={fields.find(f => f.id === selectedFieldId)?.previewSize || 300}
                                                onChange={(e) => {
                                                    const updatedFields = fields.map(f =>
                                                        f.id === selectedFieldId
                                                            ? { ...f, previewSize: parseInt(e.target.value) }
                                                            : f
                                                    );
                                                    setFields(updatedFields);
                                                }}
                                                className="form-range"
                                            />
                                        </div>

                                        {/* Alignment Controls */}
                                        <div className="mt-3">
                                            <label>Alignment</label>
                                            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                                                {["left", "center", "right"].map((align) => {
                                                    const icons = {
                                                        left: "⬅️",
                                                        center: "↔️",
                                                        right: "➡️"
                                                    };
                                                    return (
                                                        <button
                                                            key={align}
                                                            onClick={() => {
                                                                const updatedFields = fields.map(f =>
                                                                    f.id === selectedFieldId ? { ...f, alignment: align } : f
                                                                );
                                                                setFields(updatedFields);
                                                            }}
                                                            style={{
                                                                padding: "6px 10px",
                                                                fontSize: "1.2rem",
                                                                border: fields.find(f => f.id === selectedFieldId)?.alignment === align
                                                                    ? "2px solid #007bff"
                                                                    : "1px solid lightgray",
                                                                borderRadius: "5px",
                                                                background: "white",
                                                                cursor: "pointer"
                                                            }}
                                                        >
                                                            {icons[align]}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {!["Heading", "Banner", "Divider", "Image", "Video", "PDF"].includes(fields.find(f => f.id === selectedFieldId)?.type) && (
                                    <>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                                            {/* Required Row */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <label className="form-check-label">Required</label>
                                                <span
                                                    className={`custom-toggle ${fields.find(f => f.id === selectedFieldId)?.required ? 'active' : ''}`}
                                                    onClick={() => {
                                                        const updatedFields = fields.map(f =>
                                                            f.id === selectedFieldId ? { ...f, required: !f.required } : f
                                                        );
                                                        setFields(updatedFields);
                                                    }}
                                                ></span>
                                            </div>
                                        </div>
                                    </>
                                )}

                            </div>
                        </div>
                    )}
                </>
            )}
        </div >
    );
};

export default FormBuilder;