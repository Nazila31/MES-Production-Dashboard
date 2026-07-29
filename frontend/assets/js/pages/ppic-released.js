/* ==========================================================
    PPIC - RELEASED SO LIST
========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
    await loadReleasedSO();
});

async function loadReleasedSO() {
    try {
        const response = await fetchReleasedSO();
        renderReleasedSO(response.data || []);
    } catch (error) {
        console.error(error);
    }
}

function renderReleasedSO(data) {
    const tbody = document.getElementById("dataTableBody");
    const base = getBasePath();

    if (!tbody) return;

    if (!data.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-5">
            <p class="text-muted mb-0">No released Sales Orders for PPIC.</p></td></tr>`;
        return;
    }

    tbody.innerHTML = data.map((item) => {
        const styles = getStatusStyles(item.status);
        return `
            <tr>
                <td>${item.so_number}</td>
                <td>${item.client}</td>
                <td>${item.machine}</td>
                <td><span class="badge-kustom ${styles.badge}">${formatStatusLabel(item.status)}</span></td>
                <td>${renderDeadlineCell(item.material_deadline, item.material_deadline_status)}</td>
                <td>${renderDeadlineCell(item.production_deadline || item.deadline, item.production_deadline_status)}</td>
                <td><div class="action-buttons">
                    <a href="${base}pages/ppic/bom.html?so_id=${item.id}" class="btn btn-action-kustom" title="BOM"><i class="bi bi-list-check"></i></a>
                    <a href="${base}pages/ppic/warehouse.html?so_id=${item.id}" class="btn btn-action-kustom" title="Stock"><i class="bi bi-box-seam"></i></a>
                    <a href="${base}pages/ppic/work-order.html?so_id=${item.id}" class="btn btn-action-kustom" title="Work Order"><i class="bi bi-clipboard-check"></i></a>
                </div></td>
            </tr>`;
    }).join("");
}
