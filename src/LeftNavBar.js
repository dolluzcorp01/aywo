import { useNotification } from "./NotificationContext";
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './LeftNavBar.css';

const LeftNavBar = () => {
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className="left-navbar">
            <div
                className={`nav-item ${location.pathname === "/home" ? "active" : ""}`}
                onClick={() => navigate("/home")}
            >
                <i className="fa fa-home"></i>
                <span className="nav-text">Home</span>
                {showNotification && (
                    <span className="new-form-notification">NEW</span> // Custom notification 
                )}{" "}
                {/* 🔔 Show FontAwesome Notification Icon */}
            </div>
        </div>
    );
};

export default LeftNavBar;
