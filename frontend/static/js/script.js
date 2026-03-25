const api = "http://localhost:8081";

function login() {
  fetch(api + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: username.value,
      password: password.value
    })
  })
  .then(res => res.json())
  .then(user => {
    localStorage.setItem("id", user.id);
    localStorage.setItem("role", user.role);
    location.href = "dashboard.html";
  })
  .catch(() => msg.innerText = "Login failed");
}

const role = localStorage.getItem("role");
const userId = localStorage.getItem("id");

if (role) {
  welcome.innerText = "Welcome " + role;

  ownerPanel.style.display = role === "OWNER" ? "block" : "none";
  workerPanel.style.display = role === "WORKER" ? "block" : "none";

  if (role === "WORKER") loadWorkerChores();
}

function addChore() {
  fetch(api + "/api/chores", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: title.value,
      description: desc.value,
      dueDate: date.value,
      workerId: workerId.value
    })
  }).then(() => alert("Chore Added"));
}

function loadWorkerChores() {
  fetch(api + "/api/chores/worker/" + userId)
    .then(res => res.json())
    .then(data => {
      list.innerHTML = "";
      data.forEach(c => {
        list.innerHTML += `
          <li>
            ${c.title} - ${c.status}
            <button onclick="complete(${c.id})">Complete</button>
          </li>`;
      });
    });
}

function complete(id) {
  fetch(api + "/api/chores/" + id + "/complete", { method: "PUT" })
    .then(() => loadWorkerChores());
}

function sendQuery() {
  fetch(api + "/api/queries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: query.value,
      workerId: userId
    })
  }).then(() => alert("Query sent"));
}
