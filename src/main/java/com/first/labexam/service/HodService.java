package com.first.labexam.service;

import com.first.labexam.dto.CreateStudentRequest;
import com.first.labexam.dto.UpdateStudentRequest;
import com.first.labexam.dto.UserProfileResponse;
import com.first.labexam.entity.User;
import com.first.labexam.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class HodService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public HodService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User validateHod(Long hodId) {
        if (hodId == null) {
            throw new RuntimeException("HOD ID cannot be null");
        }
        User hod = userRepository.findById(hodId)
                .orElseThrow(() -> new RuntimeException("HOD not found with ID: " + hodId));

        String role = hod.getRole() != null ? hod.getRole().toUpperCase() : "";
        if (!"HOD".equals(role) && !"ADMIN".equals(role)) {
            throw new RuntimeException("Access denied: User " + hodId + " is not an HOD");
        }

        if (hod.getDepartment() == null || hod.getDepartment().trim().isEmpty()) {
            throw new RuntimeException("HOD user is not assigned to any department");
        }

        return hod;
    }

    private void verifyDepartmentMatch(User hod, User targetUser) {
        if (targetUser.getDepartment() == null ||
                !targetUser.getDepartment().trim().equalsIgnoreCase(hod.getDepartment().trim())) {
            throw new RuntimeException("Access denied: You can only manage data for your assigned department ("
                    + hod.getDepartment() + "). Target user belongs to '" + targetUser.getDepartment() + "'.");
        }
    }

    // --- PROFESSOR APPROVAL WORKFLOW ---

    @Transactional(readOnly = true)
    public List<UserProfileResponse> getPendingProfessors(Long hodId) {
        User hod = validateHod(hodId);
        return userRepository.findByRoleAndDepartmentIgnoreCaseAndStatusIgnoreCase("PROFESSOR", hod.getDepartment(), "PENDING")
                .stream()
                .map(u -> mapToProfile(u, "Associate Professor"))
                .collect(Collectors.toList());
    }

    public UserProfileResponse approveProfessor(Long hodId, Long professorId) {
        User hod = validateHod(hodId);
        User professor = userRepository.findById(professorId)
                .orElseThrow(() -> new RuntimeException("Professor not found with ID: " + professorId));

        if (!"PROFESSOR".equalsIgnoreCase(professor.getRole())) {
            throw new RuntimeException("User with ID " + professorId + " is not a professor");
        }

        verifyDepartmentMatch(hod, professor);

        professor.setStatus("ACTIVE");
        User saved = userRepository.save(professor);
        return mapToProfile(saved, "Associate Professor");
    }

    public UserProfileResponse rejectProfessor(Long hodId, Long professorId) {
        User hod = validateHod(hodId);
        User professor = userRepository.findById(professorId)
                .orElseThrow(() -> new RuntimeException("Professor not found with ID: " + professorId));

        if (!"PROFESSOR".equalsIgnoreCase(professor.getRole())) {
            throw new RuntimeException("User with ID " + professorId + " is not a professor");
        }

        verifyDepartmentMatch(hod, professor);

        professor.setStatus("REJECTED");
        User saved = userRepository.save(professor);
        return mapToProfile(saved, "Associate Professor");
    }

    @Transactional(readOnly = true)
    public List<UserProfileResponse> getDepartmentProfessors(Long hodId) {
        User hod = validateHod(hodId);
        return userRepository.findByRoleAndDepartmentIgnoreCase("PROFESSOR", hod.getDepartment())
                .stream()
                .map(u -> mapToProfile(u, "Associate Professor"))
                .collect(Collectors.toList());
    }

    public void deleteDepartmentProfessor(Long hodId, Long professorId) {
        User hod = validateHod(hodId);
        User professor = userRepository.findById(professorId)
                .orElseThrow(() -> new RuntimeException("Professor not found with ID: " + professorId));

        if (!"PROFESSOR".equalsIgnoreCase(professor.getRole())) {
            throw new RuntimeException("User with ID " + professorId + " is not a professor");
        }

        verifyDepartmentMatch(hod, professor);

        userRepository.delete(professor);
    }

    // --- STUDENT MANAGEMENT FOR HOD ---

    public UserProfileResponse addStudent(Long hodId, CreateStudentRequest request) {
        User hod = validateHod(hodId);

        if (request == null) {
            throw new RuntimeException("Create student request cannot be null");
        }

        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new RuntimeException("Student email is required");
        }

        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email is already registered in the system");
        }

        if (request.getEnrollmentNumber() == null || request.getEnrollmentNumber().trim().isEmpty()) {
            throw new RuntimeException("Student enrollment number is required");
        }

        String enrollmentNumber = request.getEnrollmentNumber().trim();
        if (userRepository.existsByEnrollmentNumber(enrollmentNumber)) {
            throw new RuntimeException("Enrollment number '" + enrollmentNumber + "' is already registered");
        }

        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new RuntimeException("Student name is required");
        }

        String rawPassword = (request.getPassword() != null && !request.getPassword().trim().isEmpty())
                ? request.getPassword().trim()
                : "password";

        User student = new User();
        student.setName(request.getName().trim());
        student.setEmail(email);
        student.setEnrollmentNumber(enrollmentNumber);
        student.setBatch(request.getBatch() != null ? request.getBatch().trim() : "E1");
        student.setSemester(request.getSemester() != null ? request.getSemester() : 1);
        student.setDepartment(hod.getDepartment().trim());
        student.setRole("STUDENT");
        student.setStatus("ACTIVE");
        student.setPassword(passwordEncoder.encode(rawPassword));

        User saved = userRepository.save(student);
        return mapToProfile(saved, "Student");
    }

    @Transactional(readOnly = true)
    public List<UserProfileResponse> getDepartmentStudents(Long hodId) {
        User hod = validateHod(hodId);
        return userRepository.findByRoleAndDepartmentIgnoreCase("STUDENT", hod.getDepartment())
                .stream()
                .map(u -> mapToProfile(u, "Student"))
                .collect(Collectors.toList());
    }

    public UserProfileResponse updateDepartmentStudent(Long hodId, Long studentId, UpdateStudentRequest request) {
        User hod = validateHod(hodId);
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found with ID: " + studentId));

        if (!"STUDENT".equalsIgnoreCase(student.getRole())) {
            throw new RuntimeException("User with ID " + studentId + " is not a student");
        }

        verifyDepartmentMatch(hod, student);

        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            student.setName(request.getName().trim());
        }

        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            String newEmail = request.getEmail().trim().toLowerCase();
            if (!newEmail.equalsIgnoreCase(student.getEmail()) && userRepository.existsByEmail(newEmail)) {
                throw new RuntimeException("Email is already taken by another user");
            }
            student.setEmail(newEmail);
        }

        if (request.getEnrollmentNumber() != null && !request.getEnrollmentNumber().trim().isEmpty()) {
            String newEnroll = request.getEnrollmentNumber().trim();
            if (!newEnroll.equalsIgnoreCase(student.getEnrollmentNumber()) && userRepository.existsByEnrollmentNumber(newEnroll)) {
                throw new RuntimeException("Enrollment number is already taken by another user");
            }
            student.setEnrollmentNumber(newEnroll);
        }

        if (request.getBatch() != null) {
            student.setBatch(request.getBatch().trim());
        }

        if (request.getSemester() != null) {
            student.setSemester(request.getSemester());
        }

        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            if (request.getPassword().trim().length() < 6) {
                throw new RuntimeException("Password must be at least 6 characters");
            }
            student.setPassword(passwordEncoder.encode(request.getPassword().trim()));
        }

        User saved = userRepository.save(student);
        return mapToProfile(saved, "Student");
    }

    public void deleteDepartmentStudent(Long hodId, Long studentId) {
        User hod = validateHod(hodId);
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found with ID: " + studentId));

        if (!"STUDENT".equalsIgnoreCase(student.getRole())) {
            throw new RuntimeException("User with ID " + studentId + " is not a student");
        }

        verifyDepartmentMatch(hod, student);

        userRepository.delete(student);
    }

    private UserProfileResponse mapToProfile(User user, String defaultDesignation) {
        UserProfileResponse res = new UserProfileResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getDepartment(),
                user.getProfileImage()
        );
        res.setEnrollmentNumber(user.getEnrollmentNumber());
        res.setBatch(user.getBatch());
        res.setSemester(user.getSemester());
        res.setStatus(user.getStatus() != null ? user.getStatus() : "ACTIVE");
        res.setCreatedAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null);
        res.setDesignation(defaultDesignation);
        return res;
    }
}
