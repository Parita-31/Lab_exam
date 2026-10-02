import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import "../Professor/ProfessorDashboard.css";

function AdminStudentView() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filterDepartment, setFilterDepartment] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");

    const fetchStudents = () => {
        const token = localStorage.getItem("token");
        setLoading(true);
        fetch("http://localhost:8080/api/admin/students", {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch student list");
                return res.json();
            })
            .then((data) => {
                setStudents(data || []);
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const handleDeleteStudent = async (studentId, studentName) => {
        if (!window.confirm(`Are you sure you want to delete student '${studentName}'?`)) return;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:8080/api/admin/students/${studentId}`, {
                method: "DELETE",
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            if (!res.ok) throw new Error("Failed to delete student record.");

            alert("Student deleted successfully!");
            fetchStudents();
        } catch (err) {
            alert(err.message);
        }
    };

    const departments = ["ALL", ...new Set(students.map((s) => s.department).filter(Boolean))];

    const filteredStudents = students.filter((s) => {
        const matchesDept = filterDepartment === "ALL" || s.department === filterDepartment;
        const matchesSearch = !searchQuery ||
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.enrollmentNumber && s.enrollmentNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
            s.email.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesDept && matchesSearch;
    });

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f1f5f9" }}>
            <Navbar />
            <div style={{ display: "flex", flex: 1 }}>
                <Sidebar role="ADMIN" />
                <main className="dashboard-content">
                    <div className="dashboard-header-flex">
                        <div>
                            <h1 className="dashboard-title">🎓 Student Master Registry</h1>
                            <p className="dashboard-subtitle">
                                Overview of all enrolled students across university departments
                            </p>
                        </div>
                        {/* Notice: STRICT RULE - NO Add or Edit Student buttons for Admin */}
                    </div>

                    {error && (
                        <div className="error-card" style={{ marginBottom: "20px" }}>
                            <h2>Error</h2>
                            <p>{error}</p>
                        </div>
                    )}

                    <section className="dashboard-section" style={{ marginTop: "20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                            <div className="section-header" style={{ marginBottom: 0 }}>
                                <h2>Enrolled Students ({filteredStudents.length})</h2>
                            </div>

                            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                <input
                                    type="text"
                                    placeholder="Search student, enrollment, email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", width: "240px" }}
                                />

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
                            <div className="empty-state">Loading Student Registry...</div>
                        ) : filteredStudents.length === 0 ? (
                            <div className="empty-state">
                                <p>No student records found matching the criteria.</p>
                            </div>
                        ) : (
                            <div className="exam-table-container">
                                <table className="exam-table">
                                    <thead>
                                        <tr>
                                            <th>Student Name</th>
                                            <th>Enrollment No.</th>
                                            <th>Email</th>
                                            <th>Department</th>
                                            <th>Batch</th>
                                            <th>Semester</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStudents.map((stud) => (
                                            <tr key={stud.id}>
                                                <td className="font-semibold">{stud.name}</td>
                                                <td>{stud.enrollmentNumber || "N/A"}</td>
                                                <td>{stud.email}</td>
                                                <td>
                                                    <span className="badge badge-batch" style={{ background: "#0f766e", color: "#fff" }}>
                                                        {stud.department || "N/A"}
                                                    </span>
                                                </td>
                                                <td><span className="badge badge-batch">{stud.batch || "E1"}</span></td>
                                                <td>Sem {stud.semester || 1}</td>
                                                <td>
                                                    <span className={`status-tag status-${(stud.status || "active").toLowerCase()}`}>
                                                        {stud.status || "ACTIVE"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        className="publish-action-btn"
                                                        style={{ background: "#dc2626" }}
                                                        onClick={() => handleDeleteStudent(stud.id, stud.name)}
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

export default AdminStudentView;
