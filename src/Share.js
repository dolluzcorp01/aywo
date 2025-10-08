import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { apiFetch } from "./utils/api";
import share_pg_img from "./assets/img/share-pg-img.png";
import Swal from "sweetalert2";
import confetti from 'canvas-confetti';
import './Share.css';

const Share = () => {
    const location = useLocation();
    const [formData, setFormData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    const [toastMessage, setToastMessage] = useState("");

    const match = location.pathname.match(/\/share\/form-(\d+)/);
    const formId = match ? match[1] : null;

    useEffect(() => {
        if (!formId) return;

        const fetchForms = async () => {
            try {
                const response = await apiFetch(`/api/form_builder/get-forms?sortBy=created_at_desc`, {
                    method: "GET",
                    credentials: "include",
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.message || "Failed to fetch forms");
                }

                const data = await response.json();
                const thisForm = data.find(f => f.form_id === Number(formId));
                setFormData(thisForm || null);
            } catch (error) {
                console.error("Error fetching forms:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchForms();
    }, [formId]);

    const publishForm = async () => {
        if (!formId) {
            Swal.fire("Error", "Please save the form before publishing.", "error");
            return;
        }

        try {
            // ✅ Send publish request
            const response = await apiFetch(`/api/form_builder/publish-form/${formId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ published: true }),
                credentials: "include"
            });

            if (!response.ok) {
                throw new Error('Failed to publish form');
            }

            setFormData(prev => ({ ...prev, published: 1 }));

            // ✅ Construct public URL
            const publicUrl = `${window.location.origin}/forms/form-${formId}/page-start`;

            // ✅ Copy link to clipboard
            try {
                await navigator.clipboard.writeText(publicUrl);
                console.log("Link copied to clipboard");
            } catch (err) {
                console.warn("Clipboard copy failed:", err);
            }

            confetti({
                particleCount: 200,
                spread: 200,
                origin: { y: 0.6 }
            });

        } catch (error) {
            console.error("Error publishing form:", error);
            Swal.fire("Error", "Failed to publish the form.", "error");
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

    if (loading) return <p>Loading form data...</p>;
    if (!formData) return <p>Form not found</p>;

    if (formData.published !== 1) {
        return (
            <div className='share-container'>
                <div className="share-page-unpublished">
                    <div className="share-icon">
                        <i className="fa-solid fa-share-nodes"></i>
                    </div>

                    {/* New image below the share icon */}
                    <img
                        src={share_pg_img}
                        alt="Share Illustration"
                        className="share-page-image"
                    />

                    <h2>Publish your form to share it with others</h2>
                    <p>You can keep changing it after publishing.</p>
                    <button className="publish-btn" onClick={() => publishForm()}>⚡ Publish</button>
                </div>
            </div>
        );
    }

    // ✅ Published version
    return (
        <div className="share-container">
            {isMobile ? (
                <MobileWarning />
            ) : (<>
                <div className="share-page-published">
                    <div className="share-header">
                        <div className="share-icon">
                            <i className="fa-solid fa-share-nodes"></i>
                        </div>
                        <h2>Share</h2>
                        <span className="ready-badge">✅ Ready to share</span>
                    </div>

                    <p style={{ color: "rgb(75 85 99)", fontSize: "1.125rem" }}>
                        Publish your form to share it with others
                    </p>

                    <div className="share-card">
                        <div className="share-url-container">
                            <input
                                type="text"
                                className="share-url-input"
                                value={
                                    formData
                                        ? `${window.location.origin}/forms/form-${formData.form_id}/page-start`
                                        : ''
                                }
                                readOnly
                            />
                            <button
                                className="copy-btn"
                                onClick={() => {
                                    const shareUrl = `${window.location.origin}/forms/form-${formData.form_id}/page-start`;
                                    navigator.clipboard.writeText(shareUrl);

                                    setToastMessage("Copied link to clipboard!");
                                    // Hide after 5 sec
                                    setTimeout(() => setToastMessage(""), 5000);
                                }}
                            >
                                <i className="fa-solid fa-file-import fa-flip-horizontal"></i> Copy
                            </button>

                            {toastMessage && (
                                <div className="toast-popup">
                                    <div className="toast-icon-container">
                                        <span className="toast-icon"><i className="fa-solid fa-circle-check"></i></span>
                                    </div>
                                    <div className="toast-text">{toastMessage}</div>
                                    <button className="toast-close" onClick={() => setToastMessage("")}>
                                        &times;
                                    </button>
                                </div>
                            )}

                        </div>

                        <div className="share-social-icons">
                            <i className="fa-solid fa-qrcode"></i>
                            <i className="fa-brands fa-twitter"></i>
                            <i className="fa-brands fa-facebook"></i>
                            <i className="fa-brands fa-linkedin"></i>
                            <i className="fa-brands fa-reddit"></i>
                        </div>
                    </div>
                </div>
            </>)}
        </div>
    );
};

export default Share;
