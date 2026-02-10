function addChore() {
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const dueDate = document.getElementById("dueDate").value;
  const workerId = document.getElementById("workerId").value;

  if (!workerId) {
    alert("Select worker");
    return;
  }

  fetch("/api/chores", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      description,
      dueDate,
      status: "PENDING",
      workerId: workerId,
      ownerId: 1
    })
  })
  .then(res => res.json())
  .then(() => {
    alert("Chore assigned");
    loadChores();
  });
}

function loadChores() {
  fetch("/api/chores")
    .then(res => res.json())
    .then(data => {
      const table = document.getElementById("choreTable");
      table.innerHTML = "";

      data.forEach(c => {
        table.innerHTML += `
          <tr>
            <td>${c.title}</td>
            <td>${c.description || ""}</td>
            <td>${c.workerId}</td>
            <td>${c.status}</td>
            <td>
              <button class="btn btn-secondary" onclick="deleteChore(${c.id})">Delete</button>
            </td>
          </tr>
        `;
      });
    });
}

function deleteChore(id) {
  fetch(`/api/chores/${id}`, { method: "DELETE" })
    .then(() => loadChores());
}

function renderQueries(containerId) {
  fetch("/api/queries")
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById(containerId);
      if (!list) return;
      list.innerHTML = "";

      if (!data.length) {
        list.innerHTML = `<div class="subtitle">No queries yet.</div>`;
        return;
      }

      data.forEach(q => {
        const workerLabel = q.workerName ? `${q.workerName} (#${q.workerId})` : `Worker #${q.workerId}`;
        list.innerHTML += `
          <div class="bubble worker">
            <div class="meta">${workerLabel}</div>
            <div>${q.message}</div>
            ${
              q.ownerReply
                ? `<div class="bubble owner" style="margin-top: 10px;">
                     <div class="meta">Owner reply</div>
                     <div>${q.ownerReply}</div>
                   </div>`
                : `<div class="reply-row">
                     <input id="reply-${q.id}" placeholder="Type your reply">
                     <button class="btn btn-primary" onclick="replyQuery(${q.id})">Reply</button>
                   </div>`
            }
          </div>
        `;
      });
    });
}

function replyQuery(id) {
  const input = document.getElementById(`reply-${id}`);
  if (!input || !input.value.trim()) {
    alert("Type a reply");
    return;
  }

  fetch(`/api/queries/${id}/reply`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ownerReply: input.value.trim(),
      ownerId: 1
    })
  }).then(() => {
    renderQueries("queryList");
    renderQueries("queryListPopover");
  });
}

loadChores();
renderQueries("queryList");
renderQueries("queryListPopover");
