/* ==========================================================
    QUOTATIONS API
========================================================== */

async function fetchQuotations(params = {}) {
    return apiRequest(`/quotations${buildQuery(params)}`);
}

async function fetchQuotation(id) {
    return apiRequest(`/quotations/${id}`);
}

async function createQuotation(payload) {
    const body = payload instanceof FormData ? payload : payload;
    return apiRequest("/quotations", { method: "POST", body });
}

async function updateQuotation(id, payload) {
    if (payload instanceof FormData) {
        return apiRequest(`/quotations/${id}`, { method: "PUT", body: payload });
    }
    return apiRequest(`/quotations/${id}`, { method: "PUT", body: payload });
}

async function deleteQuotation(id) {
    return apiRequest(`/quotations/${id}`, { method: "DELETE" });
}

async function approveQuotation(id) {
    return apiRequest(`/quotations/${id}/approve`, { method: "POST" });
}

async function rejectQuotation(id) {
    return apiRequest(`/quotations/${id}/reject`, { method: "POST" });
}

async function previewQuotation(id) {
    return apiRequest(`/quotations/${id}/preview`);
}

async function addQuotationFollowUp(id, payload) {
    return apiRequest(`/quotations/${id}/follow-ups`, { method: "POST", body: payload });
}
