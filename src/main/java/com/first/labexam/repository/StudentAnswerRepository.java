package com.first.labexam.repository;

import com.first.labexam.entity.StudentAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentAnswerRepository extends JpaRepository<StudentAnswer, Long> {

    List<StudentAnswer> findByExamIdAndStudentId(Long examId, Long studentId);

    List<StudentAnswer> findByExamId(Long examId);

    List<StudentAnswer> findByStudentId(Long studentId);

    void deleteByExamIdAndStudentId(Long examId, Long studentId);
}
