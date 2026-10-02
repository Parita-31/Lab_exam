import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DduLogo from "../components/DduLogo";
import "./Login.css";

const DEPARTMENTS = [
    "Computer Engineering",
    "Information Technology",
    "Electronics & Communication",
    "Mechanical Engineering",
    "Chemical Engineering",
    "Civil Engineering"
];

function RegisterProfessor() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [department, setDepartment] = useState("Computer Engineering");

    const [error, setError] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch("http://localhost:8080/api/auth/register-professor", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    department
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || "Registration failed. Please try again.");
            }

            setSubmitted(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "15px" }}>
                        <DduLogo height={48} />
                    </div>
                    <h1>Faculty Self-Registration</h1>
                    <p>Dharmsinh Desai University (DDU)</p>
                </div>

                {submitted ? (
                    <div style={{ textAlign: "center", padding: "10px 0" }}>
                        <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
                        <h2 style={{ fontSize: "20px", color: "#0f766e", marginBottom: "12px" }}>
                            Registration Submitted
                        </h2>
                        <div style={{
                            background: "#ecfdf5",
                            border: "1px solid #a7f3d0",
                            color: "#065f46",
                            padding: "16px",
                            borderRadius: "8px",
                            fontSize: "14px",
                            lineHeight: "1.6",
                            marginBottom: "20px"
                        }}>
                            <strong>Your registration is pending approval from your department HOD.</strong>
                            <br />
                            Once your HOD ({department}) approves your account, you will be able to log in to the Professor Dashboard.
                        </div>

                        <button
                            type="button"
                            className="login-button"
                            onClick={() => navigate("/login")}
                        >
                            Return to Sign In
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleRegister}>
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                placeholder="Prof. Jane Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Official Email</label>
                            <input
                                type="email"
                                placeholder="jane.doe@ddu.ac.in"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Password (min 6 characters)</label>
                            <input
                                type="password"
                                placeholder="Create password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={6}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Department</label>
                            <select
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    borderRadius: "8px",
                                    border: "1px solid #cbd5e1",
                                    fontSize: "14px",
                                    background: "#fff"
                                }}
                                required
                            >
                                {DEPARTMENTS.map((dept) => (
                                    <option key={dept} value={dept}>
                                        {dept}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            className="login-button"
                            disabled={loading}
                        >
                            {loading ? "Submitting Registration..." : "Submit Registration for Approval"}
                        </button>

                        <div style={{ textAlign: "center", marginTop: "16px", fontSize: "14px", color: "#64748b" }}>
                            Already registered?{" "}
                            <span
                                style={{ color: "#0f766e", fontWeight: "600", cursor: "pointer", textDecoration: "underline" }}
                                onClick={() => navigate("/login")}
                            >
                                Sign In
                            </span>
                        </div>
                    </form>
                )}

                {error && (
                    <div className="login-error" style={{ marginTop: "16px" }}>
                        {error}
                    </div>
                )}

                <div className="login-footer">
                    <p>Lab Examination Portal • DDU</p>
                </div>
            </div>
        </div>
    );
}

export default RegisterProfessor;
