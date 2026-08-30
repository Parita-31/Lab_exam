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
                throw new Error("Invalid enrollment number/email or password.");
            }

            const data = await response.json();

            console.log("LOGIN RESPONSE:", data);

            localStorage.clear();
            localStorage.setItem("user", JSON.stringify(data));
            localStorage.setItem("userId", String(data.userId));
            localStorage.setItem("token", data.token || "");
            localStorage.setItem("role", data.role || "");
            localStorage.setItem("name", data.name || "");

            if (data.role === "STUDENT") {
                navigate("/student/dashboard");
            } else if (data.role === "PROFESSOR") {
                navigate("/professor/dashboard");
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


                {/* Error */}

                {error && (
                    <div className="login-error">
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