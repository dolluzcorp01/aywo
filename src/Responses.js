import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import $ from "jquery";
import "datatables.net";
import "datatables.net-dt/css/dataTables.dataTables.min.css";
import * as XLSX from "xlsx"; // Import SheetJS for Excel export
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // Import the autoTable plugin
import "./Responses.css";

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

    useEffect(() => {
        fetch(`/api/responses/get-responses/${formId}`, {
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
                                    // ✅ Make file name clickable
                                    return `<a href="/${answer.filePath.replace(/^\/?uploads\//, 'uploads/')}" target="_blank">${answer.answer}</a>`;
                                }

                                return answer.answer;
                            },
                        })),
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
            });
        }
    }, [responses, columns]);

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

    // ✅ Export Data to PDF using jsPDF & autoTable
    const exportToPDF = () => {
        if (responses.length === 0) {
            alert("No data available to export.");
            return;
        }

        const doc = new jsPDF();
        doc.text("Responses for Form " + formId, 14, 10);

        // ✅ Use autoTable as a function, passing the doc instance
        autoTable(doc, {
            head: [
                [
                    "Response ID",
                    "Submitted At",
                    ...columns.slice(2).map((col) => col.title),
                ],
            ],
            body: responses.map((response) => [
                response.response_id,
                new Date(response.submitted_at).toLocaleString(),
                ...response.answers.map((a) => a.answer),
            ]),
            startY: 20,
            theme: "grid",
        });

        doc.save(`Responses_${formId}.pdf`);
    };

    if (loading) return <p>Loading responses...</p>;
    if (error) return <p>Error: {error}</p>;
    if (responses.length === 0) return <p>No responses available.</p>;

    return (
        <div className="responses-container">
            <h2>Responses for Form {formId}</h2>
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

            <table ref={tableRef} className="display" style={{ width: "100%" }}>
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
    );
};

export default Responses;
