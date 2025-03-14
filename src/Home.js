import Swal from "sweetalert2";
import { useNotification } from "./NotificationContext";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {
  const { setShowNotification } = useNotification();
  const [profileDetails, setProfileDetails] = useState(null);
  const [forms, setForms] = useState([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [formsLoading, setFormsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(null); // Track which menu is open
  const [renamingFormId, setRenamingFormId] = useState(null);
  const [renameTitle, setRenameTitle] = useState("");
  const menuRef = useRef(null);
  const renameRef = useRef(null);
  const [sortBy, setSortBy] = useState("created_at_desc"); // Default sorting

  useEffect(() => {
    setProfileLoading(true);
    setFormsLoading(true);

    const fetchProfile = fetch("http://localhost:5000/api/header/get-user-profile", {
      method: "GET",
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Unauthorized");
        }
        return res.json();
      })
      .then((profileData) => {
        if (!profileData?.user_id) {
          throw new Error("No user found");
        }
        setProfileDetails(profileData);
      })
      .catch(() => {
        navigate("/login"); // Redirect to login if authentication fails
      })
      .finally(() => setProfileLoading(false));

    fetchForms();
  }, [navigate, sortBy]); // Now fetchForms is accessible

  const fetchForms = () => {
    setFormsLoading(true);
    fetch(`http://localhost:5000/api/form_builder/get-forms?sortBy=${sortBy}`, {
      method: "GET",
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then(err => { throw new Error(err.message || "Failed to fetch forms"); });
        }
        return response.json();
      })
      .then((data) => {
        setForms(data);
        setShowNotification(false); // Hide notification on success
      })
      .catch((error) => {
        console.error("Error fetching forms:", error);
        setError(error.message);
      })
      .finally(() => setFormsLoading(false));
  };

  const handleFormClick = (formId) => {
    navigate(`/form-builder/form-${formId}`);
  };

  const handleDelete = (formId) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`http://localhost:5000/api/form_builder/delete-form/${formId}`, {
          method: "DELETE",
          credentials: "include",
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Failed to delete form");
            }
            return response.json();
          })
          .then(() => {
            fetchForms();
            Swal.fire("Deleted!", "Your form has been deleted.", "success");
          })
          .catch((error) => {
            console.error("Error deleting form:", error);
            Swal.fire("Error", "Failed to delete form", "error");
          });
      }
    });
  };

  const handleRenameChange = (event) => {
    setRenameTitle(event.target.value);
  };

  const handleKeyDown = (event, formId) => {
    if (event.key === "Enter") {
      handleRenameSubmit(formId);
    }
  };

  const handleRenameSubmit = (formId) => {
    if (!renameTitle.trim()) {
      Swal.fire("Error", "Form title cannot be empty.", "error");
      return;
    }

    if (renameTitle === forms.find(f => f.form_id === formId)?.title) {
      setRenamingFormId(null);
      return;
    }

    Swal.fire({
      title: "Confirm Rename",
      text: "Do you want to rename this form?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Rename",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`http://localhost:5000/api/form_builder/rename-form/${formId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: renameTitle }),
          credentials: "include",
        })
          .then((res) => {
            if (!res.ok) {
              return res.json().then(err => { throw new Error(err.error || "Failed to rename form"); });
            }
            return res.json();
          })
          .then(() => {
            fetchForms();
            setRenamingFormId(null);
            setRenameTitle("");
            Swal.fire("Renamed!", "Your form has been renamed.", "success");
          })
          .catch((error) => {
            console.error("Error renaming form:", error);
            if (error.message.includes("already exists")) {
              Swal.fire("Duplicate Title", "A form with this title already exists. Please choose a different name.", "warning");
            } else {
              Swal.fire("Error", error.message, "error");
            }
          });
      }
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(null);
      }
      if (renameRef.current && !renameRef.current.contains(event.target)) {
        setRenamingFormId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBlankClick = () => {
    const modal = document.getElementById("myModal");
    if (modal) {
      modal.classList.remove("show");
      modal.style.display = "none";
    }
    document.body.classList.remove("modal-open");
    document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());
    navigate("/form-builder");
  };

  const handleTemplateClick = () => {
    alert("Template Selected");
  };

  return (
    <div className="home-container">
      <div className="welcome-section">
        <h3 className="welcome-text">
          {profileLoading
            ? "Loading..."
            : error
              ? "Welcome, User!"
              : `Welcome, ${profileDetails?.user_name || "User"}!`}
        </h3>
        <button
          className="btn btn-warning make-form-btn"
          data-bs-toggle="modal"
          data-bs-target="#myModal"
        >
          <i className="fa-solid fa-plus mr-1"></i> Make a Form
        </button>
      </div>


      {/* Forms I have created */}
      <section className="section">
        <div className="forms-header">
          <h4 className="section-title">My Forms</h4>
          <div className="order-by-container">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                fetchForms();
              }}
              className="order-by-dropdown"
              style={{ outline: "none" }}
            >
              <option value="created_at_desc">Newest First</option>
              <option value="created_at_asc">Oldest First</option>
              <option value="title_asc">Title A-Z</option>
              <option value="title_desc">Title Z-A</option>
              <option value="responses_desc">Most Responses</option>
              <option value="responses_asc">Fewest Responses</option>
            </select>
          </div>
        </div>

        <div className="forms-list">
          {formsLoading ? (
            <p>Loading forms...</p>
          ) : error && forms.length === 0 ? (
            <p className="error-message">Error loading forms</p>
          ) : forms.length === 0 ? (
            <p>No forms created yet.</p>
          ) : (
            forms.map((form) => (
              <div className={`form-card ${menuOpen === form.form_id ? "no-transform" : ""}`} key={form.form_id} ref={menuRef}>
                <div className="form-icon-container">
                  <i className="fa-solid fa-file-alt form-icon"></i>
                </div>
                <div className="form-card-content" onClick={() => handleFormClick(form.form_id)}>
                  {renamingFormId === form.form_id ? (
                    <div ref={renameRef} className="rename-input-container">
                      <input
                        type="text"
                        value={renameTitle}
                        onChange={handleRenameChange}
                        onKeyDown={(e) => handleKeyDown(e, form.form_id)}
                        autoFocus
                        onFocus={(e) => e.target.select()}
                        className="form-title-input"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        className="save-btn"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleRenameSubmit(form.form_id);
                        }}
                      >
                        <i className="fa-solid fa-check"></i>
                      </button>
                    </div>
                  ) : (
                    <p className="form-title">{form.title}</p>
                  )}

                  <p className="response-count">
                    {form.response_count} {form.response_count === 1 ? "response" : "responses"}
                  </p>
                </div>
                <div className="menu-container">
                  <i
                    className="fa-solid fa-ellipsis-vertical menu-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(menuOpen === form.form_id ? null : form.form_id);
                    }}
                  ></i>

                  {menuOpen === form.form_id && (
                    <div ref={menuRef} className="dropdown-menu">
                      <button
                        onClick={() => {
                          setRenamingFormId(form.form_id);
                          setRenameTitle(form.title);
                          setMenuOpen(null);
                        }}
                      >
                        <i className="fa-solid fa-pen"></i> Rename
                      </button>
                      <button onClick={() => handleDelete(form.form_id)}>
                        <i className="fa-solid fa-trash"></i> Delete
                      </button>
                    </div>
                  )}

                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="modal fade" id="myModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header updated-header">
              <h5 className="modal-title">Create a New Form</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <h5 className="modal-subtitle mt-2">Choose how to get started</h5>
              <div className="modal-options p-4">
                <div className="option-card" onClick={handleBlankClick}>
                  <div className="option-icon colored-icon-blank">📄</div>
                  <div className="option-text">Blank</div>
                  <small className="option-subtext">Start from scratch</small>
                </div>
                <div className="option-card" onClick={handleTemplateClick}>
                  <div className="option-icon colored-icon-template">📑</div>
                  <div className="option-text">Template</div>
                  <small className="option-subtext">Pre-built designs</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bottom-spacing"></div>
    </div>
  );
}

export default Home;