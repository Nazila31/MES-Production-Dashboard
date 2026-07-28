/* ==========================================================
    PPIC API
========================================================== */

async function fetchReleasedSO() {
    return apiRequest("/ppic/released-so");
}

async function fetchBOM(soId) {
    return apiRequest(`/ppic/bom/${soId}`);
}

async function saveBOM(soId, items, formData = null) {
    if (formData instanceof FormData) {
        return apiRequest(`/ppic/bom/${soId}`, { method: "POST", body: formData });
    }

    return apiRequest(`/ppic/bom/${soId}`, {
        method: "POST",
        body: { items }
    });
}

async function checkWarehouseStock(soId) {
    return apiRequest(`/ppic/warehouse/${soId}`);
}

async function createWorkOrder(soId, payload = null, formData = null) {
    if (formData instanceof FormData) {
        return apiRequest("/ppic/work-orders", { method: "POST", body: formData });
    }

    return apiRequest("/ppic/work-orders", {
        method: "POST",
        body: {
            so_id: soId,
            ...(payload || {}),
        },
    });
}

async function releaseWorkOrder(soId, scheduleDate) {
    return apiRequest(`/ppic/work-orders/${soId}/release`, {
        method: "POST",
        body: { schedule_date: scheduleDate }
    });
}

async function fetchWorkOrder(soId) {
    return apiRequest(`/ppic/work-orders/${soId}`);
}

async function fetchProductionSchedule() {
    return apiRequest("/ppic/schedule");
}
