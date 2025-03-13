import React, { useEffect, useState, useRef } from 'react';
import Swal from 'sweetalert2';
import styled from 'styled-components';
import { useNavigate } from "react-router-dom";
import './Header.css';

const Navbar = styled.nav`
  background-color: #fff !important;
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
  right: 0;
  left: auto;
  display: ${({ $isOpen }) => ($isOpen ? 'block' : 'none')};  // ✅ Fixed: use $isOpen
  position: absolute;
  background-color: white;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 5px;
  padding: 5px 0;
  min-width: 160px;
`;


const DropdownItem = styled.a`
  padding: 8px 15px; /* Reduce top and bottom padding */
  display: block;
  font-size: 14px;
  color: #333;
  text-decoration: none;

  &:hover {
    color: hsl(8, 77%, 56%);
    background-color: #f8f9fa;
  }
`;

const DropdownDivider = styled.hr`
  margin: 5px auto;
  width: 80%; /* Keep it shorter */
  border: 0;
  border-top: 2px solid #888; /* Darker and thicker line */
`;



const Header = () => {
  const [profileDetails, setProfileDetails] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    populateProfileDetails();

    // Close dropdown on outside click
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
      const response = await fetch('http://localhost:5000/api/header/get-user-profile', {
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
      const response = await fetch('http://localhost:5000/api/header/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        navigate('/login'); // Redirect to login page after logout
      } else {
        Swal.fire("Logout failed!");
      }
    } catch (error) {
      Swal.fire("An error occurred while logging out.");
      console.error(error);
    }
  };

  return (
    <Navbar className="navbar navbar-expand-lg navbar-light header">
      <div className="header-left">
        <a className="navbar-brand" href="#">Form Builder</a>
      </div>
      <div className="header-right">
        <ul className="navbar-nav">
          <li className="nav-item"><a className="nav-link" href="#"><i className="fa fa-gear"></i></a></li>
          <li className="nav-item"><a className="nav-link" href="#"><i className="fa-solid fa-bug"></i></a></li>
          <li className="nav-item"><a className="nav-link" href="#"><i className="fa fa-bell"></i></a></li>

          <li className="nav-item dropdown" ref={dropdownRef}>
            <a
              className="nav-link dropdown-toggle"
              href="#"
              id="profileDropdown"
              onClick={(e) => {
                e.preventDefault();
                setIsDropdownOpen(!isDropdownOpen);
              }}
            >
              {profileDetails ? (
                (
                  <span>
                    <RoundedCircle
                      style={{
                        width: '30px',
                        height: '30px',
                        backgroundColor: profileDetails.profile_color,
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    >
                      {profileDetails.profile_letters}
                    </RoundedCircle>{' '}
                    {profileDetails.user_name}
                  </span>
                )
              ) : (
                'Loading...'
              )}
            </a>

            <DropdownMenu className="dropdown-menu" $isOpen={isDropdownOpen} aria-labelledby="profileDropdown">
              <DropdownItem className="dropdown-item" href="#">My Profile</DropdownItem>
              <DropdownItem className="dropdown-item" href="/login?changePassword">Change Password</DropdownItem>
              <DropdownDivider />
              <DropdownItem className="dropdown-item" href="#" onClick={handleLogout}>Logout</DropdownItem>
            </DropdownMenu>
          </li>
        </ul>
      </div>
    </Navbar>
  );
};

export default Header;
