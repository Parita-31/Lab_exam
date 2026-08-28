import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./ManualExamBuilder.css";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import { saveDraft, publishExam } from "../../Service/examService";

function ManualExamBuilder() {

    const location = useLocation();
    const navigate = useNavigate();

    const examDetails = location.state || {};

    const [questions, setQuestions] = useState([]);

    const addQuestion = () => {

        const newQuestion = {
            id: Date.now(),
            type: "MCQ",
            question: "",
            marks: 5,
            options: ["", "", "", ""],
            correctAnswer: "",
            answer: "",
            language: "Java"
        };

        setQuestions(previous => [
            ...previous,
            newQuestion
        ]);
    };


    const updateQuestion = (id, field, value) => {

        setQuestions(previous =>
            previous.map(question =>
                question.id === id
                    ? {
                        ...question,
                        [field]: value
                    }
                    : question
            )
        );
    };


    const updateOption = (
        questionId,
        optionIndex,
        value
    ) => {

        setQuestions(previous =>
            previous.map(question => {

                if (question.id !== questionId) {
                    return question;
                }

                const updatedOptions = [
                    ...question.options
                ];

                updatedOptions[optionIndex] = value;

                return {
                    ...question,
                    options: updatedOptions
                };
            })
        );
    };


    const deleteQuestion = (id) => {

        setQuestions(previous =>
            previous.filter(
                question => question.id !== id
            )
        );
    };


    const getTotalMarks = () => {

        return questions.reduce(
            (total, question) =>
                total + Number(question.marks || 0),
            0
        );
    };


    // Create the object that will be sent to Spring Boot
    const createExamData = () => {
        const storedUser = localStorage.getItem("user");
        const user = storedUser ? JSON.parse(storedUser) : {};
        const professorId = user.id || user.userId || Number(localStorage.getItem("userId"));

        if (!professorId) {
            throw new Error("Professor ID is missing. Please log in again.");
        }

        const totalExamMarks = Number(examDetails.totalMarks) || getTotalMarks() || 100;
        const examDateVal = examDetails.examDate || new Date().toISOString().split("T")[0];

        let timeVal = examDetails.startTime || "10:00:00";
        if (timeVal.length === 5) {
            timeVal = `${timeVal}:00`;
        }

        return {
            professorId: Number(professorId),
            title: examDetails.title || `${examDetails.subject || "Lab"} Exam - ${examDetails.batch || "E1"}`,
            subject: examDetails.subject || "General",
            batch: examDetails.batch || "E1",
            semester: examDetails.semester ? Number(examDetails.semester) : 1,
            examDate: examDateVal,
            startTime: timeVal,
            durationMinutes: examDetails.duration ? Number(examDetails.duration) : 60,
            totalMarks: totalExamMarks,
            creationMode: "MANUAL",
            questions: questions.map((question, qIdx) => ({
                questionText: question.question,
                type: question.type || "MCQ",
                marks: Number(question.marks) || 5,
                correctAnswer: question.correctAnswer || question.answer || "A",
                language: question.language || "Java",
                options: (question.options || []).map((optText, optIdx) => {
                    const label = String.fromCharCode(65 + optIdx);
                    const textVal = typeof optText === "string" ? optText : (optText?.text || "");
                    const isCorrect = Boolean(
                        (question.correctAnswer && question.correctAnswer === label) ||
                        (optText && optText.correct === true)
                    );
                    return {
                        label: label,
                        text: textVal,
                        correct: isCorrect
                    };
                })
            }))
        };
    };

    const handleSave = async () => {
        try {
            const examData = createExamData();
            console.log("EXAM DATA:", examData);
            const savedExam = await saveDraft(examData);
            console.log("SAVED EXAM:", savedExam);
            alert("Draft saved successfully!");
        } catch (error) {
            console.error("SAVE ERROR:", error);
            alert("Failed to save draft: " + error.message);
        }
    };


    const handlePublish = async () => {

        if (questions.length === 0) {

            alert(
                "Please add at least one question."
            );

            return;
        }


        const emptyQuestion =
            questions.some(
                question =>
                    !question.question ||
                    !question.question.trim()
            );

        if (emptyQuestion) {

            alert(
                "Please complete all questions."
            );

            return;
        }


        const totalMarks =
            getTotalMarks();

        const examTotalMarks =
            Number(examDetails.totalMarks);


        if (totalMarks !== examTotalMarks) {

            alert(
                `Question marks (${totalMarks}) must match total exam marks (${examTotalMarks}).`
            );

            return;
        }


        try {

            const examData =
                createExamData();

            console.log(
                "Creating exam:",
                examData
            );


            // First create the exam as DRAFT
            const savedExam =
                await saveDraft(examData);

            console.log(
                "Draft created:",
                savedExam
            );


            if (!savedExam.id) {

                throw new Error(
                    "Exam was created but no exam ID was returned."
                );
            }


            // Then publish the draft
            const publishedExam =
                await publishExam(
                    savedExam.id
                );

            console.log(
                "Exam published:",
                publishedExam
            );


            alert(
                "Exam published successfully!"
            );


            // Go back to professor dashboard
            navigate(
                "/professor/dashboard"
            );

        } catch (error) {

            console.error(
                "Publish exam error:",
                error
            );

            alert(
                error.message ||
                "Failed to publish exam."
            );
        }
    };


    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f1f5f9" }}>
            <Navbar />
            <div style={{ display: "flex", flex: 1 }}>
                <Sidebar role="PROFESSOR" />
                <main className="dashboard-content" style={{ flex: 1 }}>
                    <div className="manual-exam-container">

                {/* HEADER */}

                <div className="manual-header">

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

                        <h1>
                            Write Questions
                        </h1>

                        <p>
                            Create the examination questions manually.
                        </p>

                    </div>

                </div>


                {/* EXAM SUMMARY */}

                <div className="manual-summary">

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
                        <span>Questions</span>
                        <strong>
                            {questions.length}
                        </strong>
                    </div>

                    <div>
                        <span>Total Marks</span>
                        <strong>
                            {getTotalMarks()}
                        </strong>
                    </div>

                </div>


                {/* QUESTIONS */}

                <div className="questions-section">

                    <div className="questions-header">

                        <div>

                            <h2>
                                Questions
                            </h2>

                            <p>
                                Add and configure your questions.
                            </p>

                        </div>

                        <button
                            className="add-question-button"
                            onClick={addQuestion}
                        >
                            + Add Question
                        </button>

                    </div>


                    {questions.length === 0 && (

                        <div className="empty-questions">

                            <h3>
                                No questions added
                            </h3>

                            <p>
                                Click "Add Question" to start
                                creating your exam.
                            </p>

                            <button
                                onClick={addQuestion}
                            >
                                + Add First Question
                            </button>

                        </div>

                    )}


                    {questions.map(
                        (question, index) => (

                            <div
                                className="question-card"
                                key={question.id}
                            >

                                <div className="question-card-header">

                                    <h3>
                                        Question {index + 1}
                                    </h3>

                                    <button
                                        className="delete-question"
                                        onClick={() =>
                                            deleteQuestion(
                                                question.id
                                            )
                                        }
                                    >
                                        Delete
                                    </button>

                                </div>


                                {/* TYPE */}

                                <div className="question-row">

                                    <div>

                                        <label>
                                            Question Type
                                        </label>

                                        <select
                                            value={question.type}
                                            onChange={(e) =>
                                                updateQuestion(
                                                    question.id,
                                                    "type",
                                                    e.target.value
                                                )
                                            }
                                        >

                                            <option value="MCQ">
                                                Multiple Choice
                                            </option>

                                            <option value="SHORT">
                                                Short Answer
                                            </option>

                                            <option value="LONG">
                                                Long Answer
                                            </option>

                                            <option value="CODE">
                                                Coding
                                            </option>

                                            <option value="DEBUGGING">
                                                Debugging
                                            </option>

                                        </select>

                                    </div>


                                    <div>

                                        <label>
                                            Marks
                                        </label>

                                        <input
                                            type="number"
                                            min="1"
                                            value={question.marks}
                                            onChange={(e) =>
                                                updateQuestion(
                                                    question.id,
                                                    "marks",
                                                    e.target.value
                                                )
                                            }
                                        />

                                    </div>

                                </div>


                                {/* QUESTION */}

                                <div className="question-field">

                                    <label>
                                        Question
                                    </label>

                                    <textarea
                                        rows="4"
                                        value={question.question}
                                        onChange={(e) =>
                                            updateQuestion(
                                                question.id,
                                                "question",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Enter your question..."
                                    />

                                </div>


                                {/* MCQ */}

                                {question.type === "MCQ" && (

                                    <div className="mcq-section">

                                        <label>
                                            Options
                                        </label>

                                        {question.options.map(
                                            (option, optionIndex) => (

                                                <div
                                                    className="option-row"
                                                    key={optionIndex}
                                                >

                                                    <span>
                                                        {String.fromCharCode(
                                                            65 + optionIndex
                                                        )}
                                                    </span>

                                                    <input
                                                        value={option}
                                                        onChange={(e) =>
                                                            updateOption(
                                                                question.id,
                                                                optionIndex,
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder={
                                                            `Option ${
                                                                optionIndex + 1
                                                            }`
                                                        }
                                                    />

                                                </div>

                                            )
                                        )}


                                        <label>
                                            Correct Answer
                                        </label>

                                        <select
                                            value={
                                                question.correctAnswer
                                            }
                                            onChange={(e) =>
                                                updateQuestion(
                                                    question.id,
                                                    "correctAnswer",
                                                    e.target.value
                                                )
                                            }
                                        >

                                            <option value="">
                                                Select Correct Answer
                                            </option>

                                            <option value="A">
                                                A
                                            </option>

                                            <option value="B">
                                                B
                                            </option>

                                            <option value="C">
                                                C
                                            </option>

                                            <option value="D">
                                                D
                                            </option>

                                        </select>

                                    </div>
                                )}


                                {/* SHORT / LONG */}

                                {(question.type === "SHORT" ||
                                    question.type === "LONG") && (

                                    <div className="question-field">

                                        <label>
                                            Expected Answer
                                        </label>

                                        <textarea
                                            rows="5"
                                            value={question.answer}
                                            onChange={(e) =>
                                                updateQuestion(
                                                    question.id,
                                                    "answer",
                                                    e.target.value
                                                )
                                            }
                                            placeholder={
                                                "Enter expected answer or marking reference..."
                                            }
                                        />

                                    </div>
                                )}


                                {/* CODE */}

                                {(question.type === "CODE" ||
                                    question.type === "DEBUGGING") && (

                                    <div className="coding-section">

                                        <div>

                                            <label>
                                                Programming Language
                                            </label>

                                            <select
                                                value={question.language}
                                                onChange={(e) =>
                                                    updateQuestion(
                                                        question.id,
                                                        "language",
                                                        e.target.value
                                                    )
                                                }
                                            >

                                                <option value="C">
                                                    C
                                                </option>

                                                <option value="CPP">
                                                    C++
                                                </option>

                                                <option value="JAVA">
                                                    Java
                                                </option>

                                                <option value="PYTHON">
                                                    Python
                                                </option>

                                                <option value="JAVASCRIPT">
                                                    JavaScript
                                                </option>

                                            </select>

                                        </div>


                                        <div>

                                            <label>
                                                Expected Solution /
                                                Evaluation Notes
                                            </label>

                                            <textarea
                                                rows="6"
                                                value={
                                                    question.answer
                                                }
                                                onChange={(e) =>
                                                    updateQuestion(
                                                        question.id,
                                                        "answer",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder={
                                                    "Enter expected solution, constraints or evaluation notes..."
                                                }
                                            />

                                        </div>

                                    </div>
                                )}

                            </div>

                        )
                    )}

                </div>


                {/* FOOTER */}

                <div className="manual-actions">

                    <button
                        className="save-draft"
                        onClick={handleSave}
                    >
                        Save Draft
                    </button>

                    <button
                        className="publish-button"
                        onClick={handlePublish}
                    >
                        Review & Publish
                    </button>

                </div>

                </div>
            </main>
        </div>
    </div>
    );
}

export default ManualExamBuilder;