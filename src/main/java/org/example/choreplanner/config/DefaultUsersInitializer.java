package org.example.choreplanner.config;

import org.example.choreplanner.entity.User;
import org.example.choreplanner.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DefaultUsersInitializer {

    @Bean
    CommandLineRunner ensureDefaultWorkers(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            createIfMissing(userRepository, passwordEncoder,
                    "worker1@gmail.com", "worker1", "WORKER");
            createIfMissing(userRepository, passwordEncoder,
                    "worker2@gmail.com", "worker2", "WORKER");
        };
    }

    private void createIfMissing(UserRepository userRepository,
                                 PasswordEncoder passwordEncoder,
                                 String email,
                                 String rawPassword,
                                 String role) {
        if (userRepository.findByEmail(email) != null) {
            return;
        }
        User u = new User();
        u.setEmail(email.toLowerCase());
        u.setPassword(passwordEncoder.encode(rawPassword));
        u.setRole(role);
        userRepository.save(u);
    }
}
