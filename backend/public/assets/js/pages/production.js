/* ==========================================================
    PRODUCTION OPERATOR DASHBOARD
========================================================== */

let currentProject = null;

document.addEventListener("DOMContentLoaded", async () => {
    await loadOperatorDashboard();
    document.getElementById("startStageBtn")?.addEventListener("click", handleStartStage);
    document.getElementById("passQcBtn")?.addEventListener("click", () => executeStageAction("pass"));
    document.getElementById("rejectQcBtn")?.addEventListener("click", openRejectModal);
});

async function loadOperatorDashboard() {
    try {
        const response = await fetchOperatorDashboard();
        currentProject = response.data.current_project;

        if (!currentProject) {
            renderEmptyState();
            return;
        }

        renderCurrentProject(currentProject);
    } catch (error) {
        console.error(error);
    }
}

function renderEmptyState() {
    const container = document.getElementById("operatorPanel");
    if (container) {
        container.innerHTML = `<div class="text-center py-5"><i class="bi bi-gear-wide-connected display-1 text-secondary"></i><h4 class="mt-3">No Active Production</h4><p class="text-muted">Waiting for PPIC to release a work order.</p></div>`;
    }
}

function renderCurrentProject(project) {
    const stage = project.production_stage;
    const stageConfig = MESConfig.productionStages.find((s) => s.key === stage);
    const styles = getStatusStyles(stage);
    const stageLog = (project.stage_logs || []).find((log) => log.stage === stage);

    setText("soNumber", project.so_number);
    setText("client", project.client);
    setText("machine", project.machine);
    setText("currentStage", stageConfig?.label || capitalize(stage));
    setDeadlineField("materialDeadline", project.material_deadline, project.material_deadline_status);
    setDeadlineField("productionDeadline", project.production_deadline || project.deadline, project.production_deadline_status);

    const badge = document.getElementById("stageBadge");
    if (badge) {
        badge.className = `badge-kustom ${styles.badge}`;
        badge.textContent = stageConfig?.label || capitalize(stage);
    }

    const progressBar = document.getElementById("progressBar");
    if (progressBar) {
        progressBar.style.width = `${project.progress || 0}%`;
        progressBar.textContent = `${project.progress || 0}%`;
    }

    renderStageSteps(stage);
    renderActionButtons(project, stageLog);
}

function renderStageSteps(currentStage) {
    const container = document.getElementById("stageSteps");
    if (!container) return;

    const currentIndex = MESConfig.productionStages.findIndex((s) => s.key === currentStage);
    container.innerHTML = MESConfig.productionStages.map((stage, index) => {
        let className = "stage-step";
        if (index < currentIndex) className += " completed";
        else if (index === currentIndex) className += " active";
        return `<div class="${className}"><div class="stage-number">${index + 1}</div><span>${stage.label}</span></div>`;
    }).join("");
}

function renderActionButtons(project, stageLog) {
    const startBtn = document.getElementById("startStageBtn");
    const finishBtn = document.getElementById("stageActionBtn");
    const passBtn = document.getElementById("passQcBtn");
    const rejectBtn = document.getElementById("rejectQcBtn");
    const stage = project.production_stage;
    const isQc = stage === "qc";
    const inProgress = stageLog?.status === "in_progress";

    if (startBtn) startBtn.style.display = inProgress ? "none" : "inline-flex";
    if (finishBtn) {
        finishBtn.style.display = isQc ? "none" : (inProgress ? "inline-flex" : "none");
        finishBtn.innerHTML = `<i class="bi bi-check-circle"></i> Finish ${capitalize(stage)}`;
        finishBtn.onclick = () => executeStageAction("finish");
    }
    if (passBtn) passBtn.style.display = isQc && inProgress ? "inline-flex" : "none";
    if (rejectBtn) rejectBtn.style.display = isQc && inProgress ? "inline-flex" : "none";
}

async function handleStartStage() {
    if (!currentProject) return;
    try {
        await startStage(currentProject.id, currentProject.production_stage);
        document.getElementById("successModal")?.classList.add("show");
    } catch (error) {
        alert(error.message);
    }
}

async function executeStageAction(action) {
    if (!currentProject) return;
    const stage = currentProject.production_stage;

    try {
        if (action === "finish") {
            await finishProductionStage(currentProject.id, stage);
        } else if (action === "pass") {
            await passQC(currentProject.id);
        }
        document.getElementById("successModal")?.classList.add("show");
    } catch (error) {
        alert(error.message);
    }
}

function openRejectModal() {
    document.getElementById("rejectModal")?.classList.add("show");
}

function closeRejectModal() {
    document.getElementById("rejectModal")?.classList.remove("show");
}

async function submitRejectQc() {
    const notes = document.getElementById("rejectNotes")?.value?.trim();
    const returnStage = document.getElementById("rejectReturnStage")?.value;
    if (!notes || !returnStage || !currentProject) {
        alert("Alasan reject dan proses tujuan wajib diisi.");
        return;
    }

    try {
        await rejectQC(currentProject.id, notes, returnStage);
        closeRejectModal();
        document.getElementById("rejectNotes").value = "";
        document.getElementById("rejectReturnStage").value = "";
        await loadOperatorDashboard();
        document.getElementById("successModal")?.classList.add("show");
    } catch (error) {
        alert(error.message);
    }
}

function reloadProductionPage() {
    location.reload();
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value || "-";
}

function setDeadlineField(id, date, status) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = renderDeadlineCell(date, status);
}
