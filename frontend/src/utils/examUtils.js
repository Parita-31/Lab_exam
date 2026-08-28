/**
 * Utility functions for calculating exam status (Upcoming, Active, Past),
 * date/time formatting, and status badge styling.
 */

export function parseExamDateTime(examDateStr, startTimeStr) {
    if (!examDateStr) return null;

    try {
        const [year, month, day] = examDateStr.split("-").map(Number);
        let hours = 0;
        let minutes = 0;

        if (startTimeStr) {
            const parts = startTimeStr.split(":").map(Number);
            hours = parts[0] || 0;
            minutes = parts[1] || 0;
        }

        return new Date(year, month - 1, day, hours, minutes, 0);
    } catch (e) {
        console.error("Error parsing exam date time:", e);
        return null;
    }
}

export function getExamCategory(exam) {
    if (!exam) return "UNKNOWN";

    if (exam.status === "DRAFT") {
        return "DRAFT";
    }

    if (exam.status === "COMPLETED") {
        return "PAST";
    }

    const now = new Date();
    const startDate = parseExamDateTime(exam.examDate, exam.startTime);

    if (!startDate) {
        return "UNKNOWN";
    }

    const duration = exam.durationMinutes || 60;
    const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

    if (now < startDate) {
        return "UPCOMING";
    } else if (now >= startDate && now <= endDate) {
        return "ACTIVE";
    } else {
        return "PAST";
    }
}

export function formatExamDate(dateStr) {
    if (!dateStr) return "TBA";
    try {
        const [year, month, day] = dateStr.split("-").map(Number);
        const dateObj = new Date(year, month - 1, day);
        return dateObj.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    } catch (e) {
        return dateStr;
    }
}

export function formatExamTime(timeStr) {
    if (!timeStr) return "TBA";
    try {
        const [hours, minutes] = timeStr.split(":").map(Number);
        const period = hours >= 12 ? "PM" : "AM";
        const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
        const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
        return `${formattedHours}:${formattedMinutes} ${period}`;
    } catch (e) {
        return timeStr;
    }
}

export function getTimeStatusText(exam) {
    const category = getExamCategory(exam);
    const now = new Date();
    const startDate = parseExamDateTime(exam.examDate, exam.startTime);

    if (category === "DRAFT") return "Draft (Not Published)";
    if (!startDate) return "Date Pending";

    const duration = exam.durationMinutes || 60;
    const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

    if (category === "UPCOMING") {
        const diffMs = startDate - now;
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        if (diffHrs > 24) {
            const days = Math.floor(diffHrs / 24);
            return `Starts in ${days} day${days > 1 ? "s" : ""}`;
        } else if (diffHrs > 0) {
            return `Starts in ${diffHrs}h ${diffMins}m`;
        } else {
            return `Starts in ${diffMins} min${diffMins > 1 ? "s" : ""}`;
        }
    } else if (category === "ACTIVE") {
        const diffMs = endDate - now;
        const diffMins = Math.max(0, Math.floor(diffMs / (1000 * 60)));
        return `ACTIVE • Ends in ${diffMins} min${diffMins !== 1 ? "s" : ""}`;
    } else {
        return `Concluded on ${formatExamDate(exam.examDate)}`;
    }
}
