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
    FaEnvelope,
    FaClock,
    FaCalendarAlt,
    FaRegCommentDots,
    FaRegEdit,
    FaTimes
} from "react-icons/fa";
import Swal from "sweetalert2";
import "./Settings.css";

const Settings = () => {
    const [activeTab, setActiveTab] = useState("notifications"); // 🔹 track sidebar tab
    const [isWorkflowOn, setIsWorkflowOn] = useState(false);
    const [workflowId, setWorkflowId] = useState(null);
    const [isFormClosed, setIsFormClosed] = useState(false);

    const [isCustomMessageOn, setIsCustomMessageOn] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [closedTitle, setClosedTitle] = useState("Form closed to new submissions");
    const [closedDesc, setClosedDesc] = useState("Contact the form owner for more details.");

    const [isOpenDateOn, setIsOpenDateOn] = useState(false);
    const [isExpiryOn, setIsExpiryOn] = useState(false);
    const [isLimitOn, setIsLimitOn] = useState(false);

    const shouldShowCustomMessage = isFormClosed || isOpenDateOn || isExpiryOn || isLimitOn;

    const handleSaveClosedMessage = async () => {
        const formId = getFormId();
        if (!formId) {
            Swal.fire("Error", "Form ID not found in URL", "error");
            return;
        }

        try {
            const res = await fetch("/api/form_builder/forms/update-close-message", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    form_id: formId,
                    close_title: closedTitle,
                    close_description: closedDesc,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                Swal.fire("Success", "Close page updated successfully!", "success");
                setIsModalOpen(false);
            } else {
                Swal.fire("Error", data.error || "Failed to update close page", "error");
            }
        } catch (error) {
            console.error("Error updating close page:", error);
            Swal.fire("Error", "Server error while updating close page", "error");
        }
    };

    const getFormId = () => {
        const match = window.location.pathname.match(/form-(\d+)/);
        return match ? match[1] : null;
    };

    useEffect(() => {
        fetchWorkflows();
        fetchClosedMessage();
    }, []);

    const fetchClosedMessage = async () => {
        const formId = getFormId();
        if (!formId) return;

        try {
            const res = await fetch(`/api/form_builder/forms/${formId}/close-message`, {
                credentials: "include",
            });

            const data = await res.json();

            if (res.ok) {
                setClosedTitle(data.close_title || "Form closed to new submissions");
                setClosedDesc(data.close_description || "Contact the form owner for more details.");
            } else {
                console.error("Error fetching close message:", data.error);
            }
        } catch (err) {
            console.error("Error fetching close message:", err);
        }
    };

    const fetchWorkflows = async () => {
        const formId = getFormId();
        if (!formId) return;

        try {
            const res = await fetch(`/api/form_builder/workflows/${formId}`, {
                credentials: "include",
            });
            const data = await res.json();

            if (Array.isArray(data) && data.length > 0) {
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
                setWorkflowId(data.id || null);
                setIsWorkflowOn(true);
            } else {
                Swal.fire("Error", data.error || "Failed to create workflow", "error");
            }
        } catch (error) {
            console.error("Error creating workflow:", error);
            Swal.fire("Error", "Server error while creating workflow", "error");
        }
    };

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

    const handleSwitchToggle = (e) => {
        if (e.target.checked) {
            handleCreateWorkflow();
        } else {
            handleDeleteWorkflow();
        }
    };

    const handleCloseForm = async (isCurrentlyClosed) => {
        const formId = getFormId();
        const action = isCurrentlyClosed ? "re-open" : "close";

        try {
            const response = await fetch(`/api/form_builder/close-form/${formId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_closed: !isCurrentlyClosed }), // Toggle value
                credentials: "include",
            });

            const data = await response.json();

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: `Form ${action}ed successfully!`,
                    showConfirmButton: false,
                    timer: 1500,
                });

            } else {
                console.error(`Form ${action} failed:`, data.error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: data.error,
                });
            }
        } catch (error) {
            console.error(`Error trying to ${action} form:`, error);
            Swal.fire({
                icon: 'error',
                title: 'Server Error',
                text: `An error occurred while trying to ${action} the form.`,
            });
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
                    <li className={activeTab === "notifications" ? "active" : ""} onClick={() => setActiveTab("notifications")}>
                        <FaBell /> Notifications
                    </li>
                    <li><FaLink /> URL parameters</li>
                    <li><FaCog /> Form behavior</li>
                    <li className={activeTab === "access" ? "active" : ""} onClick={() => setActiveTab("access")}>
                        <FaLock /> Access
                    </li>
                    <li><FaGlobe /> Language</li>
                    <li><FaGraduationCap /> Quiz mode</li>
                    <li><FaCode /> Custom code <span className="badge business">Business</span></li>
                    <li><FaChartLine /> Conversion kit <span className="badge addon">Add-on</span></li>
                </ul>
            </div>

            {/* Content Area */}
            <div className="settings-content">
                {/* Notifications Tab */}
                {activeTab === "notifications" && (
                    <>
                        <h3 className="content-title">Notifications</h3>
                        <div className="settings-tabs">
                            <span className="tab active">General</span>
                        </div>

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
                                        onChange={() => {
                                            handleSwitchToggle();
                                            setIsFormClosed(!isFormClosed);
                                        }}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                        </div>
                    </>
                )}

                {/* Access Tab */}
                {activeTab === "access" && (
                    <>
                        <h3 className="content-title">Access</h3>

                        <div className="notification-card">
                            <div className="notification-content">
                                <FaLock className="notification-icon" />
                                <div className="notification-text">
                                    <strong>Close form</strong>
                                    <p>Close your form to new submissions.</p>
                                </div>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={isFormClosed}
                                    onChange={() => {
                                        handleCloseForm(isFormClosed);
                                        setIsFormClosed(!isFormClosed);
                                    }}
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>

                        <div className="notification-card">
                            <div className="notification-content">
                                <FaClock className="notification-icon" />
                                <div className="notification-text">
                                    <strong>Form open date</strong>
                                    <p>Set a date for your form to become available.</p>
                                </div>
                            </div>
                            <label className="switch">
                                <input type="checkbox"
                                    onChange={() => {
                                        setIsFormClosed(!isFormClosed);
                                    }}
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>

                        <div className="notification-card">
                            <div className="notification-content">
                                <FaCalendarAlt className="notification-icon" />
                                <div className="notification-text">
                                    <strong>Form expiration date</strong>
                                    <p>Close form upon reaching a certain date.</p>
                                </div>
                            </div>
                            <label className="switch">
                                <input type="checkbox"
                                    onChange={() => {
                                        setIsFormClosed(!isFormClosed);
                                    }} />
                                <span className="slider round"></span>
                            </label>
                        </div>

                        <div className="notification-card">
                            <div className="notification-content">
                                <FaChartLine className="notification-icon" />
                                <div className="notification-text">
                                    <strong>Form submission limit</strong>
                                    <p>Close form after reaching a certain number of submissions.</p>
                                </div>
                            </div>
                            <label className="switch">
                                <input type="checkbox"
                                    onChange={() => {
                                        setIsFormClosed(!isFormClosed);
                                    }} />
                                <span className="slider round"></span>
                            </label>
                        </div>

                        {shouldShowCustomMessage && (
                            <div className="notification-card">
                                <div className="notification-content">
                                    <FaRegCommentDots className="notification-icon" />
                                    <div className="notification-text">
                                        <strong>Custom form closed message</strong>
                                        <p>Provide custom messages to show users when the form is closed/expired.</p>

                                        {isCustomMessageOn && (
                                            <button className="edit-close-btn" onClick={() => setIsModalOpen(true)}>
                                                <FaRegEdit style={{ color: "rgb(107 114 128)", fontSize: "1.1rem" }} /> Edit close page
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="notification-switch">
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={isCustomMessageOn}
                                            onChange={(e) => setIsCustomMessageOn(e.target.checked)}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Modal */}
                        {isModalOpen && (
                            <div className="custom-modal-overlay">
                                <div className="custom-modal">
                                    <div className="custom-modal-header">
                                        <h3>Edit close page</h3>
                                        <button
                                            className="custom-close-icon"
                                            onClick={() => setIsModalOpen(false)}
                                        >
                                            <FaTimes style={{ color: "rgb(156 163 175)", fontSize: "1.2rem" }} />
                                        </button>
                                    </div>

                                    <div className="custom-closed-wrapper">
                                        <div className="custom-closed-card">
                                            <FaLock
                                                size={48}
                                                style={{ marginBottom: "1rem", color: "rgb(155, 160, 168)" }}
                                            />

                                            {/* Editable Title */}
                                            <input
                                                type="text"
                                                className="closed-input"
                                                value={closedTitle}
                                                onChange={(e) => setClosedTitle(e.target.value)}
                                            />

                                            {/* Editable Description */}
                                            <textarea
                                                className="closed-textarea"
                                                value={closedDesc}
                                                onChange={(e) => setClosedDesc(e.target.value)}
                                                rows="3"
                                            />
                                        </div>
                                    </div>

                                    <div className="modal-actions">
                                        <button onClick={handleSaveClosedMessage} className="save-btn">
                                            Done
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                    </>
                )}
            </div>
        </div>
    );
};

export default Settings;
