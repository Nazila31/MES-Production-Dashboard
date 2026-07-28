/* ==========================================================
    REPORTS API
========================================================== */

async function fetchReports(params = {}) {
    return apiRequest(`/reports${buildQuery(params)}`);
}

async function exportReportCSV(params = {}) {
    const token = getAuthToken();
    const url = `${MESConfig.apiBaseUrl}/reports/export/csv${buildQuery(params)}`;
    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: "text/csv" }
    });

    if (!response.ok) {
        throw new Error("Failed to export CSV");
    }

    return response.text();
}

async function exportReportPDF(params = {}) {
    const token = getAuthToken();
    const url = `${MESConfig.apiBaseUrl}/reports/export/pdf${buildQuery(params)}`;
    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/pdf" }
    });

    if (!response.ok) {
        throw new Error("Failed to export PDF");
    }

    return response.blob();
}
