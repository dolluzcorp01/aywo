import { useNotification } from "./NotificationContext";
import { apiFetch } from "./utils/api";
import styled from 'styled-components';
import Swal from 'sweetalert2';
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

    const [profileDetails, setProfileDetails] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

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
                                }}
                            >
                                {profileDetails.profile_letters}
                            </RoundedCircle>

                            <div className="profile-text">
                                <span className="profile-name">{profileDetails.user_name}</span>
                                <span className="profile-org">{profileDetails.user_name}'s organization</span>
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
                                }}
                            >
                                {profileDetails.profile_letters}
                            </RoundedCircle>
                            <div className="profile-text" style={{ display: "flex", flexDirection: "column" }}>
                                <DropdownProfileName>{profileDetails.user_name}</DropdownProfileName>
                                <DropdownProfileOrg>{profileDetails.user_name}'s organization</DropdownProfileOrg>
                            </div>
                        </DropdownProfile>

                        <DropdownItem href="#"><i className="fa fa-hands-helping"></i> Help center</DropdownItem>
                        <DropdownItem href="/login?changePassword"><i className="fa fa-key"></i> Change Password</DropdownItem>
                        <DropdownDivider />
                        <DropdownItem onClick={handleLogout} style={{ color: "red" }}>Logout</DropdownItem>
                    </DropdownMenu>
                )}
            </div>

        </div >
    );

};

export default LeftNavBar;
