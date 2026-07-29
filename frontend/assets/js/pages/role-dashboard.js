/* ==========================================================
    ROLE DASHBOARD PAGE
========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
    await loadRoleDashboard();
});

async function loadRoleDashboard() {
    try {
        const response = await fetchDashboard();
        const data = response.data;
        const role = data.stats?.role || getAuthUser()?.role || "admin";

        if (role === "marketing") renderMarketingDashboard(data);
        else if (role === "ppic") renderPpicDashboard(data);
        else if (role === "production") renderProductionDashboard(data);
        else renderAdminDashboard(data);
    } catch (error) {
        console.error("Failed to load dashboard:", error);
    }
}

function renderAdminDashboard(data) {
    const stats = data.stats || {};
    setText("stat1", stats.total_quotations ?? 0);
    setText("stat2", stats.total_sales_orders ?? 0);
    setText("stat3", stats.in_production ?? 0);
    setText("stat4", stats.ready_for_delivery ?? 0);
    setText("stat5", stats.completed ?? 0);
    setText("stat6", stats.delayed ?? 0);
    renderList("dashboardList", data.deadlines, (item) => `
        <div class="deadline-item"><div><strong>${item.so_number}</strong><p class="mb-0 text-muted">${item.client}</p></div>
        <div class="text-end"><span class="badge-kustom ${getStatusStyles(item.status).badge}">${formatStatusLabel(item.status)}</span>
        <small class="d-block text-muted mt-1">${formatDate(item.deadline)}</small></div></div>`);
    renderActivities(data.activities);
}

function renderMarketingDashboard(data) {
    const stats = data.stats || {};
    setText("stat1", stats.total_quotations ?? 0);
    setText("stat2", stats.draft ?? 0);
    setText("stat3", stats.approved ?? 0);
    setText("stat4", stats.rejected ?? 0);
    setText("stat5", stats.pending_approval ?? 0);
    renderList("dashboardList", data.recent_quotations, (item) => `
        <div class="deadline-item"><div><strong>${item.quotation_number}</strong><p class="mb-0 text-muted">${item.client}</p></div>
        <div class="text-end"><span class="badge-kustom ${getStatusStyles(item.status).badge}">${formatStatusLabel(item.status)}</span>
        <small class="d-block text-muted mt-1">${formatCurrency(item.amount)}</small></div></div>`);
    renderActivities(data.activities);
}

function renderPpicDashboard(data) {
    const stats = data.stats || {};
    setText("stat1", stats.waiting_ppic ?? 0);
    setText("stat2", stats.ppic_processing ?? 0);
    setText("stat3", stats.in_production ?? 0);
    setText("stat4", stats.ready_for_delivery ?? 0);
    setText("stat5", stats.completed ?? 0);
    renderList("dashboardList", data.planning_queue, (item) => `
        <div class="deadline-item"><div><strong>${item.so_number}</strong><p class="mb-0 text-muted">${item.client}</p></div>
        <div class="text-end"><span class="badge-kustom ${getStatusStyles(item.status).badge}">${formatStatusLabel(item.status)}</span>
        <small class="d-block text-muted mt-1">${formatDate(item.deadline)}</small></div></div>`);
    renderActivities(data.activities);
}

function renderProductionDashboard(data) {
    const stats = data.stats || {};
    setText("stat1", stats.in_production ?? 0);
    setText("stat2", stats.fabrication ?? 0);
    setText("stat3", stats.qc ?? 0);
    setText("stat4", stats.ready_for_delivery ?? 0);
    setText("stat5", stats.completed ?? 0);
    renderList("dashboardList", data.delivery_tasks, (item) => `
        <div class="deadline-item"><div><strong>${item.so_number}</strong><p class="mb-0 text-muted">${item.delivery_recipient || item.client}</p></div>
        <div class="text-end"><small class="text-muted">${item.delivery_number || "-"}</small></div></div>`);
    renderActivities(data.activities);
}

function renderList(containerId, items, templateFn) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!items?.length) {
        container.innerHTML = `<div class="text-center py-4 text-muted">No data available.</div>`;
        return;
    }

    container.innerHTML = items.map(templateFn).join("");
}

function renderActivities(activities) {
    const container = document.getElementById("activityList");
    if (!container) return;

    if (!activities?.length) {
        container.innerHTML = `<div class="text-center py-4 text-muted">No recent activity.</div>`;
        return;
    }

    container.innerHTML = activities.map((item) => `
        <div class="activity-item"><div class="activity-icon"><i class="bi bi-clock-history"></i></div>
        <div class="activity-content"><p class="mb-1">${item.message}</p><small class="text-muted">${formatDate(item.time)}</small></div></div>`).join("");
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}
