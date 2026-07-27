/* ==========================================================
    REPORTS API
========================================================== */

async function fetchReports(params = {}) {
    return apiOrMock("/reports", async () => {
        const orders = MockData.salesOrders;

        const data = {
            total_orders: orders.length,
            completed: orders.filter((so) => so.status === "completed").length,
            delayed: 0,
            efficiency: orders.length ? Math.round((orders.filter((so) => so.status === "completed").length / orders.length) * 100) : 0,
            monthly_production: MockData.reports.monthly_production,
            department_distribution: [
                orders.filter((so) => so.production_stage === "fabrication").length,
                orders.filter((so) => so.production_stage === "machining").length,
                orders.filter((so) => so.production_stage === "assembly").length,
                orders.filter((so) => so.production_stage === "qc").length
            ],
            status_distribution: [
                orders.filter((so) => so.status === "completed").length,
                orders.filter((so) => so.status === "in_production").length,
                orders.filter((so) => so.status === "waiting_ppic").length
            ],
            summary: MockData.reports.summary
        };

        return { data };
    });
}

async function exportReportCSV() {
    const response = await fetchReports();
    const summary = response.data.summary || [];
    const headers = ["Month", "Sales Order", "Completed", "Delayed", "Efficiency"];
    const rows = summary.map((row) => [
        row.month,
        row.sales_order,
        row.completed,
        row.delayed,
        row.efficiency
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    return csv;
}
