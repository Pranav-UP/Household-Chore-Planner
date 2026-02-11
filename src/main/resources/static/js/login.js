const API_URL = window.location.origin === "null"
  ? "http://localhost:8080"
  : "";

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
    return;
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail.endsWith("@gmail.com")) {
    alert("Please use a Gmail address");
    return;
  }

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
      return res.json().then(err => {
        throw new Error(err.message || "Invalid credentials");
      });
    }
    return res.json();
  })
  .then(data => {
    let role = String(data.role || "").trim().toUpperCase();
    if (normalizedEmail === "mrpranav161@gmail.com") {
      role = "OWNER";
    }
    localStorage.setItem("role", role);
    localStorage.setItem("email", data.email);
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
