package org.example.choreplanner.repository;

import org.example.choreplanner.entity.Chore;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChoreRepository extends JpaRepository<Chore, Long> {
    List<Chore> findByWorkerId(Long workerId);
    List<Chore> findByOwnerId(Long ownerId);
    List<Chore> findByStatus(String status);
}
