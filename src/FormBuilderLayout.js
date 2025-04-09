// FormBuilderLayout.js
import React from "react";
import FormBuilderHeader from "./Form_builder_header";

const FormBuilderLayout = ({ children }) => {
    return (
        <div className="app-container">
            <FormBuilderHeader />
            <div className="main-layout">
                {children}
            </div>
        </div>
    );
};

export default FormBuilderLayout;
