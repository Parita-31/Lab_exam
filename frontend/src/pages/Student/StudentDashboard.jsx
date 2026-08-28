import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import "./StudentDashboard.css";

function StudentDashboard() {
    const navigate = useNavigate();
    const [dashboard, setDashboard] = useState(null);
    const [studentId, setStudentId] = useState(null);
    const [error, setError] = useState("");
    const [selectedExamDetails, setSelectedExamDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem("user");
            if (!storedUser) {
                setError("User is not logged in");
                return;
            }

            const user = JSON.parse(storedUser);
            const id = user.id || user.userId;

            if (!id) {
                setError("Student ID is missing");
                return;
            }

            setStudentId(id);
        } catch (err) {
            console.error("User data error:", err);
            setError("Invalid user data");
        }
    }, []);

    useEffect(() => {
        if (!studentId) return;

        fetch(`http://localhost:8080/api/student/dashboard/${studentId}`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Failed to load dashboard (${response.status})`);
                }
                return response.json();
            })
            .then((data) => {
                console.log("Student dashboard data:", data);
                setDashboard(data);
            })
            .catch((err) => {
                console.error("Dashboard fetch error:", err);
                setError(err.message);
            });
    }, [studentId]);

    const handleViewExamDetails = (examId) => {
        setLoadingDetails(true);
        fetch(`http://localhost:8080/api/student/exams/${examId}`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to fetch exam details");
                }
                return response.json();
            })
            .then((data) => {
                setSelectedExamDetails(data);
            })
            .catch((err) => {
                alert("Error loading exam details: " + err.message);
            })
            .finally(() => {
                setLoadingDetails(false);
            });
    };

    const closeModal = () => {
        setSelectedExamDetails(null);
    };

    if (error) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f1f5f9" }}>
                <Navbar />
                <div style={{ display: "flex", flex: 1 }}>
                    <Sidebar role="STUDENT" />
                    <main className="dashboard-content">
                        <div className="error-card">
                            <h2>Error</h2>
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
                    <Sidebar role="STUDENT" />
                    <main className="dashboard-content">
                        <div className="loading-spinner">Loading Student Overview...</div>
                    </main>
                </div>
            </div>
        );
    }

    const activeList = dashboard.activeExams || [];
    const upcomingList = dashboard.upcomingExams || [];
    const pastList = dashboard.pastExams || [];

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f1f5f9" }}>
            <Navbar user={dashboard} />

            <div style={{ display: "flex", flex: 1 }}>
                <Sidebar role="STUDENT" />

                <main className="dashboard-content">
                    <div className="dashboard-welcome">
                        <h1>Welcome, {dashboard.name}</h1>
                        <p>
                            {dashboard.batch ? `Batch: ${dashboard.batch} • ` : ""}
                            {dashboard.enrollmentNumber ? `Enrollment: ${dashboard.enrollmentNumber} • ` : ""}
                            Student Examination Portal
                        </p>
                    </div>

                    {/* METRIC CARDS */}
                    <div className="dashboard-cards">
                        <div
                            className="dashboard-card card-active"
                            onClick={() => navigate("/student/active-exams")}
                            style={{ cursor: "pointer" }}
                        >
                            <span>Active Exams Today</span>
                            <strong>{dashboard.activeExamsCount ?? activeList.length}</strong>
                        </div>

                        <div
                            className="dashboard-card card-upcoming"
                            onClick={() => navigate("/student/upcoming-exams")}
                            style={{ cursor: "pointer" }}
                        >
                            <span>Upcoming Exams</span>
                            <strong>{dashboard.upcomingExamsCount ?? upcomingList.length}</strong>
                        </div>

                        <div
                            className="dashboard-card card-completed"
                            onClick={() => navigate("/student/past-exams")}
                            style={{ cursor: "pointer" }}
                        >
                            <span>Past & Completed Exams</span>
                            <strong>{dashboard.completedExamsCount ?? pastList.length}</strong>
                        </div>
                    </div>

                    {/* ACTIVE EXAMS SECTION */}
                    {activeList.length > 0 && (
                        <section className="dashboard-section section-active">
                            <h2>Active Exams Today</h2>
                            <p className="section-sub">Exams available for attempt today.</p>
                            <div className="exam-cards-grid">
                                {activeList.map((exam) => (
                                    <div className="student-exam-card active-card" key={exam.id}>
                                        <div className="exam-card-badge status-published">ACTIVE NOW</div>
                                        <h3>{exam.title}</h3>
                                        <p className="exam-meta"><strong>Subject:</strong> {exam.subject}</p>
                                        <p className="exam-meta"><strong>Time:</strong> {exam.startTime || "Scheduled"} ({exam.durationMinutes} mins)</p>
                                        <p className="exam-meta"><strong>Marks:</strong> {exam.totalMarks}</p>
                                        <div className="card-actions">
                                            <button className="start-exam-btn">Start Exam Now →</button>
                                            <button
                                                className="view-details-btn"
                                                onClick={() => handleViewExamDetails(exam.id)}
                                            >
                                                View Complete Details
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* UPCOMING EXAMS SECTION */}
                    <section className="dashboard-section">
                        <h2>Upcoming Scheduled Exams</h2>
                        <p className="section-sub">Exams scheduled for upcoming dates for your batch.</p>

                        {upcomingList.length === 0 ? (
                            <div className="empty-exams">
                                <p>No upcoming exams scheduled for batch <strong>{dashboard.batch || "all batches"}</strong> at the moment.</p>
                            </div>
                        ) : (
                            <div className="exam-table-container">
                                <table className="student-exam-table">
                                    <thead>
                                        <tr>
                                            <th>Exam Title</th>
                                            <th>Subject</th>
                                            <th>Batch</th>
                                            <th>Date</th>
                                            <th>Start Time</th>
                                            <th>Duration</th>
                                            <th>Marks</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {upcomingList.map((exam) => (
                                            <tr key={exam.id}>
                                                <td className="font-semibold">{exam.title}</td>
                                                <td>{exam.subject}</td>
                                                <td><span className="badge badge-batch">{exam.batch}</span></td>
                                                <td>{exam.examDate}</td>
                                                <td>{exam.startTime || "TBA"}</td>
                                                <td>{exam.durationMinutes} mins</td>
                                                <td>{exam.totalMarks}</td>
                                                <td>
                                                    <button
                                                        className="view-details-btn-table"
                                                        onClick={() => handleViewExamDetails(exam.id)}
                                                    >
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    {/* PAST / COMPLETED EXAMS */}
                    {pastList.length > 0 && (
                        <section className="dashboard-section">
                            <h2>Past Exams</h2>
                            <div className="exam-table-container">
                                <table className="student-exam-table">
                                    <thead>
                                        <tr>
                                            <th>Exam Title</th>
                                            <th>Subject</th>
                                            <th>Batch</th>
                                            <th>Date</th>
                                            <th>Duration</th>
                                            <th>Marks</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pastList.map((exam) => (
                                            <tr key={exam.id}>
                                                <td className="font-semibold">{exam.title}</td>
                                                <td>{exam.subject}</td>
                                                <td><span className="badge badge-batch">{exam.batch}</span></td>
                                                <td>{exam.examDate}</td>
                                                <td>{exam.durationMinutes} mins</td>
                                                <td>{exam.totalMarks}</td>
                                                <td>
                                                    <button
                                                        className="view-details-btn-table"
                                                        onClick={() => handleViewExamDetails(exam.id)}
                                                    >
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}
                </main>
            </div>

            {/* EXAM DETAILS MODAL */}
            {selectedExamDetails && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{selectedExamDetails.title}</h2>
                            <button className="modal-close-btn" onClick={closeModal}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="details-grid">
                                <div><strong>Subject:</strong> {selectedExamDetails.subject}</div>
                                <div><strong>Batch:</strong> {selectedExamDetails.batch}</div>
                                <div><strong>Semester:</strong> {selectedExamDetails.semester || 1}</div>
                                <div><strong>Exam Date:</strong> {selectedExamDetails.examDate}</div>
                                <div><strong>Start Time:</strong> {selectedExamDetails.startTime || "TBA"}</div>
                                <div><strong>Duration:</strong> {selectedExamDetails.durationMinutes} Minutes</div>
                                <div><strong>Total Marks:</strong> {selectedExamDetails.totalMarks}</div>
                                <div><strong>Status:</strong> <span className="status-tag status-published">{selectedExamDetails.status}</span></div>
                                <div><strong>Professor:</strong> {selectedExamDetails.professorName || "Faculty"}</div>
                                <div><strong>Questions Count:</strong> {selectedExamDetails.questionCount || (selectedExamDetails.questions ? selectedExamDetails.questions.length : 0)}</div>
                            </div>

                            {selectedExamDetails.questions && selectedExamDetails.questions.length > 0 && (
                                <div className="modal-questions-section">
                                    <h3>Exam Questions Overview</h3>
                                    {selectedExamDetails.questions.map((q, idx) => (
                                        <div className="modal-question-item" key={idx}>
                                            <h4>Q{idx + 1}. {q.questionText} ({q.marks} Marks)</h4>
                                            <p className="q-type">Type: {q.type}</p>
                                            {q.options && q.options.length > 0 && (
                                                <ul className="q-options-list">
                                                    {q.options.map((opt, oIdx) => (
                                                        <li key={oIdx}>
                                                            <strong>{opt.label}:</strong> {opt.text}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="secondary-btn" onClick={closeModal}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default StudentDashboard;