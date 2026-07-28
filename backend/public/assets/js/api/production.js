/* ==========================================================
    PRODUCTION API
========================================================== */

async function fetchCurrentProduction() {
    return apiRequest("/production/current");
}

async function fetchOperatorDashboard() {
    return apiRequest("/production/dashboard");
}

async function startStage(soId, stage) {
    return apiRequest(`/production/${soId}/${stage}/start`, { method: "POST" });
}

async function finishProductionStage(soId, stage) {
    return apiRequest(`/production/${soId}/${stage}/finish`, { method: "POST" });
}

async function finishStage(soId, stage) {
    return finishProductionStage(soId, stage);
}

async function completeFabrication(soId) {
    return finishStage(soId, "fabrication");
}

async function completeMachining(soId) {
    return finishStage(soId, "machining");
}

async function completeAssembly(soId) {
    return finishStage(soId, "assembly");
}

async function passQC(soId) {
    return apiRequest(`/production/${soId}/qc/pass`, { method: "POST" });
}

async function rejectQC(soId, notes, returnStage) {
    return apiRequest(`/production/${soId}/qc/reject`, {
        method: "POST",
        body: { notes, return_stage: returnStage }
    });
}

async function fetchDeliveryQueue() {
    return apiRequest("/production/delivery-queue");
}

async function completeShipment(soId, formData) {
    if (formData instanceof FormData) {
        return apiRequest(`/production/${soId}/shipment`, { method: "POST", body: formData });
    }

    return apiRequest(`/production/${soId}/shipment`, { method: "POST", body: formData });
}
