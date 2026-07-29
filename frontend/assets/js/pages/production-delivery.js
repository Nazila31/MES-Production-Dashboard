/* ==========================================================
    PRODUCTION DELIVERY PAGE
========================================================== */

let deliveryQueueData = [];

document.addEventListener("DOMContentLoaded", async () => {
    await loadDeliveryQueue();
    document.getElementById("shipmentForm")?.addEventListener("submit", handleShipmentSubmit);
});

async function loadDeliveryQueue() {
    try {
        const response = await fetchDeliveryQueue();
        deliveryQueueData = response.data || [];
        renderDeliveryQueue();
    } catch (error) {
        console.error(error);
    }
}

function renderDeliveryQueue() {
    const container = document.getElementById("deliveryQueue");
    if (!container) return;

    if (!deliveryQueueData.length) {
        container.innerHTML = `<div class="text-center py-5 text-muted"><i class="bi bi-truck display-4"></i><p class="mt-3 mb-0">No projects waiting for delivery.</p></div>`;
        return;
    }

    container.innerHTML = `<div class="table-responsive"><table class="table align-middle project-table">
        <thead><tr><th>SO Number</th><th>Client</th><th>Surat Jalan</th><th>Penerima</th><th>Tanggal SJ</th><th>Action</th></tr></thead>
        <tbody>${deliveryQueueData.map((item) => `
            <tr>
                <td>${item.so_number}</td>
                <td>${item.client}</td>
                <td>${item.delivery_number || "-"}</td>
                <td>${item.delivery_recipient || "-"}</td>
                <td>${formatDate(item.delivery_date)}</td>
                <td><button class="btn btn-primary btn-sm" onclick="selectDeliveryTask(${item.id})"><i class="bi bi-pencil-square"></i> Input Resi</button></td>
            </tr>`).join("")}</tbody></table></div>`;
}

function selectDeliveryTask(soId) {
    const item = deliveryQueueData.find((row) => row.id === soId);
    if (!item) return;

    document.getElementById("shipmentFormSection").style.display = "block";
    document.getElementById("selectedSoId").value = soId;
    setText("selectedSoNumber", item.so_number);
    setText("deliveryNoteNumber", item.delivery_number);
    setText("deliveryRecipient", item.delivery_recipient);
    setText("deliveryNoteDate", formatDate(item.delivery_date));
}

async function handleShipmentSubmit(event) {
    event.preventDefault();
    const soId = document.getElementById("selectedSoId")?.value;
    if (!soId) return;

    const formData = new FormData(event.target);
    const fileInput = event.target.querySelector('input[type="file"]');
    if (fileInput?.files?.[0]) {
        formData.set("file", fileInput.files[0]);
    }

    try {
        await completeShipment(soId, formData);
        document.getElementById("successModal")?.classList.add("show");
    } catch (error) {
        alert(error.message);
    }
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value || "-";
}
