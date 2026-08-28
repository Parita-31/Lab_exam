import React from "react";
import { useNavigate } from "react-router-dom";
import DduLogo from "./DduLogo";
import "./Navbar.css";

function Navbar({ user: propUser }) {
    const navigate = useNavigate();

    // Retrieve user from prop or fallback to localStorage
    const storedUser = localStorage.getItem("user");
    const user = propUser || (storedUser ? JSON.parse(storedUser) : null);

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    const role = user?.role || "STUDENT";
    const userName = user?.name || (role === "STUDENT" ? "JASANI TRUSHI JAGDISHBHAI" : "PROFESSOR");
    const profileImg = user?.profileImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";

    return (
        <header className="ddu-top-header">
            <div className="ddu-brand-container" onClick={() => navigate(role === "STUDENT" ? "/student/dashboard" : "/professor/dashboard")}>
                <DduLogo height={42} />
            </div>

            <div className="ddu-user-profile-section">
                <div className="ddu-avatar-wrapper">
                    <img
                        src={profileImg}
                        alt="User Profile"
                        className="ddu-profile-img"
                        onError={(e) => {
                            e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(userName) + "&background=0f766e&color=fff";
                        }}
                    />
                </div>

                <div className="ddu-profile-greeting">
                    <span className="greeting-hi">Hi, </span>
                    <span className="greeting-name">{userName.toUpperCase()}</span>
                </div>

                <div className="ddu-role-badge">
                    {role}
                </div>

                <button className="ddu-logout-btn" onClick={handleLogout} title="Logout">
                    Logout 🚪
                </button>
            </div>
        </header>
    );
}

export default Navbar;