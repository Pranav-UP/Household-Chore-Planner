package org.example.choreplanner.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "chores", indexes = {
    @Index(columnList = "workerId"),
    @Index(columnList = "ownerId"),
    @Index(columnList = "status"),
    @Index(columnList = "priority")
})
public class Chore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String description;
    private LocalDate dueDate;
    private String status;    // PENDING, COMPLETED, OVERDUE
    private String priority;  // LOW, MEDIUM, HIGH

    private Long ownerId;
    private Long workerId;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public LocalDate getDueDate() { return dueDate; }
    public String getStatus() { return status; }
    public String getPriority() { return priority; }
    public Long getOwnerId() { return ownerId; }
    public Long getWorkerId() { return workerId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public void setTitle(String t){this.title=t;}
    public void setDescription(String d){this.description=d;}
    public void setDueDate(LocalDate d){this.dueDate=d;}
    public void setStatus(String s){this.status=s;}
    public void setPriority(String p){this.priority=p;}
    public void setOwnerId(Long o){this.ownerId=o;}
    public void setWorkerId(Long w){this.workerId=w;}
    public void setCreatedAt(LocalDateTime createdAt){this.createdAt=createdAt;}
    public void setUpdatedAt(LocalDateTime updatedAt){this.updatedAt=updatedAt;}

    @PrePersist
    public void prePersist() {
        if (status == null || status.isBlank()) status = "PENDING"; else status = status.toUpperCase();
        if (priority == null || priority.isBlank()) priority = "MEDIUM"; else priority = priority.toUpperCase();
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        if (status != null) status = status.toUpperCase();
        if (priority != null) priority = priority.toUpperCase();
        updatedAt = LocalDateTime.now();
    }
}
