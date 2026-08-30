import { useState, useEffect } from "react";
import "./StudentAnswerPaperModal.css";

function StudentAnswerPaperModal({ professorId, examId, studentId, onClose }) {
    const [paper, setPaper] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!professorId || !examId || !studentId) return;

        setLoading(true);
        fetch(`http://localhost:8080/api/professor/${professorId}/exams/${examId}/student/${studentId}/paper`)
            .then((res) => {
                if (!res.ok) throw new Error("Failed to load student answer paper.");
                return res.json();
            })
            .then((data) => {
                setPaper(data);
            })
            .catch((err) => {
                console.error("Error fetching paper:", err);
                setError(err.message || "Failed to load answer sheet.");
            })
            .finally(() => {
                setLoading(false);
            });
    }, [professorId, examId, studentId]);

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        try {
            return new Date(dateStr).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short"
            });
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <div className="paper-modal-overlay" onClick={onClose}>
            <div className="paper-modal-container" onClick={(e) => e.stopPropagation()}>
                {/* MODAL HEADER */}
                <div className="paper-modal-header">
                    <div>
                        <h2>📄 Student Answer Sheet Inspection</h2>
                        <p>{paper ? `${paper.examTitle} (${paper.subject})` : "Loading exam paper..."}</p>
                    </div>
                    <button className="paper-close-btn" onClick={onClose}>×</button>
                </div>

                {/* MODAL BODY */}
                <div className="paper-modal-body">
                    {loading ? (
                        <div className="paper-loading">
                            <div className="paper-spinner"></div>
                            <p>Fetching complete student response log...</p>
                        </div>
                    ) : error ? (
                        <div className="paper-error">
                            <h3>Error Loading Answer Paper</h3>
                            <p>{error}</p>
                        </div>
                    ) : !paper ? (
                        <div className="paper-error">No paper data available.</div>
                    ) : (
                        <div className="paper-content-wrapper">
                            {/* STUDENT & EXAM SUMMARY BAR */}
                            <div className="paper-meta-banner">
                                <div className="student-profile-summary">
                                    <div className="student-avatar-badge">🎓</div>
                                    <div className="student-details-col">
                                        <h3>{paper.studentName}</h3>
                                        <p>Enrollment: <strong>{paper.enrollmentNumber || "N/A"}</strong> | Email: <strong>{paper.studentEmail}</strong></p>
                                        <p>Student Batch: <span className="badge badge-batch">{paper.studentBatch || "N/A"}</span></p>
                                    </div>
                                </div>

                                <div className="paper-score-card">
                                    <div className="score-stat-item">
                                        <span className="score-label">Marks Obtained</span>
                                        <span className="score-val highlight">{paper.marksObtained} / {paper.totalMarks}</span>
                                    </div>
                                    <div className="score-stat-item">
                                        <span className="score-label">Percentage</span>
                                        <span className="score-val">{paper.percentage}%</span>
                                    </div>
                                    <div className="score-stat-item">
                                        <span className="score-label">Result Status</span>
                                        <span className={`status-pill status-${(paper.resultStatus || "").toLowerCase()}`}>
                                            {paper.resultStatus}
                                        </span>
                                    </div>
                                    <div className="score-stat-item">
                                        <span className="score-label">Submitted At</span>
                                        <span className="score-time">{formatDate(paper.submittedAt)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* QUESTIONS & STUDENT ANSWERS BREAKDOWN */}
                            <div className="paper-questions-section">
                                <h3>Question-by-Question Detailed Breakdown ({paper.questions ? paper.questions.length : 0} Questions)</h3>

                                {paper.questions && paper.questions.length > 0 ? (
                                    paper.questions.map((q, idx) => (
                                        <div
                                            key={idx}
                                            className={`paper-q-card ${q.isCorrect ? "q-correct" : "q-incorrect"}`}
                                        >
                                            <div className="q-card-header">
                                                <div className="q-title-row">
                                                    <span className="q-number">Q{idx + 1}.</span>
                                                    <span className="q-text-title">{q.questionText}</span>
                                                </div>

                                                <div className="q-header-badges">
                                                    <span className="q-marks-tag">{q.marksAwarded} / {q.marks} Marks</span>
                                                    <span className={`q-status-pill ${q.isCorrect ? "correct" : "incorrect"}`}>
                                                        {q.isCorrect ? "✅ Correct" : "❌ Incorrect"}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* OPTIONS OR TEXT ANSWER */}
                                            {q.options && q.options.length > 0 ? (
                                                <div className="paper-options-grid">
                                                    {q.options.map((opt, oIdx) => {
                                                        const optLabel = opt.label || String.fromCharCode(65 + oIdx);
                                                        const isStudentChoice = q.submittedAnswer && (
                                                            q.submittedAnswer.equalsIgnoreCase?.(optLabel) ||
                                                            q.submittedAnswer.trim() === opt.text.trim() ||
                                                            q.submittedAnswer.startsWith(optLabel)
                                                        );

                                                        return (
                                                            <div
                                                                key={oIdx}
                                                                className={`paper-option-item ${opt.isCorrect ? "is-correct-opt" : ""} ${isStudentChoice ? "student-choice" : ""}`}
                                                            >
                                                                <span className="opt-label">{optLabel}</span>
                                                                <span className="opt-text">{opt.text}</span>

                                                                <div className="opt-tags">
                                                                    {isStudentChoice && (
                                                                        <span className="student-choice-tag">Student's Answer</span>
                                                                    )}
                                                                    {opt.isCorrect && (
                                                                        <span className="correct-opt-tag">Correct Answer</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="paper-text-response">
                                                    <div className="resp-row">
                                                        <strong>Student's Response:</strong>
                                                        <p className="submitted-text-box">{q.submittedAnswer || "No Response"}</p>
                                                    </div>
                                                    <div className="resp-row">
                                                        <strong>Expected / Correct Answer:</strong>
                                                        <p className="correct-text-box">{q.correctAnswer || "N/A"}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="no-questions">No response records found for this student.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="paper-modal-footer">
                    <button className="paper-btn-secondary" onClick={onClose}>
                        Close Answer Paper
                    </button>
                </div>
            </div>
        </div>
    );
}

export default StudentAnswerPaperModal;
