# Remove Query Chat from Worker Dashboard - IN PROGRESS

## Previous Task Status
**Real-time WebSocket STOMP Upgrade - CANCELLED (feature removal)**

## Current Task: Remove query chat from worker dashboard and delete query-related files
**Approved Plan**: Yes to all - frontend removal, backend deletion, legacy cleanup.

### Steps:
- [x] **Prep 1**: Analyzed files (worker-dashboard.html/js, QueryController.java/repo/entity, WebSocketConfig.java, legacy worker.html/js)
- [x] **Prep 2**: Confirmed WebSocketConfig generic (/topic, /ws) - no query-specific breakage
- [x] **Step 1**: Edit worker-dashboard.html - remove Query Chat section, queriesPanel, SockJS/STOMP CDNs
- [x] **Step 2**: Edit worker-dashboard.js - remove stubbed query functions
- [x] **Step 3**: Delete backend files - QueryController.java, QueryRepository.java, QueryMessage.java
- [x] **Step 4**: Clean legacy - remove query sections from worker.html and worker.js
- [x] **Step 5**: Update TODO.md as completed, test app

**TASK COMPLETED ✅** Worker dashboard query chat fully removed, backend deleted, legacy cleaned. App ready to run.

## Test Commands
```
mvn clean compile
mvn spring-boot:run
# Login as worker -> worker-dashboard.html: verify chores only, no query UI, no errors
# Check backend compiles/runs without Query classes
```

**Next Action**: Implementing Step 1.
