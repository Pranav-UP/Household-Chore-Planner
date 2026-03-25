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

    private static final Map<String, String> DEFAULT_WORKERS = Map.of(
            "worker1@gmail.com", "worker1",
            "worker2@gmail.com", "worker2"
    );

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    public Map<String, Object> register(@Valid @RequestBody User newUser) {
        String email = newUser.getEmail().trim().toLowerCase();

        User existingUser = userRepository.findByEmail(email);
        if (existingUser != null) {
            throw new RuntimeException("Email already exists");
        }

        // Owner account is fixed; no self-registration allowed
        if (email.equalsIgnoreCase(ownerEmail)) {
            throw new RuntimeException("Owner account is fixed and cannot be registered");
        }

        if (newUser.getRole() != null && "OWNER".equalsIgnoreCase(newUser.getRole())) {
            throw new RuntimeException("Cannot register as OWNER. Use the fixed owner account.");
        }

        newUser.setRole("WORKER");

        newUser.setEmail(email);
        newUser.setPassword(passwordEncoder.encode(newUser.getPassword()));
        User savedUser = userRepository.save(newUser);
        
        Map<String, Object> response = new HashMap<>();
        response.put("id", savedUser.getId());
        response.put("name", savedUser.getName());
        response.put("email", savedUser.getEmail());
        response.put("role", savedUser.getRole());
        response.put("message", "Registration successful");

        return response;
    }

    @PostMapping("/login")
    public UserDTO login(@RequestBody User loginUser) {
        String email = loginUser.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(email);

        // Handle fixed owner login
        if (email.equalsIgnoreCase(ownerEmail)) {
            // ensure owner exists in DB
            if (user == null) {
                user = new User();
                user.setEmail(email);
                user.setName("Owner");
                user.setPassword(passwordEncoder.encode(ownerPassword));
                user.setRole("OWNER");
                user = userRepository.save(user);
            } else if (!"OWNER".equalsIgnoreCase(user.getRole())) {
                user.setRole("OWNER");
                user = userRepository.save(user);
            }

            boolean rawMatchesConfig = ownerPassword.equals(loginUser.getPassword());
            boolean matchesEncoded = passwordEncoder.matches(loginUser.getPassword(), user.getPassword());
            if (!rawMatchesConfig && !matchesEncoded) {
                throw new RuntimeException("Invalid owner credentials");
            }
            return new UserDTO(user.getId(), user.getName(), user.getEmail(), user.getRole());
        }

        // Auto-create default workers on first login if missing
        if (user == null && DEFAULT_WORKERS.containsKey(email)) {
            String rawPw = DEFAULT_WORKERS.get(email);
            user = new User();
            user.setEmail(email);
            user.setName(email.split("@")[0]);
            user.setPassword(passwordEncoder.encode(rawPw));
            user.setRole("WORKER");
            user = userRepository.save(user);
        }

        if (user == null) {
            throw new RuntimeException("User not found. Please register first.");
        }

        if (!passwordEncoder.matches(loginUser.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid login credentials");
        }

        return new UserDTO(user.getId(), user.getName(), user.getEmail(), user.getRole());
    }

    @GetMapping("/users")
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
            .map(u -> new UserDTO(u.getId(), u.getName(), u.getEmail(), u.getRole()))
            .toList();
    }

    @GetMapping("/users/members")
    public List<UserDTO> getAllMembers() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole().equalsIgnoreCase("WORKER"))
                .map(u -> new UserDTO(u.getId(), u.getName(), u.getEmail(), u.getRole()))
                .toList();
    }
}
