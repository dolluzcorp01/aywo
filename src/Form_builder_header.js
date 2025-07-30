import Swal from "sweetalert2";
import { apiFetch } from "./utils/api";
import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Modal } from 'bootstrap';
import confetti from 'canvas-confetti';
import "./Form_builder_header.css";

const Navbar = styled.nav`
  background-color: #f8f9fa ;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  border-bottom: 1px solid #ddd;
  position: relative;
  min-height: 60px;
`;

const RoundedCircle = styled.span`
  border-radius: 50%;
  text-align: center;
  font-size: 14px;
  line-height: 40px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
`;

const Form_builder_header = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState(null);
    const { formId } = useParams();

    const [profileDetails, setProfileDetails] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const location = useLocation();

    const [formTitle, setFormTitle] = useState("");
    const [renameFormId, setRenameFormId] = useState(null); // NEW

    const [edithistory, setEdithistory] = useState(false);
    const [versionHistory, setVersionHistory] = useState([]);

    const match = location.pathname.match(/\/form-builder\/form-(\d+)\/page-(\w+)/);
    const formIdforfetch = match ? match[1] : null;
    const pageIdforfetch = match ? match[2] : null;

    const preview_pg_match = location.pathname.match(/\/preview\/form-(\d+)\/page-(\d+|end)\/device-(\w+)/);
    const preview_pg_pageId = preview_pg_match ? preview_pg_match[2] : null;

    const [formPages, setFormPages] = useState([]);
    const currentPageId = preview_pg_pageId;
    const device = preview_pg_match ? preview_pg_match[3] : null;

    const [selectedPage, setSelectedPage] = useState(null);

    const [isOpen, setIsOpen] = useState(false);
    useEffect(() => {
        if (formPages.length > 0) {
            const foundPage = formPages.find(p => p.page_number === Number(currentPageId));
            setSelectedPage(foundPage || formPages[0]);
        }
    }, [formPages, currentPageId]);

    const fetchFormPages = async (formId) => {
        try {
            const cleanFormId = formId.replace("form-", "");

            const res = await fetch(`/api/form_builder/get-form-pages/${cleanFormId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include"
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

    useEffect(() => {
        populateProfileDetails();
        fetchFormPages(formId);

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const populateProfileDetails = async () => {
        try {
            const response = await apiFetch('/api/leftnavbar/get-user-profile', {
                method: 'GET',
                credentials: 'include',
            });

            if (response.status === 401) {
                navigate("/login");
                return;
            }

            if (!response.ok) {
                throw new Error('Error fetching profile details');
            }

            const data = await response.json();
            setProfileDetails(data);
        } catch (error) {
            console.error(error);
        }
    };

    function formatDate(datetimeStr) {
        const date = new Date(datetimeStr);
        return date.toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    }

    useEffect(() => {
        let isMounted = true;

        if (formId) {
            apiFetch(`/api/form_builder/${formId}/version-history`, {
                method: "GET",
                credentials: "include",
            })
                .then((response) => response.json())
                .then((data) => {
                    if (isMounted) {
                        setVersionHistory(data);
                    }
                })
                .catch((error) => {
                    Swal.fire("Error", error.message || "Something went wrong", "error");
                });

            return () => {
                isMounted = false;
            };
        }
    }, [formId]);

    useEffect(() => {
        let isMounted = true;
        if (formId) {
            apiFetch(`/api/form_builder/get-forms?formId=${formId}`, {
                method: "GET",
                credentials: "include",
            })
                .then((response) => {
                    if (!response.ok) {
                        return response.text().then((text) => {
                            let errorData;
                            try {
                                errorData = JSON.parse(text);
                            } catch {
                                throw new Error("Invalid error response");
                            }
                        });
                    }

                    // Handle empty response
                    return response.text().then((text) => {
                        if (!text) {
                            throw new Error("Empty response from server");
                        }
                        return JSON.parse(text);
                    });
                })
                .then((data) => {
                    if (isMounted) {
                        setForm(data);
                    }
                })
                .catch((error) => {
                    Swal.fire("Error", error.message || "Something went wrong", "error");
                });

            return () => {
                isMounted = false;
            };
        }
    }, [formId]);

    const handleStarredForm = async (formId, starred) => {
        const newStarredStatus = !starred;

        try {
            const response = await apiFetch(`/api/form_builder/toggle-star/${formId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ starred: newStarredStatus }),
            });

            const result = await response.json();
            if (response.ok) {
                Swal.fire({
                    icon: "success",
                    title: `Form ${newStarredStatus ? "starred" : "unstarred"}!`,
                    timer: 1200,
                    showConfirmButton: false,
                });
            } else {
                Swal.fire("Error", result.error, "error");
            }
        } catch (err) {
            Swal.fire("Error", "Something went wrong", "error");
        }
    };

    const publishForm = async () => {
        if (!formId) {
            Swal.fire("Error", "Please save the form before publishing.", "error");
            return;
        }

        try {
            const cleanFormId = formId.replace("form-", "");

            // ✅ Fetch form pages directly
            const res = await fetch(`/api/form_builder/get-form-pages/${cleanFormId}`, {
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
            const response = await apiFetch(`/api/form_builder/publish-form/${cleanFormId}`, {
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

            // ✅ Construct public URL
            const publicUrl = `${window.location.origin}/forms/form-${cleanFormId}/page-${firstPageNumber}`;

            // ✅ Copy link to clipboard
            if (document.hasFocus()) {
                await navigator.clipboard.writeText(publicUrl);
            } else {
                console.warn("Clipboard copy skipped because the document is not focused.");
            }

            confetti({
                particleCount: 200,
                spread: 200,
                origin: { y: 0.6 }
            });

            // ✅ Success message
            Swal.fire({
                title: "Success!",
                html: `Form published successfully! <br> The link has been copied to clipboard: <br> <b>${publicUrl}</b>`,
                icon: "success"
            });

        } catch (error) {
            console.error("Error publishing form:", error);
            Swal.fire("Error", "Failed to publish the form.", "error");
        }
    };

    const handleRenameSubmit = (formId) => {
        if (!formTitle.trim()) {
            Swal.fire("Error", "Form title cannot be empty.", "error");
            return;
        }

        Swal.fire({
            title: "Confirm Rename",
            text: "Do you want to rename this form?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Yes, Rename",
            cancelButtonText: "Cancel",
        }).then((result) => {
            if (result.isConfirmed) {
                apiFetch(`/api/form_builder/rename-form/${formId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title: formTitle }),
                    credentials: "include",
                })
                    .then((res) => {
                        if (!res.ok) {
                            return res.json().then(err => { throw new Error(err.error || "Failed to rename form"); });
                        }
                        return res.json();
                    })
                    .then(() => {
                        // ✅ Update UI immediately
                        setForm(prev => ({ ...prev, title: formTitle }));

                        // ✅ Close modal
                        const modal = document.getElementById('exampleModalCenter');
                        if (modal) {
                            modal.classList.remove("show");
                            modal.style.display = "none";
                        }
                        document.body.classList.remove("modal-open");
                        document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());

                        Swal.fire("Renamed!", "Your form has been renamed.", "success");
                    })
                    .catch((error) => {
                        console.error("Error renaming form:", error);
                        if (error.message.includes("already exists")) {
                            Swal.fire("Duplicate Title", "A form with this title already exists. Please choose a different name.", "warning");
                        } else {
                            Swal.fire("Error", error.message, "error");
                        }
                    });
            }
        });
    };

    return (
        <Navbar className="form_builder_header">
            <div className="form_builder_header-left">
                <a className="home-icon" href="/home">
                    <i className="fa fa-home"></i>
                </a>

                {edithistory && (
                    <div className="edithistory-modal-backdrop">
                        <div className="edithistory-modal-box">
                            <button className="edithistory-close-btn" onClick={() => setEdithistory(false)}>
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                            <h5 className="edithistory-modal-title">Form edit history</h5>
                            <p>Showing recent versions</p>

                            <div className="version-list">
                                {versionHistory.map((item, idx) => (
                                    <div
                                        className="version-item"
                                        key={idx}
                                        onClick={() => {
                                            navigate(
                                                `/form-builder/form-${formIdforfetch}/page-${pageIdforfetch}?version=${item.fields_version}`
                                            );
                                            setEdithistory(false);
                                        }}
                                        style={{ cursor: "pointer" }} // Optional: show pointer cursor
                                    >
                                        <div className="version-user-icon">P</div>
                                        <div className="version-details">
                                            <span className="user-name">Pavithran VV</span>
                                            <span className="version-time">{formatDate(item.created_at)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {form && (
                    <div className="form_builder_header-form-title-row">
                        <p
                            className="form_builder_header-form-title-text"
                            data-bs-toggle="modal"
                            data-bs-target="#exampleModalCenter"
                            onClick={() => {
                                setFormTitle(form.title);
                                setRenameFormId(form.form_id);
                            }}
                        >
                            {form.title}
                        </p>

                        {form.starred ? (
                            <i
                                className="fa-solid fa-star form-star-icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleStarredForm(form.form_id, form.starred);
                                }}
                                style={{ color: "#ffc738", marginLeft: "5px", fontSize: "0.7rem" }}
                            ></i>
                        ) : null}
                    </div>
                )}

            </div>

            <div className="form_builder_header-center">
                {window.location.pathname.includes("preview") ? (
                    <div className="device-toggle">
                        <span
                            className={`center-nav-btn ${window.location.pathname.includes("device-desktop") ? "active" : ""}`}
                            onClick={() => navigate(`/preview/form-${formId.replace(/^form-/, '')}/page-${preview_pg_pageId}/device-desktop`)}
                        >
                            Desktop
                        </span>
                        <span
                            className={`center-nav-btn ${window.location.pathname.includes("device-mobile") ? "active" : ""}`}
                            onClick={() => navigate(`/preview/form-${formId.replace(/^form-/, '')}/page-${preview_pg_pageId}/device-mobile`)}
                        >
                            Mobile
                        </span>
                    </div>
                ) : (
                    <>
                        <span
                            className={`center-nav-btn ${window.location.pathname.includes("form-builder") ? "active" : ""}`}
                            onClick={() => navigate(`/form-builder/${formId}/page-${form.page_id}`)}
                        >
                            Edit
                        </span>
                        <span
                            className={`center-nav-btn ${window.location.pathname.includes("share") ? "active" : ""}`}
                            onClick={() => navigate(`/share/${formId}`)}
                        >
                            Share
                        </span>
                        <span
                            className={`center-nav-btn ${window.location.pathname.includes("responses") ? "active" : ""}`}
                            onClick={() => navigate(`/responses/${formId}`)}
                        >
                            Results
                        </span>
                    </>
                )}
            </div>

            <div className="form_builder_header-right">
                {window.location.pathname.includes("form-builder") && (
                    <button
                        className="form_builder_header-clock-btn"
                        style={{ marginLeft: "-5px" }}
                        onClick={() => setEdithistory(true)}
                    >
                        <i className="fa-regular fa-clock"></i>
                    </button>
                )}

                {!window.location.pathname.includes("preview") && (
                    <div
                        className="form_builder_header-profile-section"
                        style={{ marginRight: "5px" }}
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                        {profileDetails ? (
                            <>
                                <RoundedCircle
                                    className="form_builder_header-profile-img"
                                    style={{
                                        backgroundColor: profileDetails.profile_color,
                                        color: 'white',
                                        fontSize: '18px',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {profileDetails.profile_letters}
                                </RoundedCircle>
                            </>
                        ) : (
                            "Loading..."
                        )}
                    </div>
                )}

                <div className="action-btns">
                    {(window.location.pathname.includes("form-builder") || window.location.pathname.includes("share")) && (
                        <button
                            className="form_builder_header-preview-btn"
                            onClick={() => navigate(`/preview/${formId}/page-${form.page_id}/device-desktop`)}
                        >
                            Preview
                        </button>
                    )}

                    {window.location.pathname.includes("form-builder") && (
                        <>
                            <button className="form_builder_header-publish-btn" onClick={() => publishForm()}>
                                Publish <i className="fa-solid fa-bolt"></i>
                            </button>
                        </>
                    )}

                    {window.location.pathname.includes("preview") && (
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                            <div className="form_builder_page-dropdown" style={{ position: 'relative' }}>
                                <div
                                    className="form_builder_page-select"
                                    onClick={() => setIsOpen(!isOpen)}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                                >
                                    {selectedPage ? (
                                        <span>
                                            <i className="fa-solid fa-file-alt recently-viewed-icon" style={{ marginRight: '6px', color: "rgb(245, 158, 11)" }}></i>
                                            {selectedPage.page_title?.trim() !== ""
                                                ? selectedPage.page_title
                                                : `Page ${selectedPage.page_number}`}
                                        </span>
                                    ) : (
                                        "Loading..."
                                    )}
                                    <i className={`fa-solid ${isOpen ? "fa-chevron-up" : "fa-chevron-down"}`}></i>
                                </div>

                                {isOpen && selectedPage && (
                                    <div
                                        className="form_builder_page-options"
                                        style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            right: 0,
                                            backgroundColor: 'white',
                                            border: '1px solid #ccc',
                                            borderRadius: '6px',
                                            marginTop: '4px',
                                            zIndex: 1000,
                                        }}
                                    >
                                        {[...formPages]
                                            .sort((a, b) => a.sort_order - b.sort_order) // Ensure sorted order
                                            .map((page) => (
                                                <div
                                                    key={page.id}
                                                    className="form_builder_page-option"
                                                    style={{
                                                        padding: '8px 12px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        backgroundColor: page.page_number === selectedPage.page_number ? '#2563eb' : 'white',
                                                        color: page.page_number === selectedPage.page_number ? 'white' : 'black',
                                                    }}
                                                    onClick={() => {
                                                        setSelectedPage(page);
                                                        setIsOpen(false);
                                                        navigate(`/preview/${formId}/page-${page.page_number}/device-${device}`);
                                                    }}
                                                >
                                                    <i className="fa-solid fa-file-alt recently-viewed-icon" style={{ marginRight: '6px', color: "rgb(245, 158, 11)" }}></i>
                                                    {page.page_title?.trim() !== "" ? page.page_title : `Page ${page.page_number}`}
                                                </div>
                                            ))}

                                        {/* 🔽 Hardcoded Page End option */}
                                        <div
                                            key="page-end"
                                            className="form_builder_page-option"
                                            style={{
                                                padding: '8px 12px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                backgroundColor: selectedPage === "end" ? '#2563eb' : 'white',
                                                color: selectedPage === "end" ? 'white' : 'black',
                                            }}
                                            onClick={() => {
                                                setSelectedPage("end");
                                                setIsOpen(false);
                                                navigate(`/preview/${formId}/page-end/device-${device}`);
                                            }}
                                        >
                                            <i className="fa-solid fa-file-alt recently-viewed-icon" style={{ marginRight: '6px', color: "rgb(245, 158, 11)" }}></i>
                                            Page end
                                        </div>

                                    </div>
                                )}
                            </div>

                            <button
                                className="form_builder_header-publish-btn"
                                style={{ fontSize: "0.9rem", fontWeight: "500" }}
                                onClick={() => navigate(`/form-builder/${formId}/page-${form.page_id}`)}
                            >
                                <i className="fa-solid fa-xmark"></i> Exit preview
                            </button>
                        </div>
                    )}

                    {window.location.pathname.includes("responses") && (
                        <button className="form_builder_header-publish-btn">
                            <i className="fa-solid fa-users"></i> Share result
                        </button>
                    )}
                </div>
            </div>

            {form && (
                <div className="modal fade" id="exampleModalCenter" tabIndex="-1" role="dialog" aria-hidden="true" >
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content custom-modal p-0">
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title">Name your form</h5>
                                <button type="button" className="btn-close" style={{ outline: "none", border: "none", boxShadow: "none" }} data-bs-dismiss="modal" aria-label="Close"><i className="fa-solid fa-xmark"></i></button>
                            </div>
                            <div className="modal-body pt-2">
                                <input
                                    type="text"
                                    id="formNameInput"
                                    className="form-control custom-input"
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                />
                            </div>
                            <div className="modal-footer border-0 pt-0 justify-content-end">
                                <button
                                    type="button"
                                    id="continueButton"
                                    className="btn btn-primary custom-continue-btn"
                                    onClick={() => handleRenameSubmit(renameFormId)}
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </Navbar>
    );
};

export default Form_builder_header;
