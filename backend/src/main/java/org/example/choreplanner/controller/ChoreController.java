package org.example.choreplanner.controller;

import org.example.choreplanner.entity.Chore;
import org.example.choreplanner.repository.ChoreRepository;
import org.example.choreplanner.repository.QueryRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chores")
@CrossOrigin(origins = "*")
public class ChoreController {

    private final ChoreRepository repo;
    private final QueryRepository queryRepo;
    private final SimpMessagingTemplate messagingTemplate;
    
    public ChoreController(ChoreRepository repo, QueryRepository queryRepo, SimpMessagingTemplate messagingTemplate) {
        this.repo = repo;
        this.queryRepo = queryRepo;
        this.messagingTemplate = messagingTemplate;
    }

    // OWNER: assign chore
    @PostMapping
    public Chore addChore(@RequestBody Chore chore) {
        if (chore.getStatus() == null || chore.getStatus().isEmpty()) {
            chore.setStatus("PENDING");
        } else {
            chore.setStatus(chore.getStatus().toUpperCase());
        }
        if (chore.getPriority() == null || chore.getPriority().isEmpty()) {
            chore.setPriority("MEDIUM");
        } else {
            chore.setPriority(chore.getPriority().toUpperCase());
        }
        Chore saved = repo.save(chore);

        // push notification to worker if assigned
        if (saved.getWorkerId() != null) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "ASSIGNED");
            payload.put("message", "New chore assigned: " + saved.getTitle());
            payload.put("choreId", saved.getId());
            payload.put("dueDate", saved.getDueDate());
            payload.put("priority", saved.getPriority());
            messagingTemplate.convertAndSend("/topic/worker/" + saved.getWorkerId(), (Object) payload);
        }
        return saved;
    }

    // OWNER: view all chores they created
    @GetMapping("/owner/{ownerId}")
    public List<Chore> getOwnerChores(@PathVariable Long ownerId) {
        return repo.findByOwnerId(ownerId);
    }

    // Get all chores (for dashboard)
    @GetMapping
    public List<Chore> getAllChores(@RequestParam(required = false) String status,
                                    @RequestParam(required = false) String search) {
        List<Chore> chores = repo.findAll();
        if (status != null && !status.isBlank()) {
            chores = chores.stream()
                    .filter(c -> status.equalsIgnoreCase(c.getStatus()))
                    .toList();
        }
        if (search != null && !search.isBlank()) {
            String s = search.toLowerCase();
            chores = chores.stream()
                    .filter(c -> (c.getTitle() != null && c.getTitle().toLowerCase().contains(s)) ||
                                 (c.getDescription() != null && c.getDescription().toLowerCase().contains(s)))
                    .toList();
        }
        return chores;
    }

    // OWNER/WORKER: view single chore
    @GetMapping("/{id}")
    public Chore getById(@PathVariable Long id) {
        return repo.findById(id).orElseThrow(() -> new RuntimeException("Chore not found"));
    }

    // WORKER: view own chores
    @GetMapping("/worker/{workerId}")
    public List<Chore> getWorkerChores(@PathVariable Long workerId) {
        return repo.findByWorkerId(workerId);
    }

    // Get chores by status
    @GetMapping("/status/{status}")
    public List<Chore> getChoresByStatus(@PathVariable String status) {
        return repo.findByStatus(status);
    }

    // OWNER/WORKER: update chore (e.g., status, details)
    @PutMapping("/{id}")
    public Chore update(@PathVariable Long id, @RequestBody Chore updated) {
        Chore c = repo.findById(id).orElseThrow(() -> new RuntimeException("Chore not found"));
        if (updated.getTitle() != null) c.setTitle(updated.getTitle());
        if (updated.getDescription() != null) c.setDescription(updated.getDescription());
        if (updated.getDueDate() != null) c.setDueDate(updated.getDueDate());
        if (updated.getStatus() != null) c.setStatus(updated.getStatus().toUpperCase());
        if (updated.getPriority() != null) c.setPriority(updated.getPriority().toUpperCase());
        if (updated.getOwnerId() != null) c.setOwnerId(updated.getOwnerId());
        if (updated.getWorkerId() != null) c.setWorkerId(updated.getWorkerId());
        Chore saved = repo.save(c);
        if (saved.getWorkerId() != null) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "UPDATED");
            payload.put("message", "Chore updated: " + saved.getTitle());
            payload.put("status", saved.getStatus());
            payload.put("priority", saved.getPriority());
            payload.put("dueDate", saved.getDueDate());
            messagingTemplate.convertAndSend("/topic/worker/" + saved.getWorkerId(), (Object) payload);
        }
        return saved;
    }

    // WORKER: mark completed - deletes associated chat
    @PutMapping("/{id}/complete")
    @Transactional
    public Chore complete(@PathVariable Long id) {
        Chore c = repo.findById(id).orElseThrow(() -> new RuntimeException("Chore not found"));
        c.setStatus("COMPLETED");
        
        // Auto-delete chat messages
        queryRepo.softDeleteByChoreId(id);
        
        return repo.save(c);
    }

    // OWNER: delete chore
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repo.deleteById(id);
    }

    // Stats for owner dashboard
    @GetMapping("/owner/{ownerId}/stats")
    public Map<String, Object> getOwnerStats(@PathVariable Long ownerId) {
        List<Chore> chores = repo.findByOwnerId(ownerId);
        long total = chores.size();
        long pending = chores.stream().filter(c -> "PENDING".equalsIgnoreCase(c.getStatus())).count();
        long completed = chores.stream().filter(c -> "COMPLETED".equalsIgnoreCase(c.getStatus())).count();
        long overdue = chores.stream()
                .filter(c -> c.getDueDate() != null && c.getDueDate().isBefore(LocalDate.now()) && !"COMPLETED".equalsIgnoreCase(c.getStatus()))
                .count();

        Map<String, Long> byPriority = chores.stream()
                .collect(Collectors.groupingBy(c -> c.getPriority() == null ? "MEDIUM" : c.getPriority().toUpperCase(), Collectors.counting()));

        Map<String, Object> result = new HashMap<>();
        result.put("total", total);
        result.put("pending", pending);
        result.put("completed", completed);
        result.put("overdue", overdue);
        result.put("byPriority", byPriority);
        return result;
    }
}
