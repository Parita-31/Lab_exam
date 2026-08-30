import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import "./StudentSettings.css";

function StudentSettings() {
    const navigate = useNavigate();
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const studentId = storedUser.userId || storedUser.id;
    const token = storedUser.token || localStorage.getItem("token");

    const [activeTab, setActiveTab] = useState("account");
    const [toastMessage, setToastMessage] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // 1. Account State
    const [isEditingAccount, setIsEditingAccount] = useState(false);
    const [accountData, setAccountData] = useState({
        name: storedUser.name || "",
        email: storedUser.email || "",
        enrollmentNumber: storedUser.enrollmentNumber || "",
        department: storedUser.department || "",
        batch: storedUser.batch || "",
        semester: storedUser.semester || 1,
        phone: storedUser.phone || "",
        profileImage: storedUser.profileImage || ""
    });

    const [editFormData, setEditFormData] = useState({ ...accountData });

    // Role check and Profile Fetch
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
            .then(res => {
                if (!res.ok) throw new Error(`Status ${res.status}`);
                return res.json();
            })
            .then(data => {
                if (data) {
                    const loaded = {
                        name: data.name || "",
                        email: data.email || "",
                        enrollmentNumber: data.enrollmentNumber || "",
                        department: data.department || "",
                        batch: data.batch || "",
                        semester: data.semester || 1,
                        phone: data.phone || "",
                        profileImage: data.profileImage || ""
                    };
                    setAccountData(loaded);
                    setEditFormData(loaded);
                }
            })
            .catch(err => {
                console.log("Student profile fetch error:", err.message);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [studentId, storedUser.role, navigate, token]);

    const handlePhotoChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditFormData(prev => ({ ...prev, profileImage: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemovePhoto = () => {
        setEditFormData(prev => ({
            ...prev,
            profileImage: ""
        }));
    };

    const handleAccountSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            if (!studentId) {
                throw new Error("Student ID is missing");
            }

            const response = await fetch(`http://localhost:8080/api/student/profile/${studentId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    name: editFormData.name,
                    email: editFormData.email,
                    department: editFormData.department,
                    batch: editFormData.batch,
                    semester: editFormData.semester ? Number(editFormData.semester) : null,
                    enrollmentNumber: editFormData.enrollmentNumber,
                    phone: editFormData.phone,
                    profileImage: editFormData.profileImage
                })
            });

            if (!response.ok) {
                const errJson = await response.json().catch(() => ({}));
                throw new Error(errJson.message || `Server returned ${response.status}`);
            }

            const updatedProfile = await response.json();

            const updated = {
                name: updatedProfile.name || editFormData.name,
                email: updatedProfile.email || editFormData.email,
                department: updatedProfile.department || editFormData.department,
                batch: updatedProfile.batch || editFormData.batch,
                semester: updatedProfile.semester || editFormData.semester,
                enrollmentNumber: updatedProfile.enrollmentNumber || editFormData.enrollmentNumber,
                phone: updatedProfile.phone || editFormData.phone,
                profileImage: updatedProfile.profileImage || editFormData.profileImage
            };

            setAccountData(updated);
            setEditFormData(updated);

            // Update localStorage
            const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
            const updatedUser = {
                ...currentUser,
                ...updated
            };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            localStorage.setItem("name", updated.name);

            setIsEditingAccount(false);
            showToast("Account profile saved to database successfully!");
        } catch (err) {
            console.error("Failed to update student profile on backend:", err);
            showToast("Error saving profile: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setEditFormData({ ...accountData });
        setIsEditingAccount(false);
    };

    // 2. Security State
    const [securityData, setSecurityData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");

    const handleSecuritySave = async (e) => {
        e.preventDefault();
        setPasswordError("");
        setPasswordSuccess("");

        // Frontend Validations
        if (!securityData.currentPassword || securityData.currentPassword.trim() === "") {
            setPasswordError("Current password is required.");
            showToast("Current password is required.");
            return;
        }

        if (!securityData.newPassword || securityData.newPassword.trim() === "") {
            setPasswordError("New password cannot be empty.");
            showToast("New password cannot be empty.");
            return;
        }

        if (securityData.newPassword.length < 6) {
            setPasswordError("New password must be at least 6 characters long.");
            showToast("New password must be at least 6 characters long.");
            return;
        }

        if (securityData.newPassword !== securityData.confirmPassword) {
            setPasswordError("New password and confirm password do not match.");
            showToast("New password and confirm password do not match.");
            return;
        }

        if (!studentId) {
            showToast("Student ID not found. Please log in again.");
            return;
        }

        setIsChangingPassword(true);

        try {
            const response = await fetch(`http://localhost:8080/api/student/change-password/${studentId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    currentPassword: securityData.currentPassword,
                    newPassword: securityData.newPassword,
                    confirmPassword: securityData.confirmPassword
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errMsg = errorData.message || (response.status === 400 ? "Current password is incorrect." : `Server error (${response.status})`);
                throw new Error(errMsg);
            }

            setSecurityData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            });
            setPasswordSuccess("Password changed successfully in database!");
            showToast("Password changed successfully in database!");
        } catch (err) {
            console.error("Change password error:", err);
            setPasswordError(err.message);
            showToast("Failed: " + err.message);
        } finally {
            setIsChangingPassword(false);
        }
    };

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage("");
        }, 3500);
    };

    const tabs = [
        { id: "account", label: "Account", icon: "👤", desc: "Profile details & academic info" },
        { id: "security", label: "Security", icon: "🔒", desc: "Password & security credentials" }
    ];

    if (isLoading) {
        return (
            <div className="professor-settings-page">
                <Sidebar role="STUDENT" />
                <div className="settings-main">
                    <Navbar />
                    <main className="settings-content" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
                        <p style={{ color: "#64748b", fontSize: "1.1rem" }}>Loading student profile...</p>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="professor-settings-page">
            <Sidebar role="STUDENT" />
            <div className="settings-main">
                <Navbar />
                <main className="settings-content">
                    {/* Header */}
                    <div className="settings-header-card">
                        <div className="settings-header-left">
                            <h1>Student Settings</h1>
                            <p>Manage your student profile, academic credentials, and security password.</p>
                        </div>
                        {toastMessage && (
                            <div className="settings-toast-badge">
                                <span>{toastMessage.includes("Failed") || toastMessage.includes("Error") || toastMessage.includes("error") ? "⚠️" : "✅"}</span>
                                <span>{toastMessage}</span>
                            </div>
                        )}
                    </div>

                    <div className="settings-grid">
                        {/* Navigation Sidebar */}
                        <div className="settings-nav-card">
                            <div className="settings-nav-list">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        className={`settings-nav-btn ${activeTab === tab.id ? "active" : ""}`}
                                        onClick={() => setActiveTab(tab.id)}
                                    >
                                        <span className="tab-icon">{tab.icon}</span>
                                        <div className="tab-text-group">
                                            <span className="tab-title">{tab.label}</span>
                                            <span className="tab-sub">{tab.desc}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content Panel */}
                        <div className="settings-panel-card">
                            {/* ========================================================
                                1. ACCOUNT SECTION
                            ======================================================== */}
                            {activeTab === "account" && (
                                <div>
                                    <div className="panel-header">
                                        <div>
                                            <h2>Account Profile</h2>
                                            <p>View and manage your student credentials, contact info, and profile photo.</p>
                                        </div>
                                        {!isEditingAccount && (
                                            <button
                                                type="button"
                                                className="btn-primary-teal edit-profile-btn"
                                                onClick={() => {
                                                    setEditFormData({ ...accountData });
                                                    setIsEditingAccount(true);
                                                }}
                                            >
                                                <span>✏️</span> Edit Profile
                                            </button>
                                        )}
                                    </div>

                                    {!isEditingAccount ? (
                                        /* ------------------ VIEW MODE ------------------ */
                                        <div className="account-view-container">
                                            {/* Profile Summary Card */}
                                            <div className="account-hero-card">
                                                <div className="account-avatar-wrapper">
                                                    <img
                                                        src={accountData.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(accountData.name || "Student")}&background=008080&color=fff`}
                                                        alt={accountData.name || "Student"}
                                                        className="account-avatar-img"
                                                        onError={(e) => {
                                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(accountData.name || "Student")}&background=008080&color=fff`;
                                                        }}
                                                    />
                                                    <span className="avatar-status-badge" title="Active Student"></span>
                                                </div>
                                                <div className="account-hero-details">
                                                    <div className="account-hero-header">
                                                        <h3 className="account-hero-name">{accountData.name || "Data unavailable"}</h3>
                                                        <span className="account-role-pill">STUDENT</span>
                                                    </div>
                                                    <p className="account-hero-designation">
                                                        {accountData.semester ? `Semester ${accountData.semester}` : ""} 
                                                        {accountData.batch ? ` • Batch ${accountData.batch}` : ""} 
                                                        {accountData.department ? ` • ${accountData.department}` : ""}
                                                    </p>
                                                    <div className="account-hero-meta">
                                                        {accountData.enrollmentNumber && <span>🎓 {accountData.enrollmentNumber}</span>}
                                                        <span>📧 {accountData.email || "Email unavailable"}</span>
                                                        {accountData.phone && <span>📞 {accountData.phone}</span>}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Detailed Info Grid */}
                                            <div className="settings-section-block">
                                                <h3 className="section-block-title">📋 Student & Academic Details</h3>
                                                <div className="profile-details-grid">
                                                    <div className="detail-item">
                                                        <span className="detail-label">Full Name</span>
                                                        <span className="detail-value">{accountData.name || "Data unavailable"}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="detail-label">Enrollment Number</span>
                                                        <span className="detail-value">{accountData.enrollmentNumber || "Not assigned"}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="detail-label">Email Address</span>
                                                        <span className="detail-value">{accountData.email || "Data unavailable"}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="detail-label">Phone Number</span>
                                                        <span className="detail-value">{accountData.phone || "Not set"}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="detail-label">Department</span>
                                                        <span className="detail-value">{accountData.department || "Data unavailable"}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="detail-label">Semester & Batch</span>
                                                        <span className="detail-value">
                                                            Semester {accountData.semester || "N/A"} {accountData.batch ? `(Batch ${accountData.batch})` : ""}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* ------------------ EDIT MODE ------------------ */
                                        <form onSubmit={handleAccountSave} className="account-edit-form">
                                            {/* Photo Upload & Preview */}
                                            <div className="avatar-upload-block">
                                                <div className="account-avatar-wrapper">
                                                    <img
                                                        src={editFormData.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(editFormData.name || "Student")}&background=008080&color=fff`}
                                                        alt={editFormData.name}
                                                        className="account-avatar-img edit-preview"
                                                        onError={(e) => {
                                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(editFormData.name || "Student")}&background=008080&color=fff`;
                                                        }}
                                                    />
                                                </div>
                                                <div className="avatar-actions">
                                                    <label className="section-block-title" style={{ fontSize: "0.95rem", margin: "0 0 4px" }}>
                                                        Profile Photo
                                                    </label>
                                                    <div className="avatar-btn-row">
                                                        <label className="btn-secondary upload-file-btn">
                                                            <span>📁</span> Upload Image
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={handlePhotoChange}
                                                                style={{ display: "none" }}
                                                            />
                                                        </label>
                                                        <button
                                                            type="button"
                                                            className="btn-outline-danger"
                                                            onClick={handleRemovePhoto}
                                                        >
                                                            Reset to Default
                                                        </button>
                                                    </div>
                                                    <span className="input-hint">Supports PNG, JPG, or GIF (max 2MB).</span>
                                                </div>
                                            </div>

                                            <div className="settings-section-block">
                                                <h3 className="section-block-title">✏️ Edit Information</h3>
                                                <div className="form-row-2">
                                                    <div className="settings-input-group">
                                                        <label>Full Name <span className="required-star">*</span></label>
                                                        <input
                                                            type="text"
                                                            value={editFormData.name}
                                                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                                            placeholder="Enter full name"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="settings-input-group">
                                                        <label>Email Address <span className="required-star">*</span></label>
                                                        <input
                                                            type="email"
                                                            value={editFormData.email}
                                                            onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                                            placeholder="Enter email address"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div className="form-row-2">
                                                    <div className="settings-input-group">
                                                        <label>Enrollment Number <span className="required-star">*</span></label>
                                                        <input
                                                            type="text"
                                                            value={editFormData.enrollmentNumber}
                                                            onChange={(e) => setEditFormData({ ...editFormData, enrollmentNumber: e.target.value })}
                                                            placeholder="e.g. 22IT001"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="settings-input-group">
                                                        <label>Phone Number</label>
                                                        <input
                                                            type="tel"
                                                            value={editFormData.phone}
                                                            onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                                                            placeholder="+91 98765 12345"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="form-row-3">
                                                    <div className="settings-input-group">
                                                        <label>Department <span className="required-star">*</span></label>
                                                        <select
                                                            value={editFormData.department}
                                                            onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                                                        >
                                                            <option value="Information Technology">Information Technology</option>
                                                            <option value="Computer Engineering">Computer Engineering</option>
                                                            <option value="Electronics & Communication">Electronics & Communication</option>
                                                            <option value="Chemical Engineering">Chemical Engineering</option>
                                                            <option value="Mechanical Engineering">Mechanical Engineering</option>
                                                            <option value="Civil Engineering">Civil Engineering</option>
                                                        </select>
                                                    </div>
                                                    <div className="settings-input-group">
                                                        <label>Semester <span className="required-star">*</span></label>
                                                        <select
                                                            value={editFormData.semester}
                                                            onChange={(e) => setEditFormData({ ...editFormData, semester: Number(e.target.value) })}
                                                        >
                                                            <option value={1}>Semester 1</option>
                                                            <option value={2}>Semester 2</option>
                                                            <option value={3}>Semester 3</option>
                                                            <option value={4}>Semester 4</option>
                                                            <option value={5}>Semester 5</option>
                                                            <option value={6}>Semester 6</option>
                                                            <option value={7}>Semester 7</option>
                                                            <option value={8}>Semester 8</option>
                                                        </select>
                                                    </div>
                                                    <div className="settings-input-group">
                                                        <label>Batch / Division</label>
                                                        <input
                                                            type="text"
                                                            value={editFormData.batch}
                                                            onChange={(e) => setEditFormData({ ...editFormData, batch: e.target.value })}
                                                            placeholder="e.g. IT-1"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="panel-footer-actions">
                                                <button
                                                    type="button"
                                                    className="btn-secondary"
                                                    onClick={handleCancelEdit}
                                                >
                                                    Cancel
                                                </button>
                                                <button type="submit" className="btn-primary-teal" disabled={isSaving}>
                                                    {isSaving ? "Saving..." : "Save Changes"}
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            )}

                            {/* ========================================================
                                2. SECURITY SECTION
                            ======================================================== */}
                            {activeTab === "security" && (
                                <form onSubmit={handleSecuritySave}>
                                    <div className="panel-header">
                                        <div>
                                            <h2>Security Settings</h2>
                                            <p>Manage your student account password and authentication safeguards.</p>
                                        </div>
                                    </div>

                                    {passwordError && (
                                        <div className="security-alert-error" style={{
                                            padding: "12px 16px",
                                            background: "#fef2f2",
                                            border: "1px solid #fecaca",
                                            borderRadius: "8px",
                                            color: "#b91c1c",
                                            fontSize: "0.9rem",
                                            marginBottom: "1.25rem",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px"
                                        }}>
                                            <span>⚠️</span>
                                            <span>{passwordError}</span>
                                        </div>
                                    )}

                                    {passwordSuccess && (
                                        <div className="security-alert-success" style={{
                                            padding: "12px 16px",
                                            background: "#f0fdf4",
                                            border: "1px solid #bbf7d0",
                                            borderRadius: "8px",
                                            color: "#15803d",
                                            fontSize: "0.9rem",
                                            marginBottom: "1.25rem",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px"
                                        }}>
                                            <span>✅</span>
                                            <span>{passwordSuccess}</span>
                                        </div>
                                    )}

                                    <div className="settings-section-block">
                                        <h3 className="section-block-title">🔑 Change Password</h3>
                                        
                                        <div className="settings-input-group">
                                            <label>Current Password <span className="required-star">*</span></label>
                                            <input
                                                type="password"
                                                placeholder="Enter your current password"
                                                value={securityData.currentPassword}
                                                onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                                                required
                                            />
                                            <span className="input-hint">Required to authenticate and verify your student identity</span>
                                        </div>

                                        <div className="form-row-2">
                                            <div className="settings-input-group">
                                                <label>New Password <span className="required-star">*</span></label>
                                                <input
                                                    type="password"
                                                    placeholder="Enter new password (min 6 chars)"
                                                    value={securityData.newPassword}
                                                    onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                                                    required
                                                />
                                                <span className="input-hint">Must be at least 6 characters long</span>
                                            </div>
                                            <div className="settings-input-group">
                                                <label>Confirm New Password <span className="required-star">*</span></label>
                                                <input
                                                    type="password"
                                                    placeholder="Re-enter new password"
                                                    value={securityData.confirmPassword}
                                                    onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                                                    required
                                                />
                                                {securityData.confirmPassword && securityData.newPassword && (
                                                    <span className="input-hint" style={{
                                                        color: securityData.newPassword === securityData.confirmPassword ? "#16a34a" : "#dc2626",
                                                        fontWeight: 600
                                                    }}>
                                                        {securityData.newPassword === securityData.confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div style={{ marginTop: "1rem" }}>
                                            <button
                                                type="submit"
                                                className="btn-primary-teal"
                                                disabled={isChangingPassword}
                                            >
                                                {isChangingPassword ? "Updating Password..." : "Change Password"}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default StudentSettings;
