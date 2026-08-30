package com.first.labexam.service;

import com.first.labexam.dto.LoginRequest;
import com.first.labexam.dto.LoginResponse;
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
public class FullUserDataIsolationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private ProfessorService professorService;

    @Autowired
    private StudentService studentService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    public void testFullAuthenticationAndDataIsolationFlow() {
        // Prepare Professor and Student in PostgreSQL
        String profEmail = "prof_iso_flow_" + System.currentTimeMillis() + "@ddu.ac.in";
        String studEmail = "stud_iso_flow_" + System.currentTimeMillis() + "@ddu.ac.in";

        User prof = new User();
        prof.setName("Initial Professor");
        prof.setEmail(profEmail);
        prof.setPassword(passwordEncoder.encode("profPass123"));
        prof.setRole("PROFESSOR");
        prof.setDepartment("Information Technology");
        prof.setStatus("ACTIVE");
        prof = userRepository.save(prof);
        Long profId = prof.getId();

        User stud = new User();
        stud.setName("Initial Student");
        stud.setEmail(studEmail);
        stud.setEnrollmentNumber("23IT888");
        stud.setPassword(passwordEncoder.encode("studPass123"));
        stud.setRole("STUDENT");
        stud.setDepartment("Information Technology");
        stud.setSemester(5);
        stud.setBatch("IT-1");
        stud.setStatus("ACTIVE");
        stud = userRepository.save(stud);
        Long studId = stud.getId();

        try {
            // =========================================================================
            // A. Login as Professor
            // =========================================================================
            LoginResponse profLogin = authService.login(new LoginRequest(profEmail, "profPass123"));
            assertNotNull(profLogin);
            assertEquals(profId, profLogin.getUserId());
            assertEquals("PROFESSOR", profLogin.getRole());
            assertEquals("Initial Professor", profLogin.getName());
            assertEquals(profEmail, profLogin.getEmail());
            assertNotNull(profLogin.getToken());

            // =========================================================================
            // B. Update Professor Name
            // =========================================================================
            UpdateProfileRequest profUpdateReq = new UpdateProfileRequest();
            profUpdateReq.setName("Dr. Updated Professor");
            profUpdateReq.setDepartment("Computer Engineering");

            UserProfileResponse profUpdated = professorService.updateProfile(profId, profUpdateReq);
            assertEquals("Dr. Updated Professor", profUpdated.getName());
            assertEquals("Computer Engineering", profUpdated.getDepartment());

            // Verify in DB directly
            User profInDb = userRepository.findById(profId).orElseThrow();
            assertEquals("Dr. Updated Professor", profInDb.getName());
            assertEquals("Computer Engineering", profInDb.getDepartment());

            // =========================================================================
            // C & D. Logout / Switch to Student Login
            // =========================================================================
            LoginResponse studLogin = authService.login(new LoginRequest(studEmail, "studPass123"));
            assertNotNull(studLogin);
            assertEquals(studId, studLogin.getUserId());
            assertEquals("STUDENT", studLogin.getRole());
            assertEquals("Initial Student", studLogin.getName());
            assertEquals("23IT888", studLogin.getEnrollmentNumber());
            assertEquals(5, studLogin.getSemester());
            assertEquals("IT-1", studLogin.getBatch());

            // =========================================================================
            // E. Verify Student Data remains unchanged
            // =========================================================================
            User studInDb = userRepository.findById(studId).orElseThrow();
            assertEquals("Initial Student", studInDb.getName());
            assertEquals("23IT888", studInDb.getEnrollmentNumber());
            assertEquals("STUDENT", studInDb.getRole());

            // =========================================================================
            // F. Verify Professor Data remains unchanged
            // =========================================================================
            profInDb = userRepository.findById(profId).orElseThrow();
            assertEquals("Dr. Updated Professor", profInDb.getName());
            assertEquals("PROFESSOR", profInDb.getRole());

            // =========================================================================
            // G. Try accessing Professor endpoints using Student ID -> MUST BE DENIED
            // =========================================================================
            Exception exG1 = assertThrows(RuntimeException.class, () -> {
                professorService.getProfile(studId);
            });
            assertTrue(exG1.getMessage().contains("Access denied") || exG1.getMessage().contains("not a professor"));

            Exception exG2 = assertThrows(RuntimeException.class, () -> {
                UpdateProfileRequest hackReq = new UpdateProfileRequest();
                hackReq.setName("Hacked Name");
                professorService.updateProfile(studId, hackReq);
            });
            assertTrue(exG2.getMessage().contains("Access denied") || exG2.getMessage().contains("not a professor"));

            Exception exG3 = assertThrows(RuntimeException.class, () -> {
                professorService.getDashboard(studId);
            });
            assertTrue(exG3.getMessage().contains("Access denied") || exG3.getMessage().contains("not a professor"));

            // =========================================================================
            // H. Try accessing Student endpoints using Professor ID -> MUST BE DENIED
            // =========================================================================
            Exception exH1 = assertThrows(RuntimeException.class, () -> {
                studentService.getProfile(profId);
            });
            assertTrue(exH1.getMessage().contains("Access denied") || exH1.getMessage().contains("not a student"));

            Exception exH2 = assertThrows(RuntimeException.class, () -> {
                UpdateProfileRequest hackReq = new UpdateProfileRequest();
                hackReq.setName("Hacked Name");
                studentService.updateProfile(profId, hackReq);
            });
            assertTrue(exH2.getMessage().contains("Access denied") || exH2.getMessage().contains("not a student"));

            Exception exH3 = assertThrows(RuntimeException.class, () -> {
                studentService.getDashboard(profId);
            });
            assertTrue(exH3.getMessage().contains("Access denied") || exH3.getMessage().contains("not a student"));

            // Re-verify that no hack attempts modified any data in PostgreSQL
            studInDb = userRepository.findById(studId).orElseThrow();
            assertEquals("Initial Student", studInDb.getName());
            profInDb = userRepository.findById(profId).orElseThrow();
            assertEquals("Dr. Updated Professor", profInDb.getName());

        } finally {
            userRepository.deleteById(profId);
            userRepository.deleteById(studId);
        }
    }
}
