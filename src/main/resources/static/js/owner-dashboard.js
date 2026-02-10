const API_URL = window.location.origin === "null"
  ? "http://localhost:8082"
  : "";

let currentUserId = null;
let currentUsername = null;
let allChores = [];
let allUsers = [];

// Check authentication
window.addEventListener('DOMContentLoaded', () => {
  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");
  const username = localStorage.getItem("username");

  if (!role || role !== "OWNER") {
    window.location.href = "/login.html";
    return;
  }

  currentUserId = userId;
  currentUsername = username;
  document.getElementById("username").textContent = username;

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
  const select = document.getElementById("choreAssignee");
  select.innerHTML = '<option value="">Select a family member</option>';
  
  allUsers.forEach(user => {
    const option = document.createElement("option");
    option.value = user.id;
    option.textContent = user.username + (user.role === "OWNER" ? " (Owner)" : " (Member)");
    select.appendChild(option);
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

    return `
      <tr>
        <td><strong>${chore.title}</strong></td>
        <td>${chore.dueDate}</td>
        <td>${statusBadge}</td>
        <td>
          <button class="btn btn-sm btn-warning btn-sm-action" onclick="editChore(${chore.id})">Edit</button>
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
    const username = user ? user.username : "Unassigned";
    const statusBadge = chore.status === "PENDING"
      ? '<span class="badge-pending">Pending</span>'
      : '<span class="badge-completed">Completed</span>';

    return `
      <tr>
        <td><strong>${chore.title}</strong></td>
        <td>${chore.description || "-"}</td>
        <td>${username}</td>
        <td>${chore.dueDate}</td>
        <td>${statusBadge}</td>
        <td>
          <button class="btn btn-sm btn-warning btn-sm-action" onclick="editChore(${chore.id})">Edit</button>
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

function editChore(choreId) {
  const chore = allChores.find(c => c.id === choreId);
  if (!chore) return;

  const newStatus = chore.status === "PENDING" ? "COMPLETED" : "PENDING";
  
  fetch(API_URL + "/api/chores/" + choreId, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: newStatus })
  })
  .then(res => res.json())
  .then(data => {
    showAlert(`Chore marked as ${newStatus}`, "success");
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
