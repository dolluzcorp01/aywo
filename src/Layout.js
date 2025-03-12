import React from "react";
import Header from "./Header";
import LeftNavBar from "./LeftNavBar";
import "./App.css";

const Layout = ({ children }) => {
    return (
        <div className="app-container">
            <Header />
            <div className="main-layout">
                <LeftNavBar />
                <div className="content">{children}</div>
            </div>
        </div>
    );
};

export default Layout;
