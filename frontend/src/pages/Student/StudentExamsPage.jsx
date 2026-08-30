import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import TakeExamModal from "../../components/TakeExamModal";
import {
    getExamCategory,
    formatExamDate,
    formatExamTime,
    getTimeStatusText
} from "../../utils/examUtils";
import "../ExamsPage.css";

function StudentExamsPage({ defaultCategory = "UPCOMING" }) {
    const navigate = useNavigate();
    const location = useLocation();

    const getInitialCategory = () => {
        const path = location.pathname;
        if (path.includes("upcoming-exams")) return "UPCOMING";
        if (path.includes("active-exams")) return "ACTIVE";
        if (path.includes("past-exams")) return "PAST";
        return defaultCategory;
    };

    const [activeTab, setActiveTab] = useState(getInitialCategory());
    const [allExams, setAllExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [studentData, setStudentData] = useState(null);

    const [selectedExamDetails, setSelectedExamDetails] = useState(null);
    const [activeAttemptExamId, setActiveAttemptExamId] = useState(null);

    useEffect(() => {
        setActiveTab(getInitialCategory());
    }, [location.pathname]);

    const fetchStudentExams = () => {
        try {
            const storedUser = localStorage.getItem("user");
            if (!storedUser) {
                setError("User is not logged in");
                setLoading(false);
                return;
            }

            const user = JSON.parse(storedUser);
            const studentId = user.id || user.userId;

            if (!studentId) {
                setError("Student ID is missing");
                setLoading(false);
                return;
            }

            setStudentData(user);
            setLoading(true);

            fetch(`http://localhost:8080/api/student/${studentId}/exams?status=ALL`)
                .then((res) => {
                    if (!res.ok) throw new Error("Failed to fetch student exams");
                    return res.json();
                })
                .then((data) => {
                    setAllExams(data || []);
                })
                .catch((err) => {
                    console.error("Student exams fetch error:", err);
                    setError(err.message);
                })
                .finally(() => {
                    setLoading(false);
                });
        } catch (err) {
            setError("Invalid user state");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudentExams();
    }, []);

    const handleViewExamDetails = (examId) => {
        fetch(`http://localhost:8080/api/student/exams/${examId}`)
            .then((res) => res.json())
            .then((data) => {
                setSelectedExamDetails(data);
            })
            .catch((err) => {
                alert("Error loading exam details: " + err.message);
            });
    };

    const handleStartExam = (examId) => {
        setSelectedExamDetails(null);
        setActiveAttemptExamId(examId);
    };

    const upcomingExams = allExams.filter((e) => getExamCategory(e) === "UPCOMING");
    const activeExams = allExams.filter((e) => getExamCategory(e) === "ACTIVE");
    const pastExams = allExams.filter((e) => getExamCategory(e) === "PAST");

    const getDisplayedExams = () => {
        let baseList = [];
        if (activeTab === "UPCOMING") baseList = upcomingExams;
        else if (activeTab === "ACTIVE") baseList = activeExams;
        else if (activeTab === "PAST") baseList = pastExams;
        else baseList = allExams;

        return baseList.filter((exam) => {
            return (
                (exam.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (exam.subject || "").toLowerCase().includes(searchQuery.toLowerCase())
            );
        });
    };

    const displayedExams = getDisplayedExams();

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f1f5f9" }}>
            <Navbar user={studentData} />

            <div style={{ display: "flex", flex: 1 }}>
                <Sidebar role="STUDENT" />

                <main className="exams-content-body">
                    <div className="exams-header">
                        <div className="exams-header-info">
                            <h1>
                                {activeTab === "UPCOMING" && "Upcoming Scheduled Exams"}
                                {activeTab === "ACTIVE" && "Active Exams Available Today"}
                                {activeTab === "PAST" && "Past & Completed Exams"}
                                {activeTab === "ALL" && "All Batch Examinations"}
                                <span className={`category-tag-header ${activeTab.toLowerCase()}`}>
                                    {activeTab}
                                </span>
                            </h1>
                            <p>
                                {activeTab === "UPCOMING" && "Exams scheduled for upcoming dates and start times."}
                                {activeTab === "ACTIVE" && "Exams currently open and available for attempt."}
                                {activeTab === "PAST" && "Past examinations that have concluded."}
                                {activeTab === "ALL" && "Complete list of examinations assigned to your batch."}
                            </p>
                        </div>
                    </div>

                    <div className="exam-tabs-bar">
                        <button
                            className={`exam-tab-btn ${activeTab === "UPCOMING" ? "active" : ""}`}
                            onClick={() => {
                                setActiveTab("UPCOMING");
                                navigate("/student/upcoming-exams");
                            }}
                        >
                            Upcoming Exams
                            <span className="tab-count-badge">{upcomingExams.length}</span>
                        </button>

                        <button
                            className={`exam-tab-btn ${activeTab === "ACTIVE" ? "active" : ""}`}
                            onClick={() => {
                                setActiveTab("ACTIVE");
                                navigate("/student/active-exams");
                            }}
                        >
                            Active Exams
                            <span className="tab-count-badge">{activeExams.length}</span>
                        </button>

                        <button
                            className={`exam-tab-btn ${activeTab === "PAST" ? "active" : ""}`}
                            onClick={() => {
                                setActiveTab("PAST");
                                navigate("/student/past-exams");
                            }}
                        >
                            Past Exams
                            <span className="tab-count-badge">{pastExams.length}</span>
                        </button>

                        <button
                            className={`exam-tab-btn ${activeTab === "ALL" ? "active" : ""}`}
                            onClick={() => setActiveTab("ALL")}
                        >
                            All Batch Exams
                            <span className="tab-count-badge">{allExams.length}</span>
                        </button>
                    </div>

                    <div className="exams-controls-bar">
                        <div className="search-input-wrapper">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder="Search by exam title or subject..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="empty-exams-container">
                            <p>Loading examinations...</p>
                        </div>
                    ) : error ? (
                        <div className="empty-exams-container">
                            <h3>Error Loading Data</h3>
                            <p>{error}</p>
                        </div>
                    ) : displayedExams.length === 0 ? (
                        <div className="empty-exams-container">
                            <div className="empty-icon">📝</div>
                            <h3>No {activeTab.toLowerCase()} exams found</h3>
                            <p>
                                {searchQuery
                                    ? "No exams match your search query."
                                    : `There are currently no ${activeTab.toLowerCase()} exams scheduled for your batch.`}
                            </p>
                        </div>
                    ) : (
                        <div className="exam-cards-grid">
                            {displayedExams.map((exam) => {
                                const category = getExamCategory(exam);
                                const statusText = getTimeStatusText(exam);

                                return (
                                    <div
                                        key={exam.id}
                                        className={`exam-card-item ${category === "ACTIVE" ? "active-exam-card" : ""}`}
                                    >
                                        <div>
                                            <div className="exam-card-header">
                                                <div>
                                                    <h3 className="exam-card-title">{exam.title}</h3>
                                                    <p className="exam-card-subject">{exam.subject}</p>
                                                </div>
                                                <span className={`status-pill status-${category.toLowerCase()}`}>
                                                    {category === "ACTIVE" ? "LIVE NOW" : category}
                                                </span>
                                            </div>

                                            <div className={`time-status-banner ${category.toLowerCase()}`}>
                                                ⏱ {statusText}
                                            </div>

                                            <div className="exam-meta-grid">
                                                <div className="meta-item">
                                                    <span className="meta-label">Batch</span>
                                                    <span className="meta-value">{exam.batch}</span>
                                                </div>

                                                <div className="meta-item">
                                                    <span className="meta-label">Date & Time</span>
                                                    <span className="meta-value">
                                                        {formatExamDate(exam.examDate)} at {formatExamTime(exam.startTime)}
                                                    </span>
                                                </div>

                                                <div className="meta-item">
                                                    <span className="meta-label">Duration</span>
                                                    <span className="meta-value">{exam.durationMinutes} Mins</span>
                                                </div>

                                                <div className="meta-item">
                                                    <span className="meta-label">Total Marks</span>
                                                    <span className="meta-value">{exam.totalMarks} Marks</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="card-actions-wrapper">
                                            {category === "ACTIVE" ? (
                                                <button
                                                    className="action-btn-primary btn-start-live"
                                                    onClick={() => handleStartExam(exam.id)}
                                                >
                                                    Start Exam Now →
                                                </button>
                                            ) : null}

                                            <button
                                                className="action-btn-secondary"
                                                onClick={() => handleViewExamDetails(exam.id)}
                                            >
                                                View Complete Details
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>

            {/* EXAM DETAILS MODAL */}
            {selectedExamDetails && (
                <div className="modal-overlay" onClick={() => setSelectedExamDetails(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{selectedExamDetails.title}</h2>
                            <button className="modal-close-btn" onClick={() => setSelectedExamDetails(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="details-grid">
                                <div><strong>Subject:</strong> {selectedExamDetails.subject}</div>
                                <div><strong>Batch:</strong> {selectedExamDetails.batch}</div>
                                <div><strong>Semester:</strong> {selectedExamDetails.semester || 1}</div>
                                <div><strong>Exam Date:</strong> {formatExamDate(selectedExamDetails.examDate)}</div>
                                <div><strong>Start Time:</strong> {formatExamTime(selectedExamDetails.startTime)}</div>
                                <div><strong>Duration:</strong> {selectedExamDetails.durationMinutes} Minutes</div>
                                <div><strong>Total Marks:</strong> {selectedExamDetails.totalMarks}</div>
                                <div><strong>Professor:</strong> {selectedExamDetails.professorName || "Faculty"}</div>
                                <div><strong>Questions Count:</strong> {selectedExamDetails.questionCount || (selectedExamDetails.questions ? selectedExamDetails.questions.length : 0)}</div>
                            </div>

                            {selectedExamDetails.questions && selectedExamDetails.questions.length > 0 && (
                                <div className="modal-questions-section">
                                    <h3>Exam Questions Overview ({selectedExamDetails.questions.length} Questions)</h3>
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
                            {getExamCategory(selectedExamDetails) === "ACTIVE" && (
                                <button
                                    className="action-btn-primary btn-start-live"
                                    onClick={() => handleStartExam(selectedExamDetails.id)}
                                >
                                    Start Exam Now →
                                </button>
                            )}
                            <button className="action-btn-secondary" onClick={() => setSelectedExamDetails(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* LIVE EXAM ATTEMPT MODAL */}
            {activeAttemptExamId && studentData && (
                <TakeExamModal
                    examId={activeAttemptExamId}
                    studentId={studentData.id || studentData.userId}
                    onClose={() => setActiveAttemptExamId(null)}
                    onExamCompleted={() => {
                        fetchStudentExams();
                    }}
                />
            )}
        </div>
    );
}

export default StudentExamsPage;
