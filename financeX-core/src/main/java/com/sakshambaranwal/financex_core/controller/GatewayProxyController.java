package com.sakshambaranwal.financex_core.controller;

import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Enumeration;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequiredArgsConstructor
public class GatewayProxyController {

    private final RestTemplate restTemplate;

    @Value("${services.user.url:http://localhost:8081}")
    private String userServiceUrl;

    @Value("${services.expense.url:http://localhost:8082}")
    private String expenseServiceUrl;

    @Value("${services.p2p.url:http://localhost:8084}")
    private String p2pServiceUrl;

    @Value("${services.creditcard.url:http://localhost:8086}")
    private String creditCardServiceUrl;

    // JWT cookie name used by both this controller and JwtAuthFilter
    public static final String JWT_COOKIE_NAME = "financeX_jwt";

    private static final Set<String> HOP_BY_HOP_HEADERS = Set.of(
            "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
            "te", "trailers", "transfer-encoding", "upgrade", "host", "content-length"
    );

    @RequestMapping({
            "/login",
            "/register",
            "/auth",
            "/auth/**",
            "/ping",
            "/user",
            "/user/**",
            "/admin",
            "/admin/**",
            "/public/**",
            "/expense",
            "/expense/**",
            "/investment",
            "/investment/**",
            "/p2p",
            "/p2p/**",
            "/creditcard",
            "/creditcard/**"
    })
    public ResponseEntity<byte[]> proxyRequest(HttpServletRequest request, HttpServletResponse httpResponse) throws IOException {
        String path = request.getRequestURI();
        String targetBaseUrl = resolveTargetServiceUrl(path);

        if (targetBaseUrl == null) {
            log.warn("No downstream service mapped for path: {}", path);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(String.format("{\"error\":\"Not Found\",\"message\":\"No service found for path: %s\"}", path).getBytes());
        }

        StringBuilder urlBuilder = new StringBuilder(targetBaseUrl).append(path);
        String queryString = request.getQueryString();
        if (queryString != null && !queryString.isBlank()) {
            urlBuilder.append('?').append(queryString);
        }

        URI targetUri = URI.create(urlBuilder.toString());
        HttpMethod method = HttpMethod.valueOf(request.getMethod());

        HttpHeaders headers = copyHeaders(request);

        // Inject authenticated user identity header for downstream services
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            headers.set("X-Authenticated-User", auth.getName());
        }

        // Forward the Authorization Bearer header so downstream microservices (like user-service) authenticate properly
        String validatedJwt = (String) request.getAttribute("validatedJwt");
        if (validatedJwt == null) {
            validatedJwt = com.sakshambaranwal.financex_core.filter.JwtAuthFilter.extractJwtFromCookie(request);
        }
        if (validatedJwt != null) {
            headers.set(HttpHeaders.AUTHORIZATION, "Bearer " + validatedJwt);
        }

        byte[] body = request.getInputStream().readAllBytes();
        HttpEntity<byte[]> httpEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<byte[]> response = restTemplate.exchange(targetUri, method, httpEntity, byte[].class);

            HttpHeaders responseHeaders = new HttpHeaders();
            response.getHeaders().forEach((name, values) -> {
                if (!HOP_BY_HOP_HEADERS.contains(name.toLowerCase())) {
                    responseHeaders.put(name, values);
                }
            });

            // --- HttpOnly Cookie: Set on successful login, register, or google auth ---
            if ((path.equals("/login") || path.equals("/register") || path.startsWith("/auth")) && response.getStatusCode().is2xxSuccessful()) {
                byte[] responseBody = response.getBody();
                if (responseBody != null && responseBody.length > 0) {
                    String jwt = new String(responseBody, StandardCharsets.UTF_8).trim();
                    ResponseCookie jwtCookie = ResponseCookie.from(JWT_COOKIE_NAME, jwt)
                            .httpOnly(true)
                            .secure(false)        // set to true when serving over HTTPS in production
                            .path("/")
                            .maxAge(7 * 24 * 60 * 60) // 7 days
                            .sameSite("Lax")
                            .build();
                    responseHeaders.set(HttpHeaders.SET_COOKIE, jwtCookie.toString());
                    log.info("HttpOnly JWT cookie set for authenticated user on {}", path);
                }
            }

            // --- HttpOnly Cookie: Clear on logout ---
            if (path.startsWith("/user/logout") || path.equals("/user/logout")) {
                ResponseCookie clearCookie = ResponseCookie.from(JWT_COOKIE_NAME, "")
                        .httpOnly(true)
                        .secure(false)
                        .path("/")
                        .maxAge(0)
                        .sameSite("Lax")
                        .build();
                responseHeaders.set(HttpHeaders.SET_COOKIE, clearCookie.toString());
                log.info("JWT cookie cleared on logout.");
            }

            return new ResponseEntity<>(response.getBody(), responseHeaders, response.getStatusCode());
        } catch (ResourceAccessException ex) {
            log.error("Downstream service at {} is unreachable: {}", targetBaseUrl, ex.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(String.format("{\"error\":\"Bad Gateway\",\"message\":\"Service at %s is unavailable: %s\"}", targetBaseUrl, ex.getMessage()).getBytes());
        } catch (HttpClientErrorException | HttpServerErrorException ex) {
            log.warn("Downstream service error: status={}, body={}", ex.getStatusCode(), ex.getResponseBodyAsString());
            return ResponseEntity.status(ex.getStatusCode())
                    .headers(ex.getResponseHeaders())
                    .body(ex.getResponseBodyAsByteArray());
        } catch (Exception ex) {
            log.error("Gateway proxy error: {}", ex.getMessage(), ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(String.format("{\"error\":\"Internal Server Error\",\"message\":\"%s\"}", ex.getMessage()).getBytes());
        }
    }

    private String resolveTargetServiceUrl(String path) {
        if (path.equals("/login") || path.equals("/register") || path.equals("/ping")
                || path.startsWith("/auth/") || path.equals("/auth")
                || path.startsWith("/user/") || path.equals("/user")
                || path.startsWith("/admin/") || path.equals("/admin")
                || path.startsWith("/public/")) {
            return userServiceUrl;
        }
        if (path.startsWith("/expense/") || path.equals("/expense")
                || path.startsWith("/investment/") || path.equals("/investment")) {
            return expenseServiceUrl;
        }
        if (path.startsWith("/p2p/") || path.equals("/p2p")) {
            return p2pServiceUrl;
        }
        if (path.startsWith("/creditcard/") || path.equals("/creditcard")) {
            return creditCardServiceUrl;
        }
        return null;
    }

    private HttpHeaders copyHeaders(HttpServletRequest request) {
        HttpHeaders headers = new HttpHeaders();
        Enumeration<String> headerNames = request.getHeaderNames();
        if (headerNames != null) {
            while (headerNames.hasMoreElements()) {
                String headerName = headerNames.nextElement();
                if (!HOP_BY_HOP_HEADERS.contains(headerName.toLowerCase())) {
                    List<String> values = Collections.list(request.getHeaders(headerName));
                    headers.put(headerName, values);
                }
            }
        }
        return headers;
    }
}
