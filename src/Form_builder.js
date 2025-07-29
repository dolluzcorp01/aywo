import { Rnd } from "react-rnd";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { apiFetch, API_BASE } from "./utils/api";
import Swal from "sweetalert2";
import { useNotification } from "./NotificationContext";
import {
    FaEnvelope, FaHashtag, FaList, FaCheckSquare, FaCaretDown,
    FaCalendarAlt, FaAlignLeft, FaFileAlt, FaRegTrashAlt, FaRuler, FaTable,
    FaToggleOn, FaTh, FaCheck, FaImage, FaBoxes, FaGripHorizontal, FaSearch,
    FaGripVertical, FaCog, FaClone, FaExchangeAlt, FaHeading, FaChevronUp, FaChevronDown,
    FaClock, FaRegClock, FaCalendarCheck, FaSortNumericDown, FaStar, FaSlidersH, FaSmile,
    FaEquals, FaBars, FaMapMarkerAlt, FaVideo, FaFilePdf, FaMinus, FaTimes, FaYoutube
} from "react-icons/fa";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChromePicker } from 'react-color';
import Select from 'react-select';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import "./Form_builder.css";

const fieldIcons = {
    "Heading": <FaHeading />,
    "Paragraph": <FaAlignLeft />,
    "Banner": <FaFileAlt />,

    "Dropdown": <FaCaretDown />,
    "Picture": <FaImage />,
    "Multiple Select": (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: "#F59E0B" }}>
            <FaChevronUp style={{ height: '0.45rem', width: '0.65rem' }} />
            <FaChevronDown style={{ height: '0.45rem', width: '0.65rem' }} />
        </div>
    ),
    "Switch": <FaToggleOn />,
    "Multiple Choice": <FaList />,
    "Multiple Select Checkboxes": <FaBoxes />,
    "Choice Matrix": <FaGripHorizontal />,
    "Checkbox": <FaCheckSquare />,

    "Date Picker": <FaCalendarAlt />,
    "Date Time Picker": <FaClock />,
    "Time Picker": <FaRegClock />,
    "Date Range": <FaCalendarCheck />,

    "Ranking": <FaSortNumericDown />,
    "Star Rating": <FaStar />,
    "Slider": <FaSlidersH />,
    "Opinion Scale": <FaSmile />,

    "Short Answer": <FaEquals />,
    "Long Answer": <FaBars />,

    "Email": <FaEnvelope />,
    "Number": <FaHashtag />,
    "Address": <FaMapMarkerAlt />,
    "Document Type": <FaFileAlt />,

    "Image": <FaImage />,
    "Video": <FaVideo />,
    "PDF": <FaFilePdf />,
    "YouTubeVideo": <FaYoutube style={{ color: "#FF0000" }} />,

    "Divider": <FaMinus />
};

const fontsList = [
    "Roboto", "Open Sans", "Noto Sans JP", "Montserrat", "Inter", "Poppins",
    "Lato", "Raleway", "Ubuntu", "PT Sans", "Oswald", "Merriweather"
];

const FormBuilder = () => {
    const [formPages, setFormPages] = useState([]);
    const [newPageTitle, setNewPageTitle] = useState("");

    const [showDesignSidebar, setShowDesignSidebar] = useState(false);
    const [showFieldSidebar, setShowFieldSidebar] = useState(true);
    const [activeTab, setActiveTab] = useState("current");

    const [activeColorPicker, setActiveColorPicker] = useState(null);
    const pickerRef = useRef(null);

    const [formTitle, setFormTitle] = useState("");
    const [templateFormTitle, setTemplateFormTitle] = useState("");

    const [fields, setFields] = useState([]);
    const [fieldTypeMenu, setFieldTypeMenu] = useState(null); // stores id of field and position
    const [hovered, setHovered] = useState(null);
    const [editImageOption, setEditImageOption] = useState(null);

    const [focusedFieldId, setFocusedFieldId] = useState(null);
    const [focusedOptionId, setFocusedOptionId] = useState(null);
    const [focusedSubField, setFocusedSubField] = useState(null);

    const [formBgColor, setFormBgColor] = useState("lightgray");
    const [formColor, setformColor] = useState("white");
    const [formPrimaryColor, setformPrimaryColor] = useState("#3B82F6");
    const [formQuestionColor, setformQuestionColor] = useState("black");
    const [formAnswersColor, setformAnswersColor] = useState("rgb(55, 65, 81)");
    const [selectedFont, setSelectedFont] = useState("");

    const [search, setSearch] = useState("");
    const [tempFont, setTempFont] = useState(selectedFont);

    const [searchTerm, setSearchTerm] = useState("");

    const location = useLocation();

    const [showCustomize, setShowCustomize] = useState(true);

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const [selectedFieldId, setSelectedFieldId] = useState(null);
    const [customizeVisible, setCustomizeVisible] = useState(false);

    const pictureBgColors = ["#ffb3ba", "#bae1ff", "#baffc9", "#ffffba", "#e3baff", "#ffdfba"];
    const [hoveredOption, setHoveredOption] = useState(null);

    const [isMobile, setIsMobile] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [showNewPageModal, setShowNewPageModal] = useState(false);
    const [activeBtnColorPicker, setActiveBtnColorPicker] = useState(null);
    const [formbgImage, setFormbgImage] = useState(null);

    const pagesContainerRef = useRef();
    const [showArrows, setShowArrows] = useState(false);

    const urlmatch = location.pathname.match(/\/form-builder\/form-(\d+)\/page-(\w+)/);
    const pageId = urlmatch ? Number(urlmatch[2]) : null;

    // Check overflow on mount & when pages change
    useEffect(() => {
        const checkOverflow = () => {
            if (pagesContainerRef.current) {
                const isOverflowing = pagesContainerRef.current.scrollWidth > pagesContainerRef.current.clientWidth;
                setShowArrows(isOverflowing);
            }
        };

        checkOverflow();
        window.addEventListener('resize', checkOverflow);
        return () => window.removeEventListener('resize', checkOverflow);
    }, [formPages]);

    const scrollPages = (offset) => {
        if (pagesContainerRef.current) {
            pagesContainerRef.current.scrollBy({
                left: offset,
                behavior: 'smooth',
            });
        }
    };

    const [menuOpenForPageId, setMenuOpenForPageId] = useState(null);
    const [menuPosition, setMenuPosition] = useState({ top: 100, left: window.innerWidth / 2 });
    const [duplicatePageTitle, setDuplicatePageTitle] = useState("");
    const [pageToDuplicate, setPageToDuplicate] = useState(null);
    const [copiedFormId, setCopiedFormId] = useState("");
    const [copiedPageId, setCopiedPageId] = useState("");

    const handleMenuToggle = (e, pageId) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();

        const isSinglePage = formPages.length === 1;
        const yOffset = isSinglePage ? 166 : 240;  // ✅ Lower if only Rename/Copy/Duplicate shown
        setMenuPosition({
            top: rect.bottom - yOffset,
            left: rect.left + rect.width / 2 + 100
        });
        setMenuOpenForPageId(prev => (prev === pageId ? null : pageId));
    };

    const popupRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                setMenuOpenForPageId(null);
                setRenamingPageId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const openDuplicateModal = (page) => {
        const originalTitle = page.page_title.trim();
        let baseTitle = originalTitle;

        // 👇 Remove existing (Copy) or (Copy X)
        const copyRegex = /\s*\(Copy(?:\s*\d*)?\)$/i;
        if (copyRegex.test(baseTitle)) {
            baseTitle = baseTitle.replace(copyRegex, '').trim();
        }

        // Count existing copies
        let copyCount = 0;

        formPages.forEach(p => {
            const title = p.page_title.trim();
            if (title === `${baseTitle} (Copy)`) {
                copyCount = Math.max(copyCount, 1);
            }
            const match = title.match(new RegExp(`^${baseTitle}\\s*\\(Copy\\s*(\\d+)\\)$`, 'i'));
            if (match && Number(match[1]) > copyCount) {
                copyCount = Number(match[1]);
            }
        });

        // ✅ Generate next copy title
        let newTitle;
        if (copyCount === 0) {
            newTitle = `${baseTitle} (Copy)`;
        } else {
            newTitle = `${baseTitle} (Copy ${copyCount + 1})`;
        }
        setPageToDuplicate(page);
        setDuplicatePageTitle(newTitle);
    };

    //Rename pages
    const [renamingPageId, setRenamingPageId] = useState(null);
    const [renamePageTitle, setRenamePageTitle] = useState("");

    const handlePageRenameSubmit = (pageId) => {
        if (!renamePageTitle.trim()) {
            Swal.fire("Error", "Page title cannot be empty.", "error");
            return;
        }
        Swal.fire({
            title: "Confirm Rename",
            text: "Do you want to rename this page?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Yes, Rename",
            cancelButtonText: "Cancel",
        }).then((result) => {
            if (result.isConfirmed) {
                apiFetch(`/api/form_builder/rename-page/${pageId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title: renamePageTitle }),
                    credentials: "include",
                })
                    .then((res) => {
                        if (!res.ok) {
                            return res.json().then(err => { throw new Error(err.error || "Failed to rename page"); });
                        }
                        return res.json();
                    })
                    .then(() => {
                        setFormPages(prev =>
                            prev.map(p => p.id === pageId ? { ...p, page_title: renamePageTitle } : p)
                        );
                        setRenamingPageId(null);
                        setRenamePageTitle("");
                        Swal.fire("Renamed!", "Page renamed successfully.", "success");
                    })
                    .catch((error) => {
                        console.error("Error renaming page:", error);
                        Swal.fire("Error", error.message, "error");
                    });
            }
        });
    };

    const handleSetAsFirstPage = async (page_number) => {
        setSkipSaveCheck(true);
        const reorderedPages = [...formPages];
        const pageIndex = reorderedPages.findIndex(p => p.page_number === page_number);

        if (pageIndex === -1) return;  // Page not found

        // Remove and move to the start
        const [pageToMove] = reorderedPages.splice(pageIndex, 1);
        reorderedPages.unshift(pageToMove);

        setFormPages(reorderedPages);

        const updatedOrder = reorderedPages.map((page, index) => ({
            id: page.id,
            sort_order: index + 1
        }));

        const lastPageId = formPages[formPages.length - 1]?.id;

        const match = location.pathname.match(/\/form-builder\/form-(\d+)/);
        const formId = match ? match[1] : null;

        try {
            await fetch('/api/form_builder/update-page-order', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ pages: updatedOrder })
            });

            const res = await fetch("/api/form_builder/check-pages-btnfields", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    pageIds: reorderedPages.map(p => p.id),
                    lastPageId,
                    formId
                })
            });

            const data = await res.json();
            const { submitbtnField, nextbtnfield } = data;

            const newFields = fields.map(field => {
                if (field.type === "Submit" || field.type === "Next") {
                    if (submitbtnField && field.id === submitbtnField.id) {
                        return {
                            ...field,
                            type: "Next",
                            field_type: "Next",
                            label: submitbtnField.label || "Next"
                        };
                    }

                    if (nextbtnfield && field.id === nextbtnfield.id) {
                        return {
                            ...field,
                            type: "Submit",
                            field_type: "Submit",
                            label: nextbtnfield.label || "Submit"
                        };
                    }
                }
                return field;
            }).filter(Boolean);

            setFields(newFields);

        } catch (error) {
            console.error("❌ Error setting page as first:", error);
        }
    };

    //Duplicate pages
    const handleDuplicatePage = async () => {
        const match = location.pathname.match(/\/form-builder\/form-(\d+)\/page-(\w+)/);
        const formId = match ? match[1] : null;
        const page_number = match ? Number(match[2]) : null;
        const page = formPages.find(p => p.page_number === page_number);

        if (!formId || !page?.id) {
            Swal.fire("Error", "Form or Page ID not found", "error");
            return;
        }
        if (!duplicatePageTitle.trim()) {
            Swal.fire("Error", "Page title cannot be empty.", "error");
            return;
        }
        try {
            const res = await fetch(`/api/form_builder/duplicate-page`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ pageId: page.id, formId, newPageTitle: duplicatePageTitle }),
            });

            const result = await res.json();
            if (!res.ok) {
                Swal.fire("Error", result.error || "Duplication failed", "error");
                return;
            }

            if (res.ok) {
                // ✅ Call check-pages-btnfields
                const reorderedPages = [...formPages, { id: result.newPageId }];
                const lastPageId = formPages[formPages.length - 1]?.id;

                await fetch("/api/form_builder/check-pages-btnfields", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        pageIds: reorderedPages.map(p => p.id),
                        lastPageId,
                        formId,
                    })
                });

                Swal.fire("Success", "Page duplicated successfully!", "success");
                const modal = document.getElementById('DuplicateModalCenter');
                if (modal) {
                    modal.classList.remove("show");
                    modal.style.display = "none";
                }
                document.body.classList.remove("modal-open");
                document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());
                navigate(`/form-builder/form-${formId}/page-${result.newPageNumber}`);
            } else {
                Swal.fire("Error", result.error || "Duplication failed", "error");
            }
        } catch (err) {
            console.error("Duplicate page error:", err);
            Swal.fire("Error", "Server error occurred", "error");
        }
    };

    const handleDeletePage = (pageId, page_number) => {
        Swal.fire({
            title: "Are you sure?",
            text: "This page will be deleted!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!"
        }).then((result) => {
            if (result.isConfirmed) {
                apiFetch(`/api/form_builder/delete-page/${pageId}`, {
                    method: "DELETE",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ page_number }) // ✅ must match param name
                })
                    .then((response) => {
                        if (!response.ok) {
                            throw new Error("Failed to delete page");
                        }
                        return response.json();
                    })
                    .then(() => {
                        setFormPages(prev => {
                            const updatedPages = prev.filter(p => p.id !== pageId);

                            // ✅ Navigate if needed
                            if (updatedPages.length > 0) {
                                const currentIndex = prev.findIndex(p => p.id === pageId);
                                let targetPageNumber;

                                if (prev[currentIndex + 1]) {
                                    targetPageNumber = prev[currentIndex + 1].page_number;
                                } else if (prev[currentIndex - 1]) {
                                    targetPageNumber = prev[currentIndex - 1].page_number;
                                }

                                if (targetPageNumber) {
                                    navigate(`/form-builder/form-${formId}/page-${targetPageNumber}`);
                                }
                            }

                            // ✅ Call check-pages-btnfields with updated pages!
                            apiFetch(`/api/form_builder/check-pages-btnfields`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                credentials: "include",
                                body: JSON.stringify({
                                    pageIds: updatedPages.map(p => p.id),
                                    lastPageId: updatedPages[updatedPages.length - 1]?.id,
                                    formId
                                })
                            })
                                .then(res => res.json())
                                .then(data => {
                                    console.log("✅ check-pages-btnfields result:", data);
                                    // Update local state if needed!
                                })
                                .catch(err => console.error("Failed to check pages btn fields:", err));

                            return updatedPages;
                        });

                        Swal.fire("Deleted!", "Your page has been deleted.", "success");
                    })
                    .catch((error) => {
                        console.error("Error deleting page:", error);
                        Swal.fire("Error", "Failed to delete page", "error");
                    });
            }
        });
    };

    const handleBackgroundImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 1 * 1024 * 1024) {
                Swal.fire({
                    icon: 'error',
                    title: 'File Too Large',
                    text: 'Please select a file smaller than 1MB.',
                });
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setFormbgImage(reader.result); // base64 string
            };
            reader.readAsDataURL(file);
        }
    };

    const match = location.pathname.match(/\/form-builder\/form-(\d+)\/page-(\w+)/);
    const formId = match ? match[1] : null;
    const pageParam = match ? match[2] : null;

    const searchParams = new URLSearchParams(location.search);
    const version = searchParams.get('version');

    const [originalFields, setOriginalFields] = useState([]);
    const [isSaveEnabled, setIsSaveEnabled] = useState(false);
    const [skipSaveCheck, setSkipSaveCheck] = useState(false);

    const handlePageNavigation = (pageNumber) => {
        if (isSaveEnabled) {
            Swal.fire({
                title: "Unsaved changes",
                text: "You have unsaved changes. Do you want to leave without saving?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "Leave without saving",
                cancelButtonText: "Stay on page",
            }).then((result) => {
                if (result.isConfirmed) {
                    navigate(`/form-builder/form-${formPages[0].form_id}/page-${pageNumber}`);
                }
                // If they click cancel: do nothing
            });
        } else {
            navigate(`/form-builder/form-${formPages[0].form_id}/page-${pageNumber}`);
        }
    };

    const [originalFormColors, setOriginalFormColors] = useState({
        formBgColor: "",
        formColor: "",
        formPrimaryColor: "",
        formQuestionColor: "",
        formAnswersColor: "",
        selectedFont: ""
    });

    function areFormColorsEqual(current, original) {
        return (
            current.formBgColor === original.formBgColor &&
            current.formColor === original.formColor &&
            current.formPrimaryColor === original.formPrimaryColor &&
            current.formQuestionColor === original.formQuestionColor &&
            current.formAnswersColor === original.formAnswersColor &&
            current.selectedFont === original.selectedFont
        );
    }

    function equalUserInput(a, b) {
        return (a ?? "") === (b ?? "");
    }

    function areFieldsEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;

        for (let i = 0; i < arr1.length; i++) {
            const f1 = arr1[i];
            const f2 = arr2[i];

            if (f1.type !== f2.type) return false;

            if (!["Submit", "Next"].includes(f1.type)) {
                if (f1.id !== f2.id) return false;
            }

            if (["Submit", "Next"].includes(f1.type)) {
                const keysToCheck = ["type", "label", "btnalignment", "btnbgColor", "btnlabelColor"];
                for (const key of keysToCheck) {
                    let val1 = f1[key] ?? null;
                    let val2 = f2[key] ?? null;
                    if (key === "font_size") {
                        if (parseInt(val1) !== parseInt(val2)) return false;
                    } else {
                        if (val1 !== val2) return false;
                    }
                }
                continue;
            }

            for (const key in f1) {
                const val1 = f1[key];
                const val2 = f2[key];

                if (["value", "address", "city", "state", "zip"].includes(key)) {
                    if (!equalUserInput(val1, val2)) return false;
                    continue;
                }

                if (key === "default_value" && ["Checkbox", "Switch"].includes(f1.type)) {
                    const v1 = val1 === true || val1 === "true";
                    const v2 = val2 === true || val2 === "true";
                    if (v1 !== v2) return false;
                    continue;
                }

                // ✅ Special compare for Picture options
                if (key === "options" && f1.type === "Picture") {
                    if (val1.length !== val2.length) return false;

                    for (let j = 0; j < val1.length; j++) {
                        const opt1 = val1[j];
                        const opt2 = val2[j];

                        if (opt1.id !== opt2.id) return false;
                        if ((opt1.option_text ?? "") !== (opt2.option_text ?? "")) return false;
                        if ((opt1.image_path ?? "") !== (opt2.image_path ?? "")) return false;
                        if ((opt1.options_style ?? "") !== (opt2.options_style ?? "")) return false;
                        if ((opt1.sort_order ?? 0) !== (opt2.sort_order ?? 0)) return false;
                    }
                    continue;
                }

                if (Array.isArray(val1) && Array.isArray(val2)) {
                    if (val1.length !== val2.length) return false;
                    for (let j = 0; j < val1.length; j++) {
                        if (typeof val1[j] === 'object') {
                            if (JSON.stringify(val1[j]) !== JSON.stringify(val2[j])) return false;
                        } else {
                            if (val1[j] !== val2[j]) return false;
                        }
                    }
                } else if (typeof val1 === 'object' && val1 !== null) {
                    if (JSON.stringify(val1) !== JSON.stringify(val2)) return false;
                } else {
                    if (val1 !== val2) return false;
                }
            }

            for (const key in f2) {
                if (!(key in f1)) return false;
            }
        }

        return true;
    }

    useEffect(() => {
        if (skipSaveCheck) return;

        const sameFields = areFieldsEqual(fields, originalFields);
        const sameFormColors = areFormColorsEqual(
            {
                formBgColor,
                formColor,
                formPrimaryColor,
                formQuestionColor,
                formAnswersColor,
                selectedFont
            },
            originalFormColors
        );

        const isSame = sameFields && sameFormColors;
        setIsSaveEnabled(!isSame);

    }, [
        fields,
        originalFields,
        formBgColor,
        formColor,
        formPrimaryColor,
        formQuestionColor,
        formAnswersColor,
        selectedFont,
        originalFormColors
    ]);

    async function fetchForm(formId, pageId, version) {
        try {
            let url = `/api/form_builder/get-specific-form/${formId}/page/${pageId}`;
            if (version) {
                url += `?version=${version}`;
            }

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    navigate("/form-builder");
                } else {
                    Swal.fire("Error", "Something went wrong", "error");
                }
                return;
            }

            const data = await response.json();
            // Set background image if available
            if (data.background_image) {
                setFormbgImage(`${API_BASE}/${data.background_image.replace(/\\/g, "/")}`);
            }

            setFormBgColor(data.background_color || "#f8f9fa");
            setformColor(data.questions_background_color || "#fff");
            setformPrimaryColor(data.primary_color || "#3b82f6");
            setformQuestionColor(data.questions_color || "black");
            setformAnswersColor(data.answers_color || "rgb(55, 65, 81)");
            setSelectedFont(data.font || "");
            setColors({
                background: data.background_color || "#f8f9fa",
                questionsBackground: data.questions_background_color || "#fff",
                primary: data.primary_color || "#3b82f6",
                questions: data.questions_color || "#333333",
                answers: data.answers_color || "#000000",
            });

            setOriginalFormColors({
                formBgColor: data.background_color || "#f8f9fa",
                formColor: data.questions_background_color || "#fff",
                formPrimaryColor: data.primary_color || "#3b82f6",
                formQuestionColor: data.questions_color || "black",
                formAnswersColor: data.answers_color || "rgb(55, 65, 81)",
                selectedFont: data.font || ""
            });

            setFormTitle(typeof data.title === "string" ? data.title : "testform");

            if (Array.isArray(data.fields)) {
                const processedFields = data.fields.map(field => {
                    const normalizedRequired = field.required === "Yes" || field.required === true;

                    if (field.type === "Heading") {
                        return {
                            ...field,
                            required: normalizedRequired,
                            alignment: field.heading_alignment || "center" // 👈 map DB field to frontend field.alignment
                        };
                    }

                    if (field.type === "ThankYou") {
                        const thankyouData = field.thankyouData?.[0] || {};
                        return {
                            ...field,
                            required: normalizedRequired,
                            thankyou_heading: thankyouData.thankyou_heading || "Thank you",
                            thankyou_subtext: thankyouData.thankyou_subtext || "Made with dForms, the easy way to make stunning forms",
                            hideIcon: thankyouData.show_tick_icon === 0 // if 0, hide icon
                        };
                    }

                    if (field.type === "Choice Matrix") {
                        const rows = field.matrix
                            .filter(m => m.row_label !== null)
                            .map(m => m.row_label);
                        const columns = field.matrix
                            .filter(m => m.column_label !== null)
                            .map(m => m.column_label);

                        return {
                            ...field,
                            required: normalizedRequired,
                            rows: rows,
                            columns: columns,
                            selectedMatrix: []
                        };
                    }

                    if (field.type === "Multiple Choice") {
                        const hasBubbleStyle = field.options?.some(opt => opt.options_style === "bubble");
                        return {
                            ...field,
                            required: normalizedRequired,
                            bubble: hasBubbleStyle,
                            selectedOption: null
                        };
                    }

                    if (field.type === "YouTubeVideo") {
                        const upload = field.uploads?.[0] || {};
                        return {
                            ...field,
                            required: normalizedRequired,
                            youtubeUrl: upload.youtube_url || "",
                            previewSize: upload.file_field_size || 300
                        };
                    }

                    return {
                        ...field,
                        required: normalizedRequired
                    };
                });

                setFields(processedFields);
                setOriginalFields(processedFields);
                setIsSaveEnabled(false);
            } else {
                console.warn("⚠️ Unexpected fields data:", data.fields);
                setFields([]);
                setOriginalFields([]);
                setIsSaveEnabled(false);
                Swal.fire("Warning", "Form data loaded but fields are invalid or missing.", "warning");
            }

        } catch (error) {
            console.error("❌ Error fetching form:", error);
            Swal.fire("Error", "Server error occurred while fetching the form.", "error");
        }
    };

    useEffect(() => {
        const pathname = location.pathname;
        const isTemplate = pathname.includes("/form-builder/template-");
        const isForm = pathname.includes("/form-builder/form-");

        if (isTemplate) {
            setShowTemplateModal(true); // 👈 Show template naming modal
            return;
        }

        if (formId && pageParam) {
            if (version && isNaN(version)) {
                Swal.fire("Invalid Version", "Version must be a number.", "error");
                return;
            }

            if (pageParam === "end") {
                fetchForm(formId, "end");
            } else {
                fetchForm(formId, pageParam, version);
            }
        } else {
            setShowModal(true); // 👈 Show default modal
        }
    }, [location.pathname, location.search]);

    useEffect(() => {
        const match = location.pathname.match(/\/form-builder\/form-(\d+)/);
        const formId = match ? match[1] : null;
        if (formId) fetchFormPages(formId);
    }, [location]);

    const fetchFormPages = async (formId) => {
        try {
            const res = await fetch(`/api/form_builder/get-form-pages/${formId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include"
            });

            const data = await res.json();
            if (res.ok) {
                setFormPages(data.pages || []);
            } else {
                Swal.fire("Error", data.error || "Unable to fetch pages", "error");
            }
        } catch (error) {
            console.error("❌ Error loading pages:", error);
        }
    };

    const handleEndingPage = async () => {
        try {
            const match = location.pathname.match(/\/form-builder\/form-(\d+)/);
            const formId = match ? match[1] : null;

            navigate(`/form-builder/form-${formId}/page-end`);
        } catch (error) {
            console.error("❌ Error loading pages:", error);
        }
    };

    const handleDragEnd = async (result) => {
        if (!result.destination) return;
        setSkipSaveCheck(true);
        const reorderedPages = Array.from(formPages);
        const [movedPage] = reorderedPages.splice(result.source.index, 1);
        reorderedPages.splice(result.destination.index, 0, movedPage);

        setFormPages(reorderedPages);

        const updatedOrder = reorderedPages.map((page, index) => ({
            id: page.id,
            sort_order: index + 1
        }));

        const lastPageId = formPages[formPages.length - 1]?.id;

        const match = location.pathname.match(/\/form-builder\/form-(\d+)/);
        const formId = match ? match[1] : null;

        try {
            await fetch('/api/form_builder/update-page-order', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ pages: updatedOrder })
            });

            // ✅ Call backend to get which pages have fields
            const res = await fetch("/api/form_builder/check-pages-btnfields", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    pageIds: reorderedPages.map(p => p.id),
                    lastPageId,
                    formId
                })
            });

            const data = await res.json();
            const { submitbtnField, nextbtnfield } = data;

            const newFields = fields.map(field => {
                if (field.type === "Submit" || field.type === "Next") {
                    if (submitbtnField && field.id === submitbtnField.id) {
                        return {
                            ...field,
                            type: "Next",
                            field_type: "Next",
                            label: submitbtnField.label || "Next"
                        };
                    }

                    if (nextbtnfield && field.id === nextbtnfield.id) {
                        return {
                            ...field,
                            type: "Submit",
                            field_type: "Submit",
                            label: nextbtnfield.label || "Submit"
                        };
                    }
                }
                return field;
            }).filter(Boolean);

            setFields(newFields);

        } catch (error) {
            console.error("❌ Error updating page order:", error);
        }
    };

    const handleContinue = async () => {
        if (!formTitle.trim()) {
            Swal.fire("Validation", "Form name cannot be empty.", "warning");
            return;
        }

        try {
            const response = await fetch("/api/form_builder/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ title: formTitle }),
                credentials: "include",
            });

            const result = await response.json();

            if (response.status === 401) {
                Swal.fire("Unauthorized", "User not logged in or missing user ID.", "error");
                return;
            }

            if (response.status === 409) {
                Swal.fire("Duplicate", "A form with this name already exists. Please choose a different name.", "error");
                return;
            }

            if (response.ok && result.form_id) {
                Swal.fire("Success", "Form created successfully!", "success");
                setShowModal(false);
                navigate(`/form-builder/form-${result.form_id}/page-${result.page_id}`);
            } else {
                Swal.fire("Error", result.message || "Form creation failed", "error");
            }
        } catch (error) {
            console.error("❌ Form creation failed:", error);
            Swal.fire("Error", "Server error occurred.", "error");
        }
    };

    const handleTemplateFormContinue = async () => {
        if (!templateFormTitle.trim()) {
            Swal.fire("Validation", "Form name cannot be empty.", "warning");
            return;
        }
        const pathname = location.pathname;
        const match = pathname.match(/template-(\d+)/);
        const formId = match?.[1];
        try {
            const response = await apiFetch(`/api/form_builder/duplicate-template/${formId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: templateFormTitle }),
                credentials: "include",
            });
            const result = await response.json();

            if (response.status === 401) {
                Swal.fire("Unauthorized", "User not logged in or missing user ID.", "error");
                return;
            }

            if (response.status === 409) {
                Swal.fire("Duplicate", "A form with this name already exists. Please choose a different name.", "error");
                return;
            }

            if (response.ok && result.newFormId) {
                Swal.fire("Success", "Form created successfully!", "success");
                setShowTemplateModal(false);
                navigate(`/form-builder/form-${result.newFormId}/page-1`);
            } else {
                Swal.fire("Error", result.message || "Form creation failed", "error");
            }
        } catch (error) {
            console.error("❌ Form creation failed:", error);
            Swal.fire("Error", "Server error occurred.", "error");
        }
    };

    const handleNewPageContinue = async () => {
        const match = location.pathname.match(/\/form-builder\/form-(\d+)\/page-(\d+)/);
        const formId = match ? match[1] : null;

        const pageTitle = newPageTitle.trim();

        if (!formId) {
            Swal.fire("Error", "Form ID not found in URL.", "error");
            return;
        }

        if (!pageTitle) {
            Swal.fire("Validation", "Page title cannot be empty.", "warning");
            return;
        }

        // ✅ Check if user pasted a copy code
        if (pageTitle.startsWith("dforms-copy:")) {
            const encoded = pageTitle.split("dforms-copy:")[1];
            try {
                const decoded = atob(encoded); // "formId:pageId"
                const [copiedFormId, copiedPageId] = decoded.split(":");
                if (!copiedFormId || !copiedPageId) throw new Error("Invalid copy code");

                const match = location.pathname.match(/\/form-builder\/form-(\d+)\/page-(\w+)/);
                const currentFormId = match ? match[1] : null;

                const res = await fetch(`/api/form_builder/copy-page`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        current_formId: currentFormId,
                        copiedFormId,
                        copiedPageId,
                        newPageTitle
                    }),
                });
                const result = await res.json();

                if (res.ok && result.newPageId) {
                    const lastPageId = formPages[formPages.length - 1]?.id;

                    const match = location.pathname.match(/\/form-builder\/form-(\d+)/);
                    const formId = match ? match[1] : null;

                    // ✅ Add result.page_id to reorderedPages if not already included
                    const reorderedPages = [...formPages];
                    const isAlreadyIncluded = reorderedPages.some(p => p.id === result.newPageId);

                    if (!isAlreadyIncluded) {
                        reorderedPages.push({ id: result.newPageId });  // Add minimal object; update if needed
                    }

                    const res = await fetch("/api/form_builder/check-pages-btnfields", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({
                            pageIds: reorderedPages.map(p => p.id),
                            lastPageId,
                            formId
                        })
                    });

                    Swal.fire("Success", "New page created successfully!", "success");
                    setShowNewPageModal(false);
                    navigate(`/form-builder/form-${formId}/page-${result.newPageNumber}`);
                } else {
                    Swal.fire("Error", result.message || "Page creation failed", "error");
                }
            } catch (err) {
                console.error(err);
                Swal.fire("Error", "Copy failed. Please try again.", "error");
            }
            return;
        }
        else {
            try {
                const response = await fetch("/api/form_builder/createnewpage", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ form_id: formId, title: pageTitle }),
                    credentials: "include",
                });

                const result = await response.json();

                if (response.status === 401) {
                    Swal.fire("Unauthorized", "User not logged in or missing user ID.", "error");
                    return;
                }

                if (response.ok && result.page_id) {
                    const lastPageId = formPages[formPages.length - 1]?.id;

                    const match = location.pathname.match(/\/form-builder\/form-(\d+)/);
                    const formId = match ? match[1] : null;

                    // ✅ Add result.page_id to reorderedPages if not already included
                    const reorderedPages = [...formPages];
                    const isAlreadyIncluded = reorderedPages.some(p => p.id === result.page_id);

                    if (!isAlreadyIncluded) {
                        reorderedPages.push({ id: result.page_id });  // Add minimal object; update if needed
                    }

                    const res = await fetch("/api/form_builder/check-pages-btnfields", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({
                            pageIds: reorderedPages.map(p => p.id),
                            lastPageId,
                            formId
                        })
                    });

                    Swal.fire("Success", "New page created successfully!", "success");
                    setShowNewPageModal(false);
                    navigate(`/form-builder/form-${formId}/page-${result.page_number}`);
                } else {
                    Swal.fire("Error", result.message || "Page creation failed", "error");
                }
            } catch (error) {
                console.error("❌ Page creation failed:", error);
                Swal.fire("Error", "Server error occurred.", "error");
            }
        }
    };

    useEffect(() => {
        const handleResize = () => {
            const zoom = window.devicePixelRatio || 1;
            const screenWidth = window.innerWidth;

            // Consider as "mobile" if screen is small OR zoom is above 150%
            const isMobileCondition = screenWidth < 768 || (screenWidth / window.outerWidth) < 0.67;

            setIsMobile(isMobileCondition);
        };

        handleResize(); // run once on mount
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const MobileWarning = () => (
        <div
            style={{
                padding: "10px",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                backgroundColor: "#fff",
                maxWidth: "700px",
                width: "100%",
                margin: "20px auto",
                boxSizing: "border-box",
                overflowWrap: "break-word",
                wordBreak: "break-word",
                overflow: "hidden"
            }}
        >
            <div className="mobile-warning">
                <div className="icon" style={{ color: "#6B7280", fontSize: "1rem" }}>
                    <i className="fa-solid fa-desktop"></i>
                </div>
                <h2 style={{ fontWeight: "700", color: "#374151" }}>
                    The dForms editor works best on larger screens
                </h2>
                <p style={{ color: "#6B7280", fontWeight: "bolder" }}>
                    Note that the forms you build <u>will work</u> on mobile devices!
                </p>
            </div>
        </div>
    );

    const filteredFonts = fontsList.filter(font =>
        font.toLowerCase().includes(search.toLowerCase())
    );

    const handleFontSelect = (font) => {
        setTempFont(font);
    };

    const handleDone = () => {
        setSelectedFont(tempFont);
        document.getElementById("fontCloseBtn")?.click();
    };

    const fieldWrapperRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                setActiveColorPicker(null);
            }
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                setActiveBtnColorPicker(null);
            }
            if (
                fieldWrapperRef.current &&
                !fieldWrapperRef.current.contains(event.target)
            ) {
                setSelectedFieldId(null);
                setShowCustomize(false);
            }
            setFieldTypeMenu(null);
        };

        window.addEventListener("click", handleClickOutside);
        return () => window.removeEventListener("click", handleClickOutside);
    }, []);

    const handleFieldClick = (id) => {
        if (selectedFieldId !== id) {
            setSelectedFieldId(id);
            setCustomizeVisible(true);
        }
    };

    const openSettings = (fieldId) => {
        if (selectedFieldId === fieldId) {
            // Toggle customize if already selected
            setCustomizeVisible(!customizeVisible);
        } else {
            setSelectedFieldId(fieldId);
            setCustomizeVisible(true); // Show customize on new field
        }
    };

    const changeFieldType = (id, event) => {
        event.stopPropagation(); // Prevent field selection
        const rect = event.currentTarget.getBoundingClientRect();
        setFieldTypeMenu({ id, top: rect.bottom + 8, left: rect.left });
    };

    const handleTypeChange = (fieldId, newType) => {
        setFields(prev =>
            prev.map(field =>
                field.id === fieldId ? { ...field, type: newType } : field
            )
        );
        setFieldTypeMenu(null); // close menu
    };

    const duplicateField = (id) => {
        setFields(prevFields => {
            const index = prevFields.findIndex(field => field.id === id);
            if (index === -1) return prevFields;

            const original = prevFields[index];
            const newField = {
                ...original,
                id: Date.now(), // Or use uuid() for more robust id
            };

            const updated = [...prevFields];
            updated.splice(index + 1, 0, newField); // insert after original
            return updated;
        });
    };

    const deleteField = (id) => {
        const updatedFields = fields.filter(field => field.id !== id);

        const hasRealFields = updatedFields.some(field => field.type !== "Submit" && field.type !== "Next");

        const cleanedFields = hasRealFields
            ? updatedFields
            : updatedFields.filter(field => field.type !== "Submit" && field.type !== "Next");

        setFields(cleanedFields);
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await apiFetch("/api/leftnavbar/get-user-profile", {
                    method: "GET",
                });

                if (!response.ok) throw new Error("Unauthorized");

                const data = await response.json();

                if (!data?.user_id) throw new Error("Unauthorized");

                setProfile(data);
            } catch (error) {
                navigate("/login");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    // Add new field
    const addField = (type) => {
        const newField = {
            id: Date.now(),
            type,
            field_type: type,
            label: type,
            bgColor: "#FFFFFF",
            labelColor: "#000000",
            fontSize: 16,
            options: ["Option 1", "Option 2"], // default for types with options
            customized: {}
        };

        switch (type) {
            case "Heading": // 👇 ADD THIS BLOCK
                newField.label = "Heading";
                newField.caption = "Description";
                newField.font_size = "24px";
                newField.alignment = "center";
                break;
            case "Dropdown":
            case "Multiple Choice":
            case "Multiple Select":
            case "Checkbox":
            case "Multiple Select Checkboxes":
                newField.options = [
                    { option_text: "Option 1" },
                    { option_text: "Option 2" }
                ];
                break;
            case "Opinion Scale":
                newField.min_value = 1;
                newField.max_value = 10;
                break;
            case "Slider":
                newField.min_value = 0;
                newField.max_value = 100;
                break;
            case "Choice Matrix":
                newField.rows = ["Row 1", "Row 2"];
                newField.columns = ["Column 1", "Column 2"];
                newField.options = {
                    "Row 1": { "Column 1": "", "Column 2": "" },
                    "Row 2": { "Column 1": "", "Column 2": "" }
                };
                break;
            case "Ranking":
                newField.options = [
                    { option_text: "Option 1" },
                    { option_text: "Option 2" }
                ];
                break;
            case "Star Rating":
                newField.max_value = 5;
                newField.value = 0;
                break;
            case "Date Range":
                newField.range = { from: "", to: "" };
                break;
            case "Document Type":
                newField.file = null;
                break;
            case "Address":
                newField.address = "";
                newField.city = "";
                newField.state = "";
                newField.zip = "";
                break;
            case "Picture":
                newField.options = [
                    { id: Date.now(), option_text: "Option 1", image_path: null },
                    { id: Date.now() + 1, option_text: "Option 2", image_path: null }
                ];
                break;
            case "Divider":
            case "Image":
            case "Video":
            case "PDF":
            case "ThankYou":
                newField.thankyou_heading = "Thank you";
                newField.thankyou_subtext = "Made with dForms, the easy way to make stunning forms";
                newField.show_tick_icon = true;
                break;
            default:
                break;
        }

        let updatedFields = [...fields];
        updatedFields = updatedFields.filter(f => f.type !== "Submit" && f.type !== "Next");
        updatedFields.push(newField);

        // ✅ Get current page number from URL
        const pathname = location.pathname;
        const match = pathname.match(/page-(\w+)/);
        const pageIdentifier = match ? match[1] : null;

        // ✅ If pageIdentifier is 'end', then skip Submit/Next
        if (pageIdentifier === "end") {
            setFields(updatedFields);
            setSelectedFieldId(newField.id);
            setCustomizeVisible(true);
            return;
        }

        const pageNumFromUrl = parseInt(pageIdentifier, 10);
        const currentPage = formPages.find(p => p.page_number === pageNumFromUrl);
        if (!currentPage) return;

        const sortedPages = [...formPages].sort((a, b) => a.sort_order - b.sort_order);
        const currentIndex = sortedPages.findIndex(p => p.id === currentPage.id);
        const isLastPage = currentIndex === sortedPages.length - 1;

        updatedFields.push({
            id: Date.now() + 1,
            type: isLastPage ? "Submit" : "Next",
            field_type: isLastPage ? "Submit" : "Next",
            label: isLastPage ? "Submit" : "Next",
            page_id: currentPage.page_number.toString(),
            btnalignment: "left",
            btnbgColor: formPrimaryColor,
            btnlabelColor: "#FFFFFF",
            fontSize: 16,
            customized: {}
        });

        setFields(updatedFields); // ✅ Use the cleaned and correct updated list
        setSelectedFieldId(newField.id);
        setCustomizeVisible(true);
    };

    const FieldButton = ({ type, section }) => {
        const getColor = () => {
            if (section === "Frequently used") return "#28a745";
            if (section === "Display text") return "#6c757d";
            if (section === "Choices") return "#F59E0B";
            if (section === "Time") return "#A855F7";
            if (section === "Rating & Ranking") return "rgb(239, 68, 68)";
            if (section === "Text") return "#28a745";
            if (section === "Contact Info") return "rgb(20, 184, 166)";
            if (section === "Navigation & Layout") return "#e83e8c";
            if (section === "Media") return "#3498db";
            return "#F59E0B";
        };

        const baseColor = getColor();

        const backgroundColor = `${baseColor}20`;
        const borderColor = baseColor;

        const icon = fieldIcons[type] || <FaCheck />;
        const modifiedIcon = React.cloneElement(icon, { color: baseColor, size: 12 }); // 👈 Smaller icon

        return (
            <button
                className="field-btn"
                onClick={() => addField(type)}
                style={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    padding: "12px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    width: "80px",
                    height: "80px",
                    boxSizing: "border-box"
                }}
            >
                <div
                    className="field-icon"
                    style={{
                        backgroundColor,
                        border: `1.5px solid ${borderColor}`,
                        borderRadius: "3px",
                        padding: "5px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: "5px"
                    }}
                >
                    {modifiedIcon}
                </div>
                <div className="field-label" style={{ color: "#1f2937", fontWeight: 500, fontSize: "0.65rem" }}>{type}</div>
            </button>
        );
    };

    // Function to reorder items
    const reorder = (list, startIndex, endIndex) => {
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return result;
    };

    const onDragEnd = (result) => {
        if (!result.destination) return;
        const newFields = reorder(fields, result.source.index, result.destination.index);
        setFields(newFields);
    };

    const reorderOptions = (fieldId, sourceIndex, destinationIndex) => {
        const updatedFields = fields.map(field => {
            if (field.id === fieldId) {
                const options = Array.from(field.options);
                const [removed] = options.splice(sourceIndex, 1);
                options.splice(destinationIndex, 0, removed);
                return { ...field, options };
            }
            return field;
        });

        setFields(updatedFields);
    };

    const colorOptions = [
        { label: "Background", key: "background" },
        { label: "Questions background", key: "questionsBackground" },
        { label: "Primary", key: "primary", info: "Border color for inputs, default color for buttons and other primary elements." },
        { label: "Questions", key: "questions" },
        { label: "Answers", key: "answers" }
    ];

    const [colors, setColors] = useState({
        background: "#F8F9FA",
        questionsBackground: "#FFFFFF",
        primary: "#3B82F6",
        questions: "#333333",
        answers: "rgb(55, 65, 81)",
    });

    const inputfieldBgColor = useMemo(() => getTextColor(formColor), [formColor]);

    function getTextColor(bgColor, overlayOpacity = 0.09) {
        if (!bgColor) return "#000000";
        if (bgColor.toLowerCase() === "white") bgColor = "#ffffff";
        if (bgColor.toLowerCase() === "#fff") bgColor = "#ffffff";

        // Convert hex to RGB
        const color = bgColor.startsWith("#") ? bgColor.slice(1) : bgColor;
        const r = parseInt(color.substring(0, 2), 16);
        const g = parseInt(color.substring(2, 4), 16);
        const b = parseInt(color.substring(4, 6), 16);

        // White color for blending
        const whiteR = 255;
        const whiteG = 255;
        const whiteB = 255;

        // Blend formula: result = (1 - alpha) * base + alpha * white
        const mixedR = Math.round((1 - overlayOpacity) * r + overlayOpacity * whiteR);
        const mixedG = Math.round((1 - overlayOpacity) * g + overlayOpacity * whiteG);
        const mixedB = Math.round((1 - overlayOpacity) * b + overlayOpacity * whiteB);

        // Convert back to hex
        const toHex = (val) => val.toString(16).padStart(2, '0');
        return `#${toHex(mixedR)}${toHex(mixedG)}${toHex(mixedB)}`;
    }

    const handleColorChange = (key, value) => {
        setColors((prevColors) => ({
            ...prevColors,
            [key]: value,
        }));

        // Apply to specific UI sections
        if (key === "background") {
            setFormBgColor(value);
        }
        if (key === "questionsBackground") {
            setformColor(value);
        }
        if (key === "primary") {
            setformPrimaryColor(value);
        }
        if (key === "questions") {
            setformQuestionColor(value);
        }
        if (key === "answers") {
            setformAnswersColor(value);
        }
    };

    useEffect(() => {
        document.documentElement.style.setProperty('--form-primary-color', formPrimaryColor);
    }, [formPrimaryColor]);

    const HeadingField = ({ field, fields, setFields, formQuestionColor, selectedFont }) => {
        const headingAlign = field.alignment || "center";
        const textareaRef = useRef(null);

        useEffect(() => {
            if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
                textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
            }
        }, [field.label]);

        const handleHeadingChange = (e) => {
            const updatedFields = fields.map(f =>
                f.id === field.id ? { ...f, label: e.target.value } : f
            );
            setFields(updatedFields);

            const el = e.target;
            el.style.height = "auto";
            el.style.height = `${el.scrollHeight}px`;
        };

        return (
            <div style={{ textAlign: headingAlign }}>
                {/* Main heading */}
                <textarea
                    ref={textareaRef}
                    value={field.label}
                    onChange={handleHeadingChange}
                    style={{
                        fontSize: field.font_size || "24px",
                        fontWeight: "bold",
                        border: "none",
                        background: "transparent",
                        width: "100%",
                        margin: "8px 0 4px 0",
                        color: formQuestionColor,
                        fontFamily: selectedFont,
                        textAlign: headingAlign,
                        resize: "none",
                        overflow: "hidden",
                        outline: "none",
                        whiteSpace: "pre-wrap",
                    }}
                    rows={1}
                />

                {/* Caption under heading */}
                {field.caption && (
                    <div
                        style={{
                            fontSize: "0.85rem",
                            color: "#6b7280",
                            fontFamily: selectedFont,
                            textAlign: headingAlign,
                            marginBottom: "6px"
                        }}
                    >
                        {field.caption}
                    </div>
                )}
            </div>
        );
    };

    const renderField = (field) => {
        const commonProps = {
            className: "form-control",
            placeholder: field.placeholder || "",
            value: field.default_value || "",
            style: {
                width: field.halfWidth ? "50%" : "100%",
                color: formAnswersColor,
                backgroundColor: inputfieldBgColor,
                boxShadow: "none",
                border: `1px solid ${focusedFieldId === field.id ? formPrimaryColor : "rgba(75, 85, 99, 0.2)"}`,
                fontFamily: selectedFont,
                fontSize: field.font_size || "16px",
            },
            onFocus: () => setFocusedFieldId(field.id),
            onBlur: () => setFocusedFieldId(null),
            onChange: (e) => {
                const updatedFields = fields.map(f =>
                    f.id === field.id ? { ...f, default_value: e.target.value } : f
                );
                setFields(updatedFields);
            }
        };

        switch (field.type) {
            case "text":
                return <input type="text" {...commonProps} />;
            case "Short Answer":
                return <input type="text" {...commonProps} />;
            case "Long Answer":
                return <textarea {...commonProps}></textarea>;
            case "Email":
                return (
                    <div style={{ position: "relative", width: field.halfWidth ? "50%" : "100%" }}>
                        <input
                            type="email"
                            {...commonProps}
                            style={{
                                ...commonProps.style,
                                paddingLeft: "35px" // space for icon
                            }}
                        />
                        <span
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: "10px",
                                transform: "translateY(-50%)",
                                color: "#999"
                            }}
                        >
                            <i className="fa-solid fa-envelope"></i>
                        </span>
                    </div>
                );
            case "Paragraph":
                return (
                    <textarea
                        {...commonProps}
                        rows={4}
                        style={{
                            ...commonProps.style,
                            resize: "vertical", // Allows the user to resize vertically
                            minHeight: "80px",
                            fontSize: "1rem",
                            padding: "8px",
                            borderRadius: "6px"
                        }}
                    />
                );
            case "Heading":
                return (
                    <HeadingField
                        key={field.id}
                        field={field}
                        fields={fields}
                        setFields={setFields}
                        formQuestionColor={formQuestionColor}
                        selectedFont={selectedFont}
                    />
                );
            case "Banner":
                const alert_type = field.alert_type || "info"; // Default to 'info'

                const alertStyles = {
                    warning: {
                        backgroundColor: "#fff8e1",
                        border: "1px solid #fbc02d",
                        icon: "fa-exclamation-triangle",
                        iconColor: "#fbc02d",
                        textColor: "#f57f17"
                    },
                    error: {
                        backgroundColor: "#fdecea",
                        border: "1px solid #f44336",
                        icon: "fa-times-circle",
                        iconColor: "#f44336",
                        textColor: "#d32f2f"
                    },
                    info: {
                        backgroundColor: "#e3f2fd",
                        border: "1px solid #2196f3",
                        icon: "fa-info-circle",
                        iconColor: "#2196f3",
                        textColor: "#1565c0"
                    },
                    success: {
                        backgroundColor: "#e8f5e9",
                        border: "1px solid #4caf50",
                        icon: "fa-check-circle",
                        iconColor: "#4caf50",
                        textColor: "#2e7d32"
                    }
                };

                const style = alertStyles[alert_type.toLowerCase()] || alertStyles.info;

                return (
                    <div
                        style={{
                            backgroundColor: style.backgroundColor,
                            border: style.border,
                            borderRadius: "10px",
                            padding: "16px",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            width: "100%",
                            boxSizing: "border-box"
                        }}
                    >
                        <i className={`fa ${style.icon}`} style={{ fontSize: "20px", color: style.iconColor }}></i>
                        <div style={{ backgroundColor: "#f5f5f5", padding: "8px 12px", borderRadius: "4px", width: "100%" }}>
                            <input
                                type="text"
                                value={field.label || "Banner title"}
                                onChange={(e) => {
                                    const updatedFields = fields.map(f =>
                                        f.id === field.id ? { ...f, label: e.target.value } : f
                                    );
                                    setFields(updatedFields);
                                }}
                                style={{
                                    fontWeight: "bold",
                                    color: style.textColor,
                                    border: "none",
                                    background: "transparent",
                                    width: "100%",
                                    fontSize: "18px",
                                    marginBottom: "8px",
                                    fontFamily: selectedFont
                                }}
                            />
                            <textarea
                                value={field.description || "Some description"}
                                onChange={(e) => {
                                    const updatedFields = fields.map(f =>
                                        f.id === field.id ? { ...f, description: e.target.value } : f
                                    );
                                    setFields(updatedFields);
                                }}
                                rows={4}
                                style={{
                                    color: style.textColor,
                                    width: "100%",
                                    resize: "vertical", // Allows the user to resize vertically
                                    minHeight: "80px",
                                    fontSize: "1rem",
                                    padding: "8px",
                                    border: "1px solid #ccc",
                                    borderRadius: "6px",
                                    fontFamily: selectedFont
                                }}
                            />
                        </div>
                    </div>
                );
            case "Number":
                return (
                    <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        {...commonProps}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d*$/.test(value)) {
                                const updatedFields = fields.map(f =>
                                    f.id === field.id ? { ...f, value, default_value: value } : f
                                );
                                setFields(updatedFields);
                            }
                        }}
                        value={field.value || field.default_value || ""}  // Use default_value  if value is not set
                    />
                );
            case "Checkbox":
                return (
                    <div className="form-check">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            id={`checkbox-${field.id}`}
                            name={`checkbox-${field.id}`}
                            checked={field.default_value === "true"}
                            onChange={(e) => {
                                const updatedFields = fields.map(f =>
                                    f.id === field.id
                                        ? { ...f, default_value: e.target.checked.toString() }
                                        : f
                                );
                                setFields(updatedFields);
                            }}
                            style={{ accentColor: formPrimaryColor }}
                        />
                    </div>
                );
            case "Multiple Select Checkboxes":
                return field.options.map((opt, idx) => (
                    <div key={idx} className="form-check">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            id={`checkbox-${field.id}-${idx}`}
                            style={{ accentColor: formPrimaryColor }}
                        />
                        <label className="form-check-label" style={{ color: formAnswersColor, fontFamily: selectedFont }} htmlFor={`checkbox-${field.id}-${idx}`}>{opt.option_text}</label>
                    </div>
                ));
            case "Dropdown":
                const optionsList = field.options.map(opt => ({
                    value: opt.option_text,
                    label: opt.option_text
                }));

                return (
                    <div onFocus={() => setFocusedFieldId(field.id)} onBlur={() => setFocusedFieldId(null)}>
                        <Select
                            options={optionsList}
                            isClearable
                            placeholder={field.placeholder || "Select an option..."}
                            onChange={(selectedOption) => {
                                const updatedFields = fields.map(f => {
                                    if (f.id === field.id) {
                                        return { ...f, value: selectedOption ? selectedOption.value : "" };
                                    }
                                    return f;
                                });
                                setFields(updatedFields);
                            }}
                            value={
                                field.value
                                    ? optionsList.find(opt => opt.value === field.value)
                                    : null
                            }
                            styles={{
                                control: (base, state) => ({
                                    ...base,
                                    border: `1px solid ${focusedFieldId === field.id ? formPrimaryColor : "rgba(75, 85, 99, 0.2)"}`,
                                    boxShadow: "none",
                                    backgroundColor: inputfieldBgColor,
                                    color: formAnswersColor,
                                    "&:hover": {
                                        border: `1px solid ${formPrimaryColor}`
                                    },
                                    fontFamily: selectedFont
                                }),
                                option: (base, state) => ({
                                    ...base,
                                    backgroundColor: state.isFocused || state.isSelected ? formPrimaryColor : "white",
                                    color: state.isFocused || state.isSelected ? "white" : "black",
                                    cursor: "pointer",
                                    fontFamily: selectedFont
                                }),
                                singleValue: (base) => ({
                                    ...base,
                                    color: formAnswersColor,
                                    fontFamily: selectedFont
                                }),
                                placeholder: (base) => ({
                                    ...base,
                                    color: "#888",
                                    fontFamily: selectedFont
                                })
                            }}
                        />
                    </div>
                );
            case "Multiple Select":
                return (
                    <Select
                        isMulti
                        options={field.options.map(opt => ({
                            value: opt.option_text,
                            label: opt.option_text
                        }))}
                        className="basic-multi-select"
                        classNamePrefix="select"
                        placeholder={field.placeholder || "Select an option..."}
                        onChange={(selectedOptions) => {
                            const values = selectedOptions.map(opt => opt.value);
                            const updatedFields = fields.map(f => {
                                if (f.id === field.id) {
                                    return { ...f, value: values };
                                }
                                return f;
                            });
                            setFields(updatedFields);
                        }}
                        value={
                            field.value
                                ? field.value.map(val => ({
                                    value: val,
                                    label: val
                                }))
                                : []
                        }
                        styles={{
                            control: (base, state) => ({
                                ...base,
                                border: `1px solid ${focusedFieldId === field.id ? formPrimaryColor : "rgba(75, 85, 99, 0.2)"}`,
                                boxShadow: "none",
                                backgroundColor: inputfieldBgColor,
                                color: formAnswersColor,
                                "&:hover": {
                                    border: `1px solid ${formPrimaryColor}`
                                },
                                fontFamily: selectedFont
                            }),
                            multiValue: (base) => ({
                                ...base,
                                backgroundColor: formPrimaryColor,
                                fontFamily: selectedFont
                            }),
                            multiValueLabel: (base) => ({
                                ...base,
                                color: formAnswersColor,
                                fontFamily: selectedFont
                            }),
                            multiValueRemove: (base) => ({
                                ...base,
                                color: formAnswersColor,
                                ':hover': {
                                    backgroundColor: "#fff",
                                    color: formPrimaryColor
                                },
                                fontFamily: selectedFont
                            }),
                            option: (base, { isSelected, isFocused }) => ({
                                ...base,
                                backgroundColor: isFocused || isSelected ? formPrimaryColor : "white",
                                color: isFocused || isSelected ? "white" : "black",
                                cursor: "pointer",
                                fontFamily: selectedFont
                            }),
                            placeholder: (base) => ({
                                ...base,
                                fontFamily: selectedFont
                            })
                        }}
                    />
                );
            case "Switch":
                return (
                    <div className="form-check form-switch">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id={`switch-${field.id}`}
                            name={`switch-${field.id}`}
                            checked={field.default_value === "true"}
                            onChange={(e) => {
                                const updatedFields = fields.map(f =>
                                    f.id === field.id
                                        ? { ...f, default_value: e.target.checked.toString() }
                                        : f
                                );
                                setFields(updatedFields);
                            }}
                            style={{
                                backgroundColor: field.default_value === "true" ? formPrimaryColor : "",
                                borderColor: formPrimaryColor,
                                boxShadow: "none",
                            }}
                        />
                    </div>
                );
            case "Multiple Choice":
                return (
                    <>
                        {field.options.map((opt, idx) => (
                            field.bubble ? (
                                // Bubble Style
                                <div
                                    key={idx}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        border: "1px solid #ccc",
                                        borderRadius: "12px",
                                        padding: "4px 8px",
                                        margin: "4px 0",
                                        backgroundColor: "#f1f1f1",
                                        position: "relative",
                                        width: "fit-content",
                                        minWidth: "200px",
                                    }}
                                >
                                    <input
                                        type="radio"
                                        className="form-check-input"
                                        name={`field_${field.id}`}
                                        id={`bubble-radio-${field.id}-${idx}`}
                                        checked={field.selectedOption === idx}
                                        onChange={() => {
                                            const updatedFields = fields.map(f =>
                                                f.id === field.id ? { ...f, selectedOption: idx } : f
                                            );
                                            setFields(updatedFields);
                                        }}
                                        style={{
                                            marginRight: "8px",
                                            boxShadow: "none",
                                            borderColor: field.selectedOption === idx ? formPrimaryColor : "#ccc",
                                            backgroundColor: field.selectedOption === idx ? formPrimaryColor : "transparent",
                                        }}
                                    />

                                    <input
                                        type="text"
                                        value={typeof opt === "object" ? opt.option_text : opt}
                                        onChange={(e) => {
                                            const newOptions = [...field.options];
                                            newOptions[idx] = typeof opt === "object"
                                                ? { ...opt, option_text: e.target.value }
                                                : e.target.value;

                                            const updatedFields = fields.map(f =>
                                                f.id === field.id ? { ...f, options: newOptions } : f
                                            );
                                            setFields(updatedFields);
                                        }}
                                        style={{
                                            border: "none",
                                            background: "transparent",
                                            outline: "none",
                                            flexGrow: 1,
                                            minWidth: "50px",
                                            color: formPrimaryColor,
                                            fontFamily: selectedFont
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            const newOptions = field.options.filter((_, i) => i !== idx);
                                            const updatedFields = fields.map(f =>
                                                f.id === field.id ? { ...f, options: newOptions } : f
                                            );
                                            setFields(updatedFields);
                                        }}
                                        style={{
                                            background: "transparent",
                                            border: "none",
                                            color: "#666",
                                            fontWeight: "bold",
                                            fontSize: "16px",
                                            marginLeft: "8px",
                                            cursor: "pointer",
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            ) : (
                                // Standard Style
                                <div
                                    key={idx}
                                    className="form-check d-flex align-items-center gap-2"
                                    style={{ position: "relative" }}
                                >
                                    <input
                                        type="radio"
                                        className="form-check-input"
                                        name={`field_${field.id}`}
                                        id={`standard-radio-${field.id}-${idx}`}
                                        checked={field.selectedOption === idx}
                                        onChange={() => {
                                            const updatedFields = fields.map(f =>
                                                f.id === field.id ? { ...f, selectedOption: idx } : f
                                            );
                                            setFields(updatedFields);
                                        }}
                                        style={{
                                            marginRight: "8px",
                                            boxShadow: "none",
                                            borderColor: field.selectedOption === idx ? formPrimaryColor : "#ccc",
                                            backgroundColor: field.selectedOption === idx ? formPrimaryColor : "transparent",
                                        }}
                                    />
                                    <input
                                        type="text"
                                        value={typeof opt === "object" ? opt.option_text : opt}
                                        onChange={(e) => {
                                            const newOptions = [...field.options];
                                            newOptions[idx] = typeof opt === "object"
                                                ? { ...opt, option_text: e.target.value }
                                                : e.target.value;

                                            const updatedFields = fields.map(f =>
                                                f.id === field.id ? { ...f, options: newOptions } : f
                                            );
                                            setFields(updatedFields);
                                        }}
                                        style={{
                                            border: "none",
                                            borderBottom: "1px solid #ccc",
                                            width: "auto",
                                            minWidth: "50px",
                                            padding: "2px 4px",
                                            background: "transparent",
                                            color: formAnswersColor,
                                            fontFamily: selectedFont
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            const newOptions = field.options.filter((_, i) => i !== idx);
                                            const updatedFields = fields.map(f =>
                                                f.id === field.id ? { ...f, options: newOptions } : f
                                            );
                                            setFields(updatedFields);
                                        }}
                                        style={{
                                            background: "transparent",
                                            border: "none",
                                            color: "#666",
                                            fontWeight: "bold",
                                            fontSize: "16px",
                                            marginLeft: "8px",
                                            cursor: "pointer",
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            )
                        ))}
                        <button
                            onClick={() => {
                                const updatedFields = fields.map(f =>
                                    f.id === field.id
                                        ? { ...f, options: [...f.options, `Option ${f.options.length + 1}`] }
                                        : f
                                );
                                setFields(updatedFields);
                            }}
                            style={{
                                marginTop: "10px",
                                color: "#2563eb",
                                textDecoration: "underline",
                                background: "none",
                                border: "none"
                            }}
                        >
                            Add option
                        </button>
                    </>
                );
            case "Choice Matrix":
                return (
                    <div className="Matrix-grid-wrapper"
                        style={{
                            color: formAnswersColor,
                            backgroundColor: inputfieldBgColor,
                            fontFamily: selectedFont,
                        }}>
                        <table className="table Matrix-table text-center"
                            style={{
                                color: formAnswersColor,
                                backgroundColor: inputfieldBgColor,
                                fontFamily: selectedFont,
                            }}
                        >
                            <thead
                                style={{
                                    backgroundColor: inputfieldBgColor, // ensure thead matches table
                                }}>
                                <tr>
                                    <th style={{ backgroundColor: inputfieldBgColor }}></th>
                                    {(field.columns || []).map((col, colIdx) => (
                                        <th key={colIdx} className="hover-cell" style={{ backgroundColor: inputfieldBgColor }}>
                                            <input
                                                type="text"
                                                className="form-control text-center"
                                                value={col}
                                                onChange={(e) => {
                                                    const updatedFields = fields.map(f => {
                                                        if (f.id === field.id) {
                                                            const newCols = [...f.columns];
                                                            newCols[colIdx] = e.target.value;
                                                            return { ...f, columns: newCols };
                                                        }
                                                        return f;
                                                    });
                                                    setFields(updatedFields);
                                                }}
                                                placeholder={`Col ${colIdx + 1}`}
                                                style={{ fontFamily: selectedFont }}
                                            />
                                            <i
                                                className="fas fa-xmark choice-martix-delete-icon"
                                                onClick={() => {
                                                    const updatedFields = fields.map(f => {
                                                        if (f.id === field.id) {
                                                            const newCols = [...f.columns];
                                                            newCols.splice(colIdx, 1);

                                                            const newMatrix = (f.selectedMatrix || []).map(sel =>
                                                                sel === colIdx ? null : sel > colIdx ? sel - 1 : sel
                                                            );

                                                            return { ...f, columns: newCols, selectedMatrix: newMatrix };
                                                        }
                                                        return f;
                                                    });
                                                    setFields(updatedFields);
                                                }}
                                            ></i>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(field.rows || []).map((row, rowIdx) => (
                                    <tr key={rowIdx}>
                                        <td className="hover-cell" style={{ backgroundColor: inputfieldBgColor }}>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={row}
                                                onChange={(e) => {
                                                    const updatedFields = fields.map(f => {
                                                        if (f.id === field.id) {
                                                            const newRows = [...f.rows];
                                                            newRows[rowIdx] = e.target.value;
                                                            return { ...f, rows: newRows };
                                                        }
                                                        return f;
                                                    });
                                                    setFields(updatedFields);
                                                }}
                                                placeholder={`Row ${rowIdx + 1}`}
                                                style={{ fontFamily: selectedFont }}
                                            />
                                            <i
                                                className="fas fa-xmark choice-martix-delete-icon"
                                                onClick={() => {
                                                    const updatedFields = fields.map(f => {
                                                        if (f.id === field.id) {
                                                            const newRows = [...f.rows];
                                                            newRows.splice(rowIdx, 1);

                                                            const newMatrix = (f.selectedMatrix || []).filter((_, i) => i !== rowIdx);

                                                            return { ...f, rows: newRows, selectedMatrix: newMatrix };
                                                        }
                                                        return f;
                                                    });
                                                    setFields(updatedFields);
                                                }}
                                            ></i>
                                        </td>
                                        {field.columns.map((col, colIdx) => (
                                            <td key={colIdx} style={{ backgroundColor: inputfieldBgColor }}>
                                                <input
                                                    type="radio"
                                                    name={`Matrix_${field.id}_row_${rowIdx}`}
                                                    value={col}
                                                    checked={field.selectedMatrix?.[rowIdx] === colIdx}
                                                    onChange={() => {
                                                        const updatedFields = fields.map(f => {
                                                            if (f.id === field.id) {
                                                                const newMatrix = [...(f.selectedMatrix || [])];
                                                                newMatrix[rowIdx] = colIdx;
                                                                return { ...f, selectedMatrix: newMatrix };
                                                            }
                                                            return f;
                                                        });
                                                        setFields(updatedFields);
                                                    }}
                                                    className="form-check-input"
                                                    style={{
                                                        marginRight: "8px",
                                                        boxShadow: "none",
                                                        borderColor: (field.selectedMatrix?.[rowIdx] === colIdx) ? formPrimaryColor : "#ccc",
                                                        backgroundColor: (field.selectedMatrix?.[rowIdx] === colIdx) ? formPrimaryColor : "transparent",
                                                    }}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Add Row / Add Column Buttons */}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button
                                className="btn btn-sm btn-link"
                                onClick={() => {
                                    const updatedFields = fields.map(f =>
                                        f.id === field.id
                                            ? { ...f, rows: [...f.rows, `Row ${f.rows.length + 1}`] }
                                            : f
                                    );
                                    setFields(updatedFields);
                                }}
                            >
                                Add row
                            </button>
                            <button
                                className="btn btn-sm btn-link"
                                onClick={() => {
                                    const updatedFields = fields.map(f =>
                                        f.id === field.id
                                            ? { ...f, columns: [...f.columns, `Col ${f.columns.length + 1}`] }
                                            : f
                                    );
                                    setFields(updatedFields);
                                }}
                            >
                                Add column
                            </button>
                        </div>
                    </div>
                );
            case "Date Picker":
                return (
                    <input
                        type="date"
                        {...commonProps}
                        value={field.default_value || ""}
                        onClick={(e) => {
                            e.target.showPicker?.();
                        }}
                        onChange={(e) => {
                            const updatedFields = fields.map(f =>
                                f.id === field.id ? { ...f, default_value: e.target.value } : f
                            );
                            setFields(updatedFields);
                        }}
                    />
                );
            case "Time Picker":
                return (
                    <input
                        type="time"
                        {...commonProps}
                        value={field.default_value || ""}
                        onClick={(e) => {
                            e.target.showPicker?.();
                        }}
                        onChange={(e) => {
                            const updatedFields = fields.map(f =>
                                f.id === field.id ? { ...f, default_value: e.target.value } : f
                            );
                            setFields(updatedFields);
                        }}
                    />
                );
            case "Date Time Picker":
                return (
                    <input
                        type="datetime-local"
                        {...commonProps}
                        value={field.default_value || ""}
                        onClick={(e) => {
                            e.target.showPicker?.();
                        }}
                        onChange={(e) => {
                            const updatedFields = fields.map(f =>
                                f.id === field.id ? { ...f, default_value: e.target.value } : f
                            );
                            setFields(updatedFields);
                        }}
                    />
                );
            case "Date Range":
                return (
                    <div className="d-flex gap-2">
                        <input
                            type="date"
                            {...commonProps}
                            placeholder="From"
                            onClick={(e) => e.target.showPicker?.()}
                        />
                        <input
                            type="date"
                            {...commonProps}
                            placeholder="To"
                            onClick={(e) => e.target.showPicker?.()}
                        />
                    </div>
                );
            case "Document Type":
                return (
                    <input
                        type="file"
                        {...commonProps}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,image/*"
                        className="form-control-file"
                    />
                );
            case "Ranking":
                return (
                    <DragDropContext
                        onDragEnd={(result) => {
                            if (!result.destination) return;

                            const reordered = reorder(
                                field.options,
                                result.source.index,
                                result.destination.index
                            );

                            const updatedFields = fields.map(f =>
                                f.id === field.id ? { ...f, options: reordered } : f
                            );
                            setFields(updatedFields);
                        }}
                    >
                        <Droppable droppableId={`ranking-${field.id}`}>
                            {(provided) => (
                                <div>
                                    <ol
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="ranking-list"
                                    >
                                        {field.options.map((opt, idx) => (
                                            <Draggable
                                                key={idx}
                                                draggableId={`ranking-${field.id}-option-${idx}`}
                                                index={idx}
                                            >
                                                {(provided) => (
                                                    <li
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        className="ranking-item d-flex align-items-center"
                                                        style={{
                                                            gap: "10px",
                                                            padding: "8px",
                                                            border: "1px solid #ddd",
                                                            borderRadius: "5px",
                                                            marginBottom: "6px",
                                                            ...provided.draggableProps.style
                                                        }}
                                                    >
                                                        {/* Ranking number */}
                                                        <span style={{ width: "20px", textAlign: "center" }}>{idx + 1}</span>

                                                        {/* Editable input */}
                                                        <input
                                                            type="text"
                                                            {...commonProps}
                                                            value={opt.option_text}
                                                            onChange={(e) => {
                                                                const updatedOptions = [...field.options];
                                                                updatedOptions[idx] = { option_text: e.target.value };

                                                                const updatedFields = fields.map(f =>
                                                                    f.id === field.id ? { ...f, options: updatedOptions } : f
                                                                );
                                                                setFields(updatedFields);
                                                            }}
                                                            onFocus={() => setFocusedOptionId(idx)} // Focus on this specific option
                                                            onBlur={() => setFocusedOptionId(null)} // Reset focus
                                                            style={{
                                                                flex: 1,
                                                                width: field.halfWidth ? "50%" : "100%",
                                                                color: formAnswersColor,
                                                                backgroundColor: inputfieldBgColor,
                                                                boxShadow: "none",
                                                                border: `1px solid ${focusedOptionId === idx
                                                                    ? formPrimaryColor
                                                                    : "rgba(75, 85, 99, 0.2)"}`,
                                                                fontFamily: selectedFont
                                                            }}
                                                        />

                                                        {/* Drag handle */}
                                                        <span
                                                            {...provided.dragHandleProps}
                                                            style={{ cursor: "grab", color: "gray" }}
                                                        >
                                                            <i className="fas fa-grip-vertical"></i>
                                                        </span>

                                                        {/* Delete option */}
                                                        <span
                                                            style={{ color: "red", cursor: "pointer" }}
                                                            onClick={() => {
                                                                const updatedOptions = [...field.options];
                                                                updatedOptions.splice(idx, 1);
                                                                const updatedFields = fields.map(f =>
                                                                    f.id === field.id ? { ...f, options: updatedOptions } : f
                                                                );
                                                                setFields(updatedFields);
                                                            }}
                                                        >
                                                            <i className="fas fa-trash-alt"></i>
                                                        </span>
                                                    </li>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </ol>

                                    {/* Add Option Button */}
                                    <button
                                        onClick={() => {
                                            const updatedFields = fields.map(f =>
                                                f.id === field.id
                                                    ? {
                                                        ...f,
                                                        options: [...f.options, { option_text: `Option ${f.options.length + 1}` }]
                                                    }
                                                    : f
                                            );
                                            setFields(updatedFields);
                                        }}
                                        style={{
                                            marginTop: "10px",
                                            color: "#2563eb",
                                            textDecoration: "underline",
                                            background: "none",
                                            border: "none",
                                        }}
                                    >
                                        Add option
                                    </button>
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                );
            case "Star Rating":
                return (
                    <div>
                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "4px",
                                maxWidth: "400px", // 15 stars * 26px per star (adjust if needed)
                            }}
                            onMouseLeave={() => setHovered(null)}
                        >
                            {[...Array(field.max_value || 5)].map((_, i) => (
                                <span
                                    key={i}
                                    style={{
                                        fontSize: "24px",
                                        color:
                                            hovered != null
                                                ? i <= hovered
                                                    ? formPrimaryColor
                                                    : "#ccc"
                                                : i < field.value
                                                    ? formPrimaryColor
                                                    : "#ccc",
                                        cursor: "pointer",
                                        transition: "color 0.2s",
                                        width: "24px",
                                        textAlign: "center"
                                    }}
                                    onClick={() => {
                                        const newValue = field.value === i + 1 ? 0 : i + 1;
                                        const updatedFields = fields.map(f =>
                                            f.id === field.id ? { ...f, value: newValue } : f
                                        );
                                        setFields(updatedFields);
                                    }}
                                    onMouseEnter={() => setHovered(i)}
                                >
                                    <FaStar />
                                </span>
                            ))}
                        </div>
                    </div>
                );
            case "Slider":
                const min = field.min_value ?? 0;  // Default to 0
                const max = field.max_value ?? 100; // Default to 100
                const currentValue = field.value ?? min;

                const percentage = ((currentValue - min) / (max - min)) * 100;

                const sliderStyle = {
                    background: `linear-gradient(to right, ${formPrimaryColor} 0%, ${formPrimaryColor} ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`
                };

                return (
                    <div style={{ width: "100%" }}>
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: "14px",
                            marginBottom: "4px"
                        }}>
                            <span></span>
                            <span style={{ color: "#6b7280" }}>{currentValue} / {field.max_value}</span>
                        </div>
                        <input
                            type="range"
                            min={field.min_value}
                            max={field.max_value}
                            value={currentValue}
                            className="custom-slider"
                            style={{
                                ...sliderStyle,
                                '--slider-thumb-border': formPrimaryColor
                            }}
                            onChange={(e) => {
                                const updatedFields = fields.map(f =>
                                    f.id === field.id ? { ...f, value: parseInt(e.target.value) } : f
                                );
                                setFields(updatedFields);
                            }}
                        />
                    </div>
                );
            case "Opinion Scale":
                return (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(40px, 1fr))",
                            gap: "8px",
                            maxWidth: "640px",
                            color: formQuestionColor
                        }}
                    >
                        {[...Array((field?.max_value ?? 10) - (field?.min_value ?? 1) + 1)].map((_, i) => {
                            const val = (field?.min_value ?? 1) + i;
                            return (
                                <label key={val} style={{ textAlign: "center" }}>
                                    <input
                                        type="radio"
                                        name={`opinion_${field.id}`}
                                        checked={field.value === val}
                                        onChange={() => {
                                            const updatedFields = fields.map(f =>
                                                f.id === field.id ? { ...f, value: val } : f
                                            );
                                            setFields(updatedFields);
                                        }}
                                        style={{ accentColor: formPrimaryColor }}
                                    />
                                    <div>{val}</div>
                                </label>
                            );
                        })}
                    </div>
                );
            case "Address":
                return (
                    <div className="address-field-wrapper">
                        <input
                            type="text"
                            className="form-control mb-2"
                            placeholder="Address"
                            value={field.address || ""}
                            onChange={(e) => {
                                const updatedFields = fields.map(f =>
                                    f.id === field.id ? { ...f, address: e.target.value } : f
                                );
                                setFields(updatedFields);
                            }}
                            onFocus={() => {
                                setFocusedFieldId(field.id);
                                setFocusedSubField("address");
                            }}
                            onBlur={() => setFocusedSubField(null)}
                            style={{
                                width: "100%",
                                color: formAnswersColor,
                                backgroundColor: inputfieldBgColor,
                                boxShadow: "none",
                                border: `1px solid ${focusedFieldId === field.id && focusedSubField === "address"
                                    ? formPrimaryColor
                                    : "rgba(75, 85, 99, 0.2)"
                                    }`,
                            }}
                        />

                        <div className="d-flex gap-2">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="City"
                                value={field.city || ""}
                                onChange={(e) => {
                                    const updatedFields = fields.map(f =>
                                        f.id === field.id ? { ...f, city: e.target.value } : f
                                    );
                                    setFields(updatedFields);
                                }}
                                onFocus={() => {
                                    setFocusedFieldId(field.id);
                                    setFocusedSubField("city");
                                }}
                                onBlur={() => setFocusedSubField(null)}
                                style={{
                                    color: formAnswersColor,
                                    backgroundColor: inputfieldBgColor,
                                    boxShadow: "none",
                                    border: `1px solid ${focusedFieldId === field.id && focusedSubField === "city"
                                        ? formPrimaryColor
                                        : "rgba(75, 85, 99, 0.2)"
                                        }`,
                                    fontFamily: selectedFont
                                }}
                            />
                            <input
                                type="text"
                                className="form-control"
                                placeholder="State"
                                value={field.state || ""}
                                onChange={(e) => {
                                    const updatedFields = fields.map(f =>
                                        f.id === field.id ? { ...f, state: e.target.value } : f
                                    );
                                    setFields(updatedFields);
                                }}
                                onFocus={() => {
                                    setFocusedFieldId(field.id);
                                    setFocusedSubField("state");
                                }}
                                onBlur={() => setFocusedSubField(null)}
                                style={{
                                    color: formAnswersColor,
                                    backgroundColor: inputfieldBgColor,
                                    boxShadow: "none",
                                    border: `1px solid ${focusedFieldId === field.id && focusedSubField === "state"
                                        ? formPrimaryColor
                                        : "rgba(75, 85, 99, 0.2)"
                                        }`,
                                    fontFamily: selectedFont
                                }}
                            />
                            <input
                                type="text"
                                className="form-control"
                                placeholder="ZIP / Postal code"
                                value={field.zip || ""}
                                onChange={(e) => {
                                    const updatedFields = fields.map(f =>
                                        f.id === field.id ? { ...f, zip: e.target.value } : f
                                    );
                                    setFields(updatedFields);
                                }}
                                onFocus={() => {
                                    setFocusedFieldId(field.id);
                                    setFocusedSubField("zip");
                                }}
                                onBlur={() => setFocusedSubField(null)}
                                style={{
                                    color: formAnswersColor,
                                    backgroundColor: inputfieldBgColor,
                                    boxShadow: "none",
                                    border: `1px solid ${focusedFieldId === field.id && focusedSubField === "zip"
                                        ? formPrimaryColor
                                        : "rgba(75, 85, 99, 0.2)"
                                        }`,
                                    fontFamily: selectedFont
                                }}
                            />
                        </div>
                    </div>
                );
            case "Picture":
                return (
                    <div>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(3, 1fr)",
                                gap: "12px"
                            }}
                        >
                            {field.options.map((opt, idx) => (
                                <div
                                    key={opt.id}
                                    style={{
                                        border: "1px solid #ddd",
                                        borderRadius: "8px",
                                        padding: "8px",
                                        position: "relative",
                                        fontFamily: selectedFont
                                    }}
                                    onMouseEnter={() => setHoveredOption(idx)}
                                    onMouseLeave={() => setHoveredOption(null)}
                                >
                                    {/* Close Icon */}
                                    <button
                                        onClick={() => {
                                            const updatedFields = fields.map(f =>
                                                f.id === field.id
                                                    ? {
                                                        ...f,
                                                        options: f.options.filter((_, i) => i !== idx)
                                                    }
                                                    : f
                                            );
                                            setFields(updatedFields);
                                        }}
                                        style={{
                                            position: "absolute",
                                            top: "-10px",
                                            right: "-10px",
                                            background: "rgb(107 114 128)",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "50%",
                                            width: "24px",
                                            height: "24px",
                                            display: hoveredOption === idx ? "flex" : "none",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            cursor: "pointer",
                                            zIndex: 10
                                        }}
                                    >
                                        <FaTimes size={14} />
                                    </button>

                                    <div
                                        style={{
                                            width: "100%",
                                            height: "100px",
                                            backgroundColor: opt.image_path ? "transparent" : pictureBgColors[idx % pictureBgColors.length],
                                            backgroundImage: opt.image_path
                                                ? opt.image_path.startsWith("data:")
                                                    ? `url(${opt.image_path})` // It's a base64 image from modal
                                                    : `url(${API_BASE}/${opt.image_path.replace(/\\/g, "/")})` // It's a saved image from DB
                                                : undefined,
                                            backgroundSize: "cover",
                                            backgroundPosition: "center",
                                            borderRadius: "4px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center"
                                        }}
                                    >
                                        <button
                                            onClick={() => setEditImageOption({ fieldId: field.id, index: idx })}
                                            style={{
                                                background: "rgba(0,0,0,0.5)",
                                                color: "white",
                                                border: "none",
                                                padding: "6px 12px",
                                                borderRadius: "4px",
                                                cursor: "pointer"
                                            }}
                                        >
                                            ✎ Edit
                                        </button>
                                    </div>
                                    <div style={{ textAlign: "center", marginTop: "8px" }}>
                                        <input
                                            type="radio"
                                            className="form-check-input"
                                            name={`pic_${field.id}`}
                                            id={`bubble-radio-${field.id}-${idx}`}
                                            checked={field.selectedOption === idx}
                                            onChange={() => {
                                                const updatedFields = fields.map(f =>
                                                    f.id === field.id ? { ...f, selectedOption: idx } : f
                                                );
                                                setFields(updatedFields);
                                            }}
                                            style={{
                                                marginRight: "8px",
                                                boxShadow: "none",
                                                borderColor: field.selectedOption === idx ? formPrimaryColor : "#ccc",
                                                backgroundColor: field.selectedOption === idx ? formPrimaryColor : "transparent",
                                            }}
                                        />
                                        <span style={{ marginLeft: "6px", color: formAnswersColor }}>{opt.option_text}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => {
                                const updatedFields = fields.map(f =>
                                    f.id === field.id
                                        ? {
                                            ...f,
                                            options: [...f.options, { id: Date.now(), option_text: `Option ${f.options.length + 1}`, image_path: null }]
                                        }
                                        : f
                                );
                                setFields(updatedFields);
                            }}
                            style={{
                                marginTop: "10px",
                                color: "#2563eb",
                                textDecoration: "underline",
                                background: "none",
                                border: "none"
                            }}
                        >
                            Add option
                        </button>
                    </div>
                );
            case "Divider":
                return (
                    <div style={{ position: "relative", margin: "20px 0", textAlign: "center" }}>
                        <div style={{
                            borderTop: "1px solid lightgray",
                            position: "relative",
                            height: "1px"
                        }}></div>
                        {field.label && (
                            <span style={{
                                position: "absolute",
                                top: "-0.6em",
                                left: "50%",
                                transform: "translateX(-50%)",
                                backgroundColor: "#fff", // or your form bg color
                                padding: "0 5px",
                                fontSize: "0.9rem",
                                color: "#666"
                            }}>
                                {field.label}
                            </span>
                        )}
                    </div>
                );
            case "Image":
                const imageUrl =
                    field.file instanceof File
                        ? URL.createObjectURL(field.file)
                        : field.uploads?.[0]?.file_path
                            ? `${API_BASE}/${field.uploads[0].file_path.replace(/\\/g, "/")}`
                            : null;

                const alignment = field.alignment || field.uploads?.[0]?.file_field_Alignment || "center";
                const previewSize = field.previewSize || field.uploads?.[0]?.file_field_size || 300;

                return (
                    <div className="media-preview-wrapper" style={{ backgroundColor: formColor, textAlign: alignment, outline: "none", border: "none" }}>
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt="Uploaded"
                                style={{
                                    width: `${previewSize}px`,
                                    maxHeight: `${previewSize}px`,
                                    objectFit: "contain",
                                    borderRadius: "8px",
                                    boxShadow: "none"
                                }}
                            />
                        ) : (
                            <div className="media-upload-placeholder">No image uploaded</div>
                        )}

                        <input
                            type="file"
                            accept="image/*"
                            {...commonProps}
                            style={{
                                backgroundColor: formColor, // Ensure file input matches form background
                                color: formAnswersColor,
                                border: `1px solid ${focusedFieldId === field.id ? formPrimaryColor : "rgba(75, 85, 99, 0.2)"}`,
                                fontFamily: selectedFont,
                                fontSize: field.font_size || "16px",
                                width: field.halfWidth ? "50%" : "100%",
                                boxShadow: "none",
                                padding: "8px"
                            }}
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file && file.size > 1 * 1024 * 1024) {
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'File Too Large',
                                        text: 'Please select a file smaller than 1MB.',
                                    });
                                    return;
                                }

                                if (file) {
                                    const updatedFields = fields.map(f =>
                                        f.id === field.id
                                            ? { ...f, file, previewSize: previewSize }
                                            : f
                                    );
                                    setFields(updatedFields);
                                }
                            }}
                            className="form-control mt-2"
                        />
                    </div>
                );
            case "PDF":
                const pdfUrl =
                    field.file instanceof File
                        ? URL.createObjectURL(field.file)
                        : field.uploads?.[0]?.file_path
                            ? `${API_BASE}/${field.uploads[0].file_path.replace(/\\/g, "/")}`
                            : null;

                const pdfAlignment = field.alignment || field.uploads?.[0]?.file_field_Alignment || "center";
                const pdfPreviewSize = field.previewSize || field.uploads?.[0]?.file_field_size || 300;

                return (
                    <div className="media-preview-wrapper" style={{ textAlign: pdfAlignment }}>
                        {pdfUrl ? (
                            <embed
                                src={pdfUrl}
                                type="application/pdf"
                                width={`${pdfPreviewSize}px`}
                                height={`${pdfPreviewSize * 1.2}px`}
                                style={{
                                    border: "1px solid #ccc",
                                    borderRadius: "8px"
                                }}
                            />
                        ) : (
                            <div className="media-upload-placeholder">No PDF uploaded</div>
                        )}

                        <input
                            type="file"
                            accept="application/pdf"
                            {...commonProps}
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file && file.size > 1 * 1024 * 1024) {
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'File Too Large',
                                        text: 'Please select a file smaller than 1MB.',
                                    });
                                    return;
                                }

                                if (file) {
                                    const updatedFields = fields.map(f =>
                                        f.id === field.id
                                            ? { ...f, file, previewSize: pdfPreviewSize }
                                            : f
                                    );
                                    setFields(updatedFields);
                                }
                            }}
                            className="form-control mt-2"
                        />
                    </div>
                );
            case "Video":
                const videoUrl =
                    field.file instanceof File
                        ? URL.createObjectURL(field.file)
                        : field.uploads?.[0]?.file_path
                            ? `${API_BASE}/${field.uploads[0].file_path.replace(/\\/g, "/")}`
                            : null;

                const videoAlignment = field.alignment || field.uploads?.[0]?.file_field_Alignment || "center";
                const videoPreviewSize = field.previewSize || field.uploads?.[0]?.file_field_size || 300;

                return (
                    <div className="media-preview-wrapper" style={{ textAlign: videoAlignment }}>
                        {videoUrl ? (
                            <video
                                key={videoUrl}
                                controls
                                width={`${videoPreviewSize}px`}
                                style={{
                                    maxHeight: `${videoPreviewSize * 1.2}px`,
                                    borderRadius: "8px",
                                    boxShadow: "none",
                                    border: "1px solid #ccc"
                                }}
                            >
                                <source src={videoUrl} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        ) : (
                            <div className="media-upload-placeholder">No video uploaded</div>
                        )}

                        <input
                            type="file"
                            accept="video/*"
                            {...commonProps}
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file && file.size > 5 * 1024 * 1024) {
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'File Too Large',
                                        text: 'Please select a file smaller than 5MB.',
                                    });
                                    return;
                                }

                                if (file) {
                                    const updatedFields = fields.map(f =>
                                        f.id === field.id
                                            ? { ...f, file, previewSize: videoPreviewSize }
                                            : f
                                    );
                                    setFields(updatedFields);
                                }
                            }}
                            className="form-control mt-2"
                        />
                    </div>
                );
            case "YouTubeVideo":
                const youTubevideoUrl = field.youtubeUrl || "";
                const youTubevideoPreviewSize = field.previewSize || 250;

                return (
                    <div className="media-preview-wrapper">
                        {youTubevideoUrl ? (
                            <iframe
                                width={`${youTubevideoPreviewSize}`}
                                height={`${youTubevideoPreviewSize * 0.6}`}
                                src={`https://www.youtube.com/embed/${getYouTubeVideoId(youTubevideoUrl)}`}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                style={{ borderRadius: "8px" }}
                            />
                        ) : (
                            <div className="media-upload-placeholder">No YouTube URL Provided</div>
                        )}
                    </div>
                );
            case 'ThankYou':
                return (
                    <div
                        className="thank-you-container"
                        style={{
                            padding: "2rem",
                            margin: "2rem auto",
                            textAlign: "center",
                            fontFamily: selectedFont,
                            color: formAnswersColor,
                            borderRadius: "10px"
                        }}
                    >
                        {!field.hideIcon && (
                            <div style={{
                                fontSize: "1.5rem",
                                width: "50px",
                                height: "50px",
                                borderRadius: "50%",
                                backgroundColor: "rgba(147, 197, 253, 0.3)",
                                color: formPrimaryColor,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                margin: "0 auto 1rem auto"
                            }}>
                                <i className="fa-solid fa-check"></i>
                            </div>
                        )}

                        <input
                            type="text"
                            className="form-control mb-2"
                            placeholder="Thank You"
                            value={field.thankyou_heading}
                            onChange={(e) => {
                                const updatedFields = fields.map(f =>
                                    f.id === field.id ? { ...f, thankyou_heading: e.target.value } : f
                                );
                                setFields(updatedFields);
                            }}
                            onFocus={() => {
                                setFocusedFieldId(field.id);
                                setFocusedSubField("thankyou_heading");
                            }}
                            onBlur={() => setFocusedSubField(null)}
                            style={{
                                textAlign: "center",
                                fontWeight: "bold",
                                fontSize: "1.5rem",
                                color: formAnswersColor,
                                border: "none",
                                background: "transparent",
                                outline: "none"
                            }}
                        />

                        <textarea
                            className="form-control"
                            placeholder="Made with dForms, the easy way to make stunning forms"
                            value={field.thankyou_subtext || "Made with dForms, the easy way to make stunning forms"}
                            onChange={(e) => {
                                const updatedFields = fields.map(f =>
                                    f.id === field.id ? { ...f, thankyou_subtext: e.target.value } : f
                                );
                                setFields(updatedFields);
                            }}
                            onFocus={() => {
                                setFocusedFieldId(field.id);
                                setFocusedSubField("thankyou_subtext");
                            }}
                            onBlur={() => setFocusedSubField(null)}
                            style={{
                                textAlign: "center",
                                fontSize: "0.9rem",
                                marginBottom: "1rem",
                                color: "rgb(155, 160, 168)",
                                border: "none",
                                background: "transparent",
                                resize: "none",
                                outline: "none",
                            }}
                        />

                        <button
                            style={{
                                background: inputfieldBgColor,
                                color: formAnswersColor,
                                padding: "0.5rem 1rem",
                                border: "1px solid #e0e0e0",
                                cursor: "pointer",
                                fontFamily: selectedFont,
                                boxShadow: "0 4px 10px rgba(0, 0, 0, 0.05)",
                                transition: "all 0.3s ease",
                                paddingTop: "5px"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = "0 6px 14px rgba(0, 0, 0, 0.1)";
                                e.currentTarget.style.border = `1px solid ${formPrimaryColor}`;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.05)";
                                e.currentTarget.style.border = "1px solid #e0e0e0";
                            }}
                        >
                            Make your own <span style={{ fontWeight: "900", fontSize: "1.3rem" }}>dForms</span>
                        </button>
                    </div>
                );
            case "Submit":
                const sortedSubmitPages = [...formPages].sort((a, b) => a.sort_order - b.sort_order);
                const isFirstSubmitPage = sortedSubmitPages.findIndex(p => p.page_number === parseInt(pageId)) === 0;

                return (
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "1rem"
                    }}>
                        {!isFirstSubmitPage ? (
                            <button
                                type="button"
                                className="btn"
                                style={{
                                    padding: "6px 12px",
                                    fontSize: "1.2rem",
                                    fontFamily: selectedFont,
                                    backgroundColor: field.btnbgColor || formPrimaryColor,
                                    color: field.btnlabelColor || "#ffffff",
                                    border: "1px solid lightgray",
                                    borderRadius: "5px"
                                }}
                            >
                                <i className="fa-solid fa-arrow-left me-2"></i> Previous
                            </button>
                        ) : <div></div>}

                        <button
                            type="submit"
                            className="btn"
                            style={{
                                padding: "6px 12px",
                                fontSize: "1.2rem",
                                fontFamily: selectedFont,
                                backgroundColor: field.btnbgColor || formPrimaryColor,
                                color: field.btnlabelColor || "#ffffff",
                                border: focusedFieldId === field.id ? "2px solid #007bff" : "1px solid lightgray",
                                borderRadius: "5px"
                            }}
                            onFocus={() => setFocusedFieldId(field.id)}
                            onBlur={() => setFocusedFieldId(null)}
                        >
                            {field.label || "Submit"}
                        </button>
                    </div>
                );
            case "Next":
                const sortedPages = [...formPages].sort((a, b) => a.sort_order - b.sort_order);
                const isFirstPage = sortedPages.findIndex(p => p.page_number === parseInt(pageId)) === 0;

                return (
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "1rem"
                    }}>
                        {!isFirstPage ? (
                            <button
                                type="button"
                                className="btn"
                                style={{
                                    padding: "6px 12px",
                                    fontSize: "1.2rem",
                                    fontFamily: selectedFont,
                                    backgroundColor: field.btnbgColor || formPrimaryColor,
                                    color: field.btnlabelColor || "#ffffff",
                                    border: "1px solid lightgray",
                                    borderRadius: "5px"
                                }}
                            >
                                <i className="fa-solid fa-arrow-left me-2"></i> Previous
                            </button>
                        ) : <div></div>}

                        <button
                            type="button"
                            className="btn"
                            style={{
                                padding: "6px 12px",
                                fontSize: "1.2rem",
                                fontFamily: selectedFont,
                                backgroundColor: field.btnbgColor || formPrimaryColor,
                                color: field.btnlabelColor || "#ffffff",
                                border: focusedFieldId === field.id ? "2px solid #6c757d" : "1px solid lightgray",
                                borderRadius: "5px"
                            }}
                            onFocus={() => setFocusedFieldId(field.id)}
                            onBlur={() => setFocusedFieldId(null)}
                        >
                            {field.label} <i className="fa-solid fa-arrow-right ms-2"></i>
                        </button>
                    </div>
                );
            default:
                return <input type="text" {...commonProps} />;
        }
    };

    const getYouTubeVideoId = (url) => {
        const regex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|watch(?:_popup)?)(?:\?v=|\/)|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = url.match(regex);
        return match ? match[1] : "";
    };

    function base64ToBlob(base64Data) {
        const parts = base64Data.split(",");
        const mime = parts[0].match(/:(.*?);/)[1];
        const binary = atob(parts[1]);
        const array = [];
        for (let i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
        }
        return new Blob([new Uint8Array(array)], { type: mime });
    }

    const saveOrUpdateForm = async (isNew = false) => {
        try {
            if (fields.length === 0) {
                Swal.fire("Validation Error", "At least one field is required in the form.", "warning");
                return;
            }

            // Picture field validation
            for (const field of fields) {
                if (field.type === "Picture") {
                    const hasMissingImage = field.options.some(opt => !opt.image_path);
                    if (hasMissingImage) {
                        Swal.fire("Validation Error", "One or more Picture options are missing images.", "warning");
                        return;
                    }
                }
            }

            // Add this before building FormData
            for (const field of fields) {
                if (["Dropdown", "Multiple Choice", "Multiple Select", "Multiple Select Checkboxes", "Picture"].includes(field.type)) {
                    if (Array.isArray(field.options)) {
                        const hasEmptyOptionText = field.options.some(opt => {
                            if (typeof opt === "string") return !opt.trim();
                            if (typeof opt === "object") return !opt.option_text?.trim();
                            return true;
                        });

                        if (hasEmptyOptionText) {
                            Swal.fire("Validation Error", `One or more options in "${field.label}" are empty.`, "warning");
                            return;
                        }
                    }
                }
            }

            const match = location.pathname.match(/\/form-builder\/form-(\d+)\/page-(\w+)/);
            const formId = match ? match[1] : null;
            const pageId = match ? match[2] : null;

            // Build FormData
            const formData = new FormData();

            if (formId) {
                formData.append("form_id", formId);
            }
            if (pageId) {
                formData.append("page_id", pageId);
            }

            if (formbgImage?.startsWith("data:image")) {
                const blob = base64ToBlob(formbgImage);
                if (typeof File !== "undefined") {
                    const file = new File([blob], `background_${Date.now()}.jpg`, { type: blob.type });
                    formData.append("backgroundImage", file);
                }
            } else if (typeof formbgImage === "string" && formbgImage.includes("/form_bg_img_uploads/")) {
                // Send the image path for already uploaded image
                formData.append("backgroundImagePath", formbgImage);
            }

            formData.append("background_color", formBgColor);
            formData.append("questions_background_color", formColor);
            formData.append("primary_color", formPrimaryColor);
            formData.append("questions_color", formQuestionColor);
            formData.append("answers_color", formAnswersColor);
            formData.append("font", selectedFont);

            formData.append("title", formTitle || "Untitled Form");

            // Attach image files to FormData
            fields.forEach((field, fieldIndex) => {
                if (["Image", "Video", "PDF"].includes(field.type)) {
                    if (field.file instanceof File) {
                        const key = `field_file_${fieldIndex}`;
                        formData.append(key, field.file);
                        field.file = key;
                    } else {
                        console.warn("⚠️ Missing or invalid file for", field);
                    }
                }

                if (field.type === "Picture" && Array.isArray(field.options)) {
                    field.options.forEach((opt, optIndex) => {
                        const uniqueKey = `field_file_${fieldIndex}_${optIndex}`;

                        if (opt.image_path instanceof File) {
                            formData.append(uniqueKey, opt.image_path);
                            opt.image_path = uniqueKey;
                        } else if (typeof opt.image_path === "string" && opt.image_path.startsWith("data:image")) {
                            const blob = base64ToBlob(opt.image_path);
                            const file = new File([blob], `image_${Date.now()}.jpg`, { type: blob.type });
                            formData.append(uniqueKey, file);
                            opt.image_path = uniqueKey;
                        }
                    });
                }
            });

            const clonedFields = JSON.parse(JSON.stringify(fields));
            clonedFields.forEach(field => {
                if (!field.page_id) {
                    field.page_id = pageId || "1";
                }

                if (field.type === "Heading") {
                    field.alignment = field.alignment || "center"; // default alignment
                    field.font_size = field.font_size || 24;       // ✅ default font size
                }

                if (field.type === "ThankYou") {
                    field.show_tick_icon = !field.hideIcon; // Convert to match DB
                }

                // Handle Star Rating, Slider, etc. numeric controls
                if (typeof field.max_value === "number") {
                    field.max_value = field.max_value;
                }
                if (typeof field.min_value === "number") {
                    field.min_value = field.min_value;
                }

                if (field.type === "Banner") {
                    field.description = field.description || "";
                    field.alert_type = field.alert_type || "info";
                }

                if (field.type === "Choice Matrix") {
                    // Wrap rows and columns inside a matrix object
                    field.matrix = {
                        rows: field.rows || [],
                        columns: field.columns || []
                    };
                    // You can also clean up `rows` and `columns` if not needed elsewhere
                    delete field.rows;
                    delete field.columns;
                }

                // Remove options if field type should not have them
                if (!["Dropdown", "Multiple Choice", "Multiple Select", "Multiple Select Checkboxes", "Picture", "Ranking"].includes(field.type)) {
                    delete field.options;
                }

                // Handle style
                if (field.type === "Multiple Choice") {
                    field.style = field.bubble ? "bubble" : "standard";
                    delete field.bubble;
                } else {
                    delete field.bubble;
                }

                if (["Image", "Video", "PDF"].includes(field.type)) {
                    // Set alignment and previewSize from uploads[0] if not already present
                    if (!field.alignment && field.uploads?.[0]?.file_field_Alignment) {
                        field.alignment = field.uploads[0].file_field_Alignment;
                    }
                    if (!field.previewSize && field.uploads?.[0]?.file_field_size) {
                        field.previewSize = field.uploads[0].file_field_size;
                    }
                }

                if (Array.isArray(field.options)) {
                    field.options = field.options.map((opt, index) => {
                        if (typeof opt === "string") {
                            return {
                                option_text: opt,
                                options_style: field.style || "",
                                sortOrder: index
                            };
                        } else if (typeof opt === "object") {
                            return {
                                option_text: opt.option_text || opt.label || "",
                                options_style: opt.options_style || field.style || "",
                                sortOrder: opt.sortOrder || index,
                                image_path: opt.image_path
                            };
                        }
                        return {};
                    });
                }

            });

            formData.set("fields", JSON.stringify(clonedFields));

            console.log("📦 Save content:", clonedFields);

            const response = await fetch("/api/form_builder/save-form", {
                method: "POST",
                body: formData,
                credentials: "include",
            });

            const text = await response.text();

            try {
                const data = JSON.parse(text);
                if (data.success) {
                    Swal.fire("Success", "Form saved successfully!", "success");
                    fetchForm(formId, pageId);
                } else {
                    Swal.fire("Error", data.message || "Something went wrong while saving the form.", "error");
                }
            } catch (e) {
                console.error("❌ Error saving/updating form:", e);
                console.error("💡 Raw server response:", text);
                Swal.fire("Server Error", "Something went wrong while saving the form.", "error");
            }

        } catch (error) {
            console.error("Error saving/updating form:", error);
            const errorMessage = error.response?.data?.error || "An error occurred";
            Swal.fire("Error", errorMessage, "error");
        }
    };

    if (loading) return <p>Loading...</p>;

    return (
        <div className="form-builder">
            {isMobile ? (
                <MobileWarning />
            ) : (
                <>
                    {showFieldSidebar && (
                        <div className="form-fields-sidebar">
                            <div className="search-wrapper">
                                <FaSearch className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search fields"
                                    className="search-bar"
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {window.location.pathname.endsWith('/page-end') ? (
                                <div className="field-group-scrollable mt-2">
                                    <div className="field-group mt-1">
                                        <button className="save-form-btn" onClick={() => saveOrUpdateForm(true)} disabled={!isSaveEnabled}>
                                            Save Form
                                        </button>
                                    </div>
                                    <div className="field-group mt-1">
                                        <h4>Display text</h4>
                                        <div className="field-grid">
                                            {["Heading", "Paragraph", "Banner"]
                                                .filter(type => type.toLowerCase().includes(searchTerm.toLowerCase()))
                                                .map(type => <FieldButton key={type} type={type} section="Frequently used" />)}
                                        </div>
                                    </div>

                                    <div className="field-group mt-1">
                                        <h4>Navigation & Layout</h4>
                                        <div className="field-grid">
                                            {["Divider", "ThankYou"]
                                                .filter(type => type.toLowerCase().includes(searchTerm.toLowerCase()))
                                                .map(type => <FieldButton key={type} type={type} section="Navigation & Layout" />)}
                                        </div>
                                    </div>

                                    <div className="field-group mt-1">
                                        <h4>Media</h4>
                                        <div className="field-grid">
                                            {["Image", "Video", "PDF", "YouTubeVideo"]
                                                .filter(type => type.toLowerCase().includes(searchTerm.toLowerCase()))
                                                .map(type => <FieldButton key={type} type={type} section="Media" />)}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="field-group-scrollable mt-2">
                                    <div className="field-group mt-1">
                                        <button className="save-form-btn" onClick={() => saveOrUpdateForm(true)} disabled={!isSaveEnabled}>
                                            Save Form
                                        </button>
                                    </div>
                                    <div className="field-group mt-1">
                                        <h4>Frequently used</h4>
                                        <div className="field-grid">
                                            {["Short Answer", "Multiple Choice", "Email"]
                                                .filter(type => type.toLowerCase().includes(searchTerm.toLowerCase()))
                                                .map(type => <FieldButton key={type} type={type} section="Frequently used" />)}
                                        </div>
                                    </div>

                                    <div className="field-group mt-1">
                                        <h4>Display text</h4>
                                        <div className="field-grid">
                                            {["Heading", "Paragraph", "Banner"]
                                                .filter(type => type.toLowerCase().includes(searchTerm.toLowerCase()))
                                                .map(type => <FieldButton key={type} type={type} section="Display text" />)}
                                        </div>
                                    </div>

                                    <div className="field-group mt-1">
                                        <h4>Choices</h4>
                                        <div className="field-grid">
                                            {[
                                                "Dropdown", "Picture", "Multiple Select", "Switch", "Multiple Choice", "Checkbox",
                                                "Multiple Select Checkboxes", "Choice Matrix"
                                            ]
                                                .filter(type => type.toLowerCase().includes(searchTerm.toLowerCase()))
                                                .map(type => <FieldButton key={type} type={type} section="Choices" />)}
                                        </div>
                                    </div>

                                    <div className="field-group mt-1">
                                        <h4>Time</h4>
                                        <div className="field-grid">
                                            {["Date Picker", "Date Time Picker", "Time Picker", "Date Range"]
                                                .filter(type => type.toLowerCase().includes(searchTerm.toLowerCase()))
                                                .map(type => <FieldButton key={type} type={type} section="Time" />)}
                                        </div>
                                    </div>

                                    <div className="field-group mt-1">
                                        <h4>Rating & Ranking</h4>
                                        <div className="field-grid">
                                            {["Ranking", "Star Rating", "Slider", "Opinion Scale"]
                                                .filter(type => type.toLowerCase().includes(searchTerm.toLowerCase()))
                                                .map(type => <FieldButton key={type} type={type} section="Rating & Ranking" />)}
                                        </div>
                                    </div>

                                    <div className="field-group mt-1">
                                        <h4>Text</h4>
                                        <div className="field-grid">
                                            {["Short Answer", "Long Answer"]
                                                .filter(type => type.toLowerCase().includes(searchTerm.toLowerCase()))
                                                .map(type => <FieldButton key={type} type={type} section="Text" />)}
                                        </div>
                                    </div>

                                    <div className="field-group mt-1">
                                        <h4>Contact Info</h4>
                                        <div className="field-grid">
                                            {["Email", "Number", "Address", "Document Type"]
                                                .filter(type => type.toLowerCase().includes(searchTerm.toLowerCase()))
                                                .map(type => <FieldButton key={type} type={type} section="Contact Info" />)}
                                        </div>
                                    </div>

                                    <div className="field-group mt-1">
                                        <h4>Navigation & Layout</h4>
                                        <div className="field-grid">
                                            {["Divider"]
                                                .filter(type => type.toLowerCase().includes(searchTerm.toLowerCase()))
                                                .map(type => <FieldButton key={type} type={type} section="Navigation & Layout" />)}
                                        </div>
                                    </div>

                                    <div className="field-group mt-1">
                                        <h4>Media</h4>
                                        <div className="field-grid">
                                            {["Image", "Video", "PDF", "YouTubeVideo"]
                                                .filter(type => type.toLowerCase().includes(searchTerm.toLowerCase()))
                                                .map(type => <FieldButton key={type} type={type} section="Media" />)}
                                        </div>
                                    </div>

                                </div>
                            )}
                        </div>
                    )}

                    {showDesignSidebar && (
                        <div className="form-designs-sidebar" style={{ color: "gray" }}>
                            <div
                                className="designbar-header"
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "5px",
                                    paddingLeft: "15px",
                                    paddingRight: "15px",
                                    paddingBottom: "20px",
                                    borderBottom: "1px solid #ccc",
                                    marginLeft: "-12px",
                                    marginRight: "-12px",
                                }}
                            >
                                <span style={{ fontWeight: "bold", fontSize: "16px" }}>
                                    Form Designer
                                </span>
                                <i
                                    className="fa-solid fa-xmark"
                                    style={{ fontSize: "20px", cursor: "pointer", color: "black" }}
                                    onClick={() => {
                                        setShowDesignSidebar(false);
                                        setShowFieldSidebar(true);
                                    }}
                                ></i>
                            </div>

                            {/* Tabs for Current / All themes */}
                            <div style={{ display: "flex", margin: "14px" }}>
                                <button
                                    style={{
                                        flex: 1,
                                        padding: "5px 10px",
                                        backgroundColor: activeTab === "current" ? "#374151" : "white",
                                        color: activeTab === "current" ? "white" : "#374151",
                                        fontWeight: activeTab === "current" ? "bold" : "500",
                                        border: "1px solid #ccc",
                                        borderRight: "none",
                                        borderTopLeftRadius: "6px",
                                        borderBottomLeftRadius: "6px",
                                        cursor: "pointer",
                                    }}
                                    onClick={() => setActiveTab("current")}
                                >
                                    Current
                                </button>
                                <button
                                    style={{
                                        flex: 1,
                                        padding: "5px 10px",
                                        backgroundColor: activeTab === "themes" ? "#374151" : "white",
                                        color: activeTab === "themes" ? "white" : "#374151",
                                        fontWeight: activeTab === "themes" ? "bold" : "500",
                                        border: "1px solid #ccc",
                                        borderLeft: "none",
                                        borderTopRightRadius: "6px",
                                        borderBottomRightRadius: "6px",
                                        cursor: "pointer",
                                    }}
                                    onClick={() => setActiveTab("themes")}
                                >
                                    All themes
                                </button>
                            </div>

                            {/* Content based on tab */}
                            <div style={{ height: "100%", maxHeight: "calc(100vh - 100px)", overflowY: "auto", padding: "14px" }}>
                                {activeTab === "current" ? (
                                    <>
                                        {colorOptions.map(({ label, key, info }) => (
                                            <div key={key} style={{ position: "relative", marginBottom: "30px" }}>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "space-between"
                                                    }}
                                                >
                                                    <div>
                                                        {label}
                                                        {info && (
                                                            <i
                                                                className="fa-solid fa-circle-question"
                                                                style={{
                                                                    fontSize: "12px",
                                                                    marginLeft: "6px",
                                                                    color: "#555",
                                                                    cursor: "pointer"
                                                                }}
                                                                title={info}
                                                            ></i>
                                                        )}
                                                    </div>
                                                    <div
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevent triggering outside click
                                                            setActiveColorPicker(key);
                                                        }}
                                                        style={{
                                                            width: "30px",
                                                            height: "25px",
                                                            backgroundColor: colors[key],
                                                            border: "1px solid #ccc",
                                                            borderRadius: "4px",
                                                            cursor: "pointer",
                                                            marginLeft: "10px"
                                                        }}
                                                    />
                                                </div>

                                                {activeColorPicker === key && (
                                                    <div
                                                        ref={pickerRef}
                                                        style={{
                                                            position: "absolute",
                                                            top: "30px",
                                                            right: "0%",
                                                            marginLeft: "10px",
                                                            zIndex: 9999,
                                                        }}
                                                        onClick={(e) => e.stopPropagation()} // Prevent closing on inner click
                                                    >
                                                        <ChromePicker
                                                            color={colors[key]}
                                                            onChange={(updatedColor) =>
                                                                handleColorChange(key, updatedColor.hex)
                                                            }
                                                        />
                                                        <div
                                                            onClick={() => setActiveColorPicker(null)}
                                                            style={{
                                                                marginTop: "5px",
                                                                color: "#374151",
                                                                cursor: "pointer",
                                                                fontSize: "12px"
                                                            }}
                                                        >
                                                            Close
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        <div style={{ marginBottom: "10px" }}>
                                            <div style={{ marginBottom: "20px" }}>Font</div>
                                            <input
                                                type="text"
                                                placeholder="Default"
                                                value={selectedFont}
                                                readOnly
                                                style={{ width: "100%", padding: "5px", cursor: "pointer" }}
                                                data-bs-toggle="modal"
                                                data-bs-target="#fontModal"
                                            />
                                        </div>

                                        <div style={{ marginBottom: "10px" }}>
                                            <div style={{ marginBottom: "20px" }}>Background Image</div>
                                            <input
                                                type="file"
                                                id="bgImageInput"
                                                accept="image/*"
                                                style={{ display: "none" }}
                                                onChange={handleBackgroundImageUpload}
                                            />

                                            <button
                                                style={{
                                                    backgroundColor: "rgb(30, 41, 59)",
                                                    color: "white",
                                                    border: "none",
                                                    padding: "8px 16px",
                                                    borderRadius: "5px",
                                                    cursor: "pointer"
                                                }}
                                                onClick={() => document.getElementById("bgImageInput").click()}
                                            >
                                                Add Image
                                            </button>

                                            {formbgImage && (
                                                <div style={{ position: "relative", display: "inline-block", marginTop: "10px" }}>
                                                    {/* Close Icon */}
                                                    <i
                                                        className="fa-solid fa-xmark"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setFormbgImage(null)
                                                        }}
                                                        style={{
                                                            position: "absolute",
                                                            top: "-8px",
                                                            right: "-8px",
                                                            backgroundColor: "#e5e7eb",
                                                            color: "#374151",
                                                            borderRadius: "50%",
                                                            padding: "6px",
                                                            cursor: "pointer",
                                                            fontSize: "12px",
                                                            boxShadow: "0 0 4px rgba(0,0,0,0.1)",
                                                            zIndex: 1
                                                        }}
                                                    ></i>

                                                    {/* Image */}
                                                    <img
                                                        src={formbgImage}
                                                        alt="Background Preview"
                                                        style={{
                                                            maxWidth: "100%",
                                                            maxHeight: "150px",
                                                            border: "1px solid #ccc",
                                                            borderRadius: "5px"
                                                        }}
                                                    />
                                                </div>
                                            )}

                                        </div>

                                    </>
                                ) : (
                                    <div className="themediv" style={{ padding: "10px" }}>
                                        {/* Themes list */}
                                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                            {/* Light Theme */}
                                            <div
                                                onClick={() => {
                                                    setFormBgColor("#f8f9fa");
                                                    setformColor("#fff");
                                                    setformPrimaryColor("#3b82f6");
                                                    setformQuestionColor("black");
                                                    setformAnswersColor("black");
                                                    setColors({
                                                        background: "#f8f9fa",
                                                        questionsBackground: "#fff",
                                                        primary: "#3b82f6",
                                                        questions: "black",
                                                        answers: "black",
                                                    });
                                                }}
                                                style={{ border: "1px solid rgba(75, 85, 99, 0.2)", borderRadius: "10px", padding: "0px", backgroundColor: "#fff", position: "relative", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.05)" }}>
                                                <div style={{ fontWeight: "600", color: "gray", padding: "10px", borderBottom: "1px solid rgba(75, 85, 99, 0.2)" }}>Light</div>
                                                <div style={{ display: "flex", alignItems: "center", padding: "10px", paddingBottom: "15px", paddingTop: "20px", justifyContent: "space-between" }}>
                                                    <div style={{ display: "flex", alignItems: "center", border: "1px solid rgba(75, 85, 99, 0.2)", borderRadius: "5px", width: "60%", height: "32px", gap: "6px" }}>
                                                        <i className="fa fa-envelope" style={{ color: "gray", marginLeft: "10px" }}></i>
                                                        <span style={{ color: "#6b7280", fontSize: "0.8rem" }}>Text</span>
                                                    </div>
                                                    <span style={{ backgroundColor: "#3b82f6", border: "none", borderRadius: "6px", padding: "10px 16px", color: "#fff", fontWeight: "bold", cursor: "pointer" }}></span>
                                                </div>
                                            </div>

                                            {/* Dark Theme */}
                                            <div
                                                onClick={() => {
                                                    setFormBgColor("#111827");
                                                    setformColor("#111827");
                                                    setformPrimaryColor("#3b82f6");
                                                    setformQuestionColor("white");
                                                    setformAnswersColor("white");
                                                    setColors({
                                                        background: "#111827",
                                                        questionsBackground: "#111827",
                                                        primary: "#3b82f6",
                                                        questions: "#white",
                                                        answers: "#white",
                                                    });
                                                }}
                                                style={{ border: "1px solid rgba(75, 85, 99, 0.2)", borderRadius: "10px", padding: "0px", backgroundColor: "#111827", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.05)" }}>
                                                <div style={{ color: "gray", fontWeight: "600", padding: "10px", borderBottom: "1px solid rgba(229, 231, 235, 0.2)" }}>Dark</div>
                                                <div style={{ display: "flex", alignItems: "center", padding: "10px", paddingBottom: "15px", paddingTop: "20px", justifyContent: "space-between" }}>
                                                    <div style={{ display: "flex", alignItems: "center", border: "1px solid rgba(229, 231, 235, 0.2)", borderRadius: "5px", width: "60%", height: "32px", gap: "6px" }}>
                                                        <i className="fa fa-envelope" style={{ color: "gray", marginLeft: "10px" }}></i>
                                                        <span style={{ color: "#9ca3af", fontSize: "0.8rem" }}>Text</span>
                                                    </div>
                                                    <span style={{ backgroundColor: "#3b82f6", border: "none", borderRadius: "6px", padding: "10px 16px", color: "#fff", fontWeight: "bold", cursor: "pointer" }}></span>
                                                </div>
                                            </div>

                                            {/* Eco-friendly Theme */}
                                            <div
                                                onClick={() => {
                                                    setFormBgColor("#f9fafb");
                                                    setformColor("white");
                                                    setformPrimaryColor("#2f5f61");
                                                    setformQuestionColor("#6b7280");
                                                    setformAnswersColor("#6b7280");
                                                    setColors({
                                                        background: "#f9fafb",
                                                        questionsBackground: "#white",
                                                        primary: "#2f5f61",
                                                        questions: "#6b7280",
                                                        answers: "#6b7280",
                                                    });
                                                }}
                                                style={{ border: "1px solid rgba(75, 85, 99, 0.2)", borderRadius: "10px", padding: "0px", backgroundColor: "#f9fafb", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.05)" }}>
                                                <div style={{ color: "gray", fontWeight: "600", padding: "10px", borderBottom: "1px solid rgba(75, 85, 99, 0.2)" }}>Eco-friendly</div>
                                                <div style={{ display: "flex", alignItems: "center", padding: "10px", paddingBottom: "15px", paddingTop: "20px", justifyContent: "space-between" }}>
                                                    <div style={{ display: "flex", alignItems: "center", border: "1px solid rgba(75, 85, 99, 0.2)", borderRadius: "5px", width: "60%", height: "32px", gap: "6px" }}>
                                                        <i className="fa fa-envelope" style={{ color: "gray", marginLeft: "10px" }}></i>
                                                        <span style={{ color: "#6b7280", fontSize: "0.8rem" }}>Text</span>
                                                    </div>
                                                    <span style={{ backgroundColor: "#2f5f61", border: "none", borderRadius: "6px", padding: "10px 16px", color: "#fff", fontWeight: "bold", cursor: "pointer" }}></span>
                                                </div>
                                            </div>

                                            {/* Navy Pop Theme */}
                                            <div
                                                onClick={() => {
                                                    setFormBgColor("#1e293b");
                                                    setformColor("#1e293b");
                                                    setformPrimaryColor("#fbbf24");
                                                    setformQuestionColor("#cbd5e1");
                                                    setformAnswersColor("#cbd5e1");
                                                    setColors({
                                                        background: "#1e293b",
                                                        questionsBackground: "#1e293b",
                                                        primary: "#fbbf24",
                                                        questions: "#cbd5e1",
                                                        answers: "#cbd5e1",
                                                    });
                                                }}
                                                style={{ border: "1px solid rgba(75, 85, 99, 0.2)", borderRadius: "10px", padding: "0px", backgroundColor: "#1e293b", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.05)" }}>
                                                <div style={{ color: "gray", fontWeight: "600", padding: "10px", borderBottom: "1px solid rgba(75, 85, 99, 0.2)" }}>Navy Pop</div>
                                                <div style={{ backgroundColor: "#1e293b", padding: "10px", paddingBottom: "15px", paddingTop: "20px", borderBottomLeftRadius: "10px", borderBottomRightRadius: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                    <div style={{ backgroundColor: "#334155", display: "flex", alignItems: "center", border: "1px solid rgba(75, 85, 99, 0.2)", borderRadius: "5px", width: "60%", height: "32px", gap: "6px" }}>
                                                        <i className="fa fa-envelope" style={{ color: "#cbd5e1", marginLeft: "10px" }}></i>
                                                        <span style={{ color: "#cbd5e1", fontSize: "0.8rem" }}>Text</span>
                                                    </div>
                                                    <span style={{ backgroundColor: "#fbbf24", border: "none", borderRadius: "6px", padding: "10px 16px", color: "#fff", fontWeight: "bold", cursor: "pointer" }}></span>
                                                </div>
                                            </div>

                                            {/* Quiet Sands Theme */}
                                            <div
                                                onClick={() => {
                                                    setFormBgColor("#fefcf8");
                                                    setformColor("#fefcf8");
                                                    setformPrimaryColor("#fbbf24");
                                                    setformQuestionColor("#6b7280");
                                                    setformAnswersColor("#6b7280");
                                                    setColors({
                                                        background: "#fefcf8",
                                                        questionsBackground: "#fefcf8",
                                                        primary: "#fbbf24",
                                                        questions: "#6b7280",
                                                        answers: "#6b7280",
                                                    });
                                                }}
                                                style={{ border: "1px solid rgba(75, 85, 99, 0.2)", borderRadius: "10px", padding: "0px", backgroundColor: "#fefcf8", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.05)" }}>
                                                <div style={{ backgroundColor: "#fdfaf5", color: "gray", fontWeight: "600", padding: "10px", borderBottom: "1px solid rgba(75, 85, 99, 0.2)" }}>Quiet Sands</div>
                                                <div style={{ backgroundColor: "#fdfaf5", padding: "10px", paddingBottom: "15px", paddingTop: "20px", borderBottomLeftRadius: "10px", borderBottomRightRadius: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                    <div style={{ backgroundColor: "white", display: "flex", alignItems: "center", border: "1px solid rgba(75, 85, 99, 0.2)", borderRadius: "5px", width: "60%", height: "32px", gap: "6px" }}>
                                                        <i className="fa fa-envelope" style={{ color: "gray", marginLeft: "10px" }}></i>
                                                        <span style={{ color: "#6b7280", fontSize: "0.8rem" }}>Text</span>
                                                    </div>
                                                    <span style={{ backgroundColor: "#fbbf24", border: "none", borderRadius: "6px", padding: "10px 16px", color: "#fff", fontWeight: "bold", cursor: "pointer" }}></span>
                                                </div>
                                            </div>

                                            {/* Charcoal Theme */}
                                            <div
                                                onClick={() => {
                                                    setFormBgColor("#e5e7eb");
                                                    setformColor("#2b2b2b");
                                                    setformPrimaryColor("#000");
                                                    setformQuestionColor("#e5e7eb");
                                                    setformAnswersColor("#e5e7eb");
                                                    setColors({
                                                        background: "#e5e7eb",
                                                        questionsBackground: "#2b2b2b",
                                                        primary: "#000",
                                                        questions: "#e5e7eb",
                                                        answers: "#e5e7eb",
                                                    });
                                                }}
                                                style={{ border: "1px solid rgba(75, 85, 99, 0.2)", borderRadius: "10px", padding: "0px", backgroundColor: "#e5e7eb", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.05)" }}>
                                                <div style={{ color: "gray", fontWeight: "600", padding: "10px", borderBottom: "1px solid rgba(75, 85, 99, 0.2)" }}>Charcoal</div>
                                                <div style={{ backgroundColor: "#2b2b2b", padding: "10px", paddingBottom: "15px", paddingTop: "20px", borderBottomLeftRadius: "10px", borderBottomRightRadius: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                    <div style={{ backgroundColor: "white", display: "flex", alignItems: "center", border: "1px solid rgba(75, 85, 99, 0.2)", borderRadius: "5px", width: "60%", height: "32px", gap: "6px" }}>
                                                        <i className="fa fa-envelope" style={{ color: "gray", marginLeft: "10px" }}></i>
                                                        <span style={{ color: "#6b7280", fontSize: "0.8rem" }}>Text</span>
                                                    </div>
                                                    <span style={{ backgroundColor: "#000", border: "none", borderRadius: "6px", padding: "10px 16px", color: "#fff", fontWeight: "bold", cursor: "pointer" }}></span>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    )}

                    <div className="form-container">
                        <div className={`form-body ${formbgImage ? "with-bg-image" : ""}`}
                            style={{
                                backgroundColor: formBgColor,
                                backgroundImage: formbgImage ? `url(${formbgImage})` : "none"
                            }}
                        >
                            {/* Theme Button */}
                            <button
                                className="theme-button"
                                onClick={() => {
                                    setShowDesignSidebar(true);
                                    setShowFieldSidebar(false);
                                }}
                            >
                                <i className="fa-solid fa-paintbrush" style={{ marginRight: "3px" }}></i> Theme
                            </button>

                            <div className="form-content" style={{ backgroundColor: formColor }} onClick={() => setShowCustomize(true)}>
                                <DragDropContext onDragEnd={onDragEnd}>
                                    <Droppable droppableId="fields" direction="vertical">
                                        {(provided) => (
                                            <div ref={provided.innerRef} {...provided.droppableProps}>
                                                {fields.map((field, index) => (
                                                    <Draggable key={field.id} draggableId={field.id.toString()} index={index}>
                                                        {(provided) => (
                                                            <div
                                                                className="form-field-wrapper"
                                                                ref={(el) => {
                                                                    provided.innerRef(el);
                                                                    if (selectedFieldId === field.id) {
                                                                        fieldWrapperRef.current = el;
                                                                    }
                                                                }}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                style={{
                                                                    ...provided.draggableProps.style,
                                                                    backgroundColor: formColor
                                                                }}
                                                                onClick={() => handleFieldClick(field.id)}
                                                            >
                                                                <div className="drag-handle" {...provided.dragHandleProps}>
                                                                    <FaGripVertical />
                                                                </div>

                                                                <div className="form-field-content">
                                                                    {!["Heading", "Banner", "Divider", "Image", "Video", "YouTubeVideo", "PDF", "ThankYou", "Next", "Submit"].includes(field.type) ? (
                                                                        <>
                                                                            <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                                                                                <span
                                                                                    contentEditable
                                                                                    suppressContentEditableWarning={true}
                                                                                    ref={(el) => {
                                                                                        if (el && el.innerText !== field.label) {
                                                                                            el.innerText = field.label;
                                                                                        }
                                                                                    }}
                                                                                    onInput={(e) => {
                                                                                        const updatedFields = fields.map(f =>
                                                                                            f.id === field.id ? { ...f, label: e.target.textContent } : f
                                                                                        );
                                                                                        setFields(updatedFields);
                                                                                    }}
                                                                                    style={{
                                                                                        fontSize: "1rem",
                                                                                        background: "transparent",
                                                                                        outline: "none",
                                                                                        color: formQuestionColor,
                                                                                        fontFamily: selectedFont,
                                                                                    }}
                                                                                />

                                                                                {field.required && (
                                                                                    <span style={{ color: 'red', marginLeft: '2px' }}>*</span>
                                                                                )}
                                                                            </div>

                                                                            {field.caption && (
                                                                                <small style={{ color: 'gray', display: 'block', marginBottom: '6px', fontFamily: selectedFont }}>
                                                                                    {field.caption}
                                                                                </small>
                                                                            )}
                                                                        </>
                                                                    ) : null}

                                                                    {renderField(field)}
                                                                </div>

                                                                {selectedFieldId === field.id && (
                                                                    <div className="field-actions">
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation(); // Prevent field click from firing
                                                                                openSettings(field.id);
                                                                            }}
                                                                            data-tooltip-title="Open field settings"
                                                                        >
                                                                            <FaCog
                                                                                style={{
                                                                                    color:
                                                                                        customizeVisible && selectedFieldId === field.id
                                                                                            ? 'rgb(59, 130, 246)'
                                                                                            : 'inherit'
                                                                                }}
                                                                            />
                                                                        </button>

                                                                        {!["Next", "Submit"].includes(field.type) && (
                                                                            <>
                                                                                <button
                                                                                    className="change-type"
                                                                                    onClick={(e) => changeFieldType(field.id, e)}
                                                                                    data-tooltip-title={`Change field type\A${field.type}`}
                                                                                >
                                                                                    <FaExchangeAlt />
                                                                                </button>

                                                                                <button
                                                                                    onClick={() => duplicateField(field.id)}
                                                                                    data-tooltip-title="Duplicate field"
                                                                                >
                                                                                    <FaClone />
                                                                                </button>
                                                                                <button
                                                                                    className="delete"
                                                                                    onClick={() => deleteField(field.id)}
                                                                                    data-tooltip-title="Delete field"
                                                                                >
                                                                                    <FaRegTrashAlt />
                                                                                </button>
                                                                            </>
                                                                        )}

                                                                    </div>
                                                                )}

                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </DragDropContext>
                            </div>

                        </div>

                        {fieldTypeMenu && (
                            <div
                                className="field-type-menu"
                                style={{
                                    position: "absolute",
                                    top: "calc(var(--menu-top, 155px))",
                                    left: "calc(var(--menu-left, 70%) + 50px)",
                                    background: "#fff",
                                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                                    borderRadius: "10px",
                                    padding: "16px",
                                    zIndex: 9999,
                                }}
                            >
                                <h4 style={{ marginBottom: 20, color: "rgb(156 163 175)", fontWeight: "400", fontSize: ".875rem" }}>Change to similar field:</h4>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                                    {[
                                        { type: "Paragraph", label: "Long answer", icon: <FaAlignLeft /> },
                                        { type: "Email", label: "Email input", icon: <FaEnvelope /> },
                                        { type: "Date Picker", label: "Date", icon: <FaCalendarAlt /> },
                                        { type: "Number", label: "Phone number", icon: <FaHashtag /> },
                                        { type: "Dropdown", label: "Dropdown", icon: <FaCaretDown /> },
                                        { type: "Checkbox", label: "Checkbox", icon: <FaCheckSquare /> },
                                    ].map((opt) => (
                                        <button
                                            key={opt.type}
                                            onClick={() => handleTypeChange(fieldTypeMenu.id, opt.type)}
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                border: "1px solid #e5e7eb",
                                                borderRadius: "10px",
                                                padding: "5px 7px",
                                                background: "#f9f9f9",
                                                cursor: "pointer",
                                                width: "70px",
                                                Height: "60px",
                                                overflow: "hidden",
                                                textAlign: "center",
                                                boxSizing: "border-box",
                                            }}
                                        >
                                            <div style={{ fontSize: "15px", color: "#0ea5e9" }}>{opt.icon}</div>
                                            <span
                                                style={{
                                                    fontSize: "12px",
                                                    marginTop: "6px",
                                                    color: "#1f2937",
                                                    lineHeight: "1.2",
                                                    wordWrap: "break-word",
                                                    whiteSpace: "normal",
                                                }}
                                            >
                                                {opt.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {editImageOption && (
                            <div className="image-option-modal-backdrop">
                                <div className="image-option-modal-box">
                                    {/* Close Button */}
                                    <button
                                        className="modal-close-btn"
                                        onClick={() => setEditImageOption(null)}
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>

                                    <h5 style={{ fontWeight: "600", fontSize: "1.125rem", marginBottom: "20px" }}>Edit image option</h5>
                                    <span style={{ fontWeight: "500", fontSize: ".875rem" }}>Lable</span>
                                    <input
                                        style={{ marginBottom: "20px" }}
                                        type="text"
                                        className="form-control"
                                        value={fields.find(f => f.id === editImageOption.fieldId).options[editImageOption.index].option_text}
                                        onChange={(e) => {
                                            const updatedFields = fields.map(f => {
                                                if (f.id !== editImageOption.fieldId) return f;
                                                const updatedOptions = [...f.options];
                                                updatedOptions[editImageOption.index] = {
                                                    ...updatedOptions[editImageOption.index],
                                                    option_text: e.target.value
                                                };
                                                return { ...f, options: updatedOptions };
                                            });
                                            setFields(updatedFields);
                                        }}
                                    />
                                    <span style={{ fontWeight: "500", fontSize: ".875rem" }}>Image</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="form-control mt-2"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file && file.size > 1 * 1024 * 1024) {
                                                setEditImageOption(null);
                                                Swal.fire({
                                                    icon: 'error',
                                                    title: 'File Too Large',
                                                    text: 'Please select a file smaller than 1MB.',
                                                });
                                                return;
                                            }

                                            if (!file) return;
                                            const reader = new FileReader();
                                            reader.onload = () => {
                                                const updatedFields = fields.map(f => {
                                                    if (f.id !== editImageOption.fieldId) return f;
                                                    const updatedOptions = [...f.options];
                                                    updatedOptions[editImageOption.index].image_path = reader.result;
                                                    return { ...f, options: updatedOptions };
                                                });
                                                setFields(updatedFields);
                                            };
                                            reader.readAsDataURL(file);
                                        }}
                                    />
                                    <div className="modal-actions text-end mt-3">
                                        <button onClick={() => setEditImageOption(null)} className="btn btn-primary">
                                            Save
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="form-container-bottom d-flex align-items-center gap-3" style={{ marginBottom: "-30px", marginTop: "10px" }}>
                            <button
                                className="btn btn-primary addpagebtn"
                                style={{ flexShrink: 0 }}
                                onClick={() => {
                                    const nextPageNumber = formPages.length + 1;
                                    setNewPageTitle(`page ` + nextPageNumber);
                                    setShowNewPageModal(true);
                                }}
                            >
                                + Add page
                            </button>
                            <div
                                ref={pagesContainerRef}
                                style={{
                                    overflowX: "auto",
                                    overflowY: "hidden",
                                    whiteSpace: 'nowrap',
                                    position: 'relative',
                                    display: 'flex',
                                    gap: '12px',
                                    flex: '1 1 auto'
                                }}
                            >
                                <DragDropContext onDragEnd={handleDragEnd}>
                                    <Droppable droppableId="pages" direction="horizontal">
                                        {(provided) => (
                                            <div
                                                className="d-flex align-items-center gap-3 pages-nav"
                                                {...provided.droppableProps}
                                                ref={provided.innerRef}
                                            >
                                                {formPages.map((page, index) => {
                                                    const isActive = location.pathname.includes(`/page-${page.page_number}`);
                                                    return (
                                                        <Draggable key={page.id} draggableId={page.id.toString()} index={index}>
                                                            {(provided, snapshot) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    className={`position-relative no-select d-flex align-items-center gap-1 ${isActive ? "active-page" : "text-muted"}`}
                                                                    style={{
                                                                        cursor: snapshot.isDragging ? 'grabbing' : 'pointer',
                                                                        ...provided.draggableProps.style
                                                                    }}
                                                                    onClick={(e) => {
                                                                        if (e.defaultPrevented) return;
                                                                        handlePageNavigation(page.page_number);
                                                                    }}
                                                                >
                                                                    {/* Icon - three dots for active, form icon otherwise */}
                                                                    <i
                                                                        className={`fas ${isActive ? "fa-ellipsis-vertical" : "fa-file-alt"}`}
                                                                        onClick={(e) => {
                                                                            if (isActive) {
                                                                                handleMenuToggle(e, page.id);
                                                                                e.preventDefault(); // prevent navigation
                                                                                e.stopPropagation(); // only popup opens
                                                                            }
                                                                        }}
                                                                        style={{ cursor: isActive ? "pointer" : "default" }}
                                                                    ></i>

                                                                    <span>{page.page_title || `Page ${index + 1}`}</span>

                                                                </div>
                                                            )
                                                            }
                                                        </Draggable>
                                                    );
                                                })}
                                                {provided.placeholder}
                                                <div className="d-flex align-items-center gap-1 text-muted" onClick={() => { handleEndingPage() }}>
                                                    <i className="fas fa-check-circle"></i>
                                                    <span>Ending</span>
                                                </div>
                                            </div>
                                        )}
                                    </Droppable>
                                </DragDropContext>
                            </div>
                            {showArrows && (
                                <div className="d-flex align-items-center gap-1 ms-2">
                                    <button className="scroll-arrow-btn p-1" onClick={() => scrollPages(-200)}>
                                        <i className="fas fa-chevron-left"></i>
                                    </button>
                                    <button className="scroll-arrow-btn p-1" onClick={() => scrollPages(200)}>
                                        <i className="fas fa-chevron-right"></i>
                                    </button>
                                </div>
                            )}
                        </div>

                        {menuOpenForPageId && (
                            <>
                                <div
                                    ref={popupRef}
                                    className="popup-menu position-fixed bg-white shadow rounded p-2"
                                    style={{
                                        top: menuPosition.top,
                                        left: menuPosition.left,
                                        transform: "translateX(-50%)",
                                        background: "white",
                                        border: "1px solid #ddd",
                                        borderRadius: "8px",
                                        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                                        zIndex: 9999,
                                        minWidth: "200px",
                                        padding: "10px"
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >

                                    {/* Set as First Page (show only if not the first page) */}
                                    {menuOpenForPageId !== formPages[0]?.id && (
                                        <div className="popup-item set-first-page"
                                            onClick={() => {
                                                setMenuOpenForPageId(null);
                                                const page = formPages.find(p => p.id === menuOpenForPageId);
                                                handleSetAsFirstPage(page.page_number);
                                            }}
                                        >
                                            <i className="fa-solid fa-flag me-2"></i> Set as First Page
                                        </div>
                                    )}

                                    {/* Rename (Inline Input) */}
                                    {renamingPageId === menuOpenForPageId ? (
                                        <div className="popup-item position-relative" style={{ paddingRight: "20px" }}>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={renamePageTitle}
                                                onChange={(e) => setRenamePageTitle(e.target.value)}
                                                onKeyDown={(e) => {
                                                    const page = formPages.find(p => p.id === menuOpenForPageId);
                                                    if (e.key === "Enter") handlePageRenameSubmit(page.id);
                                                    if (e.key === "Escape") setRenamingPageId(null);
                                                }}
                                                autoFocus
                                            />
                                            <button
                                                className="btn btn-sm btn-primary ms-2 mt-1"
                                                onClick={() => {
                                                    const page = formPages.find(p => p.id === menuOpenForPageId);
                                                    handlePageRenameSubmit(page.id)
                                                    setMenuOpenForPageId(null);
                                                }}
                                            >
                                                Save
                                            </button>
                                            <i
                                                className="fas fa-xmark text-muted"
                                                style={{
                                                    position: "absolute",
                                                    top: "6px",
                                                    right: "6px",
                                                    fontSize: "0.75rem",
                                                    cursor: "pointer",
                                                }}
                                                onClick={() => setRenamingPageId(null)}
                                            ></i>
                                        </div>
                                    ) : (
                                        <div
                                            className="popup-item"
                                            onClick={() => {
                                                const page = formPages.find(p => p.id === menuOpenForPageId);
                                                setRenamingPageId(page.id);
                                                setRenamePageTitle(page.page_title || `Page ${page.page_number}`);
                                            }}
                                        >
                                            <i className="fas fa-pen me-2"></i> Rename
                                        </div>
                                    )}

                                    {/* Copy */}
                                    <div
                                        className="popup-item"
                                        onClick={() => {
                                            setMenuOpenForPageId(null);

                                            const page = formPages.find(p => p.id === menuOpenForPageId);
                                            const match = location.pathname.match(/\/form-builder\/form-(\d+)\/page-(\w+)/);
                                            const copiedFormId = match ? match[1] : null;
                                            const copiedPageId = page?.id;

                                            if (copiedFormId && copiedPageId) {
                                                const raw = `${copiedFormId}:${copiedPageId}`;
                                                const encoded = btoa(raw); // base64 encode
                                                const code = `dforms-copy:${encoded}`;
                                                navigator.clipboard.writeText(code);

                                                Swal.fire("Copied!", "Copy code copied to clipboard. Paste it in Add page", "success");
                                            } else {
                                                Swal.fire("Error", "Failed to generate copy code.", "error");
                                            }
                                        }}
                                    >
                                        <i className="fa-regular fa-file me-2"></i> Copy
                                    </div>

                                    {/* Duplicate */}
                                    <div
                                        className="popup-item"
                                        data-bs-toggle="modal"
                                        data-bs-target="#DuplicateModalCenter"
                                        onClick={() => {
                                            setMenuOpenForPageId(null);
                                            const page = formPages.find(p => p.id === menuOpenForPageId);
                                            openDuplicateModal(page);
                                        }}
                                    >
                                        <i className="fas fa-clone me-2"></i> Duplicate
                                    </div>

                                    {/* Delete */}
                                    {formPages.length > 1 && (
                                        <div
                                            className="popup-item trash-item text-danger"
                                            onClick={() => {
                                                const page = formPages.find(p => p.id === menuOpenForPageId);
                                                handleDeletePage(page.id, page.page_number);
                                                setMenuOpenForPageId(null);
                                            }}
                                        >
                                            <i className="fas fa-trash me-2"></i> Delete
                                        </div>
                                    )}
                                </div>

                            </>
                        )}

                    </div>

                    {customizeVisible && (
                        <div className="customize-section" style={{ color: 'gray', zIndex: "0" }}>
                            <div className="customize-header" style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #ddd', paddingBottom: '10px', marginBottom: '20px' }}>
                                <i
                                    className="fa-solid fa-xmark"
                                    style={{ fontSize: "20px", cursor: "pointer", color: "black", marginRight: '20px' }}
                                    onClick={() => setCustomizeVisible(false)}
                                ></i>
                                <h4 style={{ fontWeight: '500', fontSize: '1.125rem', margin: 0 }}>
                                    {fields.find(f => f.id === selectedFieldId)?.type} settings
                                </h4>
                            </div>

                            <div>

                                {!["Divider", "Image", "Video", "PDF", "YouTubeVideo", "ThankYou", "Submit", "Next"].includes(fields.find(f => f.id === selectedFieldId)?.type) && (
                                    <>
                                        <label>Label</label>
                                        <div style={{ color: "#aaa", fontSize: ".875rem", marginBottom: "10px" }}>
                                            Click text on page to modify
                                        </div>
                                    </>
                                )}

                                {/* Show only Specific Fields */}
                                {!["Heading", "Divider", "Image", "Video", "PDF", "YouTubeVideo", "ThankYou", "Submit", "Next"].includes(fields.find(f => f.id === selectedFieldId)?.type) && (
                                    <>
                                        <label>Caption</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={fields.find(f => f.id === selectedFieldId)?.caption || ""}
                                            onChange={(e) => {
                                                const updatedFields = fields.map(f =>
                                                    f.id === selectedFieldId ? { ...f, caption: e.target.value } : f
                                                );
                                                setFields(updatedFields);
                                            }}
                                        />
                                    </>
                                )}

                                {!["Heading", "Banner", "Multiple Choice", "Checkbox", "Multiple Select Checkboxes", "Picture", "Switch", "Choice Matrix", "Date Picker", "Date Time Picker", "Time Picker", "Date Range", "Ranking", "Star Rating", "Slider", "Opinion Scale", "Address", "Divider", "Image", "Video", "PDF", "YouTubeVideo", "Document Type", "ThankYou", "Submit", "Next"].includes(fields.find(f => f.id === selectedFieldId)?.type) && (
                                    <>
                                        <label>Placeholder</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={fields.find(f => f.id === selectedFieldId)?.placeholder || ""}
                                            onChange={(e) => {
                                                const updatedFields = fields.map(f =>
                                                    f.id === selectedFieldId ? { ...f, placeholder: e.target.value } : f
                                                );
                                                setFields(updatedFields);
                                            }}
                                        />
                                    </>
                                )}

                                {!["Heading", "Banner", "Multiple Choice", "Checkbox", "Multiple Select Checkboxes", "Dropdown", "Multiple Select", "Picture", "Switch", "Choice Matrix", "Date Picker", "Date Time Picker", "Time Picker", "Date Range", "Ranking", "Star Rating", "Slider", "Opinion Scale", "Number", "Address", "Divider", "Image", "Video", "PDF", "YouTubeVideo", "Document Type", "ThankYou", "Submit", "Next"].includes(fields.find(f => f.id === selectedFieldId)?.type) && (
                                    <>
                                        <label>Default value<span title="Initial value" style={{ cursor: "help" }}>🛈</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={fields.find(f => f.id === selectedFieldId)?.default_value || ""}
                                            onChange={(e) => {
                                                const updatedFields = fields.map(f =>
                                                    f.id === selectedFieldId ? { ...f, default_value: e.target.value } : f
                                                );
                                                setFields(updatedFields);
                                            }}
                                        />
                                    </>
                                )}

                                {["Switch", "Checkbox"].includes(fields.find(f => f.id === selectedFieldId)?.type) && (
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            marginBottom: "10px"
                                        }}
                                    >
                                        <label style={{ marginBottom: 0 }}>
                                            Default value{" "}
                                            <span title="Switch on to make this field true" style={{ cursor: "help" }}>🛈</span>
                                        </label>

                                        <span
                                            className={`custom-toggle ${fields.find(f => f.id === selectedFieldId)?.default_value === "true" ? 'active' : ''}`}
                                            onClick={() => {
                                                const updatedFields = fields.map(f =>
                                                    f.id === selectedFieldId
                                                        ? {
                                                            ...f,
                                                            default_value: f.default_value === "true" ? "false" : "true"
                                                        }
                                                        : f
                                                );
                                                setFields(updatedFields);
                                            }}
                                            style={{ cursor: "pointer" }}
                                        ></span>
                                    </div>
                                )}

                                {/* ✅ Style section for Heading */}
                                {fields.find(f => f.id === selectedFieldId)?.type === "Heading" && (
                                    <>
                                        <label>Font Size (px)</label>
                                        <input
                                            type="number"
                                            min={12}
                                            max={48}
                                            className="form-control"
                                            value={parseInt(fields.find(f => f.id === selectedFieldId)?.font_size || "24")}
                                            onChange={(e) => {
                                                const updatedFields = fields.map(f =>
                                                    f.id === selectedFieldId ? { ...f, font_size: `${e.target.value}px` } : f
                                                );
                                                setFields(updatedFields);
                                            }}
                                        />

                                        <label>Caption</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={fields.find(f => f.id === selectedFieldId)?.caption ?? ""}
                                            placeholder="Description"
                                            onChange={(e) => {
                                                const updatedFields = fields.map(f => {
                                                    if (f.id === selectedFieldId) {
                                                        return { ...f, caption: e.target.value };
                                                    }
                                                    return f;
                                                });
                                                setFields(updatedFields);
                                            }}
                                        />

                                        {/* Heading Alignment */}
                                        <label className="mt-3">Heading Alignment</label>
                                        <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                                            {["left", "center", "right"].map((align) => {
                                                const icons = {
                                                    left: "⬅️",
                                                    center: "↔️",
                                                    right: "➡️"
                                                };
                                                return (
                                                    <button
                                                        key={align}
                                                        onClick={() => {
                                                            const updatedFields = fields.map(f =>
                                                                f.id === selectedFieldId ? { ...f, alignment: align } : f
                                                            );
                                                            setFields(updatedFields);
                                                        }}
                                                        style={{
                                                            padding: "6px 10px",
                                                            fontSize: "1.2rem",
                                                            border: fields.find(f => f.id === selectedFieldId)?.alignment === align
                                                                ? "2px solid #007bff"
                                                                : "1px solid lightgray",
                                                            borderRadius: "5px",
                                                            background: "white",
                                                            cursor: "pointer"
                                                        }}
                                                    >
                                                        {icons[align]}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}

                                {/* ✅ Style section for Banner */}
                                {fields.find(f => f.id === selectedFieldId)?.type === "Banner" && (
                                    <div style={{ marginTop: "20px" }}>
                                        <label>Alert type</label>
                                        <select
                                            className="form-control"
                                            value={fields.find(f => f.id === selectedFieldId)?.alert_type || "info"}
                                            onChange={(e) => {
                                                const updatedFields = fields.map(f =>
                                                    f.id === selectedFieldId ? { ...f, alert_type: e.target.value } : f
                                                );
                                                setFields(updatedFields);
                                            }}
                                        >
                                            <option value="warning">🟨 Warning</option>
                                            <option value="error">🟥 Error</option>
                                            <option value="info">🟦 Info</option>
                                            <option value="success">🟩 Success</option>
                                        </select>
                                    </div>
                                )}

                                {["Dropdown", "Multiple Choice", "Multiple Select", "Multiple Select Checkboxes"].includes(fields.find(f => f.id === selectedFieldId)?.type) && (
                                    <div style={{ marginTop: "20px" }}>
                                        <label>Options</label>

                                        <DragDropContext onDragEnd={(result) => {
                                            const { source, destination } = result;
                                            if (!destination) return;
                                            reorderOptions(selectedFieldId, source.index, destination.index);
                                        }}>
                                            <Droppable droppableId="optionsList">
                                                {(provided) => (
                                                    <div ref={provided.innerRef} {...provided.droppableProps}>
                                                        {fields.find(f => f.id === selectedFieldId)?.options.map((opt, index) => (
                                                            <Draggable key={index} draggableId={`option-${index}`} index={index}>
                                                                {(provided) => (
                                                                    <div
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        style={{
                                                                            display: "flex",
                                                                            alignItems: "center",
                                                                            background: "#f9f9f9",
                                                                            padding: "8px",
                                                                            borderRadius: "6px",
                                                                            marginBottom: "6px",
                                                                            ...provided.draggableProps.style
                                                                        }}
                                                                    >
                                                                        <input
                                                                            type="text"
                                                                            value={typeof opt === "object" ? opt.option_text : opt}
                                                                            className="form-control"
                                                                            onChange={(e) => {
                                                                                const updatedFields = fields.map(field => {
                                                                                    if (field.id === selectedFieldId) {
                                                                                        const newOptions = [...field.options];
                                                                                        newOptions[index] = {
                                                                                            option_text: e.target.value
                                                                                        };
                                                                                        return { ...field, options: newOptions };
                                                                                    }
                                                                                    return field;
                                                                                });
                                                                                setFields(updatedFields);
                                                                            }}
                                                                            style={{ flex: 1, marginRight: "10px" }}
                                                                        />
                                                                        <span {...provided.dragHandleProps} style={{ cursor: "grab", marginRight: "10px" }}>
                                                                            <i className="fas fa-grip-vertical"></i>
                                                                        </span>
                                                                        <span
                                                                            style={{ color: "red", cursor: "pointer" }}
                                                                            onClick={() => {
                                                                                const updatedFields = fields.map(f =>
                                                                                    f.id === selectedFieldId
                                                                                        ? {
                                                                                            ...f,
                                                                                            options: f.options.filter((_, i) => i !== index)
                                                                                        }
                                                                                        : f
                                                                                );
                                                                                setFields(updatedFields);
                                                                            }}
                                                                        >
                                                                            <i className="fas fa-trash-alt"></i>
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </Draggable>
                                                        ))}
                                                        {provided.placeholder}
                                                    </div>
                                                )}
                                            </Droppable>
                                        </DragDropContext>

                                        <button
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => {
                                                const updatedFields = fields.map(f =>
                                                    f.id === selectedFieldId
                                                        ? {
                                                            ...f,
                                                            options: [
                                                                ...f.options,
                                                                { option_text: `Option ${f.options.length + 1}` }
                                                            ]
                                                        }
                                                        : f
                                                );
                                                setFields(updatedFields);
                                            }}
                                            style={{ marginTop: "10px" }}
                                        >
                                            + Add Option
                                        </button>
                                    </div>
                                )}

                                {/* ✅ Style section for Multiple Choice */}
                                {fields.find(f => f.id === selectedFieldId)?.type === "Multiple Choice" && (
                                    <div style={{ marginTop: "20px" }}>
                                        <label style={{ fontWeight: 'bold' }}>Style</label>
                                        <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                                            <div
                                                onClick={() => {
                                                    const updatedFields = fields.map(f =>
                                                        f.id === selectedFieldId ? { ...f, bubble: true } : f
                                                    );
                                                    setFields(updatedFields);
                                                }}
                                                style={{
                                                    border: fields.find(f => f.id === selectedFieldId)?.bubble ? '2px solid #2563eb' : '1px solid #ccc',
                                                    padding: '10px',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    flex: '1',
                                                    textAlign: 'center'
                                                }}
                                            >
                                                <div style={{ fontSize: '20px', marginBottom: '5px' }}>☰</div>
                                                Bubble
                                            </div>

                                            <div
                                                onClick={() => {
                                                    const updatedFields = fields.map(f =>
                                                        f.id === selectedFieldId ? { ...f, bubble: false } : f
                                                    );
                                                    setFields(updatedFields);
                                                }}
                                                style={{
                                                    border: !fields.find(f => f.id === selectedFieldId)?.bubble ? '2px solid #2563eb' : '1px solid #ccc',
                                                    padding: '10px',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    flex: '1',
                                                    textAlign: 'center'
                                                }}
                                            >
                                                <div style={{ fontSize: '18px', marginBottom: '5px' }}>◯</div>
                                                Standard
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {["Date Picker", "Time Picker", "Date Time Picker"].includes(fields.find(f => f.id === selectedFieldId)?.type) && (
                                    <div style={{ marginBottom: "10px" }}>
                                        <label>
                                            Default value{" "}
                                            <span title="Set a default date/time for this field" style={{ cursor: "help" }}>🛈</span>
                                        </label>
                                        <input
                                            type={
                                                fields.find(f => f.id === selectedFieldId)?.type === "Date Picker" ? "date" :
                                                    fields.find(f => f.id === selectedFieldId)?.type === "Time Picker" ? "time" : "datetime-local"
                                            }
                                            className="form-control"
                                            value={fields.find(f => f.id === selectedFieldId)?.default_value || ""}
                                            onChange={(e) => {
                                                const updatedFields = fields.map(f =>
                                                    f.id === selectedFieldId ? { ...f, default_value: e.target.value } : f
                                                );
                                                setFields(updatedFields);
                                            }}
                                        />
                                    </div>
                                )}

                                {fields.find(f => f.id === selectedFieldId)?.type === "Star Rating" && (
                                    <div style={{ marginBottom: "10px" }}>
                                        <label>
                                            Max Stars{" "}
                                            <span title="Maximum number of stars to display (Max 50)" style={{ cursor: "help" }}>🛈</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="50"
                                            className="form-control"
                                            value={fields.find(f => f.id === selectedFieldId)?.max_value || 5}
                                            onChange={(e) => {
                                                const value = Math.min(50, parseInt(e.target.value, 10));
                                                const updatedFields = fields.map(f =>
                                                    f.id === selectedFieldId ? { ...f, max_value: value } : f
                                                );
                                                setFields(updatedFields);
                                            }}
                                        />
                                    </div>
                                )}

                                {fields.find(f => f.id === selectedFieldId)?.type === "Slider" && (
                                    <div style={{ marginBottom: "10px" }}>
                                        <label>
                                            Max Slider Value{" "}
                                            <span title="Set the maximum value for the slider (between 10 and 100)" style={{ cursor: "help" }}>🛈</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="10"
                                            max="100"
                                            className="form-control"
                                            value={fields.find(f => f.id === selectedFieldId)?.max_value || 100}
                                            onChange={(e) => {
                                                let value = parseInt(e.target.value, 10);
                                                value = Math.max(10, Math.min(100, value)); // clamp to 10–100

                                                const updatedFields = fields.map(f =>
                                                    f.id === selectedFieldId ? { ...f, max_value: value } : f
                                                );
                                                setFields(updatedFields);
                                            }}
                                        />
                                    </div>
                                )}

                                {fields.find(f => f.id === selectedFieldId)?.type === "Opinion Scale" && (
                                    <>
                                        <div style={{ marginBottom: "10px" }}>
                                            <label>
                                                Min Opinion
                                                <span title="Minimum scale value (Min 1)" style={{ cursor: "help" }}> 🛈</span>
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max={(fields.find(f => f.id === selectedFieldId)?.max_value || 10) - 1}
                                                className="form-control"
                                                value={fields.find(f => f.id === selectedFieldId)?.min_value ?? 1}
                                                onChange={(e) => {
                                                    const rawValue = e.target.value;
                                                    const parsed = parseInt(rawValue, 10);
                                                    if (!isNaN(parsed)) {
                                                        const value = Math.max(1, parsed);
                                                        const updatedFields = fields.map(f =>
                                                            f.id === selectedFieldId ? { ...f, min_value: value } : f
                                                        );
                                                        setFields(updatedFields);
                                                    }
                                                }}
                                            />
                                        </div>

                                        <div style={{ marginBottom: "10px" }}>
                                            <label>
                                                Max Opinion
                                                <span title="Maximum scale value (Max 100)" style={{ cursor: "help" }}> 🛈</span>
                                            </label>
                                            <input
                                                type="number"
                                                min={(fields.find(f => f.id === selectedFieldId)?.min_value || 1) + 1}
                                                max="100"
                                                className="form-control"
                                                value={fields.find(f => f.id === selectedFieldId)?.max_value ?? 10}
                                                onChange={(e) => {
                                                    const rawValue = e.target.value;
                                                    const parsed = parseInt(rawValue, 10);
                                                    if (!isNaN(parsed)) {
                                                        const value = Math.min(100, parsed);
                                                        const updatedFields = fields.map(f =>
                                                            f.id === selectedFieldId ? { ...f, max_value: value } : f
                                                        );
                                                        setFields(updatedFields);
                                                    }
                                                }}
                                            />
                                        </div>
                                    </>
                                )}

                                {fields.find(f => f.id === selectedFieldId)?.type === "Number" && (
                                    <>
                                        <label>
                                            Default value{" "}
                                            <span title="Initial value" style={{ cursor: "help" }}>🛈</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            value={fields.find(f => f.id === selectedFieldId)?.default_value || ""}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (/^\d*$/.test(value)) {
                                                    const updatedFields = fields.map(f =>
                                                        f.id === selectedFieldId ? { ...f, value, default_value: value } : f
                                                    );
                                                    setFields(updatedFields);
                                                }
                                            }}
                                        />
                                    </>
                                )}

                                {fields.find(f => f.id === selectedFieldId)?.type === "Divider" && (
                                    <>
                                        <label>
                                            Label{" "}
                                            <span title="This text appears in the center of the divider" style={{ cursor: "help" }}>🛈</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Enter divider text"
                                            value={fields.find(f => f.id === selectedFieldId)?.label || ""}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                const updatedFields = fields.map(f =>
                                                    f.id === selectedFieldId ? { ...f, label: value } : f
                                                );
                                                setFields(updatedFields);
                                            }}
                                        />
                                    </>
                                )}

                                {["Image", "PDF", "Video"].includes(fields.find(f => f.id === selectedFieldId)?.type) && (() => {
                                    const field = fields.find(f => f.id === selectedFieldId);

                                    // Fallback to uploaded values if field values are undefined
                                    const alignment = field?.alignment || field?.uploads?.[0]?.file_field_Alignment || "center";
                                    const previewSize = field?.previewSize || field?.uploads?.[0]?.file_field_size || 300;

                                    return (
                                        <>
                                            <label>Max Height</label>

                                            {/* Image Resize Slider */}
                                            <div className="mt-2">
                                                <label>Size: {previewSize}px</label>
                                                <input
                                                    type="range"
                                                    min="100"
                                                    max="600"
                                                    step="10"
                                                    value={previewSize}
                                                    onChange={(e) => {
                                                        const updatedFields = fields.map(f =>
                                                            f.id === selectedFieldId
                                                                ? { ...f, previewSize: parseInt(e.target.value) }
                                                                : f
                                                        );
                                                        setFields(updatedFields);
                                                    }}
                                                    className="form-range"
                                                />
                                            </div>

                                            {/* Alignment Controls */}
                                            <div className="mt-3">
                                                <label>Alignment</label>
                                                <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                                                    {["left", "center", "right"].map((align) => {
                                                        const icons = {
                                                            left: "⬅️",
                                                            center: "↔️",
                                                            right: "➡️"
                                                        };
                                                        return (
                                                            <button
                                                                key={align}
                                                                onClick={() => {
                                                                    const updatedFields = fields.map(f =>
                                                                        f.id === selectedFieldId ? { ...f, alignment: align } : f
                                                                    );
                                                                    setFields(updatedFields);
                                                                }}
                                                                style={{
                                                                    padding: "6px 10px",
                                                                    fontSize: "1.2rem",
                                                                    border: alignment === align
                                                                        ? "2px solid #007bff"
                                                                        : "1px solid lightgray",
                                                                    borderRadius: "5px",
                                                                    background: "white",
                                                                    cursor: "pointer"
                                                                }}
                                                            >
                                                                {icons[align]}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}

                                {["YouTubeVideo"].includes(fields.find(f => f.id === selectedFieldId)?.type) && (() => {
                                    const field = fields.find(f => f.id === selectedFieldId);
                                    const previewSize = field?.previewSize || 300;
                                    const youtubeUrl = field?.youtubeUrl || "";

                                    return (
                                        <>
                                            <label className="form-label">YouTube Video URL</label>
                                            <input
                                                type="text"
                                                placeholder="https://www.youtube.com/..."
                                                value={youtubeUrl}
                                                onChange={(e) => {
                                                    const updatedFields = fields.map(f =>
                                                        f.id === selectedFieldId ? { ...f, youtubeUrl: e.target.value } : f
                                                    );
                                                    setFields(updatedFields);
                                                }}
                                                className="form-control mb-3"
                                            />

                                            <label className="form-label">Max Height</label>
                                            <div className="mt-2">
                                                <label>Size: {previewSize}px</label>
                                                <input
                                                    type="range"
                                                    min="100"
                                                    max="600"
                                                    step="10"
                                                    value={previewSize}
                                                    onChange={(e) => {
                                                        const updatedFields = fields.map(f =>
                                                            f.id === selectedFieldId
                                                                ? { ...f, previewSize: parseInt(e.target.value) }
                                                                : f
                                                        );
                                                        setFields(updatedFields);
                                                    }}
                                                    className="form-range"
                                                />
                                            </div>
                                        </>
                                    );
                                })()}

                                {!["Heading", "Banner", "Divider", "Image", "Video", "PDF", "YouTubeVideo", "ThankYou", "Submit", "Next"].includes(fields.find(f => f.id === selectedFieldId)?.type) && (
                                    <>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                                            {/* Required Row */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <label className="form-check-label">Required</label>
                                                <span
                                                    className={`custom-toggle ${fields.find(f => f.id === selectedFieldId)?.required ? 'active' : ''}`}
                                                    onClick={() => {
                                                        const updatedFields = fields.map(f =>
                                                            f.id === selectedFieldId ? { ...f, required: !f.required } : f
                                                        );
                                                        setFields(updatedFields);
                                                    }}
                                                ></span>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {["ThankYou"].includes(fields.find(f => f.id === selectedFieldId)?.type) && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <label className="form-check-label">Hide icon</label>
                                            <span
                                                className={`custom-toggle ${fields.find(f => f.id === selectedFieldId)?.hideIcon ? 'active' : ''}`}
                                                onClick={() => {
                                                    const updatedFields = fields.map(f =>
                                                        f.id === selectedFieldId
                                                            ? { ...f, hideIcon: !f.hideIcon }
                                                            : f
                                                    );
                                                    setFields(updatedFields);
                                                }}
                                            ></span>
                                        </div>
                                    </div>
                                )}

                                {["Submit", "Next"].includes(fields.find(f => f.id === selectedFieldId)?.type) && (() => {
                                    const field = fields.find(f => f.id === selectedFieldId);
                                    const btnalignment = field?.btnalignment || "left";

                                    return (
                                        <>
                                            <label>Button Text</label>
                                            <input
                                                className="form-control mb-3"
                                                type="text"
                                                value={field.label}
                                                onChange={(e) => {
                                                    const updatedFields = fields.map(f =>
                                                        f.id === selectedFieldId ? { ...f, label: e.target.value } : f
                                                    );
                                                    setFields(updatedFields);
                                                }}
                                            />

                                            {/* Background Color */}
                                            <div className="d-flex align-items-center justify-content-between mb-3" style={{ position: "relative" }}>
                                                <label className="me-2" style={{ width: '150px' }}>Background Color</label>
                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveBtnColorPicker("btnbgColor");
                                                    }}
                                                    style={{
                                                        width: "30px",
                                                        height: "25px",
                                                        backgroundColor: field.btnbgColor || "#6c757d",
                                                        border: "1px solid #ccc",
                                                        borderRadius: "4px",
                                                        cursor: "pointer"
                                                    }}
                                                ></div>

                                                {activeBtnColorPicker === "btnbgColor" && (
                                                    <div
                                                        ref={pickerRef}
                                                        style={{
                                                            position: "absolute",
                                                            top: "35px",
                                                            right: "35px", // show ChromePicker on left side of the box
                                                            zIndex: 9999,
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <ChromePicker
                                                            color={field.btnbgColor || "#6c757d"}
                                                            onChangeComplete={(color) => {
                                                                const updatedFields = fields.map(f =>
                                                                    f.id === selectedFieldId ? { ...f, btnbgColor: color.hex } : f
                                                                );
                                                                setFields(updatedFields);
                                                            }}
                                                            disableAlpha
                                                        />
                                                        <div
                                                            onClick={() => setActiveBtnColorPicker(null)}
                                                            style={{
                                                                marginTop: "5px",
                                                                fontSize: "12px",
                                                                color: "#374151",
                                                                cursor: "pointer"
                                                            }}
                                                        >
                                                            Close
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Label Color */}
                                            <div className="d-flex align-items-center justify-content-between mb-3" style={{ position: "relative" }}>
                                                <label className="me-2" style={{ width: '150px' }}>Label Color</label>
                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveBtnColorPicker("btnlabelColor");
                                                    }}
                                                    style={{
                                                        width: "30px",
                                                        height: "25px",
                                                        backgroundColor: field.btnlabelColor || "#ffffff",
                                                        border: "1px solid #ccc",
                                                        borderRadius: "4px",
                                                        cursor: "pointer"
                                                    }}
                                                ></div>

                                                {activeBtnColorPicker === "btnlabelColor" && (
                                                    <div
                                                        ref={pickerRef}
                                                        style={{
                                                            position: "absolute",
                                                            top: "35px",
                                                            right: "35px", // show ChromePicker on left side of the box
                                                            zIndex: 9999,
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <ChromePicker
                                                            color={field.btnlabelColor || "#ffffff"}
                                                            onChangeComplete={(color) => {
                                                                const updatedFields = fields.map(f =>
                                                                    f.id === selectedFieldId ? { ...f, btnlabelColor: color.hex } : f
                                                                );
                                                                setFields(updatedFields);
                                                            }}
                                                            disableAlpha
                                                        />
                                                        <div
                                                            onClick={() => setActiveBtnColorPicker(null)}
                                                            style={{
                                                                marginTop: "5px",
                                                                fontSize: "12px",
                                                                color: "#374151",
                                                                cursor: "pointer"
                                                            }}
                                                        >
                                                            Close
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    );
                                })()}

                            </div>
                        </div>
                    )}
                </>
            )
            }

            <div className="modal fade" id="fontModal" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content p-0">
                        <div className="modal-header updated-header">
                            <h5 className="modal-title">Choose a Font</h5>
                            <button
                                id="fontCloseBtn"
                                type="button"
                                className="btn-close"
                                data-bs-dismiss="modal"
                                aria-label="Close"
                            ><i class="fa-solid fa-xmark"></i></button>
                        </div>
                        <div className="modal-body">
                            {/* Search Bar */}
                            <div className="px-3 pb-2">
                                <input
                                    className="form-control"
                                    placeholder="Search fonts"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            {/* Fonts Grid */}
                            <div className="modal-options px-3 pb-3">
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                                    gap: "15px"
                                }}>
                                    {filteredFonts.map(font => (
                                        <div
                                            key={font}
                                            onClick={() => handleFontSelect(font)}
                                            style={{
                                                fontFamily: `'${font}', sans-serif`,
                                                border: tempFont === font ? "2px solid #1976d2" : "1px solid #ccc",
                                                backgroundColor: tempFont === font ? "#e3f2fd" : "#fff",
                                                padding: "15px",
                                                borderRadius: "10px",
                                                height: "120px",
                                                display: "flex",
                                                flexDirection: "column",
                                                justifyContent: "center",
                                                position: "relative",
                                                cursor: "pointer",
                                                transition: "all 0.2s ease-in-out"
                                            }}
                                            onMouseEnter={(e) => {
                                                if (tempFont !== font) e.currentTarget.style.backgroundColor = "#f0f8ff";
                                            }}
                                            onMouseLeave={(e) => {
                                                if (tempFont !== font) e.currentTarget.style.backgroundColor = "#fff";
                                            }}
                                        >
                                            <div style={{ fontSize: "14px" }}>The quick brown fox jumped over the lazy dog</div>
                                            <div style={{ fontSize: "12px", marginTop: "8px", color: "#555" }}>{font}</div>

                                            {tempFont === font && (
                                                <i
                                                    className="fas fa-check-circle"
                                                    style={{
                                                        color: "#1976d2",
                                                        position: "absolute",
                                                        top: "10px",
                                                        right: "10px",
                                                        fontSize: "18px"
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedFont("");
                                                        setTempFont("");
                                                    }}
                                                ></i>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="modal-footer justify-content-end">
                            <button
                                className="btn btn-primary"
                                disabled={!tempFont}
                                onClick={handleDone}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div
                className={`modal fade ${showModal ? "show d-block" : ""}`}
                id="createFormModalCenter"
                tabIndex="-1"
                role="dialog"
                aria-labelledby="createFormModalCenterTitle"
                aria-hidden={!showModal}
                style={{ backgroundColor: showModal ? "rgba(0,0,0,0.5)" : "transparent" }}
            >
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content custom-modal p-0">
                        <div className="modal-header border-0 pb-0">
                            <h5 className="modal-title">Name your form</h5>
                            <button type="button" className="btn-close" style={{ outline: "none", border: "none", boxShadow: "none" }} onClick={() => { navigate("/home"); }} data-bs-dismiss="modal" aria-label="Close"><i className="fa-solid fa-xmark"></i></button>
                        </div>
                        <div className="modal-body pt-2">
                            <input
                                type="text"
                                id="formNameInput"
                                className="form-control custom-input"
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                            />
                        </div>
                        <div className="modal-footer border-0 pt-0 justify-content-end">
                            <button type="button" id="continueButton" className="btn btn-primary custom-continue-btn" onClick={handleContinue}>Continue</button>
                        </div>
                    </div>
                </div>
            </div>

            <div
                className={`modal fade ${showTemplateModal ? "show d-block" : ""}`}
                id="TemplateFormModalCenter"
                tabIndex="-1"
                role="dialog"
                aria-labelledby="TemplateFormModalCenterTitle"
                aria-hidden={!showTemplateModal}
                style={{ backgroundColor: showTemplateModal ? "rgba(0,0,0,0.5)" : "transparent" }}
            >
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content custom-modal p-0">
                        <div className="modal-header border-0 pb-0">
                            <h5 className="modal-title">Name your form</h5>
                            <button type="button" className="btn-close" style={{ outline: "none", border: "none", boxShadow: "none" }} onClick={() => { navigate("/home"); }} data-bs-dismiss="modal" aria-label="Close"><i className="fa-solid fa-xmark"></i></button>
                        </div>
                        <div className="modal-body pt-2">
                            <input
                                type="text"
                                id="formNameInput"
                                className="form-control custom-input"
                                value={templateFormTitle}
                                onChange={(e) => setTemplateFormTitle(e.target.value)}
                            />
                        </div>
                        <div className="modal-footer border-0 pt-0 justify-content-end">
                            <button type="button" id="continueButton" className="btn btn-primary custom-continue-btn" onClick={handleTemplateFormContinue}>Continue</button>
                        </div>
                    </div>
                </div>
            </div>

            <div
                className={`modal fade ${showNewPageModal ? "show d-block" : ""}`}
                id="newPageModalCenter"
                tabIndex="-1"
                role="dialog"
                aria-labelledby="newPageModalCenterTitle"
                aria-hidden={!showNewPageModal}
                style={{ backgroundColor: showNewPageModal ? "rgba(0,0,0,0.5)" : "transparent" }}
            >
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content custom-modal p-0">
                        <div className="modal-header border-0 pb-0">
                            <h5 className="modal-title">Name your form page</h5>
                            <button type="button" className="btn-close" style={{ outline: "none", border: "none", boxShadow: "none" }} onClick={() => { setShowNewPageModal(false) }} data-bs-dismiss="modal" aria-label="Close"><i className="fa-solid fa-xmark"></i></button>
                        </div>
                        <div className="modal-body pt-2">
                            <input
                                type="text"
                                id="formNewPageInput"
                                className="form-control custom-input"
                                value={newPageTitle}
                                onChange={(e) => setNewPageTitle(e.target.value)}
                            />
                        </div>
                        <div className="modal-footer border-0 pt-0 justify-content-end">
                            <button type="button" id="continueButton" className="btn btn-primary custom-continue-btn" onClick={handleNewPageContinue}>Continue</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="modal fade" id="DuplicateModalCenter" tabIndex="-1" role="dialog" aria-hidden="true" >
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content custom-modal p-0">
                        <div className="modal-header border-0 pb-0">
                            <h5 className="modal-title">Name your page</h5>
                            <button type="button" className="btn-close" style={{ outline: "none", border: "none", boxShadow: "none" }} data-bs-dismiss="modal" aria-label="Close"><i className="fa-solid fa-xmark"></i></button>
                        </div>
                        <div className="modal-body pt-2">
                            <input
                                type="text"
                                className="form-control"
                                value={duplicatePageTitle}
                                onChange={(e) => setDuplicatePageTitle(e.target.value)}
                            />
                        </div>
                        <div className="modal-footer border-0 pt-0 justify-content-end">
                            <button
                                className="btn btn-primary"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDuplicatePage();
                                }}
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </div >
    );
};

export default FormBuilder; 