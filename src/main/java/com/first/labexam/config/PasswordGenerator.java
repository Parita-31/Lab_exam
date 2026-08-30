package com.first.labexam.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class PasswordGenerator implements CommandLineRunner {

    private final PasswordEncoder passwordEncoder;

    public PasswordGenerator(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    @Override

    public void run(String... args) {

        String hash = passwordEncoder.encode("trushi");

        System.out.println("student hash: " + hash);

        System.out.println(
                "MATCH TEST = " +
                        passwordEncoder.matches("trushi", hash));
    }
}