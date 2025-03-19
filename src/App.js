import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Layout from "./Layout";
import Login from "./Login";
import Home from "./Home";
import FormBuilder from "./Form_builder";
import PublishedForm from "./PublishedForm";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/home"
        element={
          <Layout>
            <Home />
          </Layout>
        }
      />
      <Route
        path="/form-builder"
        element={
          <Layout>
            <FormBuilder />
          </Layout>
        }
      />
      {/* ✅ Correct Dynamic Route */}
      <Route
        path="/form-builder/:formId"
        element={
          <Layout>
            <FormBuilder />
          </Layout>
        }
      />

      {/* ✅ New Route for Published Form */}
      <Route path="/forms/:formId" element={<PublishedForm />} />

      <Route path="/" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
