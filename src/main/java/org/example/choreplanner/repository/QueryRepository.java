package org.example.choreplanner.repository;

import org.example.choreplanner.entity.QueryMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QueryRepository extends JpaRepository<QueryMessage, Long> {
    List<QueryMessage> findByWorkerId(Long workerId);
}
