package org.example.choreplanner.controller;

import org.example.choreplanner.entity.Chore;
import org.example.choreplanner.repository.ChoreRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chores")
@CrossOrigin
public class ChoreController {

    private final ChoreRepository repo;

    public ChoreController(ChoreRepository repo) {
        this.repo = repo;
    }

    // OWNER: assign chore
    @PostMapping
    public Chore addChore(@RequestBody Chore chore) {
        if (chore.getStatus() == null || chore.getStatus().isEmpty()) {
            chore.setStatus("PENDING");
        }
        return repo.save(chore);
    }

    // OWNER: view all chores they created
    @GetMapping("/owner/{ownerId}")
    public List<Chore> getOwnerChores(@PathVariable Long ownerId) {
        return repo.findByOwnerId(ownerId);
    }

    // Get all chores (for dashboard)
    @GetMapping
    public List<Chore> getAllChores() {
        return repo.findAll();
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
        if (updated.getStatus() != null) c.setStatus(updated.getStatus());
        if (updated.getOwnerId() != null) c.setOwnerId(updated.getOwnerId());
        if (updated.getWorkerId() != null) c.setWorkerId(updated.getWorkerId());
        return repo.save(c);
    }

    // WORKER: mark completed
    @PutMapping("/{id}/complete")
    public Chore complete(@PathVariable Long id) {
        Chore c = repo.findById(id).orElseThrow(() -> new RuntimeException("Chore not found"));
        c.setStatus("COMPLETED");
        return repo.save(c);
    }

    // OWNER: delete chore
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repo.deleteById(id);
    }
}
