import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import { getStudentAttendance } from "../../Service/attendanceService";
import "./StudentDashboard.css";
import "../AttendancePages.css";

function StudentAttendance() {
    const navigate = useNavigate();
    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        if (!storedUser || storedUser.role !== "STUDENT") {
            navigate("/login");
            return;
        }

        setLoading(true);
        getStudentAttendance()
            .then((data) => {
                setOverview(data);
                setError("");
            })
            .catch((err) => {
                setError(err.message || "Failed to load attendance");
            })
            .finally(() => {
                setLoading(false);
            });
    }, [navigate]);

    const formatDate = (value) => {
        if (!value) {
            return "N/A";
        }
        try {
            return new Date(value).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            });
        } catch (e) {
            return value;
        }
    };

    return (
        <div className="attendance-page">
            <Navbar />
            <div className="attendance-page-body">
                <Sidebar role="STUDENT" />
                <main className="dashboard-content">
                    <div className="dashboard-welcome">
                        <h1>Attendance</h1>
                        <p>Your exam-wise attendance from the Lab Examination Portal.</p>
                    </div>

                    {error && (
                        <div className="attendance-alert attendance-alert-error">{error}</div>
                    )}

                    {loading && (
                        <div className="dashboard-section">
                            <div className="empty-state">
                                <p>Loading attendance...</p>
                            </div>
                        </div>
                    )}

                    {!loading && !error && overview && (
                        <>
                            <div className="dashboard-cards">
                                <div className="dashboard-card card-upcoming">
                                    <span>Overall attendance</span>
                                    <strong>{overview.percentage}%</strong>
                                </div>
                                <div className="dashboard-card">
                                    <span>Total exams</span>
                                    <strong>{overview.totalExams}</strong>
                                </div>
                                <div className="dashboard-card card-active">
                                    <span>Present</span>
                                    <strong>{overview.presentCount}</strong>
                                </div>
                                <div className="dashboard-card card-completed">
                                    <span>Absent</span>
                                    <strong>{overview.absentCount}</strong>
                                </div>
                            </div>

                            <div className="dashboard-section">
                                <h2>Exam-wise attendance</h2>
                                <p className="section-sub">Records saved by your professor for each exam.</p>

                                {(overview.records || []).length === 0 ? (
                                    <div className="empty-state">
                                        <h3>No attendance records yet</h3>
                                        <p>Your attendance will appear here after a professor marks it.</p>
                                    </div>
                                ) : (
                                    <div className="exam-table-container">
                                        <table className="student-exam-table">
                                            <thead>
                                                <tr>
                                                    <th>Exam name</th>
                                                    <th>Exam date</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {overview.records.map((record) => (
                                                    <tr key={`${record.examId}-${record.examDate}-${record.status}`}>
                                                        <td className="font-semibold">
                                                            {record.examName}
                                                            {record.subject ? (
                                                                <div className="exam-meta">{record.subject}</div>
                                                            ) : null}
                                                        </td>
                                                        <td>{formatDate(record.examDate)}</td>
                                                        <td>
                                                            <span className={`status-tag ${record.status === "PRESENT" ? "status-published" : "status-draft"}`}>
                                                                {record.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}

export default StudentAttendance;
