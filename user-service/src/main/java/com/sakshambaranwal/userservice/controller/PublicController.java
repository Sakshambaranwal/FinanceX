package com.sakshambaranwal.userservice.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import com.sakshambaranwal.userservice.entity.User;
import com.sakshambaranwal.userservice.service.UserService;

@RestController
public class PublicController {

    @Autowired
    UserService userService;
    
    @PostMapping("/register")
    public ResponseEntity<Object> register(@RequestBody User user) {
        try {
            String jwt = userService.addUser(user);
            return new ResponseEntity<>(jwt, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>("Internal server error"+(e.toString()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @GetMapping("/login")
    public ResponseEntity<Object> login(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = userService.login(authHeader);
            return new ResponseEntity<>(token, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Internal server error"+(e.toString()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return new ResponseEntity<>("pong", HttpStatus.OK);
    }
}
