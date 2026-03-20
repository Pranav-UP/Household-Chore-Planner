package org.example.choreplanner.controller;

import org.example.choreplanner.entity.QueryMessage;
import org.example.choreplanner.repository.QueryRepository;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class ChatController {

    private final QueryRepository queryRepo;

    public ChatController(QueryRepository queryRepo) {
        this.queryRepo = queryRepo;
    }

    @MessageMapping("/chat/{choreId}")
    @SendTo("/topic/chat/{choreId}")
    public QueryMessage sendMessage(@DestinationVariable Long choreId, QueryMessage message) {
        message.setChoreId(choreId);
        message.setTimestamp(java.time.LocalDateTime.now());
        return queryRepo.save(message);
    }
}
