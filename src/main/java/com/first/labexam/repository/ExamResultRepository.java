package com.first.labexam.repository;

import com.first.labexam.entity.ExamResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExamResultRepository extends JpaRepository<ExamResult, Long> {
    Optional<ExamResult> findFirstByExamIdAndStudentIdOrderByIdDesc(Long examId, Long studentId);
    List<ExamResult> findByExamIdAndStudentId(Long examId, Long studentId);
    List<ExamResult> findByStudentId(Long studentId);
    List<ExamResult> findByExamId(Long examId);
}
