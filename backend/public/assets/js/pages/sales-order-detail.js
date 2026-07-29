/* ==========================================================
    SALES ORDER DETAIL PAGE
========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (id) {
        await loadSalesOrderDetail(id);
        bindDeliveryNoteForm(id);
        bindDeadlineForm(id);
    }
});

async function loadSalesOrderDetail(id) {
    try {
        const response = await fetchSalesOrder(id);
        const data = response.data;
        const styles = getStatusStyles(data.production_stage || data.status);

        setText("soNumber", data.so_number);
        setText("quotationNumber", data.quotation_number);
        setText("spkGlobal", data.spk_global);
        setText("client", data.client);
        setText("machine", data.machine);
        setText("pic", data.pic);
        setText("startDate", formatDate(data.start_date));
        setDeadlineField("materialDeadline", data.material_deadline, data.material_deadline_status);
        setDeadlineField("productionDeadline", data.production_deadline || data.deadline, data.production_deadline_status);
        setText("description", data.description);

        toggleDeadlineEditForm(data);

        const badge = document.getElementById("statusBadge");
        if (badge) {
            badge.className = `badge-kustom ${styles.badge}`;
            badge.textContent = formatStatusLabel(data.production_stage || data.status);
        }

        const progressBar = document.getElementById("progressBar");
        if (progressBar) {
            progressBar.style.width = `${data.progress || 0}%`;
            progressBar.textContent = `${data.progress || 0}%`;
            progressBar.className = `progress-bar ${styles.progress}`;
        }

        renderTimeline(data);
        renderDeliveryInfo(data);
        renderQcRejectHistory(data);
        toggleDeliveryNoteForm(data.status);
    } catch (error) {
        alert(error.message);
    }
}

function setDeadlineField(id, date, status) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = renderDeadlineCell(date, status);
}

function toggleDeadlineEditForm(data) {
    const section = document.getElementById("deadlineEditSection");
    const user = getAuthUser();
    if (!section || !user) return;

    const canEdit = user.role === "admin" || user.role === "ppic";
    section.style.display = canEdit ? "block" : "none";

    if (canEdit) {
        setValue("material_deadline", data.material_deadline);
        setValue("deadline", data.production_deadline || data.deadline);
    }
}

function setValue(name, value) {
    const field = document.querySelector(`#deadlineForm [name="${name}"]`);
    if (field) field.value = value || "";
}

function bindDeadlineForm(id) {
    const form = document.getElementById("deadlineForm");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(form);

        try {
            await updateSalesOrderDeadlines(id, {
                material_deadline: formData.get("material_deadline") || null,
                deadline: formData.get("deadline") || null,
            });
            await loadSalesOrderDetail(id);
        } catch (error) {
            alert(error.message);
        }
    });
}

function renderTimeline(data) {
    const timeline = document.getElementById("productionTimeline");
    if (!timeline) return;

    const stages = [
        { key: "marketing", label: "Quotation Approved", done: true },
        { key: "admin", label: "Sales Order Created", done: true },
        { key: "ppic", label: "Work Order Released", done: !["waiting_ppic"].includes(data.status) },
        ...MESConfig.productionStages.map((s) => ({
            key: s.key,
            label: s.label,
            done: getStageIndex(data.production_stage) > getStageIndex(s.key),
            active: data.production_stage === s.key
        })),
        { key: "delivery_note", label: "Surat Jalan", done: ["ready_for_delivery", "completed"].includes(data.status), active: data.status === "qc_passed" },
        { key: "shipment", label: "Delivery / Resi", done: data.status === "completed", active: data.status === "ready_for_delivery" },
        { key: "completed", label: "Project Completed", done: data.status === "completed", active: false }
    ];

    timeline.innerHTML = stages.map((stage) => {
        let className = "";
        if (stage.done) className = "completed";
        else if (stage.active) className = "active";
        const icon = stage.done ? "bi-check-circle-fill" : stage.active ? "bi-gear-fill" : "bi-circle";
        return `<li class="${className}"><i class="bi ${icon}"></i>${stage.label}</li>`;
    }).join("");
}

function renderDeliveryInfo(data) {
    const section = document.getElementById("deliveryInfoSection");
    if (!section) return;

    if (!["ready_for_delivery", "completed"].includes(data.status)) {
        section.style.display = "none";
        return;
    }

    section.style.display = "block";
    setText("infoDeliveryNumber", data.delivery_number);
    setText("infoDeliveryDate", formatDate(data.delivery_date));
    setText("infoDeliveryRecipient", data.delivery_recipient);
    setText("infoDeliveryNotes", data.delivery_note_notes || "-");
    setText("infoTrackingNumber", data.tracking_number || "-");
    setText("infoShipmentDate", formatDate(data.shipment_date));
    setText("infoShipmentCourier", data.vehicle_courier || "-");
    setText("infoShipmentNotes", data.shipment_notes || "-");

    const noteLink = document.getElementById("deliveryNotePreviewLink");
    if (noteLink) {
        noteLink.style.display = data.delivery_file_url ? "inline-flex" : "none";
        noteLink.onclick = () => window.open(data.delivery_file_url, "_blank");
    }

    const proofLink = document.getElementById("shipmentProofPreviewLink");
    if (proofLink) {
        proofLink.style.display = data.shipment_proof_url ? "inline-flex" : "none";
        proofLink.onclick = () => window.open(data.shipment_proof_url, "_blank");
    }
}

function renderQcRejectHistory(data) {
    const section = document.getElementById("qcRejectHistorySection");
    const list = document.getElementById("qcRejectHistoryList");
    if (!section || !list) return;

    const logs = data.qc_reject_logs || [];
    if (!logs.length) {
        section.style.display = "none";
        return;
    }

    section.style.display = "block";
    list.innerHTML = logs.map((log) => `
        <div class="border rounded p-3 mb-2">
            <strong>Returned to ${formatStatusLabel(log.return_to_stage)}</strong>
            <p class="mb-1 mt-2">${log.reject_reason}</p>
            <small class="text-muted">${log.rejected_by || "Unknown"} — ${formatDate(log.created_at)}</small>
        </div>`).join("");
}

function getStageIndex(stage) {
    return MESConfig.productionStages.map((s) => s.key).indexOf(stage);
}

function toggleDeliveryNoteForm(status) {
    const section = document.getElementById("deliveryNoteSection");
    if (section) section.style.display = status === "qc_passed" ? "block" : "none";
}

function bindDeliveryNoteForm(id) {
    const form = document.getElementById("deliveryNoteFormEl");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const fileInput = form.querySelector('input[type="file"]');
        if (fileInput?.files?.[0]) {
            formData.set("file", fileInput.files[0]);
        }

        try {
            await createDeliveryNote(id, formData);
            document.getElementById("successModal")?.classList.add("show");
        } catch (error) {
            alert(error.message);
        }
    });
}

function finishFinalize() {
    location.reload();
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value || "-";
}
