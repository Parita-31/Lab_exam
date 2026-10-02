import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DduLogo from "../components/DduLogo";
import "./Login.css";

function Login() {

    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");

    const navigate = useNavigate();

    const handleLogin = async (e) => {

        e.preventDefault();

        setError("");

        try {

            const response = await fetch(
                "http://localhost:8080/api/auth/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        identifier,
                        password
                    })
                }
            );

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || "Invalid enrollment number/email or password.");
            }

            const data = await response.json();

            console.log("LOGIN RESPONSE:", data);

            localStorage.clear();
            localStorage.setItem("user", JSON.stringify(data));
            localStorage.setItem("userId", String(data.userId));
            localStorage.setItem("token", data.token || "");
            localStorage.setItem("role", data.role || "");
            localStorage.setItem("name", data.name || "");

            const role = (data.role || "").toUpperCase();
            if (role === "ADMIN") {
                navigate("/admin/dashboard");
            } else if (role === "HOD") {
                navigate("/hod/dashboard");
            } else if (role === "PROFESSOR") {
                navigate("/professor/dashboard");
            } else if (role === "STUDENT") {
                navigate("/student/dashboard");
            } else {
                navigate("/login");
            }

        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div className="login-page">

            <div className="login-card">

                {/* Header */}

                <div className="login-header">

                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "15px" }}>
                        <DduLogo height={48} />
                    </div>

                    <h1>Lab Examination Portal</h1>

                    <p>
                        Dharmsinh Desai University (DDU)
                    </p>

                </div>


                {/* Login Form */}

                <form onSubmit={handleLogin}>

                    <div className="form-group">

                        <label>
                            Enrollment Number / Email
                        </label>

                        <input
                            type="text"
                            placeholder="Enter enrollment number or email"
                            value={identifier}
                            onChange={(e) =>
                                setIdentifier(e.target.value)
                            }
                            required
                        />

                    </div>


                    <div className="form-group">

                        <label>
                            Password
                        </label>

                        <input
                            type="password"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            required
                        />

                    </div>


                    <button
                        type="submit"
                        className="login-button"
                    >
                        Sign In
                    </button>

                </form>


                {/* Professor Registration Link */}

                <div style={{ textAlign: "center", marginTop: "16px", fontSize: "14px", color: "#64748b" }}>
                    New Faculty Member?{" "}
                    <span
                        style={{ color: "#0f766e", fontWeight: "600", cursor: "pointer", textDecoration: "underline" }}
                        onClick={() => navigate("/register-professor")}
                    >
                        Register as Professor
                    </span>
                </div>


                {/* Error */}

                {error && (
                    <div className="login-error" style={{ marginTop: "16px" }}>
                        {error}
                    </div>
                )}


                {/* Footer */}

                <div className="login-footer">
                    <p>
                        Lab Examination Portal
                    </p>
                </div>

            </div>

        </div>
    );
}

export default Login;