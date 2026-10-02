import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRoles }) {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!storedUser || !token) {
        return <Navigate to="/login" replace />;
    }

    try {
        const user = JSON.parse(storedUser);
        const role = user.role ? user.role.toUpperCase() : "";

        if (allowedRoles && allowedRoles.length > 0) {
            const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());
            if (!normalizedAllowed.includes(role)) {
                // Redirect to their default dashboard based on actual role
                if (role === "ADMIN") return <Navigate to="/admin/dashboard" replace />;
                if (role === "HOD") return <Navigate to="/hod/dashboard" replace />;
                if (role === "PROFESSOR") return <Navigate to="/professor/dashboard" replace />;
                if (role === "STUDENT") return <Navigate to="/student/dashboard" replace />;
                return <Navigate to="/login" replace />;
            }
        }

        return children;
    } catch (e) {
        localStorage.clear();
        return <Navigate to="/login" replace />;
    }
}

export default ProtectedRoute;
