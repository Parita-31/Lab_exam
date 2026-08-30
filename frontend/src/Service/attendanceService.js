const API_URL = "http://localhost:8080/api";

const getHeaders = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = user.token || localStorage.getItem("token");

    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
};

const parseErrorMessage = async (response, defaultMsg) => {
    const text = await response.text();
    try {
        const data = JSON.parse(text);
        return data.message || data.error || defaultMsg;
    } catch (e) {
        return text || defaultMsg;
    }
};

export const getProfessorAttendanceExams = async () => {
    const response = await fetch(`${API_URL}/professor/attendance/exams`, {
        headers: getHeaders()
    });
    if (!response.ok) {
        throw new Error(await parseErrorMessage(response, "Failed to load exams"));
    }
    return response.json();
};

export const getExamAttendanceRoster = async (examId) => {
    const response = await fetch(`${API_URL}/professor/attendance/exams/${examId}`, {
        headers: getHeaders()
    });
    if (!response.ok) {
        throw new Error(await parseErrorMessage(response, "Failed to load attendance"));
    }
    return response.json();
};

export const saveExamAttendance = async (examId, marks) => {
    const response = await fetch(`${API_URL}/professor/attendance/exams/${examId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ marks })
    });
    if (!response.ok) {
        throw new Error(await parseErrorMessage(response, "Failed to save attendance"));
    }
    return response.json();
};

export const getStudentAttendance = async () => {
    const response = await fetch(`${API_URL}/student/attendance`, {
        headers: getHeaders()
    });
    if (!response.ok) {
        throw new Error(await parseErrorMessage(response, "Failed to load attendance"));
    }
    return response.json();
};
