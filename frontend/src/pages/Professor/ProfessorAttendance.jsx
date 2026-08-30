import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import {
    getExamAttendanceRoster,
    getProfessorAttendanceExams,
    saveExamAttendance
} from "../../Service/attendanceService";
import "./ProfessorDashboard.css";
import "../AttendancePages.css";

function ProfessorAttendance() {
    const navigate = useNavigate();
    const [exams, setExams] = useState([]);
    const [selectedExamId, setSelectedExamId] = useState("");
    const [roster, setRoster] = useState(null);
    const [statuses, setStatuses] = useState({});
    const [searchQuery, setSearchQuery] = useState("");
    const [loadingExams, setLoadingExams] = useState(true);
    const [loadingRoster, setLoadingRoster] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        if (!storedUser || storedUser.role !== "PROFESSOR") {
            navigate("/login");
            return;
        }

        setLoadingExams(true);
        getProfessorAttendanceExams()
            .then((data) => {
                setExams(data || []);
                setError("");
            })
            .catch((err) => {
                setError(err.message || "Failed to load exams");
            })
            .finally(() => {
                setLoadingExams(false);
            });
    }, [navigate]);

    const loadRoster = (examId) => {
        if (!examId) {
            setRoster(null);
            setStatuses({});
            return;
        }

        setLoadingRoster(true);
        setError("");
        setSuccess("");
        getExamAttendanceRoster(examId)
            .then((data) => {
                setRoster(data);
                const nextStatuses = {};
                (data.students || []).forEach((student) => {
                    nextStatuses[student.studentId] = student.status || "";
                });
                setStatuses(nextStatuses);
            })
            .catch((err) => {
                setRoster(null);
                setError(err.message || "Failed to load attendance");
            })
            .finally(() => {
                setLoadingRoster(false);
            });
    };

    const handleExamChange = (event) => {
        const examId = event.target.value;
        setSelectedExamId(examId);
        setSearchQuery("");
        loadRoster(examId);
    };

    const filteredStudents = useMemo(() => {
        const students = roster?.students || [];
        const query = searchQuery.trim().toLowerCase();
        if (!query) {
            return students;
        }
        return students.filter((student) => {
            const name = (student.studentName || "").toLowerCase();
            const enrollment = (student.enrollmentNumber || "").toLowerCase();
            return name.includes(query) || enrollment.includes(query);
        });
    }, [roster, searchQuery]);

    const liveCounts = useMemo(() => {
        const values = Object.values(statuses);
        const presentCount = values.filter((status) => status === "PRESENT").length;
        const absentCount = values.filter((status) => status === "ABSENT").length;
        const total = roster?.students?.length || 0;
        return {
            total,
            presentCount,
            absentCount,
            unmarkedCount: Math.max(total - presentCount - absentCount, 0)
        };
    }, [roster, statuses]);

    const handleStatusChange = (studentId, status) => {
        setStatuses((prev) => ({ ...prev, [studentId]: status }));
        setSuccess("");
    };

    const handleSave = async () => {
        if (!selectedExamId) {
            setError("Select an exam first");
            return;
        }

        const marks = Object.entries(statuses)
            .filter(([, status]) => status === "PRESENT" || status === "ABSENT")
            .map(([studentId, status]) => ({
                studentId: Number(studentId),
                status
            }));

        if (marks.length === 0) {
            setError("Mark at least one student Present or Absent before saving");
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");
        try {
            const data = await saveExamAttendance(selectedExamId, marks);
            setRoster(data);
            const nextStatuses = {};
            (data.students || []).forEach((student) => {
                nextStatuses[student.studentId] = student.status || "";
            });
            setStatuses(nextStatuses);
            setSuccess("Attendance saved successfully");
        } catch (err) {
            setError(err.message || "Failed to save attendance");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="attendance-page">
            <Navbar />
            <div className="attendance-page-body">
                <Sidebar role="PROFESSOR" />
                <main className="dashboard-content">
                    <div className="dashboard-header-flex">
                        <div>
                            <h1 className="dashboard-title">Attendance</h1>
                            <p className="dashboard-subtitle">Mark and update student attendance for your exams.</p>
                        </div>
                    </div>

                    {error && (
                        <div className="attendance-alert attendance-alert-error">{error}</div>
                    )}
                    {success && (
                        <div className="attendance-alert attendance-alert-success">{success}</div>
                    )}

                    <div className="dashboard-section">
                        <div className="attendance-toolbar">
                            <label className="attendance-field">
                                <span>Select exam</span>
                                <select
                                    value={selectedExamId}
                                    onChange={handleExamChange}
                                    disabled={loadingExams}
                                >
                                    <option value="">
                                        {loadingExams ? "Loading exams..." : "Choose an exam"}
                                    </option>
                                    {exams.map((exam) => (
                                        <option key={exam.id} value={exam.id}>
                                            {exam.title}
                                            {exam.examDate ? ` (${exam.examDate})` : ""}
                                            {exam.batch ? ` · ${exam.batch}` : ""}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="attendance-field attendance-search">
                                <span>Search students</span>
                                <input
                                    type="text"
                                    placeholder="Search by name or enrollment number"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    disabled={!roster}
                                />
                            </label>
                        </div>

                        {!selectedExamId && !loadingExams && exams.length === 0 && (
                            <div className="empty-state">
                                <h3>No exams found</h3>
                                <p>Create an exam first to mark attendance.</p>
                            </div>
                        )}

                        {selectedExamId && loadingRoster && (
                            <div className="empty-state">
                                <p>Loading student attendance...</p>
                            </div>
                        )}

                        {roster && !loadingRoster && (
                            <>
                                <div className="dashboard-cards attendance-counts">
                                    <div className="dashboard-card primary">
                                        <h3>Total</h3>
                                        <p>{liveCounts.total}</p>
                                    </div>
                                    <div className="dashboard-card success">
                                        <h3>Present</h3>
                                        <p>{liveCounts.presentCount}</p>
                                    </div>
                                    <div className="dashboard-card warning">
                                        <h3>Absent</h3>
                                        <p>{liveCounts.absentCount}</p>
                                    </div>
                                </div>

                                {filteredStudents.length === 0 ? (
                                    <div className="empty-state">
                                        <h3>No students found</h3>
                                        <p>
                                            {searchQuery
                                                ? "Try a different search."
                                                : "There are no students mapped to this exam batch."}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="exam-table-container">
                                        <table className="exam-table">
                                            <thead>
                                                <tr>
                                                    <th>Enrollment number</th>
                                                    <th>Student name</th>
                                                    <th>Batch</th>
                                                    <th>Attendance</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredStudents.map((student) => (
                                                    <tr key={student.studentId}>
                                                        <td className="font-semibold">
                                                            {student.enrollmentNumber || "N/A"}
                                                        </td>
                                                        <td>{student.studentName}</td>
                                                        <td>
                                                            <span className="badge badge-batch">
                                                                {student.batch || "N/A"}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="attendance-toggle">
                                                                <button
                                                                    type="button"
                                                                    className={`attendance-toggle-btn present ${statuses[student.studentId] === "PRESENT" ? "active" : ""}`}
                                                                    onClick={() => handleStatusChange(student.studentId, "PRESENT")}
                                                                >
                                                                    Present
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className={`attendance-toggle-btn absent ${statuses[student.studentId] === "ABSENT" ? "active" : ""}`}
                                                                    onClick={() => handleStatusChange(student.studentId, "ABSENT")}
                                                                >
                                                                    Absent
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                <div className="attendance-save-row">
                                    <button
                                        type="button"
                                        className="create-exam-btn"
                                        onClick={handleSave}
                                        disabled={saving || (roster.students || []).length === 0}
                                    >
                                        {saving ? "Saving..." : "Save Attendance"}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default ProfessorAttendance;
