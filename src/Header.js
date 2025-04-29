import styled from "styled-components";
import { apiFetch } from "./utils/api";
import Swal from 'sweetalert2';
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import "./Header.css";

// Fix 1: Tell styled-components not to pass 'isHome' to the DOM
const Navbar = styled.nav`
  background-color: #fff !important;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  border-bottom: 1px solid #ddd;
  position: relative;
`;

// Fix 2: Prevent 'isHome' from reaching DOM using transient props ($isHome)
const CenteredContainer = styled.div`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.2rem;
  font-weight: 500;
  color: ${(props) => (props.$isHome ? "#2F71E2" : "gray")};
  cursor: pointer;

  &:hover {
    color: #2F71E2;
  }

  @media (max-width: 768px) {
    position: absolute;
    left: 5%;
    transform: none;
    color: gray;
    font-size: 1rem;
    padding-left: 5px;
    padding-right: 10px;
  }
`;

const Underline = styled.div`
  position: absolute;
  bottom: -18px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 2px;
  background-color: ${(props) => (props.$isHome ? "#2F71E2" : "gray")};
  border-radius: 5px;

  ${CenteredContainer}:hover & {
    background-color: #2F71E2;
  }

   @media (max-width: 768px) {
    display: none; /* Hide the underline on mobile */
  }
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

const DropdownMenu = styled.div`
  position: absolute;
  top: 60px; /* adjust as needed based on your header */
  right: 0px;
  background-color: white;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 10px 0;
  min-width: 200px;
  display: ${({ $isOpen }) => ($isOpen ? 'block' : 'none')};
  z-index: 1000;
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

const Header = () => {
  const isHome = window.location.pathname === "/home";
  const navigate = useNavigate();

  const [profileDetails, setProfileDetails] = useState(null);
  const [isHeaderDropdownOpen, setIsHeaderDropdownOpen] = useState(false);
  const headerDropdownRef = useRef(null);

  useEffect(() => {
    populateProfileDetails();

    const handleClickOutside = (event) => {
      if (headerDropdownRef.current && !headerDropdownRef.current.contains(event.target)) {
        setIsHeaderDropdownOpen(false);
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
    <Navbar className="header">
      <div className="header-left">
        <a className="navbar-brand" href="#">
          dFroms
        </a>
      </div>
      <CenteredContainer $isHome={isHome} onClick={() => navigate("/home")}>
        <i className="fa-solid fa-file-alt form-icon"></i>
        <span>Forms</span>
        <Underline $isHome={isHome} />
      </CenteredContainer>

      <div ref={headerDropdownRef} style={{ position: 'relative' }}>
        <div className="profile-toggle-button" onClick={() => setIsHeaderDropdownOpen((prev) => !prev)}>
          {profileDetails ? (
            <RoundedCircle
              className="profile-img"
              style={{
                backgroundColor: profileDetails.profile_color,
                color: 'white',
                fontSize: '18px',
                fontWeight: 'bold',
                border: 'none',
                boxShadow: 'none',
              }}
            >
              {profileDetails.profile_letters}
            </RoundedCircle>
          ) : (
            "Loading..."
          )}
        </div>

        {profileDetails && (
          <DropdownMenu className="dropdown-menu" $isOpen={isHeaderDropdownOpen}>
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

    </Navbar>
  );
};

export default Header;
