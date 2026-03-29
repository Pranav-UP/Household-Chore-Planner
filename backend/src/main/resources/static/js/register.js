const API_URL = (() => {
  const override = window.API_BASE_URL || window.apiBaseUrl;
  if (override && override.trim()) return override.replace(/\/$/, "");
  const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  if (isLocal) return "http://localhost:8080";
  return "https://chore-planner-backend-npc3.onrender.com";
})();

function register(event) {
  event.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const role = document.getElementById("role").value || "WORKER";
  const messageDiv = document.getElementById("message");

  // Validation
  const normalizedEmail = email.trim().toLowerCase();
  if (!name || name.trim().length < 2) {
    showMessage("Please enter your full name", "warning");
    return;
  }
  if (password !== confirmPassword) {
    showMessage("Passwords do not match!", "danger");
    return;
  }

  if (password.length < 6) {
    showMessage("Password must be at least 6 characters long!", "warning");
    return;
  }

  fetch(API_URL + "/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: name.trim(),
      email: normalizedEmail,
      password: password,
      role: role
    })
  })
  .then(res => {
    if (!res.ok) {
      return res.json().then(err => {
        throw new Error(err.message || "Registration failed");
      });
    }
    return res.json();
  })
  .then(data => {
    showMessage("Registration successful! Redirecting to login...", "success");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
  })
  .catch(error => {
    showMessage(error.message || "Registration failed. Please try again.", "danger");
  });
}

function showMessage(text, type) {
  const messageDiv = document.getElementById("message");
  messageDiv.className = `alert alert-${type}`;
  messageDiv.textContent = text;
  messageDiv.style.display = "block";
}
