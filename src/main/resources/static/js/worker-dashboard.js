const API_URL = window.location.origin === "null"
  ? "http://localhost:8080"
  : "";

let currentUserId = null;
let currentEmail = null;
let allChores = [];
let currentFilter = "ALL";

// Check authentication
window.addEventListener('DOMContentLoaded', () => {
  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");
  const email = localStorage.getItem("email");

  if (!role || (role !== "MEMBER" && role !== "WORKER")) {
    window.location.href = "/login.html";
    return;
  }

  currentUserId = userId;
  currentEmail = email;
  document.getElementById("userEmail").textContent = email;

  loadChores();
});

function loadChores() {
  fetch(API_URL + "/api/chores/worker/" + currentUserId)
    .then(res => res.json())
    .then(data => {
      allChores = data;
      updateStats();
      displayChores(getFilteredChores());
    })
    .catch(err => {
      console.error("Error loading chores:", err);
      showAlert("Could not load your chores", "danger");
    });
}

function updateStats() {
  const total = allChores.length;
  const pending = allChores.filter(c => c.status === "PENDING").length;
  const completed = allChores.filter(c => c.status === "COMPLETED").length;

  document.getElementById("totalAssigned").textContent = total;
  document.getElementById("pendingCount").textContent = pending;
  document.getElementById("completedCount").textContent = completed;
}

function filterChores(filterValue) {
  currentFilter = filterValue;
  
  // Update active button
  document.querySelectorAll('.btn-filter').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');

  displayChores(getFilteredChores());
}

function getFilteredChores() {
  if (currentFilter === "ALL") {
    return allChores;
  } else {
    return allChores.filter(c => c.status === currentFilter);
  }
}

function displayChores(chores) {
  const choresList = document.getElementById("choresList");

  if (chores.length === 0) {
    choresList.innerHTML = `
      <div class="empty-state">
        <p>📭 No chores in this category</p>
        <p style="font-size: 14px; color: #a0a0a0;">Check back later for new assignments!</p>
      </div>
    `;
    return;
  }

  choresList.innerHTML = chores.map(chore => {
    const isCompleted = chore.status === "COMPLETED";
    const statusBadge = isCompleted
      ? '<span class="badge-completed">✓ Completed</span>'
      : '<span class="badge-pending">⏳ Pending</span>';

    const formattedDate = formatDate(chore.dueDate);
    const isOverdue = isOverdueChore(chore.dueDate) && !isCompleted;
    const overdueClass = isOverdue ? "border-danger" : "";

    return `
      <div class="chore-card ${overdueClass}">
        <h5>${chore.title}</h5>
        ${chore.description ? `<p><strong>Description:</strong> ${chore.description}</p>` : ""}
        <p><strong>Due Date:</strong> ${formattedDate}</p>
        <div class="chore-info">
          <div>${statusBadge}</div>
          ${!isCompleted ? `<button class="btn-complete" onclick="completeChore(${chore.id})">Mark as Complete</button>` : '<button class="btn-complete" disabled>Already Completed</button>'}
        </div>
      </div>
    `;
  }).join("");
}

function isOverdueChore(dueDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  return due < today;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

function completeChore(choreId) {
  if (confirm("Are you sure you want to mark this chore as completed?")) {
    fetch(API_URL + "/api/chores/" + choreId + "/complete", {
      method: "PUT",
      headers: { "Content-Type": "application/json" }
    })
    .then(res => {
      if (!res.ok) throw new Error("Failed to complete chore");
      return res.json();
    })
    .then(data => {
      showAlert("✓ Great! Chore marked as completed!", "success");
      loadChores();
    })
    .catch(err => {
      console.error(err);
      showAlert("Error completing chore", "danger");
    });
  }
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
