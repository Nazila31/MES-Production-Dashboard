/* ==========================================================
    APP.JS - Shared Application Logic
========================================================== */

/* ==========================================================
    Constants
========================================================== */

const menuToggle = document.getElementById("menuToggle");
const sidebar = document.querySelector(".sidebar");
const mainWrapper = document.querySelector(".main-wrapper");

/* ==========================================================
    Utility Functions
========================================================== */

function closeAllDropdowns() {
    document.getElementById("notificationDropdown")?.classList.remove("show");
    document.getElementById("profileDropdown")?.classList.remove("show");
    document.getElementById("profileToggle")?.classList.remove("active");
}

/* ==========================================================
    Sidebar Toggle
========================================================== */

if (menuToggle && sidebar && mainWrapper) {
    menuToggle.addEventListener("click", () => {
        sidebar.classList.toggle("collapsed");
        mainWrapper.classList.toggle("expanded");
    });
}

/* Notification & profile dropdowns are handled by layout.js */

document.addEventListener("click", closeAllDropdowns);
