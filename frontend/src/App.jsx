import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import RegisterProfessor from "./pages/RegisterProfessor";
import ProtectedRoute from "./components/ProtectedRoute";

// Admin Pages
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminHodManagement from "./pages/Admin/AdminHodManagement";
import AdminProfessorView from "./pages/Admin/AdminProfessorView";
import AdminStudentView from "./pages/Admin/AdminStudentView";

// HOD Pages
import HodDashboard from "./pages/Hod/HodDashboard";
import HodProfessorApprovals from "./pages/Hod/HodProfessorApprovals";
import HodDepartmentProfessors from "./pages/Hod/HodDepartmentProfessors";
import HodStudentManagement from "./pages/Hod/HodStudentManagement";
import HodBulkStudentImport from "./pages/Hod/HodBulkStudentImport";

// Existing Professor Pages
import ProfessorDashboard from "./pages/Professor/ProfessorDashboard";
import CreateExam from "./pages/Professor/CreateExam";
import AIExamGenerator from "./pages/Professor/AIExamGenerator";
import ManualExamBuilder from "./pages/Professor/ManualExamBuilder";
import ProfessorExamsPage from "./pages/Professor/ProfessorExamsPage";
import ProfessorAttendance from "./pages/Professor/ProfessorAttendance";
import ProfessorProfile from "./pages/Professor/ProfessorProfile";
import ProfessorSettings from "./pages/Professor/ProfessorSettings";
import ReviewQue from "./pages/Professor/ReviewQue";

// Existing Student Pages
import StudentDashboard from "./pages/Student/StudentDashboard";
import StudentExamsPage from "./pages/Student/StudentExamsPage";
import StudentAttendance from "./pages/Student/StudentAttendance";
import StudentProfile from "./pages/Student/StudentProfile";
import StudentSettings from "./pages/Student/StudentSettings";

import GenericPage from "./pages/GenericPage";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Auth Routes */}
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register-professor" element={<RegisterProfessor />} />

                {/* Admin Routes */}
                <Route
                    path="/admin/dashboard"
                    element={
                        <ProtectedRoute allowedRoles={["ADMIN"]}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/hods"
                    element={
                        <ProtectedRoute allowedRoles={["ADMIN"]}>
                            <AdminHodManagement />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/professors"
                    element={
                        <ProtectedRoute allowedRoles={["ADMIN"]}>
                            <AdminProfessorView />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/students"
                    element={
                        <ProtectedRoute allowedRoles={["ADMIN"]}>
                            <AdminStudentView />
                        </ProtectedRoute>
                    }
                />

                {/* HOD Specific Routes */}
                <Route
                    path="/hod/dashboard"
                    element={
                        <ProtectedRoute allowedRoles={["HOD"]}>
                            <HodDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/hod/approvals"
                    element={
                        <ProtectedRoute allowedRoles={["HOD"]}>
                            <HodProfessorApprovals />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/hod/professors"
                    element={
                        <ProtectedRoute allowedRoles={["HOD"]}>
                            <HodDepartmentProfessors />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/hod/students"
                    element={
                        <ProtectedRoute allowedRoles={["HOD"]}>
                            <HodStudentManagement />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/hod/bulk-import"
                    element={
                        <ProtectedRoute allowedRoles={["HOD"]}>
                            <HodBulkStudentImport />
                        </ProtectedRoute>
                    }
                />

                {/* Student Routes */}
                <Route
                    path="/student/dashboard"
                    element={
                        <ProtectedRoute allowedRoles={["STUDENT"]}>
                            <StudentDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/student/upcoming-exams"
                    element={
                        <ProtectedRoute allowedRoles={["STUDENT"]}>
                            <StudentExamsPage defaultCategory="UPCOMING" />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/student/active-exams"
                    element={
                        <ProtectedRoute allowedRoles={["STUDENT"]}>
                            <StudentExamsPage defaultCategory="ACTIVE" />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/student/past-exams"
                    element={
                        <ProtectedRoute allowedRoles={["STUDENT"]}>
                            <StudentExamsPage defaultCategory="PAST" />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/student/results"
                    element={
                        <ProtectedRoute allowedRoles={["STUDENT"]}>
                            <GenericPage title="Final Results" role="STUDENT" />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/student/ai-review"
                    element={
                        <ProtectedRoute allowedRoles={["STUDENT"]}>
                            <GenericPage title="AI Review" role="STUDENT" />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/student/attendance"
                    element={
                        <ProtectedRoute allowedRoles={["STUDENT"]}>
                            <StudentAttendance />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/student/profile"
                    element={
                        <ProtectedRoute allowedRoles={["STUDENT"]}>
                            <StudentProfile />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/student/settings"
                    element={
                        <ProtectedRoute allowedRoles={["STUDENT"]}>
                            <StudentSettings />
                        </ProtectedRoute>
                    }
                />

                {/* Professor Routes (Accessible to PROFESSOR & HOD) */}
                <Route
                    path="/professor/dashboard"
                    element={
                        <ProtectedRoute allowedRoles={["PROFESSOR", "HOD"]}>
                            <ProfessorDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/professor/create-exam"
                    element={
                        <ProtectedRoute allowedRoles={["PROFESSOR", "HOD"]}>
                            <CreateExam />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/professor/create-exam/ai"
                    element={
                        <ProtectedRoute allowedRoles={["PROFESSOR", "HOD"]}>
                            <AIExamGenerator />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/professor/create-exam/manual"
                    element={
                        <ProtectedRoute allowedRoles={["PROFESSOR", "HOD"]}>
                            <ManualExamBuilder />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/professor/upcoming-exams"
                    element={
                        <ProtectedRoute allowedRoles={["PROFESSOR", "HOD"]}>
                            <ProfessorExamsPage defaultCategory="UPCOMING" />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/professor/active-exams"
                    element={
                        <ProtectedRoute allowedRoles={["PROFESSOR", "HOD"]}>
                            <ProfessorExamsPage defaultCategory="ACTIVE" />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/professor/past-exams"
                    element={
                        <ProtectedRoute allowedRoles={["PROFESSOR", "HOD"]}>
                            <ProfessorExamsPage defaultCategory="PAST" />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/professor/ai-evaluation"
                    element={
                        <ProtectedRoute allowedRoles={["PROFESSOR", "HOD"]}>
                            <GenericPage title="AI Evaluation" role="PROFESSOR" />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/professor/results"
                    element={
                        <ProtectedRoute allowedRoles={["PROFESSOR", "HOD"]}>
                            <GenericPage title="Final Results" role="PROFESSOR" />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/professor/attendance"
                    element={
                        <ProtectedRoute allowedRoles={["PROFESSOR", "HOD"]}>
                            <ProfessorAttendance />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/professor/profile"
                    element={
                        <ProtectedRoute allowedRoles={["PROFESSOR", "HOD"]}>
                            <ProfessorProfile />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/professor/settings"
                    element={
                        <ProtectedRoute allowedRoles={["PROFESSOR", "HOD"]}>
                            <ProfessorSettings />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/professor/create-exam/review"
                    element={
                        <ProtectedRoute allowedRoles={["PROFESSOR", "HOD"]}>
                            <ReviewQue />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;