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
let allUsers = [];
let currentFilter = "ALL";
let statusChart = null;
let chatStomp = null;
let activeChatChore = null;
let unreadCounts = {};
let globalChatStomp = null;

document.addEventListener("DOMContentLoaded", () => {
  const role = (localStorage.getItem("role") || "").toUpperCase();
  currentUserId = localStorage.getItem("userId");
  currentEmail = localStorage.getItem("email");
  if (role !== "OWNER" || !currentUserId) {
    window.location.href = "/login.html";
    return;
  }
  document.getElementById("userEmail").textContent = currentEmail || "";

  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      currentFilter = e.target.dataset.filter;
      renderChores();
    });
  });

  document.getElementById("searchInput").addEventListener("input", renderChores);
  loadUsers().then(() => loadChores());
});

function loadUsers() {
  return fetch(`${API_URL}/api/auth/users/members`)
    .then(res => res.json())
    .then(data => {
      allUsers = data || [];
      populateAssignees();
    })
    .catch(() => showAlert("Could not load workers"));
}

function populateAssignees() {
  const selects = [document.getElementById("choreAssignee"), document.getElementById("editChoreAssignee")];
  selects.forEach(sel => {
    sel.innerHTML = `<option value="">Select worker</option>`;
    allUsers.forEach(u => {
      const opt = document.createElement("option");
      opt.value = u.id;
      opt.textContent = `${u.name || u.email} (${u.email})`;
      sel.appendChild(opt);
    });
  });
}

function loadChores() {
  fetch(`${API_URL}/api/chores/owner/${currentUserId}`)
    .then(res => res.json())
    .then(data => {
      allChores = data || [];
      updateStats();
      renderChores();
      renderCalendar();
      renderChart();
      setupGlobalChatSubscriptions();
    })
    .catch(() => showAlert("Unable to load chores"));
}

function updateStats() {
  const total = allChores.length;
  const pending = allChores.filter(c => c.status === "PENDING").length;
  const completed = allChores.filter(c => c.status === "COMPLETED").length;
  const overdue = allChores.filter(isOverdue).length;
  document.getElementById("totalChores").textContent = total;
  document.getElementById("pendingChores").textContent = pending;
  document.getElementById("completedChores").textContent = completed;
  document.getElementById("overdueChores").textContent = overdue;
}

function renderChart() {
  const ctx = document.getElementById("statusChart");
  const pending = allChores.filter(c => c.status === "PENDING").length;
  const completed = allChores.filter(c => c.status === "COMPLETED").length;
  const total = pending + completed;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  if (statusChart) statusChart.destroy();

  const centerText = {
    id: "centerText",
    afterDraw(chart) {
      const {ctx, chartArea: {width, height}} = chart;
      ctx.save();
      ctx.font = "600 26px Inter, sans-serif";
      ctx.fillStyle = "#15803d";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${pct}%`, width / 2, height / 2 - 6);
      ctx.font = "500 14px Inter, sans-serif";
      ctx.fillStyle = "#6b7280";
      ctx.fillText("Completed", width / 2, height / 2 + 16);
      ctx.restore();
    }
  };

  statusChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Pending", "Completed"],
      datasets: [{
        data: [pending, completed],
        backgroundColor: ["#fbbf24", "#22c55e"],
        borderWidth: 1
      }]
    },
    options: {
      cutout: "65%",
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            label: (item) => {
              const value = item.parsed;
              const percent = total === 0 ? 0 : Math.round((value / total) * 100);
              return `${item.label}: ${value} (${percent}%)`;
            }
          }
        }
      }
    },
    plugins: [centerText]
  });
}

function setupGlobalChatSubscriptions() {
  if (globalChatStomp && globalChatStomp.connected) {
    allChores.forEach(c => {
      if (!globalChatStomp.subscriptions[`sub-${c.id}`]) {
        globalChatStomp.subscribe(`/topic/chat/${c.id}`, (frame) => handleIncomingChat(c.id, frame));
      }
    });
    return;
  }
  const sock = new SockJS(`${API_URL}/ws`);
  globalChatStomp = Stomp.over(sock);
  globalChatStomp.connect({}, () => {
    allChores.forEach(c => {
      globalChatStomp.subscribe(`/topic/chat/${c.id}`, (frame) => handleIncomingChat(c.id, frame));
    });
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

// Chat functions
function openChat(choreId) {
  activeChatChore = choreId;
  const chore = allChores.find(c => c.id === choreId);
  document.getElementById("chatTitle").textContent = chore ? chore.title : "Chat";
  const worker = chore ? getUser(chore.workerId) : null;
  document.getElementById("chatSubtitle").textContent = worker ? (worker.name || worker.email) : "";
  document.getElementById("chatPanel").style.display = "flex";
  unreadCounts[choreId] = 0;
  renderChores();
  loadChatMessages(choreId);
  connectChatSocket(choreId);
}

function toggleChat(show) {
  document.getElementById("chatPanel").style.display = show ? "flex" : "none";
  activeChatChore = show ? activeChatChore : null;
  if (!show && chatStomp) {
    chatStomp.disconnect();
    chatStomp = null;
  }
}

function loadChatMessages(choreId) {
  fetch(`${API_URL}/api/messages/chore/${choreId}`)
    .then(res => res.json())
    .then(msgs => renderChatMessages(msgs));
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
    chatStomp.subscribe(`/topic/chat/${choreId}`, (frame) => {
      loadChatMessages(choreId);
    });
  });
}

function sendChat() {
  if (!activeChatChore) return;
  const text = document.getElementById("chatInput").value.trim();
  if (!text) return;
  const chore = allChores.find(c => c.id === activeChatChore);
  const payload = {
    choreId: activeChatChore,
    senderId: Number(currentUserId),
    receiverId: chore ? chore.workerId : null,
    message: text
  };
  fetch(`${API_URL}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).then(() => {
    document.getElementById("chatInput").value = "";
    loadChatMessages(activeChatChore);
    if (chatStomp) {
      chatStomp.send(`/app/chat/${activeChatChore}`, {}, JSON.stringify(payload));
    }
  });
}

function renderChores() {
  const tbody = document.getElementById("choreTableBody");
  const search = document.getElementById("searchInput").value.toLowerCase();
  const filtered = allChores.filter(c => {
    const matchesFilter = currentFilter === "ALL" || c.status === currentFilter;
    const workerName = (getUser(c.workerId)?.name || "").toLowerCase();
    const workerEmail = (getUser(c.workerId)?.email || "").toLowerCase();
    const matchesSearch = (c.title || "").toLowerCase().includes(search) ||
      workerName.includes(search) || workerEmail.includes(search);
    return matchesFilter && matchesSearch;
  });

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">No chores found</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(chore => {
    const worker = getUser(chore.workerId);
    const due = chore.dueDate || "-";
    const overdue = isOverdue(chore);
    const dueToday = isDueToday(chore);
    const statusClass = chore.status === "COMPLETED"
      ? "status-completed"
      : overdue ? "status-overdue"
      : dueToday ? "status-pending due-today" : "status-pending";
    const priorityBadge = priorityChip(chore.priority);
    return `
      <tr class="${dueToday ? "table-warning" : ""} ${overdue ? "table-danger" : ""}">
        <td class="fw-semibold">${chore.title || ""}</td>
        <td>${worker ? worker.name || worker.email : "Unassigned"}</td>
        <td>${priorityBadge}</td>
        <td>${due}</td>
        <td><span class="status-chip ${statusClass}">${formatStatus(chore.status, overdue, dueToday)}</span></td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary me-1" onclick="openEditModal(${chore.id})"><i class="fa fa-pen"></i></button>
          <button class="btn btn-sm btn-outline-secondary me-1 position-relative" onclick="openChat(${chore.id})">
            <i class="fa fa-comments"></i>
            ${unreadCounts[chore.id] > 0 ? '<span class="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle"></span>' : ''}
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteChore(${chore.id})"><i class="fa fa-trash"></i></button>
        </td>
      </tr>
    `;
  }).join("");
}

function renderCalendar() {
  const container = document.getElementById("calendarList");
  const grouped = allChores.reduce((acc, chore) => {
    if (!chore.dueDate) return acc;
    acc[chore.dueDate] = acc[chore.dueDate] || [];
    acc[chore.dueDate].push(chore);
    return acc;
  }, {});
  const dates = Object.keys(grouped).sort();
  if (!dates.length) {
    container.innerHTML = `<div class="text-muted small">No dated chores yet</div>`;
    return;
  }
  container.innerHTML = dates.map(date => {
    const items = grouped[date].map(c => `<div class="d-flex align-items-center justify-content-between">
        <span class="fw-semibold">${c.title}</span>
        ${priorityChip(c.priority)}
      </div>`).join("");
    return `<div class="calendar-day">
      <h6>${date}</h6>
      ${items}
    </div>`;
  }).join("");
}

function addChore(e) {
  e.preventDefault();
  const payload = {
    title: document.getElementById("choreTitle").value.trim(),
    description: document.getElementById("choreDescription").value.trim(),
    dueDate: document.getElementById("choreDueDate").value,
    priority: document.getElementById("chorePriority").value,
    workerId: Number(document.getElementById("choreAssignee").value),
    ownerId: Number(currentUserId),
    status: "PENDING"
  };
  if (!payload.title || !payload.dueDate || !payload.workerId) {
    showAlert("Title, due date and worker are required");
    return;
  }
  fetch(`${API_URL}/api/chores`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).then(res => {
    if (!res.ok) throw new Error("Failed to create chore");
    return res.json();
  }).then(() => {
    document.getElementById("choreForm").reset();
    loadChores();
  }).catch(err => showAlert(err.message));
}

function openEditModal(id) {
  const chore = allChores.find(c => c.id === id);
  if (!chore) return;
  document.getElementById("editChoreId").value = chore.id;
  document.getElementById("editChoreTitle").value = chore.title || "";
  document.getElementById("editChoreDescription").value = chore.description || "";
  document.getElementById("editChoreDueDate").value = chore.dueDate || "";
  document.getElementById("editChorePriority").value = chore.priority || "MEDIUM";
  document.getElementById("editChoreAssignee").value = chore.workerId || "";
  document.getElementById("editChoreStatus").value = chore.status || "PENDING";
  const modal = new bootstrap.Modal(document.getElementById("editChoreModal"));
  modal.show();
}

function saveChoreEdits() {
  const id = document.getElementById("editChoreId").value;
  const payload = {
    title: document.getElementById("editChoreTitle").value.trim(),
    description: document.getElementById("editChoreDescription").value.trim(),
    dueDate: document.getElementById("editChoreDueDate").value,
    priority: document.getElementById("editChorePriority").value,
    workerId: Number(document.getElementById("editChoreAssignee").value),
    status: document.getElementById("editChoreStatus").value
  };
  fetch(`${API_URL}/api/chores/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).then(res => {
    if (!res.ok) throw new Error("Update failed");
    return res.json();
  }).then(() => {
    bootstrap.Modal.getInstance(document.getElementById("editChoreModal")).hide();
    loadChores();
  }).catch(err => showAlert(err.message));
}

function deleteChore(id) {
  if (!confirm("Delete this chore?")) return;
  fetch(`${API_URL}/api/chores/${id}`, { method: "DELETE" })
    .then(res => {
      if (!res.ok) throw new Error("Delete failed");
      loadChores();
    })
    .catch(err => showAlert(err.message));
}

function getUser(id) {
  return allUsers.find(u => String(u.id) === String(id));
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
  const t = new Date();
  t.setHours(0,0,0,0);
  return t;
}

function priorityChip(priority) {
  const p = (priority || "MEDIUM").toUpperCase();
  const map = { LOW: "badge-priority-low", MEDIUM: "badge-priority-medium", HIGH: "badge-priority-high" };
  return `<span class="badge ${map[p] || map.MEDIUM}">${p}</span>`;
}

function formatStatus(status, overdue, dueToday) {
  if (status === "COMPLETED") return "Completed";
  if (overdue) return "Overdue";
  if (dueToday) return "Due today";
  return "Pending";
}

function showAlert(msg) {
  const el = document.getElementById("alertMessage");
  el.textContent = msg;
  el.classList.remove("d-none");
  setTimeout(() => el.classList.add("d-none"), 3500);
}

function logout() {
  localStorage.clear();
  window.location.href = "/login.html";
}
