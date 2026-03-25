package org.example.choreplanner.config;

import org.example.choreplanner.entity.User;
import org.example.choreplanner.entity.Chore;
import org.example.choreplanner.repository.UserRepository;
import org.example.choreplanner.repository.ChoreRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.beans.factory.annotation.Value;

@Configuration
public class DefaultUsersInitializer {

    @Value("${app.owner.email}")
    private String ownerEmail;

    @Value("${app.owner.password}")
    private String ownerPassword;

    @Bean
    CommandLineRunner ensureDefaultWorkers(UserRepository userRepository,
                                           ChoreRepository choreRepository,
                                           PasswordEncoder passwordEncoder) {
        return args -> {
            User owner = createOwnerIfMissing(userRepository, passwordEncoder, ownerEmail, ownerPassword);
            User w1 = createIfMissing(userRepository, passwordEncoder,
                    "worker1@gmail.com", "worker1", "WORKER");
            User w2 = createIfMissing(userRepository, passwordEncoder,
                    "worker2@gmail.com", "worker2", "WORKER");

            seedCompletedChores(choreRepository, owner, w1, w2);
        };
    }

    private User createOwnerIfMissing(UserRepository userRepository,
                                      PasswordEncoder passwordEncoder,
                                      String email,
                                      String rawPassword) {
        User existing = userRepository.findByEmail(email.toLowerCase());
        if (existing != null) {
            if (!"OWNER".equalsIgnoreCase(existing.getRole())) {
                existing.setRole("OWNER");
                existing = userRepository.save(existing);
            }
            return existing;
        }
        User owner = new User();
        owner.setEmail(email.toLowerCase());
        owner.setName("Owner");
        owner.setPassword(passwordEncoder.encode(rawPassword));
        owner.setRole("OWNER");
        return userRepository.save(owner);
    }

    private User createIfMissing(UserRepository userRepository,
                                 PasswordEncoder passwordEncoder,
                                 String email,
                                 String rawPassword,
                                 String role) {
        if (userRepository.findByEmail(email) != null) {
            return userRepository.findByEmail(email);
        }
        User u = new User();
        u.setEmail(email.toLowerCase());
        u.setName(email.split("@")[0]);
        u.setPassword(passwordEncoder.encode(rawPassword));
        u.setRole(role);
        return userRepository.save(u);
    }

    private void seedCompletedChores(ChoreRepository choreRepository, User owner, User w1, User w2) {
        if (owner == null || w1 == null || w2 == null) return;
        if (choreRepository.count() > 0) return; // don't duplicate
        Chore c1 = new Chore();
        c1.setTitle("Seeded task for worker1");
        c1.setDescription("Auto-created completed chore");
        c1.setDueDate(java.time.LocalDate.of(2026, 3, 23));
        c1.setStatus("COMPLETED");
        c1.setPriority("MEDIUM");
        c1.setOwnerId(owner.getId());
        c1.setWorkerId(w1.getId());

        Chore c2 = new Chore();
        c2.setTitle("Seeded task for worker2");
        c2.setDescription("Auto-created completed chore");
        c2.setDueDate(java.time.LocalDate.of(2026, 3, 24));
        c2.setStatus("COMPLETED");
        c2.setPriority("MEDIUM");
        c2.setOwnerId(owner.getId());
        c2.setWorkerId(w2.getId());

        choreRepository.save(c1);
        choreRepository.save(c2);
    }
}
