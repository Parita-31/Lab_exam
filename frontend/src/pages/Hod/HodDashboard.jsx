import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import StudentAnswerPaperModal from "../../components/StudentAnswerPaperModal";
import { publishExam } from "../../Service/examService";
import "../Professor/ProfessorDashboard.css";

function HodDashboard() {
    const navigate = useNavigate();
    const [dashboard, setDashboard] = useState(null);
    const [hodId, setHodId] = useState(null);
    const [hodDept, setHodDept] = useState("");
    const [error, setError] = useState("");
    const [publishingId, setPublishingId] = useState(null);

    // HOD specific state
    const [pendingProfessorsCount, setPendingProfessorsCount] = useState(0);
    const [deptProfessorsCount, setDeptProfessorsCount] = useState(0);
    const [deptStudentsCount, setDeptStudentsCount] = useState(0);

    // Submissions state
    const [submissions, setSubmissions] = useState([]);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);
    const [selectedPaperData, setSelectedPaperData] = useState(null);

    const fetchHodData = () => {
        try {
            const storedUser = localStorage.getItem("user");
            if (!storedUser) {
                setError("User is not logged in");
                return;
            }

            const user = JSON.parse(storedUser);
            if (user.role !== "HOD" && user.role !== "ADMIN") {
                setError("Access denied: You are not an HOD");
                return;
            }

            const id = user.id || user.userId;
            setHodId(id);
            setHodDept(user.department || "");
            const token = user.token || localStorage.getItem("token");

            // Fetch professor dashboard metrics
            fetch(`http://localhost:8080/api/professor/dashboard/${id}`, {
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            })
                .then(res => res.ok ? res.json() : null)
                .then(data => setDashboard(data))
                .catch(err => console.error("Dashboard error:", err));

            // Fetch submissions for HOD's exams
            setLoadingSubmissions(true);
            fetch(`http://localhost:8080/api/professor/${id}/submissions`)
                .then(res => res.ok ? res.json() : [])
                .then(subData => setSubmissions(subData || []))
                .finally(() => setLoadingSubmissions(false));

            // Fetch HOD pending professor approval requests
            fetch(`http://localhost:8080/api/hod/${id}/professors/pending`)
                .then(res => res.ok ? res.json() : [])
                .then(pendingList => setPendingProfessorsCount(pendingList.length))
                .catch(err => console.error("Pending prof error:", err));

            // Fetch department professors count
            fetch(`http://localhost:8080/api/hod/${id}/professors`)
                .then(res => res.ok ? res.json() : [])
                .then(profList => setDeptProfessorsCount(profList.length))
                .catch(err => console.error("Dept prof error:", err));

            // Fetch department students count
            fetch(`http://localhost:8080/api/hod/${id}/students`)
                .then(res => res.ok ? res.json() : [])
                .then(studentList => setDeptStudentsCount(studentList.length))
                .catch(err => console.error("Dept student error:", err));

        } catch (err) {
            setError("Invalid user session");
        }
    };

    useEffect(() => {
        fetchHodData();
    }, []);

    const handlePublishClick = async (examId) => {
        if (!window.confirm("Are you sure you want to publish this exam?")) return;
        try {
            setPublishingId(examId);
            await publishExam(examId);
            alert("Exam published successfully!");
            fetchHodData();
        } catch (err) {
            alert(err.message || "Failed to publish exam.");
        } finally {
            setPublishingId(null);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        try {
            return new Date(dateStr).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
        } catch (e) {
            return dateStr;
        }
    };

    if (error) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f1f5f9" }}>
                <Navbar />
                <div style={{ display: "flex", flex: 1 }}>
                    <Sidebar role="HOD" />
                    <main className="dashboard-content">
                        <div className="error-card">
                            <h2>HOD Portal Error</h2>
                            <p>{error}</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f1f5f9" }}>
            <Navbar />
            <div style={{ display: "flex", flex: 1 }}>
                <Sidebar role="HOD" />
                <main className="dashboard-content">
                    <div className="dashboard-header-flex">
                        <div>
                            <h1 className="dashboard-title">Welcome, {dashboard?.name || "HOD"}</h1>
                            <p className="dashboard-subtitle">
                                {hodDept ? `${hodDept} Department • ` : ""}Head of Department Management Portal
                            </p>
                        </div>
                        <button className="create-exam-btn" onClick={() => navigate("/professor/create-exam")}>
                            + Create New Exam
                        </button>
                    </div>

                    {/* PENDING APPROVAL NOTIFICATION BANNER */}
                    {pendingProfessorsCount > 0 && (
                        <div style={{
                            background: "#fff7ed", border: "1px solid #ffedd5", borderLeft: "6px solid #f97316",
                            padding: "16px 20px", borderRadius: "12px", marginBottom: "24px", display: "flex",
                            justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                        }}>
                            <div>
                                <h3 style={{ fontSize: "16px", color: "#c2410c", margin: 0, fontWeight: 700 }}>
                                    🔔 Pending Professor Registration Requests: {pendingProfessorsCount}
                                </h3>
                                <p style={{ fontSize: "14px", color: "#9a3412", margin: "4px 0 0 0" }}>
                                    You have {pendingProfessorsCount} pending faculty registration request(s) awaiting approval in {hodDept}.
                                </p>
                            </div>
                            <button
                                className="create-exam-btn"
                                style={{ background: "#ea580c", whiteSpace: "nowrap" }}
                                onClick={() => navigate("/hod/approvals")}
                            >
                                Review Requests →
                            </button>
                        </div>
                    )}

                    {/* HOD & PROFESSOR METRIC CARDS */}
                    <div className="dashboard-cards">
                        <div
                            className="dashboard-card primary"
                            onClick={() => navigate("/hod/approvals")}
                            style={{ cursor: "pointer" }}
                        >
                            <h3>Pending Registration Requests</h3>
                            <p>{pendingProfessorsCount}</p>
                        </div>

                        <div
                            className="dashboard-card success"
                            onClick={() => navigate("/hod/professors")}
                            style={{ cursor: "pointer" }}
                        >
                            <h3>Department Professors</h3>
                            <p>{deptProfessorsCount}</p>
                        </div>

                        <div
                            className="dashboard-card info"
                            onClick={() => navigate("/hod/students")}
                            style={{ cursor: "pointer" }}
                        >
                            <h3>Department Enrolled Students</h3>
                            <p>{deptStudentsCount}</p>
                        </div>

                        <div
                            className="dashboard-card warning"
                            onClick={() => navigate("/professor/past-exams")}
                            style={{ cursor: "pointer" }}
                        >
                            <h3>My Submitted Papers</h3>
                            <p>{submissions.length}</p>
                        </div>
                    </div>

                    {/* REUSED SUBMITTED PAPERS SECTION FROM PROFESSOR DASHBOARD */}
                    <section className="dashboard-section">
                        <div className="section-header">
                            <h2>📝 Submitted Student Answer Papers (Exams Created by You)</h2>
                        </div>
                        <p className="section-sub">Inspect individual student answer sheets, question responses, and scores.</p>

                        {loadingSubmissions ? (
                            <div className="empty-state">Loading student submissions...</div>
                        ) : submissions.length === 0 ? (
                            <div className="empty-state">
                                <p>No student submissions received yet for your exams.</p>
                            </div>
                        ) : (
                            <div className="exam-table-container">
                                <table className="exam-table">
                                    <thead>
                                        <tr>
                                            <th>Student Name</th>
                                            <th>Enrollment</th>
                                            <th>Batch</th>
                                            <th>Exam Title</th>
                                            <th>Subject</th>
                                            <th>Score</th>
                                            <th>Percentage</th>
                                            <th>Submitted At</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {submissions.map((sub, idx) => (
                                            <tr key={idx}>
                                                <td className="font-semibold">{sub.studentName}</td>
                                                <td>{sub.enrollmentNumber || "N/A"}</td>
                                                <td><span className="badge badge-batch">{sub.studentBatch || sub.examBatch}</span></td>
                                                <td>{sub.examTitle}</td>
                                                <td>{sub.subject}</td>
                                                <td className="font-semibold">{sub.marksObtained} / {sub.totalMarks}</td>
                                                <td>
                                                    <span className={`status-tag status-${(sub.status || "").toLowerCase()}`}>
                                                        {sub.percentage}% ({sub.status})
                                                    </span>
                                                </td>
                                                <td>{formatDate(sub.submittedAt)}</td>
                                                <td>
                                                    <button
                                                        className="publish-action-btn"
                                                        style={{ background: "#2563eb" }}
                                                        onClick={() => setSelectedPaperData({ examId: sub.examId, studentId: sub.studentId })}
                                                    >
                                                        Inspect Answer Paper 🔍
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    {/* REUSED ALL CREATED EXAMS SECTION */}
                    {dashboard && dashboard.recentExams && (
                        <section className="dashboard-section">
                            <div className="section-header">
                                <h2>All Created Department Exams & Drafts</h2>
                            </div>
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
                        </section>
                    )}
                </main>
            </div>

            {selectedPaperData && (
                <StudentAnswerPaperModal
                    professorId={hodId}
                    examId={selectedPaperData.examId}
                    studentId={selectedPaperData.studentId}
                    onClose={() => setSelectedPaperData(null)}
                />
            )}
        </div>
    );
}

export default HodDashboard;
