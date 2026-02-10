const API_URL = window.location.origin === "null"
  ? "http://localhost:8082"
  : "";

function register(event) {
  event.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const role = document.getElementById("role").value;
  const messageDiv = document.getElementById("message");

  // Validation
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
      username: username,
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
