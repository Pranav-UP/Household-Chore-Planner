const workerId = localStorage.getItem("userId");
const workerName = localStorage.getItem("email");
const taskTable = document.getElementById("taskTable");
const queryList = document.getElementById("queryList");
const queryMessage = document.getElementById("queryMessage");
const queryListPopover = document.getElementById("queryListPopover");
const queryMessagePopover = document.getElementById("queryMessagePopover");

function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

function loadTasks() {
  if (!workerId) {
    alert("Missing worker id. Please log in again.");
    return;
  }

  fetch(`/api/chores/worker/${workerId}`)
    .then(res => res.json())
    .then(data => {
      taskTable.innerHTML = `
        <tr>
          <th>Title</th>
          <th>Description</th>
          <th>Status</th>
          <th>Action</th>
        </tr>`;
      data.forEach(c => {
        taskTable.innerHTML += `
          <tr>
            <td>${c.title}</td>
            <td>${c.description || ""}</td>
            <td>${c.status}</td>
            <td>
              <button class="btn btn-secondary" onclick="complete(${c.id})">Complete</button>
            </td>
          </tr>`;
      });
    });
}

function complete(id) {
  fetch(`/api/chores/complete/${id}`, { method: "PUT" })
    .then(loadTasks);
}



 loadTasks();
