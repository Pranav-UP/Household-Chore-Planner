package org.example.choreplanner.controller;

import org.example.choreplanner.entity.QueryMessage;
import org.example.choreplanner.repository.QueryRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/queries")
public class QueryController {

    private final QueryRepository repo;

    public QueryController(QueryRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<QueryMessage> getAll() {
        return repo.findAll();
    }

    @GetMapping("/worker/{workerId}")
    public List<QueryMessage> getByWorker(@PathVariable Long workerId) {
        return repo.findByWorkerId(workerId);
    }

    @PostMapping
    public QueryMessage send(@RequestBody QueryMessage q) {
        return repo.save(q);
    }

    @PutMapping("/{id}/reply")
    public QueryMessage reply(@PathVariable Long id, @RequestBody QueryMessage payload) {
        QueryMessage q = repo.findById(id).orElseThrow();
        q.setOwnerReply(payload.getOwnerReply());
        q.setOwnerId(payload.getOwnerId());
        q.setRepliedAt(LocalDateTime.now());
        return repo.save(q);
    }
}
