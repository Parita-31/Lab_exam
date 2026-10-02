import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import "../Professor/ProfessorDashboard.css";

function HodDepartmentProfessors() {
    const [professors, setProfessors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [hodId, setHodId] = useState(null);
    const [hodDept, setHodDept] = useState("");

    const fetchDepartmentProfessors = () => {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) return;
        const user = JSON.parse(storedUser);
        const id = user.id || user.userId;
        setHodId(id);
        setHodDept(user.department || "");
        const token = user.token || localStorage.getItem("token");

        setLoading(true);
        fetch(`http://localhost:8080/api/hod/${id}/professors`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch department professors");
                return res.json();
            })
            .then(data => {
                setProfessors(data || []);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchDepartmentProfessors();
    }, []);

    const handleDeleteProfessor = async (profId, profName) => {
        if (!window.confirm(`Are you sure you want to remove professor '${profName}' from the ${hodDept} department?`)) return;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:8080/api/hod/${hodId}/professors/${profId}`, {
                method: "DELETE",
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            if (!res.ok) throw new Error("Failed to delete professor.");

            alert(`Professor '${profName}' removed successfully!`);
            fetchDepartmentProfessors();
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f1f5f9" }}>
            <Navbar />
            <div style={{ display: "flex", flex: 1 }}>
                <Sidebar role="HOD" />
                <main className="dashboard-content">
                    <div className="dashboard-header-flex">
                        <div>
                            <h1 className="dashboard-title">👨‍🏫 Department Faculty Members</h1>
                            <p className="dashboard-subtitle">
                                Department of {hodDept || "Engineering"} • Active & Approved Professors
                            </p>
                        </div>
                        {/* Notice: STRICT RULE - HOD MUST NOT have a "Create Professor" function */}
                    </div>

                    {error && (
                        <div className="error-card" style={{ marginBottom: "20px" }}>
                            <h2>Error</h2>
                            <p>{error}</p>
                        </div>
                    )}

                    <section className="dashboard-section" style={{ marginTop: "20px" }}>
                        <div className="section-header">
                            <h2>Department Faculty Directory ({professors.length})</h2>
                        </div>

                        {loading ? (
                            <div className="empty-state">Loading department professors...</div>
                        ) : professors.length === 0 ? (
                            <div className="empty-state">
                                <p>No active professors found for the {hodDept} department.</p>
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
                                        {professors.map((prof) => (
                                            <tr key={prof.id}>
                                                <td className="font-semibold">{prof.name}</td>
                                                <td>{prof.email}</td>
                                                <td>
                                                    <span className="badge badge-batch" style={{ background: "#0f766e", color: "#fff" }}>
                                                        {prof.department}
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

export default HodDepartmentProfessors;
