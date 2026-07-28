/* ==========================================================
    APP.JS - Shared Application Logic
========================================================== */

/* ==========================================================
    Constants
========================================================== */

const notificationToggle = document.getElementById("notificationToggle");
const notificationDropdown = document.getElementById("notificationDropdown");
const profileToggle = document.getElementById("profileToggle");
const profileDropdown = document.getElementById("profileDropdown");
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.querySelector(".sidebar");
const mainWrapper = document.querySelector(".main-wrapper");

/* ==========================================================
    Utility Functions
========================================================== */

function closeAllDropdowns() {
    if (notificationDropdown) {
        notificationDropdown.classList.remove("show");
    }

    if (profileDropdown) {
        profileDropdown.classList.remove("show");
    }

    if (profileToggle) {
        profileToggle.classList.remove("active");
    }
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

/* ==========================================================
    Notification Dropdown
========================================================== */

if (notificationToggle && notificationDropdown) {
    notificationToggle.addEventListener("click", (event) => {
        event.stopPropagation();

        if (profileDropdown) {
            profileDropdown.classList.remove("show");
        }

        if (profileToggle) {
            profileToggle.classList.remove("active");
        }

        notificationDropdown.classList.toggle("show");
    });

    notificationDropdown.addEventListener("click", (event) => {
        event.stopPropagation();
    });
}

/* ==========================================================
    Profile Dropdown
========================================================== */

if (profileToggle && profileDropdown) {
    profileToggle.addEventListener("click", (event) => {
        event.stopPropagation();

        if (notificationDropdown) {
            notificationDropdown.classList.remove("show");
        }

        profileDropdown.classList.toggle("show");
        profileToggle.classList.toggle("active");
    });

    profileDropdown.addEventListener("click", (event) => {
        event.stopPropagation();
    });
}

/* ==========================================================
    Close Dropdowns on Outside Click
========================================================== */

document.addEventListener("click", closeAllDropdowns);
