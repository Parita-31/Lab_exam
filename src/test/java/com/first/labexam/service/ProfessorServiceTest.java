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
public class ProfessorServiceTest {

    @Autowired
    private ProfessorService professorService;

    @Autowired
    private StudentService studentService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    public void testUpdateProfessorProfileName() {
        User testProf = new User();
        testProf.setName("Original Professor Name");
        testProf.setEmail("prof_test_" + System.currentTimeMillis() + "@ddu.ac.in");
        testProf.setPassword(passwordEncoder.encode("profPass123"));
        testProf.setRole("PROFESSOR");
        testProf.setDepartment("Information Technology");
        testProf.setStatus("ACTIVE");
        testProf = userRepository.save(testProf);

        Long profId = testProf.getId();
        assertNotNull(profId);

        UpdateProfileRequest updateReq = new UpdateProfileRequest();
        updateReq.setName("Dr. Updated Professor Name");
        updateReq.setDepartment("Computer Engineering");

        UserProfileResponse response = professorService.updateProfile(profId, updateReq);

        assertNotNull(response);
        assertEquals(profId, response.getId());
        assertEquals("Dr. Updated Professor Name", response.getName());
        assertEquals("Computer Engineering", response.getDepartment());

        User persistedUser = userRepository.findById(profId).orElse(null);
        assertNotNull(persistedUser);
        assertEquals("Dr. Updated Professor Name", persistedUser.getName());
        assertEquals("Computer Engineering", persistedUser.getDepartment());

        userRepository.deleteById(profId);
    }

    @Test
    public void testChangePassword() {
        User testProf = new User();
        testProf.setName("Password Test Professor");
        testProf.setEmail("pwd_test_" + System.currentTimeMillis() + "@ddu.ac.in");
        testProf.setPassword(passwordEncoder.encode("currentPass123"));
        testProf.setRole("PROFESSOR");
        testProf.setStatus("ACTIVE");
        testProf = userRepository.save(testProf);

        Long profId = testProf.getId();

        ChangePasswordRequest invalidCurrentReq =
                new ChangePasswordRequest("wrongCurrentPass", "newSecretPass456", "newSecretPass456");
        assertThrows(RuntimeException.class, () -> professorService.changePassword(profId, invalidCurrentReq));

        ChangePasswordRequest mismatchReq =
                new ChangePasswordRequest("currentPass123", "newSecretPass456", "differentSecretPass");
        assertThrows(RuntimeException.class, () -> professorService.changePassword(profId, mismatchReq));

        ChangePasswordRequest validReq =
                new ChangePasswordRequest("currentPass123", "newSecretPass456", "newSecretPass456");
        assertDoesNotThrow(() -> professorService.changePassword(profId, validReq));

        User updatedUser = userRepository.findById(profId).orElse(null);
        assertNotNull(updatedUser);
        assertTrue(passwordEncoder.matches("newSecretPass456", updatedUser.getPassword()));

        userRepository.deleteById(profId);
    }

    @Test
    public void testUserDataIsolationAndCrossRoleAccessRejection() {
        // Create 1 Student and 1 Professor
        User student = new User();
        student.setName("Pure Student");
        student.setEmail("student_iso_" + System.currentTimeMillis() + "@ddu.ac.in");
        student.setPassword(passwordEncoder.encode("studentPass123"));
        student.setRole("STUDENT");
        student.setDepartment("Information Technology");
        student.setEnrollmentNumber("23IT999");
        student.setSemester(5);
        student.setStatus("ACTIVE");
        student = userRepository.save(student);

        User professor = new User();
        professor.setName("Pure Professor");
        professor.setEmail("prof_iso_" + System.currentTimeMillis() + "@ddu.ac.in");
        professor.setPassword(passwordEncoder.encode("profPass123"));
        professor.setRole("PROFESSOR");
        professor.setDepartment("Information Technology");
        professor.setStatus("ACTIVE");
        professor = userRepository.save(professor);

        Long studentId = student.getId();
        Long profId = professor.getId();

        // 1. Attempt to update Student via ProfessorService -> MUST THROW EXCEPTION
        UpdateProfileRequest profUpdateReq = new UpdateProfileRequest();
        profUpdateReq.setName("Malicious Student Overwrite");
        Exception ex1 = assertThrows(RuntimeException.class, () -> {
            professorService.updateProfile(studentId, profUpdateReq);
        });
        assertTrue(ex1.getMessage().contains("Access denied") || ex1.getMessage().contains("not a professor"));

        // 2. Attempt to update Professor via StudentService -> MUST THROW EXCEPTION
        UpdateProfileRequest studUpdateReq = new UpdateProfileRequest();
        studUpdateReq.setName("Malicious Professor Overwrite");
        Exception ex2 = assertThrows(RuntimeException.class, () -> {
            studentService.updateProfile(profId, studUpdateReq);
        });
        assertTrue(ex2.getMessage().contains("Access denied") || ex2.getMessage().contains("not a student"));

        // 3. Attempt to get Student profile via ProfessorService -> MUST THROW EXCEPTION
        assertThrows(RuntimeException.class, () -> professorService.getProfile(studentId));

        // 4. Attempt to get Professor profile via StudentService -> MUST THROW EXCEPTION
        assertThrows(RuntimeException.class, () -> studentService.getProfile(profId));

        // 5. Update Professor correctly and verify student was NOT touched
        profUpdateReq.setName("Dr. Legit Professor");
        professorService.updateProfile(profId, profUpdateReq);

        User studentInDb = userRepository.findById(studentId).orElse(null);
        assertNotNull(studentInDb);
        assertEquals("Pure Student", studentInDb.getName()); // Student untouched!
        assertEquals("STUDENT", studentInDb.getRole());

        User profInDb = userRepository.findById(profId).orElse(null);
        assertNotNull(profInDb);
        assertEquals("Dr. Legit Professor", profInDb.getName()); // Professor updated!
        assertEquals("PROFESSOR", profInDb.getRole());

        // Clean up
        userRepository.deleteById(studentId);
        userRepository.deleteById(profId);
    }
}
