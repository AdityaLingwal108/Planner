function checkAdminAccess() {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = "index.html";
    }
}

function logoutAdmin() {
    localStorage.removeItem('isLoggedIn');
    window.location.href = "index.html";
}

window.addEventListener("load", checkAdminAccess);


function applySavedTheme() {
    const savedTheme = localStorage.getItem("adminTheme");

    if (savedTheme === "light") {
        document.body.classList.add("light-mode");
        document.getElementById("themeToggleBtn").textContent = "☀️";
    }
}

function toggleTheme() {
    const body = document.body;
    const btn = document.getElementById("themeToggleBtn");

    body.classList.toggle("light-mode");

    if (body.classList.contains("light-mode")) {
        localStorage.setItem("adminTheme", "light");
        btn.textContent = "☀️";
    } else {
        localStorage.setItem("adminTheme", "dark");
        btn.textContent = "🌙";
    }
}

window.addEventListener("load", () => {
    checkAdminAccess();
    applySavedTheme();

    const themeBtn = document.getElementById("themeToggleBtn");
    if (themeBtn) {
        themeBtn.addEventListener("click", toggleTheme);
    }
});