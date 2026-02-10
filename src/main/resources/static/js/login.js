const API_URL = window.location.origin === "null"
  ? "http://localhost:8082"
  : "";

document.addEventListener("DOMContentLoaded", () => {
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const togglePassword = document.getElementById("togglePassword");

  const submitOnEnter = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      login(event);
    }
  };

  if (usernameInput) usernameInput.addEventListener("keydown", submitOnEnter);
  if (passwordInput) passwordInput.addEventListener("keydown", submitOnEnter);
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("change", () => {
      passwordInput.type = togglePassword.checked ? "text" : "password";
    });
  }
});

function login(event) {
  if (event) event.preventDefault();
  
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  if (!username || !password) {
    return;
  }

  fetch(API_URL + "/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username: username,
      password: password
    })
  })
  .then(res => {
    if (!res.ok) {
      return res.json().then(err => {
        throw new Error(err.message || "Invalid credentials");
      });
    }
    return res.json();
  })
  .then(data => {
    const role = String(data.role || "").trim().toUpperCase();
    localStorage.setItem("role", role);
    localStorage.setItem("username", data.username);
    localStorage.setItem("userId", data.id);

    if (role === "OWNER" || role === "ADMIN") {
      window.location.href = "/owner-dashboard.html";
    } else {
      window.location.href = "/worker-dashboard.html";
    }
  })
  .catch(error => {
    console.warn("Login failed:", error);
  });
}
