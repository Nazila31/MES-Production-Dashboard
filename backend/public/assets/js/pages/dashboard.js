/* ==========================================================
    DASHBOARD PAGE (All Roles)
========================================================== */

let dashboardChartInstance = null;

document.addEventListener("DOMContentLoaded", async () => {
    await loadDashboard();
});

async function loadDashboard() {
    try {
        const response = await fetchDashboard();
        const data = response.data;
        const role = data.stats?.role || getAuthUser()?.role || "admin";

        applyDashboardVisibility(role);
        populateDashboardStats(role, data.stats || {});
        renderActivities(data.activities);
        renderSidePanel(role, data);
        updateChartSection(role, data);
        renderDashboardChart(data.stats?.production_trend, data.stats?.chart_label);
    } catch (error) {
        console.error("Failed to load dashboard:", error);
    }
}

function applyDashboardVisibility(role) {
    document.querySelectorAll("[data-dashboard-role]").forEach((section) => {
        const roles = (section.dataset.dashboardRole || "").split(",").map((item) => item.trim());
        section.classList.toggle("d-none", !roles.includes(role));
    });

    const subtitles = {
        admin: "Production Monitoring Overview",
        marketing: "Quotation summary and recent activity",
        ppic: "Production planning summary",
        production: "Shop floor and delivery overview",
    };

    const subtitle = document.querySelector(".page-subtitle");
    if (subtitle) {
        subtitle.textContent = subtitles[role] || subtitles.admin;
    }
}

function populateDashboardStats(role, stats) {
    const mappings = {
        admin: [
            ["totalQuotations", stats.total_quotations],
            ["approvedQuotations", stats.approved_quotations],
            ["totalSalesOrder", stats.total_sales_orders],
            ["waitingPPIC", stats.waiting_ppic],
            ["inProduction", stats.in_production],
            ["fabricationCount", stats.fabrication],
            ["machiningCount", stats.machining],
            ["assemblyCount", stats.assembly],
            ["qcCount", stats.qc],
            ["completedOrders", stats.completed],
        ],
        marketing: [
            ["mktTotalQuotations", stats.total_quotations],
            ["mktDraft", stats.draft],
            ["mktApproved", stats.approved],
            ["mktRejected", stats.rejected],
            ["mktPending", stats.pending_approval],
        ],
        ppic: [
            ["ppicWaiting", stats.waiting_ppic],
            ["ppicProcessing", stats.ppic_processing],
            ["ppicInProduction", stats.in_production],
            ["ppicReadyDelivery", stats.ready_for_delivery],
            ["ppicCompleted", stats.completed],
        ],
        production: [
            ["prodInProduction", stats.in_production],
            ["prodFabrication", stats.fabrication],
            ["prodMachining", stats.machining],
            ["prodAssembly", stats.assembly],
            ["prodQc", stats.qc],
            ["prodReadyDelivery", stats.ready_for_delivery],
            ["prodCompleted", stats.completed],
        ],
    };

    (mappings[role] || mappings.admin).forEach(([id, value]) => setText(id, value ?? 0));
}

function updateChartSection(role, data) {
    const title = document.getElementById("dashboardChartTitle");
    const subtitle = document.getElementById("dashboardChartSubtitle");
    const sideTitle = document.getElementById("sidePanelTitle");
    const sideSubtitle = document.getElementById("sidePanelSubtitle");

    const chartTitles = {
        admin: ["Production Progress", "Daily production starts (last 7 days)"],
        marketing: ["Quotation Activity", "New quotations created (last 7 days)"],
        ppic: ["Planning Activity", "Orders in PPIC workflow (last 7 days)"],
        production: ["Production Progress", "Daily production starts (last 7 days)"],
    };

    const [chartTitle, chartSub] = chartTitles[role] || chartTitles.admin;
    if (title) title.textContent = chartTitle;
    if (subtitle) subtitle.textContent = chartSub;
    if (sideTitle) sideTitle.textContent = data.side_panel_title || "Updates";
    if (sideSubtitle) sideSubtitle.textContent = data.side_panel_subtitle || "";
}

function renderSidePanel(role, data) {
    if (role === "marketing") {
        renderFollowUps(data.deadlines || []);
        return;
    }

    if (role === "ppic") {
        renderPlanningQueue(data.planning_queue || []);
        return;
    }

    if (role === "production") {
        renderDeliveryTasks(data.delivery_tasks || []);
        return;
    }

    renderDeadlines(data.deadlines || []);
}

function renderFollowUps(items) {
    const container = document.getElementById("deadlineList");
    if (!container) return;

    if (!items?.length) {
        container.className = "deadline-list text-center py-5";
        container.innerHTML = `<i class="bi bi-chat-dots fs-1 text-secondary"></i><h6 class="mt-3">No Follow Ups Yet</h6><p class="text-muted mb-0">Follow up activity will appear here.</p>`;
        return;
    }

    container.className = "deadline-list";
    container.innerHTML = items.map((item) => `
        <div class="deadline-item">
            <div><strong>${item.so_number}</strong><p class="mb-0 text-muted">${item.client}</p></div>
            <div class="text-end">
                <span class="badge-kustom badge-info">${item.status_label || formatFollowUpStatus(item.status)}</span>
                <small class="d-block text-muted mt-1">${formatDate(item.deadline)}</small>
            </div>
        </div>`).join("");
}

function renderMarketingQuotations(items) {
    const container = document.getElementById("deadlineList");
    if (!container) return;

    if (!items?.length) {
        container.className = "deadline-list text-center py-5";
        container.innerHTML = `<i class="bi bi-file-earmark-text fs-1 text-secondary"></i><h6 class="mt-3">No Recent Quotations</h6><p class="text-muted mb-0">Quotations will appear here once created.</p>`;
        return;
    }

    container.className = "deadline-list";
    container.innerHTML = items.map((item) => `
        <div class="deadline-item">
            <div><strong>${item.quotation_number || item.so_number}</strong><p class="mb-0 text-muted">${item.client}</p></div>
            <div class="text-end">
                <span class="badge-kustom ${getStatusStyles(item.status).badge}">${formatStatusLabel(item.status)}</span>
                <small class="d-block text-muted mt-1">${item.amount != null ? formatCurrency(item.amount) : formatDate(item.deadline)}</small>
            </div>
        </div>`).join("");
}

function renderPlanningQueue(items) {
    const container = document.getElementById("deadlineList");
    if (!container) return;

    if (!items?.length) {
        container.className = "deadline-list text-center py-5";
        container.innerHTML = `<i class="bi bi-kanban fs-1 text-secondary"></i><h6 class="mt-3">No Planning Queue</h6><p class="text-muted mb-0">Orders waiting for PPIC will appear here.</p>`;
        return;
    }

    container.className = "deadline-list";
    container.innerHTML = items.map((item) => `
        <div class="deadline-item">
            <div><strong>${item.so_number}</strong><p class="mb-0 text-muted">${item.client}</p></div>
            <div class="text-end">
                <span class="badge-kustom ${getStatusStyles(item.status).badge}">${formatStatusLabel(item.status)}</span>
                <small class="d-block text-muted mt-1">Material: ${renderDeadlineCell(item.material_deadline, item.material_deadline_status)}</small>
                <small class="d-block text-muted">Produksi: ${renderDeadlineCell(item.production_deadline, item.production_deadline_status)}</small>
            </div>
        </div>`).join("");
}

function renderDeliveryTasks(items) {
    const container = document.getElementById("deadlineList");
    if (!container) return;

    if (!items?.length) {
        container.className = "deadline-list text-center py-5";
        container.innerHTML = `<i class="bi bi-truck fs-1 text-secondary"></i><h6 class="mt-3">No Delivery Tasks</h6><p class="text-muted mb-0">Orders ready for delivery will appear here.</p>`;
        return;
    }

    container.className = "deadline-list";
    container.innerHTML = items.map((item) => `
        <div class="deadline-item">
            <div><strong>${item.so_number}</strong><p class="mb-0 text-muted">${item.delivery_recipient || item.client}</p></div>
            <div class="text-end">
                <small class="text-muted d-block">${item.delivery_number || "-"}</small>
                <small class="d-block text-muted mt-1">${formatDate(item.deadline)}</small>
            </div>
        </div>`).join("");
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function renderActivities(activities) {
    const container = document.querySelector(".activity-list");
    if (!container) return;

    if (!activities?.length) {
        container.innerHTML = `<div class="activity-empty text-center py-5"><i class="bi bi-clock-history fs-1 text-secondary"></i><h6 class="mt-3">No Recent Activity</h6><p class="text-muted mb-0">Activities will appear as the workflow progresses.</p></div>`;
        return;
    }

    container.innerHTML = activities.map((item) => `
        <div class="activity-item"><div class="activity-icon"><i class="bi bi-clock-history"></i></div>
        <div class="activity-content"><p class="mb-1">${item.message}</p><small class="text-muted">${formatDate(item.time)}</small></div></div>`).join("");
}

function renderDeadlines(deadlines) {
    const container = document.getElementById("deadlineList");
    if (!container) return;

    if (!deadlines?.length) {
        container.className = "deadline-list text-center py-5";
        container.innerHTML = `<i class="bi bi-calendar-event fs-1 text-secondary"></i><h6 class="mt-3">No Upcoming Deadlines</h6><p class="text-muted mb-0">Deadlines will appear from active sales orders.</p>`;
        return;
    }

    container.className = "deadline-list";
    container.innerHTML = deadlines.map((item) => `
        <div class="deadline-item"><div><strong>${item.so_number}</strong><p class="mb-0 text-muted">${item.client}</p></div>
        <div class="text-end">
            <span class="badge-kustom ${getStatusStyles(item.status).badge}">${formatStatusLabel(item.status)}</span>
            <small class="d-block text-muted mt-1">Material: ${renderDeadlineCell(item.material_deadline, item.material_deadline_status)}</small>
            <small class="d-block text-muted">Produksi: ${renderDeadlineCell(item.production_deadline, item.production_deadline_status)}</small>
        </div></div>`).join("");
}

function renderDashboardChart(data, label = "Production") {
    const canvas = document.getElementById("dashboardChart");
    if (!canvas || !hasChartData(data)) return;

    if (dashboardChartInstance) dashboardChartInstance.destroy();

    dashboardChartInstance = new Chart(canvas, {
        type: "line",
        data: {
            labels: getLastSevenDayLabels(),
            datasets: [createLineDataset(label, data, 0.4)],
        },
        options: createLineChartOptions(),
    });
}

function getLastSevenDayLabels() {
    const labels = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        labels.push(date.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit" }));
    }

    return labels;
}
