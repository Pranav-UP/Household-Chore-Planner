# Chore Chat Implementation Plan

## Status: In Progress ✅

### 1. Backend Foundation (Pending)
- [x] Create QueryMessage entity (with choreId, senderId/role, message, timestamp, deleted flag)
- [x] Create QueryRepository (findByChoreIdAndDeletedFalse, softDeleteByChoreId)
- [x] Create QueryController (REST: get/post chat/{choreId}, WebSocket handler)
- [ ] Update Chore.java (@OneToMany messages)
- [x] Update ChoreController.complete() → softDelete messages

### 2. WebSocket
- [x] Create ChatController (STOMP @MessageMapping /chat.send, subscribe /topic/chat/{choreId})

### 3. Frontend (Pending)
- [ ] owner-dashboard.html/js: Per-chore 💬 button → modal with header "Task: {title} | Worker: {email}", messages, input, SockJS/STOMP
- [ ] worker-dashboard.html/js: Same, header "Task: {title} | Owner: {email}"
- [ ] Real-time subscribe /topic/chat/{choreId}, send to /app/chat.send/{choreId}

### 4. Testing & Polish
- [ ] mvn compile && mvn spring-boot:run
- [ ] Test: Create chore → chat → complete → messages deleted
- [ ] Multi-task worker: separate chats visible

**Next Step: Backend entities/repos**

