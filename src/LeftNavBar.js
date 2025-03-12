import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './LeftNavBar.css';

const LeftNavBar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className="left-navbar">
            <div className={`nav-item ${location.pathname === "/home" ? "active" : ""}`} onClick={() => navigate('/home')}>
                <i className="fa fa-home"></i>
                <span>Home</span>
            </div>
        </div>
    );
};

export default LeftNavBar;
