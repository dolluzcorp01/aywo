import React, { useEffect, useRef, useState } from "react";
import { apiFetch } from "./utils/api";
import { useParams } from "react-router-dom";
import $ from "jquery";
import "datatables.net";
import "datatables.net-dt/css/dataTables.dataTables.min.css";
import * as XLSX from "sheetjs-style";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
    FaEnvelope, FaHashtag, FaList, FaCheckSquare, FaCaretDown,
    FaCalendarAlt, FaAlignLeft, FaFileAlt, FaToggleOn, FaImage, FaBoxes, FaGripHorizontal,
    FaHeading, FaChevronUp, FaChevronDown, FaClock, FaRegClock, FaCalendarCheck, FaSortNumericDown, FaStar,
    FaSlidersH, FaSmile, FaEquals, FaBars, FaMapMarkerAlt, FaVideo, FaFilePdf, FaMinus, FaYoutube
} from "react-icons/fa";
import ExcelJS from 'exceljs';
import LOGO from "./assets/img/LOGO.jpg";
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

    // Show/hide clear icon when date changes
    const toggleClearIcon = () => {
        if ($('#minDate').val() || $('#maxDate').val()) {
            $('#clearDateFilter').show();
        } else {
            $('#clearDateFilter').hide();
        }
    };

    useEffect(() => {
        if (responses.length > 0 && columns.length > 0 && tableRef.current) {
            if (dataTableRef.current) {
                dataTableRef.current.destroy();
                dataTableRef.current = null;
            }

            $.fn.dataTable.ext.search = [];

            dataTableRef.current = $(tableRef.current).DataTable({
                data: responses,
                columns: columns,
                destroy: true,
                responsive: true,
                searching: true,
                paging: true,
                ordering: true,
                info: true,
                dom: '<"top-bar-wrapper"lf<"date-filter-wrapper"><"column-toggle-wrapper"><"custom-filter-wrapper">>rt<"bottom"ip><"clear">'
            });

            $('.column-toggle-wrapper').html(`
            <button id="toggleColumnDropdown" style="
                background:none;
                border:1px solid #ccc;
                border-radius:4px;
                cursor:pointer;
                padding:6px 12px;
                font-size:14px;
                display:flex;
                align-items:center;
                gap:4px;
            ">
                <i class="fa-solid fa-eye-slash" style="color: #2D3748;"></i> Hide Columns
            </button>
            `);

            const generateDropdownHTML = () => {
                return `
                <div id="columnToggleList">
                    ${columns.map((col, i) => `
                        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
                            <label class="switch">
                                <input type="checkbox" class="toggle-col" data-column-index="${i}" checked />
                                <span class="slider"></span>
                            </label>
                            <span style="font-size:14px; flex:1;">${col.title}</span>
                        </div>
                    `).join('')}
                </div>
                <div style="text-align:right; margin-top:10px;">
                    <button id="toggleAllColumns"
                        style="
                            background:#f9f9f9;
                            border:1px solid #ccc;
                            padding:6px 12px;
                            border-radius:4px;
                            font-size:13px;
                            cursor:pointer;
                            color: gray;
                            border: 2px solid #3B82F6;
                        ">Hide all</button>
                </div>
            `;
            };

            let allVisible = true;

            $(document).on('click', '#toggleAllColumns', function () {
                allVisible = !allVisible;
                $('.toggle-col').each(function () {
                    this.checked = allVisible;
                    const column = dataTableRef.current.column($(this).data('column-index'));
                    column.visible(this.checked);
                });
                $(this).text(allVisible ? 'Hide all' : 'Show all');
            });

            $(document).on('click', '#toggleColumnDropdown', function (e) {
                const $menu = $('#globalColumnDropdownMenu');
                const rect = e.currentTarget.getBoundingClientRect();

                if ($menu.is(':visible')) {
                    $menu.hide();
                    return;
                }

                $menu.html(generateDropdownHTML());
                $menu.css({
                    display: 'block',
                    top: rect.bottom + window.scrollY + 'px',
                    left: rect.left + window.scrollX + 'px'
                });

                // Bind events after rendering
                $('.toggle-col').on('change', function () {
                    const column = dataTableRef.current.column($(this).data('column-index'));
                    column.visible(this.checked);
                });

                $('#toggleAllColumns').on('click', function () {
                    allVisible = !allVisible;
                    $('.toggle-col').each(function () {
                        this.checked = allVisible;
                        const column = dataTableRef.current.column($(this).data('column-index'));
                        column.visible(this.checked);
                    });
                    $(this).text(allVisible ? 'Hide all' : 'Show all');
                });
            });

            $(document).on('click', function (e) {
                if (!$(e.target).closest('#globalColumnDropdownMenu, #toggleColumnDropdown').length) {
                    $('#globalColumnDropdownMenu').hide();
                }
            });

            $('.custom-filter-wrapper').html(`
                <div style="position:relative; display:inline-block; margin-left:1px;">
                    <button id="toggleCustomFilter" style="
                        background:none;
                        border:1px solid #ccc;
                        border-radius:4px;
                        cursor:pointer;
                        padding:6px 12px;
                        font-size: 14px;
                        display:flex;
                        align-items:center;
                        gap:4px;
                    ">
                    <i class="fa-solid fa-filter" style="color: #2D3748;"></i> Filter
                    </button>

                    <div id="customFilterPanel" style="
                        display:none;
                        position:absolute;
                        top:110%;
                        left:0;
                        background:#fff;
                        border:1px solid #ddd;
                        border-radius: 6px;
                        padding: 12px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                        z-index:999;
                        width:420px;
                    ">
                       <div style="display: grid; grid-template-columns: 1fr 1fr 2fr auto; gap: 8px; align-items: center;">
                            <select id="filterField" style="padding: 6px 8px; width: 100%;">
                                ${columns.map(col => `<option value="${col.title}">${col.title}</option>`).join('')}
                            </select>
                            <select id="filterOperator" style="padding: 6px 8px; width: 100%;">
                                <option value="equals">equals</option>
                                <option value="contains">contains</option>
                            </select>
                            <input type="text" id="filterValue" style="padding: 6px 8px; width: 100%;" placeholder="Value" />
                            <button id="applyCustomFilter" style="
                                background: #000;
                                color: #fff;
                                padding: 6px 12px;
                                border: none;
                                border-radius: 4px;
                                cursor: pointer;
                                white-space: nowrap;
                            ">Apply</button>
                        </div>
                    </div>
                </div>
            `);

            $(document).on('click', '#toggleCustomFilter', function () {
                $('#customFilterPanel').toggle();
            });

            $('.date-filter-wrapper').html(`
            <div style="position:relative; display:inline-block;">
                <button id="toggleDateFilter" style="
                background:none;
                border:1px solid #ccc;
                border-radius:4px;
                cursor:pointer;
                padding:6px 12px;
                font-size: 14px;
                display:flex;
                align-items:center;
                gap:4px;
                ">
                <i class="fa-solid fa-calendar-days" style="color: #2D3748;"></i> Date Range
                </button>
                <div id="dateRangeInputs" style="
                display:none;
                position:absolute;
                left:0;
                top:110%;
                background:#fff;
                border:1px solid #ddd;
                border-radius: 6px;
                padding:12px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index:999;
                min-width: 280px;
                ">
                <div style="display:flex; align-items:center; margin-bottom:12px; gap:10px;">
                    <div style="display:flex; gap:8px; flex:1;">
                        <input type="date" id="minDate" placeholder="From" style="flex:1; padding:6px 10px; border:1px solid #ccc; border-radius:4px;" />
                        <span style="color:#555;">→</span>
                        <input type="date" id="maxDate" placeholder="To" style="flex:1; padding:6px 10px; border:1px solid #ccc; border-radius:4px;" />
                    </div>
                    <!-- CLOSE ICON RIGHT AFTER INPUTS -->
                    <i id="clearDateFilter" class="fa-solid fa-xmark" style="
                        display:none;
                        padding:6px;
                        border-radius:50%;
                        background:#eee;
                        color:#555;
                        font-size:13px;
                        cursor:pointer;
                        border:1px solid #ccc;
                        transition: background 0.2s;
                    " title="Clear date range"></i>
                    </div>

                <div style="display:flex; gap:6px; flex-wrap:wrap;">
                    <button type="button" class="quick-date" data-days="0" style="font-size:12px; padding:4px 8px;">Today</button>
                    <button type="button" class="quick-date" data-days="7" style="font-size:12px; padding:4px 8px;">Last 7 days</button>
                    <button type="button" class="quick-date" data-days="28" style="font-size:12px; padding:4px 8px;">Last 4 weeks</button>
                    <button type="button" class="quick-date" data-days="365" style="font-size:12px; padding:4px 8px;">Last 12 months</button>
                </div>
                </div>
            </div>
            `);

            $(document).on('click', '#toggleDateFilter', function () {
                $('#dateRangeInputs').toggle();
            });

            let customFilterActive = false;
            let customFilterParams = {};

            $.fn.dataTable.ext.search.push(function (settings, data, dataIndex) {
                if (!customFilterActive) return true;

                const field = customFilterParams.field;
                const operator = customFilterParams.operator;
                const value = customFilterParams.value.toLowerCase();

                const colIndex = columns.findIndex(col => col.title === field);
                if (colIndex === -1) return true;

                const cellValue = (data[colIndex] || '').toString().toLowerCase();

                if (operator === 'equals') {
                    return cellValue === value;
                } else if (operator === 'contains') {
                    return cellValue.includes(value);
                }
                return true;
            });

            // Always unbind before binding to avoid duplicate handlers
            $(document).off('click', '#applyCustomFilter').on('click', '#applyCustomFilter', function () {
                const field = $('#filterField').val();
                const operator = $('#filterOperator').val();
                const value = $('#filterValue').val().trim();

                if (!value) {
                    customFilterActive = false;
                    customFilterParams = {};
                } else {
                    customFilterActive = true;
                    customFilterParams = { field, operator, value };
                }

                dataTableRef.current.draw();
            });

            $(document).on('click', '#clearDateFilter', function () {
                $('#minDate').val('');
                $('#maxDate').val('');
                dataTableRef.current.draw();
                toggleClearIcon();
            });

            $(document).on('click', '.quick-date', function () {
                const days = parseInt($(this).data('days'), 10);
                const today = new Date();
                const minDate = new Date();
                minDate.setDate(today.getDate() - days);

                // Format to yyyy-mm-dd for input[type="date"]
                const formatDate = (date) => date.toISOString().split('T')[0];

                $('#minDate').val(formatDate(minDate));
                $('#maxDate').val(formatDate(today));

                dataTableRef.current.draw();
                toggleClearIcon();
            });

            $.fn.dataTable.ext.search.push(function (settings, data, dataIndex) {
                const minDate = $('#minDate').val();
                const maxDate = $('#maxDate').val();
                const submittedAt = data[1];
                if (submittedAt) {
                    const date = new Date(submittedAt);
                    if (
                        (minDate === '' || new Date(minDate) <= date) &&
                        (maxDate === '' || date <= new Date(maxDate))
                    ) {
                        return true;
                    }
                    return false;
                }
                return true;
            });

            $('#minDate, #maxDate').on('change', function () {
                dataTableRef.current.draw();
                toggleClearIcon();
            });
        }

        return () => {
            if (dataTableRef.current) {
                dataTableRef.current.destroy();
                dataTableRef.current = null;
            }
            $.fn.dataTable.ext.search = [];
            $(document).off('click', '#toggleColumnDropdown');
            $(document).off('click', '#toggleAllColumns');
            $(document).off('click', '.toggle-col');
        };
    }, [responses, columns]);

    useEffect(() => {
        const handleOutsideClick = (e) => {
            const $datePopup = $('#dateRangeInputs');
            const $dateButton = $('#toggleDateFilter');
            const $columnPopup = $('#globalColumnDropdownMenu');
            const $columnButton = $('#toggleColumnDropdown');
            const $customFilter = $('#customFilterPanel');
            const $customFilterButton = $('#toggleCustomFilter');

            // Close date popup
            if (!$datePopup.is(e.target) && $datePopup.has(e.target).length === 0 &&
                !$dateButton.is(e.target) && $dateButton.has(e.target).length === 0) {
                $datePopup.hide();
            }

            // Close column popup
            if (!$columnPopup.is(e.target) && $columnPopup.has(e.target).length === 0 &&
                !$columnButton.is(e.target) && $columnButton.has(e.target).length === 0) {
                $columnPopup.hide();
            }

            // Close custom filter panel
            if (!$customFilter.is(e.target) && $customFilter.has(e.target).length === 0 &&
                !$customFilterButton.is(e.target) && $customFilterButton.has(e.target).length === 0) {
                $customFilter.hide();
            }

            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, []);

    // ✅ Export Data to Excel using SheetJS
    const exportToExcel = async () => {
        const cleanFormId = formId.replace("form-", "");
        const formTitle = responses[0]?.formTitle || "Untitled";

        const dynamicLabels = Array.from(new Set(
            responses.flatMap((res) => res.answers.map((a) => a.label))
        ));

        const headers = ["Response ID", "Submitted At", ...dynamicLabels];

        const dataRows = responses.map((res) => {
            const row = [
                res.response_id,
                new Date(res.submitted_at).toLocaleString(),
                ...dynamicLabels.map(label => {
                    const match = res.answers.find(ans => ans.label === label);
                    return match ? match.answer : "";
                })
            ];
            return row;
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Responses");

        // ✅ Add Image
        const imageResponse = await fetch(LOGO);
        const imageBlob = await imageResponse.blob();
        const imageBuffer = await imageBlob.arrayBuffer();

        const imageId = workbook.addImage({
            buffer: imageBuffer,
            extension: 'png',
        });

        worksheet.addImage(imageId, {
            tl: { col: 0, row: 0 },
            ext: { width: 150, height: 60 },
        });

        let rowOffset = 4;

        worksheet.getCell(`A${rowOffset}`).value = `Responses for "${formTitle}"`;
        worksheet.getCell(`A${rowOffset + 1}`).value = `Generated by Aywo | Form ID: ${cleanFormId}`;

        const headerRow = worksheet.addRow(headers);
        headerRow.eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '8DB4E2' }
            };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = {
                top: { style: 'thin' },
                bottom: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        dataRows.forEach(row => {
            const dataRow = worksheet.addRow(row);
            dataRow.eachCell(cell => {
                cell.alignment = { vertical: 'top', wrapText: true };
                cell.border = {
                    top: { style: 'thin' },
                    bottom: { style: 'thin' },
                    left: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        });

        worksheet.columns.forEach(column => {
            let maxLength = 10;
            column.eachCell({ includeEmpty: true }, cell => {
                const length = cell.value ? cell.value.toString().length : 10;
                maxLength = Math.max(maxLength, length + 2);
            });
            column.width = Math.min(maxLength, 50);
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Responses_${formId}.xlsx`;
        link.click();
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
        const cleanFormId = formId.replace("form-", "");

        const doc = new jsPDF({ orientation: "landscape" });
        const pageWidth = doc.internal.pageSize.getWidth();

        const dynamicColumns = columns.slice(2);
        const chunkSize = 8;
        const dynamicChunks = [];
        for (let i = 0; i < dynamicColumns.length; i += chunkSize) {
            dynamicChunks.push(dynamicColumns.slice(i, i + chunkSize));
        }

        dynamicChunks.forEach((chunk, index) => {
            if (index > 0) doc.addPage();

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
                startY: 50, // Leave space for logo and title
                margin: { top: 50 },
                theme: "grid",
                styles: {
                    cellWidth: 'wrap',
                    overflow: 'linebreak',
                    fontSize: 7,
                },
                headStyles: {
                    halign: 'center',
                },
                didDrawPage: function (data) {
                    // ✅ Add logo
                    if (index === 0) {
                        const imgWidth = 40;
                        const imgHeight = 20;
                        const imgX = (pageWidth - imgWidth) / 2;
                        doc.addImage(LOGO, 'PNG', imgX, 5, imgWidth, imgHeight);

                        // ✅ Add centered heading
                        doc.setFontSize(13);
                        doc.setTextColor(40);
                        doc.text(`Responses for "${responses[0].formTitle}"`, pageWidth / 2, 30, { align: 'center' });

                        // ✅ Add subtext
                        doc.setFontSize(9);
                        doc.setTextColor(100);
                        doc.text(`Generated by Aywo | Form ID: ${cleanFormId}`, pageWidth / 2, 38, { align: 'center' });
                    }
                }
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
                        <>
                            <div className="data-table-scroll-wrapper" style={{ marginTop: "20px" }}>
                                <table ref={tableRef} className="display">
                                    <thead>
                                        <tr>
                                            {columns.map((col, index) => (
                                                <th key={index} style={{ whiteSpace: "nowrap" }}>{col.title}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody></tbody>
                                </table>
                            </div>
                            <div id="globalColumnDropdownMenu"
                                style={{
                                    display: 'none',
                                    position: 'absolute',
                                    zIndex: 9999,
                                    background: '#fff',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px',
                                    padding: '12px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    minWidth: '260px',
                                    maxHeight: '400px',
                                    overflowY: 'auto'
                                }}
                            ></div>
                        </>
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
