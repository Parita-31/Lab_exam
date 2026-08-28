package com.first.labexam.dto;


public class LoginResponse {

    private String token;
    private String role;
    private String name;
    private Long userId;

    public LoginResponse(
            String token,
            String role,
            String name,
            Long userId
    ) {
        this.token = token;
        this.role = role;
        this.name = name;
        this.userId = userId;
    }

    public String getToken() {
        return token;
    }

    public String getRole() {
        return role;
    }

    public String getName() {
        return name;
    }

    public Long getUserId() {
        return userId;
    }

}