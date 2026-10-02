import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import "../Professor/ProfessorDashboard.css";

function HodBulkStudentImport() {
    const navigate = useNavigate();
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState("");
    const [previewData, setPreviewData] = useState(null);

    const getHodDetails = () => {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) return { id: null, token: null, dept: "" };
        const user = JSON.parse(storedUser);
        return {
            id: user.id || user.userId,
            token: user.token || localStorage.getItem("token"),
            dept: user.department || ""
        };
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewData(null);
            setError("");
        }
    };

    const handlePreviewUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            setError("Please select a CSV or XLSX file to import.");
            return;
        }

        const { id, token } = getHodDetails();
        if (!id) {
            setError("User session expired. Please log in again.");
            return;
        }

        const formData = new FormData();
        formData.append("file", selectedFile);

        setLoading(true);
        setError("");

        try {
            const res = await fetch(`http://localhost:8080/api/hod/${id}/students/import/preview`, {
                method: "POST",
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: formData
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || "Failed to process import file.");
            }

            const data = await res.json();
            setPreviewData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmImport = async () => {
        if (!previewData || !previewData.rows || previewData.rows.length === 0) return;

        const { id, token } = getHodDetails();
        if (!id) return;

        if (previewData.invalidCount > 0) {
            const confirmMsg = `There are ${previewData.invalidCount} invalid record(s) with errors. Only valid records will be imported. Proceed?`;
            if (!window.confirm(confirmMsg)) return;
        }

        setConfirming(true);
        try {
            const res = await fetch(`http://localhost:8080/api/hod/${id}/students/import/confirm`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify(previewData.rows)
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || "Failed to confirm student import.");
            }

            const importedStudents = await res.json();
            alert(`🎉 Successfully imported ${importedStudents.length} student(s)!`);
            navigate("/hod/students");
        } catch (err) {
            alert(`Import failed: ${err.message}`);
        } finally {
            setConfirming(false);
        }
    };

    const { dept } = getHodDetails();

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f1f5f9" }}>
            <Navbar />
            <div style={{ display: "flex", flex: 1 }}>
                <Sidebar role="HOD" />
                <main className="dashboard-content">
                    <div className="dashboard-header-flex">
                        <div>
                            <h1 className="dashboard-title">📥 Bulk Import Students</h1>
                            <p className="dashboard-subtitle">
                                Department of {dept || "Engineering"} • Upload XLSX or CSV Student Rosters
                            </p>
                        </div>
                        <button
                            className="create-exam-btn"
                            style={{ background: "#64748b" }}
                            onClick={() => navigate("/hod/students")}
                        >
                            ← Back to Students
                        </button>
                    </div>

                    {error && (
                        <div className="error-card" style={{ marginBottom: "20px" }}>
                            <h2>Error</h2>
                            <p>{error}</p>
                        </div>
                    )}

                    {/* FILE UPLOAD CARD */}
                    <div className="dashboard-card" style={{ marginBottom: "24px", padding: "24px" }}>
                        <h2 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "12px", color: "#1e293b" }}>
                            1. Select Roster File (.xlsx or .csv)
                        </h2>
                        <p style={{ fontSize: "0.9rem", color: "#64748b", marginBottom: "16px" }}>
                            Supported headers: <code>Name</code>, <code>Email</code>, <code>Enrollment Number</code> (or <code>EnrollmentNo</code>), <code>Batch</code>, <code>Semester</code>, <code>Password</code> (Optional).
                        </p>

                        <form onSubmit={handlePreviewUpload} style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                            <input
                                type="file"
                                accept=".csv, .xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv"
                                onChange={handleFileChange}
                                style={{
                                    padding: "10px",
                                    border: "1px dashed #cbd5e1",
                                    borderRadius: "8px",
                                    background: "#f8fafc",
                                    cursor: "pointer"
                                }}
                            />
                            <button
                                type="submit"
                                className="create-exam-btn"
                                disabled={loading || !selectedFile}
                                style={{ opacity: loading || !selectedFile ? 0.6 : 1 }}
                            >
                                {loading ? "Parsing File..." : "🔍 Preview & Validate Roster"}
                            </button>
                        </form>
                    </div>

                    {/* PREVIEW AND VALIDATION TABLE */}
                    {previewData && (
                        <section className="dashboard-section">
                            <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <h2>2. Import Preview & Validation Results</h2>
                                    <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                                        <span className="badge" style={{ background: "#475569", color: "#fff" }}>
                                            Total: {previewData.totalRows}
                                        </span>
                                        <span className="badge" style={{ background: "#16a34a", color: "#fff" }}>
                                            Valid: {previewData.validCount}
                                        </span>
                                        <span className="badge" style={{ background: "#dc2626", color: "#fff" }}>
                                            Invalid: {previewData.invalidCount}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    className="create-exam-btn"
                                    style={{ background: previewData.validCount > 0 ? "#16a34a" : "#94a3b8" }}
                                    disabled={previewData.validCount === 0 || confirming}
                                    onClick={handleConfirmImport}
                                >
                                    {confirming ? "Importing..." : `✅ Confirm Import (${previewData.validCount} Valid)`}
                                </button>
                            </div>

                            <div className="exam-table-container" style={{ marginTop: "16px" }}>
                                <table className="exam-table">
                                    <thead>
                                        <tr>
                                            <th>Row #</th>
                                            <th>Student Name</th>
                                            <th>Enrollment No.</th>
                                            <th>Email</th>
                                            <th>Batch</th>
                                            <th>Semester</th>
                                            <th>Temp Password</th>
                                            <th>Validation Status</th>
                                            <th>Errors / Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewData.rows.map((row) => (
                                            <tr
                                                key={row.rowNumber}
                                                style={{ background: row.valid ? "rgba(240, 253, 244, 0.5)" : "rgba(254, 242, 242, 0.5)" }}
                                            >
                                                <td>#{row.rowNumber}</td>
                                                <td className="font-semibold">{row.name || "—"}</td>
                                                <td>
                                                    <span style={{ fontFamily: "monospace", fontWeight: "600" }}>
                                                        {row.enrollmentNumber || "—"}
                                                    </span>
                                                </td>
                                                <td>{row.email || "—"}</td>
                                                <td>{row.batch || "—"}</td>
                                                <td>{row.semester ? `Sem ${row.semester}` : "—"}</td>
                                                <td>
                                                    <code style={{ background: "#e2e8f0", padding: "2px 6px", borderRadius: "4px" }}>
                                                        {row.password ? row.password : "password123 (Default)"}
                                                    </code>
                                                </td>
                                                <td>
                                                    {row.valid ? (
                                                        <span className="status-tag status-active" style={{ background: "#dcfce7", color: "#15803d" }}>
                                                            VALID
                                                        </span>
                                                    ) : (
                                                        <span className="status-tag status-rejected" style={{ background: "#fee2e2", color: "#b91c1c" }}>
                                                            INVALID
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    {row.errors && row.errors.length > 0 ? (
                                                        <ul style={{ margin: 0, paddingLeft: "16px", color: "#dc2626", fontSize: "0.85rem" }}>
                                                            {row.errors.map((errText, idx) => (
                                                                <li key={idx}>{errText}</li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <span style={{ color: "#16a34a", fontSize: "0.85rem" }}>Ready for import</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}
                </main>
            </div>
        </div>
    );
}

export default HodBulkStudentImport;
