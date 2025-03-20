import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import $ from "jquery";
import "datatables.net";
import "datatables.net-dt/css/dataTables.dataTables.min.css";
import "./Responses.css";

const Responses = () => {
    const { formId } = useParams();
    const [responses, setResponses] = useState([]);
    const [columns, setColumns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const tableRef = useRef(null);
    const dataTableRef = useRef(null);

    useEffect(() => {
        fetch(`http://localhost:5000/api/responses/get-responses/${formId}`, {
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
                                return answer ? answer.answer : "-";
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
                dataTableRef.current.destroy(); // Destroy previous instance
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

    if (loading) return <p>Loading responses...</p>;
    if (error) return <p>Error: {error}</p>;
    if (responses.length === 0) return <p>No responses available.</p>;

    return (
        <div className="responses-container">
            <h2>Responses for Form {formId}</h2>
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
