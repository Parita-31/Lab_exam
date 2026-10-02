import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import "../Professor/ProfessorDashboard.css";

function HodStudentManagement() {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [hodId, setHodId] = useState(null);
    const [hodDept, setHodDept] = useState("");

    // Modal state for Add/Edit Student
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);

    // Form fields
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        enrollmentNumber: "",
        batch: "",
        semester: 1,
        password: ""
    });
    const [formError, setFormError] = useState("");

    const fetchDepartmentStudents = () => {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) return;
        const user = JSON.parse(storedUser);
        const id = user.id || user.userId;
        setHodId(id);
        setHodDept(user.department || "");
        const token = user.token || localStorage.getItem("token");

        setLoading(true);
        fetch(`http://localhost:8080/api/hod/${id}/students`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch department students");
                return res.json();
            })
            .then((data) => {
                setStudents(data || []);
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchDepartmentStudents();
    }, []);

    const resetForm = () => {
        setFormData({
            name: "",
            email: "",
            enrollmentNumber: "",
            batch: "",
            semester: 1,
            password: ""
        });
        setFormError("");
    };

    const handleOpenAddModal = () => {
        resetForm();
        setIsAddModalOpen(true);
    };

    const handleOpenEditModal = (student) => {
        setEditingStudent(student);
        setFormData({
            name: student.name || "",
            email: student.email || "",
            enrollmentNumber: student.enrollmentNumber || "",
            batch: student.batch || "",
            semester: student.semester || 1,
            password: ""
        });
        setFormError("");
        setIsEditModalOpen(true);
    };

    const handleAddStudentSubmit = async (e) => {
        e.preventDefault();
        setFormError("");

        if (!formData.name || !formData.email || !formData.enrollmentNumber || !formData.semester) {
            setFormError("Please fill in all required fields (Name, Email, Enrollment Number, Semester)");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:8080/api/hod/${hodId}/students`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || "Failed to add student");
            }

            alert(`Student '${formData.name}' added successfully!`);
            setIsAddModalOpen(false);
            resetForm();
            fetchDepartmentStudents();
        } catch (err) {
            setFormError(err.message);
        }
    };

    const handleEditStudentSubmit = async (e) => {
        e.preventDefault();
        setFormError("");

        if (!formData.name || !formData.semester) {
            setFormError("Please fill in all required fields");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:8080/api/hod/${hodId}/students/${editingStudent.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    name: formData.name,
                    batch: formData.batch,
                    semester: parseInt(formData.semester),
                    password: formData.password || null
                })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || "Failed to update student");
            }

            alert(`Student '${formData.name}' updated successfully!`);
            setIsEditModalOpen(false);
            setEditingStudent(null);
            resetForm();
            fetchDepartmentStudents();
        } catch (err) {
            setFormError(err.message);
        }
    };

    const handleDeleteStudent = async (studentId, studentName) => {
        if (!window.confirm(`Are you sure you want to delete student '${studentName}'?`)) return;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:8080/api/hod/${hodId}/students/${studentId}`, {
                method: "DELETE",
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            if (!res.ok) throw new Error("Failed to delete student");

            alert(`Student '${studentName}' deleted successfully!`);
            fetchDepartmentStudents();
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
                            <h1 className="dashboard-title">🎓 Student Directory & Management</h1>
                            <p className="dashboard-subtitle">
                                Department of {hodDept || "Engineering"} • Manage Department Students
                            </p>
                        </div>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <button
                                className="create-exam-btn"
                                style={{ background: "#4f46e5" }}
                                onClick={() => navigate("/hod/bulk-import")}
                            >
                                📥 Bulk Import Students
                            </button>
                            <button
                                className="create-exam-btn"
                                onClick={handleOpenAddModal}
                            >
                                ➕ Add Student
                            </button>
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
                            <h2>Department Students ({students.length})</h2>
                        </div>

                        {loading ? (
                            <div className="empty-state">Loading department students...</div>
                        ) : students.length === 0 ? (
                            <div className="empty-state">
                                <p>No students found for the {hodDept} department.</p>
                                <button
                                    className="create-exam-btn"
                                    style={{ marginTop: "15px" }}
                                    onClick={handleOpenAddModal}
                                >
                                    Add First Student
                                </button>
                            </div>
                        ) : (
                            <div className="exam-table-container">
                                <table className="exam-table">
                                    <thead>
                                        <tr>
                                            <th>Student Name</th>
                                            <th>Enrollment No.</th>
                                            <th>Email</th>
                                            <th>Batch</th>
                                            <th>Semester</th>
                                            <th>Department</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map((student) => (
                                            <tr key={student.id}>
                                                <td className="font-semibold">{student.name}</td>
                                                <td>
                                                    <span style={{ fontFamily: "monospace", fontWeight: "600" }}>
                                                        {student.enrollmentNumber || "N/A"}
                                                    </span>
                                                </td>
                                                <td>{student.email}</td>
                                                <td>
                                                    <span className="badge badge-batch">
                                                        {student.batch || "N/A"}
                                                    </span>
                                                </td>
                                                <td>Sem {student.semester || "1"}</td>
                                                <td>
                                                    <span className="badge badge-batch" style={{ background: "#0f766e", color: "#fff" }}>
                                                        {student.department}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", gap: "8px" }}>
                                                        <button
                                                            className="publish-action-btn"
                                                            style={{ background: "#3b82f6" }}
                                                            onClick={() => handleOpenEditModal(student)}
                                                        >
                                                            Edit ✏️
                                                        </button>
                                                        <button
                                                            className="publish-action-btn"
                                                            style={{ background: "#dc2626" }}
                                                            onClick={() => handleDeleteStudent(student.id, student.name)}
                                                        >
                                                            Delete 🗑️
                                                        </button>
                                                    </div>
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

            {/* ADD STUDENT MODAL */}
            {isAddModalOpen && (
                <div className="modal-overlay" style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex",
                    alignItems: "center", justifyContent: "center", zIndex: 1000
                }}>
                    <div style={{
                        background: "#ffffff", borderRadius: "12px", width: "90%",
                        maxWidth: "540px", padding: "28px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)"
                    }}>
                        <h2 style={{ margin: "0 0 16px 0", fontSize: "1.25rem", color: "#1e293b" }}>
                            ➕ Add New Student to {hodDept}
                        </h2>
                        {formError && (
                            <div style={{
                                padding: "10px 14px", background: "#fef2f2", color: "#dc2626",
                                border: "1px solid #fecaca", borderRadius: "6px", marginBottom: "16px", fontSize: "0.9rem"
                            }}>
                                {formError}
                            </div>
                        )}
                        <form onSubmit={handleAddStudentSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div>
                                <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", fontWeight: "600", color: "#475569" }}>
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Rahul Sharma"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", fontWeight: "600", color: "#475569" }}>
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    required
                                    placeholder="e.g. rahul@ddu.ac.in"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", fontWeight: "600", color: "#475569" }}>
                                    Enrollment Number *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. 21CE001"
                                    value={formData.enrollmentNumber}
                                    onChange={(e) => setFormData({ ...formData, enrollmentNumber: e.target.value })}
                                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                />
                            </div>
                            <div style={{ display: "flex", gap: "12px" }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", fontWeight: "600", color: "#475569" }}>
                                        Batch
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 2022-2026"
                                        value={formData.batch}
                                        onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                                        style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                    />
                                </div>
                                <div style={{ width: "120px" }}>
                                    <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", fontWeight: "600", color: "#475569" }}>
                                        Semester *
                                    </label>
                                    <select
                                        value={formData.semester}
                                        onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                                        style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#fff" }}
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                                            <option key={sem} value={sem}>Sem {sem}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", fontWeight: "600", color: "#475569" }}>
                                    Default Password (Optional - defaults to 'password123')
                                </label>
                                <input
                                    type="password"
                                    placeholder="Leave blank for password123"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                />
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    style={{ padding: "10px 18px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="create-exam-btn"
                                >
                                    Add Student
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT STUDENT MODAL */}
            {isEditModalOpen && (
                <div className="modal-overlay" style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex",
                    alignItems: "center", justifyContent: "center", zIndex: 1000
                }}>
                    <div style={{
                        background: "#ffffff", borderRadius: "12px", width: "90%",
                        maxWidth: "540px", padding: "28px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)"
                    }}>
                        <h2 style={{ margin: "0 0 16px 0", fontSize: "1.25rem", color: "#1e293b" }}>
                            ✏️ Edit Student: {editingStudent?.name}
                        </h2>
                        {formError && (
                            <div style={{
                                padding: "10px 14px", background: "#fef2f2", color: "#dc2626",
                                border: "1px solid #fecaca", borderRadius: "6px", marginBottom: "16px", fontSize: "0.9rem"
                            }}>
                                {formError}
                            </div>
                        )}
                        <form onSubmit={handleEditStudentSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div>
                                <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", fontWeight: "600", color: "#475569" }}>
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", fontWeight: "600", color: "#475569" }}>
                                    Email Address (Read-only)
                                </label>
                                <input
                                    type="email"
                                    disabled
                                    value={formData.email}
                                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#f8fafc" }}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", fontWeight: "600", color: "#475569" }}>
                                    Enrollment Number (Read-only)
                                </label>
                                <input
                                    type="text"
                                    disabled
                                    value={formData.enrollmentNumber}
                                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#f8fafc" }}
                                />
                            </div>
                            <div style={{ display: "flex", gap: "12px" }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", fontWeight: "600", color: "#475569" }}>
                                        Batch
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 2022-2026"
                                        value={formData.batch}
                                        onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                                        style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                    />
                                </div>
                                <div style={{ width: "120px" }}>
                                    <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", fontWeight: "600", color: "#475569" }}>
                                        Semester *
                                    </label>
                                    <select
                                        value={formData.semester}
                                        onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                                        style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#fff" }}
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                                            <option key={sem} value={sem}>Sem {sem}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", fontWeight: "600", color: "#475569" }}>
                                    New Password (Optional - leave blank to keep unchanged)
                                </label>
                                <input
                                    type="password"
                                    placeholder="Leave blank to keep current password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                />
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    style={{ padding: "10px 18px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="create-exam-btn"
                                >
                                    Update Student
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default HodStudentManagement;
