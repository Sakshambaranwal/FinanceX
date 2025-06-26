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
        String oldPassword = user.getPassword();
        user.setPassword(passwordEncoder.encode(user.getPassword())); 
        try{
            User userCreated = userRepository.save(user);
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(userCreated.getUsername(), oldPassword)
            );
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            String jwt = jwtService.generateToken(userDetails.getUsername());
            return jwt;
        }
        catch (Exception e) {
            System.out.println("User already exists or other error: " + e.getMessage());
            throw new RuntimeException("User already exists");
        }
    }

    @Transactional(readOnly = true)
    public User getUser() {
        User user;
        try{
            UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            user = userDetails.getUser();
        }catch (Exception e) {
            return null;
        }
        return user;
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

    public User updateUser(User newuser) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userDetails.getUser();
        if (user != null) {
            user.setUsername(newuser.getUsername()); 
            user.setEmail(newuser.getEmail());
            user.setPhone(newuser.getPhone());
            user.setPassword(passwordEncoder.encode(newuser.getPassword()));
            userRepository.save(user);
            return user;
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
