package org.example.choreplanner.repository;

import org.example.choreplanner.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByChoreIdOrderByCreatedAtAsc(Long choreId);
}
