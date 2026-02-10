package org.example.choreplanner.controller;

import org.example.choreplanner.entity.User;
import org.example.choreplanner.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin
public class AuthController {

    private final UserRepository userRepository;

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody User newUser) {
        // Check if username already exists
        User existingUser = userRepository.findByUsername(newUser.getUsername());
        if (existingUser != null) {
            throw new RuntimeException("Username already exists");
        }

        // Set default role if not provided
        if (newUser.getRole() == null || newUser.getRole().isEmpty()) {
            newUser.setRole("MEMBER");
        }

        User savedUser = userRepository.save(newUser);
        
        Map<String, Object> response = new HashMap<>();
        response.put("id", savedUser.getId());
        response.put("username", savedUser.getUsername());
        response.put("role", savedUser.getRole());
        response.put("message", "Registration successful");

        return response;
    }

    @PostMapping("/login")
    public Map<String, String> login(@RequestBody User loginUser) {

        User user = userRepository
                .findByUsernameAndPassword(
                        loginUser.getUsername(),
                        loginUser.getPassword()
                );

        if (user == null) {
            throw new RuntimeException("Invalid login credentials");
        }

        Map<String, String> response = new HashMap<>();
        response.put("role", user.getRole());
        response.put("username", user.getUsername());
        response.put("id", String.valueOf(user.getId()));

        return response;
    }

    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/users/members")
    public List<User> getAllMembers() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole().equals("MEMBER") || u.getRole().equals("WORKER"))
                .toList();
    }
}
