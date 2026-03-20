# Port Fix Task - blackboxai/port-fix-8080

Current branch: blackboxai/chat-box (will create new branch)

## Steps:
- [ ] 1. Create new branch `blackboxai/port-fix-8080`
- [ ] 2. Edit src/main/resources/application.properties: change server.port to 8080
- [ ] 3. Update QUICK_START.md: add port troubleshooting section with netstat/taskkill commands for Windows
- [ ] 4. git add, commit "Fix port 8081 conflict: use 8080 + Windows troubleshooting docs"
- [ ] 5. git push origin blackboxai/port-fix-8080
- [ ] 6. gh pr create -> main
- [ ] 7. Test mvnw spring-boot:run on port 8080
