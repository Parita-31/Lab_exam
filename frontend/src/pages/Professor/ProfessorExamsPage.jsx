import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import { publishExam } from "../../Service/examService";
import {
    getExamCategory,
    formatExamDate,
    formatExamTime,
    getTimeStatusText
} from "../../utils/examUtils";
import "../ExamsPage.css";

function ProfessorExamsPage({ defaultCategory = "UPCOMING" }) {
    const navigate = useNavigate();
    const location = useLocation();

    // Determine tab category based on URL or prop
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
    const [selectedBatch, setSelectedBatch] = useState("ALL");
    const [publishingId, setPublishingId] = useState(null);

    // Selected exam for modal viewer
    const [selectedExamDetails, setSelectedExamDetails] = useState(null);

    useEffect(() => {
        setActiveTab(getInitialCategory());
    }, [location.pathname]);

    const fetchExams = () => {
        try {
            const storedUser = localStorage.getItem("user");
            if (!storedUser) {
                setError("User is not logged in");
                setLoading(false);
                return;
            }

            const user = JSON.parse(storedUser);
            const professorId = user.id || user.userId;

            if (!professorId) {
                setError("Professor ID is missing");
                setLoading(false);
                return;
            }

            setLoading(true);

            // Fetch all exams for professor to categorize dynamically
            fetch(`http://localhost:8080/api/professor/${professorId}/exams?status=ALL`, {
                headers: {
                    "Content-Type": "application/json",
                    ...(user.token ? { Authorization: `Bearer ${user.token}` } : {})
                }
            })
                .then((res) => {
                    if (!res.ok) throw new Error("Failed to load exams");
                    return res.json();
                })
                .then((data) => {
                    setAllExams(data || []);
                })
                .catch((err) => {
                    console.error("Fetch exams error:", err);
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
        fetchExams();
    }, []);

    const handlePublishClick = async (examId) => {
        if (!window.confirm("Are you sure you want to publish this exam? Students will be able to view and attempt it.")) {
            return;
        }

        try {
            setPublishingId(examId);
            await publishExam(examId);
            alert("Exam published successfully!");
            fetchExams();
        } catch (err) {
            alert(err.message || "Failed to publish exam.");
        } finally {
            setPublishingId(null);
        }
    };

    const handleViewExamDetails = (examId) => {
        fetch(`http://localhost:8080/api/student/exams/${examId}`)
            .then((res) => res.json())
            .then((data) => {
                setSelectedExamDetails(data);
            })
            .catch((err) => {
                alert("Error loading details: " + err.message);
            });
    };

    // Categorize exams
    const upcomingExams = allExams.filter((e) => e.status === "PUBLISHED" && getExamCategory(e) === "UPCOMING");
    const activeExams = allExams.filter((e) => e.status === "PUBLISHED" && getExamCategory(e) === "ACTIVE");
    const pastExams = allExams.filter((e) => e.status === "COMPLETED" || getExamCategory(e) === "PAST");
    const draftExams = allExams.filter((e) => e.status === "DRAFT");

    // Filter displayed list based on active tab, search, and batch
    const getDisplayedExams = () => {
        let baseList = [];
        if (activeTab === "UPCOMING") baseList = upcomingExams;
        else if (activeTab === "ACTIVE") baseList = activeExams;
        else if (activeTab === "PAST") baseList = pastExams;
        else if (activeTab === "DRAFT") baseList = draftExams;
        else baseList = allExams;

        return baseList.filter((exam) => {
            const matchesSearch =
                (exam.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (exam.subject || "").toLowerCase().includes(searchQuery.toLowerCase());

            const matchesBatch = selectedBatch === "ALL" || exam.batch === selectedBatch;

            return matchesSearch && matchesBatch;
        });
    };

    // Extract unique batches for filter dropdown
    const availableBatches = Array.from(new Set(allExams.map((e) => e.batch).filter(Boolean)));

    const displayedExams = getDisplayedExams();

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f1f5f9" }}>
            <Navbar />

            <div style={{ display: "flex", flex: 1 }}>
                <Sidebar role="PROFESSOR" />

                <main className="exams-content-body">
                    {/* PAGE HEADER */}
                    <div className="exams-header">
                        <div className="exams-header-info">
                            <h1>
                                {activeTab === "UPCOMING" && "Upcoming Examinations"}
                                {activeTab === "ACTIVE" && "Active Examinations"}
                                {activeTab === "PAST" && "Past & Completed Examinations"}
                                {activeTab === "DRAFT" && "Draft Examinations"}
                                {activeTab === "ALL" && "All Created Exams"}
                                <span className={`category-tag-header ${activeTab.toLowerCase()}`}>
                                    {activeTab}
                                </span>
                            </h1>
                            <p>
                                {activeTab === "UPCOMING" && "Exams scheduled for upcoming dates and times."}
                                {activeTab === "ACTIVE" && "Exams currently live and running for students today."}
                                {activeTab === "PAST" && "Exams that have completed or expired."}
                                {activeTab === "DRAFT" && "Unpublished exam drafts awaiting publication."}
                                {activeTab === "ALL" && "Comprehensive list of all professor created exams."}
                            </p>
                        </div>

                        <button
                            className="action-btn-primary"
                            onClick={() => navigate("/professor/create-exam")}
                        >
                            + Create New Exam
                        </button>
                    </div>

                    {/* CATEGORY TAB BAR */}
                    <div className="exam-tabs-bar">
                        <button
                            className={`exam-tab-btn ${activeTab === "UPCOMING" ? "active" : ""}`}
                            onClick={() => {
                                setActiveTab("UPCOMING");
                                navigate("/professor/upcoming-exams");
                            }}
                        >
                            Upcoming Exams
                            <span className="tab-count-badge">{upcomingExams.length}</span>
                        </button>

                        <button
                            className={`exam-tab-btn ${activeTab === "ACTIVE" ? "active" : ""}`}
                            onClick={() => {
                                setActiveTab("ACTIVE");
                                navigate("/professor/active-exams");
                            }}
                        >
                            Active Exams
                            <span className="tab-count-badge">{activeExams.length}</span>
                        </button>

                        <button
                            className={`exam-tab-btn ${activeTab === "PAST" ? "active" : ""}`}
                            onClick={() => {
                                setActiveTab("PAST");
                                navigate("/professor/past-exams");
                            }}
                        >
                            Past Exams
                            <span className="tab-count-badge">{pastExams.length}</span>
                        </button>

                        <button
                            className={`exam-tab-btn ${activeTab === "DRAFT" ? "active" : ""}`}
                            onClick={() => setActiveTab("DRAFT")}
                        >
                            Drafts
                            <span className="tab-count-badge">{draftExams.length}</span>
                        </button>

                        <button
                            className={`exam-tab-btn ${activeTab === "ALL" ? "active" : ""}`}
                            onClick={() => setActiveTab("ALL")}
                        >
                            All Exams
                            <span className="tab-count-badge">{allExams.length}</span>
                        </button>
                    </div>

                    {/* SEARCH & FILTERS BAR */}
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

                        {availableBatches.length > 0 && (
                            <select
                                className="batch-filter-select"
                                value={selectedBatch}
                                onChange={(e) => setSelectedBatch(e.target.value)}
                            >
                                <option value="ALL">All Batches</option>
                                {availableBatches.map((b) => (
                                    <option key={b} value={b}>
                                        Batch: {b}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* CONTENT BODY */}
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
                            <div className="empty-icon">📋</div>
                            <h3>No {activeTab.toLowerCase()} exams found</h3>
                            <p>
                                {searchQuery || selectedBatch !== "ALL"
                                    ? "No exams match your search filters."
                                    : `There are currently no ${activeTab.toLowerCase()} exams available.`}
                            </p>
                            {activeTab === "DRAFT" || activeTab === "UPCOMING" ? (
                                <button
                                    className="action-btn-primary"
                                    onClick={() => navigate("/professor/create-exam")}
                                    style={{ margin: "0 auto", display: "inline-flex" }}
                                >
                                    + Create Exam Now
                                </button>
                            ) : null}
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
                                                    {category}
                                                </span>
                                            </div>

                                            <div className={`time-status-banner ${category.toLowerCase()}`}>
                                                ⏱ {statusText}
                                            </div>

                                            <div className="exam-meta-grid">
                                                <div className="meta-item">
                                                    <span className="meta-label">Target Batch</span>
                                                    <span className="meta-value">{exam.batch || "All"}</span>
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
                                            {exam.status === "DRAFT" ? (
                                                <button
                                                    className="action-btn-primary"
                                                    disabled={publishingId === exam.id}
                                                    onClick={() => handlePublishClick(exam.id)}
                                                >
                                                    {publishingId === exam.id ? "Publishing..." : "Publish Exam"}
                                                </button>
                                            ) : (
                                                <button
                                                    className="action-btn-primary"
                                                    onClick={() => handleViewExamDetails(exam.id)}
                                                >
                                                    View Details & Schedule
                                                </button>
                                            )}
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
                                <div><strong>Status:</strong> <span className="status-tag status-published">{selectedExamDetails.status}</span></div>
                                <div><strong>Questions Count:</strong> {selectedExamDetails.questionCount || (selectedExamDetails.questions ? selectedExamDetails.questions.length : 0)}</div>
                                <div><strong>Students Appeared:</strong> {selectedExamDetails.studentsAppeared || 0}</div>
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
                                                        <li key={oIdx} className={opt.correct ? "correct-opt" : ""}>
                                                            <strong>{opt.label}:</strong> {opt.text} {opt.correct ? "✓ (Correct)" : ""}
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
                            <button className="action-btn-secondary" onClick={() => setSelectedExamDetails(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProfessorExamsPage;
