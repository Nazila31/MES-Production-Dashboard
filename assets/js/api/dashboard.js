/* ==========================================================
    DASHBOARD API
========================================================== */

async function fetchDashboard() {
    return apiOrMock("/dashboard", async () => {
        const orders = MockData.salesOrders;

        const stats = {
            total_quotations: MockData.quotations.length,
            approved_quotations: MockData.quotations.filter((q) => q.status === "approved").length,
            total_sales_orders: orders.length,
            waiting_ppic: orders.filter((so) => so.status === "waiting_ppic").length,
            in_production: orders.filter((so) => so.status === "in_production").length,
            fabrication: orders.filter((so) => so.production_stage === "fabrication").length,
            machining: orders.filter((so) => so.production_stage === "machining").length,
            assembly: orders.filter((so) => so.production_stage === "assembly").length,
            qc: orders.filter((so) => so.production_stage === "qc").length,
            completed: orders.filter((so) => so.status === "completed").length,
            delayed: 0,
            production_trend: MockData.dashboard.production_trend,
            department_distribution: [
                orders.filter((so) => so.production_stage === "fabrication").length,
                orders.filter((so) => so.production_stage === "machining").length,
                orders.filter((so) => so.production_stage === "assembly").length,
                orders.filter((so) => so.production_stage === "qc").length
            ],
            production_progress: [
                orders.filter((so) => so.status === "waiting_ppic").length,
                orders.filter((so) => so.production_stage === "fabrication").length,
                orders.filter((so) => so.production_stage === "machining").length,
                orders.filter((so) => so.production_stage === "assembly").length,
                orders.filter((so) => so.production_stage === "qc").length
            ]
        };

        const deadlines = orders
            .filter((so) => so.status !== "completed")
            .map((so) => ({
                so_number: so.so_number,
                client: so.client,
                deadline: so.deadline,
                status: so.status
            }))
            .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

        return {
            data: {
                stats,
                activities: cloneMock(MockData.activities),
                deadlines,
                notifications: cloneMock(MockData.notifications.slice(0, 5))
            }
        };
    });
}

async function fetchProjects() {
    return fetchSalesOrders();
}
