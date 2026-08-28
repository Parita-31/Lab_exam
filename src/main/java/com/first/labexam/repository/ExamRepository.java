package com.first.labexam.repository;

import com.first.labexam.entity.Exam;
import com.first.labexam.enums.ExamStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface ExamRepository extends JpaRepository<Exam, Long> {

    List<Exam> findByProfessorIdOrderByExamDateDesc(Long professorId);

    List<Exam> findByProfessorIdAndStatusOrderByExamDateDesc(Long professorId, ExamStatus status);

    List<Exam> findByProfessorIdAndStatusAndExamDateOrderByStartTimeAsc(
            Long professorId, ExamStatus status, LocalDate date);

    List<Exam> findByProfessorIdAndStatusAndExamDateGreaterThanOrderByExamDateAsc(
            Long professorId, ExamStatus status, LocalDate date);

    List<Exam> findByProfessorIdAndStatusAndExamDateLessThanOrderByExamDateDesc(
            Long professorId, ExamStatus status, LocalDate date);

    long countByProfessorId(Long professorId);

    long countByProfessorIdAndStatus(Long professorId, ExamStatus status);

    long countByProfessorIdAndStatusAndExamDate(Long professorId, ExamStatus status, LocalDate date);

    long countByProfessorIdAndStatusAndExamDateGreaterThan(Long professorId, ExamStatus status, LocalDate date);

    long countByProfessorIdAndStatusAndExamDateLessThan(Long professorId, ExamStatus status, LocalDate date);

    List<Exam> findByBatchAndStatusOrderByExamDateDesc(String batch, ExamStatus status);

    List<Exam> findByBatchAndStatusAndExamDateOrderByStartTimeAsc(
            String batch, ExamStatus status, LocalDate date);

    List<Exam> findByBatchAndStatusAndExamDateGreaterThanOrderByExamDateAsc(
            String batch, ExamStatus status, LocalDate date);

    List<Exam> findByBatchAndStatusAndExamDateLessThanOrderByExamDateDesc(
            String batch, ExamStatus status, LocalDate date);

    long countByBatchAndStatus(String batch, ExamStatus status);

    long countByBatchAndStatusAndExamDate(String batch, ExamStatus status, LocalDate date);

    long countByBatchAndStatusAndExamDateGreaterThan(String batch, ExamStatus status, LocalDate date);

    long countByBatchAndStatusAndExamDateLessThan(String batch, ExamStatus status, LocalDate date);

    List<Exam> findByBatchIgnoreCaseAndStatusOrderByExamDateDesc(String batch, ExamStatus status);

    List<Exam> findByBatchIgnoreCaseAndStatusAndExamDateOrderByStartTimeAsc(
            String batch, ExamStatus status, LocalDate date);

    List<Exam> findByBatchIgnoreCaseAndStatusAndExamDateGreaterThanOrderByExamDateAsc(
            String batch, ExamStatus status, LocalDate date);

    List<Exam> findByBatchIgnoreCaseAndStatusAndExamDateLessThanOrderByExamDateDesc(
            String batch, ExamStatus status, LocalDate date);

    long countByBatchIgnoreCaseAndStatus(String batch, ExamStatus status);

    long countByBatchIgnoreCaseAndStatusAndExamDate(String batch, ExamStatus status, LocalDate date);

    long countByBatchIgnoreCaseAndStatusAndExamDateGreaterThan(String batch, ExamStatus status, LocalDate date);

    long countByBatchIgnoreCaseAndStatusAndExamDateLessThan(String batch, ExamStatus status, LocalDate date);

    List<Exam> findByStatusAndExamDateOrderByStartTimeAsc(ExamStatus status, LocalDate date);

    List<Exam> findByStatusAndExamDateGreaterThanOrderByExamDateAsc(ExamStatus status, LocalDate date);

    List<Exam> findByStatusAndExamDateLessThanOrderByExamDateDesc(ExamStatus status, LocalDate date);

    long countByStatusAndExamDate(ExamStatus status, LocalDate date);

    long countByStatusAndExamDateGreaterThan(ExamStatus status, LocalDate date);

    long countByStatusAndExamDateLessThan(ExamStatus status, LocalDate date);
}