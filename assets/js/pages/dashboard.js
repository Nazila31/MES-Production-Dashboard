/* ==========================================================
    DASHBOARD PAGE
========================================================== */

let dashboardChartInstance = null;

document.addEventListener("DOMContentLoaded", async () => {
    await loadDashboard();
});

async function loadDashboard() {
    try {
        const response = await fetchDashboard();
        const { stats, activities, deadlines } = response.data;

        setText("totalQuotations", stats.total_quotations);
        setText("approvedQuotations", stats.approved_quotations);
        setText("totalSalesOrder", stats.total_sales_orders);
        setText("waitingPPIC", stats.waiting_ppic);
        setText("inProduction", stats.in_production);
        setText("fabricationCount", stats.fabrication);
        setText("machiningCount", stats.machining);
        setText("assemblyCount", stats.assembly);
        setText("qcCount", stats.qc);
        setText("completedOrders", stats.completed);

        renderActivities(activities);
        renderDeadlines(deadlines);
        renderDashboardChart(stats.production_trend);
    } catch (error) {
        console.error("Failed to load dashboard:", error);
    }
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = value;
    }
}

function renderActivities(activities) {
    const container = document.querySelector(".activity-list");

    if (!container) {
        return;
    }

    if (!activities || activities.length === 0) {
        return;
    }

    container.innerHTML = activities.map((item) => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="bi bi-clock-history"></i>
            </div>
            <div class="activity-content">
                <p class="mb-1">${item.message}</p>
                <small class="text-muted">${formatDate(item.time)}</small>
            </div>
        </div>
    `).join("");
}

function renderDeadlines(deadlines) {
    const container = document.getElementById("deadlineList");

    if (!container) {
        return;
    }

    if (!deadlines || deadlines.length === 0) {
        return;
    }

    container.className = "deadline-list";
    container.innerHTML = deadlines.map((item) => `
        <div class="deadline-item">
            <div>
                <strong>${item.so_number}</strong>
                <p class="mb-0 text-muted">${item.client}</p>
            </div>
            <div class="text-end">
                <span class="badge-kustom ${getStatusStyles(item.status).badge}">${formatStatusLabel(item.status)}</span>
                <small class="d-block text-muted mt-1">${formatDate(item.deadline)}</small>
            </div>
        </div>
    `).join("");
}

function renderDashboardChart(data) {
    const canvas = document.getElementById("dashboardChart");

    if (!canvas || !hasChartData(data)) {
        return;
    }

    if (dashboardChartInstance) {
        dashboardChartInstance.destroy();
    }

    dashboardChartInstance = new Chart(canvas, {
        type: "line",
        data: {
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [createLineDataset("Production", data, 0.4)]
        },
        options: createLineChartOptions()
    });
}
