import React from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import "./Header.css";

const Navbar = styled.nav`
  background-color: #fff !important;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  border-bottom: 1px solid #ddd;
  position: relative;
`;

const CenteredContainer = styled.div`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.2rem;
  font-weight: 500;
  color: ${(props) => (props.isHome ? "blue" : "gray")}; 
  cursor: pointer;

  &:hover {
    color: blue;
  }
`;

const Underline = styled.div`
  position: absolute;
  bottom: -18px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px; /* Increased underline width */
  height: 2px;
  background-color: ${(props) => (props.isHome ? "blue" : "gray")}; 
  border-radius: 5px;

   ${CenteredContainer}:hover & {
    background-color: blue;
  }
`;

const Header = () => {
  const isHome = window.location.pathname === "/home"; // Check if the page is 'home'
  const navigate = useNavigate();

  return (
    <Navbar className="header">
      <div className="header-left">
        <a className="navbar-brand" href="#">
          dFroms
        </a>
      </div>
      <CenteredContainer isHome={isHome} onClick={() => navigate("/home")}>
        <i className="fa-solid fa-file-alt form-icon"></i>
        <span>Forms</span>
        <Underline isHome={isHome} />
      </CenteredContainer>
    </Navbar>
  );
};

export default Header;
