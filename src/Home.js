import Swal from "sweetalert2";
import { apiFetch } from "./utils/api";
import styled from 'styled-components';
import Contact_info from "./assets/img/Contact_info.jpg";
import Appointment_booking from "./assets/img/Appointment_booking.jpg";
import Job_Application from "./assets/img/Job_Application.jpg";
import { useNotification } from "./NotificationContext";
import React, { useState, useEffect, useRef } from "react";
import { FaThLarge } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./Home.css";

const SearchPopup = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  padding: 20px;
  min-width: 600px;
  max-width: 700px;
  max-height: 500px;
  z-index: 10000;
  display: ${({ $isOpen }) => ($isOpen ? "block" : "none")};

  .search-input {
    width: 100%;
    padding: 12px;
    border: 1px solid #ccc;
    border-radius: 5px;
    font-size: 16px;
  }

  .search-sections {
    margin-top: 15px;
  }

  .search-section-title {
    font-size: 12px;
    margin-bottom: 8px;
    color: #888;
    text-transform: uppercase;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 15px;
  }

  .new-form-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background-color: transparent;
    padding: 12px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
    position: relative; /* Required for ::before */
    padding-left: 18px; /* Space for left border */
    transition: background 0.2s;
  }

  .new-form-btn::before {
    content: "";
    position: absolute;
    inset-inline-start: 0; /* Aligns to the left */
    top: 0;
    height: 100%;
    width: 4px;
    background: transparent; /* Default transparent */
    border-radius: 2px;
    transition: background 0.2s;
  }

  .new-form-btn:hover {
    background: #eaf2ff;
  }

  .new-form-btn:hover::before {
    background: #1a73e8; /* Show blue on hover */
  }

  .form-list {
    max-height: 250px;
    overflow-y: auto;
  }

  .form-item {
    display: flex;
    align-items: center;
    padding: 10px;
    border-radius: 5px;
    cursor: pointer;
    transition: background 0.2s;
    position: relative;
    padding-left: 18px; /* Ensure enough space for icon */
  }

  .form-item::before {
    content: "";
    position: absolute;
    inset-inline-start: 0; /* Ensures it starts from the left edge */
    top: 0;
    height: 100%;
    width: 4px;
    background: transparent; /* Default transparent */
    border-radius: 2px;
    transition: background 0.2s;
  }

  .form-item:hover {
    background: #eaf2ff;
  }

  .form-item:hover::before {
    background: #1a73e8; /* Show blue on hover */
  }


  /* Icon default color */
  .search-modal-form-icon {
    font-size: 15px;
    margin-right: 10px;
    color: gray;
    transition: color 0.2s;
  }

  /* Icon turns blue on hover */
  .form-item:hover .search-modal-form-icon {
    color: #1a73e8;
  }

  /* Always blue plus icon */
  .search-modal-plus-icon {
    color: #1a73e8;
  }

  .form-name {
    font-size: 16px;
  }
`;

function Home() {
  const { setShowNotification } = useNotification();
  const [profileDetails, setProfileDetails] = useState(null);
  const [forms, setForms] = useState([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [formsLoading, setFormsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(null); // Track which menu is open
  const [StarredFormsmenuOpen, setStarredFormsMenuOpen] = useState(null); // Track which menu is open
  const [recentlyViewedMenuOpen, setRecentlyViewedMenuOpen] = useState(null); // Recently Viewed menu
  const [renamingFormId, setRenamingFormId] = useState([null]);
  const [renameTitle, setRenameTitle] = useState("");
  const menuRef = useRef(null);
  const [sortBy, setSortBy] = useState("created_at_desc"); // Default sorting
  const [hoveredFormId, setHoveredFormId] = useState(null);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const renameModalRef = useRef(null);

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isPreview, setIsPreview] = useState(false);

  const [isSearchPopupOpen, setIsSearchPopupOpen] = useState(false);
  const searchPopupRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [isOrderByOpen, setIsOrderByOpen] = useState(false);
  const orderByRef = useRef(null);

  const [formCardViewType, setformCardViewType] = useState("grid"); // or "list"
  const [dropdownDirection, setDropdownDirection] = useState('below'); // or 'above'
  const [isDuplicateMode, setIsDuplicateMode] = useState(false);

  const [isNoteMode, setIsNoteMode] = useState(false);
  const [internalNote, setInternalNote] = useState("");

  const options = [
    { value: "created_at_desc", label: "Newest First", icon: "fa-arrow-down" },
    { value: "created_at_asc", label: "Oldest First", icon: "fa-arrow-up" },
    { value: "title_asc", label: "Title A-Z", icon: "fa-sort-alpha-up" },
    { value: "title_desc", label: "Title Z-A", icon: "fa-sort-alpha-down" },
    { value: "responses_desc", label: "Most Responses", icon: "fa-chart-bar" },
    { value: "responses_asc", label: "Fewest Responses", icon: "fa-chart-line" },
  ];

  const selectedOption = options.find((option) => option.value === sortBy);

  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    // Load recently viewed forms from localStorage
    const storedRecentlyViewed = JSON.parse(localStorage.getItem("recentlyViewedForms")) || [];
    setRecentlyViewed(storedRecentlyViewed);
  }, []);

  const handleFormClick = (form_id, title, response_count, published, internal_note, is_closed, starred) => {
    // Navigate to form builder
    navigate(`/form-builder/form-${form_id}`);

    // Update recently viewed forms
    const updatedRecentlyViewed = [{ form_id, title, response_count, published, internal_note, is_closed, starred }, ...recentlyViewed.filter(f => f.form_id !== form_id)].slice(0, 3);
    setRecentlyViewed(updatedRecentlyViewed);
    localStorage.setItem("recentlyViewedForms", JSON.stringify(updatedRecentlyViewed));
  };

  const handleSelect = (value) => {
    setSortBy(value);
    setIsOrderByOpen(false);
  };

  useEffect(() => {
    const handleSearchOpen = () => setIsSearchPopupOpen(true);
    window.addEventListener('openSearchPopup', handleSearchOpen);

    return () => {
      window.removeEventListener('openSearchPopup', handleSearchOpen);
    };
  }, []);

  const templates = [
    { name: "Contact Form", image: Contact_info, url: "template-1" },
    { name: "Appointment Booking", image: Appointment_booking, url: "template-2" },
    { name: "Job Application", image: Job_Application, url: "template-3" },
  ];

  const handleTemplateClick = () => {
    setShowTemplateModal(true);
    setIsPreview(false);
    setSelectedTemplate(null);
  };

  const handleBackClick = () => {
    setIsPreview(false);
    setSelectedTemplate(null);
  };

  const handleUseTemplateclick = () => {
    const modal = document.getElementById("templateModal");
    if (modal) {
      modal.classList.remove("show");
      modal.style.display = "none";
    }
    document.body.classList.remove("modal-open");
    document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());
    navigate(`/form-builder/${selectedTemplate.url}`);
  };

  useEffect(() => {
    setProfileLoading(true);
    setFormsLoading(true);

    const fetchProfile = apiFetch("/api/leftnavbar/get-user-profile", {
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
    apiFetch(`/api/form_builder/get-forms?sortBy=${sortBy}`, {
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

  const handleDuplicateForm = async (formId) => {
    try {
      const response = await apiFetch(`/api/form_builder/duplicate-form/${formId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: renameTitle }),
        credentials: "include",
      });

      const data = await response.json();
      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Form duplicated successfully!',
          showConfirmButton: false,
          timer: 1500,
        });
        setForms((prev) => [...prev, data.newForm]);
      } else {
        console.error("Duplication failed:", data.error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.error,
        });
      }
    } catch (error) {
      console.error("Error duplicating form:", error);
      Swal.fire({
        icon: 'error',
        title: 'Server Error',
        text: 'An error occurred while duplicating the form.',
      });
    }
  };

  const handleSaveNote = async (formId, note) => {
    try {
      const response = await apiFetch(`/api/form_builder/save-note/${formId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
        credentials: "include",
      });

      const data = await response.json();
      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Note saved successfully!',
          showConfirmButton: false,
          timer: 1500,
        });

        // Optional: update form list if needed
        setForms((prevForms) =>
          prevForms.map((form) =>
            form.form_id === formId ? { ...form, internal_note: note } : form
          )
        );

        // ✅ Update recentlyViewed localStorage (if it exists)
        const updatedRecentlyViewed = recentlyViewed.map(f =>
          f.form_id === formId ? { ...f, internal_note: note } : f
        );

        setRecentlyViewed(updatedRecentlyViewed);
        localStorage.setItem("recentlyViewedForms", JSON.stringify(updatedRecentlyViewed));

      } else {
        console.error("Note save failed:", data.error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.error,
        });
      }
    } catch (error) {
      console.error("Error saving note:", error);
      Swal.fire({
        icon: 'error',
        title: 'Server Error',
        text: 'An error occurred while saving the note.',
      });
    }
  };

  const handleCloseForm = async (formId, isCurrentlyClosed) => {
    const action = isCurrentlyClosed ? "re-open" : "close";

    try {
      const response = await apiFetch(`/api/form_builder/close-form/${formId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_closed: !isCurrentlyClosed }), // Toggle value
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: `Form ${action}ed successfully!`,
          showConfirmButton: false,
          timer: 1500,
        });

        const updatedRecentlyViewed = recentlyViewed.map(f =>
          f.form_id === formId ? { ...f, is_closed: !isCurrentlyClosed } : f
        );
        setRecentlyViewed(updatedRecentlyViewed);
        localStorage.setItem("recentlyViewedForms", JSON.stringify(updatedRecentlyViewed));
        fetchForms();
      } else {
        console.error(`Form ${action} failed:`, data.error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.error,
        });
      }
    } catch (error) {
      console.error(`Error trying to ${action} form:`, error);
      Swal.fire({
        icon: 'error',
        title: 'Server Error',
        text: `An error occurred while trying to ${action} the form.`,
      });
    }
  };

  const handleStarredForm = async (formId, starred) => {
    const newStarredStatus = !starred;

    try {
      const response = await apiFetch(`/api/form_builder/toggle-star/${formId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ starred: newStarredStatus }),
      });

      const result = await response.json();
      if (response.ok) {
        // Update the recentlyViewed list in local state and localStorage
        const updatedRecentlyViewed = recentlyViewed.map(form => {
          if (form.form_id === formId) {
            return { ...form, starred: newStarredStatus };
          }
          return form;
        });

        setRecentlyViewed(updatedRecentlyViewed);
        localStorage.setItem("recentlyViewedForms", JSON.stringify(updatedRecentlyViewed));

        fetchForms(); // refresh list if needed
        Swal.fire({
          icon: "success",
          title: `Form ${newStarredStatus ? "starred" : "unstarred"}!`,
          timer: 1200,
          showConfirmButton: false,
        });
      } else {
        Swal.fire("Error", result.error, "error");
      }
    } catch (err) {
      Swal.fire("Error", "Something went wrong", "error");
    }
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
        apiFetch(`/api/form_builder/delete-form/${formId}`, {
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
            // Remove the form from recently viewed list
            const updatedRecentlyViewed = recentlyViewed.filter(f => f.form_id !== formId);
            setRecentlyViewed(updatedRecentlyViewed);
            localStorage.setItem("recentlyViewedForms", JSON.stringify(updatedRecentlyViewed));

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
        apiFetch(`/api/form_builder/rename-form/${formId}`, {
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
            // Update local recently viewed list if renamed form is there
            const updatedRecentlyViewed = recentlyViewed.map(f =>
              f.form_id === formId ? { ...f, title: renameTitle } : f
            );

            setRecentlyViewed(updatedRecentlyViewed);
            localStorage.setItem("recentlyViewedForms", JSON.stringify(updatedRecentlyViewed));

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
        setStarredFormsMenuOpen(null);
      }

      if (!event.target.closest(".recently-viewed-menu") && !event.target.closest(".dropdown-menu")) {
        setRecentlyViewedMenuOpen(null);
      }

      if (searchPopupRef.current && !searchPopupRef.current.contains(event.target)) {
        setIsSearchPopupOpen(false);
      }

      if (orderByRef.current && !orderByRef.current.contains(event.target)) {
        setIsOrderByOpen(false);
      }

      if (renameModalRef.current && !renameModalRef.current.contains(event.target)) {
        setIsRenameModalOpen(false);
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
        {/* Recently Viewed Forms */}
        {recentlyViewed.length > 0 && (
          <section className="recently-viewed-section">
            <h4 className="recently-viewed-title" style={{ marginBottom: "25px", fontSize: "0.8rem", color: "gray" }}>RECENTLY VIEWED</h4>
            <div className="recently-viewed-list">
              {recentlyViewed.map((form) => (
                <div className="recently-viewed-card"
                  key={form.form_id}
                  onClick={() => handleFormClick(form.form_id, form.title, form.response_count, form.published, form.internal_note, form.is_closed)}
                  onMouseEnter={() => setHoveredFormId(form.form_id)}
                  onMouseLeave={() => setHoveredFormId(null)}
                  title={form.is_closed ? "This form is closed" : ""}
                >
                  {/* Top Row */}
                  <div className="recently-viewed-header">
                    {/* Left section */}
                    <div className="left-section">
                      <div
                        className="recently-viewed-icon-container"
                        style={{
                          backgroundColor: form.is_closed ? "#E5E7EB" : "#d3e3fd",
                        }}
                      >
                        <i
                          className="fa-solid fa-file-alt recently-viewed-icon"
                          style={{
                            color: form.is_closed ? "rgb(75 85 99)" : "#1a73e8",
                          }}
                        ></i>
                      </div>
                    </div>

                    {/* Right section */}
                    <div className="right-section">
                      {form.internal_note && (
                        <i
                          style={{
                            marginRight: "10px",
                            fontSize: "1.3rem"
                          }}
                          className="fa-regular fa-comment-dots note_icon recently-viewed-menu"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingFormId(form.form_id);
                            setInternalNote(form.internal_note || "");
                            setMenuOpen(null);
                            setIsDuplicateMode(false);
                            setIsNoteMode(true);
                            setIsRenameModalOpen(true);
                          }}
                        ></i>
                      )}

                      <i
                        style={{
                          fontSize: "1.3rem"
                        }}
                        className="fa-solid fa-ellipsis-vertical recently-viewed-menu"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRecentlyViewedMenuOpen(recentlyViewedMenuOpen === form.form_id ? null : form.form_id);
                        }}
                      ></i>
                    </div>

                    {recentlyViewedMenuOpen === form.form_id && (
                      <div ref={menuRef} className={`dropdown-menu ${dropdownDirection}`}>
                        {form.published === 1 && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setRecentlyViewedMenuOpen(null);
                                const publicUrl = `${window.location.origin}/forms/${form.form_id}`;
                                navigator.clipboard.writeText(publicUrl);
                                Swal.fire("Copied!", `Share this link: <br><b>${publicUrl}</b>`, "success");
                                setMenuOpen(null);
                              }}
                            >
                              <i className="fa-solid fa-share"></i> Copy link
                            </button>
                            <hr />
                          </>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRecentlyViewedMenuOpen(null);
                            handleStarredForm(form.form_id, form.starred)
                          }}
                        >
                          {form.starred ? (
                            <i className="fa-solid fa-star" style={{ color: "#ffc738" }}></i>
                          ) : (
                            <i className="fa-regular fa-star"></i>
                          )}
                          <span> Star</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRecentlyViewedMenuOpen(null);
                            setRenamingFormId(form.form_id);
                            setInternalNote(form.internal_note || ""); // Optional: load existing note
                            setMenuOpen(null);
                            setIsDuplicateMode(false);
                            setIsNoteMode(true);
                            setIsRenameModalOpen(true);
                          }}
                        >
                          <i className="fa-regular fa-pen-to-square"></i>
                          {form.internal_note ? "Edit Internal Note" : "Add Internal Note"}
                        </button>

                        <hr />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRecentlyViewedMenuOpen(null);
                            setRenamingFormId(form.form_id);
                            setRenameTitle(form.title);
                            setMenuOpen(null);
                            setIsDuplicateMode(false);
                            setIsRenameModalOpen(true);
                          }}
                        >
                          <i className="fa-solid fa-pen"></i> Rename
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRecentlyViewedMenuOpen(null);
                            setRenamingFormId(form.form_id);
                            setRenameTitle(form.title + " (Copy)");
                            setMenuOpen(null);
                            setIsDuplicateMode(true); // Set duplicate mode
                            setIsRenameModalOpen(true);
                          }}
                        >
                          <i className="fa-regular fa-copy"></i> Duplicate
                        </button>

                        <hr />

                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            setRecentlyViewedMenuOpen(null);
                            handleCloseForm(form.form_id, form.is_closed);
                          }}
                        >
                          <i className={`fa-solid ${form.is_closed ? "fa-unlock" : "fa-lock"}`}></i>
                          {form.is_closed ? " Re-open form" : " Close form"}
                        </button>

                        <button style={{ color: "red" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setRecentlyViewedMenuOpen(null);
                            handleDelete(form.form_id)
                          }}>
                          <i className="fa-solid fa-trash"></i>  Move to trash
                        </button>

                      </div>
                    )}

                  </div>

                  {/* Title */}
                  <div className="recently-viewed-form-title-row">
                    <p className="form-title-text">{form.title}</p>
                    {form.starred ? (
                      <i className="fa-solid fa-star form-star-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStarredForm(form.form_id, form.starred)
                        }}
                        style={{ color: "#ffc738", marginLeft: "5px", fontSize: "0.7rem" }}></i>
                    ) : ("")
                    }
                  </div>

                  {/* Responses */}
                  <p
                    className="recently-viewed-responses"
                    style={{
                      cursor: form.response_count > 0 ? "pointer" : "default",
                      color: form.response_count > 0 ? "blue" : "",
                      textDecoration: form.response_count > 0 ? "underline" : "none",
                    }}
                    onClick={(e) => {
                      if (form.response_count > 0) {
                        e.stopPropagation();
                        navigate(`/responses/${form.form_id}`);
                      }
                    }}
                  >
                    {form.response_count} {form.response_count === 1 ? "response" : "responses"}
                  </p>

                </div>
              ))}
            </div>
          </section >
        )}

        {/* Starred Forms */}
        {forms.some(form => form.starred) && (
          <>
            <h4 className="starred-forms-title" style={{ marginTop: "30px", marginBottom: "25px", fontSize: "0.8rem", color: "gray" }}>STARRED</h4>
            <div className="starred-forms-list" style={{ display: "flex", gap: "20px" }}>
              {forms.filter(form => form.starred).map(form => (
                <div
                  className={`form-card ${StarredFormsmenuOpen === form.form_id ? "no-transform" : ""}`}
                  key={form.form_id}
                  ref={menuRef}
                  title={form.is_closed ? "This form is closed" : ""}
                >
                  <div
                    className="form-icon-container"
                    style={{
                      backgroundColor: form.is_closed ? "#E5E7EB" : "#d3e3fd",
                    }}
                  >
                    <i
                      className="fa-solid fa-file-alt form-icon"
                      style={{
                        color: form.is_closed ? "rgb(75 85 99)" : "#1a73e8",
                      }}
                    ></i>
                  </div>

                  <div
                    className="form-card-content"
                    onClick={() => handleFormClick(form.form_id, form.title, form.response_count, form.published, form.internal_note, form.is_closed, form.starred)}
                  >

                    <div className="form-title-row">
                      <p className="form-title">{form.title}</p>
                      {form.starred ? (
                        <i className="fa-solid fa-star form-star-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStarredForm(form.form_id, form.starred)
                          }}
                          style={{ color: "#ffc738", marginLeft: "5px", fontSize: "0.7rem" }}></i>
                      ) : ("")
                      }
                    </div>

                    <p
                      className="response-count"
                      style={{
                        cursor: form.response_count > 0 ? "pointer" : "default",
                        color: form.response_count > 0 ? "#1a73e8" : "#6b7280",
                        textDecoration: form.response_count > 0 ? "underline" : "none",
                      }}
                      onClick={(e) => {
                        if (form.response_count > 0) {
                          e.stopPropagation();
                          navigate(`/responses/${form.form_id}`);
                        }
                      }}
                    >
                      {form.response_count} {form.response_count === 1 ? "response" : "responses"}
                    </p>
                  </div>

                  <div className="menu-container">
                    {form.internal_note && (
                      <i className="fa-regular fa-comment-dots note_icon"
                        onClick={() => {
                          setRenamingFormId(form.form_id);
                          setInternalNote(form.internal_note || ""); // Optional: load existing note
                          setStarredFormsMenuOpen(null);
                          setIsDuplicateMode(false);
                          setIsNoteMode(true);
                          setIsRenameModalOpen(true);
                        }}></i>
                    )}

                    <i className="fa-solid fa-ellipsis-vertical menu-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        const iconRect = e.currentTarget.getBoundingClientRect();
                        const dropdownHeight = 240; // Approx height of your dropdown
                        const spaceBelow = window.innerHeight - iconRect.bottom;

                        if (spaceBelow < dropdownHeight) {
                          setDropdownDirection('above');
                        } else {
                          setDropdownDirection('below');
                        }

                        setStarredFormsMenuOpen(StarredFormsmenuOpen === form.form_id ? null : form.form_id);
                      }}
                    ></i>

                    {StarredFormsmenuOpen === form.form_id && (
                      <div ref={menuRef} className={`dropdown-menu ${dropdownDirection}`}>
                        {form.published === 1 && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const publicUrl = `${window.location.origin}/forms/${form.form_id}`;
                                navigator.clipboard.writeText(publicUrl);
                                Swal.fire("Copied!", `Share this link: <br><b>${publicUrl}</b>`, "success");
                                setStarredFormsMenuOpen(null);
                              }}
                            >
                              <i className="fa-solid fa-share"></i> Copy link
                            </button>
                            <hr />
                          </>
                        )}

                        <button
                          onClick={() => {
                            handleStarredForm(form.form_id, form.starred)
                          }}
                        >
                          {form.starred ? (
                            <i className="fa-solid fa-star" style={{ color: "#ffc738" }}></i>
                          ) : (
                            <i className="fa-regular fa-star"></i>
                          )}
                          <span> Star</span>

                        </button>

                        <button
                          onClick={() => {
                            setRenamingFormId(form.form_id);
                            setInternalNote(form.internal_note || ""); // Optional: load existing note
                            setStarredFormsMenuOpen(null);
                            setIsDuplicateMode(false);
                            setIsNoteMode(true);
                            setIsRenameModalOpen(true);
                          }}
                        >
                          <i className="fa-regular fa-pen-to-square"></i>
                          {form.internal_note ? "Edit Internal Note" : "Add Internal Note"}
                        </button>


                        <hr />
                        <button
                          onClick={() => {
                            setRenamingFormId(form.form_id);
                            setRenameTitle(form.title);
                            setStarredFormsMenuOpen(null);
                            setIsDuplicateMode(false);
                            setIsNoteMode(false);
                            setIsRenameModalOpen(true);
                          }}
                        >
                          <i className="fa-solid fa-pen"></i> Rename
                        </button>

                        <button
                          onClick={() => {
                            setRenamingFormId(form.form_id);
                            setRenameTitle(form.title + " (Copy)");
                            setStarredFormsMenuOpen(null);
                            setIsDuplicateMode(true); // Set duplicate mode
                            setIsNoteMode(false);
                            setIsRenameModalOpen(true);
                          }}
                        >
                          <i className="fa-regular fa-copy"></i> Duplicate
                        </button>

                        <hr />

                        <button
                          onClick={async () => {
                            setStarredFormsMenuOpen(null);
                            handleCloseForm(form.form_id, form.is_closed);
                          }}
                        >
                          <i className={`fa-solid ${form.is_closed ? "fa-unlock" : "fa-lock"}`}></i>
                          {form.is_closed ? " Re-open form" : " Close form"}
                        </button>

                        <button style={{ color: "red" }} onClick={() => handleDelete(form.form_id)}>
                          <i className="fa-solid fa-trash"></i>  Move to trash
                        </button>

                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="forms-header" style={{ marginTop: "50px", whiteSpace: "nowrap" }}>
          <h4 className="section-title" style={{ marginRight: "10px" }}>My Forms</h4>

          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            {/* Grid Icon */}
            <div
              onClick={() => setformCardViewType("grid")}
              style={{
                backgroundColor: "#E5E7EB",
                padding: "6px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 10px)",
                gridGap: "2px",
              }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} style={{
                    width: "8px",
                    height: "8px",
                    border: "3px solid #374151",
                    borderRadius: "2px",
                  }}></div>
                ))}
              </div>
            </div>
            {/* four line Icon */}
            <div
              onClick={() => setformCardViewType("list")}
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "19px",
                gap: "3px"
              }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{
                  width: "23px",
                  height: "8px",
                  backgroundColor: "#9CA3AF",
                  borderRadius: "1px",
                }}></div>
              ))}
            </div>

            <div ref={orderByRef} className={`custom-dropdown ${isOrderByOpen ? "open" : ""}`}>
              <button className="dropdown-toggle-btn" onClick={() => setIsOrderByOpen(!isOrderByOpen)}>
                <i className={`fa ${selectedOption?.icon}`}></i> {selectedOption?.label || "Select"}
                <i className={`fa ${isOrderByOpen ? "fa-chevron-up" : "fa-chevron-down"}`} style={{ marginLeft: "8px", fontSize: "10px" }}></i>
              </button>

              {isOrderByOpen && (
                <ul className="orderby-dropdown-menu">
                  {options.map((option) => (
                    <li key={option.value} onClick={() => handleSelect(option.value)}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <i className={`fa ${option.icon}`}></i>
                        {option.label}
                      </div>
                      {sortBy === option.value && <i className="fa fa-check chcek_icon"></i>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

        </div>

        <div className="forms-list"
          style={{
            display: formCardViewType === "grid" ? "flex" : "block",
            gap: formCardViewType === "grid" ? "20px" : "0",
            width: "100%",
          }}>
          {formsLoading ? (
            <p>Loading forms...</p>
          ) : error && forms.length === 0 ? (
            <p className="error-message">Error loading forms</p>
          ) : forms.length === 0 ? (
            <p>No forms created yet.</p>
          ) : (
            forms.map((form) => (
              <div
                className={`form-card ${formCardViewType === "list" ? "list-view" : ""} ${menuOpen === form.form_id ? "no-transform" : ""}`}
                key={form.form_id}
                ref={menuRef}
                title={form.is_closed ? "This form is closed" : ""}
              >
                <div
                  className="form-icon-container"
                  style={{
                    backgroundColor: form.is_closed ? "#E5E7EB" : "#d3e3fd",
                  }}
                >
                  <i
                    className="fa-solid fa-file-alt form-icon"
                    style={{
                      color: form.is_closed ? "rgb(75 85 99)" : "#1a73e8",
                    }}
                  ></i>
                </div>

                <div
                  className="form-card-content"
                  onClick={() => handleFormClick(form.form_id, form.title, form.response_count, form.published, form.internal_note, form.is_closed, form.starred)}
                >

                  <div className="form-title-row">
                    <p className="form-title">{form.title}</p>
                    {form.starred ? (
                      <i className="fa-solid fa-star form-star-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStarredForm(form.form_id, form.starred)
                        }}
                        style={{ color: "#ffc738", marginLeft: "5px", fontSize: "0.7rem" }}></i>
                    ) : ("")
                    }
                  </div>

                  {/* Only show response count inside form-card-content in grid view */}
                  {formCardViewType !== "list" && (
                    <p
                      className="response-count"
                      style={{
                        cursor: form.response_count > 0 ? "pointer" : "default",
                        color: form.response_count > 0 ? "#1a73e8" : "#6b7280",
                        textDecoration: form.response_count > 0 ? "underline" : "none",
                      }}
                      onClick={(e) => {
                        if (form.response_count > 0) {
                          e.stopPropagation();
                          navigate(`/responses/${form.form_id}`);
                        }
                      }}
                    >
                      {form.response_count} {form.response_count === 1 ? "response" : "responses"}
                    </p>
                  )}
                </div>

                {/* Response count in list view goes here */}
                {formCardViewType === "list" && (
                  <p
                    className="response-count list-response"
                    style={{
                      cursor: form.response_count > 0 ? "pointer" : "default",
                      color: form.response_count > 0 ? "#1a73e8" : "#6b7280",
                      textDecoration: form.response_count > 0 ? "underline" : "none",
                      marginRight: "12px",
                      marginTop: "12px",
                      whiteSpace: "nowrap",
                    }}
                    onClick={(e) => {
                      if (form.response_count > 0) {
                        e.stopPropagation();
                        navigate(`/responses/${form.form_id}`);
                      }
                    }}
                  >
                    {form.response_count} {form.response_count === 1 ? "response" : "responses"}
                  </p>
                )}

                <div className="menu-container">
                  {form.internal_note && (
                    <i className="fa-regular fa-comment-dots note_icon"
                      onClick={() => {
                        setRenamingFormId(form.form_id);
                        setInternalNote(form.internal_note || ""); // Optional: load existing note
                        setMenuOpen(null);
                        setIsDuplicateMode(false);
                        setIsNoteMode(true);
                        setIsRenameModalOpen(true);
                      }}></i>
                  )}

                  <i className="fa-solid fa-ellipsis-vertical menu-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      const iconRect = e.currentTarget.getBoundingClientRect();
                      const dropdownHeight = 240; // Approx height of your dropdown
                      const spaceBelow = window.innerHeight - iconRect.bottom;

                      if (spaceBelow < dropdownHeight) {
                        setDropdownDirection('above');
                      } else {
                        setDropdownDirection('below');
                      }

                      setMenuOpen(menuOpen === form.form_id ? null : form.form_id);
                    }}
                  ></i>

                  {menuOpen === form.form_id && (
                    <div ref={menuRef} className={`dropdown-menu ${dropdownDirection}`}>
                      {form.published === 1 && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const publicUrl = `${window.location.origin}/forms/${form.form_id}`;
                              navigator.clipboard.writeText(publicUrl);
                              Swal.fire("Copied!", `Share this link: <br><b>${publicUrl}</b>`, "success");
                              setMenuOpen(null);
                            }}
                          >
                            <i className="fa-solid fa-share"></i> Copy link
                          </button>
                          <hr />
                        </>
                      )}

                      <button
                        onClick={() => {
                          setMenuOpen(null);
                          handleStarredForm(form.form_id, form.starred)
                        }}
                      >
                        {form.starred ? (
                          <i className="fa-solid fa-star" style={{ color: "#ffc738" }}></i>
                        ) : (
                          <i className="fa-regular fa-star"></i>
                        )}
                        <span> Star</span>

                      </button>

                      <button
                        onClick={() => {
                          setRenamingFormId(form.form_id);
                          setInternalNote(form.internal_note || ""); // Optional: load existing note
                          setMenuOpen(null);
                          setIsDuplicateMode(false);
                          setIsNoteMode(true);
                          setIsRenameModalOpen(true);
                        }}
                      >
                        <i className="fa-regular fa-pen-to-square"></i>
                        {form.internal_note ? "Edit Internal Note" : "Add Internal Note"}
                      </button>


                      <hr />
                      <button
                        onClick={() => {
                          setRenamingFormId(form.form_id);
                          setRenameTitle(form.title);
                          setMenuOpen(null);
                          setIsDuplicateMode(false);
                          setIsNoteMode(false);
                          setIsRenameModalOpen(true);
                        }}
                      >
                        <i className="fa-solid fa-pen"></i> Rename
                      </button>

                      <button
                        onClick={() => {
                          setRenamingFormId(form.form_id);
                          setRenameTitle(form.title + " (Copy)");
                          setMenuOpen(null);
                          setIsDuplicateMode(true); // Set duplicate mode
                          setIsNoteMode(false);
                          setIsRenameModalOpen(true);
                        }}
                      >
                        <i className="fa-regular fa-copy"></i> Duplicate
                      </button>

                      <hr />

                      <button
                        onClick={async () => {
                          setMenuOpen(null);
                          handleCloseForm(form.form_id, form.is_closed);
                        }}
                      >
                        <i className={`fa-solid ${form.is_closed ? "fa-unlock" : "fa-lock"}`}></i>
                        {form.is_closed ? " Re-open form" : " Close form"}
                      </button>

                      <button style={{ color: "red" }} onClick={() => handleDelete(form.form_id)}>
                        <i className="fa-solid fa-trash"></i>  Move to trash
                      </button>

                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section >

      {isRenameModalOpen && (
        <div className="rename-modal-overlay">
          <div className="rename-modal" ref={renameModalRef}>
            <button className="rename-modal-close" onClick={() => setIsRenameModalOpen(false)}>
              ✖
            </button>

            {isNoteMode ? (
              <>
                <h3 className="rename-modal-title">Edit Internal Note</h3>
                <p style={{ fontSize: "12px", marginBottom: "8px", color: "#555" }}>
                  Add any information
                </p>
                <textarea
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  className="rename-modal-input"
                  style={{ height: "100px", resize: "vertical" }}
                  autoFocus
                />
              </>
            ) : (
              <>
                <h3 className="rename-modal-title">
                  {isDuplicateMode ? `Duplicate: ${renameTitle.replace(" (Copy)", "")}` : "Name your form"}
                </h3>

                {isDuplicateMode && (
                  <p style={{ fontSize: "12px", marginBottom: "8px", color: "#555" }}>
                    New form name will be: <strong>{renameTitle}</strong>
                  </p>
                )}

                <input
                  type="text"
                  value={renameTitle}
                  onChange={(e) => setRenameTitle(e.target.value)}
                  className="rename-modal-input"
                  autoFocus
                />
              </>
            )}

            <div className="rename-modal-buttons">
              {forms.find(f => f.form_id === renamingFormId)?.internal_note?.trim() && (
                <button
                  className="rename-delete-btn"
                  onClick={() => {
                    Swal.fire({
                      title: 'Delete this note?',
                      icon: 'warning',
                      showCancelButton: true,
                      confirmButtonText: 'Yes, delete it!',
                      cancelButtonText: 'Cancel'
                    }).then((result) => {
                      if (result.isConfirmed) {
                        handleSaveNote(renamingFormId, ""); // Save empty string to remove note
                        setInternalNote("");
                        setIsRenameModalOpen(false);
                        setIsNoteMode(false);
                      }
                    });
                  }}
                >
                  Delete
                </button>
              )}

              <button
                className="rename-save-btn"
                onClick={() => {
                  if (isNoteMode) {
                    handleSaveNote(renamingFormId, internalNote); // You define this function
                  } else if (isDuplicateMode) {
                    handleDuplicateForm(renamingFormId, renameTitle);
                  } else {
                    handleRenameSubmit(renamingFormId);
                  }
                  setIsRenameModalOpen(false);
                  setIsDuplicateMode(false);
                  setIsNoteMode(false);
                }}
              >
                {isNoteMode ? "Save" : isDuplicateMode ? "Duplicate" : "Continue"}
              </button>

            </div>
          </div>
        </div>
      )}

      {/* Search Popup */}
      {
        isSearchPopupOpen && (
          <SearchPopup ref={searchPopupRef} $isOpen={isSearchPopupOpen}>
            <input
              type="text"
              className="search-input"
              placeholder="Search all workspaces..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="search-sections">
              {/* Actions Section */}
              <div className="search-section-title">Actions</div>
              <div className="actions">
                <button className="new-form-btn" data-bs-toggle="modal" data-bs-target="#myModal" onClick={() => setIsSearchPopupOpen(false)}>
                  <i className="fa fa-plus search-modal-plus-icon"></i> New Form
                </button>
              </div>

              {/* Navigation Section */}
              <div className="search-section-title">Navigation</div>
              <div className="form-list">
                {forms
                  .filter((form) => form.title.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((form) => (
                    <div
                      key={form.form_id}
                      className="form-item"
                      onClick={() => navigate(`/form-builder/${form.form_id}`)}
                    >
                      <i className="fa-solid fa-file-alt search-modal-form-icon"></i>
                      <span className="form-name">{form.title}</span>
                    </div>
                  ))}
              </div>
            </div>
          </SearchPopup>
        )
      }

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
                <div className="option-card blank-card" onClick={handleBlankClick}>
                  <div className="option-icon colored-icon-blank">
                    <i className="fa-solid fa-file-alt" style={{ color: "rgb(26, 115, 232)" }}></i>
                  </div>
                  <div className="option-text">Blank</div>
                  <small className="option-subtext">Start from scratch</small>
                </div>
                <div className="option-card template-card" onClick={handleTemplateClick}>
                  <div className="option-icon colored-icon-template">
                    <i className="fa-solid fa-folder-open" style={{ color: "black" }}></i>
                  </div>
                  <div className="option-text">Template</div>
                  <small className="option-subtext">Pre-built designs</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`modal fade ${showTemplateModal ? "show d-block" : ""}`} id="templateModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Select a Template</h5>
              <button type="button" className="btn-close" onClick={() => setShowTemplateModal(false)}></button>
            </div>
            <div className="modal-body" style={{ height: "500px", overflowY: "auto" }}>
              {!isPreview ? (
                // Show template grid first
                <div className="template-grid">
                  {templates.map((template, index) => (
                    <div key={index} className="template-card" onClick={() => {
                      setSelectedTemplate(template);
                      setIsPreview(true); // Switch to preview mode after selecting a template
                    }}>
                      <img src={template.image} alt={template.name} className="template-image" />
                      <p className="template-name">{template.name}</p>
                    </div>
                  ))}
                </div>
              ) : (
                // Show template preview when isPreview is true
                <div className="template-preview">
                  <img src={selectedTemplate.image} alt={selectedTemplate.name} className="full-template-image" style={{ width: "100%", borderRadius: "8px" }} />
                  <div className="button-group" style={{ marginTop: "20px", textAlign: "center" }}>
                    <button className="btn btn-secondary me-2" onClick={handleBackClick}>Back</button>
                    <button className="btn btn-primary" onClick={handleUseTemplateclick}>Use This Template</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}

export default Home;