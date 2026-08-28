import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";

function Sidebar({ role }) {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    const studentLinks = [
        { name: "Dashboard", path: "/student/dashboard", icon: "🎓" },
        { name: "Upcoming Exams", path: "/student/upcoming-exams", icon: "📋" },
        { name: "Active Exams", path: "/student/active-exams", icon: "⚡" },
        { name: "Past Exams", path: "/student/past-exams", icon: "📜" },
        { name: "Final Results", path: "/student/results", icon: "📊" },
        { name: "AI Review", path: "/student/ai-review", icon: "🤖" },
        { name: "Attendance", path: "/student/attendance", icon: "📅" },
        { name: "Profile", path: "/student/profile", icon: "👤" },
        { name: "Settings", path: "/student/settings", icon: "⚙️" }
    ];

    const professorLinks = [
        { name: "Dashboard", path: "/professor/dashboard", icon: "🎓" },
        { name: "Create Exam", path: "/professor/create-exam", icon: "➕" },
        { name: "Upcoming Exams", path: "/professor/upcoming-exams", icon: "📋" },
        { name: "Active Exams", path: "/professor/active-exams", icon: "⚡" },
        { name: "Past Exams", path: "/professor/past-exams", icon: "📜" },
        { name: "AI Evaluation", path: "/professor/ai-evaluation", icon: "🤖" },
        { name: "Final Results", path: "/professor/results", icon: "📊" },
        { name: "Attendance", path: "/professor/attendance", icon: "📅" },
        { name: "Profile", path: "/professor/profile", icon: "👤" },
        { name: "Settings", path: "/professor/settings", icon: "⚙️" }
    ];

    const currentRole = role || (JSON.parse(localStorage.getItem("user") || "{}").role) || "PROFESSOR";
    const links = currentRole === "STUDENT" ? studentLinks : professorLinks;

    return (
        <aside className="ddu-sidebar">
            <div className="ddu-sidebar-title">
                {currentRole === "STUDENT" ? "STUDENT PORTAL" : "FACULTY PORTAL"}
            </div>

            <nav className="ddu-sidebar-nav">
                {links.map((link) => (
                    <NavLink
                        key={link.path}
                        to={link.path}
                        className={({ isActive }) =>
                            isActive ? "ddu-sidebar-link active" : "ddu-sidebar-link"
                        }
                    >
                        <span className="sidebar-link-icon">{link.icon}</span>
                        <span>{link.name}</span>
                    </NavLink>
                ))}
            </nav>

            <button className="sidebar-logout-btn" onClick={handleLogout}>
                Logout 🚪
            </button>
        </aside>
    );
}

export default Sidebar;