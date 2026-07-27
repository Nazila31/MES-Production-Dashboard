/* ==========================================================
    PROJECTS PAGE
========================================================== */

/* ==========================================================
    Constants
========================================================== */

const STATUS_STYLES = {
    Waiting: { progress: "progress-waiting", badge: "status-waiting" },
    PPIC: { progress: "progress-ppic", badge: "status-ppic" },
    Machining: { progress: "progress-machining", badge: "status-machining" },
    Assembly: { progress: "progress-assembly", badge: "status-assembly" },
    QC: { progress: "progress-qc", badge: "status-qc" },
    Completed: { progress: "progress-completed", badge: "status-completed" },
    Delayed: { progress: "progress-delayed", badge: "status-delayed" },
    "In Production": { progress: "progress-production", badge: "status-production" }
};

const DEFAULT_STATUS_STYLE = {
    progress: "progress-production",
    badge: "status-production"
};

/* ==========================================================
    State
========================================================== */

let selectedProject = "";
let projectData = [];

/* ==========================================================
    Initialization
========================================================== */

document.addEventListener("DOMContentLoaded", () => {
    const deleteModal = document.getElementById("deleteModal");
    const successDelete = document.getElementById("successDelete");

    if (deleteModal) {
        deleteModal.classList.remove("show");
    }

    if (successDelete) {
        successDelete.classList.remove("show");
    }

    const savedData = localStorage.getItem("projects");

    if (savedData) {
        projectData = JSON.parse(savedData);
    }

    renderProjects();
    updateSummary();
});

/* ==========================================================
    Event Listeners
========================================================== */

const searchInput = document.getElementById("searchProject");
const statusFilter = document.getElementById("statusFilter");
const departmentFilter = document.getElementById("departmentFilter");
const importBtn = document.getElementById("importBtn");
const excelFile = document.getElementById("excelFile");

if (searchInput) {
    searchInput.addEventListener("keyup", filterProjects);
}

if (statusFilter) {
    statusFilter.addEventListener("change", filterProjects);
}

if (departmentFilter) {
    departmentFilter.addEventListener("change", filterProjects);
}

if (importBtn && excelFile) {
    importBtn.addEventListener("click", () => {
        excelFile.click();
    });

    excelFile.addEventListener("change", handleExcelImport);
}

/* ==========================================================
    Utility Functions
========================================================== */

function getStatusStyles(status) {
    return STATUS_STYLES[status] || DEFAULT_STATUS_STYLE;
}

function updateTableInfo(total) {
    const tableInfo = document.querySelector(".table-info");

    if (tableInfo) {
        tableInfo.innerHTML = `Showing ${total} of ${total} Projects`;
    }
}

/* ==========================================================
    Delete Modal
========================================================== */

function openDeleteModal(projectID) {
    selectedProject = projectID;
    document.getElementById("deleteProjectID").innerHTML = projectID;
    document.getElementById("deleteModal").classList.add("show");
}

function closeDeleteModal() {
    document.getElementById("deleteModal").classList.remove("show");
}

function deleteProject() {
    projectData = projectData.filter((project) => {
        return project["SO Number"] !== selectedProject;
    });

    localStorage.setItem("projects", JSON.stringify(projectData));
    renderProjects();
    updateSummary();
    closeDeleteModal();
    document.getElementById("successDelete").classList.add("show");
}

function finishDelete() {
    window.location.href = "projects.html";
}

/* ==========================================================
    Filter
========================================================== */

function resetFilter() {
    if (searchInput) {
        searchInput.value = "";
    }

    if (statusFilter) {
        statusFilter.value = "all";
    }

    if (departmentFilter) {
        departmentFilter.value = "all";
    }

    filterProjects();
}

function filterProjects() {
    const keyword = searchInput ? searchInput.value.toLowerCase() : "";
    const status = statusFilter ? statusFilter.value : "all";
    const department = departmentFilter ? departmentFilter.value : "all";

    const filteredData = projectData.filter((project) => {
        const text = JSON.stringify(project).toLowerCase();
        const matchSearch = text.includes(keyword);
        const matchStatus = status === "all" || project.Status === status;
        const matchDepartment = department === "all" || project.Department === department;

        return matchSearch && matchStatus && matchDepartment;
    });

    renderProjects(filteredData);
}

/* ==========================================================
    Import Excel
========================================================== */

function handleExcelImport(event) {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    const reader = new FileReader();

    reader.onload = function (loadEvent) {
        const workbook = XLSX.read(loadEvent.target.result, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        localStorage.setItem("projects", JSON.stringify(data));
        alert("Import berhasil!");
        location.reload();
    };

    reader.readAsBinaryString(file);
}

/* ==========================================================
    Render Project Table
========================================================== */

function renderProjects(data = projectData) {
    const tbody = document.getElementById("projectTableBody");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = "";

    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-5">
                    <i class="bi bi-folder-x display-5 text-secondary"></i>
                    <h5 class="mt-3">No Projects Found</h5>
                    <p class="text-muted mb-0">
                        Import an Excel file to display project data.
                    </p>
                </td>
            </tr>
        `;
        updateTableInfo(0);
        return;
    }

    data.forEach((project) => {
        const progress = Number(project.Progress) || 0;
        const status = project.Status || "";
        const department = project.Department || "";
        const styles = getStatusStyles(status);

        tbody.innerHTML += `
            <tr data-status="${status}" data-department="${department}">
                <td>${project["SO Number"] || "-"}</td>
                <td>${project.Client || "-"}</td>
                <td>${project.Machine || "-"}</td>
                <td width="180">
                    <div class="progress">
                        <div class="progress-bar ${styles.progress}" style="width:${progress}%">
                            ${progress}%
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge-kustom ${styles.badge}">${status}</span>
                </td>
                <td>${project.Deadline || "-"}</td>
                <td>
                    <div class="action-buttons">
                        <a href="detail-project.html" class="btn btn-action-kustom" title="View">
                            <i class="bi bi-eye"></i>
                        </a>
                        <a href="edit-project.html" class="btn btn-action-kustom" title="Edit">
                            <i class="bi bi-pencil"></i>
                        </a>
                        <button
                            class="btn btn-action-kustom"
                            title="Delete"
                            onclick="openDeleteModal('${project["SO Number"]}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    updateTableInfo(data.length);
}

/* ==========================================================
    Summary Cards
========================================================== */

function updateSummary() {
    const totalEl = document.getElementById("totalProjects");
    const waitingEl = document.getElementById("waitingProjects");
    const productionEl = document.getElementById("productionProjects");
    const completedEl = document.getElementById("completedProjects");

    if (totalEl) {
        totalEl.innerHTML = projectData.length;
    }

    if (waitingEl) {
        waitingEl.innerHTML = projectData.filter((p) => p.Status === "Waiting").length;
    }

    if (productionEl) {
        productionEl.innerHTML = projectData.filter((p) => p.Status === "In Production").length;
    }

    if (completedEl) {
        completedEl.innerHTML = projectData.filter((p) => p.Status === "Completed").length;
    }
}
