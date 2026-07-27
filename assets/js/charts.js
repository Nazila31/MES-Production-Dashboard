/* ==========================================================
    CHARTS - Dashboard & Reports
========================================================== */

/* ==========================================================
    Constants
========================================================== */

const CHART_COLORS = {
    primary: "#2563EB",
    primaryFill: "rgba(37,99,235,.12)",
    grid: "#EEF2F7",
    success: "#16A34A",
    warning: "#F59E0B",
    danger: "#DC2626"
};

/* ==========================================================
    Utility Functions
========================================================== */

function hasChartData(data) {
    return Array.isArray(data) && data.some((value) => value > 0);
}

function createLineChartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: CHART_COLORS.grid
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        }
    };
}

function createLineDataset(label, data, tension) {
    return {
        label: label,
        data: data,
        borderColor: CHART_COLORS.primary,
        backgroundColor: CHART_COLORS.primaryFill,
        fill: true,
        tension: tension,
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6
    };
}

function initLineChart(canvas, labels, data, label, tension) {
    if (!canvas || !hasChartData(data)) {
        return;
    }

    new Chart(canvas, {
        type: "line",
        data: {
            labels: labels,
            datasets: [createLineDataset(label, data, tension)]
        },
        options: createLineChartOptions()
    });
}

/* ==========================================================
    Initialization
========================================================== */

document.addEventListener("DOMContentLoaded", () => {
    initLineChart(
        document.getElementById("dashboardChart"),
        ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        [0, 0, 0, 0, 0, 0, 0],
        "Production",
        0.4
    );

    initLineChart(
        document.getElementById("productionChart"),
        ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        [0, 0, 0, 0, 0, 0],
        "Sales Order",
        0.35
    );

    const departmentChart = document.getElementById("departmentChart");
    const departmentData = [0, 0, 0, 0];

    if (departmentChart && hasChartData(departmentData)) {
        new Chart(departmentChart, {
            type: "doughnut",
            data: {
                labels: ["PPIC", "Machining", "Assembly", "QC"],
                datasets: [{
                    data: departmentData,
                    backgroundColor: [
                        CHART_COLORS.primary,
                        CHART_COLORS.success,
                        CHART_COLORS.warning,
                        CHART_COLORS.danger
                    ],
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
                        labels: {
                            boxWidth: 12,
                            boxHeight: 12,
                            padding: 12,
                            font: {
                                size: 11
                            }
                        }
                    }
                }
            }
        });
    }

    const statusChart = document.getElementById("statusChart");
    const statusData = [0, 0, 0];

    if (statusChart && hasChartData(statusData)) {
        new Chart(statusChart, {
            type: "bar",
            data: {
                labels: ["Completed", "Production", "Delayed"],
                datasets: [{
                    label: "Orders",
                    data: statusData,
                    backgroundColor: [
                        CHART_COLORS.success,
                        CHART_COLORS.primary,
                        CHART_COLORS.danger
                    ],
                    borderRadius: 8
                }]
            },
            options: createLineChartOptions()
        });
    }
});
