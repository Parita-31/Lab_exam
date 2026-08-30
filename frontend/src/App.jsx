import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import StudentDashboard from "./pages/Student/StudentDashboard";
import ProfessorDashboard from "./pages/Professor/ProfessorDashboard";
import CreateExam from "./pages/Professor/CreateExam";
import AIExamGenerator from "./pages/Professor/AIExamGenerator";
import ManualExamBuilder from "./pages/Professor/ManualExamBuilder";
import ProfessorExamsPage from "./pages/Professor/ProfessorExamsPage";
import StudentExamsPage from "./pages/Student/StudentExamsPage";
import StudentSettings from "./pages/Student/StudentSettings";
import StudentProfile from "./pages/Student/StudentProfile";
import ProfessorSettings from "./pages/Professor/ProfessorSettings";
import ProfessorProfile from "./pages/Professor/ProfessorProfile";
import GenericPage from "./pages/GenericPage";
import ProfessorAttendance from "./pages/Professor/ProfessorAttendance";
import StudentAttendance from "./pages/Student/StudentAttendance";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Auth Routes */}
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />

                {/* Student Routes */}
                <Route path="/student/dashboard" element={<StudentDashboard />} />
                <Route path="/student/upcoming-exams" element={<StudentExamsPage defaultCategory="UPCOMING" />} />
                <Route path="/student/active-exams" element={<StudentExamsPage defaultCategory="ACTIVE" />} />
                <Route path="/student/past-exams" element={<StudentExamsPage defaultCategory="PAST" />} />
                <Route path="/student/results" element={<GenericPage title="Final Results" role="STUDENT" />} />
                <Route path="/student/ai-review" element={<GenericPage title="AI Review" role="STUDENT" />} />
                <Route path="/student/attendance" element={<StudentAttendance />} />
                <Route path="/student/profile" element={<StudentProfile />} />
                <Route path="/student/settings" element={<StudentSettings />} />

                {/* Professor Routes */}
                <Route path="/professor/dashboard" element={<ProfessorDashboard />} />
                <Route path="/professor/create-exam" element={<CreateExam />} />
                <Route path="/professor/create-exam/ai" element={<AIExamGenerator />} />
                <Route path="/professor/create-exam/manual" element={<ManualExamBuilder />} />
                <Route path="/professor/upcoming-exams" element={<ProfessorExamsPage defaultCategory="UPCOMING" />} />
                <Route path="/professor/active-exams" element={<ProfessorExamsPage defaultCategory="ACTIVE" />} />
                <Route path="/professor/past-exams" element={<ProfessorExamsPage defaultCategory="PAST" />} />
                <Route path="/professor/ai-evaluation" element={<GenericPage title="AI Evaluation" role="PROFESSOR" />} />
                <Route path="/professor/results" element={<GenericPage title="Final Results" role="PROFESSOR" />} />
                <Route path="/professor/attendance" element={<ProfessorAttendance />} />
                <Route path="/professor/profile" element={<ProfessorProfile />} />
                <Route path="/professor/settings" element={<ProfessorSettings />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;