const API = "http://localhost:8081/api/chores";

function loadChores() {
  fetch(API)
    .then(res => res.json())
    .then(data => {
      const table = document.getElementById("choreTable");
      table.innerHTML = "";
      data.forEach(c => {
        table.innerHTML += `
          <tr>
            <td>${c.title}</td>
            <td>${c.dueDate}</td>
            <td>
              <span class="badge ${c.status === 'COMPLETED' ? 'bg-success' : 'bg-warning'}">
                ${c.status}
              </span>
            </td>
            <td>
              <button class="btn btn-sm btn-success" onclick="completeChore(${c.id})">
                Done
              </button>
            </td>
          </tr>
        `;
      });
    });
}

function addChore() {
  const chore = {
    title: title.value,
    description: description.value,
    dueDate: dueDate.value,
    status: "PENDING"
  };

  fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(chore)
  }).then(() => {
    loadChores();
  });
}

function completeChore(id) {
  fetch(`${API}/${id}`)
    .then(res => res.json())
    .then(c => {
      c.status = "COMPLETED";
      fetch(`${API}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(c)
      }).then(loadChores);
    });
}

loadChores();
