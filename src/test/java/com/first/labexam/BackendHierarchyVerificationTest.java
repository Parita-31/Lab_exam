package com.first.labexam;

import com.first.labexam.dto.*;
import com.first.labexam.entity.User;
import com.first.labexam.repository.UserRepository;
import com.first.labexam.service.AdminService;
import com.first.labexam.service.AuthService;
import com.first.labexam.service.HodService;
import com.first.labexam.service.StudentImportService;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.List;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
@Transactional
public class BackendHierarchyVerificationTest {

    @Autowired
    private AdminService adminService;

    @Autowired
    private AuthService authService;

    @Autowired
    private HodService hodService;

    @Autowired
    private StudentImportService studentImportService;

    @Autowired
    private UserRepository userRepository;

    private UserProfileResponse createdHod;

    @BeforeEach
    public void setup() {
        // Create an HOD for Information Technology
        CreateHodRequest hodReq = new CreateHodRequest("Dr. IT HOD", "hod.it@ddu.ac.in", "password123", "Information Technology");
        createdHod = adminService.createHod(hodReq);
    }

    @Test
    public void testOneHodPerDepartmentConstraint() {
        // Attempt to create a SECOND active HOD for Information Technology -> MUST fail
        CreateHodRequest duplicateHodReq = new CreateHodRequest("Dr. Duplicate HOD", "hod.it2@ddu.ac.in", "password123", "Information Technology");
        
        RuntimeException exception = Assertions.assertThrows(RuntimeException.class, () -> {
            adminService.createHod(duplicateHodReq);
        });

        Assertions.assertTrue(exception.getMessage().contains("already has an assigned Head of Department"));
    }

    @Test
    public void testProfessorSelfRegistrationAndHodApprovalFlow() {
        // 1. Professor Self-registers -> status PENDING
        ProfessorRegisterRequest regReq = new ProfessorRegisterRequest("Prof. Testing", "prof.testing@ddu.ac.in", "password123", "Information Technology");
        LoginResponse regRes = authService.registerProfessor(regReq);
        
        Assertions.assertEquals("PENDING", regRes.getStatus());

        // 2. Pending Professor login attempt -> MUST FAIL
        LoginRequest loginReq = new LoginRequest();
        loginReq.setIdentifier("prof.testing@ddu.ac.in");
        loginReq.setPassword("password123");

        RuntimeException loginException = Assertions.assertThrows(RuntimeException.class, () -> {
            authService.login(loginReq);
        });
        Assertions.assertTrue(loginException.getMessage().contains("pending HOD approval"));

        // 3. HOD views pending requests
        List<UserProfileResponse> pendingProfs = hodService.getPendingProfessors(createdHod.getId());
        Assertions.assertTrue(pendingProfs.stream().anyMatch(p -> p.getEmail().equalsIgnoreCase("prof.testing@ddu.ac.in")));

        // 4. HOD approves Professor
        UserProfileResponse approvedProf = hodService.approveProfessor(createdHod.getId(), regRes.getUserId());
        Assertions.assertEquals("ACTIVE", approvedProf.getStatus());

        // 5. Approved Professor login -> SUCCESS
        LoginResponse activeLoginRes = authService.login(loginReq);
        Assertions.assertNotNull(activeLoginRes.getToken());
        Assertions.assertEquals("ACTIVE", activeLoginRes.getStatus());
    }

    @Test
    public void testProfessorRejectionFlow() {
        // 1. Professor Self-registers
        ProfessorRegisterRequest regReq = new ProfessorRegisterRequest("Prof. Rejectee", "prof.rejectee@ddu.ac.in", "password123", "Information Technology");
        LoginResponse regRes = authService.registerProfessor(regReq);

        // 2. HOD rejects Professor
        UserProfileResponse rejectedProf = hodService.rejectProfessor(createdHod.getId(), regRes.getUserId());
        Assertions.assertEquals("REJECTED", rejectedProf.getStatus());

        // 3. Rejected Professor login attempt -> MUST FAIL
        LoginRequest loginReq = new LoginRequest();
        loginReq.setIdentifier("prof.rejectee@ddu.ac.in");
        loginReq.setPassword("password123");

        RuntimeException loginException = Assertions.assertThrows(RuntimeException.class, () -> {
            authService.login(loginReq);
        });
        Assertions.assertTrue(loginException.getMessage().contains("rejected by HOD"));
    }

    @Test
    public void testDepartmentIsolationEnforcement() {
        // Create CSE HOD
        CreateHodRequest cseHodReq = new CreateHodRequest("Dr. CSE HOD", "hod.cse@ddu.ac.in", "password123", "Computer Science");
        UserProfileResponse cseHod = adminService.createHod(cseHodReq);

        // Register Professor for Information Technology
        ProfessorRegisterRequest regReq = new ProfessorRegisterRequest("Prof. IT Dept", "prof.itdept@ddu.ac.in", "password123", "Information Technology");
        LoginResponse regRes = authService.registerProfessor(regReq);

        // CSE HOD attempts to approve IT Professor -> MUST FAIL
        RuntimeException isolationException = Assertions.assertThrows(RuntimeException.class, () -> {
            hodService.approveProfessor(cseHod.getId(), regRes.getUserId());
        });
        Assertions.assertTrue(isolationException.getMessage().contains("Access denied"));
    }

    @Test
    public void testBulkStudentImportPreviewAndConfirm() {
        String csvContent = "Name,Email,Enrollment Number,Batch,Semester,Department\n" +
                "Imported Student 1,student1.import@ddu.ac.in,2026IMP01,E1,3,Information Technology\n" +
                "Imported Student 2,student2.import@ddu.ac.in,2026IMP02,E1,3,Information Technology\n" +
                "Invalid Student,invalid-email,2026IMP03,E1,3,Information Technology\n";

        MockMultipartFile csvFile = new MockMultipartFile(
                "file",
                "students.csv",
                "text/csv",
                csvContent.getBytes(StandardCharsets.UTF_8)
        );

        // 1. Preview Import
        StudentImportPreviewResponse preview = studentImportService.previewImport(createdHod.getId(), csvFile);
        Assertions.assertEquals(3, preview.getTotalRows());
        Assertions.assertEquals(2, preview.getValidCount());
        Assertions.assertEquals(1, preview.getInvalidCount());

        // 2. Confirm Import
        List<UserProfileResponse> importedStudents = studentImportService.confirmImport(createdHod.getId(), preview.getRows());
        Assertions.assertEquals(2, importedStudents.size());
        Assertions.assertTrue(userRepository.existsByEmail("student1.import@ddu.ac.in"));
        Assertions.assertTrue(userRepository.existsByEmail("student2.import@ddu.ac.in"));
    }
}
