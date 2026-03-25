const API_URL = (() => {
  const override = window.API_BASE_URL || window.apiBaseUrl;
  if (override && override.trim()) return override.replace(/\/$/, "");
  const origin = window.location.origin;
  if (!origin || origin === "null") return "http://localhost:8080";
  return origin.replace(/\/$/, "");
})();

let currentUserId = null;
let currentEmail = null;
let allChores = [];
let currentFilter = "ALL";
let stompClient = null;
let chatStomp = null;
let activeChatChore = null;
let activeOwnerId = null;
let unreadCounts = {};

document.addEventListener("DOMContentLoaded", () => {
  const role = (localStorage.getItem("role") || "").toUpperCase();
  currentUserId = localStorage.getItem("userId");
  currentEmail = localStorage.getItem("email");
  if (!currentUserId || role !== "WORKER") {
    window.location.href = "/login.html";
    return;
  }
  document.getElementById("userEmail").textContent = currentEmail;
  loadChores();
  connectNotifications();
});

function connectNotifications() {
  const socket = new SockJS(`${API_URL}/ws`);
  stompClient = Stomp.over(socket);
  stompClient.connect({}, () => {
    stompClient.subscribe(`/topic/worker/${currentUserId}`, (msg) => {
      document.getElementById("notifDot").classList.remove("d-none");
      const data = JSON.parse(msg.body);
      const message = data.message || "New chore update";
      showAlert(message, "info");
      loadChores();
    });
  });
}

function loadChores() {
  fetch(`${API_URL}/api/chores/worker/${currentUserId}`)
    .then(res => res.json())
    .then(data => {
      allChores = data || [];
      updateStats();
      renderChores();
      setupGlobalChatSubscriptions();
    })
    .catch(() => showAlert("Could not load chores", "danger"));
}

function updateStats() {
  const total = allChores.length;
  const pending = allChores.filter(c => c.status === "PENDING").length;
  const completed = allChores.filter(c => c.status === "COMPLETED").length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
  document.getElementById("totalAssigned").textContent = total;
  document.getElementById("pendingCount").textContent = pending;
  document.getElementById("completedCount").textContent = completed;
  document.getElementById("progressBar").style.width = `${progress}%`;
  document.getElementById("progressLabel").textContent = `${progress}% complete`;
}

function setFilter(event) {
  document.querySelectorAll('[data-filter]').forEach(btn => btn.classList.remove("active"));
  event.target.classList.add("active");
  currentFilter = event.target.dataset.filter;
  renderChores();
}

function renderChores() {
  const list = document.getElementById("choresList");
  const filtered = currentFilter === "ALL" ? allChores : allChores.filter(c => c.status === currentFilter);
  if (!filtered.length) {
    list.innerHTML = `<div class="col-12 text-center text-muted py-4">No chores here</div>`;
    return;
  }
  list.innerHTML = filtered.map(chore => {
    const overdue = isOverdue(chore);
    const dueToday = isDueToday(chore);
    const status = chore.status === "COMPLETED" ? "COMPLETED" : (overdue ? "OVERDUE" : "PENDING");
    const statusText = status === "OVERDUE" ? "Overdue" : status === "PENDING" ? "Pending" : "Completed";
    return `<div class="col-md-6">
      <div class="card p-3 h-100 ${overdue ? "border-danger" : ""}">
        <div class="d-flex justify-content-between">
          <h5 class="mb-1">${chore.title}</h5>
          <span class="badge-priority priority-${chore.priority || "MEDIUM"}">${chore.priority || "MEDIUM"}</span>
        </div>
        ${chore.description ? `<p class="mb-1 text-muted">${chore.description}</p>` : ""}
        <div class="d-flex justify-content-between align-items-center mt-2">
          <div class="d-flex flex-column">
            <small class="text-muted">Due: ${chore.dueDate || "-"}</small>
            ${dueToday ? `<small class="text-warning">Due today</small>` : ""}
          </div>
          <span class="status-pill status-${status}">${statusText}</span>
        </div>
        <div class="mt-3 d-flex gap-2">
          ${chore.status === "COMPLETED" ? `<button class="btn btn-sm btn-success" disabled>Completed</button>` :
            `<button class="btn btn-sm btn-primary" onclick="completeChore(${chore.id})">Mark Complete</button>`}
          <button class="btn btn-sm btn-outline-secondary position-relative" onclick="openChat(${chore.id}, ${chore.ownerId || 'null'})">
            <i class="fa fa-comments"></i> Chat
            ${unreadCounts[chore.id] > 0 ? '<span class="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle"></span>' : ''}
          </button>
        </div>
      </div>
    </div>`;
  }).join("");
}

function completeChore(id) {
  fetch(`${API_URL}/api/chores/${id}/complete`, { method: "PUT" })
    .then(res => {
      if (!res.ok) throw new Error("Unable to complete chore");
      return res.json();
    })
    .then(() => {
      showAlert("Nice! Chore completed.", "success");
      loadChores();
    })
    .catch(err => showAlert(err.message, "danger"));
}

function isOverdue(chore) {
  if (!chore.dueDate || chore.status === "COMPLETED") return false;
  return new Date(chore.dueDate) < today();
}
function isDueToday(chore) {
  if (!chore.dueDate || chore.status === "COMPLETED") return false;
  const d = new Date(chore.dueDate);
  return d.toDateString() === today().toDateString();
}
function today() {
  const t = new Date(); t.setHours(0,0,0,0); return t;
}

function showAlert(message, type="info") {
  const alert = document.getElementById("alertMessage");
  alert.textContent = message;
  alert.className = `alert alert-${type}`;
  alert.classList.remove("d-none");
  setTimeout(() => alert.classList.add("d-none"), 3000);
}

// Chat
function openChat(choreId, ownerId) {
  activeChatChore = choreId;
  activeOwnerId = ownerId;
  const chore = allChores.find(c => c.id === choreId);
  document.getElementById("chatTitle").textContent = chore ? chore.title : "Chat";
  document.getElementById("chatSubtitle").textContent = "Owner";
  document.getElementById("chatPanel").style.display = "flex";
  unreadCounts[choreId] = 0;
  renderChores();
  loadChatMessages(choreId);
  connectChatSocket(choreId);
}

function toggleChat(show) {
  document.getElementById("chatPanel").style.display = show ? "flex" : "none";
  if (!show && chatStomp) { chatStomp.disconnect(); chatStomp = null; }
}

function setupGlobalChatSubscriptions() {
  if (chatStomp && chatStomp.connected) {
    subscribeAllChores();
    return;
  }
  const sock = new SockJS(`${API_URL}/ws`);
  chatStomp = Stomp.over(sock);
  chatStomp.connect({}, () => subscribeAllChores());
}

function subscribeAllChores() {
  if (!chatStomp) return;
  allChores.forEach(c => {
    const dest = `/topic/chat/${c.id}`;
    const key = `chat-${c.id}`;
    if (!chatStomp.subscriptions || !chatStomp.subscriptions[key]) {
      chatStomp.subscribe(dest, (frame) => handleIncomingChat(c.id, frame), {id: key});
    }
  });
}

function handleIncomingChat(choreId, frame) {
  const msg = JSON.parse(frame.body);
  const isMe = String(msg.senderId) === String(currentUserId);
  if (activeChatChore === choreId && document.getElementById("chatPanel").style.display === "flex") {
    loadChatMessages(choreId);
    return;
  }
  if (!isMe) {
    unreadCounts[choreId] = (unreadCounts[choreId] || 0) + 1;
    renderChores();
  }
}

function loadChatMessages(choreId) {
  fetch(`${API_URL}/api/messages/chore/${choreId}`)
    .then(res => res.json())
    .then(renderChatMessages);
}

function renderChatMessages(msgs) {
  const box = document.getElementById("chatMessages");
  box.innerHTML = msgs.map(m => {
    const me = String(m.senderId) === String(currentUserId);
    const time = new Date(m.createdAt).toLocaleTimeString();
    return `<div class="bubble ${me ? "me" : "them"}">
      <div>${m.message}</div>
      <small>${time}</small>
    </div>`;
  }).join("");
  box.scrollTop = box.scrollHeight;
}

function connectChatSocket(choreId) {
  if (chatStomp) chatStomp.disconnect();
  const sock = new SockJS(`${API_URL}/ws`);
  chatStomp = Stomp.over(sock);
  chatStomp.connect({}, () => {
    chatStomp.subscribe(`/topic/chat/${choreId}`, () => loadChatMessages(choreId));
  });
}

function sendChat() {
  if (!activeChatChore) return;
  const text = document.getElementById("chatInput").value.trim();
  if (!text) return;
  const payload = {
    choreId: activeChatChore,
    senderId: Number(currentUserId),
    receiverId: activeOwnerId,
    message: text
  };
  fetch(`${API_URL}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).then(() => {
    document.getElementById("chatInput").value = "";
    loadChatMessages(activeChatChore);
    if (chatStomp) chatStomp.send(`/app/chat/${activeChatChore}`, {}, JSON.stringify(payload));
  });
}

function logout() {
  localStorage.clear();
  window.location.href = "/login.html";
}
