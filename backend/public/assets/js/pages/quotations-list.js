/* ==========================================================
    QUOTATIONS LIST PAGE
========================================================== */

let quotationData = [];
let paginationMeta = {};

document.addEventListener("DOMContentLoaded", async () => {
    await loadQuotations();
    bindQuotationFilters();
});

async function loadQuotations(params = {}) {
    try {
        const response = await fetchQuotations(params);
        quotationData = response.data || [];
        paginationMeta = response.meta || {};
        renderQuotations(quotationData);
        updateQuotationSummary(quotationData);
    } catch (error) {
        console.error("Failed to load quotations:", error);
    }
}

function bindQuotationFilters() {
    document.getElementById("searchInput")?.addEventListener("keyup", applyQuotationFilters);
    document.getElementById("statusFilter")?.addEventListener("change", applyQuotationFilters);
}

function applyQuotationFilters() {
    const keyword = document.getElementById("searchInput")?.value || "";
    const status = document.getElementById("statusFilter")?.value || "all";
    loadQuotations({
        search: keyword,
        status: status === "all" ? "" : status
    });
}

function resetFilter() {
    const searchInput = document.getElementById("searchInput");
    const statusFilter = document.getElementById("statusFilter");
    if (searchInput) searchInput.value = "";
    if (statusFilter) statusFilter.value = "all";
    loadQuotations();
}

function renderQuotations(data) {
    const tbody = document.getElementById("dataTableBody");
    const tableInfo = document.querySelector(".table-info");
    const base = getBasePath();
    if (!tbody) return;

    if (!data.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-5"><i class="bi bi-file-earmark-x display-5 text-secondary"></i><h5 class="mt-3">No Quotations Found</h5><p class="text-muted mb-0">Create a new quotation to get started.</p></td></tr>`;
        if (tableInfo) tableInfo.textContent = "Showing 0 of 0 Quotations";
        return;
    }

    tbody.innerHTML = data.map((item) => {
        const styles = getStatusStyles(item.status);
        return `<tr>
            <td>${item.quotation_number}</td>
            <td>${item.client}</td>
            <td>${item.machine || "-"}</td>
            <td>${formatCurrency(item.amount)}</td>
            <td><span class="badge-kustom ${styles.badge}">${formatStatusLabel(item.status)}</span></td>
            <td>${formatDate(item.deadline)}</td>
            <td><div class="action-buttons">
                <button class="btn btn-action-kustom" title="Preview" onclick="previewDocument(${item.id})"><i class="bi bi-eye"></i></button>
                <a href="${base}pages/quotations/detail.html?id=${item.id}" class="btn btn-action-kustom" title="View"><i class="bi bi-card-text"></i></a>
                <a href="${base}pages/quotations/edit.html?id=${item.id}" class="btn btn-action-kustom" title="Edit"><i class="bi bi-pencil"></i></a>
                <button class="btn btn-action-kustom" title="Delete" onclick="deleteQuotationItem(${item.id})"><i class="bi bi-trash"></i></button>
            </div></td>
        </tr>`;
    }).join("");

    if (tableInfo) {
        const total = paginationMeta.total || data.length;
        tableInfo.textContent = `Showing ${data.length} of ${total} Quotations`;
    }
}

async function previewDocument(id) {
    try {
        const response = await previewQuotation(id);
        window.open(response.data.url, "_blank");
    } catch (error) {
        alert(error.message);
    }
}

async function deleteQuotationItem(id) {
    if (!confirm("Delete this quotation?")) return;
    try {
        await deleteQuotation(id);
        await loadQuotations();
    } catch (error) {
        alert(error.message);
    }
}

function updateQuotationSummary(data) {
    setText("totalCount", paginationMeta.total ?? data.length);
    setText("draftCount", data.filter((q) => q.status === "draft").length);
    setText("approvedCount", data.filter((q) => q.status === "approved").length);
    setText("rejectedCount", data.filter((q) => q.status === "rejected").length);
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}
