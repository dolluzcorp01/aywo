import React, { useEffect, useRef, useState } from "react";
import { apiFetch } from "./utils/api";
import { useParams } from "react-router-dom";
import $ from "jquery";
import "datatables.net";
import "datatables.net-dt/css/dataTables.dataTables.min.css";
import * as XLSX from "xlsx"; // Import SheetJS for Excel export
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // Import the autoTable plugin
import {
    FaEnvelope, FaHashtag, FaList, FaCheckSquare, FaCaretDown,
    FaCalendarAlt, FaAlignLeft, FaFileAlt, FaToggleOn, FaImage, FaBoxes, FaGripHorizontal,
    FaHeading, FaChevronUp, FaChevronDown, FaClock, FaRegClock, FaCalendarCheck, FaSortNumericDown, FaStar,
    FaSlidersH, FaSmile, FaEquals, FaBars, FaMapMarkerAlt, FaVideo, FaFilePdf, FaMinus, FaYoutube
} from "react-icons/fa";
import "./Responses.css";

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

const Responses = () => {
    const { formId } = useParams();
    const [responses, setResponses] = useState([]);
    const [columns, setColumns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const tableRef = useRef(null);
    const dataTableRef = useRef(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [summaryData, setSummaryData] = useState([]);
    const [viewMode, setViewMode] = useState("results"); // 'results' | 'summary'

    const generateSummaryData = (responses) => {
        const questionSummaryMap = {};

        responses.forEach(response => {
            response.answers.forEach(answer => {
                const key = answer.label;
                const isAnswered = answer.answer !== null && answer.answer !== "";

                if (!questionSummaryMap[key]) {
                    questionSummaryMap[key] = { count: 0, total: 0, label: key, type: answer.type };
                }

                if (isAnswered) {
                    questionSummaryMap[key].count += 1;
                }

                questionSummaryMap[key].total += 1;
            });
        });

        return Object.values(questionSummaryMap);
    };

    useEffect(() => {
        apiFetch(`/api/responses/get-responses/${formId}`, {
            method: "GET",
            credentials: "include",
        })
            .then((res) => {
                if (!res.ok) {
                    throw new Error("Failed to fetch responses");
                }
                return res.json();
            })
            .then((data) => {
                setResponses(data);
                const summary = generateSummaryData(data);
                setSummaryData(summary);

                if (data.length > 0) {
                    const uniqueFields = new Set();
                    data.forEach((response) => {
                        response.answers.forEach((answer) => {
                            uniqueFields.add(answer.label);
                        });
                    });

                    const dynamicColumns = [
                        { title: "Response ID", data: "response_id" },
                        {
                            title: "Submitted At",
                            data: "submitted_at",
                            render: (data) => new Date(data).toLocaleString(),
                        },
                        ...Array.from(uniqueFields).map((field) => ({
                            title: field,
                            data: (row) => {
                                const answer = row.answers.find((a) => a.label === field);
                                if (!answer) return "-";

                                if (answer.filePath) {
                                    return `<a href="/${answer.filePath.replace(/^\/?uploads\//, 'uploads/')}" target="_blank">${answer.answer}</a>`;
                                }

                                let value = answer.answer;

                                try {
                                    const parsed = JSON.parse(value);

                                    if (Array.isArray(parsed)) {
                                        value = parsed.map(item => `<div style="white-space: nowrap;">${item}</div>`).join("");
                                    } else if (typeof parsed === "object" && parsed !== null) {
                                        value = Object.entries(parsed)
                                            .map(([k, v]) => `<div style="white-space: nowrap;">${k}: ${v}</div>`)
                                            .join("");
                                    }
                                } catch (e) {
                                    value = value.replace(/,\s*/g, "<br>");
                                }

                                const isPlainDate = /^\d{4}-\d{2}-\d{2}$/.test(value);
                                const isDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value);
                                const isTimeOnly = /^\d{2}:\d{2}$/.test(value);

                                if (isPlainDate || isDateTime || isTimeOnly) {
                                    return `<div style="white-space: nowrap;">${value}</div>`;
                                }

                                return `<div style="white-space: normal;">${value}</div>`;

                            },
                        }))
                    ];

                    setColumns(dynamicColumns);
                }
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [formId]);

    useEffect(() => {
        if (responses.length > 0 && columns.length > 0 && tableRef.current) {
            if (dataTableRef.current) {
                dataTableRef.current.destroy();
            }

            dataTableRef.current = $(tableRef.current).DataTable({
                data: responses,
                columns: columns,
                destroy: true,
                responsive: true,
                searching: true,
                paging: true,
                ordering: true,
                info: true,
                dom: '<"top-bar-wrapper"lf>rt<"bottom"ip><"clear">'
            });
        }
    }, [responses, columns]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // ✅ Export Data to Excel using SheetJS
    const exportToExcel = () => {
        if (responses.length === 0) {
            alert("No data available to export.");
            return;
        }

        const selectedData = responses.map((response) => ({
            "Response ID": response.response_id,
            "Submitted At": new Date(response.submitted_at).toLocaleString(),
            ...response.answers.reduce((acc, ans) => {
                acc[ans.label] = ans.answer;
                return acc;
            }, {}),
        }));

        const ws = XLSX.utils.json_to_sheet(selectedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Responses");

        // ✅ Save file with Response ID in the filename
        XLSX.writeFile(wb, `Responses_${formId}.xlsx`);
    };

    const formatAnswerForPDF = (answer) => {
        if (answer == null) return '';

        try {
            const parsed = JSON.parse(answer);

            if (Array.isArray(parsed)) {
                return parsed.join(", ");
            } else if (typeof parsed === "object" && parsed !== null) {
                return Object.entries(parsed)
                    .map(([k, v]) => {
                        if (typeof v === 'object') {
                            return `${k}: ${JSON.stringify(v)}`;
                        }
                        return `${k}: ${v}`;
                    })
                    .join("\n");
            } else {
                return String(parsed); // for booleans, numbers
            }
        } catch (e) {
            // fallback: raw text
            return String(answer).trim();
        }
    };

    // ✅ Export Data to PDF using jsPDF & autoTable
    const exportToPDF = () => {
        if (responses.length === 0) {
            alert("No data available to export.");
            return;
        }

        const doc = new jsPDF({
            orientation: "landscape",
        });
        const pageWidth = doc.internal.pageSize.getWidth();

        // ✅ Get all dynamic columns
        const dynamicColumns = columns.slice(2);

        // ✅ Chunk them in groups of 8
        const chunkSize = 8;
        const dynamicChunks = [];
        for (let i = 0; i < dynamicColumns.length; i += chunkSize) {
            dynamicChunks.push(dynamicColumns.slice(i, i + chunkSize));
        }

        dynamicChunks.forEach((chunk, index) => {
            if (index > 0) {
                doc.addPage();
            }

            autoTable(doc, {
                head: [[
                    "Response ID",
                    "Submitted At",
                    ...chunk.map(col => col.title),
                ]],
                body: responses.map((response) => {
                    const visibleAnswers = chunk.map(col => {
                        const found = response.answers.find(a => a.label === col.title);
                        return formatAnswerForPDF(found ? found.answer : '');
                    });

                    return [
                        response.response_id,
                        new Date(response.submitted_at).toLocaleString(),
                        ...visibleAnswers
                    ];
                }),
                startY: 30,
                margin: { top: 30 },
                theme: "grid",
                styles: {
                    cellWidth: 'wrap',
                    overflow: 'linebreak',
                    fontSize: 7,
                },
                headStyles: {
                    halign: 'center',
                },
                didDrawPage: function () {
                    doc.setFontSize(12);
                    doc.text(`dFrom | Responses for Form ${formId}`, pageWidth / 2, 15, { align: 'center' });

                    doc.setFontSize(8);
                    doc.text(`Generated by dFrom | Form ID: ${formId}`, pageWidth / 2, 23, { align: 'center' });
                },
            });
        });

        doc.save(`Responses_${formId}.pdf`);
    };

    if (loading) return <p>Loading responses...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div className="responses-container">
            <div className="responses-header-tabs">
                <div
                    className={`tab ${viewMode === "results" ? "active-tab" : ""}`}
                    onClick={() => setViewMode("results")}
                >
                    <i className="fa-solid fa-table-cells"></i> Results
                </div>
                <div
                    className={`tab ${viewMode === "summary" ? "active-tab" : ""}`}
                    onClick={() => setViewMode("summary")}
                >
                    <i className="fa-solid fa-chart-pie"></i> Summary
                </div>
            </div>

            <div style={{ backgroundColor: viewMode === "summary" ? "rgb(249 250 251)" : "transparent" }}>
                {responses.length > 0 && (
                    <div className="export-dropdown" ref={dropdownRef}>
                        <button className="export-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
                            Export <i className="fa-solid fa-caret-down" style={{ marginLeft: "2px", fontSize: "1.1rem" }}></i>
                        </button>
                        {dropdownOpen && (
                            <div className="dropdown-menu">
                                <button onClick={exportToExcel}>Excel</button>
                                <button onClick={exportToPDF}>PDF</button>
                            </div>
                        )}
                    </div>
                )}

                <div style={{ display: viewMode === "results" ? "block" : "none" }}>
                    {responses.length === 0 ? (
                        <p>No responses available.</p>
                    ) : (
                        <div className="data-table-scroll-wrapper" style={{ marginTop: "20px" }}>
                            <table ref={tableRef} className="display">
                                <thead>
                                    <tr>
                                        {columns.map((col, index) => (
                                            <th key={index}>{col.title}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody></tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div style={{ display: viewMode === "summary" ? "block" : "none" }}>
                    {summaryData.length === 0 ? (
                        <p>No responses available.</p>
                    ) : (
                        <div className="summary-wrapper">
                            <div className="summary-section">
                                {summaryData.map((item, index) => (
                                    <div key={index} className="summary-group-card">
                                        <div className="summary-question">
                                            <div className="summary-icon">
                                                {fieldIcons[item.type] || <FaAlignLeft />}
                                            </div>
                                            <div className="summary-question-text">
                                                {item.label} <span className="summary-count">({index + 1})</span>
                                            </div>
                                            <div className="summary-answered">
                                                {item.count} of {item.total} answered
                                            </div>
                                        </div>
                                        <div className="summary-footer-text">
                                            No responses yet
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Responses;
