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

function loadQueries() {
  if (!workerId) return;

  fetch(`/api/queries/worker/${workerId}`)
    .then(res => res.json())
    .then(data => {
      queryList.innerHTML = "";
      if (queryListPopover) queryListPopover.innerHTML = "";

      if (!data.length) {
        queryList.innerHTML = `<div class="subtitle">No messages yet.</div>`;
        if (queryListPopover) {
          queryListPopover.innerHTML = `<div class="subtitle">No messages yet.</div>`;
        }
        return;
      }

      data.forEach(q => {
        const bubble = `
          <div class="bubble worker">
            <div class="meta">You</div>
            <div>${q.message}</div>
            ${
              q.ownerReply
                ? `<div class="bubble owner" style="margin-top: 10px;">
                     <div class="meta">Owner reply</div>
                     <div>${q.ownerReply}</div>
                   </div>`
                : ""
            }
          </div>
        `;
        queryList.innerHTML += bubble;
        if (queryListPopover) queryListPopover.innerHTML += bubble;
      });
    });
}

function sendQuery() {
  if (!queryMessage.value.trim()) {
    alert("Type your query");
    return;
  }

  fetch("/api/queries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: queryMessage.value.trim(),
      workerId: workerId,
      workerName: workerName
    })
  }).then(() => {
    queryMessage.value = "";
    loadQueries();
  });
}

function sendQueryFromPopover() {
  if (!queryMessagePopover || !queryMessagePopover.value.trim()) {
    alert("Type your query");
    return;
  }

  fetch("/api/queries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: queryMessagePopover.value.trim(),
      workerId: workerId,
      workerName: workerName
    })
  }).then(() => {
    queryMessagePopover.value = "";
    loadQueries();
  });
}

function toggleChat() {
  const pop = document.getElementById("chatPopover");
  if (pop) pop.classList.toggle("open");
}

loadTasks();
loadQueries();
