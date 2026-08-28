import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import { publishExam } from "../../Service/examService";
import "./ProfessorDashboard.css";

function ProfessorDashboard() {
    const navigate = useNavigate();
    const [dashboard, setDashboard] = useState(null);
    const [error, setError] = useState("");
    const [publishingId, setPublishingId] = useState(null);

    const fetchDashboardData = () => {
        try {
            const storedUser = localStorage.getItem("user");

            if (!storedUser) {
                setError("User is not logged in");
                return;
            }

            const user = JSON.parse(storedUser);

            if (user.role !== "PROFESSOR") {
                setError("You are not a professor");
                return;
            }

            const professorId = user.id || user.userId;

            if (!professorId) {
                setError("Professor ID is missing");
                return;
            }

            fetch(`http://localhost:8080/api/professor/dashboard/${professorId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    ...(user.token ? { Authorization: `Bearer ${user.token}` } : {})
                }
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to load dashboard (${response.status})`);
                    }
                    return response.json();
                })
                .then(data => {
                    setDashboard(data);
                })
                .catch(err => {
                    console.error("Dashboard error:", err);
                    setError(err.message);
                });
        } catch (err) {
            console.error("User data error:", err);
            setError("Invalid user data");
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const handlePublishClick = async (examId) => {
        if (!window.confirm("Are you sure you want to publish this exam? Students will be able to see it.")) {
            return;
        }

        try {
            setPublishingId(examId);
            await publishExam(examId);
            alert("Exam published successfully!");
            fetchDashboardData();
        } catch (err) {
            console.error("Publish error:", err);
            alert(err.message || "Failed to publish exam.");
        } finally {
            setPublishingId(null);
        }
    };

    if (error) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f1f5f9" }}>
                <Navbar />
                <div style={{ display: "flex", flex: 1 }}>
                    <Sidebar role="PROFESSOR" />
                    <main className="dashboard-content">
                        <div className="error-card">
                            <h2>Dashboard Error</h2>
                            <p>{error}</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (!dashboard) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f1f5f9" }}>
                <Navbar />
                <div style={{ display: "flex", flex: 1 }}>
                    <Sidebar role="PROFESSOR" />
                    <main className="dashboard-content">
                        <div className="loading-spinner">Loading Professor Dashboard...</div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f1f5f9" }}>
            <Navbar />

            <div style={{ display: "flex", flex: 1 }}>
                <Sidebar role="PROFESSOR" />

                <main className="dashboard-content">
                    <div className="dashboard-header-flex">
                        <div>
                            <h1 className="dashboard-title">Welcome, {dashboard.name}</h1>
                            <p className="dashboard-subtitle">
                                {dashboard.department ? `${dashboard.department} Department • ` : ""}Professor Overview
                            </p>
                        </div>
                        <button
                            className="create-exam-btn"
                            onClick={() => navigate("/professor/create-exam")}
                        >
                            + Create New Exam
                        </button>
                    </div>

                    {/* METRIC CARDS */}
                    <div className="dashboard-cards">
                        <div className="dashboard-card primary">
                            <h3>Total Exams</h3>
                            <p>{dashboard.totalExams || 0}</p>
                        </div>

                        <div
                            className="dashboard-card success"
                            onClick={() => navigate("/professor/active-exams")}
                            style={{ cursor: "pointer" }}
                        >
                            <h3>Active Exams</h3>
                            <p>{dashboard.activeExamsCount || 0}</p>
                        </div>

                        <div
                            className="dashboard-card info"
                            onClick={() => navigate("/professor/upcoming-exams")}
                            style={{ cursor: "pointer" }}
                        >
                            <h3>Upcoming Exams</h3>
                            <p>{dashboard.upcomingExamsCount || 0}</p>
                        </div>

                        <div
                            className="dashboard-card warning"
                            onClick={() => navigate("/professor/past-exams")}
                            style={{ cursor: "pointer" }}
                        >
                            <h3>Past Exams</h3>
                            <p>{dashboard.pastExamsCount || 0}</p>
                        </div>
                    </div>

                    {/* ACTIVE & UPCOMING EXAMS SECTION */}
                    <section className="dashboard-section">
                        <div className="section-header">
                            <h2>Upcoming & Active Exams</h2>
                        </div>

                        {(!dashboard.activeExams || dashboard.activeExams.length === 0) &&
                         (!dashboard.upcomingExams || dashboard.upcomingExams.length === 0) ? (
                            <div className="empty-state">
                                <p>No active or upcoming exams scheduled right now.</p>
                                <button
                                    className="secondary-btn"
                                    onClick={() => navigate("/professor/create-exam")}
                                >
                                    Create Your First Exam
                                </button>
                            </div>
                        ) : (
                            <div className="exam-table-container">
                                <table className="exam-table">
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Subject</th>
                                            <th>Batch</th>
                                            <th>Date & Time</th>
                                            <th>Duration</th>
                                            <th>Total Marks</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...(dashboard.activeExams || []), ...(dashboard.upcomingExams || [])].map((exam) => (
                                            <tr key={exam.id}>
                                                <td className="font-semibold">{exam.title}</td>
                                                <td>{exam.subject}</td>
                                                <td><span className="badge badge-batch">{exam.batch}</span></td>
                                                <td>{exam.examDate} {exam.startTime ? `at ${exam.startTime}` : ""}</td>
                                                <td>{exam.durationMinutes} mins</td>
                                                <td>{exam.totalMarks}</td>
                                                <td>
                                                    <span className={`status-tag status-${(exam.status || "").toLowerCase()}`}>
                                                        {exam.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    {/* RECENT / ALL EXAMS LIST WITH PUBLISH ACTION */}
                    <section className="dashboard-section">
                        <div className="section-header">
                            <h2>All Created Exams & Drafts</h2>
                        </div>

                        {!dashboard.recentExams || dashboard.recentExams.length === 0 ? (
                            <div className="empty-state">
                                <p>No exams created yet.</p>
                            </div>
                        ) : (
                            <div className="exam-table-container">
                                <table className="exam-table">
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Subject</th>
                                            <th>Batch</th>
                                            <th>Questions</th>
                                            <th>Date</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dashboard.recentExams.map((exam) => (
                                            <tr key={exam.id}>
                                                <td className="font-semibold">{exam.title}</td>
                                                <td>{exam.subject}</td>
                                                <td><span className="badge badge-batch">{exam.batch}</span></td>
                                                <td>{exam.questionCount} Questions</td>
                                                <td>{exam.examDate}</td>
                                                <td>
                                                    <span className={`status-tag status-${(exam.status || "").toLowerCase()}`}>
                                                        {exam.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    {exam.status === "DRAFT" ? (
                                                        <button
                                                            className="publish-action-btn"
                                                            disabled={publishingId === exam.id}
                                                            onClick={() => handlePublishClick(exam.id)}
                                                        >
                                                            {publishingId === exam.id ? "Publishing..." : "Publish Exam"}
                                                        </button>
                                                    ) : (
                                                        <span className="published-label">Published</span>
                                                    )}
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

export default ProfessorDashboard;