package org.example.choreplanner.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "queries", indexes = {
        @Index(columnList = "choreId"),
        @Index(columnList = "senderId")
})
public class QueryMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long choreId;
    private Long senderId;
    private String senderRole; // OWNER | WORKER

    @Column(columnDefinition = "TEXT")
    private String message;

    private LocalDateTime timestamp;
    private boolean deleted = false;

    public QueryMessage() {
        this.timestamp = LocalDateTime.now();
    }

    public QueryMessage(Long choreId, Long senderId, String senderRole, String message) {
        this.choreId = choreId;
        this.senderId = senderId;
        this.senderRole = senderRole;
        this.message = message;
        this.timestamp = LocalDateTime.now();
        this.deleted = false;
    }

    public Long getId() { return id; }
    public Long getChoreId() { return choreId; }
    public Long getSenderId() { return senderId; }
    public String getSenderRole() { return senderRole; }
    public String getMessage() { return message; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public boolean isDeleted() { return deleted; }

    public void setId(Long id) { this.id = id; }
    public void setChoreId(Long choreId) { this.choreId = choreId; }
    public void setSenderId(Long senderId) { this.senderId = senderId; }
    public void setSenderRole(String senderRole) { this.senderRole = senderRole; }
    public void setMessage(String message) { this.message = message; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    public void setDeleted(boolean deleted) { this.deleted = deleted; }
}
