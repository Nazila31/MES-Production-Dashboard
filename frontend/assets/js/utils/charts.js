/* ==========================================================
    CHARTS - Shared Chart Utilities
========================================================== */

const CHART_COLORS = {
    primary: "#2563EB",
    primaryFill: "rgba(37,99,235,.12)",
    grid: "#EEF2F7",
    success: "#16A34A",
    warning: "#F59E0B",
    danger: "#DC2626"
};

function hasChartData(data) {
    return Array.isArray(data) && data.some((value) => value > 0);
}

function createLineChartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: { beginAtZero: true, grid: { color: CHART_COLORS.grid } },
            x: { grid: { display: false } }
        }
    };
}

function createLineDataset(label, data, tension) {
    return {
        label,
        data,
        borderColor: CHART_COLORS.primary,
        backgroundColor: CHART_COLORS.primaryFill,
        fill: true,
        tension,
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6
    };
}

function initDoughnutChart(canvas, labels, data) {
    if (!canvas || !hasChartData(data)) {
        return null;
    }

    return new Chart(canvas, {
        type: "doughnut",
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: [CHART_COLORS.primary, CHART_COLORS.success, CHART_COLORS.warning, CHART_COLORS.danger],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "70%",
            plugins: {
                legend: {
                    position: "bottom",
                    labels: { boxWidth: 12, boxHeight: 12, padding: 12, font: { size: 11 } }
                }
            }
        }
    });
}

function initBarChart(canvas, labels, data) {
    if (!canvas || !hasChartData(data)) {
        return null;
    }

    return new Chart(canvas, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Orders",
                data,
                backgroundColor: [CHART_COLORS.success, CHART_COLORS.primary, CHART_COLORS.danger],
                borderRadius: 8
            }]
        },
        options: createLineChartOptions()
    });
}

function initLineChart(canvas, labels, data, label, tension) {
    if (!canvas || !hasChartData(data)) {
        return null;
    }

    return new Chart(canvas, {
        type: "line",
        data: {
            labels,
            datasets: [createLineDataset(label, data, tension)]
        },
        options: createLineChartOptions()
    });
}

function toggleChartEmptyText(textId, hasData) {
    const textEl = document.getElementById(textId);
    if (textEl) {
        textEl.style.display = hasData ? "none" : "block";
    }
}
