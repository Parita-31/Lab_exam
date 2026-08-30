package com.first.labexam.service;

import com.first.labexam.dto.ChangePasswordRequest;
import com.first.labexam.dto.UpdateProfileRequest;
import com.first.labexam.dto.UserProfileResponse;
import com.first.labexam.entity.User;
import com.first.labexam.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class StudentServiceTest {

    @Autowired
    private StudentService studentService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    public void testStudentProfileUpdateAndPersistence() {
        // 1. Create a test student
        User student = new User();
        student.setName("Original Student");
        student.setEmail("student_test_" + System.currentTimeMillis() + "@ddu.ac.in");
        student.setEnrollmentNumber("22IT" + (System.currentTimeMillis() % 10000));
        student.setPassword(passwordEncoder.encode("studentPass123"));
        student.setRole("STUDENT");
        student.setDepartment("Information Technology");
        student.setBatch("IT-1");
        student.setSemester(6);
        student.setStatus("ACTIVE");
        student = userRepository.save(student);

        Long studentId = student.getId();
        assertNotNull(studentId);

        // 2. Perform profile update
        UpdateProfileRequest updateReq = new UpdateProfileRequest();
        updateReq.setName("Updated Student Name");
        updateReq.setDepartment("Computer Engineering");
        updateReq.setBatch("CE-2");
        updateReq.setSemester(7);

        UserProfileResponse response = studentService.updateProfile(studentId, updateReq);
        assertNotNull(response);
        assertEquals("Updated Student Name", response.getName());
        assertEquals("Computer Engineering", response.getDepartment());
        assertEquals("CE-2", response.getBatch());
        assertEquals(7, response.getSemester());

        // 3. Verify in PostgreSQL
        User persisted = userRepository.findById(studentId).orElse(null);
        assertNotNull(persisted);
        assertEquals("Updated Student Name", persisted.getName());
        assertEquals("Computer Engineering", persisted.getDepartment());
        assertEquals("CE-2", persisted.getBatch());
        assertEquals(7, persisted.getSemester());

        // 4. Test change password
        ChangePasswordRequest pwdReq = new ChangePasswordRequest("studentPass123", "newStudentPass789", "newStudentPass789");
        assertDoesNotThrow(() -> studentService.changePassword(studentId, pwdReq));

        User pwdUpdated = userRepository.findById(studentId).orElse(null);
        assertNotNull(pwdUpdated);
        assertTrue(passwordEncoder.matches("newStudentPass789", pwdUpdated.getPassword()));

        // Clean up
        userRepository.deleteById(studentId);
    }
}
