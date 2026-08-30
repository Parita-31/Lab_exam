package com.first.labexam.service;

import com.first.labexam.dto.ExamSummaryResponse;
import com.first.labexam.dto.OptionRequest;
import com.first.labexam.dto.ProfessorDashboardResponse;
import com.first.labexam.dto.QuestionAnswerDetailDTO;
import com.first.labexam.dto.ChangePasswordRequest;
import com.first.labexam.dto.StudentAnswerPaperDTO;
import com.first.labexam.dto.StudentSubmissionSummaryDTO;
import com.first.labexam.dto.UpdateProfileRequest;
import com.first.labexam.dto.UserProfileResponse;
import com.first.labexam.entity.Exam;
import com.first.labexam.entity.ExamAttempt;
import com.first.labexam.entity.ExamQuestion;
import com.first.labexam.entity.ExamResult;
import com.first.labexam.entity.QuestionOption;
import com.first.labexam.entity.StudentAnswer;
import com.first.labexam.entity.User;
import com.first.labexam.enums.ExamStatus;
import com.first.labexam.repository.ExamAttemptRepository;
import com.first.labexam.repository.ExamRepository;
import com.first.labexam.repository.ExamResultRepository;
import com.first.labexam.repository.StudentAnswerRepository;
import com.first.labexam.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ProfessorService {

    private static final int RECENT_LIMIT = 10;

    private final UserRepository userRepository;
    private final ExamRepository examRepository;
    private final ExamService examService;
    private final ExamResultRepository examResultRepository;
    private final ExamAttemptRepository examAttemptRepository;
    private final StudentAnswerRepository studentAnswerRepository;
    private final PasswordEncoder passwordEncoder;

    public ProfessorService(
            UserRepository userRepository,
            ExamRepository examRepository,
            ExamService examService,
            ExamResultRepository examResultRepository,
            ExamAttemptRepository examAttemptRepository,
            StudentAnswerRepository studentAnswerRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.examRepository = examRepository;
        this.examService = examService;
        this.examResultRepository = examResultRepository;
        this.examAttemptRepository = examAttemptRepository;
        this.studentAnswerRepository = studentAnswerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public ProfessorDashboardResponse getDashboard(Long professorId) {

        User professor = userRepository.findById(professorId)
                .orElseThrow(() -> new RuntimeException("Professor not found with ID: " + professorId));

        if (professor.getRole() == null || !professor.getRole().equalsIgnoreCase("PROFESSOR")) {
            throw new RuntimeException("Access denied: User " + professorId + " is not a professor");
        }

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

        response.setActiveExams(mapList(activeExams));
        response.setUpcomingExams(mapList(upcomingExams));
        response.setPastExams(mapList(pastExams));

        response.setRecentExams(limit(mapList(allProfessorExams)));

        return response;
    }

    public List<StudentSubmissionSummaryDTO> getSubmissionsForProfessor(Long professorId) {
        List<Exam> professorExams = examRepository.findByProfessorIdOrderByExamDateDesc(professorId);
        List<StudentSubmissionSummaryDTO> submissions = new ArrayList<>();

        for (Exam exam : professorExams) {
            List<ExamResult> results = examResultRepository.findByExamId(exam.getId());
            for (ExamResult res : results) {
                User student = res.getStudent();
                StudentSubmissionSummaryDTO dto = new StudentSubmissionSummaryDTO();
                dto.setResultId(res.getId());
                dto.setExamId(exam.getId());
                dto.setExamTitle(exam.getTitle());
                dto.setSubject(exam.getSubject());
                dto.setExamBatch(exam.getBatch());

                if (student != null) {
                    dto.setStudentId(student.getId());
                    dto.setStudentName(student.getName());
                    dto.setStudentEmail(student.getEmail());
                    dto.setEnrollmentNumber(student.getEnrollmentNumber());
                    dto.setStudentBatch(student.getBatch());
                }

                dto.setMarksObtained(res.getMarksObtained());
                dto.setTotalMarks(res.getTotalMarks());
                double total = res.getTotalMarks() != null && res.getTotalMarks() > 0 ? res.getTotalMarks() : 1.0;
                dto.setPercentage(Math.round((res.getMarksObtained() / total) * 100.0 * 100.0) / 100.0);
                dto.setStatus(res.getStatus() != null ? res.getStatus().name() : "COMPLETED");

                if (student != null) {
                    Optional<ExamAttempt> attempt = examAttemptRepository.findFirstByExamIdAndStudentIdOrderByIdDesc(exam.getId(), student.getId());
                    attempt.ifPresent(examAttempt -> dto.setSubmittedAt(examAttempt.getSubmittedAt()));
                }

                submissions.add(dto);
            }
        }

        return submissions;
    }

    public StudentAnswerPaperDTO getStudentAnswerPaper(Long examId, Long studentId, Long professorId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("Exam not found"));

        if (exam.getProfessor() != null && !exam.getProfessor().getId().equals(professorId)) {
            throw new RuntimeException("Unauthorized: This exam was created by another professor.");
        }

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        StudentAnswerPaperDTO paper = new StudentAnswerPaperDTO();
        paper.setExamId(exam.getId());
        paper.setExamTitle(exam.getTitle());
        paper.setSubject(exam.getSubject());
        paper.setExamBatch(exam.getBatch());
        paper.setSemester(exam.getSemester());
        paper.setDurationMinutes(exam.getDurationMinutes());

        paper.setStudentId(student.getId());
        paper.setStudentName(student.getName());
        paper.setStudentEmail(student.getEmail());
        paper.setEnrollmentNumber(student.getEnrollmentNumber());
        paper.setStudentBatch(student.getBatch());

        Optional<ExamResult> resultOpt = examResultRepository.findFirstByExamIdAndStudentIdOrderByIdDesc(examId, studentId);
        if (resultOpt.isPresent()) {
            ExamResult res = resultOpt.get();
            paper.setMarksObtained(res.getMarksObtained());
            paper.setTotalMarks(res.getTotalMarks());
            double total = res.getTotalMarks() != null && res.getTotalMarks() > 0 ? res.getTotalMarks() : 1.0;
            paper.setPercentage(Math.round((res.getMarksObtained() / total) * 100.0 * 100.0) / 100.0);
            paper.setResultStatus(res.getStatus() != null ? res.getStatus().name() : "COMPLETED");
        }

        Optional<ExamAttempt> attemptOpt = examAttemptRepository.findFirstByExamIdAndStudentIdOrderByIdDesc(examId, studentId);
        attemptOpt.ifPresent(attempt -> paper.setSubmittedAt(attempt.getSubmittedAt()));

        List<StudentAnswer> savedAnswers = studentAnswerRepository.findByExamIdAndStudentId(examId, studentId);
        List<QuestionAnswerDetailDTO> qDetails = new ArrayList<>();

        if (exam.getQuestions() != null) {
            for (int i = 0; i < exam.getQuestions().size(); i++) {
                ExamQuestion q = exam.getQuestions().get(i);
                QuestionAnswerDetailDTO detail = new QuestionAnswerDetailDTO();
                detail.setQuestionId(q.getId());
                detail.setQuestionOrder(i + 1);
                detail.setQuestionText(q.getQuestionText());
                detail.setType(q.getQuestionType());
                detail.setMarks(q.getMarks());

                Optional<StudentAnswer> saOpt = savedAnswers.stream()
                        .filter(sa -> sa.getQuestion() != null && sa.getQuestion().getId().equals(q.getId()))
                        .findFirst();

                if (saOpt.isPresent()) {
                    StudentAnswer sa = saOpt.get();
                    detail.setSubmittedAnswer(sa.getSubmittedAnswer());
                    detail.setCorrectAnswer(sa.getCorrectAnswer());
                    detail.setCorrect(sa.isCorrect());
                    detail.setMarksAwarded(sa.getMarksObtained());
                } else {
                    detail.setSubmittedAnswer("No Answer Submitted");
                    detail.setCorrectAnswer(q.getCorrectAnswer() != null ? q.getCorrectAnswer() : "N/A");
                    detail.setCorrect(false);
                    detail.setMarksAwarded(0.0);
                }

                List<OptionRequest> optionDTOs = new ArrayList<>();
                if (q.getOptions() != null) {
                    for (QuestionOption opt : q.getOptions()) {
                        OptionRequest optDto = new OptionRequest();
                        optDto.setLabel(opt.getOptionLabel());
                        optDto.setText(opt.getOptionText());
                        optDto.setCorrect(opt.isCorrect());
                        optionDTOs.add(optDto);
                    }
                }
                detail.setOptions(optionDTOs);

                qDetails.add(detail);
            }
        }

        paper.setQuestions(qDetails);
        return paper;
    }

    public UserProfileResponse getProfile(Long professorId) {
        if (professorId == null) {
            throw new RuntimeException("Professor ID cannot be null");
        }

        User user = userRepository.findById(professorId)
                .orElseThrow(() -> new RuntimeException("Professor not found with ID: " + professorId));

        if (user.getRole() == null || !user.getRole().equalsIgnoreCase("PROFESSOR")) {
            throw new RuntimeException("Access denied: User " + professorId + " is not a professor");
        }

        UserProfileResponse response = new UserProfileResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getDepartment(),
                user.getProfileImage()
        );
        response.setStatus(user.getStatus() != null ? user.getStatus() : "ACTIVE");
        response.setCreatedAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null);
        response.setEnrollmentNumber(user.getEnrollmentNumber());
        response.setDesignation(user.getRole() != null && user.getRole().equalsIgnoreCase("PROFESSOR") ? "Associate Professor" : "Faculty");
        return response;
    }

    @Transactional
    public UserProfileResponse updateProfile(Long professorId, UpdateProfileRequest request) {
        if (professorId == null) {
            throw new RuntimeException("Professor ID cannot be null");
        }

        User user = userRepository.findById(professorId)
                .orElseThrow(() -> new RuntimeException("Professor not found with ID: " + professorId));

        if (user.getRole() == null || !user.getRole().equalsIgnoreCase("PROFESSOR")) {
            throw new RuntimeException("Access denied: User " + professorId + " is not a professor");
        }

        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            user.setName(request.getName().trim());
        }

        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            user.setEmail(request.getEmail().trim());
        }

        if (request.getDepartment() != null) {
            user.setDepartment(request.getDepartment().trim());
        }

        if (request.getProfileImage() != null) {
            user.setProfileImage(request.getProfileImage());
        }

        User savedUser = userRepository.save(user);

        UserProfileResponse response = new UserProfileResponse(
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getRole(),
                savedUser.getDepartment(),
                savedUser.getProfileImage()
        );
        response.setStatus(savedUser.getStatus() != null ? savedUser.getStatus() : "ACTIVE");
        response.setCreatedAt(savedUser.getCreatedAt() != null ? savedUser.getCreatedAt().toString() : null);
        response.setEnrollmentNumber(savedUser.getEnrollmentNumber());
        response.setDesignation(savedUser.getRole() != null && savedUser.getRole().equalsIgnoreCase("PROFESSOR") ? "Associate Professor" : "Faculty");
        return response;
    }

    @Transactional
    public void changePassword(Long professorId, ChangePasswordRequest request) {
        if (professorId == null) {
            throw new RuntimeException("Professor ID cannot be null");
        }

        if (request == null) {
            throw new RuntimeException("Change password request cannot be null");
        }

        if (request.getCurrentPassword() == null || request.getCurrentPassword().trim().isEmpty()) {
            throw new RuntimeException("Current password is required");
        }

        if (request.getNewPassword() == null || request.getNewPassword().trim().isEmpty()) {
            throw new RuntimeException("New password cannot be empty");
        }

        if (request.getNewPassword().length() < 6) {
            throw new RuntimeException("New password must be at least 6 characters long");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("New password and confirm password do not match");
        }

        User user = userRepository.findById(professorId)
                .orElseThrow(() -> new RuntimeException("Professor not found with ID: " + professorId));

        if (user.getRole() == null || !user.getRole().equalsIgnoreCase("PROFESSOR")) {
            throw new RuntimeException("Access denied: User " + professorId + " is not a professor");
        }

        // Check if current password is valid
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        // Encode and save new password to PostgreSQL database
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    private List<ExamSummaryResponse> mapList(List<Exam> exams) {
        return exams.stream().map(examService::toSummary).collect(Collectors.toList());
    }

    private List<ExamSummaryResponse> limit(List<ExamSummaryResponse> list) {
        return list.size() > RECENT_LIMIT ? list.subList(0, RECENT_LIMIT) : list;
    }
}