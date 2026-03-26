const API_URL = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ? "http://localhost:8080"
  : "https://chore-planner-backend-npc3.onrender.com";

// Optionally override from a global variable (set from hosting environment):
// API_URL = window.API_BASE_URL || API_URL;

document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const togglePassword = document.getElementById("togglePassword");

  const submitOnEnter = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      login(event);
    }
  };

  if (emailInput) emailInput.addEventListener("keydown", submitOnEnter);
  if (passwordInput) passwordInput.addEventListener("keydown", submitOnEnter);
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
      const isVisible = passwordInput.type === "text";
      passwordInput.type = isVisible ? "password" : "text";
      togglePassword.classList.toggle("is-visible", !isVisible);
      togglePassword.setAttribute("aria-label", isVisible ? "Show password" : "Hide password");
    });
  }
});

function login(event) {
  if (event) event.preventDefault();
  
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  if (!email || !password) {
    alert("Please enter both email and password");
    return;
  }
  const normalizedEmail = email.trim().toLowerCase();

  fetch(API_URL + "/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: normalizedEmail,
      password: password
    })
  })
  .then(res => {
    if (!res.ok) {
      return res.text().then(text => {
        let message = "Invalid credentials";
        try {
          const parsed = JSON.parse(text);
          message = parsed.message || message;
        } catch (_err) {
          if (text) message = text;
        }
        throw new Error(message);
      });
    }
    return res.json();
  })
  .then(data => {
    const role = String(data.role || "").trim().toUpperCase();
    localStorage.setItem("role", role);
    localStorage.setItem("name", data.name || "");
    localStorage.setItem("email", data.email);
    // Store both new and legacy keys so older pages keep working
    localStorage.setItem("userId", data.id);
    localStorage.setItem("id", data.id);

    if (role === "OWNER" || role === "ADMIN") {
      window.location.href = "/owner-dashboard.html";
    } else {
      window.location.href = "/worker-dashboard.html";
    }
  })
  .catch(error => {
    console.warn("Login failed:", error);
    alert("Login failed: " + error.message);
  });
}
