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
    private static final String OWNER_EMAIL = "mrpranav161@gmail.com";
    private static final String OWNER_PASSWORD = "1131";

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody User newUser) {
        String email = newUser.getEmail() == null ? "" : newUser.getEmail().trim().toLowerCase();
        if (!email.endsWith("@gmail.com")) {
            throw new RuntimeException("Email must be a Gmail address");
        }

        if (OWNER_EMAIL.equals(email)) {
            if (!OWNER_PASSWORD.equals(newUser.getPassword())) {
                throw new RuntimeException("Invalid owner credentials");
            }
            newUser.setRole("OWNER");
        } else if ("OWNER".equalsIgnoreCase(newUser.getRole())) {
            throw new RuntimeException("Owner account is fixed");
        }

        // Check if email already exists
        User existingUser = userRepository.findByEmail(email);
        if (existingUser != null) {
            throw new RuntimeException("Email already exists");
        }

        // Set default role if not provided
        if (newUser.getRole() == null || newUser.getRole().isEmpty()) {
            newUser.setRole("MEMBER");
        }

        newUser.setEmail(email);
        User savedUser = userRepository.save(newUser);
        
        Map<String, Object> response = new HashMap<>();
        response.put("id", savedUser.getId());
        response.put("email", savedUser.getEmail());
        response.put("role", savedUser.getRole());
        response.put("message", "Registration successful");

        return response;
    }

    @PostMapping("/login")
    public Map<String, String> login(@RequestBody User loginUser) {

        String email = loginUser.getEmail() == null ? "" : loginUser.getEmail().trim().toLowerCase();
        if (!email.endsWith("@gmail.com")) {
            throw new RuntimeException("Email must be a Gmail address");
        }

        if (OWNER_EMAIL.equals(email)) {
            if (!OWNER_PASSWORD.equals(loginUser.getPassword())) {
                throw new RuntimeException("Invalid login credentials");
            }
            User owner = userRepository.findByEmail(email);
            if (owner == null) {
                owner = new User();
                owner.setEmail(email);
                owner.setPassword(OWNER_PASSWORD);
                owner.setRole("OWNER");
                owner = userRepository.save(owner);
            } else if (!"OWNER".equalsIgnoreCase(owner.getRole())) {
                owner.setRole("OWNER");
                owner = userRepository.save(owner);
            }

            Map<String, String> response = new HashMap<>();
            response.put("role", owner.getRole());
            response.put("email", owner.getEmail());
            response.put("id", String.valueOf(owner.getId()));
            return response;
        }

        User user = userRepository.findByEmail(email);

        if (user == null) {
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setPassword(loginUser.getPassword());
            newUser.setRole("MEMBER");
            user = userRepository.save(newUser);
        } else if (!user.getPassword().equals(loginUser.getPassword())) {
            throw new RuntimeException("Invalid login credentials");
        }

        Map<String, String> response = new HashMap<>();
        response.put("role", user.getRole());
        response.put("email", user.getEmail());
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
