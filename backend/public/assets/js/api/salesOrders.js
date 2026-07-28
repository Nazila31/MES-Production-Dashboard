/* ==========================================================
    SALES ORDERS API
========================================================== */

async function fetchSalesOrders(params = {}) {
    return apiRequest(`/sales-orders${buildQuery(params)}`);
}

async function fetchApprovedQuotations() {
    return apiRequest("/quotations/approved-for-so");
}

async function fetchSalesOrder(id) {
    return apiRequest(`/sales-orders/${id}`);
}

async function createSO(payload) {
    if (payload instanceof FormData) {
        return apiRequest("/sales-orders", { method: "POST", body: payload });
    }

    return apiRequest("/sales-orders", {
        method: "POST",
        body: payload,
    });
}

async function deleteSalesOrder(id) {
    return apiRequest(`/sales-orders/${id}`, { method: "DELETE" });
}

async function createDeliveryNote(soId, payload) {
    if (payload instanceof FormData) {
        return apiRequest(`/sales-orders/${soId}/delivery-note`, { method: "POST", body: payload });
    }

    return apiRequest(`/sales-orders/${soId}/delivery-note`, { method: "POST", body: payload });
}

async function finalizeProject(soId, payload) {
    return createDeliveryNote(soId, payload);
}

async function previewSalesOrder(id) {
    return apiRequest(`/sales-orders/${id}/preview`);
}

async function previewDelivery(id) {
    return apiRequest(`/sales-orders/${id}/delivery-preview`);
}
