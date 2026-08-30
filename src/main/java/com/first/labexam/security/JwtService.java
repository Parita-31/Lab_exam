package com.first.labexam.security;



import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    private static final String SECRET =
            "LabExamSystemSecretKeyForJWTAuthentication2026VerySecure";

    private static final long EXPIRATION =
            1000 * 60 * 60 * 10; // 10 hours

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(
                SECRET.getBytes(StandardCharsets.UTF_8)
        );
    }

    public String generateToken(Long userId, String email, String role) {
        return Jwts.builder()
                .subject(email)
                .claim("userId", userId)
                .claim("role", role)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + EXPIRATION))
                .signWith(getKey())
                .compact();
    }

    public String generateToken(String email, String role) {
        return generateToken(null, email, role);
    }

    public String extractEmail(String token) {
        return getClaims(token)
                .getSubject();
    }

    public Long extractUserId(String token) {
        Object userIdClaim = getClaims(token).get("userId");
        if (userIdClaim instanceof Number) {
            return ((Number) userIdClaim).longValue();
        }
        return null;
    }

    public String extractRole(String token) {
        return getClaims(token)
                .get("role", String.class);
    }

    public boolean isValid(String token) {

        try {

            getClaims(token);

            return true;

        } catch (Exception e) {

            return false;
        }
    }

    private Claims getClaims(String token) {

        return Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}