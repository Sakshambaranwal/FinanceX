package com.sakshambaranwal.financex_core.controller;

import java.io.IOException;
import java.net.URI;
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
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import jakarta.servlet.http.HttpServletRequest;
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

    private static final Set<String> HOP_BY_HOP_HEADERS = Set.of(
            "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
            "te", "trailers", "transfer-encoding", "upgrade", "host", "content-length"
    );

    @RequestMapping({
            "/login",
            "/register",
            "/ping",
            "/user/**",
            "/admin/**",
            "/public/**",
            "/expense/**",
            "/investment/**",
            "/p2p/**",
            "/creditcard/**"
    })
    public ResponseEntity<byte[]> proxyRequest(HttpServletRequest request) throws IOException {
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

            return new ResponseEntity<>(response.getBody(), responseHeaders, response.getStatusCode());
        } catch (ResourceAccessException ex) {
            log.error("Downstream service at {} is unreachable: {}", targetBaseUrl, ex.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(String.format("{\"error\":\"Bad Gateway\",\"message\":\"Service unavailable at %s\"}", targetBaseUrl).getBytes());
        } catch (Exception ex) {
            log.error("Error proxying request to {}: {}", targetUri, ex.getMessage(), ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(String.format("{\"error\":\"Gateway Error\",\"message\":\"%s\"}", ex.getMessage()).getBytes());
        }
    }

    private String resolveTargetServiceUrl(String path) {
        if (path.equals("/login") || path.equals("/register") || path.equals("/ping")
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
