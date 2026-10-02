import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import "../Professor/ProfessorDashboard.css";

const ALL_DEPARTMENTS = [
    "Computer Engineering",
    "Information Technology",
    "Electronics & Communication",
    "Mechanical Engineering",
    "Chemical Engineering",
    "Civil Engineering"
];

function AdminHodManagement() {
    const [hods, setHods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [formError, setFormError] = useState("");

    // Modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingHod, setEditingHod] = useState(null);

    // Form fields
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [department, setDepartment] = useState(ALL_DEPARTMENTS[0]);

    const fetchHods = () => {
        const token = localStorage.getItem("token");
        setLoading(true);
        fetch("http://localhost:8080/api/admin/hods", {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch HOD list");
                return res.json();
            })
            .then(data => {
                setHods(data || []);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchHods();
    }, []);

    const openAddModal = () => {
        setName("");
        setEmail("");
        setPassword("");
        setDepartment(ALL_DEPARTMENTS[0]);
        setFormError("");
        setShowAddModal(true);
    };

    const openEditModal = (hod) => {
        setEditingHod(hod);
        setName(hod.name);
        setEmail(hod.email);
        setPassword("");
        setDepartment(hod.department || ALL_DEPARTMENTS[0]);
        setFormError("");
    };

    const closeModal = () => {
        setShowAddModal(false);
        setEditingHod(null);
        setFormError("");
    };

    const handleCreateHod = async (e) => {
        e.preventDefault();
        setFormError("");

        // Check if department already has an assigned HOD in current list
        const assignedHod = hods.find(h => h.department && h.department.trim().toLowerCase() === department.trim().toLowerCase());
        if (assignedHod) {
            setFormError(`Department '${department}' already has an assigned HOD (${assignedHod.name}). Only 1 HOD per department is permitted.`);
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:8080/api/admin/hods", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ name, email, password, department })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || "Failed to create HOD.");
            }

            alert("HOD created successfully!");
            closeModal();
            fetchHods();
        } catch (err) {
            setFormError(err.message);
        }
    };

    const handleUpdateHod = async (e) => {
        e.preventDefault();
        setFormError("");

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:8080/api/admin/hods/${editingHod.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ name, email, password: password || undefined, department })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || "Failed to update HOD.");
            }

            alert("HOD updated successfully!");
            closeModal();
            fetchHods();
        } catch (err) {
            setFormError(err.message);
        }
    };

    const handleDeleteHod = async (hodId, hodName) => {
        if (!window.confirm(`Are you sure you want to delete HOD '${hodName}'?`)) return;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:8080/api/admin/hods/${hodId}`, {
                method: "DELETE",
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            if (!res.ok) throw new Error("Failed to delete HOD.");

            alert("HOD deleted successfully!");
            fetchHods();
        } catch (err) {
            alert(err.message);
        }
    };

    // Get list of assigned departments
    const assignedDepartments = hods.map(h => h.department ? h.department.trim().toLowerCase() : "");

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f1f5f9" }}>
            <Navbar />
            <div style={{ display: "flex", flex: 1 }}>
                <Sidebar role="ADMIN" />
                <main className="dashboard-content">
                    <div className="dashboard-header-flex">
                        <div>
                            <h1 className="dashboard-title">👨‍💼 Head of Department (HOD) Management</h1>
                            <p className="dashboard-subtitle">
                                Assign department heads (Maximum 1 HOD per department)
                            </p>
                        </div>
                        <button className="create-exam-btn" onClick={openAddModal}>
                            + Add New HOD
                        </button>
                    </div>

                    {error && (
                        <div className="error-card" style={{ marginBottom: "20px" }}>
                            <h2>Error Loading HODs</h2>
                            <p>{error}</p>
                        </div>
                    )}

                    <section className="dashboard-section" style={{ marginTop: "20px" }}>
                        {loading ? (
                            <div className="empty-state">Loading HOD Records...</div>
                        ) : hods.length === 0 ? (
                            <div className="empty-state">
                                <p>No Heads of Department (HODs) assigned yet. Click '+ Add New HOD' to assign one.</p>
                            </div>
                        ) : (
                            <div className="exam-table-container">
                                <table className="exam-table">
                                    <thead>
                                        <tr>
                                            <th>HOD Name</th>
                                            <th>Email</th>
                                            <th>Department</th>
                                            <th>Status</th>
                                            <th>Assigned Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {hods.map((hod) => (
                                            <tr key={hod.id}>
                                                <td className="font-semibold">{hod.name}</td>
                                                <td>{hod.email}</td>
                                                <td>
                                                    <span className="badge badge-batch" style={{ background: "#0f766e", color: "#fff" }}>
                                                        {hod.department}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`status-tag status-${(hod.status || "active").toLowerCase()}`}>
                                                        {hod.status || "ACTIVE"}
                                                    </span>
                                                </td>
                                                <td>{hod.createdAt ? new Date(hod.createdAt).toLocaleDateString() : "N/A"}</td>
                                                <td style={{ display: "flex", gap: "8px" }}>
                                                    <button
                                                        className="publish-action-btn"
                                                        style={{ background: "#2563eb" }}
                                                        onClick={() => openEditModal(hod)}
                                                    >
                                                        Edit ✏️
                                                    </button>
                                                    <button
                                                        className="publish-action-btn"
                                                        style={{ background: "#dc2626" }}
                                                        onClick={() => handleDeleteHod(hod.id, hod.name)}
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

                    {/* ADD / EDIT HOD MODAL */}
                    {(showAddModal || editingHod) && (
                        <div className="modal-overlay" style={{
                            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                            background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
                        }}>
                            <div style={{
                                background: "#fff", width: "90%", maxWidth: "500px", borderRadius: "12px",
                                padding: "24px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)"
                            }}>
                                <h2 style={{ fontSize: "20px", marginBottom: "16px", color: "#0f766e" }}>
                                    {editingHod ? `Edit HOD: ${editingHod.name}` : "Assign New Head of Department (HOD)"}
                                </h2>

                                {formError && (
                                    <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#991b1b", padding: "12px", borderRadius: "8px", marginBottom: "16px", fontSize: "14px" }}>
                                        {formError}
                                    </div>
                                )}

                                <form onSubmit={editingHod ? handleUpdateHod : handleCreateHod}>
                                    <div style={{ marginBottom: "16px" }}>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>Department</label>
                                        <select
                                            value={department}
                                            onChange={(e) => setDepartment(e.target.value)}
                                            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                                            required
                                        >
                                            {ALL_DEPARTMENTS.map((dept) => {
                                                const isAssigned = !editingHod && assignedDepartments.includes(dept.toLowerCase());
                                                return (
                                                    <option key={dept} value={dept} disabled={isAssigned}>
                                                        {dept} {isAssigned ? "(HOD Already Assigned)" : ""}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        <small style={{ color: "#64748b", fontSize: "12px", marginTop: "4px", display: "block" }}>
                                            Constraint: Exactly 1 active HOD per department.
                                        </small>
                                    </div>

                                    <div style={{ marginBottom: "16px" }}>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>HOD Full Name</label>
                                        <input
                                            type="text"
                                            placeholder="Dr. John Smith"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                                            required
                                        />
                                    </div>

                                    <div style={{ marginBottom: "16px" }}>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>Official Email</label>
                                        <input
                                            type="email"
                                            placeholder="hod.ce@ddu.ac.in"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                                            required
                                        />
                                    </div>

                                    <div style={{ marginBottom: "20px" }}>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>
                                            {editingHod ? "New Password (leave blank to keep existing)" : "Password (min 6 characters)"}
                                        </label>
                                        <input
                                            type="password"
                                            placeholder={editingHod ? "Enter new password" : "Create password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                                            required={!editingHod}
                                            minLength={6}
                                        />
                                    </div>

                                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            style={{ padding: "10px 18px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", cursor: "pointer", fontWeight: 600 }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="create-exam-btn"
                                            style={{ padding: "10px 20px" }}
                                        >
                                            {editingHod ? "Update HOD" : "Create HOD"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default AdminHodManagement;
