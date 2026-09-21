import { useLocation, useNavigate } from "react-router-dom";
import "./ReviewQue.css";

import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

function ReviewQue() {
    const location = useLocation();
    const navigate = useNavigate();

    const examDetails = location.state?.examDetails || {};
    const generatorSettings = location.state?.generatorSettings || {};
    const generatedQuestions = location.state?.generatedQuestions?.questions || [];

    const topics = generatorSettings.topics || [];
    const numberOfSets = generatorSettings.numberOfSets || 0;

    return (
        <div className="review-page">
            <Navbar />

            <div className="review-layout">
                <Sidebar role="PROFESSOR" />

                <main className="review-content">
                    <div className="review-container">

                        {/* HEADER */}
                        <div className="review-header">
                            <button
                                className="back-button"
                                onClick={() =>
                                    navigate("/professor/create-exam/ai", {
                                        state: examDetails
                                    })
                                }
                            >
                                ← Back
                            </button>

                            <div>
                                <h1>Review Question Sets</h1>
                                <p>
                                    Review the generated question sets before
                                    saving the exam.
                                </p>
                            </div>
                        </div>

                        {/* EXAM INFORMATION */}
                        <div className="review-card">
                            <h2>Exam Information</h2>

                            <div className="exam-details-grid">
                                <div>
                                    <span>Subject</span>
                                    <strong>
                                        {examDetails.subject || "Not selected"}
                                    </strong>
                                </div>

                                <div>
                                    <span>Batch</span>
                                    <strong>
                                        {examDetails.batch || "Not selected"}
                                    </strong>
                                </div>

                                <div>
                                    <span>Semester</span>
                                    <strong>
                                        {examDetails.semester || "Not selected"}
                                    </strong>
                                </div>

                                <div>
                                    <span>Question Sets</span>
                                    <strong>{numberOfSets}</strong>
                                </div>

                                <div>
                                    <span>Questions / Set</span>
                                    <strong>{topics.length}</strong>
                                </div>

                                <div>
                                    <span>Total Marks</span>
                                    <strong>
                                        {examDetails.totalMarks || "Not selected"}
                                    </strong>
                                </div>
                            </div>
                        </div>

                        {/* GENERATED SETS */}
                        <div className="sets-section">
                            <div className="section-heading">
                                <div>
                                    <h2>Generated Question Sets</h2>
                                    <p>
                                        Each set contains one question from
                                        every selected topic.
                                    </p>
                                </div>
                            </div>

                            {Array.from(
                                { length: numberOfSets },
                                (_, setIndex) => (
                                    <div
                                        className="question-set-card"
                                        key={setIndex}
                                    >
                                        <div className="set-header">
                                            <h3>
                                                Question Set {setIndex + 1}
                                            </h3>

                                            <span>
                                                {topics.length} Questions
                                            </span>
                                        </div>

                                        {topics.map((topic, topicIndex) => (
                                            <div
                                                className="question-card"
                                                key={topicIndex}
                                            >
                                                <div className="question-top">
                                                    <strong>
                                                        Q{topicIndex + 1}.{" "}
                                                        {topic.name}
                                                    </strong>

                                                    <div className="question-tags">
                                                        <span>
                                                            {topic.questionType}
                                                        </span>

                                                        <span>
                                                            {topic.difficulty}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="question-placeholder">
                                                    {(() => {
                                                        const generatedQuestion = generatedQuestions.find(
                                                            (question) =>
                                                                question.setNumber === setIndex + 1 &&
                                                                question.topic === topic.name
                                                        );

                                                        if (!generatedQuestion) {
                                                            return (
                                                                <p>
                                                                    Question could not be generated.
                                                                </p>
                                                            );
                                                        }

                                                        return (
                                                            <>
                                                                <p>
                                                                    {generatedQuestion.question}
                                                                </p>

                                                                <small>
                                                                    Type: {generatedQuestion.questionType}
                                                                    {" • "}
                                                                    Difficulty: {generatedQuestion.difficulty}
                                                                </small>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}
                        </div>

                        {/* ACTIONS */}
                        <div className="review-actions">
                            <button
                                className="secondary-button"
                                onClick={() =>
                                    navigate("/professor/create-exam/ai", {
                                        state: examDetails
                                    })
                                }
                            >
                                ← Modify Configuration
                            </button>

                            <button className="primary-button">
                                Save Exam
                            </button>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
}

export default ReviewQue;