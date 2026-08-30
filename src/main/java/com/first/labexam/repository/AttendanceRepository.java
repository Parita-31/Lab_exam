package com.first.labexam.repository;

import com.first.labexam.entity.Attendance;
import com.first.labexam.enums.AttendanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    List<Attendance> findByExamId(Long examId);

    @Query("SELECT a FROM Attendance a JOIN FETCH a.student LEFT JOIN FETCH a.exam WHERE a.exam.id = :examId")
    List<Attendance> findByExamIdWithStudent(@Param("examId") Long examId);

    List<Attendance> findByStudentId(Long studentId);

    List<Attendance> findByStudentIdOrderByAttendanceDateDesc(Long studentId);

    @Query("SELECT a FROM Attendance a JOIN FETCH a.exam WHERE a.student.id = :studentId ORDER BY a.attendanceDate DESC, a.id DESC")
    List<Attendance> findByStudentIdWithExamOrderByAttendanceDateDesc(@Param("studentId") Long studentId);

    Optional<Attendance> findByStudentIdAndExamId(Long studentId, Long examId);

    Optional<Attendance> findByStudentIdAndExamIdAndAttendanceDate(Long studentId, Long examId, LocalDate attendanceDate);

    long countByExamIdAndStatus(Long examId, AttendanceStatus status);

    long countByStudentIdAndStatus(Long studentId, AttendanceStatus status);

    long countByStudentId(Long studentId);
}
