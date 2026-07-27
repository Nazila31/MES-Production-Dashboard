/* ==========================================================
    PPIC - WAREHOUSE STOCK CHECK
========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
    const soId = new URLSearchParams(window.location.search).get("so_id");
    if (soId) {
        await loadSOInfo(soId);
        await loadStock(soId);
    }
});

async function loadSOInfo(soId) {
    const response = await fetchSalesOrder(soId);
    setText("soNumber", response.data.so_number);
    setText("client", response.data.client);
}

async function loadStock(soId) {
    const response = await checkWarehouseStock(soId);
    const tbody = document.getElementById("stockTableBody");
    if (!tbody) return;

    const items = response.data || [];
    tbody.innerHTML = items.map((item) => `
        <tr>
            <td>${item.material_code}</td>
            <td>${item.material_name}</td>
            <td>${item.qty} ${item.unit}</td>
            <td>${item.stock_available} ${item.unit}</td>
            <td><span class="badge-kustom ${item.sufficient ? "status-completed" : "status-delayed"}">${item.sufficient ? "Sufficient" : "Insufficient"}</span></td>
        </tr>`).join("");
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value || "-";
}
