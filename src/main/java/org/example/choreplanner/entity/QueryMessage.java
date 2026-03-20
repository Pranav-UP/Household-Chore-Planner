package org.example.choreplanner.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "query_messages")
public class QueryMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long choreId;

    @Column(nullable = false)
    private Long senderId;

    @Column(nullable = false, length = 10)
    private String senderRole; // "OWNER" or "WORKER"

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    private boolean deleted = false;

    // Constructors
    public QueryMessage() {}

    public QueryMessage(Long choreId, Long senderId, String senderRole, String message) {
        this.choreId = choreId;
        this.senderId = senderId;
        this.senderRole = senderRole;
        this.message = message;
    }

    // Getters/Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getChoreId() { return choreId; }
    public void setChoreId(Long choreId) { this.choreId = choreId; }

    public Long getSenderId() { return senderId; }
    public void setSenderId(Long senderId) { this.senderId = senderId; }

    public String getSenderRole() { return senderRole; }
    public void setSenderRole(String senderRole) { this.senderRole = senderRole; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public boolean isDeleted() { return deleted; }
    public void setDeleted(boolean deleted) { this.deleted = deleted; }
}
