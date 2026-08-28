package com.first.labexam.service;

import com.first.labexam.dto.ExamSummaryResponse;
import com.first.labexam.dto.StudentDashboardResponse;
import com.first.labexam.entity.Exam;
import com.first.labexam.entity.User;
import com.first.labexam.enums.ExamStatus;
import com.first.labexam.repository.ExamRepository;
import com.first.labexam.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class StudentService {

    private static final int RECENT_LIMIT = 5;

    private final UserRepository userRepository;
    private final ExamRepository examRepository;
    private final ExamService examService;

    public StudentService(
            UserRepository userRepository,
            ExamRepository examRepository,
            ExamService examService
    ) {
        this.userRepository = userRepository;
        this.examRepository = examRepository;
        this.examService = examService;
    }

    public StudentDashboardResponse getDashboard(Long studentId) {

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        LocalDateTime now = LocalDateTime.now();
        String batch = student.getBatch();

        StudentDashboardResponse response = new StudentDashboardResponse();

        response.setStudentId(student.getId());
        response.setName(student.getName());
        response.setEmail(student.getEmail());
        response.setEnrollmentNumber(student.getEnrollmentNumber());
        response.setBatch(batch);
        response.setSemester(student.getSemester());
        response.setDepartment(student.getDepartment());

        List<Exam> studentExams;

        if (batch == null || batch.trim().isEmpty()) {
            studentExams = examRepository.findAll().stream()
                    .filter(e -> e.getStatus() == ExamStatus.PUBLISHED)
                    .collect(Collectors.toList());
        } else {
            studentExams = examRepository.findByBatchIgnoreCaseAndStatusOrderByExamDateDesc(
                    batch.trim(), ExamStatus.PUBLISHED);
        }

        List<Exam> activeExams = studentExams.stream()
                .filter(e -> ExamService.isActive(e, now))
                .collect(Collectors.toList());

        List<Exam> upcomingExams = studentExams.stream()
                .filter(e -> ExamService.isUpcoming(e, now))
                .collect(Collectors.toList());

        List<Exam> pastExams = studentExams.stream()
                .filter(e -> ExamService.isPast(e, now) || e.getStatus() == ExamStatus.COMPLETED)
                .collect(Collectors.toList());

        response.setActiveExamsCount(activeExams.size());
        response.setUpcomingExamsCount(upcomingExams.size());
        response.setCompletedExamsCount(pastExams.size());

        response.setActiveExams(limit(mapList(activeExams)));
        response.setUpcomingExams(limit(mapList(upcomingExams)));
        response.setPastExams(limit(mapList(pastExams)));

        return response;
    }

    private List<ExamSummaryResponse> mapList(List<Exam> exams) {
        return exams.stream().map(examService::toSummary).collect(Collectors.toList());
    }

    private List<ExamSummaryResponse> limit(List<ExamSummaryResponse> list) {
        return list.size() > RECENT_LIMIT ? list.subList(0, RECENT_LIMIT) : list;
    }
}