package com.first.labexam.service;

import com.first.labexam.dto.ExamSummaryResponse;
import com.first.labexam.dto.ProfessorDashboardResponse;
import com.first.labexam.entity.Exam;
import com.first.labexam.entity.User;
import com.first.labexam.enums.ExamStatus;
import com.first.labexam.repository.ExamRepository;
import com.first.labexam.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProfessorService {

    private static final int RECENT_LIMIT = 5;

    private final UserRepository userRepository;
    private final ExamRepository examRepository;
    private final ExamService examService;

    public ProfessorService(
            UserRepository userRepository,
            ExamRepository examRepository,
            ExamService examService
    ) {
        this.userRepository = userRepository;
        this.examRepository = examRepository;
        this.examService = examService;
    }

    public ProfessorDashboardResponse getDashboard(Long professorId) {

        User professor = userRepository.findById(professorId)
                .orElseThrow(() -> new RuntimeException("Professor not found"));

        LocalDateTime now = LocalDateTime.now();

        ProfessorDashboardResponse response = new ProfessorDashboardResponse();

        response.setProfessorId(professor.getId());
        response.setName(professor.getName());
        response.setEmail(professor.getEmail());
        response.setDepartment(professor.getDepartment());

        List<Exam> allProfessorExams = examRepository.findByProfessorIdOrderByExamDateDesc(professorId);

        List<Exam> publishedExams = allProfessorExams.stream()
                .filter(e -> e.getStatus() == ExamStatus.PUBLISHED)
                .collect(Collectors.toList());

        List<Exam> activeExams = publishedExams.stream()
                .filter(e -> ExamService.isActive(e, now))
                .collect(Collectors.toList());

        List<Exam> upcomingExams = publishedExams.stream()
                .filter(e -> ExamService.isUpcoming(e, now))
                .collect(Collectors.toList());

        List<Exam> pastExams = allProfessorExams.stream()
                .filter(e -> e.getStatus() == ExamStatus.COMPLETED || ExamService.isPast(e, now))
                .collect(Collectors.toList());

        long draftCount = allProfessorExams.stream()
                .filter(e -> e.getStatus() == ExamStatus.DRAFT)
                .count();

        response.setTotalExams(allProfessorExams.size());
        response.setDraftExams((int) draftCount);

        response.setActiveExamsCount(activeExams.size());
        response.setUpcomingExamsCount(upcomingExams.size());
        response.setPastExamsCount(pastExams.size());

        response.setTotalStudents(userRepository.countByRole("STUDENT"));

        response.setActiveExams(limit(mapList(activeExams)));
        response.setUpcomingExams(limit(mapList(upcomingExams)));
        response.setPastExams(limit(mapList(pastExams)));

        response.setRecentExams(limit(mapList(allProfessorExams)));

        return response;
    }

    private List<ExamSummaryResponse> mapList(List<Exam> exams) {
        return exams.stream().map(examService::toSummary).collect(Collectors.toList());
    }

    private List<ExamSummaryResponse> limit(List<ExamSummaryResponse> list) {
        return list.size() > RECENT_LIMIT ? list.subList(0, RECENT_LIMIT) : list;
    }
}