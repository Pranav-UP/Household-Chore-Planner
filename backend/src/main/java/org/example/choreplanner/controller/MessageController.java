package org.example.choreplanner.controller;

import org.example.choreplanner.entity.Message;
import org.example.choreplanner.repository.MessageRepository;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin
public class MessageController {

    private final MessageRepository messageRepository;

    public MessageController(MessageRepository messageRepository) {
        this.messageRepository = messageRepository;
    }

    @GetMapping("/chore/{choreId}")
    public List<Message> getMessages(@PathVariable Long choreId) {
        return messageRepository.findByChoreIdOrderByCreatedAtAsc(choreId);
    }

    @PostMapping
    public Message sendMessage(@RequestBody Map<String, Object> payload) {
        Message m = new Message();
        m.setChoreId(((Number)payload.get("choreId")).longValue());
        m.setSenderId(((Number)payload.get("senderId")).longValue());
        m.setReceiverId(payload.get("receiverId") == null ? null : ((Number)payload.get("receiverId")).longValue());
        m.setMessage((String) payload.get("message"));
        m.setCreatedAt(LocalDateTime.now());
        Message saved = messageRepository.save(m);
        return saved;
    }

    @MessageMapping("/chat/{choreId}")
    @SendTo("/topic/chat/{choreId}")
    public Message handleSocketMessage(@DestinationVariable Long choreId, Message incoming) {
        incoming.setChoreId(choreId);
        incoming.setCreatedAt(LocalDateTime.now());
        return messageRepository.save(incoming);
    }
}
