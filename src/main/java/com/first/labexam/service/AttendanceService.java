package com.first.labexam.service;

import com.first.labexam.dto.ExamAttendanceRosterDTO;
import com.first.labexam.dto.ExamAttendanceStudentDTO;
import com.first.labexam.dto.ExamSummaryResponse;
import com.first.labexam.dto.SaveAttendanceRequest;
import com.first.labexam.dto.StudentAttendanceMarkRequest;
import com.first.labexam.dto.StudentAttendanceOverviewDTO;
import com.first.labexam.dto.StudentAttendanceRecordDTO;
import com.first.labexam.entity.Attendance;
import com.first.labexam.entity.Exam;
import com.first.labexam.entity.User;
import com.first.labexam.enums.AttendanceStatus;
import com.first.labexam.exception.ApiException;
import com.first.labexam.repository.AttendanceRepository;
import com.first.labexam.repository.ExamRepository;
import com.first.labexam.repository.UserRepository;
import com.first.labexam.security.CustomUserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final ExamRepository examRepository;
    private final UserRepository userRepository;
    private final ExamService examService;

    public AttendanceService(
            AttendanceRepository attendanceRepository,
            ExamRepository examRepository,
            UserRepository userRepository,
            ExamService examService
    ) {
        this.attendanceRepository = attendanceRepository;
        this.examRepository = examRepository;
        this.userRepository = userRepository;
        this.examService = examService;
    }

    public List<ExamSummaryResponse> listProfessorExams(CustomUserPrincipal principal) {
        User professor = requireProfessor(principal);
        return examService.listForProfessor(professor.getId(), "ALL");
    }

    public ExamAttendanceRosterDTO getExamRoster(Long examId, CustomUserPrincipal principal) {
        User professor = requireProfessor(principal);
        Exam exam = requireProfessorExam(examId, professor.getId());
        return buildRoster(exam);
    }

    @Transactional
    public ExamAttendanceRosterDTO saveExamAttendance(
            Long examId,
            SaveAttendanceRequest request,
            CustomUserPrincipal principal
    ) {
        User professor = requireProfessor(principal);
        Exam exam = requireProfessorExam(examId, professor.getId());
        LocalDate attendanceDate = resolveAttendanceDate(exam);

        List<User> eligibleStudents = eligibleStudentsForExam(exam);
        Map<Long, User> eligibleById = eligibleStudents.stream()
                .collect(Collectors.toMap(User::getId, student -> student, (a, b) -> a));

        for (StudentAttendanceMarkRequest mark : request.getMarks()) {
            if (mark.getStudentId() == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Student ID is required for each attendance mark");
            }

            final User student;
            User existingStudent = eligibleById.get(mark.getStudentId());
            if (existingStudent != null) {
                student = existingStudent;
            } else {
                User dbStudent = userRepository.findById(mark.getStudentId())
                        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Student not found with ID: " + mark.getStudentId()));
                if (!isStudentRole(dbStudent) || !isEligibleForExam(dbStudent, exam)) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "Student " + mark.getStudentId() + " is not eligible for this exam");
                }
                student = dbStudent;
            }

            AttendanceStatus status = parseStatus(mark.getStatus());

            Attendance attendance = attendanceRepository
                    .findByStudentIdAndExamIdAndAttendanceDate(student.getId(), exam.getId(), attendanceDate)
                    .orElseGet(() -> attendanceRepository
                            .findByStudentIdAndExamId(student.getId(), exam.getId())
                            .filter(existing -> existing.getAttendanceDate() == null
                                    || existing.getAttendanceDate().equals(attendanceDate))
                            .orElse(new Attendance()));

            attendance.setStudent(student);
            attendance.setExam(exam);
            attendance.setAttendanceDate(attendanceDate);
            attendance.setStatus(status);
            attendanceRepository.save(attendance);
        }

        return buildRoster(exam);
    }

    public StudentAttendanceOverviewDTO getLoggedInStudentAttendance(CustomUserPrincipal principal) {
        User student = requireStudent(principal);

        List<Attendance> records = attendanceRepository.findByStudentIdWithExamOrderByAttendanceDateDesc(student.getId());

        int presentCount = 0;
        int absentCount = 0;
        List<StudentAttendanceRecordDTO> dtoRecords = new ArrayList<>();

        for (Attendance attendance : records) {
            if (attendance.getStatus() == AttendanceStatus.PRESENT) {
                presentCount++;
            } else if (attendance.getStatus() == AttendanceStatus.ABSENT) {
                absentCount++;
            }

            Exam exam = attendance.getExam();
            StudentAttendanceRecordDTO row = new StudentAttendanceRecordDTO();
            row.setExamId(exam != null ? exam.getId() : null);
            row.setExamName(exam != null ? exam.getTitle() : "Unknown exam");
            row.setSubject(exam != null ? exam.getSubject() : null);
            row.setExamDate(attendance.getAttendanceDate() != null
                    ? attendance.getAttendanceDate()
                    : (exam != null ? exam.getExamDate() : null));
            row.setStatus(attendance.getStatus() != null ? attendance.getStatus().name() : "ABSENT");
            dtoRecords.add(row);
        }

        int totalExams = records.size();
        double percentage = totalExams == 0 ? 0.0 : Math.round((presentCount * 100.0 / totalExams) * 100.0) / 100.0;

        StudentAttendanceOverviewDTO overview = new StudentAttendanceOverviewDTO();
        overview.setTotalExams(totalExams);
        overview.setPresentCount(presentCount);
        overview.setAbsentCount(absentCount);
        overview.setPercentage(percentage);
        overview.setRecords(dtoRecords);
        return overview;
    }

    private ExamAttendanceRosterDTO buildRoster(Exam exam) {
        List<User> students = eligibleStudentsForExam(exam);
        List<Attendance> existing = attendanceRepository.findByExamIdWithStudent(exam.getId());
        LocalDate attendanceDate = resolveAttendanceDate(exam);

        Map<Long, Attendance> attendanceByStudent = new HashMap<>();
        for (Attendance attendance : existing) {
            if (attendance.getStudent() == null) {
                continue;
            }
            if (attendance.getAttendanceDate() == null || attendance.getAttendanceDate().equals(attendanceDate)) {
                attendanceByStudent.put(attendance.getStudent().getId(), attendance);
            }
        }

        Set<Long> rosterIds = students.stream().map(User::getId).collect(Collectors.toSet());
        for (Attendance attendance : existing) {
            User markedStudent = attendance.getStudent();
            if (markedStudent != null && rosterIds.add(markedStudent.getId())) {
                students.add(markedStudent);
            }
        }

        students.sort(Comparator
                .comparing((User u) -> u.getEnrollmentNumber() == null ? "" : u.getEnrollmentNumber(), String.CASE_INSENSITIVE_ORDER)
                .thenComparing(u -> u.getName() == null ? "" : u.getName(), String.CASE_INSENSITIVE_ORDER));

        List<ExamAttendanceStudentDTO> studentDtos = new ArrayList<>();
        int presentCount = 0;
        int absentCount = 0;
        int unmarkedCount = 0;

        for (User student : students) {
            Attendance attendance = attendanceByStudent.get(student.getId());
            ExamAttendanceStudentDTO dto = new ExamAttendanceStudentDTO();
            dto.setStudentId(student.getId());
            dto.setEnrollmentNumber(student.getEnrollmentNumber());
            dto.setStudentName(student.getName());
            dto.setBatch(student.getBatch());
            if (attendance != null && attendance.getStatus() != null) {
                dto.setStatus(attendance.getStatus().name());
                dto.setAttendanceId(attendance.getId());
                if (attendance.getStatus() == AttendanceStatus.PRESENT) {
                    presentCount++;
                } else {
                    absentCount++;
                }
            } else {
                dto.setStatus(null);
                unmarkedCount++;
            }
            studentDtos.add(dto);
        }

        ExamAttendanceRosterDTO roster = new ExamAttendanceRosterDTO();
        roster.setExamId(exam.getId());
        roster.setExamTitle(exam.getTitle());
        roster.setSubject(exam.getSubject());
        roster.setBatch(exam.getBatch());
        roster.setExamDate(exam.getExamDate());
        roster.setTotalStudents(studentDtos.size());
        roster.setPresentCount(presentCount);
        roster.setAbsentCount(absentCount);
        roster.setUnmarkedCount(unmarkedCount);
        roster.setStudents(studentDtos);
        return roster;
    }

    private List<User> eligibleStudentsForExam(Exam exam) {
        return userRepository.findByRole("STUDENT").stream()
                .filter(this::isActiveStudent)
                .filter(student -> isEligibleForExam(student, exam))
                .collect(Collectors.toCollection(ArrayList::new));
    }

    private boolean isEligibleForExam(User student, Exam exam) {
        if (!isStudentRole(student)) {
            return false;
        }
        String examBatch = exam.getBatch();
        if (examBatch == null || examBatch.isBlank() || examBatch.equalsIgnoreCase("ALL")) {
            return true;
        }
        String studentBatch = student.getBatch();
        if (studentBatch == null || studentBatch.isBlank()) {
            return false;
        }
        return examBatch.trim().equalsIgnoreCase(studentBatch.trim());
    }

    private boolean isActiveStudent(User student) {
        return student.getStatus() == null || student.getStatus().equalsIgnoreCase("ACTIVE");
    }

    private boolean isStudentRole(User user) {
        return user.getRole() != null && user.getRole().equalsIgnoreCase("STUDENT");
    }

    private LocalDate resolveAttendanceDate(Exam exam) {
        return exam.getExamDate() != null ? exam.getExamDate() : LocalDate.now();
    }

    private AttendanceStatus parseStatus(String status) {
        if (status == null || status.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Attendance status is required");
        }
        try {
            return AttendanceStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid attendance status. Use PRESENT or ABSENT");
        }
    }

    private Exam requireProfessorExam(Long examId, Long professorId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Exam not found with ID: " + examId));
        Long ownerId = exam.getProfessor() != null ? exam.getProfessor().getId() : exam.getCreatedBy();
        if (ownerId == null || !ownerId.equals(professorId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You can only manage attendance for your own exams");
        }
        return exam;
    }

    private User requireProfessor(CustomUserPrincipal principal) {
        User user = resolveUser(principal);
        if (user.getRole() == null || !user.getRole().equalsIgnoreCase("PROFESSOR")) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Access denied: professor role required");
        }
        return user;
    }

    private User requireStudent(CustomUserPrincipal principal) {
        User user = resolveUser(principal);
        if (user.getRole() == null || !user.getRole().equalsIgnoreCase("STUDENT")) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Access denied: student role required");
        }
        return user;
    }

    private User resolveUser(CustomUserPrincipal principal) {
        if (principal.getUserId() != null) {
            return userRepository.findById(principal.getUserId())
                    .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user was not found"));
        }
        if (principal.getEmail() != null && !principal.getEmail().isBlank()) {
            return userRepository.findByEmail(principal.getEmail())
                    .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user was not found"));
        }
        throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required");
    }
}
