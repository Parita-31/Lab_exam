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
            if (userRepository.count() == 0) {
                // Default Professor
                User professor = new User();
                professor.setName("Prof. Admin");
                professor.setEmail("professor@ddu.ac.in");
                professor.setPassword(passwordEncoder.encode("password"));
                professor.setRole("PROFESSOR");
                professor.setDepartment("Computer Engineering");
                professor.setBatch("E1");
                professor.setStatus("ACTIVE");
                userRepository.save(professor);

                // Default Student
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

                System.out.println("Default initial users created successfully!");
            }
        };
    }
}
