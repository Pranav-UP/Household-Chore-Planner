const API_URL = (() => {
  const override = window.API_BASE_URL || window.apiBaseUrl;
  if (override && override.trim()) return override.replace(/\/$/, "");
  const origin = window.location.origin;
  if (!origin || origin === "null") return "http://localhost:8080";
  if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
    return origin.replace(/\/$/, "");
  }
  return "https://chore-planner-backend-npc3.onrender.com";
})();

const workerId = localStorage.getItem("userId");
const workerRole = 'WORKER';
let stompClientWorker = null;
let currentWorkerChoreId = null;
let workerChatPanel = document.getElementById('workerChatPanel');
let workerChatMessages = document.getElementById('workerChatMessages');

// Load on start
window.addEventListener('DOMContentLoaded', () => {
  if (!workerId) {
    window.location.href = '/login.html';
    return;
  }
  loadTasks();
  setupWorkerChat();
});

function logout() {
  localStorage.clear();
  window.location.href = '/login.html';
}

function loadTasks() {
  if (!workerId) return;
  fetch(`${API_URL}/api/chores/worker/${workerId}`)
    .then(res => res.json())
    .then(tasks => {
      const tbody = document.querySelector('#taskTable tbody');
      tbody.innerHTML = '';
      updateStats(tasks);
      tasks.forEach(task => {
        tbody.innerHTML += `
          <tr>
            <td><strong>${task.title}</strong></td>
            <td>${task.description || '-'}</td>
            <td>${task.dueDate}</td>
            <td><span class="badge ${task.status === 'COMPLETED' ? 'bg-success' : 'bg-warning'}">${task.status}</span></td>
            <td class="chat-col">
              <button class="chat-btn" data-chore-id="${task.id}" title="Chat about this chore">
                💬
              </button>
            </td>
            <td>
              ${task.status === 'PENDING' ? `<button class="btn btn-success btn-sm" onclick="completeTask(${task.id})">Complete</button>` : '<span class="text-success">✓ Done</span>'}
            </td>
          </tr>`;
      });
      setupWorkerChatListeners();
    })
    .catch(err => console.error('Load tasks error:', err));
}

function updateStats(tasks) {
  const assigned = tasks.length;
  const dueToday = tasks.filter(t => new Date(t.dueDate).toDateString() === new Date().toDateString()).length;
  const completed = tasks.filter(t => t.status === 'COMPLETED').length;

  document.getElementById('assignedCount').textContent = assigned;
  document.getElementById('dueTodayCount').textContent = dueToday;
  document.getElementById('completedCount').textContent = completed;
}

function setupWorkerChatListeners() {
  document.querySelectorAll('.chat-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      currentWorkerChoreId = e.target.dataset.choreId;
      toggleWorkerChat();
    });
  });
}

function setupWorkerChat() {
  // Badge update placeholder - poll unread
  setInterval(updateChatBadge, 30000);
}

function toggleWorkerChat() {
  if (!currentWorkerChoreId) return alert('Select a chore to chat');
  if (workerChatPanel.style.display === 'block') {
    workerChatPanel.style.display = 'none';
    if (stompClientWorker) stompClientWorker.deactivate();
  } else {
    document.getElementById('workerChatChoreTitle').textContent = document.querySelector(`[data-chore-id="${currentWorkerChoreId}"]`)?.closest('tr')?.querySelector('td:first-child')?.textContent || '';
    loadWorkerQueries(currentWorkerChoreId);
    connectWorkerWebSocket(currentWorkerChoreId);
    workerChatPanel.style.display = 'block';
  }
}

function loadWorkerQueries(choreId) {
  fetch(`${API_URL}/api/chat/${choreId}`)
    .then(res => res.json())
    .then(messages => {
      workerChatMessages.innerHTML = messages.map(msg => createMessageElement(msg)).join('');
      workerChatMessages.scrollTop = workerChatMessages.scrollHeight;
    })
    .catch(err => console.error('Load queries error:', err));
}

function createMessageElement(msg) {
  const isWorker = msg.senderRole === 'WORKER';
  return `
    <div class="chat-message ${isWorker ? 'worker-message' : 'owner-reply'}">
      <div class="message-header">
        <span class="message-sender">${msg.senderRole}</span>
        <span class="message-time">${new Date(msg.timestamp).toLocaleString()}</span>
      </div>
      <div class="message-content">${msg.message}</div>
    </div>
  `;
}

function connectWorkerWebSocket(choreId) {
  stompClientWorker = new StompJs.Client({
    brokerURL: `${API_URL.replace('http', 'ws')}/ws`,
    reconnectDelay: 5000,
    onConnect: () => {
      stompClientWorker.subscribe(`/topic/chat/${choreId}`, message => {
        const msg = JSON.parse(message.body);
        const div = document.createElement('div');
        div.outerHTML = createMessageElement(msg);
        workerChatMessages.appendChild(div);
        workerChatMessages.scrollTop = workerChatMessages.scrollHeight;
      });
    }
  });
  stompClientWorker.activate();
}

function sendWorkerReply() {
  const input = document.getElementById('workerReplyInput');
  const messageText = input.value.trim();
  if (!messageText || !currentWorkerChoreId || !stompClientWorker?.connected) return input.focus();

  const msg = {
    choreId: parseInt(currentWorkerChoreId),
    senderId: parseInt(workerId),
    senderRole: 'WORKER',
    message: messageText,
    timestamp: new Date().toISOString()
  };

  stompClientWorker.publish({
    destination: `/app/chat.send/${currentWorkerChoreId}`,
    body: JSON.stringify(msg)
  });

  input.value = '';
}

function cancelWorkerReply() {
  document.getElementById('workerReplyInput').value = '';
}

function completeTask(id) {
  fetch(`${API_URL}/api/chores/complete/${id}`, { method: 'PUT' })
    .then(() => loadTasks())
    .catch(err => console.error('Complete error:', err));
}

function updateChatBadge() {
  // Placeholder - fetch unread count
  const badge = document.getElementById('chatBadge');
  badge.textContent = '3';
  badge.style.display = 'block';
}

loadTasks();
