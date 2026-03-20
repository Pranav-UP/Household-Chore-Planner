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
let currentEditChoreId = null;

// Check authentication
window.addEventListener('DOMContentLoaded', () => {
  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");
  const email = localStorage.getItem("email");

  if (!role || role !== "OWNER") {
    window.location.href = "/login.html";
    return;
  }

  currentUserId = userId;
  currentEmail = email;
  document.getElementById("userEmail").textContent = email;

  loadUsers();
  loadChores();
  setupFilterListeners();
});

function loadUsers() {
  fetch(API_URL + "/api/auth/users/members")
    .then(res => res.json())
    .then(data => {
      allUsers = data;
      populateAssigneeDropdown();
    })
    .catch(err => console.error("Error loading users:", err));
}

function populateAssigneeDropdown() {
  const selects = [
    document.getElementById("choreAssignee"),
    document.getElementById("editChoreAssignee")
  ].filter(Boolean);

  const usersToShow = allUsers
    .filter(user => user && user.id != null && user.email);

  // Fallback: if API returned no members, show the built-in default workers so owner can still assign
  const fallbackUsers = [
    { id: 'worker1@gmail.com', email: 'worker1@gmail.com', role: 'WORKER' },
    { id: 'worker2@gmail.com', email: 'worker2@gmail.com', role: 'WORKER' }
  ];
  const list = usersToShow.length > 0 ? usersToShow : fallbackUsers;

  selects.forEach(select => {
    select.innerHTML = '<option value="">Select a worker</option>';
    list.forEach(user => {
      const option = document.createElement("option");
      option.value = user.id;
      option.textContent = user.email + (user.role === "OWNER" ? " (Owner)" : " (Member)");
      select.appendChild(option);
    });
  });
}

function loadChores() {
  fetch(API_URL + "/api/chores/owner/" + currentUserId)
    .then(res => res.json())
    .then(data => {
      allChores = data;
      updateStats();
      displayChores(allChores);
      displayAllChores(allChores);
    })
    .catch(err => {
      console.error("Error loading chores:", err);
      showAlert("Could not load chores", "danger");
    });
}

function updateStats() {
  const total = allChores.length;
  const pending = allChores.filter(c => c.status === "PENDING").length;
  const completed = allChores.filter(c => c.status === "COMPLETED").length;

  document.getElementById("totalChores").textContent = total;
  document.getElementById("pendingChores").textContent = pending;
  document.getElementById("completedChores").textContent = completed;
}

function setupFilterListeners() {
  const filterRadios = document.querySelectorAll('input[name="filterOption"]');
  filterRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      const filterValue = document.querySelector('input[name="filterOption"]:checked').value;
      applyFilter(filterValue);
    });
  });
}

function applyFilter(filterValue) {
  if (filterValue === "ALL") {
    displayChores(allChores);
  } else {
    displayChores(allChores.filter(c => c.status === filterValue));
  }
}

function displayChores(chores) {
  const tbody = document.getElementById("choreTableBody");
  
  if (chores.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center" style="color: #6b6b6b; padding: 30px;">
          No chores found
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = chores.map(chore => {
    const user = allUsers.find(u => u.id === chore.workerId);
    const statusBadge = chore.status === "PENDING" 
      ? '<span class="badge-pending">Pending</span>'
      : '<span class="badge-completed">Completed</span>';

    const editButton = chore.status === "PENDING"
      ? `<button class="btn btn-sm btn-warning btn-sm-action" onclick="openEditModal(${chore.id})">Edit</button>`
      : "";

    return `
      <tr>
        <td><strong>${chore.title}</strong></td>
        <td>${chore.dueDate}</td>
        <td>${statusBadge}</td>
        <td>
          ${editButton}
          <button class="btn btn-sm btn-danger btn-sm-action" onclick="deleteChore(${chore.id})">Delete</button>
        </td>
      </tr>
    `;
  }).join("");
}

function displayAllChores(chores) {
  const tbody = document.getElementById("fullChoreTable");
  
  if (chores.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center" style="color: #6b6b6b; padding: 30px;">
          No chores created yet. Create your first chore above!
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = chores.map(chore => {
    const user = allUsers.find(u => u.id === chore.workerId);
    const username = user ? user.email : "Unassigned";
    const statusBadge = chore.status === "PENDING"
      ? '<span class="badge-pending">Pending</span>'
      : '<span class="badge-completed">Completed</span>';

    const editButton = chore.status === "PENDING"
      ? `<button class="btn btn-sm btn-warning btn-sm-action" onclick="openEditModal(${chore.id})">Edit</button>`
      : "";

    return `
      <tr>
        <td><strong>${chore.title}</strong></td>
        <td>${chore.description || "-"}</td>
        <td>${username}</td>
        <td>${chore.dueDate}</td>
        <td>${statusBadge}</td>
        <td>
          ${editButton}
          <button class="btn btn-sm btn-danger btn-sm-action" onclick="deleteChore(${chore.id})">Delete</button>
        </td>
      </tr>
    `;
  }).join("");
}

function addChore(event) {
  event.preventDefault();

  const title = document.getElementById("choreTitle").value;
  const description = document.getElementById("choreDescription").value;
  const dueDate = document.getElementById("choreDueDate").value;
  const workerId = document.getElementById("choreAssignee").value;

  if (!workerId) {
    showAlert("Please select a family member to assign the chore", "warning");
    return;
  }

  const chore = {
    title: title,
    description: description,
    dueDate: dueDate,
    ownerId: currentUserId,
    workerId: workerId,
    status: "PENDING"
  };

  fetch(API_URL + "/api/chores", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(chore)
  })
  .then(res => {
    if (!res.ok) throw new Error("Failed to add chore");
    return res.json();
  })
  .then(data => {
    showAlert("Chore created successfully!", "success");
    document.getElementById("choreForm").reset();
    loadChores();
  })
  .catch(err => {
    console.error(err);
    showAlert("Error creating chore", "danger");
  });
}

function openEditModal(choreId) {
  const chore = allChores.find(c => c.id === choreId);
  if (!chore) return;

  currentEditChoreId = choreId;
  document.getElementById("editChoreId").value = choreId;
  document.getElementById("editChoreTitle").value = chore.title || "";
  document.getElementById("editChoreDescription").value = chore.description || "";
  document.getElementById("editChoreDueDate").value = chore.dueDate || "";
  document.getElementById("editChoreAssignee").value = chore.workerId || "";

  const modal = new bootstrap.Modal(document.getElementById("editChoreModal"));
  modal.show();
}

function saveChoreEdits() {
  if (!currentEditChoreId) return;

  const title = document.getElementById("editChoreTitle").value.trim();
  const description = document.getElementById("editChoreDescription").value.trim();
  const dueDate = document.getElementById("editChoreDueDate").value;
  const workerId = document.getElementById("editChoreAssignee").value;

  if (!title) {
    showAlert("Please enter a chore title", "warning");
    return;
  }
  if (!workerId) {
    showAlert("Please select a family member", "warning");
    return;
  }

  fetch(API_URL + "/api/chores/" + currentEditChoreId, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description, dueDate, workerId })
  })
  .then(res => {
    if (!res.ok) throw new Error("Failed to update chore");
    return res.json();
  })
  .then(() => {
    const modalEl = document.getElementById("editChoreModal");
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
    currentEditChoreId = null;
    showAlert("Chore updated successfully!", "success");
    loadChores();
  })
  .catch(err => {
    console.error(err);
    showAlert("Error updating chore", "danger");
  });
}

function deleteChore(choreId) {
  if (!confirm("Are you sure you want to delete this chore?")) return;

  fetch(API_URL + "/api/chores/" + choreId, {
    method: "DELETE"
  })
  .then(res => {
    if (!res.ok) throw new Error("Failed to delete");
    showAlert("Chore deleted successfully!", "success");
    loadChores();
  })
  .catch(err => {
    console.error(err);
    showAlert("Error deleting chore", "danger");
  });
}

function showAlert(message, type) {
  const alertDiv = document.getElementById("alertMessage");
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;
  alertDiv.style.display = "block";

  setTimeout(() => {
    alertDiv.style.display = "none";
  }, 4000);
}

function logout() {
  localStorage.clear();
  window.location.href = "/login.html";
}

let currentChoreId = null;
let stompClient = null;
let queryPanel = null;

// Initialize chat when DOM ready
window.addEventListener('DOMContentLoaded', () => {
  // existing code...
  queryPanel = document.querySelector('.queries-panel') || createQueriesPanel();
  setupChatListeners();
});

function setupChatListeners() {
  // Add click listeners to chat column or icons in table
  document.addEventListener('click', (e) => {
    if (e.target.matches('.chat-btn, .chat-link')) {
      currentChoreId = e.target.dataset.choreId;
      toggleQueriesPanel();
    }
  });
}

function createQueriesPanel() {
  const panel = document.createElement('div');
  panel.className = 'queries-panel';
  panel.innerHTML = `
    <div class="queries-panel-header">
      <span>Chat <small id="chatChoreTitle"></small></span>
      <button onclick="toggleQueriesPanel()" style="background:none;border:none;font-size:20px;cursor:pointer;">×</button>
    </div>
    <div class="queries-panel-body" id="chatMessages"></div>
    <div class="reply-form">
      <textarea id="replyInput" class="reply-input" placeholder="Type your message..."></textarea>
      <div class="reply-actions">
        <button class="btn-reply-cancel" onclick="cancelReply()">Cancel</button>
        <button class="btn-reply-send" onclick="sendReply()">Send</button>
      </div>
    </div>
  `;
  document.body.appendChild(panel);
  return panel;
}

function toggleQueriesPanel() {
  if (!currentChoreId) return alert('Select a chore first');
  
  if (queryPanel.style.display === 'block') {
    queryPanel.style.display = 'none';
  } else {
    document.getElementById('chatChoreTitle').textContent = allChores.find(c => c.id == currentChoreId)?.title || '';
    loadQueries(currentChoreId);
    connectWebSocket(currentChoreId);
    queryPanel.style.display = 'block';
  }
}

function loadQueries(choreId) {
  fetch(`${API_URL}/api/chat/${choreId}`)
    .then(res => res.json())
    .then(messages => {
      document.getElementById('chatMessages').innerHTML = messages.map(msg => `
        <div class="chat-message ${msg.senderRole === 'OWNER' ? 'owner-reply' : 'worker-message'}">
          <div class="message-header">
            <span class="message-sender">${msg.senderRole}</span>
            <span class="message-time">${new Date(msg.timestamp).toLocaleTimeString()}</span>
          </div>
          <div class="message-content">${msg.message}</div>
        </div>
      `).join('');
      document.getElementById('chatMessages').scrollTop = document.getElementById('chatMessages').scrollHeight;
    });
}

function connectWebSocket(choreId) {
  if (stompClient) stompClient.disconnect();
  
  const socket = new SockJS(`${API_URL}/ws`);
  stompClient = Stomp.over(socket);
  stompClient.connect({}, () => {
    stompClient.subscribe(`/topic/chat/${choreId}`, (msg) => {
      const message = JSON.parse(msg.body);
      const div = document.createElement('div');
      div.className = `chat-message ${message.senderRole === 'OWNER' ? 'owner-reply' : 'worker-message'}`;
      div.innerHTML = `
        <div class="message-header">
          <span class="message-sender">${message.senderRole}</span>
          <span class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</span>
        </div>
        <div class="message-content">${message.message}</div>
      `;
      document.getElementById('chatMessages').appendChild(div);
      document.getElementById('chatMessages').scrollTop = document.getElementById('chatMessages').scrollHeight;
    });
  });
}

function sendReply() {
  const input = document.getElementById('replyInput');
  const message = input.value.trim();
  if (!message || !currentChoreId || !stompClient) return;

  const msgData = {
    choreId: currentChoreId,
    senderId: currentUserId,
    senderRole: 'OWNER',
    message: message,
    timestamp: new Date().toISOString()
  };

  stompClient.send(`/app/chat.send/${currentChoreId}`, {}, JSON.stringify(msgData));
  input.value = '';
}

function cancelReply() {
  document.getElementById('replyInput').value = '';
}

