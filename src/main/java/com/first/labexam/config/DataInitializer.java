package com.first.labexam.config;

import com.first.labexam.entity.User;
import com.first.labexam.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initData(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {
            // Seed Admin if no admin exists
            if (!userRepository.existsByEmail("admin@ddu.ac.in")) {
                User admin = new User();
                admin.setName("System Admin");
                admin.setEmail("admin@ddu.ac.in");
                admin.setPassword(passwordEncoder.encode("password"));
                admin.setRole("ADMIN");
                admin.setDepartment("Administration");
                admin.setStatus("ACTIVE");
                userRepository.save(admin);
                System.out.println("Default System Admin user created (admin@ddu.ac.in)!");
            }

            // Seed initial demo data if repository is empty
            if (userRepository.count() <= 1) {
                // Default HOD
                if (!userRepository.existsByEmail("hod.ce@ddu.ac.in")) {
                    User hod = new User();
                    hod.setName("Dr. HOD Computer");
                    hod.setEmail("hod.ce@ddu.ac.in");
                    hod.setPassword(passwordEncoder.encode("password"));
                    hod.setRole("HOD");
                    hod.setDepartment("Computer Engineering");
                    hod.setStatus("ACTIVE");
                    userRepository.save(hod);
                }

                // Default Professor
                if (!userRepository.existsByEmail("professor@ddu.ac.in")) {
                    User professor = new User();
                    professor.setName("Prof. Admin");
                    professor.setEmail("professor@ddu.ac.in");
                    professor.setPassword(passwordEncoder.encode("password"));
                    professor.setRole("PROFESSOR");
                    professor.setDepartment("Computer Engineering");
                    professor.setBatch("E1");
                    professor.setStatus("ACTIVE");
                    userRepository.save(professor);
                }

                // Default Student
                if (!userRepository.existsByEmail("student@ddu.ac.in")) {
                    User student = new User();
                    student.setName("Student One");
                    student.setEmail("student@ddu.ac.in");
                    student.setEnrollmentNumber("2026E101");
                    student.setPassword(passwordEncoder.encode("password"));
                    student.setRole("STUDENT");
                    student.setDepartment("Computer Engineering");
                    student.setBatch("E1");
                    student.setSemester(1);
                    student.setStatus("ACTIVE");
                    userRepository.save(student);
                }

                System.out.println("Default initial demo users created successfully!");
            }
        };
    }
}
