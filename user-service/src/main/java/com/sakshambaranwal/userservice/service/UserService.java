package com.sakshambaranwal.userservice.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.sakshambaranwal.userservice.config.UserDetailsImpl;
import com.sakshambaranwal.userservice.entity.User;
import com.sakshambaranwal.userservice.repository.UserRepository;


@Component
public class UserService {

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder passwordEncoder;


    public User addUser(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword())); // Assuming password is already hashed
        User userCreated = userRepository.save(user);
        return userCreated;
    }

    @Transactional(readOnly = true)
    public User getUser() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userDetails.getUser();
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

    
}
