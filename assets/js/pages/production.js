/* ==========================================================
    PRODUCTION OPERATOR DASHBOARD
========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
    await loadOperatorDashboard();
});

async function loadOperatorDashboard() {
    try {
        const response = await fetchOperatorDashboard();
        const { current_project: project } = response.data;

        if (!project) {
            renderEmptyState();
            return;
        }

        renderCurrentProject(project);
    } catch (error) {
        console.error(error);
    }
}

function renderEmptyState() {
    const container = document.getElementById("operatorPanel");
    if (container) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-gear-wide-connected display-1 text-secondary"></i>
                <h4 class="mt-3">No Active Production</h4>
                <p class="text-muted">Waiting for PPIC to release a work order.</p>
            </div>`;
    }
}

function renderCurrentProject(project) {
    const stage = project.production_stage;
    const stageConfig = MESConfig.productionStages.find((s) => s.key === stage);
    const styles = getStatusStyles(stage);

    setText("soNumber", project.so_number);
    setText("client", project.client);
    setText("machine", project.machine);
    setText("currentStage", stageConfig?.label || capitalize(stage));
    setText("deadline", formatDate(project.deadline));

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
    renderActionButton(project);
}

function renderStageSteps(currentStage) {
    const container = document.getElementById("stageSteps");
    if (!container) return;

    const currentIndex = MESConfig.productionStages.findIndex((s) => s.key === currentStage);

    container.innerHTML = MESConfig.productionStages.map((stage, index) => {
        let className = "stage-step";
        if (index < currentIndex) className += " completed";
        else if (index === currentIndex) className += " active";

        return `<div class="${className}">
            <div class="stage-number">${index + 1}</div>
            <span>${stage.label}</span>
        </div>`;
    }).join("");
}

function renderActionButton(project) {
    const btn = document.getElementById("stageActionBtn");
    if (!btn) return;

    const stageConfig = MESConfig.productionStages.find((s) => s.key === project.production_stage);

    if (!stageConfig) {
        btn.style.display = "none";
        return;
    }

    btn.style.display = "inline-flex";
    btn.innerHTML = `<i class="bi bi-check-circle"></i> ${stageConfig.button}`;
    btn.onclick = () => executeStageAction(project.id, project.production_stage);
}

async function executeStageAction(soId, stage) {
    const actions = {
        fabrication: completeFabrication,
        machining: completeMachining,
        assembly: completeAssembly,
        qc: passQC
    };

    const action = actions[stage];
    if (!action) return;

    try {
        const btn = document.getElementById("stageActionBtn");
        if (btn) btn.disabled = true;

        await action(soId);
        document.getElementById("successModal")?.classList.add("show");
    } catch (error) {
        alert(error.message);
        const btn = document.getElementById("stageActionBtn");
        if (btn) btn.disabled = false;
    }
}

function finishStage() {
    location.reload();
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value || "-";
}
