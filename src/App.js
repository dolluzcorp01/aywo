import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Layout from "./Layout";
import Login from "./Login";
import Home from "./Home";
import FormBuilder from "./Form_builder";
import FormBuilderLayout from "./FormBuilderLayout";
import PublishedForm from "./PublishedForm";
import Responses from "./Responses";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Login />} />

      {/* Normal layout */}
      <Route
        path="/home"
        element={
          <Layout>
            <Home />
          </Layout>
        }
      />

      {/* ✅ Form Builder uses custom header */}
      <Route
        path="/form-builder"
        element={
          <FormBuilderLayout>
            <FormBuilder />
          </FormBuilderLayout>
        }
      />
      <Route
        path="/form-builder/:formId/:pageId"
        element={
          <FormBuilderLayout>
            <FormBuilder />
          </FormBuilderLayout>
        }
      />

      {/* Published form (no layout) */}
      <Route path="/forms/:formId" element={<PublishedForm />} />

      {/* Responses page uses default layout */}
      <Route
        path="/responses/:formId"
        element={
          <FormBuilderLayout>
            <Responses />
          </FormBuilderLayout>
        }
      />

      <Route path="/" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
