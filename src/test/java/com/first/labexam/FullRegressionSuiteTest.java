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
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.List;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:fullregressiondb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
@Transactional
public class FullRegressionSuiteTest {

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

    private UserProfileResponse hodCivil;
    private UserProfileResponse hodMech;

    @BeforeEach
    public void setup() {
        // Create unique HOD for Civil Engineering for testing
        if (!userRepository.existsByEmail("hod.civil.reg@ddu.ac.in")) {
            CreateHodRequest hodCivilReq = new CreateHodRequest("Dr. Civil HOD", "hod.civil.reg@ddu.ac.in", "password123", "Civil Engineering");
            hodCivil = adminService.createHod(hodCivilReq);
        } else {
            User existing = userRepository.findByEmail("hod.civil.reg@ddu.ac.in").orElseThrow();
            hodCivil = new UserProfileResponse(existing.getId(), existing.getName(), existing.getEmail(), existing.getRole(), existing.getDepartment(), existing.getStatus());
        }

        // Create unique HOD for Mechanical Engineering for testing
        if (!userRepository.existsByEmail("hod.mech.reg@ddu.ac.in")) {
            CreateHodRequest hodMechReq = new CreateHodRequest("Dr. Mech HOD", "hod.mech.reg@ddu.ac.in", "password123", "Mechanical Engineering");
            hodMech = adminService.createHod(hodMechReq);
        } else {
            User existing = userRepository.findByEmail("hod.mech.reg@ddu.ac.in").orElseThrow();
            hodMech = new UserProfileResponse(existing.getId(), existing.getName(), existing.getEmail(), existing.getRole(), existing.getDepartment(), existing.getStatus());
        }
    }

    // --- 1. AUTHENTICATION & LOGIN TESTS ---

    @Test
    @DisplayName("1.1 Login with valid Admin, HOD credentials")
    public void testAuthenticationEveryRole() {
        // Admin Login
        LoginRequest adminLogin = new LoginRequest();
        adminLogin.setIdentifier("admin@ddu.ac.in");
        adminLogin.setPassword("password");
        LoginResponse adminRes = authService.login(adminLogin);
        Assertions.assertNotNull(adminRes.getToken());
        Assertions.assertEquals("ADMIN", adminRes.getRole());

        // HOD Login
        LoginRequest hodLogin = new LoginRequest();
        hodLogin.setIdentifier("hod.civil.reg@ddu.ac.in");
        hodLogin.setPassword("password123");
        LoginResponse hodRes = authService.login(hodLogin);
        Assertions.assertNotNull(hodRes.getToken());
        Assertions.assertEquals("HOD", hodRes.getRole());
    }

    // --- 2. PROFESSOR REGISTRATION & APPROVAL WORKFLOW ---

    @Test
    @DisplayName("2.1 Professor Self-Registration -> PENDING -> HOD Approval -> ACTIVE -> Login Success")
    public void testProfessorSelfRegistrationAndApprovalFlow() {
        // Step 1: Self-register
        ProfessorRegisterRequest reg = new ProfessorRegisterRequest("Prof. Approval Test", "prof.appr@ddu.ac.in", "password123", "Civil Engineering");
        LoginResponse regRes = authService.registerProfessor(reg);
        Assertions.assertEquals("PENDING", regRes.getStatus());

        // Step 2: Login while PENDING -> BLOCKED
        LoginRequest loginReq = new LoginRequest();
        loginReq.setIdentifier("prof.appr@ddu.ac.in");
        loginReq.setPassword("password123");
        RuntimeException pendingEx = Assertions.assertThrows(RuntimeException.class, () -> authService.login(loginReq));
        Assertions.assertTrue(pendingEx.getMessage().contains("pending HOD approval"));

        // Step 3: HOD inspects pending requests
        List<UserProfileResponse> pendingList = hodService.getPendingProfessors(hodCivil.getId());
        Assertions.assertTrue(pendingList.stream().anyMatch(p -> p.getEmail().equalsIgnoreCase("prof.appr@ddu.ac.in")));

        // Step 4: HOD Approves
        UserProfileResponse approved = hodService.approveProfessor(hodCivil.getId(), regRes.getUserId());
        Assertions.assertEquals("ACTIVE", approved.getStatus());

        // Step 5: Login after Approval -> SUCCESS
        LoginResponse loginRes = authService.login(loginReq);
        Assertions.assertNotNull(loginRes.getToken());
        Assertions.assertEquals("ACTIVE", loginRes.getStatus());
        Assertions.assertEquals("PROFESSOR", loginRes.getRole());
    }

    @Test
    @DisplayName("2.2 Professor Self-Registration -> PENDING -> HOD Rejection -> REJECTED -> Login Blocked")
    public void testProfessorRejectionFlow() {
        // Step 1: Self-register
        ProfessorRegisterRequest reg = new ProfessorRegisterRequest("Prof. Reject Test", "prof.rej@ddu.ac.in", "password123", "Civil Engineering");
        LoginResponse regRes = authService.registerProfessor(reg);

        // Step 2: HOD Rejects
        UserProfileResponse rejected = hodService.rejectProfessor(hodCivil.getId(), regRes.getUserId());
        Assertions.assertEquals("REJECTED", rejected.getStatus());

        // Step 3: Login while REJECTED -> BLOCKED
        LoginRequest loginReq = new LoginRequest();
        loginReq.setIdentifier("prof.rej@ddu.ac.in");
        loginReq.setPassword("password123");
        RuntimeException rejEx = Assertions.assertThrows(RuntimeException.class, () -> authService.login(loginReq));
        Assertions.assertTrue(rejEx.getMessage().contains("rejected by HOD"));
    }

    // --- 3. ONE HOD PER DEPARTMENT CONSTRAINT ---

    @Test
    @DisplayName("3.1 Enforce strictly MAX 1 HOD per Department")
    public void testOneHodPerDepartment() {
        // Attempting to create second HOD for Civil Engineering -> MUST FAIL
        CreateHodRequest dupCivilHod = new CreateHodRequest("Dr. Dup Civil", "hod.civil2@ddu.ac.in", "password123", "Civil Engineering");
        RuntimeException ex = Assertions.assertThrows(RuntimeException.class, () -> adminService.createHod(dupCivilHod));
        Assertions.assertTrue(ex.getMessage().contains("already has an assigned Head of Department"));
    }

    // --- 4. HOD DEPARTMENT ISOLATION ---

    @Test
    @DisplayName("4.1 HOD cannot view, approve, or manage another department's professors or students")
    public void testHodDepartmentIsolation() {
        // Register professor in Mechanical department
        ProfessorRegisterRequest mechProfReq = new ProfessorRegisterRequest("Prof. Mech Isolated", "prof.mechisolated@ddu.ac.in", "password123", "Mechanical Engineering");
        LoginResponse mechProfRes = authService.registerProfessor(mechProfReq);

        // Civil HOD attempts to approve Mechanical Professor -> MUST FAIL
        RuntimeException isolationApproveEx = Assertions.assertThrows(RuntimeException.class, () -> {
            hodService.approveProfessor(hodCivil.getId(), mechProfRes.getUserId());
        });
        Assertions.assertTrue(isolationApproveEx.getMessage().contains("Access denied"));

        // Mechanical HOD approves Mechanical Professor -> SUCCESS
        UserProfileResponse approvedMechProf = hodService.approveProfessor(hodMech.getId(), mechProfRes.getUserId());
        Assertions.assertEquals("ACTIVE", approvedMechProf.getStatus());

        // Civil HOD attempts to delete Mechanical Professor -> MUST FAIL
        RuntimeException isolationDeleteEx = Assertions.assertThrows(RuntimeException.class, () -> {
            hodService.deleteDepartmentProfessor(hodCivil.getId(), approvedMechProf.getId());
        });
        Assertions.assertTrue(isolationDeleteEx.getMessage().contains("Access denied"));

        // Add student to Mechanical department via Mech HOD
        CreateStudentRequest studentReq = new CreateStudentRequest();
        studentReq.setName("Mech Student");
        studentReq.setEmail("mechstudent@ddu.ac.in");
        studentReq.setEnrollmentNumber("MECH2026001");
        studentReq.setBatch("2022-2026");
        studentReq.setSemester(4);
        UserProfileResponse createdStudent = hodService.addStudent(hodMech.getId(), studentReq);

        // Civil HOD attempts to update or delete Mechanical Student -> MUST FAIL
        UpdateStudentRequest updateReq = new UpdateStudentRequest();
        updateReq.setName("Hacked Name");
        RuntimeException isolationUpdateEx = Assertions.assertThrows(RuntimeException.class, () -> {
            hodService.updateDepartmentStudent(hodCivil.getId(), createdStudent.getId(), updateReq);
        });
        Assertions.assertTrue(isolationUpdateEx.getMessage().contains("Access denied"));

        RuntimeException isolationDeleteStudentEx = Assertions.assertThrows(RuntimeException.class, () -> {
            hodService.deleteDepartmentStudent(hodCivil.getId(), createdStudent.getId());
        });
        Assertions.assertTrue(isolationDeleteStudentEx.getMessage().contains("Access denied"));
    }

    // --- 5. ADMIN PERMISSIONS ---

    @Test
    @DisplayName("5.1 Admin HOD CRUD and Professor/Student View & Delete")
    public void testAdminPermissions() {
        // Admin views all professors
        List<UserProfileResponse> profs = adminService.getAllProfessors();
        Assertions.assertNotNull(profs);

        // Admin views all students
        List<UserProfileResponse> students = adminService.getAllStudents();
        Assertions.assertNotNull(students);

        // Admin views all HODs
        List<UserProfileResponse> hods = adminService.getAllHods();
        Assertions.assertTrue(hods.size() >= 2);

        // Admin updates HOD
        UpdateHodRequest updateHod = new UpdateHodRequest();
        updateHod.setName("Dr. Civil HOD Updated");
        UserProfileResponse updatedHod = adminService.updateHod(hodCivil.getId(), updateHod);
        Assertions.assertEquals("Dr. Civil HOD Updated", updatedHod.getName());
    }

    // --- 6. STUDENT BULK IMPORT VALIDATION ---

    @Test
    @DisplayName("6.1 Bulk Import with valid and invalid rows (missing fields, duplicate email/enrollment, invalid sem)")
    public void testStudentBulkImportValidation() {
        // First add a student to create existing enrollment & email collisions
        CreateStudentRequest existingStudent = new CreateStudentRequest();
        existingStudent.setName("Existing Student");
        existingStudent.setEmail("existing.civil@ddu.ac.in");
        existingStudent.setEnrollmentNumber("CIVIL_EXISTING");
        existingStudent.setBatch("2022-2026");
        existingStudent.setSemester(5);
        hodService.addStudent(hodCivil.getId(), existingStudent);

        // Prepare CSV with:
        // Row 1: Valid
        // Row 2: Duplicate Email
        // Row 3: Duplicate Enrollment
        // Row 4: Invalid Email Format
        // Row 5: Missing Name & Semester out of range
        String csvContent = "Name,Email,Enrollment Number,Batch,Semester\n" +
                "Valid Student 1,valid1.civil@ddu.ac.in,CIVIL_NEW_01,2022-2026,3\n" +
                "Dup Email Student,existing.civil@ddu.ac.in,CIVIL_NEW_02,2022-2026,3\n" +
                "Dup Enrollment Student,unique.civil@ddu.ac.in,CIVIL_EXISTING,2022-2026,3\n" +
                "Bad Email Student,bad-email-format,CIVIL_NEW_03,2022-2026,3\n" +
                ",valid2.civil@ddu.ac.in,CIVIL_NEW_04,2022-2026,12\n";

        MockMultipartFile csvFile = new MockMultipartFile("file", "import_test.csv", "text/csv", csvContent.getBytes(StandardCharsets.UTF_8));

        // Preview Import
        StudentImportPreviewResponse preview = studentImportService.previewImport(hodCivil.getId(), csvFile);
        Assertions.assertEquals(5, preview.getTotalRows());
        Assertions.assertEquals(1, preview.getValidCount());
        Assertions.assertEquals(4, preview.getInvalidCount());

        // Confirm Import -> Only 1 valid student should be imported
        List<UserProfileResponse> imported = studentImportService.confirmImport(hodCivil.getId(), preview.getRows());
        Assertions.assertEquals(1, imported.size());
        Assertions.assertTrue(userRepository.existsByEmail("valid1.civil@ddu.ac.in"));
    }
}
