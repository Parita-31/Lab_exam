import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./AIExamGenerator.css";

import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

function AIExamGenerator() {

    const location = useLocation();
    const navigate = useNavigate();

    const examDetails = location.state || {};

    const [formData, setFormData] = useState({
        topic: "",
        numberOfQuestions: 10,
        questionTypes: [],
        difficulty: "MEDIUM",
        totalMarks: examDetails.totalMarks || 100,
        includeCoding: false,
        includeScenario: true
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {

        const { name, value, type, checked } = e.target;

        setFormData(previous => ({
            ...previous,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleQuestionType = (type) => {

        setFormData(previous => {

            const exists =
                previous.questionTypes.includes(type);

            return {
                ...previous,
                questionTypes: exists
                    ? previous.questionTypes.filter(
                        item => item !== type
                    )
                    : [...previous.questionTypes, type]
            };
        });
    };

    const handleGenerate = async (e) => {

        e.preventDefault();

        if (!formData.topic.trim()) {
            alert("Please enter the topic.");
            return;
        }

        if (formData.questionTypes.length === 0) {
            alert("Please select at least one question type.");
            return;
        }

        setLoading(true);

        /*
         * Backend AI API will be connected here later.
         *
         * Example:
         *
         * POST /api/professor/exams/generate
         */

        setTimeout(() => {

            setLoading(false);

            navigate(
                "/professor/create-exam/review",
                {
                    state: {
                        examDetails,
                        generatorSettings: formData
                    }
                }
            );

        }, 1000);
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f1f5f9" }}>
            <Navbar />
            <div style={{ display: "flex", flex: 1 }}>
                <Sidebar role="PROFESSOR" />
                <main className="dashboard-content" style={{ flex: 1 }}>
                    <div className="ai-generator-container">

                <div className="ai-generator-header">

                    <button
                        className="back-button"
                        onClick={() =>
                            navigate(
                                "/professor/create-exam",
                                {
                                    state: examDetails
                                }
                            )
                        }
                    >
                        ← Back
                    </button>

                    <div>
                        <h1>AI Exam Generator</h1>

                        <p>
                            Configure how AI should generate your
                            examination questions.
                        </p>
                    </div>

                </div>


                {/* EXAM INFORMATION */}

                <div className="exam-info-card">

                    <h2>Exam Information</h2>

                    <div className="exam-info-grid">

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
                            <span>Total Marks</span>
                            <strong>
                                {examDetails.totalMarks || "Not selected"}
                            </strong>
                        </div>

                    </div>

                </div>


                <form
                    className="ai-generator-form"
                    onSubmit={handleGenerate}
                >

                    {/* TOPIC */}

                    <div className="form-group">

                        <label>
                            Topic
                        </label>

                        <textarea
                            name="topic"
                            value={formData.topic}
                            onChange={handleChange}
                            placeholder={
                                "Example: Merge Sort, Binary Search, " +
                                "Time Complexity"
                            }
                            rows="4"
                            required
                        />

                        <small>
                            Enter one or more topics. You can also
                            describe the concept you want the AI to focus on.
                        </small>

                    </div>


                    {/* NUMBER */}

                    <div className="form-group">

                        <label>
                            Number of Questions
                        </label>

                        <input
                            type="number"
                            name="numberOfQuestions"
                            min="1"
                            max="100"
                            value={formData.numberOfQuestions}
                            onChange={handleChange}
                        />

                    </div>


                    {/* QUESTION TYPES */}

                    <div className="form-group">

                        <label>
                            Question Types
                        </label>

                        <div className="checkbox-grid">

                            <label>
                                <input
                                    type="checkbox"
                                    checked={formData.questionTypes.includes(
                                        "MCQ"
                                    )}
                                    onChange={() =>
                                        handleQuestionType("MCQ")
                                    }
                                />
                                Multiple Choice
                            </label>

                            <label>
                                <input
                                    type="checkbox"
                                    checked={formData.questionTypes.includes(
                                        "SHORT"
                                    )}
                                    onChange={() =>
                                        handleQuestionType("SHORT")
                                    }
                                />
                                Short Answer
                            </label>

                            <label>
                                <input
                                    type="checkbox"
                                    checked={formData.questionTypes.includes(
                                        "LONG"
                                    )}
                                    onChange={() =>
                                        handleQuestionType("LONG")
                                    }
                                />
                                Long Answer
                            </label>

                            <label>
                                <input
                                    type="checkbox"
                                    checked={formData.questionTypes.includes(
                                        "CODE"
                                    )}
                                    onChange={() =>
                                        handleQuestionType("CODE")
                                    }
                                />
                                Coding Question
                            </label>

                            <label>
                                <input
                                    type="checkbox"
                                    checked={formData.questionTypes.includes(
                                        "SCENARIO"
                                    )}
                                    onChange={() =>
                                        handleQuestionType("SCENARIO")
                                    }
                                />
                                Scenario Based
                            </label>

                            <label>
                                <input
                                    type="checkbox"
                                    checked={formData.questionTypes.includes(
                                        "DEBUGGING"
                                    )}
                                    onChange={() =>
                                        handleQuestionType("DEBUGGING")
                                    }
                                />
                                Debugging
                            </label>

                        </div>

                    </div>


                    {/* DIFFICULTY */}

                    <div className="form-group">

                        <label>
                            Difficulty
                        </label>

                        <select
                            name="difficulty"
                            value={formData.difficulty}
                            onChange={handleChange}
                        >

                            <option value="EASY">
                                Easy
                            </option>

                            <option value="MEDIUM">
                                Medium
                            </option>

                            <option value="HARD">
                                Hard
                            </option>

                            <option value="MIXED">
                                Mixed
                            </option>

                        </select>

                    </div>


                    {/* OPTIONS */}

                    <div className="additional-options">

                        <label>

                            <input
                                type="checkbox"
                                name="includeCoding"
                                checked={formData.includeCoding}
                                onChange={handleChange}
                            />

                            Include practical coding questions

                        </label>


                        <label>

                            <input
                                type="checkbox"
                                name="includeScenario"
                                checked={formData.includeScenario}
                                onChange={handleChange}
                            />

                            Include real-world scenarios

                        </label>

                    </div>


                    {/* ACTION */}

                    <div className="form-actions">

                        <button
                            type="button"
                            className="cancel-button"
                            onClick={() =>
                                navigate(
                                    "/professor/create-exam"
                                )
                            }
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="generate-button"
                            disabled={loading}
                        >

                            {loading
                                ? "Generating..."
                                : "Generate Questions →"
                            }

                        </button>

                    </div>
                </form>
            </div>
        </main>
    </div>
</div>
    );
}

export default AIExamGenerator;