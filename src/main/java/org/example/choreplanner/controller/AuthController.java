package org.example.choreplanner.controller;

import org.example.choreplanner.dto.UserDTO;
import org.example.choreplanner.entity.User;
import org.example.choreplanner.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin
@Validated
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Value("${app.owner.email:mrpranav161@gmail.com}")
    private String ownerEmail;
    
    @Value("${app.owner.password:1131}")
    private String ownerPassword;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    public Map<String, Object> register(@Valid @RequestBody User newUser) {
        String email = newUser.getEmail().trim().toLowerCase();
        
        if (!email.endsWith("@gmail.com")) {
            throw new RuntimeException("Email must be a Gmail address");
        }

        if (ownerEmail.equals(email)) {
            if (!ownerPassword.equals(newUser.getPassword())) {
                throw new RuntimeException("Invalid owner credentials");
            }
            newUser.setRole("OWNER");
        } else if ("OWNER".equalsIgnoreCase(newUser.getRole())) {
            throw new RuntimeException("Owner account is fixed");
        }

        User existingUser = userRepository.findByEmail(email);
        if (existingUser != null) {
            throw new RuntimeException("Email already exists");
        }

        if (newUser.getRole() == null || newUser.getRole().isEmpty()) {
            newUser.setRole("MEMBER");
        }

        newUser.setEmail(email);
        newUser.setPassword(passwordEncoder.encode(newUser.getPassword()));
        User savedUser = userRepository.save(newUser);
        
        Map<String, Object> response = new HashMap<>();
        response.put("id", savedUser.getId());
        response.put("email", savedUser.getEmail());
        response.put("role", savedUser.getRole());
        response.put("message", "Registration successful");

        return response;
    }

    @PostMapping("/login")
    public UserDTO login(@Valid @RequestBody User loginUser) {
        String email = loginUser.getEmail().trim().toLowerCase();
        
        if (!email.endsWith("@gmail.com")) {
            throw new RuntimeException("Email must be a Gmail address");
        }

        if (ownerEmail.equals(email)) {
            if (!ownerPassword.equals(loginUser.getPassword())) {
                throw new RuntimeException("Invalid login credentials");
            }
            User owner = userRepository.findByEmail(email);
            if (owner == null) {
                owner = new User();
                owner.setEmail(email);
                owner.setPassword(passwordEncoder.encode(ownerPassword));
                owner.setRole("OWNER");
                owner = userRepository.save(owner);
            } else if (!"OWNER".equalsIgnoreCase(owner.getRole())) {
                owner.setRole("OWNER");
                owner = userRepository.save(owner);
            }
            return new UserDTO(owner.getId(), owner.getEmail(), owner.getRole());
        }

        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new RuntimeException("User not found. Please register first.");
        }
        
        if (!passwordEncoder.matches(loginUser.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid login credentials");
        }

        return new UserDTO(user.getId(), user.getEmail(), user.getRole());
    }

    @GetMapping("/users")
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
            .map(u -> new UserDTO(u.getId(), u.getEmail(), u.getRole()))
            .toList();
    }

    @GetMapping("/users/members")
    public List<UserDTO> getAllMembers() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole().equals("MEMBER") || u.getRole().equals("WORKER"))
                .map(u -> new UserDTO(u.getId(), u.getEmail(), u.getRole()))
                .toList();
    }
}