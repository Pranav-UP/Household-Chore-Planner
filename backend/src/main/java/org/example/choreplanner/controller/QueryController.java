package org.example.choreplanner.controller;

import org.example.choreplanner.entity.QueryMessage;
import org.example.choreplanner.repository.QueryRepository;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin
public class QueryController {

    private final QueryRepository repo;

    public QueryController(QueryRepository repo) {
        this.repo = repo;
    }

    // Get messages for a chore
    @GetMapping("/{choreId}")
    public List<QueryMessage> getMessages(@PathVariable Long choreId) {
        return repo.findByChoreIdAndDeletedFalseOrderByTimestampAsc(choreId);
    }

    // Send new message (REST)
    @PostMapping("/{choreId}")
    public QueryMessage sendMessage(@PathVariable Long choreId,
                                   @RequestBody Map<String, Object> payload) {
        String message = (String) payload.get("message");
        Long senderId = ((Number) payload.get("senderId")).longValue();
        String senderRole = (String) payload.get("senderRole");

        QueryMessage qm = new QueryMessage(choreId, senderId, senderRole, message);
        return repo.save(qm);
    }

    // WebSocket: Send message
    @MessageMapping("/chat.send/{choreId}")
    @SendTo("/topic/chat/{choreId}")
    public QueryMessage sendWebSocketMessage(QueryMessage message) {
        message.setTimestamp(java.time.LocalDateTime.now());
        return repo.save(message);
    }
}
