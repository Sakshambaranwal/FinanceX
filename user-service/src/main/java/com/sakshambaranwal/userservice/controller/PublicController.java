package com.sakshambaranwal.userservice.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.sakshambaranwal.userservice.entity.User;
import com.sakshambaranwal.userservice.service.UserService;

@RestController
public class PublicController {

    @Autowired
    UserService userService;
    
    @PostMapping("/register")
    public ResponseEntity<Object> addUser(@RequestBody User user) {
        try {
            User createdUser = userService.addUser(user);
            return new ResponseEntity<>(createdUser, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>("Internal server error"+(e.toString()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
