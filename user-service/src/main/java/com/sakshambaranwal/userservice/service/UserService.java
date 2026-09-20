package com.sakshambaranwal.userservice.service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import com.sakshambaranwal.userservice.config.JwtService;
import com.sakshambaranwal.userservice.config.UserDetailsImpl;
import com.sakshambaranwal.userservice.entity.Role;
import com.sakshambaranwal.userservice.entity.User;
import com.sakshambaranwal.userservice.repository.UserRepository;


import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class UserService {

    @Value("${app.default.currency:${DEFAULT_CURRENCY:INR}}")
    private String defaultCurrency;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    JwtService jwtService;


    private static final java.util.regex.Pattern EMAIL_PATTERN =
            java.util.regex.Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    private static final java.util.regex.Pattern USERNAME_PATTERN =
            java.util.regex.Pattern.compile("^[a-zA-Z0-9_]{3,30}$");

    private static final java.util.regex.Pattern PHONE_PATTERN =
            java.util.regex.Pattern.compile("^\\+?[0-9]{7,15}$");

    public static String normalizePhoneNumber(String rawPhone) {
        if (rawPhone == null) return null;
        String trimmed = rawPhone.trim();
        if (trimmed.isEmpty()) return null;
        // Strip spaces, dashes, parentheses, dots
        String cleaned = trimmed.replaceAll("[\\s\\-\\(\\)\\.]", "");
        // If starts with 00, normalize to +
        if (cleaned.startsWith("00")) {
            cleaned = "+" + cleaned.substring(2);
        }
        // If starts with single 0 and has 11 digits (standard local trunk e.g. 09876543210): strip leading 0
        if (cleaned.startsWith("0") && cleaned.length() == 11 && cleaned.matches("^0[1-9][0-9]{9}$")) {
            cleaned = cleaned.substring(1);
        }
        return cleaned;
    }

    public static String extractPhoneDigits(String phone) {
        if (phone == null) return "";
        return phone.replaceAll("[^0-9]", "");
    }

    public void validateUsername(String username, Long currentUserId) {
        if (username == null || username.trim().isEmpty()) {
            throw new IllegalArgumentException("Username cannot be empty.");
        }
        String cleanUsername = username.trim();
        if (!USERNAME_PATTERN.matcher(cleanUsername).matches()) {
            throw new IllegalArgumentException("Username must be between 3 and 30 characters and contain only letters, numbers, and underscores.");
        }
        Optional<User> existing = userRepository.findByUsernameIgnoreCase(cleanUsername);
        if (existing.isPresent() && (currentUserId == null || !existing.get().getId().equals(currentUserId))) {
            throw new IllegalArgumentException("Username '" + cleanUsername + "' is already taken. Please choose a different username.");
        }
    }

    public void validateEmail(String email, Long currentUserId) {
        if (email == null || email.trim().isEmpty()) return;
        String cleanEmail = email.trim().toLowerCase();
        if (!EMAIL_PATTERN.matcher(cleanEmail).matches()) {
            throw new IllegalArgumentException("Invalid email format. Please enter a valid email address.");
        }
        Optional<User> existing = userRepository.findByEmailIgnoreCase(cleanEmail);
        if (existing.isPresent() && (currentUserId == null || !existing.get().getId().equals(currentUserId))) {
            throw new IllegalArgumentException("Email '" + cleanEmail + "' is already registered by another account.");
        }
    }

    public void validatePhoneNumberAvailable(String phone, Long currentUserId) {
        if (phone == null || phone.isBlank()) return;
        String normalized = normalizePhoneNumber(phone);
        if (!PHONE_PATTERN.matcher(normalized).matches()) {
            throw new IllegalArgumentException("Invalid phone number format. Must contain 7 to 15 digits (e.g. +919876543210 or 9876543210).");
        }

        String digits = extractPhoneDigits(normalized);
        if (digits.length() < 7) {
            throw new IllegalArgumentException("Phone number must contain at least 7 digits.");
        }

        for (User u : userRepository.findAll()) {
            if (currentUserId != null && u.getId().equals(currentUserId)) {
                continue;
            }
            if (u.getPhone() != null && !u.getPhone().isBlank()) {
                String existingNorm = normalizePhoneNumber(u.getPhone());
                if (normalized.equalsIgnoreCase(existingNorm)) {
                    throw new IllegalArgumentException("Phone number is already registered by another account.");
                }
                String existingDigits = extractPhoneDigits(u.getPhone());
                if (digits.equals(existingDigits) ||
                    (digits.length() >= 10 && existingDigits.endsWith(digits)) ||
                    (existingDigits.length() >= 10 && digits.endsWith(existingDigits))) {
                    throw new IllegalArgumentException("Phone number is already registered by another account.");
                }
            }
        }
    }

    public String addUser(User user) {
        validateUsername(user.getUsername(), null);

        if (user.getPassword() == null || user.getPassword().trim().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters long.");
        }

        if (user.getEmail() != null && !user.getEmail().trim().isEmpty()) {
            validateEmail(user.getEmail(), null);
            user.setEmail(user.getEmail().trim().toLowerCase());
        } else {
            user.setEmail(null);
        }

        if (user.getPhone() != null && !user.getPhone().trim().isEmpty()) {
            validatePhoneNumberAvailable(user.getPhone(), null);
            user.setPhone(normalizePhoneNumber(user.getPhone()));
        } else {
            user.setPhone(null);
        }

        user.setUsername(user.getUsername().trim());
        if (user.getRole() == null) {
            user.setRole(Role.USER);
        }
        if (user.getPremium() == null) {
            user.setPremium(false);
        }

        if (user.getCurrency() == null || user.getCurrency().trim().isEmpty()) {
            user.setCurrency(defaultCurrency != null ? defaultCurrency.trim().toUpperCase() : "INR");
        } else {
            user.setCurrency(user.getCurrency().trim().toUpperCase());
        }

        String rawPassword = user.getPassword();
        user.setPassword(passwordEncoder.encode(rawPassword)); 
        try {
            User userCreated = userRepository.save(user);
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(userCreated.getUsername(), rawPassword)
            );
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            String jwt = jwtService.generateToken(userDetails.getUsername());
            return jwt;
        }
        catch (Exception e) {
            log.error("Error saving user: {}", e.getMessage(), e);
            throw new RuntimeException("Registration failed: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public User getUser() {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            return userRepository.findByUsername(userDetails.getUsername()).orElse(userDetails.getUser());
        } catch (Exception e) {
            return null;
        }
    }

    public boolean deleteUser(String password) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userDetails.getUser();
        if (user != null && passwordEncoder.matches(password, user.getPassword())) {
            userRepository.delete(user);
            userRepository.flush();
            return true;
        }
        return false;
    }

    @Transactional
    public User updateUser(User newuser) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found."));

        if (newuser.getFirstname() != null) {
            String fn = newuser.getFirstname().trim();
            if (fn.length() > 50) throw new IllegalArgumentException("First name cannot exceed 50 characters.");
            user.setFirstname(fn);
        }
        if (newuser.getLastname() != null) {
            String ln = newuser.getLastname().trim();
            if (ln.length() > 50) throw new IllegalArgumentException("Last name cannot exceed 50 characters.");
            user.setLastname(ln);
        }

        // Email validation & Google OAuth protection
        if (newuser.getEmail() != null) {
            String cleanEmail = newuser.getEmail().trim().toLowerCase();
            if (!cleanEmail.isEmpty() && (user.getEmail() == null || !cleanEmail.equalsIgnoreCase(user.getEmail()))) {
                if (user.getAuthProvider() != null && user.getAuthProvider().toUpperCase().contains("GOOGLE")) {
                    throw new IllegalArgumentException("Email address cannot be modified for Google-authenticated accounts.");
                }
                validateEmail(cleanEmail, user.getId());
                user.setEmail(cleanEmail);
                user.setEmailVerified(false); // Email changed, reset verification
            } else if (cleanEmail.isEmpty() && user.getEmail() != null) {
                if (user.getAuthProvider() != null && user.getAuthProvider().toUpperCase().contains("GOOGLE")) {
                    throw new IllegalArgumentException("Email address cannot be removed for Google-authenticated accounts.");
                }
                user.setEmail(null);
                user.setEmailVerified(false);
            }
        }

        // Phone normalization & validation
        if (newuser.getPhone() != null) {
            String cleanPhone = normalizePhoneNumber(newuser.getPhone());
            if (cleanPhone != null && !cleanPhone.isEmpty()) {
                if (user.getPhone() == null || !cleanPhone.equalsIgnoreCase(normalizePhoneNumber(user.getPhone()))) {
                    validatePhoneNumberAvailable(cleanPhone, user.getId());
                    user.setPhone(cleanPhone);
                    user.setPhoneVerified(false); // Phone changed, reset verification
                }
            } else if (cleanPhone == null && user.getPhone() != null) {
                user.setPhone(null);
                user.setPhoneVerified(false);
            }
        }

        if (newuser.getPassword() != null && !newuser.getPassword().trim().isEmpty()) {
            if (newuser.getPassword().trim().length() < 6) {
                throw new IllegalArgumentException("Password must be at least 6 characters long.");
            }
            user.setPassword(passwordEncoder.encode(newuser.getPassword().trim()));
        }

        // Only update currency when explicitly provided (prevent accidental overwriting)
        if (newuser.getCurrency() != null && !newuser.getCurrency().trim().isEmpty()) {
            user.setCurrency(newuser.getCurrency().trim().toUpperCase());
        }

        // Validate UPI ID format if provided
        if (newuser.getUpiId() != null) {
            String upi = newuser.getUpiId().trim();
            if (!upi.isEmpty()) {
                if (!upi.matches("^[\\w.\\-_]{2,256}@[a-zA-Z]{2,64}$")) {
                    throw new IllegalArgumentException("Invalid UPI ID format. Expected format: username@bank (e.g. yourname@okhdfcbank).");
                }
                user.setUpiId(upi);
            } else {
                user.setUpiId(null);
            }
        }

        if (newuser.getAddresses() != null) {
            if (user.getAddresses() == null) {
                user.setAddresses(new java.util.ArrayList<>());
            } else {
                user.getAddresses().clear();
            }
            for (com.sakshambaranwal.userservice.entity.Address addr : newuser.getAddresses()) {
                com.sakshambaranwal.userservice.entity.Address a = new com.sakshambaranwal.userservice.entity.Address();
                a.setLine1(addr.getLine1());
                a.setLine2(addr.getLine2());
                a.setCity(addr.getCity());
                a.setState(addr.getState());
                a.setPincode(addr.getPincode());
                a.setCountry(addr.getCountry());
                user.getAddresses().add(a);
            }
        }
        user.setUpdatedAt(java.time.LocalDateTime.now());
        return userRepository.save(user);
    }

    @Transactional
    public User verifyEmail(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            throw new IllegalArgumentException("No email address configured on account to verify.");
        }
        user.setEmailVerified(true);
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    @Transactional
    public User verifyPhone(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));
        if (user.getPhone() == null || user.getPhone().isBlank()) {
            throw new IllegalArgumentException("No phone number configured on account to verify.");
        }
        user.setPhoneVerified(true);
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    public User getUserByPhoneNumber(String phoneNumber) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userDetails.getUser();
        return user;
    }

    public User getUserByUsername(String username) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userDetails.getUser();
        return user;
    }

    public Iterable<User> getAllUsers() {
        Iterable<User> allUsers = userRepository.findAll();
        return allUsers;
    }

    public User getUserByEmail(String email) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userDetails.getUser();
        return user;
    }

    public User getUserById(String userId) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userDetails.getUser();
        return user;
    }

    public String login(String authHeader) {
        String base64Credentials = authHeader.substring("Basic ".length());
        byte[] credDecoded = Base64.getDecoder().decode(base64Credentials);
        String credentials = new String(credDecoded, StandardCharsets.UTF_8);
        String[] values = credentials.split(":", 2);
        String username = values[0];
        String password = values[1];
        try {
            // Authenticate user
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password)
            );
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            String jwt = jwtService.generateToken(userDetails.getUsername());
            return jwt;

        } catch (AuthenticationException ex) {
            throw ex;
        }
    }

    @Transactional(readOnly = true)
    public Optional<User> lookupUser(String query) {
        if (query == null || query.trim().isEmpty()) {
            return Optional.empty();
        }
        String cleanQuery = query.trim();

        // 1. Search by exact email
        Optional<User> byEmail = userRepository.findByEmail(cleanQuery);
        if (byEmail.isPresent()) return byEmail;

        // 2. Search by exact phone
        Optional<User> byPhone = userRepository.findByPhone(cleanQuery);
        if (byPhone.isPresent()) return byPhone;

        // 3. Search by normalized phone digits (e.g. +91 9876543210 vs 9876543210)
        String digitsOnly = cleanQuery.replaceAll("[^0-9]", "");
        if (digitsOnly.length() >= 7) {
            for (User u : userRepository.findAll()) {
                if (u.getPhone() != null) {
                    String uDigits = u.getPhone().replaceAll("[^0-9]", "");
                    if (uDigits.equals(digitsOnly) || 
                       (digitsOnly.length() >= 10 && uDigits.endsWith(digitsOnly)) || 
                       (uDigits.length() >= 10 && digitsOnly.endsWith(uDigits))) {
                        return Optional.of(u);
                    }
                }
            }
        }

        // 4. Search by username
        return userRepository.findByUsername(cleanQuery);
    }

    @Value("${google.client.id}")
    private String googleClientId;

    @Autowired
    private RestTemplate restTemplate;

    public String loginWithGoogle(String idToken) {
        if (idToken == null || idToken.isBlank()) {
            throw new IllegalArgumentException("Google ID token is required");
        }

        try {
            // Verify token using Google official tokeninfo endpoint
            String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken.trim();
            org.springframework.http.ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new IllegalArgumentException("Invalid Google token");
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> body = response.getBody();
            String email = (String) body.get("email");
            if (email == null || email.isBlank()) {
                throw new IllegalArgumentException("Email not found in Google account");
            }

            String aud = (String) body.get("aud");
            if (googleClientId != null && !googleClientId.isBlank() && !googleClientId.equals(aud)) {
                log.warn("Google token audience mismatch: expected {} but got {}", googleClientId, aud);
            }

            String name = (String) body.get("name");
            String givenName = (String) body.get("given_name");
            String familyName = (String) body.get("family_name");

            // Check if user already exists with this email
            Optional<User> existingUserOpt = userRepository.findByEmail(email.trim().toLowerCase());
            User user;
            if (existingUserOpt.isPresent()) {
                user = existingUserOpt.get();
                if (user.getAuthProvider() == null || "LOCAL".equalsIgnoreCase(user.getAuthProvider())) {
                    user.setAuthProvider("GOOGLE");
                    user.setEmailVerified(true);
                    user.setUpdatedAt(LocalDateTime.now());
                    user = userRepository.save(user);
                }
            } else {
                // Register new user via Google
                user = new User();
                String baseUsername = email.split("@")[0].replaceAll("[^a-zA-Z0-9_]", "_");
                if (baseUsername.length() < 3) baseUsername = "user_" + baseUsername;
                String candidateUsername = baseUsername;
                int counter = 1;
                while (userRepository.findByUsername(candidateUsername).isPresent()) {
                    candidateUsername = baseUsername + "_" + counter++;
                }

                user.setUsername(candidateUsername);
                user.setEmail(email.trim().toLowerCase());
                user.setEmailVerified(true);
                user.setFirstname(givenName != null ? givenName : (name != null ? name : candidateUsername));
                user.setLastname(familyName);
                user.setPassword(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));
                user.setRole(Role.USER);
                user.setPremium(false);
                user.setCurrency(defaultCurrency != null ? defaultCurrency.trim().toUpperCase() : "INR");
                user.setAuthProvider("GOOGLE");
                user.setCreatedAt(LocalDateTime.now());
                user.setUpdatedAt(LocalDateTime.now());
                user = userRepository.save(user);
            }

            return jwtService.generateToken(user.getUsername());
        } catch (org.springframework.web.client.HttpClientErrorException ex) {
            throw new IllegalArgumentException("Google token verification failed: " + ex.getStatusText());
        } catch (Exception ex) {
            throw new RuntimeException("Error during Google authentication: " + ex.getMessage(), ex);
        }
    }
}
