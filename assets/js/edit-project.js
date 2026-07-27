/* ==========================================================
    EDIT PROJECT PAGE
========================================================== */

/* ==========================================================
    Feature Functions
========================================================== */

function updateProject(event) {
    event.preventDefault();

    document
        .getElementById("successModal")
        .classList.add("show");
}

function goProjects() {
    window.location.href = "projects.html";
}
