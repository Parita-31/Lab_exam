import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import "../Professor/ProfessorDashboard.css";

function AdminDashboard() {
    const navigate = useNavigate();
    const [hodCount, setHodCount] = useState(0);
    const [profCount, setProfCount] = useState(0);
    const [studentCount, setStudentCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");

        Promise.all([
            fetch("http://localhost:8080/api/admin/hods", { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
            fetch("http://localhost:8080/api/admin/professors", { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
            fetch("http://localhost:8080/api/admin/students", { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        ])
            .then(async ([hodRes, profRes, studRes]) => {
                if (!hodRes.ok || !profRes.ok || !studRes.ok) {
                    throw new Error("Failed to load admin metrics");
                }
                const hods = await hodRes.json();
                const profs = await profRes.json();
                const studs = await studRes.json();

                setHodCount(hods.length);
                setProfCount(profs.length);
                setStudentCount(studs.length);
            })
            .catch((err) => {
                setError(err.message);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f1f5f9" }}>
            <Navbar />
            <div style={{ display: "flex", flex: 1 }}>
                <Sidebar role="ADMIN" />
                <main className="dashboard-content">
                    <div className="dashboard-header-flex">
                        <div>
                            <h1 className="dashboard-title">System Administration</h1>
                            <p className="dashboard-subtitle">
                                Dharmsinh Desai University • Master Portal Management
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="error-card" style={{ marginBottom: "20px" }}>
                            <h2>Dashboard Error</h2>
                            <p>{error}</p>
                        </div>
                    )}

                    {loading ? (
                        <div className="loading-spinner">Loading Admin Portal Data...</div>
                    ) : (
                        <>
                            {/* METRIC CARDS */}
                            <div className="dashboard-cards">
                                <div
                                    className="dashboard-card primary"
                                    onClick={() => navigate("/admin/hods")}
                                    style={{ cursor: "pointer" }}
                                >
                                    <h3>Total Assigned HODs</h3>
                                    <p>{hodCount}</p>
                                </div>

                                <div
                                    className="dashboard-card success"
                                    onClick={() => navigate("/admin/professors")}
                                    style={{ cursor: "pointer" }}
                                >
                                    <h3>Total System Professors</h3>
                                    <p>{profCount}</p>
                                </div>

                                <div
                                    className="dashboard-card info"
                                    onClick={() => navigate("/admin/students")}
                                    style={{ cursor: "pointer" }}
                                >
                                    <h3>Total System Students</h3>
                                    <p>{studentCount}</p>
                                </div>
                            </div>

                            {/* QUICK ACTIONS SECTION */}
                            <section className="dashboard-section" style={{ marginTop: "24px" }}>
                                <div className="section-header">
                                    <h2>🛠 Administrative Quick Management</h2>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginTop: "16px" }}>
                                    <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", borderLeft: "4px solid #0f766e" }}>
                                        <h3 style={{ fontSize: "18px", color: "#1e293b", marginBottom: "8px" }}>👨‍💼 HOD Management</h3>
                                        <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "16px" }}>
                                            Assign Heads of Department (max 1 per department), update details, or remove HODs.
                                        </p>
                                        <button className="create-exam-btn" onClick={() => navigate("/admin/hods")}>
                                            Manage HODs →
                                        </button>
                                    </div>

                                    <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", borderLeft: "4px solid #2563eb" }}>
                                        <h3 style={{ fontSize: "18px", color: "#1e293b", marginBottom: "8px" }}>👨‍🏫 View Professors</h3>
                                        <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "16px" }}>
                                            Inspect all registered faculty across university departments or remove accounts.
                                        </p>
                                        <button className="create-exam-btn" style={{ background: "#2563eb" }} onClick={() => navigate("/admin/professors")}>
                                            View Professors →
                                        </button>
                                    </div>

                                    <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", borderLeft: "4px solid #0284c7" }}>
                                        <h3 style={{ fontSize: "18px", color: "#1e293b", marginBottom: "8px" }}>🎓 View Students</h3>
                                        <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "16px" }}>
                                            Inspect all enrolled students across university departments or remove student records.
                                        </p>
                                        <button className="create-exam-btn" style={{ background: "#0284c7" }} onClick={() => navigate("/admin/students")}>
                                            View Students →
                                        </button>
                                    </div>
                                </div>
                            </section>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}

export default AdminDashboard;
