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
            // ✅ Fetch form pages directly
            const res = await fetch(`/api/form_builder/get-form-pages/${formId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include"
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to fetch pages");
            }

            const pages = data.pages || [];

            if (pages.length === 0) {
                Swal.fire("Error", "No pages found for this form.", "error");
                return;
            }

            // ✅ Sort pages by sort_order to get the first page number
            const firstPage = pages.reduce((min, page) =>
                page.sort_order < min.sort_order ? page : min, pages[0]
            );
            const firstPageNumber = firstPage?.page_number || 1;

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
            const publicUrl = `${window.location.origin}/forms/form-${formId}/page-${firstPageNumber}`;

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
        <div className='share-container'>
            <div className="share-page-published">
                <h2>{formData.title}</h2>
                <p style={{ color: 'green' }}>✅ This form is published</p>
                {/* Add your published share view here */}
            </div>
        </div>
    );
};

export default Share;
