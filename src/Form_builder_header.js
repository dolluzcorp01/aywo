import Swal from "sweetalert2";
import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { useNavigate, useParams, useLocation } from "react-router-dom";
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
    const isEditableForm = /^\/form-builder\/form-\d+$/.test(location.pathname); // Checks if URL matches /form-builder/form-{number}


    useEffect(() => {
        populateProfileDetails();

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

            const response = await fetch('http://localhost:5000/api/leftnavbar/get-user-profile', {
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

    useEffect(() => {
        let isMounted = true;
        if (formId) {
            fetch(`http://localhost:5000/api/form_builder/get-forms?formId=${formId}`, {
                method: "GET",
                credentials: "include",
            })
                .then((response) => {
                    if (!response.ok) {
                        return response.json().then(err => { throw new Error(err.message || "Failed to fetch form"); });
                    }
                    return response.json();
                })
                .then((data) => {
                    if (isMounted) {
                        setForm(data); // single form
                    }
                })
                .catch((error) => {
                    Swal.fire("Error", error, "error");
                })
                .finally(() => {
                    if (isMounted);
                });
        }

        return () => { isMounted = false; };
    }, [formId]);

    const handleStarredForm = async (formId, starred) => {
        const newStarredStatus = !starred;

        try {
            const response = await fetch(`http://localhost:5000/api/form_builder/toggle-star/${formId}`, {
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
            const response = await axios.put(
                `http://localhost:5000/api/form_builder/publish-form/${cleanFormId}`,
                { published: true },
                { withCredentials: true }
            );

            const publicUrl = `${window.location.origin}/forms/${cleanFormId}`;

            // Copy link to clipboard
            await navigator.clipboard.writeText(publicUrl);

            // Show success alert
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

    return (
        <Navbar className="form_builder_header">
            <div className="form_builder_header-left">
                <a className="home-icon" href="/home">
                    <i className="fa fa-home"></i>
                </a>

                {form && (
                    <div className="form_builder_header-form-title-row">
                        <p className="form_builder_header-form-title-text">{form.title}</p>
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
                <span
                    className={`center-nav-btn ${window.location.pathname.includes("form-builder") ? "active" : ""}`}
                    onClick={() => navigate(`/form-builder/${formId}`)}
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
            </div>

            <div className="form_builder_header-right" style={{ display: 'flex' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {window.location.pathname.includes("form-builder") && (
                        <>
                            <button className="form_builder_header-clock-btn" style={{ marginLeft: "-5px" }}>
                                <i className="fa-regular fa-clock"></i>
                            </button>
                            <button className="form_builder_header-preview-btn">Preview</button>
                            {isEditableForm && (
                                <>
                                    <button className="form_builder_header-publish-btn" onClick={() => publishForm()}>
                                        Publish <i className="fa-solid fa-bolt"></i>
                                    </button>
                                </>
                            )}
                        </>
                    )}

                    {window.location.pathname.includes("responses") && (
                        <button className="form_builder_header-publish-btn">
                            <i className="fa-solid fa-users"></i> Share result
                        </button>
                    )}
                </div>
            </div>

        </Navbar>
    );
};

export default Form_builder_header;
