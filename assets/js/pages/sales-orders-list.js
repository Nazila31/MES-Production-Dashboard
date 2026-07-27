/* ==========================================================
    SALES ORDERS LIST PAGE
========================================================== */

let salesOrderData = [];

document.addEventListener("DOMContentLoaded", async () => {
    await loadSalesOrders();
    bindSOFilters();
    await loadApprovedQuotationsForModal();
});

async function loadSalesOrders(params = {}) {
    try {
        const response = await fetchSalesOrders(params);
        salesOrderData = response.data || [];
        renderSalesOrders(salesOrderData);
        updateSOSummary(salesOrderData);
    } catch (error) {
        console.error("Failed to load sales orders:", error);
    }
}

function bindSOFilters() {
    const searchInput = document.getElementById("searchInput");
    const statusFilter = document.getElementById("statusFilter");

    if (searchInput) searchInput.addEventListener("keyup", applySOFilters);
    if (statusFilter) statusFilter.addEventListener("change", applySOFilters);
}

function applySOFilters() {
    const keyword = (document.getElementById("searchInput")?.value || "").toLowerCase();
    const status = document.getElementById("statusFilter")?.value || "all";

    const filtered = salesOrderData.filter((item) => {
        const matchSearch =
            item.so_number.toLowerCase().includes(keyword) ||
            item.client.toLowerCase().includes(keyword);
        const matchStatus = status === "all" || item.status === status;
        return matchSearch && matchStatus;
    });

    renderSalesOrders(filtered);
}

function resetFilter() {
    const searchInput = document.getElementById("searchInput");
    const statusFilter = document.getElementById("statusFilter");
    if (searchInput) searchInput.value = "";
    if (statusFilter) statusFilter.value = "all";
    renderSalesOrders(salesOrderData);
}

function renderSalesOrders(data) {
    const tbody = document.getElementById("dataTableBody");
    const tableInfo = document.querySelector(".table-info");
    const base = getBasePath();

    if (!tbody) return;

    if (!data.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-5">
            <i class="bi bi-cart-x display-5 text-secondary"></i>
            <h5 class="mt-3">No Sales Orders Found</h5>
            <p class="text-muted mb-0">Convert an approved quotation to create a Sales Order.</p>
        </td></tr>`;
        if (tableInfo) tableInfo.textContent = "Showing 0 of 0 Sales Orders";
        return;
    }

    tbody.innerHTML = data.map((item) => {
        const styles = getStatusStyles(item.production_stage || item.status);
        const progress = item.progress || 0;
        return `
            <tr>
                <td>${item.so_number}</td>
                <td>${item.quotation_number}</td>
                <td>${item.client}</td>
                <td>${item.spk_global}</td>
                <td width="180"><div class="progress"><div class="progress-bar ${styles.progress}" style="width:${progress}%">${progress}%</div></div></td>
                <td><span class="badge-kustom ${styles.badge}">${formatStatusLabel(item.production_stage || item.status)}</span></td>
                <td>${formatDate(item.deadline)}</td>
                <td><div class="action-buttons">
                    <a href="${base}pages/sales-orders/detail.html?id=${item.id}" class="btn btn-action-kustom" title="View"><i class="bi bi-eye"></i></a>
                </div></td>
            </tr>`;
    }).join("");

    if (tableInfo) tableInfo.textContent = `Showing ${data.length} of ${salesOrderData.length} Sales Orders`;
}

function updateSOSummary(data) {
    setText("totalCount", data.length);
    setText("waitingCount", data.filter((so) => so.status === "waiting_ppic").length);
    setText("productionCount", data.filter((so) => so.status === "in_production").length);
    setText("completedCount", data.filter((so) => so.status === "completed").length);
}

async function loadApprovedQuotationsForModal() {
    const select = document.getElementById("quotationSelect");
    if (!select) return;

    try {
        const response = await fetchApprovedQuotations();
        const quotations = response.data || [];

        select.innerHTML = `<option value="">Select Approved Quotation</option>` +
            quotations.map((q) => `<option value="${q.id}">${q.quotation_number} - ${q.client}</option>`).join("");
    } catch (error) {
        console.error(error);
    }
}

function openCreateSOModal() {
    document.getElementById("createSOModal")?.classList.add("show");
}

function closeCreateSOModal() {
    document.getElementById("createSOModal")?.classList.remove("show");
}

async function generateSO() {
    const quotationId = document.getElementById("quotationSelect")?.value;
    if (!quotationId) {
        alert("Please select an approved quotation");
        return;
    }

    try {
        await createSO(quotationId);
        closeCreateSOModal();
        await loadSalesOrders();
        document.getElementById("successModal")?.classList.add("show");
    } catch (error) {
        alert(error.message);
    }
}

function finishCreate() {
    location.reload();
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}
