import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import "../Professor/ProfessorDashboard.css";

function AdminProfessorView() {
    const [professors, setProfessors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filterDepartment, setFilterDepartment] = useState("ALL");

    const fetchProfessors = () => {
        const token = localStorage.getItem("token");
        setLoading(true);
        fetch("http://localhost:8080/api/admin/professors", {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch professor list");
                return res.json();
            })
            .then((data) => {
                setProfessors(data || []);
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchProfessors();
    }, []);

    const handleDeleteProfessor = async (profId, profName) => {
        if (!window.confirm(`Are you sure you want to delete professor account '${profName}'?`)) return;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:8080/api/admin/professors/${profId}`, {
                method: "DELETE",
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            if (!res.ok) throw new Error("Failed to delete professor account.");

            alert("Professor deleted successfully!");
            fetchProfessors();
        } catch (err) {
            alert(err.message);
        }
    };

    const departments = ["ALL", ...new Set(professors.map((p) => p.department).filter(Boolean))];

    const filteredProfessors = filterDepartment === "ALL"
        ? professors
        : professors.filter((p) => p.department === filterDepartment);

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f1f5f9" }}>
            <Navbar />
            <div style={{ display: "flex", flex: 1 }}>
                <Sidebar role="ADMIN" />
                <main className="dashboard-content">
                    <div className="dashboard-header-flex">
                        <div>
                            <h1 className="dashboard-title">👨‍🏫 Faculty & Professor Directory</h1>
                            <p className="dashboard-subtitle">
                                Overview of all faculty members across university departments
                            </p>
                        </div>
                        {/* Notice: STRICT RULE - NO Add, Edit, or Approve buttons for Admin */}
                    </div>

                    {error && (
                        <div className="error-card" style={{ marginBottom: "20px" }}>
                            <h2>Error</h2>
                            <p>{error}</p>
                        </div>
                    )}

                    <section className="dashboard-section" style={{ marginTop: "20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <div className="section-header" style={{ marginBottom: 0 }}>
                                <h2>Registered Professors ({filteredProfessors.length})</h2>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <label style={{ fontSize: "14px", fontWeight: 600, color: "#475569" }}>Department:</label>
                                <select
                                    value={filterDepartment}
                                    onChange={(e) => setFilterDepartment(e.target.value)}
                                    style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", background: "#fff" }}
                                >
                                    {departments.map((dept) => (
                                        <option key={dept} value={dept}>
                                            {dept}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {loading ? (
                            <div className="empty-state">Loading Professors Directory...</div>
                        ) : filteredProfessors.length === 0 ? (
                            <div className="empty-state">
                                <p>No professors found for the selected department filter.</p>
                            </div>
                        ) : (
                            <div className="exam-table-container">
                                <table className="exam-table">
                                    <thead>
                                        <tr>
                                            <th>Professor Name</th>
                                            <th>Email</th>
                                            <th>Department</th>
                                            <th>Designation</th>
                                            <th>Status</th>
                                            <th>Registered Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProfessors.map((prof) => (
                                            <tr key={prof.id}>
                                                <td className="font-semibold">{prof.name}</td>
                                                <td>{prof.email}</td>
                                                <td>
                                                    <span className="badge badge-batch" style={{ background: "#2563eb", color: "#fff" }}>
                                                        {prof.department || "N/A"}
                                                    </span>
                                                </td>
                                                <td>{prof.designation || "Associate Professor"}</td>
                                                <td>
                                                    <span className={`status-tag status-${(prof.status || "active").toLowerCase()}`}>
                                                        {prof.status || "ACTIVE"}
                                                    </span>
                                                </td>
                                                <td>{prof.createdAt ? new Date(prof.createdAt).toLocaleDateString() : "N/A"}</td>
                                                <td>
                                                    <button
                                                        className="publish-action-btn"
                                                        style={{ background: "#dc2626" }}
                                                        onClick={() => handleDeleteProfessor(prof.id, prof.name)}
                                                    >
                                                        Delete 🗑️
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </main>
            </div>
        </div>
    );
}

export default AdminProfessorView;
