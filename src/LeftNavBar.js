import { useNotification } from "./NotificationContext";
import { apiFetch, API_BASE } from "./utils/api";
import styled from 'styled-components';
import Swal from 'sweetalert2';
import React, { useEffect, useState, useRef } from 'react';
import { FaCamera } from "react-icons/fa";
import { useNavigate, useLocation } from 'react-router-dom';
import help_desk from "./assets/img/help_desk.png";
import './LeftNavBar.css';

const RoundedCircle = styled.span`
  border-radius: 50%;
  text-align: center;
  font-size: 14px;
  line-height: 40px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
`;

const DropdownMenu = styled.div`
  position: absolute;
  bottom: 75px; /* Opens above the profile section */
  left: 10px;
  background-color: white;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 10px 0;
  min-width: 200px;
  overflow: hidden;
  transform: translateY(-10px); /* Small lift effect */
  display: ${({ $isOpen }) => ($isOpen ? 'block' : 'none')};
`;

/* Profile Section inside Dropdown */
const DropdownProfile = styled.div`
  padding: 10px 15px;
  display: flex;
  align-items: center; /* Align profile image and text */
  border-bottom: 1px solid #ddd;
`;

/* Profile Name */
const DropdownProfileName = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #333;
`;

/* Profile Organization */
const DropdownProfileOrg = styled.div`
  font-size: 0.85rem;
  color: gray;
  margin-top: 3px;
`;

/* Dropdown Item */
const DropdownItem = styled.a`
  padding: 10px 15px;
  display: block;
  font-size: 14px;
  color: #333;
  text-decoration: none;

  &:hover {
    color: hsl(8, 77%, 56%);
    background-color: #f8f9fa;
  }
`;

/* Divider */
const DropdownDivider = styled.hr`
  margin: 5px auto;
  width: 80%;
  border: 0;
  border-top: 2px solid #888;
`;

const LeftNavBar = () => {
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const location = useLocation();
    const [isHovered, setIsHovered] = useState(false);

    const [profileDetails, setProfileDetails] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleSaveProfileImage = async () => {
        if (!selectedFile) {
            Swal.fire("Error", "Please select an image!", "warning");
            return;
        }

        const formData = new FormData();
        formData.append("profileImage", selectedFile);
        formData.append("userId", profileDetails.user_id);

        try {
            const res = await fetch("/api/leftnavbar/upload-profile-image", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (data.success) {
                Swal.fire("Success", "Profile image updated!", "success");
                setIsModalOpen(false);
                // Optionally refresh user details or image
            } else {
                Swal.fire("Error", data.message || "Something went wrong", "error");
            }
        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Something went wrong", "error");
        }
    };

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

    const handleCopyEmail = (email) => {
        navigator.clipboard.writeText(email)
            .then(() => {
                Swal.fire({
                    icon: 'success',
                    title: 'Copied!',
                    text: `${email} has been copied to clipboard`,
                    timer: 1500,
                    showConfirmButton: false
                });
            })
            .catch(() => {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Failed to copy email!'
                });
            });
    };

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
            console.log(data);

            setProfileDetails(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleLogout = async () => {
        try {
            const response = await apiFetch('/api/leftnavbar/logout', {
                method: 'POST',
                credentials: 'include',
            });

            if (response.ok) {
                navigate('/login');
            } else {
                Swal.fire("Logout failed!");
            }
        } catch (error) {
            Swal.fire("An error occurred while logging out.");
            console.error(error);
        }
    };

    return (
        <div className="left-navbar">
            {/* Search Bar */}
            <div className="search-container">
                <i className="fa fa-search search-icon"></i>
                <input type="text" className="search-input" placeholder="Search..." readOnly onClick={() => window.dispatchEvent(new Event('openSearchPopup'))} />
            </div>
            {/* Navigation Items */}
            <div className="nav-content">
                <div
                    className={`nav-item ${location.pathname === "/home" ? "active" : ""}`}
                    onClick={() => navigate("/home")}
                >
                    <i className="fa fa-home"></i>
                    <span className="nav-text">Home</span>
                </div>
            </div>

            {/* Profile Section - Sticks at the Bottom */}
            <div ref={dropdownRef} style={{ marginTop: "auto" }}>
                <div className="profile-section" onClick={() => setIsDropdownOpen((prev) => !prev)}>
                    {profileDetails ? (
                        <>
                            <RoundedCircle
                                className="profile-img"
                                style={{
                                    backgroundColor: profileDetails.profile_color,
                                    color: 'white',
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                    backgroundImage: profileDetails.users_profile_img
                                        ? profileDetails.users_profile_img.startsWith("data:")
                                            ? `url(${profileDetails.users_profile_img})`
                                            : `url(${API_BASE}/${profileDetails.users_profile_img.replace(/\\/g, "/")})`
                                        : undefined,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {!profileDetails.users_profile_img && profileDetails.profile_letters}
                            </RoundedCircle>

                            <div className="profile-text">
                                <span className="profile-name">{profileDetails.user_name}</span>
                                <span className="profile-org" style={{ fontStyle: 'italic' }}>Your Form, Your Space</span>
                            </div>

                            <div className="profile-arrow-wrapper">
                                <i className="fa fa-chevron-up profile-arrow"></i>
                                <i className="fa fa-chevron-down profile-arrow"></i>
                            </div>
                        </>
                    ) : (
                        "Loading..."
                    )}
                </div>

                {isDropdownOpen && (
                    <DropdownMenu className="dropdown-menu" $isOpen={isDropdownOpen}>
                        <DropdownProfile>
                            <RoundedCircle
                                className="profile-img"
                                style={{
                                    backgroundColor: profileDetails.profile_color,
                                    color: 'white',
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    backgroundImage: profileDetails.users_profile_img
                                        ? profileDetails.users_profile_img.startsWith("data:")
                                            ? `url(${profileDetails.users_profile_img})`
                                            : `url(${API_BASE}/${profileDetails.users_profile_img.replace(/\\/g, "/")})`
                                        : undefined,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                                onMouseEnter={() => setIsHovered(true)}
                                onMouseLeave={() => setIsHovered(false)}
                                onClick={() => { setIsModalOpen(true); console.log(API_BASE) }}
                            >
                                {/* Show camera on hover, otherwise letters if no image */}
                                {isHovered ? (
                                    <FaCamera color="white" />
                                ) : (
                                    !profileDetails.users_profile_img && profileDetails.profile_letters
                                )}
                            </RoundedCircle>

                            <div className="profile-text" style={{ display: "flex", flexDirection: "column" }}>
                                <DropdownProfileName>{profileDetails.user_name}</DropdownProfileName>
                                <DropdownProfileOrg style={{ fontStyle: 'italic' }}>
                                    Your Form, Your Space
                                </DropdownProfileOrg>
                            </div>
                        </DropdownProfile>

                        <DropdownItem
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                            onClick={() => handleCopyEmail("Help@dFroms.io")}
                        >
                            <img
                                src={help_desk}
                                alt="Help Desk"
                                style={{ width: "20px", height: "20px", objectFit: "contain" }}
                            />
                            Help@dFroms.io
                        </DropdownItem>
                        <DropdownItem href="/login?changePassword"><i className="fa fa-key"></i> Change Password</DropdownItem>
                        <DropdownDivider />
                        <DropdownItem onClick={handleLogout} style={{ color: "red" }}>Logout</DropdownItem>
                    </DropdownMenu>
                )}
            </div>

            {isModalOpen && (
                <div className="profile-modal-overlay">
                    <div className="profile-modal">
                        <button
                            className="profile-modal-close"
                            onClick={() => setIsModalOpen(false)}
                        >
                            ✖
                        </button>

                        <h3 className="profile-modal-title">Update Profile Image</h3>

                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px', marginBottom: '5px' }}>
                            {selectedFile ? (
                                <img
                                    src={URL.createObjectURL(selectedFile)}
                                    alt="Preview"
                                    className="profile-image-preview"
                                />
                            ) : profileDetails.users_profile_img ? (
                                <img
                                    src={`${API_BASE}/${profileDetails.users_profile_img.replace(/\\/g, "/")}`}
                                    alt="Profile"
                                    className="profile-image-preview"
                                />
                            ) : (
                                <FaCamera size={60} color="#555" style={{ alignSelf: "center" }} />
                            )}
                        </div>

                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ marginTop: "10px" }}
                        />

                        <div className="profile-modal-buttons">
                            <button
                                className="profile-modal-save"
                                onClick={handleSaveProfileImage}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )
            }

        </div >
    );

};

export default LeftNavBar;
