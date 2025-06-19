package com.sakshambaranwal.userservice.config;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Component;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;


@Component
public class JwtService {

    private static final String SECRET_KEY  = "z734562tr[p;.[p;.erfmisfgkrmeswiognm67g7gt76f"; 

    public String generateToken(String username) {
        Map <String, Object> claims = new HashMap<>();
        return createToekn(claims, username);
    }
    private String createToekn(Map<String, Object> claims, String username) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(username)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 10)) // 10 hours
                .signWith(getSigningKey())
                .compact();
    }
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
    }
    public String extractUsername(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }
    public boolean validateToken(String jwt, String username) {
        String extractedUsername = extractUsername(jwt);
        return (extractedUsername.equals(username) && !isTokenExpired(jwt));
    }
    private boolean isTokenExpired(String jwt) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(jwt)
                .getBody()
                .getExpiration()
                .before(new Date());
    }

}
