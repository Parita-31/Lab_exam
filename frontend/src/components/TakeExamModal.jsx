
import { useState, useEffect, useRef } from "react";
import "./TakeExamModal.css";

function TakeExamModal({ examId, studentId, onClose, onExamCompleted }) {
    const [examData, setExamData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [userAnswers, setUserAnswers] = useState({}); // { [questionIdx]: selectedAnswer }
    const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);

    const [submitting, setSubmitting] = useState(false);
    const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
    const [submissionResult, setSubmissionResult] = useState(null);

    // Anti-cheating / Tab-switching state
    const [warningCount, setWarningCount] = useState(0);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [autoSubmittedDueToCheating, setAutoSubmittedDueToCheating] = useState(false);

    // Refs to track current state inside event listeners without stale closures
    const warningCountRef = useRef(0);
    const isSubmittingRef = useRef(false);
    const hasSubmittedRef = useRef(false);

    // Normalize valid student ID from props or localStorage fallback
    const getResolvedStudentId = () => {
        if (studentId) return studentId;
        try {
            const stored = JSON.parse(localStorage.getItem("user") || "{}");
            return stored.userId || stored.id;
        } catch (e) {
            return null;
        }
    };

    const activeStudentId = getResolvedStudentId();

    // Fetch exam details and start attempt
    useEffect(() => {
        if (!examId || !activeStudentId) {
            setError("Missing exam or student ID.");
            setLoading(false);
            return;
        }

        setLoading(true);
        fetch(`http://localhost:8080/api/student/exams/${examId}/start?studentId=${activeStudentId}`, {
            method: "POST"
        })
            .then(async (res) => {
                if (!res.ok) {
                    let msg = "Failed to initialize exam session.";
                    try {
                        const errJson = await res.json();
                        if (errJson.message) msg = errJson.message;
                    } catch (e) { }
                    throw new Error(msg);
                }
                return res.json();
            })
            .then((data) => {
                setExamData(data);
                const duration = data.durationMinutes || 60;
                setTimeLeftSeconds(duration * 60);
            })
            .catch((err) => {
                console.error("Error starting exam:", err);
                setError(err.message || "Failed to start exam.");
            })
            .finally(() => {
                setLoading(false);
            });
    }, [examId, activeStudentId]);

    // Timer countdown effect
    useEffect(() => {
        if (timeLeftSeconds <= 0 || submissionResult || !examData) return;

        const timer = setInterval(() => {
            setTimeLeftSeconds((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleFinalSubmit(false, "Time Expired");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeftSeconds, submissionResult, examData]);

    // Tab switching anti-cheating detection (Strictly document.hidden on tab switch)
    useEffect(() => {
        if (!examData || hasSubmittedRef.current || isSubmittingRef.current) return;

        const handleVisibilityChange = () => {
            if (document.hidden && !hasSubmittedRef.current && !isSubmittingRef.current) {
                processTabSwitchViolation();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [examData]);

    const processTabSwitchViolation = () => {
        if (hasSubmittedRef.current || isSubmittingRef.current) return;

        const newCount = warningCountRef.current + 1;
        warningCountRef.current = newCount;
        setWarningCount(newCount);

        if (newCount <= 2) {
            setShowWarningModal(true);
        } else {
            // Exceeded max warnings (3rd violation) -> Force auto submit immediately
            setAutoSubmittedDueToCheating(true);
            setShowWarningModal(false);
            setShowConfirmSubmit(false);
            handleFinalSubmit(true, "Cheating Prevention: Exceeded Tab-Switching Limit");
        }
    };

    const formatTimer = (totalSecs) => {
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    const handleOptionSelect = (qIdx, answerValue) => {
        setUserAnswers((prev) => ({
            ...prev,
            [qIdx]: answerValue
        }));
    };

    const handleFinalSubmit = (isCheating = false, submitReason = "") => {
        if (isSubmittingRef.current || hasSubmittedRef.current) return;

        isSubmittingRef.current = true;
        hasSubmittedRef.current = true;
        setSubmitting(true);
        setShowConfirmSubmit(false);
        setShowWarningModal(false);

        const payload = {
            studentId: activeStudentId,
            examId: examId,
            answers: userAnswers
        };

        fetch(`http://localhost:8080/api/student/exams/${examId}/submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
            .then(async (res) => {
                if (!res.ok) {
                    let msg = "Failed to submit exam.";
                    try {
                        const errData = await res.json();
                        if (errData.message) msg = errData.message;
                    } catch (e) { }
                    throw new Error(msg);
                }
                return res.json();
            })
            .then((result) => {
                if (isCheating) {
                    result.message = "EXAM TERMINATED & AUTO-SUBMITTED DUE TO CHEATING PREVENTATIVE POLICY (Exceeded 2 Tab-Switching Warnings).";
                } else if (submitReason) {
                    result.message = `Exam submitted (${submitReason}).`;
                }
                setSubmissionResult(result);
                if (onExamCompleted) {
                    onExamCompleted();
                }
            })
            .catch((err) => {
                console.error("Submission error:", err);
                alert("Error submitting exam: " + err.message);
                isSubmittingRef.current = false;
                hasSubmittedRef.current = false;
            })
            .finally(() => {
                setSubmitting(false);
            });
    };

    if (loading) {
        return (
            <div className="take-exam-overlay">
                <div className="take-exam-loading">
                    <div className="loading-spinner-ring"></div>
                    <h2>Preparing Live Examination...</h2>
                    <p>Fetching questions, starting timer, and activating anti-cheating protection.</p>
                </div>
            </div>
        );
    }

    if (error || !examData) {
        return (
            <div className="take-exam-overlay">
                <div className="take-exam-error-card">
                    <h2>Unable to Start Exam</h2>
                    <p>{error || "Exam data could not be loaded."}</p>
                    <button className="take-exam-btn-secondary" onClick={onClose}>
                        Close Window
                    </button>
                </div>
            </div>
        );
    }

    const questions = examData.questions || [];
    const currentQ = questions[currentQuestionIdx];
    const answeredCount = Object.keys(userAnswers).length;

    // Show Results Summary after submission
    if (submissionResult) {
        return (
            <div className="take-exam-overlay">
                <div className="exam-result-card">
                    {autoSubmittedDueToCheating ? (
                        <div className="cheating-banner">
                            ⛔ EXAM TERMINATED FOR CHEATING VIOLATION (EXCEEDED 2 TAB SWITCHES)
                        </div>
                    ) : null}

                    <div className="result-header">
                        <div className="result-icon-badge">{autoSubmittedDueToCheating ? "🚨" : "🎉"}</div>
                        <h2>{autoSubmittedDueToCheating ? "Exam Auto-Submitted" : "Exam Submitted Successfully!"}</h2>
                        <p>{examData.title} • {examData.subject}</p>
                    </div>

                    <div className="result-stats-grid">
                        <div className="stat-box">
                            <span className="stat-label">Marks Obtained</span>
                            <span className="stat-value highlight">{submissionResult.marksObtained} / {submissionResult.totalMarks}</span>
                        </div>
                        <div className="stat-box">
                            <span className="stat-label">Score Percentage</span>
                            <span className="stat-value">{submissionResult.percentage}%</span>
                        </div>
                        <div className="stat-box">
                            <span className="stat-label">Result Status</span>
                            <span className={`status-pill status-${(submissionResult.status || "").toLowerCase()}`}>
                                {submissionResult.status}
                            </span>
                        </div>
                    </div>

                    <p className="result-message">{submissionResult.message}</p>

                    <button
                        className="take-exam-btn-primary"
                        onClick={onClose}
                    >
                        Back to Student Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="take-exam-overlay">
            <div className="take-exam-container">
                {/* HEADER */}
                <header className="take-exam-header">
                    <div className="header-info">
                        <h2>{examData.title}</h2>
                        <span>Subject: <strong>{examData.subject}</strong> | Batch: <strong>{examData.batch || "All"}</strong></span>
                    </div>

                    <div className="header-right-badges">
                        {/* TAB-SWITCH WARNING BADGE */}
                        <div className={`anti-cheat-badge ${warningCount > 0 ? "warning-active" : ""}`}>
                            <span className="shield-icon">🛡️</span>
                            <div className="badge-text-col">
                                <span className="badge-title">Anti-Cheat Warnings</span>
                                <span className="warning-count-text">{warningCount} / 2 Used</span>
                            </div>
                        </div>

                        {/* TIMER BADGE */}
                        <div className="timer-badge">
                            <span className="timer-icon">⏱</span>
                            <div className="timer-text">
                                <span className="timer-label">Time Remaining</span>
                                <span className={`timer-clock ${timeLeftSeconds < 300 ? "urgent" : ""}`}>
                                    {formatTimer(timeLeftSeconds)}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* MAIN EXAM BODY */}
                <div className="take-exam-body">
                    {/* LEFT PANEL: QUESTION DISPLAY */}
                    <div className="question-display-panel">
                        {currentQ ? (
                            <div className="question-content">
                                <div className="question-header-row">
                                    <span className="q-number-pill">Question {currentQuestionIdx + 1} of {questions.length}</span>
                                    <span className="q-marks-pill">{currentQ.marks || 1} Marks</span>
                                </div>

                                <h3 className="question-text">{currentQ.questionText}</h3>

                                {/* OPTIONS AREA */}
                                {currentQ.options && currentQ.options.length > 0 ? (
                                    <div className="options-list">
                                        {currentQ.options.map((opt, oIdx) => {
                                            const isSelected = userAnswers[currentQuestionIdx] === opt.optionLabel ||
                                                userAnswers[currentQuestionIdx] === opt.optionText;

                                            return (
                                                <div
                                                    key={oIdx}
                                                    className={`option-item ${isSelected ? "selected" : ""}`}
                                                    onClick={() => handleOptionSelect(currentQuestionIdx, opt.optionLabel || opt.optionText)}
                                                >
                                                    <span className="option-label">{opt.optionLabel || String.fromCharCode(65 + oIdx)}</span>
                                                    <span className="option-text">{opt.optionText}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-answer-box">
                                        <label>Type your answer below:</label>
                                        <textarea
                                            rows="4"
                                            placeholder="Enter your detailed response here..."
                                            value={userAnswers[currentQuestionIdx] || ""}
                                            onChange={(e) => handleOptionSelect(currentQuestionIdx, e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="empty-questions">No questions in this exam.</div>
                        )}

                        {/* BOTTOM ACTION CONTROLS */}
                        <footer className="question-controls">
                            <button
                                className="take-exam-btn-secondary"
                                disabled={currentQuestionIdx === 0}
                                onClick={() => setCurrentQuestionIdx((prev) => prev - 1)}
                            >
                                ← Previous
                            </button>

                            <button
                                className="take-exam-btn-clear"
                                onClick={() => {
                                    const copy = { ...userAnswers };
                                    delete copy[currentQuestionIdx];
                                    setUserAnswers(copy);
                                }}
                            >
                                Clear Answer
                            </button>

                            {currentQuestionIdx < questions.length - 1 ? (
                                <button
                                    className="take-exam-btn-primary"
                                    onClick={() => setCurrentQuestionIdx((prev) => prev + 1)}
                                >
                                    Next Question →
                                </button>
                            ) : (
                                <button
                                    className="take-exam-btn-submit"
                                    onClick={() => setShowConfirmSubmit(true)}
                                >
                                    Finish & Submit Exam
                                </button>
                            )}
                        </footer>
                    </div>

                    {/* RIGHT PANEL: QUESTION PALETTE */}
                    <div className="question-palette-panel">
                        <h3>Question Palette</h3>
                        <p className="palette-sub">Summary of your attempt</p>

                        <div className="palette-grid">
                            {questions.map((q, idx) => {
                                const isAnswered = userAnswers[idx] !== undefined && userAnswers[idx] !== "";
                                const isCurrent = currentQuestionIdx === idx;

                                return (
                                    <button
                                        key={idx}
                                        className={`palette-btn ${isAnswered ? "answered" : ""} ${isCurrent ? "current" : ""}`}
                                        onClick={() => setCurrentQuestionIdx(idx)}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="palette-legend">
                            <div className="legend-item"><span className="legend-box answered"></span> Answered ({answeredCount})</div>
                            <div className="legend-item"><span className="legend-box unanswered"></span> Unanswered ({questions.length - answeredCount})</div>
                            <div className="legend-item"><span className="legend-box current"></span> Current</div>
                        </div>

                        <div className="palette-submit-wrapper">
                            <button
                                className="take-exam-btn-submit full-width"
                                onClick={() => setShowConfirmSubmit(true)}
                            >
                                Submit Exam
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* TAB-SWITCHING WARNING MODAL */}
            {showWarningModal && (
                <div className="modal-overlay inner-confirm warning-overlay">
                    <div className="modal-content warning-box">
                        <div className="warning-icon-anim">⚠️</div>
                        <h2>TAB SWITCHING DETECTED!</h2>
                        <p className="warning-subtitle">
                            Warning <strong>{warningCount} of 2</strong> Issued
                        </p>
                        <div className="warning-notice-body">
                            <p>
                                Switching tabs, minimizing windows, or navigating away during an active exam is strictly prohibited to prevent cheating.
                            </p>
                            <p className="warning-alert-text">
                                {warningCount === 1 ? (
                                    "This is your FIRST warning. If you switch tabs 1 more time, your exam will be automatically submitted immediately!"
                                ) : (
                                    "🚨 THIS IS YOUR FINAL WARNING! Switching tabs one more time will cause your exam to be AUTOMATICALLY TERMINATED AND SUBMITTED FOR CHEATING!"
                                )}
                            </p>
                        </div>
                        <button
                            className="warning-acknowledge-btn"
                            onClick={() => setShowWarningModal(false)}
                        >
                            I Understand & Resume Exam
                        </button>
                    </div>
                </div>
            )}

            {/* CONFIRMATION SUBMIT DIALOG */}
            {showConfirmSubmit && (
                <div className="modal-overlay inner-confirm">
                    <div className="modal-content confirm-box">
                        <h3>Confirm Exam Submission</h3>
                        <p>Are you sure you want to submit your exam now?</p>
                        <div className="confirm-stats">
                            <p>Total Questions: <strong>{questions.length}</strong></p>
                            <p>Answered: <strong className="green-text">{answeredCount}</strong></p>
                            <p>Unanswered: <strong className="orange-text">{questions.length - answeredCount}</strong></p>
                        </div>
                        <div className="confirm-actions">
                            <button
                                className="take-exam-btn-secondary"
                                onClick={() => setShowConfirmSubmit(false)}
                                disabled={submitting}
                            >
                                Cancel & Continue Exam
                            </button>
                            <button
                                className="take-exam-btn-submit"
                                onClick={() => handleFinalSubmit(false, "Manual Student Submission")}
                                disabled={submitting}
                            >
                                {submitting ? "Submitting..." : "Yes, Submit Final Exam"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TakeExamModal;
