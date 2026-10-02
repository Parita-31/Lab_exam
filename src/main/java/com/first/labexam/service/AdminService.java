package com.first.labexam.service;

import com.first.labexam.dto.CreateHodRequest;
import com.first.labexam.dto.UpdateHodRequest;
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
public class AdminService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UserProfileResponse createHod(CreateHodRequest request) {
        if (request == null) {
            throw new RuntimeException("Create HOD request cannot be null");
        }

        if (request.getDepartment() == null || request.getDepartment().trim().isEmpty()) {
            throw new RuntimeException("Department is required");
        }

        String department = request.getDepartment().trim();

        // Enforce maximum 1 HOD per department
        boolean hodExists = userRepository.existsByRoleAndDepartmentIgnoreCaseAndStatusIgnoreCase("HOD", department, "ACTIVE");
        if (hodExists) {
            throw new RuntimeException("Department '" + department + "' already has an assigned Head of Department (HOD).");
        }

        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new RuntimeException("Email is required");
        }

        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email is already registered in the system");
        }

        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new RuntimeException("Name is required");
        }

        if (request.getPassword() == null || request.getPassword().length() < 6) {
            throw new RuntimeException("Password must be at least 6 characters");
        }

        User hod = new User();
        hod.setName(request.getName().trim());
        hod.setEmail(email);
        hod.setPassword(passwordEncoder.encode(request.getPassword()));
        hod.setRole("HOD");
        hod.setDepartment(department);
        hod.setStatus("ACTIVE");

        User saved = userRepository.save(hod);

        return mapToProfile(saved, "Head of Department");
    }

    @Transactional(readOnly = true)
    public List<UserProfileResponse> getAllHods() {
        return userRepository.findByRoleIgnoreCase("HOD")
                .stream()
                .map(u -> mapToProfile(u, "Head of Department"))
                .collect(Collectors.toList());
    }

    public UserProfileResponse updateHod(Long hodId, UpdateHodRequest request) {
        User hod = userRepository.findById(hodId)
                .orElseThrow(() -> new RuntimeException("HOD not found with ID: " + hodId));

        if (!"HOD".equalsIgnoreCase(hod.getRole())) {
            throw new RuntimeException("User with ID " + hodId + " is not an HOD");
        }

        if (request.getDepartment() != null && !request.getDepartment().trim().isEmpty()) {
            String newDepartment = request.getDepartment().trim();
            if (!newDepartment.equalsIgnoreCase(hod.getDepartment())) {
                boolean hodExistsInNewDept = userRepository.existsByRoleAndDepartmentIgnoreCaseAndStatusIgnoreCaseAndIdNot(
                        "HOD", newDepartment, "ACTIVE", hodId
                );
                if (hodExistsInNewDept) {
                    throw new RuntimeException("Department '" + newDepartment + "' already has an assigned Head of Department (HOD).");
                }
                hod.setDepartment(newDepartment);
            }
        }

        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            hod.setName(request.getName().trim());
        }

        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            String newEmail = request.getEmail().trim().toLowerCase();
            if (!newEmail.equalsIgnoreCase(hod.getEmail()) && userRepository.existsByEmail(newEmail)) {
                throw new RuntimeException("Email is already taken");
            }
            hod.setEmail(newEmail);
        }

        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            if (request.getPassword().trim().length() < 6) {
                throw new RuntimeException("Password must be at least 6 characters");
            }
            hod.setPassword(passwordEncoder.encode(request.getPassword().trim()));
        }

        User saved = userRepository.save(hod);
        return mapToProfile(saved, "Head of Department");
    }

    public void deleteHod(Long hodId) {
        User hod = userRepository.findById(hodId)
                .orElseThrow(() -> new RuntimeException("HOD not found with ID: " + hodId));

        if (!"HOD".equalsIgnoreCase(hod.getRole())) {
            throw new RuntimeException("User with ID " + hodId + " is not an HOD");
        }

        userRepository.delete(hod);
    }

    @Transactional(readOnly = true)
    public List<UserProfileResponse> getAllProfessors() {
        return userRepository.findByRoleIgnoreCase("PROFESSOR")
                .stream()
                .map(u -> mapToProfile(u, "Associate Professor"))
                .collect(Collectors.toList());
    }

    public void deleteProfessor(Long professorId) {
        User prof = userRepository.findById(professorId)
                .orElseThrow(() -> new RuntimeException("Professor not found with ID: " + professorId));

        if (!"PROFESSOR".equalsIgnoreCase(prof.getRole())) {
            throw new RuntimeException("User with ID " + professorId + " is not a professor");
        }

        userRepository.delete(prof);
    }

    @Transactional(readOnly = true)
    public List<UserProfileResponse> getAllStudents() {
        return userRepository.findByRoleIgnoreCase("STUDENT")
                .stream()
                .map(u -> mapToProfile(u, "Student"))
                .collect(Collectors.toList());
    }

    public void deleteStudent(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found with ID: " + studentId));

        if (!"STUDENT".equalsIgnoreCase(student.getRole())) {
            throw new RuntimeException("User with ID " + studentId + " is not a student");
        }

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
