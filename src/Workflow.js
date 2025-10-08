import React, { useState, useEffect } from "react";
import "./Workflow.css";
import { FaEnvelope, FaClock, FaDownload, FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";

const Workflow = () => {
    const [delayTime, setDelayTime] = useState(30);
    const [loading, setLoading] = useState(true);
    const [activeWorkflow, setActiveWorkflow] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    const workflows = [
        {
            id: 1,
            title: "Thank you email",
            description: "Send personalized email after form submission",
            icons: [
                { el: <FaDownload />, color: "#3b82f6" },
                { el: <FaEnvelope />, color: "#6366f1" }
            ],
            hasDelay: false
        },
        {
            id: 2,
            title: "Send email after delay",
            description: "Wait to send a custom email until a certain time",
            icons: [
                { el: <FaDownload />, color: "#3b82f6" },
                { el: <FaClock />, color: "#f59e0b" },
                { el: <FaEnvelope />, color: "#6366f1" }
            ],
            hasDelay: true
        },
    ];

    const getFormId = () => {
        const match = window.location.pathname.match(/form-(\d+)/);
        return match ? match[1] : null;
    };

    // 🔹 Fetch workflow data on mount
    useEffect(() => {
        fetchWorkflows();
    }, []);

    const fetchWorkflows = async () => {
        const formId = getFormId();
        if (!formId) return;

        try {
            const res = await fetch(`/api/form_builder/workflows/${formId}`, { credentials: "include" });
            const data = await res.json();

            if (data.length > 0) {
                setActiveWorkflow(data[0]); // only one workflow is active
                if (data[0].workflow_name === "Send email after delay") {
                    setDelayTime(data[0].workflow_delay_time || 30);
                }
            }
        } catch (err) {
            console.error("Error fetching workflows:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleWorkflowClick = async (workflowName, hasDelay) => {
        const formId = getFormId();
        if (!formId) {
            Swal.fire("Error", "Form ID not found in URL", "error");
            return;
        }

        const result = await Swal.fire({
            title: `Are you sure?`,
            text: `Do you want to create "${workflowName}" workflow?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Yes, create it",
            cancelButtonText: "Cancel",
        });

        if (result.isConfirmed) {
            try {
                const body = {
                    form_id: formId,
                    workflow_name: workflowName,
                };

                if (hasDelay) {
                    body.workflow_delay_time = delayTime;
                }

                const response = await fetch("/api/form_builder/workflows/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                    credentials: "include",
                });

                const data = await response.json();

                if (response.ok) {
                    Swal.fire("Success", "Workflow created successfully!", "success");
                    fetchWorkflows();
                } else {
                    Swal.fire("Error", data.error || "Failed to create workflow", "error");
                }
            } catch (error) {
                console.error(error);
                Swal.fire("Error", "Server error while creating workflow", "error");
            }
        }
    };

    const handleDeleteWorkflow = async (workflowId) => {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: "Do you want to delete this workflow?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it",
            cancelButtonText: "Cancel",
        });

        if (!result.isConfirmed) return;

        try {
            const res = await fetch(`/api/form_builder/workflows/${workflowId}`, {
                method: "DELETE",
                credentials: "include",
            });

            const data = await res.json();

            if (res.ok) {
                Swal.fire("Deleted!", "Workflow has been deleted.", "success");
                setDelayTime(30);
                setActiveWorkflow(null); // ✅ Clear active workflow
            } else {
                Swal.fire("Error", data.error || "Failed to delete workflow", "error");
            }
        } catch (error) {
            console.error("Error deleting workflow:", error);
            Swal.fire("Error", "Server error while deleting workflow", "error");
        }
    };

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
                    The Aywo editor works best on larger screens
                </h2>
                <p style={{ color: "#6B7280", fontWeight: "bolder" }}>
                    Note that the forms you build <u>will work</u> on mobile devices!
                </p>
            </div>
        </div>
    );

    if (loading) return <p>Loading workflows...</p>;

    return (
        <div className="workflow-page" style={{ backgroundColor: isMobile ? "#fff" : "#0f172a" }}>
            {isMobile ? (
                <MobileWarning />
            ) : (<>
                <div className="workflow-header">
                    <button className="tab-btn active">
                        Workflows <span className="count">0</span>
                    </button>
                </div>
                <p className="workflow-subtitle">
                    Automate your forms with workflows <a href="#">Help?</a>
                </p>

                <div className="workflow-content">
                    {activeWorkflow && (
                        <>
                            <h3 className="section-title">Your Workflow</h3>
                            <div className="your-workflows">
                                <div className="workflow-card active">
                                    <div className="icons-row">
                                        <div className="icons">
                                            {activeWorkflow.workflow_name === "Send email after delay" && (
                                                <>
                                                    <span className="icon" style={{ backgroundColor: "#3b82f6" }}><FaDownload /></span>
                                                    <span className="icon" style={{ backgroundColor: "#f59e0b" }}><FaClock /></span>
                                                    <span className="icon" style={{ backgroundColor: "#6366f1" }}><FaEnvelope /></span>
                                                </>
                                            )}
                                            {activeWorkflow.workflow_name === "Thank you email" && (
                                                <>
                                                    <span className="icon" style={{ backgroundColor: "#3b82f6" }}><FaDownload /></span>
                                                    <span className="icon" style={{ backgroundColor: "#6366f1" }}><FaEnvelope /></span>
                                                </>
                                            )}
                                        </div>

                                        {/* 🔹 Trash icon on right side */}
                                        <FaTrash
                                            className="delete-icon"
                                            onClick={() => handleDeleteWorkflow(activeWorkflow.id)}
                                        />
                                    </div>

                                    <h4>{activeWorkflow.workflow_name}</h4>
                                    {activeWorkflow.workflow_delay_time && (
                                        <p>Delay: {activeWorkflow.workflow_delay_time} min</p>
                                    )}
                                </div>

                            </div>
                        </>
                    )}
                    <h3 className="section-title">Notifications</h3>

                    <div className="workflow-cards">
                        {workflows.map((w) => (
                            <div
                                className="workflow-card"
                                key={w.id}
                                style={{ cursor: "pointer" }}
                                onClick={() => handleWorkflowClick(w.title, w.hasDelay)}
                            >
                                <div className="icons-row">
                                    <div className="icons">
                                        {w.icons.map((icon, i) => (
                                            <span
                                                key={i}
                                                className="icon"
                                                style={{ backgroundColor: icon.color }}
                                            >
                                                {icon.el}
                                            </span>
                                        ))}
                                    </div>

                                    {w.hasDelay && (
                                        <input
                                            type="number"
                                            min="10"
                                            max="60"
                                            value={delayTime}
                                            onClick={(e) => e.stopPropagation()} // prevent card click
                                            onChange={(e) => {
                                                let val = Number(e.target.value);
                                                if (val < 10) val = 10;
                                                if (val > 60) val = 60;
                                                setDelayTime(val);
                                            }}
                                            className="delay-input"
                                        />
                                    )}
                                </div>
                                <h4>{w.title}</h4>
                                <p>{w.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </>)}
        </div>
    );
};

export default Workflow;
