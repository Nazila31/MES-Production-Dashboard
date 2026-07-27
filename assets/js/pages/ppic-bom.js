/* ==========================================================
    PPIC - BOM INPUT
========================================================== */

let currentSoId = null;

document.addEventListener("DOMContentLoaded", async () => {
    currentSoId = new URLSearchParams(window.location.search).get("so_id");
    if (currentSoId) {
        await loadSOInfo(currentSoId);
        await loadBOM(currentSoId);
    }

    document.getElementById("bomForm")?.addEventListener("submit", handleSaveBOM);
    document.getElementById("addRowBtn")?.addEventListener("click", addBOMRow);
});

async function loadSOInfo(soId) {
    const response = await fetchSalesOrder(soId);
    setText("soNumber", response.data.so_number);
    setText("client", response.data.client);
}

async function loadBOM(soId) {
    const response = await fetchBOM(soId);
    const tbody = document.getElementById("bomTableBody");
    if (!tbody) return;

    const items = response.data || [];
    if (!items.length) {
        addBOMRow();
        return;
    }

    tbody.innerHTML = items.map((item) => bomRowHTML(item)).join("");
}

function bomRowHTML(item = {}) {
    return `<tr>
        <td><input type="text" class="form-control" name="material_code" value="${item.material_code || ""}" placeholder="MAT-001"></td>
        <td><input type="text" class="form-control" name="material_name" value="${item.material_name || ""}" placeholder="Material Name"></td>
        <td><input type="number" class="form-control" name="qty" value="${item.qty || ""}" min="1"></td>
        <td><input type="text" class="form-control" name="unit" value="${item.unit || "pcs"}"></td>
        <td><button type="button" class="btn btn-action-kustom" onclick="this.closest('tr').remove()"><i class="bi bi-trash"></i></button></td>
    </tr>`;
}

function addBOMRow() {
    document.getElementById("bomTableBody")?.insertAdjacentHTML("beforeend", bomRowHTML());
}

async function handleSaveBOM(event) {
    event.preventDefault();
    const rows = document.querySelectorAll("#bomTableBody tr");
    const items = [];

    rows.forEach((row) => {
        items.push({
            material_code: row.querySelector('[name="material_code"]').value,
            material_name: row.querySelector('[name="material_name"]').value,
            qty: Number(row.querySelector('[name="qty"]').value),
            unit: row.querySelector('[name="unit"]').value,
            stock_available: 0
        });
    });

    try {
        await saveBOM(currentSoId, items);
        document.getElementById("successModal")?.classList.add("show");
    } catch (error) {
        alert(error.message);
    }
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value || "-";
}

function finishSave() {
    window.location.href = `${getBasePath()}pages/ppic/index.html`;
}
