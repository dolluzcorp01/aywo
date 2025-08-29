import React, { useState, useEffect } from "react";
import {
    FaBell,
    FaLink,
    FaCog,
    FaLock,
    FaGlobe,
    FaGraduationCap,
    FaCode,
    FaChartLine,
    FaEnvelope
} from "react-icons/fa";
import Swal from "sweetalert2"; // for confirmation
import "./Settings.css";

const Settings = () => {
    const [isWorkflowOn, setIsWorkflowOn] = useState(false);
    const [workflowId, setWorkflowId] = useState(null); // store created workflow id

    const getFormId = () => {
        const match = window.location.pathname.match(/form-(\d+)/);
        return match ? match[1] : null;
    };

    useEffect(() => {
        fetchWorkflows();
    }, []);

    const fetchWorkflows = async () => {
        const formId = getFormId();
        if (!formId) return;

        try {
            const res = await fetch(`/api/form_builder/workflows/${formId}`, {
                credentials: "include",
            });
            const data = await res.json();

            if (Array.isArray(data) && data.length > 0) {
                // 🔍 Find "Thank you email" workflow
                const thankYouWorkflow = data.find(
                    (wf) => wf.workflow_name === "Thank you email" && !wf.delete_at
                );

                if (thankYouWorkflow) {
                    setWorkflowId(thankYouWorkflow.id);
                    setIsWorkflowOn(true);
                } else {
                    setWorkflowId(null);
                    setIsWorkflowOn(false);
                }
            } else {
                setWorkflowId(null);
                setIsWorkflowOn(false);
            }
        } catch (err) {
            console.error("Error fetching workflows:", err);
        }
    };

    // ✅ Create workflow
    const handleCreateWorkflow = async () => {
        const formId = getFormId();
        if (!formId) {
            Swal.fire("Error", "Form ID not found in URL", "error");
            return;
        }

        try {
            const res = await fetch("/api/form_builder/workflows/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    form_id: formId,
                    workflow_name: "Thank you email",
                    workflow_delay_time: 30,
                }),
                credentials: "include",
            });

            const data = await res.json();
            if (res.ok) {
                Swal.fire("Success", "Workflow created successfully!", "success");
                setWorkflowId(data.id || null); // backend should return id
                setIsWorkflowOn(true);
            } else {
                Swal.fire("Error", data.error || "Failed to create workflow", "error");
            }
        } catch (error) {
            console.error("Error creating workflow:", error);
            Swal.fire("Error", "Server error while creating workflow", "error");
        }
    };

    // ✅ Delete workflow
    const handleDeleteWorkflow = async () => {
        if (!workflowId) {
            Swal.fire("Error", "No workflow found to delete", "error");
            return;
        }

        try {
            const res = await fetch(`/api/form_builder/workflows/${workflowId}`, {
                method: "DELETE",
                credentials: "include",
            });

            const data = await res.json();
            if (res.ok) {
                Swal.fire("Deleted!", "Workflow has been deleted.", "success");
                setWorkflowId(null);
                setIsWorkflowOn(false);
            } else {
                Swal.fire("Error", data.error || "Failed to delete workflow", "error");
            }
        } catch (error) {
            console.error("Error deleting workflow:", error);
            Swal.fire("Error", "Server error while deleting workflow", "error");
        }
    };

    // ✅ Toggle handler
    const handleSwitchToggle = (e) => {
        if (e.target.checked) {
            handleCreateWorkflow();
        } else {
            handleDeleteWorkflow();
        }
    };

    return (
        <div className="settings-container">
            {/* Sidebar */}
            <div className="settings-sidebar">
                <h2 className="settings-title">
                    <FaCog className="settings-icon" /> Settings
                </h2>
                <ul>
                    <li className="active">
                        <FaBell /> Notifications
                    </li>
                    <li><FaLink /> URL parameters</li>
                    <li><FaCog /> Form behavior</li>
                    <li><FaLock /> Access</li>
                    <li><FaGlobe /> Language</li>
                    <li><FaGraduationCap /> Quiz mode</li>
                    <li><FaCode /> Custom code <span className="badge business">Business</span></li>
                    <li><FaChartLine /> Conversion kit <span className="badge addon">Add-on</span></li>
                </ul>
            </div>

            {/* Content */}
            <div className="settings-content">
                <h3 className="content-title">Notifications</h3>

                {/* Tabs */}
                <div className="settings-tabs">
                    <span className="tab active">General</span>
                </div>

                {/* Notification card */}
                <div className="notification-card">
                    <div className="notification-content">
                        <FaEnvelope className="notification-icon" />
                        <div className="notification-text">
                            <strong>Self-email notifications</strong>
                            <p>Get an email whenever your form is submitted</p>
                        </div>
                    </div>

                    <div className="notification-switch">
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={isWorkflowOn}
                                onChange={handleSwitchToggle}
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
