const API_URL = "http://localhost:8080/api";

const getHeaders = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    return {
        "Content-Type": "application/json",
        ...(user.token
            ? { Authorization: `Bearer ${user.token}` }
            : {})
    };
};

const parseErrorMessage = (text, defaultMsg) => {
    try {
        const data = JSON.parse(text);
        return data.error || data.message || defaultMsg;
    } catch (e) {
        return text || defaultMsg;
    }
};

export const saveDraft = async (examData) => {
    console.log("Sending exam to backend:", examData);

    const response = await fetch(`${API_URL}/professor/exams`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(examData)
    });

    const text = await response.text();
    console.log("Backend response:", response.status, text);

    if (!response.ok) {
        throw new Error(parseErrorMessage(text, `Failed to save exam (Status ${response.status})`));
    }

    return JSON.parse(text);
};

export const updateDraft = async (examId, examData) => {
    const response = await fetch(`${API_URL}/professor/exams/${examId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(examData)
    });

    const text = await response.text();

    if (!response.ok) {
        throw new Error(parseErrorMessage(text, "Failed to update draft"));
    }

    return JSON.parse(text);
};

export const publishExam = async (examId) => {
    const response = await fetch(`${API_URL}/professor/exams/${examId}/publish`, {
        method: "POST",
        headers: getHeaders()
    });

    const text = await response.text();

    if (!response.ok) {
        throw new Error(parseErrorMessage(text, "Failed to publish exam"));
    }

    return JSON.parse(text);
};

export const getExam = async (examId) => {
    const response = await fetch(`${API_URL}/professor/exams/${examId}`, {
        headers: getHeaders()
    });

    const text = await response.text();

    if (!response.ok) {
        throw new Error(parseErrorMessage(text, "Failed to load exam"));
    }

    return JSON.parse(text);
};