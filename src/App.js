import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Layout from "./Layout";
import Login from "./Login";
import Home from "./Home";
import FormBuilder from "./Form_builder";
import FormBuilderLayout from "./FormBuilderLayout";
import PublishedForm from "./PublishedForm";
import Responses from "./Responses";
import Preview from "./Preview";
import Share from "./Share";
import Templates from "./Templates";

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
      <Route
        path="/form-builder/:formId/page-:pageId"
        element={
          <FormBuilderLayout>
            <FormBuilder />
          </FormBuilderLayout>
        }
      />

      {/* Published form (no layout) */}
      <Route path="/forms/:formId/:pageId" element={<PublishedForm />} />

      {/* Responses page uses default layout */}
      <Route
        path="/responses/:formId"
        element={
          <FormBuilderLayout>
            <Responses />
          </FormBuilderLayout>
        }
      />

      {/* ✅ Preview route */}
      <Route
        path="/preview/:formId/:pageId/:device"
        element={
          <FormBuilderLayout>
            <Preview />
          </FormBuilderLayout>
        }
      />

      {/* ✅ Share route */}
      <Route
        path="/Share/:formId"
        element={
          <FormBuilderLayout>
            <Share />
          </FormBuilderLayout>
        }
      />

      {/* ✅ Templates route */}
      <Route
        path="/Templates/:formId/:pageId"
        element={
          <Templates />
        }
      />

      <Route path="/" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
