package com.first.labexam.service;

import com.first.labexam.dto.ChangePasswordRequest;
import com.first.labexam.dto.ExamResponse;
import com.first.labexam.dto.ExamSubmissionResponse;
import com.first.labexam.dto.ExamSummaryResponse;
import com.first.labexam.dto.StudentDashboardResponse;
import com.first.labexam.dto.SubmitExamRequest;
import com.first.labexam.dto.UpdateProfileRequest;
import com.first.labexam.dto.UserProfileResponse;
import com.first.labexam.entity.Exam;
import com.first.labexam.entity.ExamAttempt;
import com.first.labexam.entity.ExamQuestion;
import com.first.labexam.entity.ExamResult;
import com.first.labexam.entity.QuestionOption;
import com.first.labexam.entity.StudentAnswer;
import com.first.labexam.entity.User;
import com.first.labexam.enums.AttemptStatus;
import com.first.labexam.enums.ExamStatus;
import com.first.labexam.enums.ResultStatus;
import com.first.labexam.repository.ExamAttemptRepository;
import com.first.labexam.repository.ExamRepository;
import com.first.labexam.repository.ExamResultRepository;
import com.first.labexam.repository.StudentAnswerRepository;
import com.first.labexam.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class StudentService {

    private final UserRepository userRepository;
    private final ExamRepository examRepository;
    private final ExamService examService;
    private final ExamAttemptRepository examAttemptRepository;
    private final ExamResultRepository examResultRepository;
    private final StudentAnswerRepository studentAnswerRepository;
    private final PasswordEncoder passwordEncoder;

    public StudentService(
            UserRepository userRepository,
            ExamRepository examRepository,
            ExamService examService,
            ExamAttemptRepository examAttemptRepository,
            ExamResultRepository examResultRepository,
            StudentAnswerRepository studentAnswerRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.examRepository = examRepository;
        this.examService = examService;
        this.examAttemptRepository = examAttemptRepository;
        this.examResultRepository = examResultRepository;
        this.studentAnswerRepository = studentAnswerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public StudentDashboardResponse getDashboard(Long studentId) {

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found with ID: " + studentId));

        if (student.getRole() == null || !student.getRole().equalsIgnoreCase("STUDENT")) {
            throw new RuntimeException("Access denied: User " + studentId + " is not a student");
        }

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
            String trimmedBatch = batch.trim();
            studentExams = examRepository.findAll().stream()
                    .filter(e -> e.getStatus() == ExamStatus.PUBLISHED)
                    .filter(e -> e.getBatch() == null || e.getBatch().trim().isEmpty()
                            || e.getBatch().equalsIgnoreCase("ALL")
                            || e.getBatch().equalsIgnoreCase(trimmedBatch))
                    .collect(Collectors.toList());
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

        response.setActiveExams(mapList(activeExams));
        response.setUpcomingExams(mapList(upcomingExams));
        response.setPastExams(mapList(pastExams));

        return response;
    }

    @Transactional
    public ExamResponse startExamAttempt(Long examId, Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("Exam not found"));

        Optional<ExamAttempt> existing = examAttemptRepository.findFirstByExamIdAndStudentIdOrderByIdDesc(examId, studentId);
        if (existing.isEmpty()) {
            ExamAttempt attempt = new ExamAttempt();
            attempt.setExam(exam);
            attempt.setStudent(student);
            attempt.setStatus(AttemptStatus.IN_PROGRESS);
            attempt.setStartedAt(LocalDateTime.now());
            examAttemptRepository.save(attempt);
        } else {
            ExamAttempt attempt = existing.get();
            if (attempt.getStatus() == AttemptStatus.NOT_STARTED) {
                attempt.setStatus(AttemptStatus.IN_PROGRESS);
                attempt.setStartedAt(LocalDateTime.now());
                examAttemptRepository.save(attempt);
            }
        }

        return examService.toExamResponse(exam);
    }

    @Transactional
    public ExamSubmissionResponse submitExamAttempt(Long examId, SubmitExamRequest request) {
        Long studentId = request.getStudentId();
        if (studentId == null) {
            throw new RuntimeException("Student ID is required for exam submission");
        }

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("Exam not found"));

        double marksObtained = 0.0;
        int totalMarks = exam.getTotalMarks() != null ? exam.getTotalMarks() : 0;
        int computedTotal = 0;

        Map<String, String> answers = request.getAnswers() != null ? request.getAnswers() : Map.of();

        Optional<ExamAttempt> existingAttempt = examAttemptRepository.findFirstByExamIdAndStudentIdOrderByIdDesc(examId, studentId);
        ExamAttempt attempt = existingAttempt.orElseGet(ExamAttempt::new);
        attempt.setExam(exam);
        attempt.setStudent(student);
        attempt.setStatus(AttemptStatus.SUBMITTED);
        attempt.setSubmittedAt(LocalDateTime.now());
        attempt = examAttemptRepository.save(attempt);

        // Delete existing student answer records for this exam & student to allow clean re-entry
        studentAnswerRepository.deleteByExamIdAndStudentId(examId, studentId);

        if (exam.getQuestions() != null) {
            for (int i = 0; i < exam.getQuestions().size(); i++) {
                ExamQuestion q = exam.getQuestions().get(i);
                int questionMarks = q.getMarks() != null ? q.getMarks() : 1;
                computedTotal += questionMarks;

                String submittedAnswer = answers.get(String.valueOf(i));
                if (submittedAnswer == null && q.getId() != null) {
                    submittedAnswer = answers.get(String.valueOf(q.getId()));
                }

                boolean isCorrect = false;
                String correctAnswerStr = q.getCorrectAnswer();

                if (q.getOptions() != null && !q.getOptions().isEmpty()) {
                    for (QuestionOption opt : q.getOptions()) {
                        if (opt.isCorrect()) {
                            correctAnswerStr = (opt.getOptionLabel() != null ? opt.getOptionLabel() + ": " : "") + opt.getOptionText();
                            if (submittedAnswer != null && (submittedAnswer.equalsIgnoreCase(opt.getOptionLabel())
                                    || submittedAnswer.trim().equalsIgnoreCase(opt.getOptionText().trim()))) {
                                isCorrect = true;
                            }
                        }
                    }
                } else if (q.getCorrectAnswer() != null && submittedAnswer != null) {
                    if (submittedAnswer.trim().equalsIgnoreCase(q.getCorrectAnswer().trim())) {
                        isCorrect = true;
                    }
                }

                double awarded = isCorrect ? (double) questionMarks : 0.0;
                if (isCorrect) {
                    marksObtained += questionMarks;
                }

                StudentAnswer sa = new StudentAnswer();
                sa.setExam(exam);
                sa.setStudent(student);
                sa.setExamAttempt(attempt);
                sa.setQuestion(q);
                sa.setQuestionText(q.getQuestionText());
                sa.setSubmittedAnswer(submittedAnswer != null && !submittedAnswer.trim().isEmpty() ? submittedAnswer : "No Answer");
                sa.setCorrectAnswer(correctAnswerStr != null ? correctAnswerStr : "N/A");
                sa.setCorrect(isCorrect);
                sa.setMarksObtained(awarded);
                sa.setTotalMarks(questionMarks);

                studentAnswerRepository.save(sa);
            }
        }

        if (totalMarks <= 0) {
            totalMarks = computedTotal;
        }

        Optional<ExamResult> existingResult = examResultRepository.findFirstByExamIdAndStudentIdOrderByIdDesc(examId, studentId);
        ExamResult result = existingResult.orElseGet(ExamResult::new);
        result.setExam(exam);
        result.setStudent(student);
        result.setMarksObtained(marksObtained);
        result.setTotalMarks(totalMarks);

        double percentage = totalMarks > 0 ? (marksObtained / (double) totalMarks) * 100 : 0.0;
        if (percentage >= 40.0) {
            result.setStatus(ResultStatus.PASSED);
        } else {
            result.setStatus(ResultStatus.FAILED);
        }
        examResultRepository.save(result);

        ExamSubmissionResponse response = new ExamSubmissionResponse();
        response.setExamId(exam.getId());
        response.setStudentId(student.getId());
        response.setExamTitle(exam.getTitle());
        response.setMarksObtained(marksObtained);
        response.setTotalMarks(totalMarks);
        response.setPercentage(Math.round(percentage * 100.0) / 100.0);
        response.setStatus(result.getStatus().name());
        response.setMessage("Exam submitted successfully!");

        return response;
    }

    public UserProfileResponse getProfile(Long studentId) {
        if (studentId == null) {
            throw new RuntimeException("Student ID cannot be null");
        }

        User user = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found with ID: " + studentId));

        if (user.getRole() == null || !user.getRole().equalsIgnoreCase("STUDENT")) {
            throw new RuntimeException("Access denied: User " + studentId + " is not a student");
        }

        UserProfileResponse response = new UserProfileResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getDepartment(),
                user.getProfileImage()
        );
        response.setEnrollmentNumber(user.getEnrollmentNumber());
        response.setBatch(user.getBatch());
        response.setSemester(user.getSemester());
        response.setStatus(user.getStatus() != null ? user.getStatus() : "ACTIVE");
        response.setCreatedAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null);

        return response;
    }

    @Transactional
    public UserProfileResponse updateProfile(Long studentId, UpdateProfileRequest request) {
        if (studentId == null) {
            throw new RuntimeException("Student ID cannot be null");
        }

        User user = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found with ID: " + studentId));

        if (user.getRole() == null || !user.getRole().equalsIgnoreCase("STUDENT")) {
            throw new RuntimeException("Access denied: User " + studentId + " is not a student");
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

        if (request.getBatch() != null) {
            user.setBatch(request.getBatch().trim());
        }

        if (request.getSemester() != null) {
            user.setSemester(request.getSemester());
        }

        if (request.getEnrollmentNumber() != null && !request.getEnrollmentNumber().trim().isEmpty()) {
            user.setEnrollmentNumber(request.getEnrollmentNumber().trim());
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
        response.setEnrollmentNumber(savedUser.getEnrollmentNumber());
        response.setBatch(savedUser.getBatch());
        response.setSemester(savedUser.getSemester());
        response.setStatus(savedUser.getStatus() != null ? savedUser.getStatus() : "ACTIVE");
        response.setCreatedAt(savedUser.getCreatedAt() != null ? savedUser.getCreatedAt().toString() : null);

        return response;
    }

    @Transactional
    public void changePassword(Long studentId, ChangePasswordRequest request) {
        if (studentId == null) {
            throw new RuntimeException("Student ID cannot be null");
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

        User user = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found with ID: " + studentId));

        if (user.getRole() == null || !user.getRole().equalsIgnoreCase("STUDENT")) {
            throw new RuntimeException("Access denied: User " + studentId + " is not a student");
        }

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    private List<ExamSummaryResponse> mapList(List<Exam> exams) {
        return exams.stream().map(examService::toSummary).collect(Collectors.toList());
    }
}