package org.example.choreplanner.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "chores")
public class Chore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String description;
    private LocalDate dueDate;
    private String status;

    private Long ownerId;
    private Long workerId;

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public LocalDate getDueDate() { return dueDate; }
    public String getStatus() { return status; }
    public Long getOwnerId() { return ownerId; }
    public Long getWorkerId() { return workerId; }

    public void setTitle(String t){this.title=t;}
    public void setDescription(String d){this.description=d;}
    public void setDueDate(LocalDate d){this.dueDate=d;}
    public void setStatus(String s){this.status=s;}
    public void setOwnerId(Long o){this.ownerId=o;}
    public void setWorkerId(Long w){this.workerId=w;}
}
