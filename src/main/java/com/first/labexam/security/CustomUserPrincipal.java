package com.first.labexam.security;

import java.io.Serializable;

public class CustomUserPrincipal implements Serializable {

    private final Long userId;
    private final String email;
    private final String role;

    public CustomUserPrincipal(Long userId, String email, String role) {
        this.userId = userId;
        this.email = email;
        this.role = role;
    }

    public Long getUserId() {
        return userId;
    }

    public String getEmail() {
        return email;
    }

    public String getRole() {
        return role;
    }

    @Override
    public String toString() {
        return email;
    }
}
