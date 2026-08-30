package com.first.labexam.security;

import com.first.labexam.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class AuthContext {

    private AuthContext() {
    }

    public static CustomUserPrincipal requireAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserPrincipal principal)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        if (principal.getUserId() == null && (principal.getEmail() == null || principal.getEmail().isBlank())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return principal;
    }

    public static CustomUserPrincipal requireRole(String expectedRole) {
        CustomUserPrincipal principal = requireAuthenticatedUser();
        if (principal.getRole() == null || !principal.getRole().equalsIgnoreCase(expectedRole)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Access denied: " + expectedRole + " role required");
        }
        return principal;
    }
}
