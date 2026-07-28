/* ==========================================================
    DASHBOARD API
========================================================== */

async function fetchDashboard() {
    return apiRequest("/dashboard");
}

async function fetchProjects() {
    return fetchSalesOrders();
}
