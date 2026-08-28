import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateExam.css";

import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

function CreateExam() {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        subject: "",
        batch: "",
        semester: "",
        examDate: "",
        startTime: "",
        duration: "",
        totalMarks: "",
        creationMode: ""
    });

    const handleChange = (e) => {

        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {

        e.preventDefault();

        console.log("Exam Details:", formData);

        if (!formData.creationMode) {
            alert("Please select how you want to create the exam.");
            return;
        }

        if (formData.creationMode === "AI") {

            navigate("/professor/create-exam/ai", {
                state: formData
            });

        } else {

            navigate("/professor/create-exam/manual", {
                state: formData
            });
        }
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f1f5f9" }}>
            <Navbar />
            <div style={{ display: "flex", flex: 1 }}>
                <Sidebar role="PROFESSOR" />
                <main className="dashboard-content" style={{ flex: 1 }}>
                    <div className="create-exam-container">

                <div className="create-exam-header">

                    <button
                        className="back-button"
                        onClick={() => navigate("/professor/dashboard")}
                    >
                        ← Back
                    </button>

                    <div>
                        <h1>Create Exam</h1>

                        <p>
                            Create a new examination for your students.
                        </p>
                    </div>

                </div>


                <form
                    className="create-exam-form"
                    onSubmit={handleSubmit}
                >

                    {/* SUBJECT */}

                    <div className="form-group">

                        <label>
                            Subject
                        </label>

                        <select
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            required
                        >

                            <option value="">
                                Select Subject
                            </option>

                            <option value="HTML">
                                HTML
                            </option>

                            <option value="CSS">
                                CSS
                            </option>

                            <option value="JavaScript">
                                JavaScript
                            </option>

                            <option value="React">
                                React
                            </option>

                            <option value="Java">
                                Java
                            </option>

                            <option value="C">
                                C
                            </option>

                            <option value="C++">
                                C++
                            </option>

                            <option value="Python">
                                Python
                            </option>

                            <option value="Spring Boot">
                                Spring Boot
                            </option>

                            <option value="Hibernate">
                                Hibernate
                            </option>

                            <option value="8086 Microprocessor">
                                8086 Microprocessor
                            </option>

                            <option value="Assembly Language">
                                Assembly Language
                            </option>

                        </select>

                    </div>


                    {/* BATCH */}

                    <div className="form-group">

                        <label>
                            Student Batch
                        </label>

                        <select
                            name="batch"
                            value={formData.batch}
                            onChange={handleChange}
                            required
                        >
                            <option value="">
                                Select Batch
                            </option>
                            <option value="5 - DIV - E">5 - DIV - E</option>
                            <option value="2026_IT_B1">2026_IT_B1</option>
                            <option value="E1">E1</option>
                            <option value="E2">E2</option>
                            <option value="E3">E3</option>
                            <option value="F1">F1</option>
                            <option value="F2">F2</option>
                            <option value="F3">F3</option>
                        </select>

                    </div>


                    {/* SEMESTER */}

                    <div className="form-group">

                        <label>
                            Semester
                        </label>

                        <select
                            name="semester"
                            value={formData.semester}
                            onChange={handleChange}
                            required
                        >

                            <option value="">
                                Select Semester
                            </option>

                            <option value="1">Semester 1</option>
                            <option value="2">Semester 2</option>
                            <option value="3">Semester 3</option>
                            <option value="4">Semester 4</option>
                            <option value="5">Semester 5</option>
                            <option value="6">Semester 6</option>
                            <option value="7">Semester 7</option>
                            <option value="8">Semester 8</option>

                        </select>

                    </div>


                    {/* DATE */}

                    <div className="form-group">

                        <label>
                            Exam Date
                        </label>

                        <input
                            type="date"
                            name="examDate"
                            value={formData.examDate}
                            onChange={handleChange}
                            required
                        />

                    </div>


                    {/* TIME */}

                    <div className="form-group">

                        <label>
                            Start Time
                        </label>

                        <input
                            type="time"
                            name="startTime"
                            value={formData.startTime}
                            onChange={handleChange}
                            required
                        />

                    </div>


                    {/* DURATION */}

                    <div className="form-group">

                        <label>
                            Exam Duration
                        </label>

                        <select
                            name="duration"
                            value={formData.duration}
                            onChange={handleChange}
                            required
                        >

                            <option value="">
                                Select Duration
                            </option>

                            <option value="30">
                                30 Minutes
                            </option>

                            <option value="45">
                                45 Minutes
                            </option>

                            <option value="60">
                                60 Minutes
                            </option>

                            <option value="90">
                                90 Minutes
                            </option>

                            <option value="120">
                                120 Minutes
                            </option>

                            <option value="180">
                                180 Minutes
                            </option>

                        </select>

                    </div>


                    {/* TOTAL MARKS */}

                    <div className="form-group">

                        <label>
                            Total Marks
                        </label>

                        <input
                            type="number"
                            name="totalMarks"
                            min="1"
                            max="500"
                            placeholder="Example: 100"
                            value={formData.totalMarks}
                            onChange={handleChange}
                            required
                        />

                    </div>


                    {/* CREATION MODE */}

                    <div className="creation-section">

                        <h2>
                            Question Creation
                        </h2>

                        <p>
                            Choose how you want to create the questions.
                        </p>


                        <div className="creation-options">

                            <label className="creation-option">

                                <input
                                    type="radio"
                                    name="creationMode"
                                    value="AI"
                                    checked={
                                        formData.creationMode === "AI"
                                    }
                                    onChange={handleChange}
                                />

                                <div>

                                    <strong>
                                        Generate with AI
                                    </strong>

                                    <span>
                                        Generate questions based on topics,
                                        difficulty and question type.
                                    </span>

                                </div>

                            </label>


                            <label className="creation-option">

                                <input
                                    type="radio"
                                    name="creationMode"
                                    value="MANUAL"
                                    checked={
                                        formData.creationMode === "MANUAL"
                                    }
                                    onChange={handleChange}
                                />

                                <div>

                                    <strong>
                                        Write Questions Yourself
                                    </strong>

                                    <span>
                                        Create and enter every question manually.
                                    </span>

                                </div>

                            </label>

                        </div>

                    </div>


                    {/* BUTTONS */}

                    <div className="form-actions">

                        <button
                            type="button"
                            className="cancel-button"
                            onClick={() =>
                                navigate("/professor/dashboard")
                            }
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="continue-button"
                        >
                            Continue →
                        </button>

                    </div>
                </form>
            </div>
        </main>
    </div>
</div>
    );
}

export default CreateExam;