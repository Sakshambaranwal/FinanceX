package com.sakshambaranwal.userservice.controller;


import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.sakshambaranwal.userservice.entity.User;
import com.sakshambaranwal.userservice.service.UserService;

@CrossOrigin(origins = "*") 
@RestController
public class UserController {
    
    @Autowired
    UserService userService;

    //USER OPERATIONS
    @GetMapping("/user")
    public ResponseEntity<Object> getUser() {
        try {
            User user = userService.getUser();
            if (user != null) {
                return new ResponseEntity<>(user, HttpStatus.OK);
            } else {
                return new ResponseEntity<>("User not found", HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            return new ResponseEntity<>("Internal server error"+e.toString(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    @PostMapping("/user")
    public ResponseEntity<Object> updateUser(User user) {
        try {
            User updatedUser = userService.updateUser(user);
            if (updatedUser != null) {
                return new ResponseEntity<>(updatedUser, HttpStatus.OK);
            } else {
                return new ResponseEntity<>("User not found", HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            return new ResponseEntity<>("Internal server error", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    @DeleteMapping("/user")
    public ResponseEntity<Object> deleteUser(@RequestBody Map<String, String> payload) {
        try {
            // xyz789: Extract password from request body
            String password = payload.get("password");
            if (password == null) {
                return new ResponseEntity<>("Password is required", HttpStatus.BAD_REQUEST);
            }
            
            boolean isDeleted = userService.deleteUser(password);
            if (isDeleted) {
                return new ResponseEntity<>("User deleted successfully", HttpStatus.OK);
            } else {
                return new ResponseEntity<>("Invalid password", HttpStatus.UNAUTHORIZED);
            }
        } catch (Exception e) {
            return new ResponseEntity<>("Internal server error: " + e.getMessage(), 
                HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }



    //ADMIN OPERATIONS
    @GetMapping("/admin/users")
    public ResponseEntity<Object> getAllUsers() {
        try {
            Iterable<User> users = userService.getAllUsers();
            return new ResponseEntity<>(users, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Internal server error", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    @GetMapping("/admin/user/id/{userId}")
    public ResponseEntity<Object> getUserById(String userId) {
        try {
            User user = userService.getUserById(userId);
            if (user != null) {
                return new ResponseEntity<>(user, HttpStatus.OK);
            } else {
                return new ResponseEntity<>("User not found", HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            return new ResponseEntity<>("Internal server error", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    @GetMapping("/admin/user/email/{email}")
    public ResponseEntity<Object> getUserByEmail(String email) {
        try {
            User user = userService.getUserByEmail(email);
            if (user != null) {
                return new ResponseEntity<>(user, HttpStatus.OK);
            } else {
                return new ResponseEntity<>("User not found", HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            return new ResponseEntity<>("Internal server error", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    @GetMapping("/admin/user/username/{username}")
    public ResponseEntity<Object> getUserByUsername(String username) {
        try {
            User user = userService.getUserByUsername(username);
            if (user != null) {
                return new ResponseEntity<>(user, HttpStatus.OK);
            } else {
                return new ResponseEntity<>("User not found", HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            return new ResponseEntity<>("Internal server error", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    @GetMapping("/admin/user/phone/{phoneNumber}")
    public ResponseEntity<Object> getUserByPhoneNumber(String phoneNumber) {
        try {
            User user = userService.getUserByPhoneNumber(phoneNumber);
            if (user != null) {
                return new ResponseEntity<>(user, HttpStatus.OK);
            } else {
                return new ResponseEntity<>("User not found", HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            return new ResponseEntity<>("Internal server error", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}