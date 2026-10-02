import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import "../Professor/ProfessorDashboard.css";

function HodProfessorApprovals() {
    const [pendingProfessors, setPendingProfessors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [hodId, setHodId] = useState(null);
    const [hodDept, setHodDept] = useState("");

    const fetchPendingRequests = () => {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) return;
        const user = JSON.parse(storedUser);
        const id = user.id || user.userId;
        setHodId(id);
        setHodDept(user.department || "");
        const token = user.token || localStorage.getItem("token");

        setLoading(true);
        fetch(`http://localhost:8080/api/hod/${id}/professors/pending`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch pending requests");
                return res.json();
            })
            .then(data => {
                setPendingProfessors(data || []);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchPendingRequests();
    }, []);

    const handleApprove = async (profId, profName) => {
        if (!window.confirm(`Approve registration for Professor '${profName}'?`)) return;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:8080/api/hod/${hodId}/professors/${profId}/approve`, {
                method: "POST",
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            if (!res.ok) throw new Error("Failed to approve professor.");

            alert(`Professor '${profName}' approved successfully! They can now log in.`);
            fetchPendingRequests();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleReject = async (profId, profName) => {
        if (!window.confirm(`Reject registration for Professor '${profName}'?`)) return;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:8080/api/hod/${hodId}/professors/${profId}/reject`, {
                method: "POST",
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            if (!res.ok) throw new Error("Failed to reject professor.");

            alert(`Professor '${profName}' registration request rejected.`);
            fetchPendingRequests();
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
                            <h1 className="dashboard-title">🔔 Faculty Approval Requests</h1>
                            <p className="dashboard-subtitle">
                                Department of {hodDept || "Engineering"} • Review self-registered faculty requests
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="error-card" style={{ marginBottom: "20px" }}>
                            <h2>Error</h2>
                            <p>{error}</p>
                        </div>
                    )}

                    <section className="dashboard-section" style={{ marginTop: "20px" }}>
                        <div className="section-header">
                            <h2>Pending Requests ({pendingProfessors.length})</h2>
                        </div>

                        {loading ? (
                            <div className="empty-state">Loading pending approval requests...</div>
                        ) : pendingProfessors.length === 0 ? (
                            <div className="empty-state">
                                <p>🎉 No pending professor registration requests right now for {hodDept}.</p>
                            </div>
                        ) : (
                            <div className="exam-table-container">
                                <table className="exam-table">
                                    <thead>
                                        <tr>
                                            <th>Applicant Name</th>
                                            <th>Email Address</th>
                                            <th>Department</th>
                                            <th>Requested Date</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingProfessors.map((prof) => (
                                            <tr key={prof.id}>
                                                <td className="font-semibold">{prof.name}</td>
                                                <td>{prof.email}</td>
                                                <td>
                                                    <span className="badge badge-batch" style={{ background: "#ea580c", color: "#fff" }}>
                                                        {prof.department}
                                                    </span>
                                                </td>
                                                <td>{prof.createdAt ? new Date(prof.createdAt).toLocaleDateString() : "N/A"}</td>
                                                <td>
                                                    <span className="status-tag status-draft" style={{ background: "#ffedd5", color: "#c2410c" }}>
                                                        PENDING APPROVAL
                                                    </span>
                                                </td>
                                                <td style={{ display: "flex", gap: "8px" }}>
                                                    <button
                                                        className="publish-action-btn"
                                                        style={{ background: "#16a34a" }}
                                                        onClick={() => handleApprove(prof.id, prof.name)}
                                                    >
                                                        Approve ✅
                                                    </button>
                                                    <button
                                                        className="publish-action-btn"
                                                        style={{ background: "#dc2626" }}
                                                        onClick={() => handleReject(prof.id, prof.name)}
                                                    >
                                                        Reject ❌
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

export default HodProfessorApprovals;
