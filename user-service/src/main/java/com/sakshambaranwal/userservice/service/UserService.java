package com.sakshambaranwal.userservice.service;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.sakshambaranwal.userservice.config.JwtService;
import com.sakshambaranwal.userservice.config.UserDetailsImpl;
import com.sakshambaranwal.userservice.entity.Role;
import com.sakshambaranwal.userservice.entity.User;
import com.sakshambaranwal.userservice.repository.UserRepository;


@Component
public class UserService {

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    JwtService jwtService;


    public String addUser(User user) {
        if (user.getUsername() == null || user.getUsername().trim().isEmpty()) {
            throw new IllegalArgumentException("Username cannot be empty");
        }
        if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
            throw new IllegalArgumentException("Password cannot be empty");
        }
        if (userRepository.findByUsername(user.getUsername().trim()).isPresent()) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (user.getEmail() != null && !user.getEmail().trim().isEmpty() && userRepository.findByEmail(user.getEmail().trim()).isPresent()) {
            throw new IllegalArgumentException("Email already exists");
        }

        user.setUsername(user.getUsername().trim());
        if (user.getEmail() != null) {
            user.setEmail(user.getEmail().trim());
        }
        if (user.getRole() == null) {
            user.setRole(Role.USER);
        }
        if (user.getPremium() == null) {
            user.setPremium(false);
        }

        if (user.getCurrency() == null || user.getCurrency().trim().isEmpty()) {
            user.setCurrency("USD");
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
            System.out.println("Error saving user: " + e.getMessage());
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
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            User user = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
            if (user != null) {
                if (newuser.getFirstname() != null) user.setFirstname(newuser.getFirstname().trim());
                if (newuser.getLastname() != null) user.setLastname(newuser.getLastname().trim());
                if (newuser.getEmail() != null && !newuser.getEmail().trim().isEmpty()) {
                    user.setEmail(newuser.getEmail().trim());
                }
                if (newuser.getPhone() != null) user.setPhone(newuser.getPhone().trim());
                if (newuser.getPassword() != null && !newuser.getPassword().trim().isEmpty()) {
                    user.setPassword(passwordEncoder.encode(newuser.getPassword().trim()));
                }
                if (newuser.getCurrency() != null && !newuser.getCurrency().trim().isEmpty()) {
                    user.setCurrency(newuser.getCurrency().trim().toUpperCase());
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
        } catch (Exception e) {
            System.err.println("Error updating user: " + e.getMessage());
        }
        return null;
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

    
}
