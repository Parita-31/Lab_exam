import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import "../Profile.css";

function StudentProfile() {
    const navigate = useNavigate();
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const studentId = storedUser.userId || storedUser.id;
    const token = storedUser.token || localStorage.getItem("token");

    const [isLoading, setIsLoading] = useState(true);
    const [profile, setProfile] = useState({
        name: storedUser.name || "",
        email: storedUser.email || "",
        phone: storedUser.phone || "",
        enrollmentNumber: storedUser.enrollmentNumber || "",
        department: storedUser.department || "",
        semester: storedUser.semester || null,
        batch: storedUser.batch || "",
        role: "STUDENT",
        status: storedUser.status || "ACTIVE",
        createdAt: storedUser.createdAt || "",
        profileImage: storedUser.profileImage || ""
    });

    useEffect(() => {
        if (!storedUser || storedUser.role !== "STUDENT") {
            navigate("/login");
            return;
        }

        if (!studentId) {
            setIsLoading(false);
            return;
        }

        fetch(`http://localhost:8080/api/student/profile/${studentId}`, {
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            }
        })
            .then((res) => {
                if (!res.ok) throw new Error(`Status ${res.status}`);
                return res.json();
            })
            .then((data) => {
                if (data) {
                    setProfile({
                        name: data.name || "",
                        email: data.email || "",
                        enrollmentNumber: data.enrollmentNumber || "",
                        department: data.department || "",
                        semester: data.semester || null,
                        batch: data.batch || "",
                        role: data.role || "STUDENT",
                        status: data.status || "ACTIVE",
                        createdAt: data.createdAt || "",
                        profileImage: data.profileImage || "",
                        phone: data.phone || ""
                    });
                }
            })
            .catch((err) => console.log("Student profile fetch note:", err.message))
            .finally(() => setIsLoading(false));
    }, [studentId, storedUser.role, navigate, token]);

    const formatCreatedDate = (dateStr) => {
        if (!dateStr) return "Registered Student";
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric"
            });
        } catch {
            return dateStr;
        }
    };

    if (isLoading) {
        return (
            <div className="profile-page-container">
                <Sidebar role="STUDENT" />
                <div className="profile-main-layout">
                    <Navbar />
                    <main className="profile-content-area" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
                        <p style={{ color: "#64748b", fontSize: "1.1rem" }}>Loading student profile...</p>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page-container">
            <Sidebar role="STUDENT" />
            <div className="profile-main-layout">
                <Navbar />
                <main className="profile-content-area">
                    {/* Header */}
                    <div className="profile-header-card">
                        <h1>Student Profile</h1>
                        <p>Detailed view of your student account credentials and academic enrollment.</p>
                    </div>

                    {/* Profile Card */}
                    <div className="profile-card-wrapper">
                        {/* Top Hero Banner */}
                        <div className="profile-hero-banner">
                            <div className="profile-hero-avatar-wrap">
                                <img
                                    src={profile.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || "Student")}&background=008080&color=fff`}
                                    alt={profile.name || "Student"}
                                    className="profile-hero-avatar-img"
                                    onError={(e) => {
                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || "Student")}&background=008080&color=fff`;
                                    }}
                                />
                                <span className="profile-avatar-status-badge" title="Active Student"></span>
                            </div>
                            <div className="profile-hero-text">
                                <div className="profile-hero-title-row">
                                    <h2>{profile.name || "Data unavailable"}</h2>
                                    <span className="profile-hero-badge">STUDENT</span>
                                </div>
                                <p className="profile-hero-subtitle">
                                    {profile.semester ? `Semester ${profile.semester}` : ""} 
                                    {profile.batch ? ` • Batch ${profile.batch}` : ""} 
                                    {profile.department ? ` • ${profile.department}` : ""}
                                </p>
                            </div>
                        </div>

                        {/* Account Details */}
                        <div className="profile-details-container">
                            <h3 className="profile-section-heading">🎓 Student & Academic Information</h3>
                            <div className="profile-info-grid">
                                <div className="profile-info-tile">
                                    <span className="profile-tile-label">👤 Full Name</span>
                                    <span className="profile-tile-value">{profile.name || "Data unavailable"}</span>
                                </div>
                                <div className="profile-info-tile">
                                    <span className="profile-tile-label">🎓 Enrollment Number</span>
                                    <span className="profile-tile-value">{profile.enrollmentNumber || "Not assigned"}</span>
                                </div>
                                <div className="profile-info-tile">
                                    <span className="profile-tile-label">📧 Student Email</span>
                                    <span className="profile-tile-value">{profile.email || "Data unavailable"}</span>
                                </div>
                                <div className="profile-info-tile">
                                    <span className="profile-tile-label">📞 Phone Number</span>
                                    <span className="profile-tile-value">{profile.phone || "Not set"}</span>
                                </div>
                                <div className="profile-info-tile">
                                    <span className="profile-tile-label">🏢 Department</span>
                                    <span className="profile-tile-value">{profile.department || "Data unavailable"}</span>
                                </div>
                                <div className="profile-info-tile">
                                    <span className="profile-tile-label">📚 Semester</span>
                                    <span className="profile-tile-value">{profile.semester ? `Semester ${profile.semester}` : "N/A"}</span>
                                </div>
                                <div className="profile-info-tile">
                                    <span className="profile-tile-label">👥 Batch / Division</span>
                                    <span className="profile-tile-value">{profile.batch || "Not assigned"}</span>
                                </div>
                                <div className="profile-info-tile">
                                    <span className="profile-tile-label">🛡️ Role</span>
                                    <span className="profile-tile-value">{profile.role}</span>
                                </div>
                                <div className="profile-info-tile">
                                    <span className="profile-tile-label">🟢 Account Status</span>
                                    <div className="profile-tile-value">
                                        <span className={`profile-status-pill ${profile.status?.toLowerCase() === "active" ? "active" : "inactive"}`}>
                                            <span className="profile-status-dot"></span>
                                            {profile.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="profile-info-tile">
                                    <span className="profile-tile-label">📅 Account Created Date</span>
                                    <span className="profile-tile-value">{formatCreatedDate(profile.createdAt)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default StudentProfile;
