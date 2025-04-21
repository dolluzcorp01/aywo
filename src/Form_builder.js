import React, { useState, useEffect } from "react";
import { Rnd } from "react-rnd";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { useNotification } from "./NotificationContext";
import {
    FaFont, FaEnvelope, FaHashtag, FaList, FaCheckSquare, FaCaretDown,
    FaCalendarAlt, FaAlignLeft, FaFileAlt, FaRegTrashAlt, FaRuler, FaTable,
    FaToggleOn, FaTh, FaCheck, FaImage, FaBoxes, FaGripHorizontal, FaSearch,
    FaGripVertical, FaCog, FaClone, FaExchangeAlt, FaHeading, FaChevronUp, FaChevronDown,
    FaClock, FaRegClock, FaCalendarCheck, FaSortNumericDown, FaStar, FaSlidersH, FaSmile,
    FaEquals, FaBars, FaMapMarkerAlt
} from "react-icons/fa";
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
    "Choice matrix": <FaGripHorizontal />,
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
    "Location": <FaMapMarkerAlt />,
    "Document Type": <FaFileAlt />,
};

const FormBuilder = () => {
    const [fieldTypeMenu, setFieldTypeMenu] = useState(null); // stores id of field and position

    const [formBgColor, setFormBgColor] = useState("lightgray");
    const [formColor, setformColor] = useState("white");

    const [searchTerm, setSearchTerm] = useState("");
    const [fields, setFields] = useState([]);
    const [lastPosition, setLastPosition] = useState({ x: 50, y: 80 });
    const location = useLocation();

    const [submitBtnY, setSubmitBtnY] = useState(500);
    const [submitBtnHeight, setSubmitBtnHeight] = useState(50);

    const [showCustomize, setShowCustomize] = useState(true);
    const isEditableForm = /^\/form-builder\/form-\d+$/.test(location.pathname); // Checks if URL matches /form-builder/form-{number}
    const [lastFieldSize, setLastFieldSize] = useState({ width: 200, height: 50 });

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { formId } = useParams();


    const [selectedFieldId, setSelectedFieldId] = useState(null);


    useEffect(() => {
        const handleClickOutside = () => setFieldTypeMenu(null);
        window.addEventListener("click", handleClickOutside);
        return () => window.removeEventListener("click", handleClickOutside);
    }, []);

    const handleFieldClick = (id) => {
        setSelectedFieldId(id === selectedFieldId ? null : id);
    };

    const openSettings = (id) => {
        console.log("Open settings for", id);
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
        axios.get("http://localhost:5000/api/leftnavbar/get-user-profile", { withCredentials: true })
            .then((res) => {
                if (!res.data?.user_id) throw new Error("Unauthorized");
                setProfile(res.data);
            })
            .catch(() => navigate("/login"))
            .finally(() => setLoading(false));
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

    useEffect(() => {
        const scrollToBottom = () => {
            const body = document.querySelector('.form-body');
            if (body) {
                body.scrollTo({
                    top: body.scrollHeight,
                    behavior: 'smooth'
                });
            }
        };

        scrollToBottom();
    }, [fields]);

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
            case "Slider":
                newField.min = 1;
                newField.max = 5;
                break;
            case "Choice matrix":
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
                break;
            case "Date Range":
                newField.range = { from: "", to: "" };
                break;
            case "Picture":
                newField.file = null;
                break;
            default:
                break;
        }

        setFields([...fields, newField]);
    };

    const renderField = (field) => {
        const commonProps = {
            className: "form-control",
            placeholder: field.label
        };

        switch (field.type) {
            case "Short Answer":
                return <input type="text" {...commonProps} />;
            case "Email":
                return <input type="email" {...commonProps} />;
            case "Number":
                return <input type="number" {...commonProps} />;
            case "Date Picker":
                return <input type="date" {...commonProps} />;
            case "Time Picker":
                return <input type="time" {...commonProps} />;
            case "Date Time Picker":
                return <input type="datetime-local" {...commonProps} />;
            case "Date Range":
                return (
                    <div className="d-flex gap-2">
                        <input type="date" className="form-control" placeholder="From" />
                        <input type="date" className="form-control" placeholder="To" />
                    </div>
                );
            case "Paragraph":
            case "Long Answer":
                return <textarea {...commonProps}></textarea>;
            case "Dropdown":
                return (
                    <select {...commonProps}>
                        {field.options.map((opt, idx) => (
                            <option key={idx}>{opt}</option>
                        ))}
                    </select>
                );
            case "Multiple Select":
                return (
                    <select {...commonProps} multiple>
                        {(field.options || []).map((opt, idx) => (
                            <option key={idx}>{opt}</option>
                        ))}
                    </select>
                );
            case "Switch":
                return (
                    <div className="form-check form-switch">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id={`switch-${field.id}`}
                            name={`switch-${field.id}`}
                        />
                    </div>
                );
            case "Choice Matrix":
                return (
                    <div className="table-responsive">
                        <table className="table table-bordered">
                            <thead>
                                <tr>
                                    <th></th>
                                    {field.columns && field.columns.length > 0 ? field.columns.map((col, colIdx) => (
                                        <th key={colIdx}>{col}</th>
                                    )) : null}
                                </tr>
                            </thead>
                            <tbody>
                                {field.rows && field.rows.length > 0 ? field.rows.map((row, rowIdx) => (
                                    <tr key={rowIdx}>
                                        <td>{row}</td>
                                        {field.columns && field.columns.length > 0 ? field.columns.map((col, colIdx) => (
                                            <td key={colIdx}>
                                                <input
                                                    type="radio"
                                                    name={`matrix_${field.id}_row_${rowIdx}`}
                                                    value={col}
                                                />
                                            </td>
                                        )) : null}
                                    </tr>
                                )) : null}
                            </tbody>
                        </table>
                    </div>
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
                        <input type="checkbox" className="form-check-input" id={`checkbox-${field.id}-${idx}`} />
                        <label className="form-check-label" htmlFor={`checkbox-${field.id}-${idx}`}>{opt}</label>
                    </div>
                ));
            case "Multiple Choice":
                return field.options.map((opt, idx) => (
                    <div key={idx} className="form-check">
                        <input
                            type="radio"
                            className="form-check-input"
                            name={`field_${field.id}`}
                            id={`radio-${field.id}-${idx}`}
                        />
                        <label className="form-check-label" htmlFor={`radio-${field.id}-${idx}`}>{opt}</label>
                    </div>
                ));
            case "Picture":
                return <input type="file" accept="image/*" className="form-control-file" />;
            case "Ranking":
                return (
                    <ol>
                        {field.options.map((opt, idx) => (
                            <li key={idx}>{opt}</li>
                        ))}
                    </ol>
                );
            case "Star Rating":
                return (
                    <div>
                        {[...Array(field.max || 5)].map((_, i) => (
                            <span key={i} style={{ fontSize: "20px", color: "#f5c518" }}>★</span>
                        ))}
                    </div>
                );
            case "Slider":
                return (
                    <input type="range" min={field.min} max={field.max} className="form-range" />
                );
            case "Opinion Scale":
                return (
                    <div className="d-flex gap-2 align-items-center">
                        {[...Array((field?.max ?? 5) - (field?.min ?? 1) + 1)].map((_, i) => {
                            const val = field.min + i;
                            return (
                                <label key={val}>
                                    <input type="radio" name={`opinion_${field.id}`} /> {val}
                                </label>
                            );
                        })}
                    </div>
                );
            case "Heading":
                return <h3>{field.label}</h3>;
            case "Banner":
                return <div className="banner">{field.label}</div>;
            default:
                return <input type="text" {...commonProps} />;
        }
    };

    if (loading) return <p>Loading...</p>;

    const FieldButton = ({ type, section }) => {
        const getColor = () => {
            if (section === "Frequently used") return "#28a745";
            if (section === "Display text") return "#6c757d";
            if (section === "Choices") return "#F59E0B";
            if (section === "Time") return "#A855F7";
            if (section === "Rating & Ranking") return "#e83e8c";
            if (section === "Text") return "#28a745";
            if (section === "Contact Info") return "rgb(20, 184, 166)";
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

    return (
        <div className="form-builder">
            <div className="sidebar">
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
                            {["Email", "Phone Number", "Location"]
                                .filter(type => type.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map(type => <FieldButton key={type} type={type} section="Contact Info" />)}
                        </div>
                    </div>

                    <div className="field-group mt-1">
                        <h4>Contact Info</h4>
                        <div className="field-grid">
                            {["Email", "Number", "Location", "Document Type"]
                                .filter(type => type.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map(type => <FieldButton key={type} type={type} section="Contact Info" />)}
                        </div>
                    </div>

                </div>
            </div>

            <div className="form-container">

                <div className="form-body" style={{ backgroundColor: formBgColor }}>
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
                                                            <label>{field.label}</label>
                                                            {renderField(field)}
                                                        </div>

                                                        {selectedFieldId === field.id && (
                                                            <div className="field-actions">
                                                                <button
                                                                    onClick={() => openSettings(field.id)}
                                                                    data-tooltip-title="Open field settings"
                                                                >
                                                                    <FaCog />
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
            </div>

        </div >
    );
};

export default FormBuilder;