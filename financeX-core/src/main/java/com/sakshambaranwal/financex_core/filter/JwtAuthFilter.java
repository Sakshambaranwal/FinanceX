package com.sakshambaranwal.financex_core.filter;

import java.io.IOException;
import java.util.Collections;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.sakshambaranwal.financex_core.config.JwtService;
import com.sakshambaranwal.financex_core.controller.GatewayProxyController;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        String method = request.getMethod();

        // Always allow CORS preflight requests
        if (HttpMethod.OPTIONS.matches(method)) {
            return true;
        }

        // Public whitelist
        return path.equals("/login") || path.startsWith("/login/")
                || path.equals("/register") || path.startsWith("/register/")
                || path.equals("/auth") || path.startsWith("/auth/")
                || path.equals("/ping") || path.startsWith("/ping/")
                || path.equals("/error")
                || path.startsWith("/public/")
                || path.startsWith("/actuator")
                || path.startsWith("/swagger")
                || path.startsWith("/v3/api-docs");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // 1. Try to extract JWT from HttpOnly cookie first
        String jwt = extractJwtFromCookie(request);

        // 2. Fallback: try Authorization: Bearer <token> header (for backward compat / Postman)
        if (jwt == null) {
            final String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                jwt = authHeader.substring(7).trim();
            }
        }

        if (jwt == null) {
            sendUnauthorized(response, "Missing authentication. Please log in.");
            return;
        }

        if (!jwtService.validateToken(jwt)) {
            sendUnauthorized(response, "JWT token is expired or invalid");
            return;
        }

        String username = jwtService.extractUsername(jwt);
        if (username != null) {
            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    username, null, Collections.emptyList());
            SecurityContextHolder.getContext().setAuthentication(authToken);
            request.setAttribute("authenticatedUser", username);
            request.setAttribute("validatedJwt", jwt);
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Reads the JWT from the HttpOnly cookie set by the gateway on login.
     * Checks both parsed request cookies and the raw Cookie header as fallback,
     * stripping any surrounding quotes.
     */
    public static String extractJwtFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (GatewayProxyController.JWT_COOKIE_NAME.equals(cookie.getName())) {
                    String value = cleanCookieValue(cookie.getValue());
                    if (value != null) return value;
                }
            }
        }

        // Fallback: parse raw "Cookie" header in case servlet container parsing missed it
        String cookieHeader = request.getHeader(HttpHeaders.COOKIE);
        if (cookieHeader != null && cookieHeader.contains(GatewayProxyController.JWT_COOKIE_NAME)) {
            for (String pair : cookieHeader.split(";")) {
                String[] parts = pair.trim().split("=", 2);
                if (parts.length == 2 && GatewayProxyController.JWT_COOKIE_NAME.equals(parts[0].trim())) {
                    String value = cleanCookieValue(parts[1]);
                    if (value != null) return value;
                }
            }
        }

        return null;
    }

    public static String cleanCookieValue(String value) {
        if (value == null || value.isBlank()) return null;
        value = value.trim();
        if (value.startsWith("\"") && value.endsWith("\"") && value.length() > 1) {
            value = value.substring(1, value.length() - 1).trim();
        }
        return value.isBlank() ? null : value;
    }

    private void sendUnauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(String.format("{\"timestamp\":%d,\"status\":401,\"error\":\"Unauthorized\",\"message\":\"%s\"}",
                System.currentTimeMillis(), message));
    }
}
