import Swal from "sweetalert2";
import { useNotification } from "./NotificationContext"; 
import React, { useState } from "react";
import axios from "axios";
import "./Form_builder.css";

const FormBuilder = () => {
    const [formTitle, setFormTitle] = useState("Untitled Form");
    const [fields, setFields] = useState([]);
    const { setShowNotification } = useNotification();

    const addField = (type) => {
        setFields([...fields, { type, label: "", id: Date.now() }]);
    };

    const saveForm = async () => {
        if (!formTitle.trim()) {
            Swal.fire("Error", "Form title cannot be empty.", "error");
            return;
        }

        try {
            await axios.post("http://localhost:5000/api/form_builder/save-form",
                { title: formTitle, fields },
                { withCredentials: true }  // ✅ Ensure cookies (JWT) are sent
            );

            Swal.fire("Success!", "Form saved successfully!", "success");
             setShowNotification(true); // ✅ Show notification in LeftNavbar  
        } catch (error) {
            console.error("Error saving form:", error);

            if (error.response && error.response.status === 400) {
                Swal.fire("Duplicate Title", "A form with this title already exists. Please choose a different name.", "warning");
            } else {
                Swal.fire("Error", "Failed to save form. Please try again.", "error");
            }
        }
    };

    return (
        <div className="form-builder-container">
            <input
                className="form-title-input"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
            />
            <button onClick={() => addField("text")}>Add Text Field</button>
            <button onClick={() => addField("dropdown")}>Add Dropdown</button>
            <button onClick={saveForm}>Save Form</button>

            {fields.map((field) => (
                <div key={field.id} className="input-field">
                    <label>{field.type} Field:</label>
                    <input type="text" placeholder={`Enter ${field.type}`} />
                </div>
            ))}

        </div>
    );
};

export default FormBuilder;
