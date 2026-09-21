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
        numberOfSets: 4,
        topics: [
            {
                name: "",
                questionType: "CODE",
                difficulty: "MEDIUM",
                instructions: ""
            }
        ]
    });

    const [loading, setLoading] = useState(false);

    // Handle changes for number of sets
    const handleSetCountChange = (e) => {
        setFormData((previous) => ({
            ...previous,
            numberOfSets: Number(e.target.value)
        }));
    };

    // Handle changes inside a topic
    const handleTopicChange = (index, field, value) => {
        setFormData((previous) => {
            const updatedTopics = [...previous.topics];

            updatedTopics[index] = {
                ...updatedTopics[index],
                [field]: value
            };

            return {
                ...previous,
                topics: updatedTopics
            };
        });
    };

    // Add a new topic
    const handleAddTopic = () => {
        setFormData((previous) => ({
            ...previous,
            topics: [
                ...previous.topics,
                {
                    name: "",
                    questionType: "CODE",
                    difficulty: "MEDIUM",
                    instructions: ""
                }
            ]
        }));
    };

    // Remove a topic
    const handleRemoveTopic = (index) => {
        if (formData.topics.length === 1) {
            alert("At least one topic is required.");
            return;
        }

        setFormData((previous) => ({
            ...previous,
            topics: previous.topics.filter((_, i) => i !== index)
        }));
    };

    // Generate question sets
    const handleGenerate = async (e) => {
        e.preventDefault();

        // Validate number of sets
        if (
            !formData.numberOfSets ||
            formData.numberOfSets < 1 ||
            formData.numberOfSets > 20
        ) {
            alert("Please select between 1 and 20 question sets.");
            return;
        }

        // Validate topics
        const invalidTopic = formData.topics.some(
            (topic) => !topic.name.trim()
        );

        if (invalidTopic) {
            alert("Please enter a name for every topic.");
            return;
        }

        setLoading(true);

        /*
         * AI backend API will be connected here.
         *
         * Example request:
         *
         * POST /api/professor/exams/generate
         *
         * {
         *   subject: examDetails.subject,
         *   numberOfSets: formData.numberOfSets,
         *   topics: formData.topics
         * }
         *
         * For now, we pass the configuration to the review page.
         */

        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                "http://localhost:8080/api/professor/ai/generate",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token
                            ? { Authorization: `Bearer ${token}` }
                            : {})
                    },
                    body: JSON.stringify({
                        subject: examDetails.subject,
                        numberOfSets: formData.numberOfSets,
                        topics: formData.topics
                    })
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    errorText || "Failed to generate questions"
                );
            }

            const generatedQuestions = await response.json();

            navigate("/professor/create-exam/review", {
                state: {
                    examDetails,
                    generatorSettings: formData,
                    generatedQuestions
                }
            });

        } catch (error) {
            console.error("AI generation error:", error);

            alert(
                error.message ||
                "Something went wrong while generating questions."
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                background: "#f1f5f9"
            }}
        >
            <Navbar />

            <div style={{ display: "flex", flex: 1 }}>
                <Sidebar role="PROFESSOR" />

                <main
                    className="dashboard-content"
                    style={{ flex: 1 }}
                >
                    <div className="ai-generator-container">

                        {/* HEADER */}
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
                                    Configure topics, difficulty and question
                                    types to generate multiple exam sets.
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
                                        {examDetails.subject ||
                                            "Not selected"}
                                    </strong>
                                </div>

                                <div>
                                    <span>Batch</span>
                                    <strong>
                                        {examDetails.batch ||
                                            "Not selected"}
                                    </strong>
                                </div>

                                <div>
                                    <span>Semester</span>
                                    <strong>
                                        {examDetails.semester ||
                                            "Not selected"}
                                    </strong>
                                </div>

                                <div>
                                    <span>Total Marks</span>
                                    <strong>
                                        {examDetails.totalMarks ||
                                            "Not selected"}
                                    </strong>
                                </div>

                            </div>

                        </div>

                        {/* GENERATOR FORM */}
                        <form
                            className="ai-generator-form"
                            onSubmit={handleGenerate}
                        >

                            {/* NUMBER OF SETS */}
                            <div className="form-group">

                                <label htmlFor="numberOfSets">
                                    Number of Question Sets
                                </label>

                                <input
                                    id="numberOfSets"
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={formData.numberOfSets}
                                    onChange={handleSetCountChange}
                                    required
                                />

                                <small>
                                    Select how many different question sets
                                    should be generated.
                                </small>

                            </div>

                            {/* TOPICS HEADER */}
                            <div className="topics-header">

                                <div>
                                    <h2>Topics</h2>

                                    <p>
                                        Each topic will contribute one
                                        question to every generated set.
                                    </p>
                                </div>

                                <span className="question-count-badge">
                                    {formData.topics.length}{" "}
                                    {formData.topics.length === 1
                                        ? "Question"
                                        : "Questions"}{" "}
                                    / Set
                                </span>

                            </div>

                            {/* TOPIC CARDS */}
                            <div className="topics-container">

                                {formData.topics.map(
                                    (topic, index) => (
                                        <div
                                            className="topic-card"
                                            key={index}
                                        >

                                            {/* TOPIC CARD HEADER */}
                                            <div className="topic-card-header">

                                                <h3>
                                                    Topic {index + 1}
                                                </h3>

                                                {formData.topics.length >
                                                    1 && (
                                                    <button
                                                        type="button"
                                                        className="remove-topic-button"
                                                        onClick={() =>
                                                            handleRemoveTopic(
                                                                index
                                                            )
                                                        }
                                                    >
                                                        Remove
                                                    </button>
                                                )}

                                            </div>

                                            {/* TOPIC NAME */}
                                            <div className="form-group">

                                                <label>
                                                    Topic Name
                                                </label>

                                                <input
                                                    type="text"
                                                    value={topic.name}
                                                    onChange={(e) =>
                                                        handleTopicChange(
                                                            index,
                                                            "name",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Example: Pattern Programming"
                                                    required
                                                />

                                            </div>

                                            {/* TYPE + DIFFICULTY */}
                                            <div className="topic-settings-grid">

                                                <div className="form-group">

                                                    <label>
                                                        Question Type
                                                    </label>

                                                    <select
                                                        value={
                                                            topic.questionType
                                                        }
                                                        onChange={(e) =>
                                                            handleTopicChange(
                                                                index,
                                                                "questionType",
                                                                e.target.value
                                                            )
                                                        }
                                                    >
                                                        <option value="CODE">
                                                            Coding
                                                        </option>

                                                        <option value="MCQ">
                                                            Multiple Choice
                                                        </option>

                                                        <option value="SHORT">
                                                            Short Answer
                                                        </option>

                                                        <option value="LONG">
                                                            Long Answer
                                                        </option>

                                                        <option value="DEBUGGING">
                                                            Debugging
                                                        </option>

                                                        <option value="SCENARIO">
                                                            Scenario Based
                                                        </option>
                                                    </select>

                                                </div>

                                                <div className="form-group">

                                                    <label>
                                                        Difficulty
                                                    </label>

                                                    <select
                                                        value={
                                                            topic.difficulty
                                                        }
                                                        onChange={(e) =>
                                                            handleTopicChange(
                                                                index,
                                                                "difficulty",
                                                                e.target.value
                                                            )
                                                        }
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
                                                    </select>

                                                </div>

                                            </div>

                                            {/* ADDITIONAL INSTRUCTIONS */}
                                            <div className="form-group">

                                                <label>
                                                    Additional Instructions
                                                    <span className="optional-label">
                                                        {" "}
                                                        (Optional)
                                                    </span>
                                                </label>

                                                <textarea
                                                    value={
                                                        topic.instructions
                                                    }
                                                    onChange={(e) =>
                                                        handleTopicChange(
                                                            index,
                                                            "instructions",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Example: Use Java Swing and event handling. Avoid repeating common questions."
                                                    rows="3"
                                                />

                                                <small>
                                                    Give the AI any specific
                                                    requirements for this
                                                    topic.
                                                </small>

                                            </div>

                                        </div>
                                    )
                                )}

                            </div>

                            {/* ADD TOPIC */}
                            <button
                                type="button"
                                className="add-topic-button"
                                onClick={handleAddTopic}
                            >
                                + Add Topic
                            </button>

                            {/* GENERATION INFO */}
                            <div className="generation-info">

                                <div className="generation-info-icon">
                                    ✨
                                </div>

                                <div>
                                    <strong>
                                        What will be generated?
                                    </strong>

                                    <p>
                                        {formData.numberOfSets} different
                                        question sets with{" "}
                                        {formData.topics.length} question
                                        {formData.topics.length === 1
                                            ? ""
                                            : "s"}{" "}
                                        in each set. Every set will follow
                                        the selected topic, type and
                                        difficulty requirements.
                                    </p>
                                </div>

                            </div>

                            {/* ACTIONS */}
                            <div className="form-actions">

                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={() =>
                                        navigate(
                                            "/professor/create-exam",
                                            {
                                                state: examDetails
                                            }
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
                                        : "Generate Question Sets →"}
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