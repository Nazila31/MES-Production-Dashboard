/* ==========================================================
    REPORTS PAGE
========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
    await loadReports();
    document.getElementById("exportCSV")?.addEventListener("click", handleExport);
});

async function loadReports() {
    try {
        const response = await fetchReports();
        const data = response.data;

        setText("reportTotalOrders", data.total_orders);
        setText("reportCompleted", data.completed);
        setText("reportDelayed", data.delayed);
        setText("reportEfficiency", `${data.efficiency}%`);

        renderReportTable(data.summary);
        renderReportCharts(data);
    } catch (error) {
        console.error(error);
    }
}

function renderReportTable(summary) {
    const tbody = document.getElementById("reportTableBody");
    if (!tbody || !summary?.length) return;

    tbody.innerHTML = summary.map((row) => `
        <tr>
            <td>${row.month}</td>
            <td>${row.sales_order}</td>
            <td>${row.completed}</td>
            <td>${row.delayed}</td>
            <td>${row.efficiency}</td>
        </tr>`).join("");
}

function renderReportCharts(data) {
    const hasProduction = hasChartData(data.monthly_production);
    toggleChartEmptyText("productionChartText", hasProduction);
    if (hasProduction) {
        initLineChart(document.getElementById("productionChart"), ["Jan", "Feb", "Mar", "Apr", "May", "Jun"], data.monthly_production, "Sales Order", 0.35);
    }

    const hasDept = hasChartData(data.department_distribution);
    toggleChartEmptyText("departmentChartText", hasDept);
    if (hasDept) {
        initDoughnutChart(document.getElementById("departmentChart"), ["Fabrication", "Machining", "Assembly", "QC"], data.department_distribution);
    }

    const hasStatus = hasChartData(data.status_distribution);
    toggleChartEmptyText("statusChartText", hasStatus);
    if (hasStatus) {
        initBarChart(document.getElementById("statusChart"), ["Completed", "In Production", "Waiting PPIC"], data.status_distribution);
    }
}

async function handleExport() {
    const csv = await exportReportCSV();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Production_Report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}
