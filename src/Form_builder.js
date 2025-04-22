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
    const isEditableForm = /^\/form-builder\/form-\d+$/.test(location.pathname); // Checks if URL matches /form-builder/form-{number}
    const [lastFieldSize, setLastFieldSize] = useState({ width: 200, height: 50 });

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { formId } = useParams();

    const [selectedFieldId, setSelectedFieldId] = useState(null);
    const [customizeVisible, setCustomizeVisible] = useState(false);


    useEffect(() => {
        const handleClickOutside = () => setFieldTypeMenu(null);
        window.addEventListener("click", handleClickOutside);
        return () => window.removeEventListener("click", handleClickOutside);
    }, []);

    const handleFieldClick = (id) => {
        setSelectedFieldId(id === selectedFieldId ? null : id);
        setCustomizeVisible(true);
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
                    <Select
                        isMulti
                        options={field.options.map(opt => ({ value: opt, label: opt }))}
                        className="basic-multi-select"
                        classNamePrefix="select"
                        placeholder={field.label}
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
                                    {field.columns?.map((col, colIdx) => (
                                        <th key={colIdx} className="Matrix-col">{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {field.rows?.map((row, rowIdx) => (
                                    <tr key={rowIdx}>
                                        <td className="Matrix-row">{row}</td>
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

                            // Update options for the current field
                            const updatedFields = fields.map(f =>
                                f.id === field.id ? { ...f, options: reordered } : f
                            );
                            setFields(updatedFields);
                        }}
                    >
                        <Droppable droppableId={`ranking-${field.id}`}>
                            {(provided) => (
                                <ol {...provided.droppableProps} ref={provided.innerRef} className="ranking-list">
                                    {field.options.map((opt, idx) => (
                                        <Draggable key={opt} draggableId={opt} index={idx}>
                                            {(provided) => (
                                                <li
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className="ranking-item"
                                                >
                                                    {opt}
                                                </li>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </ol>
                            )}
                        </Droppable>
                    </DragDropContext>
                );
            case "Star Rating":
                return (
                    <div
                        onMouseLeave={() => setHovered(null)} // reset on mouse leave
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
                                    transition: "color 0.2s"
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
                            <select
                                className="form-control"
                                value={field.state || ""}
                                onChange={(e) => {
                                    const updatedFields = fields.map(f =>
                                        f.id === field.id ? { ...f, state: e.target.value } : f
                                    );
                                    setFields(updatedFields);
                                }}
                            >
                                <option value="">State / Province</option>
                                <option value="CA">California</option>
                                <option value="TX">Texas</option>
                                <option value="NY">New York</option>
                                {/* Add more states as needed */}
                            </select>
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
                        <div style={{ display: "flex", gap: "12px" }}>
                            {field.options.map((opt, idx) => (
                                <div key={opt.id} style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "8px", position: "relative" }}>
                                    <div
                                        style={{
                                            width: "150px",
                                            height: "100px",
                                            backgroundColor: "#f3f3f3",
                                            backgroundImage: opt.image ? `url(${opt.image})` : undefined,
                                            backgroundSize: "cover",
                                            backgroundPosition: "center",
                                            borderRadius: "4px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            position: "relative"
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
                            style={{ marginTop: "10px", color: "#2563eb", textDecoration: "underline", background: "none", border: "none" }}
                        >
                            Add option
                        </button>
                    </div>
                );
            case "Divider":
                return (
                    <div
                        onClick={() => {
                            // You can add any behavior here on click if necessary
                        }}
                        style={{
                            borderTop: "1px solid lightgray",
                            margin: "20px 0"
                        }}
                    ></div>
                );
            case "Image":
                return (
                    <div className="media-preview-wrapper">
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
                                        f.id === field.id ? { ...f, file } : f
                                    );
                                    setFields(updatedFields);
                                }
                            }}
                            className="form-control mt-2"
                        />

                        <div className="mt-2">
                            <label>Size: {field.previewSize}px</label>
                            <input
                                type="range"
                                min="100"
                                max="600"
                                step="10"
                                value={field.previewSize || 200}
                                onChange={(e) => {
                                    const updatedFields = fields.map(f =>
                                        f.id === field.id ? { ...f, previewSize: parseInt(e.target.value) } : f
                                    );
                                    setFields(updatedFields);
                                }}
                                className="form-range"
                            />
                        </div>
                    </div>
                );
            case "Video":
                return (
                    <div className="media-preview-wrapper">
                        {field.file ? (
                            <video
                                controls
                                style={{
                                    width: `${field.previewSize}px`,
                                    height: `${field.previewSize * 0.6}px`,
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
                                        f.id === field.id ? { ...f, file } : f
                                    );
                                    setFields(updatedFields);
                                }
                            }}
                            className="form-control mt-2"
                        />

                        <div className="mt-2">
                            <label>Size: {field.previewSize}px</label>
                            <input
                                type="range"
                                min="100"
                                max="600"
                                step="10"
                                value={field.previewSize || 200}
                                onChange={(e) => {
                                    const updatedFields = fields.map(f =>
                                        f.id === field.id ? { ...f, previewSize: parseInt(e.target.value) } : f
                                    );
                                    setFields(updatedFields);
                                }}
                                className="form-range"
                            />
                        </div>
                    </div>
                );
            case "PDF":
                return (
                    <div className="media-preview-wrapper">
                        {field.file ? (
                            <embed
                                src={URL.createObjectURL(field.file)}
                                type="application/pdf"
                                width={`${field.previewSize}px`}
                                height={`${field.previewSize * 1.2}px`}
                                style={{ border: "1px solid #ccc", borderRadius: "8px" }}
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
                                        f.id === field.id ? { ...f, file } : f
                                    );
                                    setFields(updatedFields);
                                }
                            }}
                            className="form-control mt-2"
                        />

                        <div className="mt-2">
                            <label>Size: {field.previewSize}px</label>
                            <input
                                type="range"
                                min="100"
                                max="600"
                                step="10"
                                value={field.previewSize || 200}
                                onChange={(e) => {
                                    const updatedFields = fields.map(f =>
                                        f.id === field.id ? { ...f, previewSize: parseInt(e.target.value) } : f
                                    );
                                    setFields(updatedFields);
                                }}
                                className="form-range"
                            />
                        </div>
                    </div>
                );
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
                        <button
                            onClick={() => setCustomizeVisible(false)}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '1rem',
                                marginRight: '10px',
                                cursor: 'pointer',
                                color: 'black',
                            }}
                            aria-label="Close"
                        >
                            <FaTimes />
                        </button>
                        <h4 style={{ fontWeight: '500', fontSize: '1.125rem', margin: 0 }}>
                            {fields.find(f => f.id === selectedFieldId)?.type} settings
                        </h4>
                    </div>

                    <div>
                        <label>Label</label>
                        <div style={{ color: "#aaa", fontSize: ".875rem", marginBottom: "10px" }}>
                            Click text on page to modify
                        </div>

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

                        <div className="form-check form-switch mt-2">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                checked={fields.find(f => f.id === selectedFieldId)?.required || false}
                                onChange={() => {
                                    const updatedFields = fields.map(f =>
                                        f.id === selectedFieldId ? { ...f, required: !f.required } : f
                                    );
                                    setFields(updatedFields);
                                }}
                            />
                            <label className="form-check-label">Required</label>
                        </div>

                        <div className="form-check form-switch">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                checked={fields.find(f => f.id === selectedFieldId)?.halfWidth || false}
                                onChange={() => {
                                    const updatedFields = fields.map(f =>
                                        f.id === selectedFieldId ? { ...f, halfWidth: !f.halfWidth } : f
                                    );
                                    setFields(updatedFields);
                                }}
                            />
                            <label className="form-check-label">Half width</label>
                        </div>
                    </div>
                </div>
            )
            }

        </div >
    );
};

export default FormBuilder;