package com.first.labexam.service;

import com.first.labexam.dto.CreateExamRequest;
import com.first.labexam.dto.ExamResponse;
import com.first.labexam.dto.ExamSummaryResponse;
import com.first.labexam.dto.OptionRequest;
import com.first.labexam.dto.QuestionRequest;
import com.first.labexam.entity.Exam;
import com.first.labexam.entity.ExamQuestion;
import com.first.labexam.entity.QuestionOption;
import com.first.labexam.entity.User;
import com.first.labexam.enums.ExamStatus;
import com.first.labexam.repository.ExamAttemptRepository;
import com.first.labexam.repository.ExamRepository;
import com.first.labexam.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ExamService {

    private final ExamRepository examRepository;
    private final UserRepository userRepository;
    private final ExamAttemptRepository examAttemptRepository;


    public ExamService(
            ExamRepository examRepository,
            UserRepository userRepository,
            ExamAttemptRepository examAttemptRepository
    ) {
        this.examRepository = examRepository;
        this.userRepository = userRepository;
        this.examAttemptRepository = examAttemptRepository;
    }


    @Transactional
    public ExamResponse createExam(CreateExamRequest request) {

        if (request.getProfessorId() == null) {
            throw new RuntimeException("Professor id is required to create an exam");
        }

        User professor = userRepository.findById(request.getProfessorId())
                .orElseThrow(() -> new RuntimeException("Professor not found"));

        Exam exam = new Exam();

        applyRequestToExam(exam, request);

        exam.setProfessor(professor);
        exam.setCreatedBy(professor.getId());
        exam.setStatus(ExamStatus.DRAFT);

        return toExamResponse(examRepository.save(exam));
    }


    @Transactional
    public ExamResponse updateExam(Long id, CreateExamRequest request) {

        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Exam not found"));

        if (exam.getStatus() != ExamStatus.DRAFT) {
            throw new RuntimeException("Only draft exams can be edited");
        }

        applyRequestToExam(exam, request);

        return toExamResponse(examRepository.save(exam));
    }


    private void applyRequestToExam(Exam exam, CreateExamRequest request) {

        String title = request.getTitle();

        if (title == null || title.trim().isEmpty()) {
            title = (request.getSubject() != null ? request.getSubject() : "Lab Exam")
                    + " - " + (request.getBatch() != null ? request.getBatch() : "");
        }

        exam.setTitle(title.trim());
        exam.setSubject(request.getSubject());
        exam.setBatch(request.getBatch());
        exam.setSemester(request.getSemester());
        exam.setExamDate(request.getExamDate());
        exam.setStartTime(request.getStartTime());
        exam.setDurationMinutes(request.getDurationMinutes());
        exam.setTotalMarks(request.getTotalMarks());
        exam.setCreationMode(request.getCreationMode());

        exam.getQuestions().clear();

        if (request.getQuestions() != null) {

            int order = 1;

            for (QuestionRequest questionRequest : request.getQuestions()) {

                ExamQuestion question = new ExamQuestion();

                question.setQuestionText(questionRequest.getQuestionText());
                question.setQuestionType(questionRequest.getType());
                question.setMarks(questionRequest.getMarks());
                question.setCorrectAnswer(questionRequest.getCorrectAnswer());
                question.setQuestionOrder(order++);
                question.setExam(exam);

                if (questionRequest.getOptions() != null) {

                    for (OptionRequest optionRequest : questionRequest.getOptions()) {

                        QuestionOption option = new QuestionOption();

                        option.setOptionLabel(optionRequest.getLabel());
                        option.setOptionText(optionRequest.getText());
                        option.setCorrect(optionRequest.isCorrect());
                        option.setQuestion(question);

                        question.getOptions().add(option);
                    }
                }

                exam.getQuestions().add(question);
            }
        }
    }


    public ExamResponse getExam(Long id) {

        return toExamResponse(
                examRepository.findById(id)
                        .orElseThrow(() -> new RuntimeException("Exam not found"))
        );
    }


    @Transactional
    public ExamResponse publishExam(Long id) {

        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Exam not found"));

        if (exam.getStatus() != ExamStatus.DRAFT) {
            throw new RuntimeException("Only draft exams can be published");
        }

        if (exam.getQuestions() == null || exam.getQuestions().isEmpty()) {
            throw new RuntimeException("Exam must contain at least one question");
        }

        int marks = 0;

        for (ExamQuestion question : exam.getQuestions()) {

            if (question.getQuestionText() == null || question.getQuestionText().trim().isEmpty()) {
                throw new RuntimeException("Question text cannot be empty");
            }

            if (question.getMarks() == null || question.getMarks() <= 0) {
                throw new RuntimeException("Question marks must be greater than zero");
            }

            marks += question.getMarks();
        }

        if (exam.getTotalMarks() == null || exam.getTotalMarks() <= 0 || marks != exam.getTotalMarks()) {
            exam.setTotalMarks(marks);
        }

        exam.setStatus(ExamStatus.PUBLISHED);

        return toExamResponse(examRepository.save(exam));
    }


    @Transactional
    public void deleteExam(Long id) {

        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Exam not found"));

        examRepository.delete(exam);
    }

    public static boolean isUpcoming(Exam exam, LocalDateTime now) {
        if (exam.getExamDate() == null) return false;
        LocalDate today = now.toLocalDate();
        LocalTime currentTime = now.toLocalTime();

        if (exam.getExamDate().isAfter(today)) {
            return true;
        }
        if (exam.getExamDate().isEqual(today)) {
            return exam.getStartTime() != null && exam.getStartTime().isAfter(currentTime);
        }
        return false;
    }

    public static boolean isActive(Exam exam, LocalDateTime now) {
        if (exam.getExamDate() == null) return false;
        LocalDate today = now.toLocalDate();
        LocalTime currentTime = now.toLocalTime();

        if (!exam.getExamDate().isEqual(today)) {
            return false;
        }

        if (exam.getStartTime() == null) {
            return true;
        }

        if (currentTime.isBefore(exam.getStartTime())) {
            return false;
        }

        int duration = exam.getDurationMinutes() != null ? exam.getDurationMinutes() : 60;
        LocalTime endTime = exam.getStartTime().plusMinutes(duration);

        if (endTime.isBefore(exam.getStartTime())) {
            return true;
        }

        return !currentTime.isAfter(endTime);
    }

    public static boolean isPast(Exam exam, LocalDateTime now) {
        if (exam.getStatus() == ExamStatus.COMPLETED) {
            return true;
        }
        if (exam.getExamDate() == null) return false;
        LocalDate today = now.toLocalDate();
        LocalTime currentTime = now.toLocalTime();

        if (exam.getExamDate().isBefore(today)) {
            return true;
        }

        if (exam.getExamDate().isEqual(today)) {
            if (exam.getStartTime() != null) {
                int duration = exam.getDurationMinutes() != null ? exam.getDurationMinutes() : 60;
                LocalTime endTime = exam.getStartTime().plusMinutes(duration);
                if (!endTime.isBefore(exam.getStartTime())) {
                    return currentTime.isAfter(endTime);
                }
            }
        }

        return false;
    }

    public List<ExamSummaryResponse> listForProfessor(Long professorId, String filter) {
        LocalDateTime now = LocalDateTime.now();
        String normalizedFilter = filter == null ? "ALL" : filter.toUpperCase();

        List<Exam> allExams = examRepository.findByProfessorIdOrderByExamDateDesc(professorId);

        List<Exam> filteredExams;

        switch (normalizedFilter) {
            case "DRAFT":
                filteredExams = allExams.stream()
                        .filter(e -> e.getStatus() == ExamStatus.DRAFT)
                        .collect(Collectors.toList());
                break;

            case "ACTIVE":
                filteredExams = allExams.stream()
                        .filter(e -> e.getStatus() == ExamStatus.PUBLISHED && isActive(e, now))
                        .collect(Collectors.toList());
                break;

            case "UPCOMING":
                filteredExams = allExams.stream()
                        .filter(e -> e.getStatus() == ExamStatus.PUBLISHED && isUpcoming(e, now))
                        .collect(Collectors.toList());
                break;

            case "PAST":
                filteredExams = allExams.stream()
                        .filter(e -> e.getStatus() == ExamStatus.COMPLETED || isPast(e, now))
                        .collect(Collectors.toList());
                break;

            default:
                filteredExams = allExams;
        }

        return filteredExams.stream().map(this::toSummary).collect(Collectors.toList());
    }

    public List<ExamSummaryResponse> listForStudent(Long studentId, String filter) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        if (student.getBatch() == null || student.getBatch().trim().isEmpty()) {
            return new ArrayList<>();
        }

        LocalDateTime now = LocalDateTime.now();
        String normalizedFilter = filter == null ? "UPCOMING" : filter.toUpperCase();
        String trimmedBatch = student.getBatch().trim();

        List<Exam> publishedExams = examRepository.findByBatchIgnoreCaseAndStatusOrderByExamDateDesc(
                trimmedBatch, ExamStatus.PUBLISHED);

        List<Exam> filteredExams;

        switch (normalizedFilter) {
            case "ACTIVE":
                filteredExams = publishedExams.stream()
                        .filter(e -> isActive(e, now))
                        .collect(Collectors.toList());
                break;

            case "PAST":
                filteredExams = publishedExams.stream()
                        .filter(e -> isPast(e, now) || e.getStatus() == ExamStatus.COMPLETED)
                        .collect(Collectors.toList());
                break;

            case "ALL":
                filteredExams = publishedExams;
                break;

            case "UPCOMING":
            default:
                filteredExams = publishedExams.stream()
                        .filter(e -> isUpcoming(e, now))
                        .collect(Collectors.toList());
                break;
        }

        return filteredExams.stream().map(this::toSummary).collect(Collectors.toList());
    }


    public ExamResponse toExamResponse(Exam exam) {

        ExamResponse response = new ExamResponse();

        response.setId(exam.getId());
        response.setTitle(exam.getTitle());
        response.setSubject(exam.getSubject());
        response.setBatch(exam.getBatch());
        response.setSemester(exam.getSemester());
        response.setExamDate(exam.getExamDate());
        response.setStartTime(exam.getStartTime());
        response.setDurationMinutes(exam.getDurationMinutes());
        response.setTotalMarks(exam.getTotalMarks());
        response.setCreationMode(exam.getCreationMode());
        response.setStatus(exam.getStatus() != null ? exam.getStatus().name() : null);

        if (exam.getProfessor() != null) {
            response.setProfessorId(exam.getProfessor().getId());
            response.setProfessorName(exam.getProfessor().getName());
        }

        response.setQuestionCount(exam.getQuestions() != null ? exam.getQuestions().size() : 0);
        response.setStudentsAppeared((int) examAttemptRepository.countByExamId(exam.getId()));

        List<QuestionRequest> questions = new ArrayList<>();

        if (exam.getQuestions() != null) {

            for (ExamQuestion question : exam.getQuestions()) {

                QuestionRequest questionResponse = new QuestionRequest();

                questionResponse.setQuestionText(question.getQuestionText());
                questionResponse.setType(question.getQuestionType());
                questionResponse.setMarks(question.getMarks());
                questionResponse.setCorrectAnswer(question.getCorrectAnswer());

                List<OptionRequest> options = new ArrayList<>();

                if (question.getOptions() != null) {

                    for (QuestionOption option : question.getOptions()) {

                        OptionRequest optionResponse = new OptionRequest();

                        optionResponse.setLabel(option.getOptionLabel());
                        optionResponse.setText(option.getOptionText());
                        optionResponse.setCorrect(option.isCorrect());

                        options.add(optionResponse);
                    }
                }

                questionResponse.setOptions(options);

                questions.add(questionResponse);
            }
        }

        response.setQuestions(questions);

        return response;
    }


    public ExamSummaryResponse toSummary(Exam exam) {

        ExamSummaryResponse summary = new ExamSummaryResponse();

        summary.setId(exam.getId());
        summary.setTitle(exam.getTitle());
        summary.setSubject(exam.getSubject());
        summary.setBatch(exam.getBatch());
        summary.setSemester(exam.getSemester());
        summary.setExamDate(exam.getExamDate());
        summary.setStartTime(exam.getStartTime());
        summary.setDurationMinutes(exam.getDurationMinutes());
        summary.setTotalMarks(exam.getTotalMarks());
        summary.setStatus(exam.getStatus() != null ? exam.getStatus().name() : null);

        if (exam.getProfessor() != null) {
            summary.setProfessorName(exam.getProfessor().getName());
        }

        summary.setQuestionCount(exam.getQuestions() != null ? exam.getQuestions().size() : 0);
        summary.setStudentsAppeared((int) examAttemptRepository.countByExamId(exam.getId()));

        return summary;
    }
}