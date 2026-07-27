/* ==========================================================
    SALES ORDER DETAIL PAGE
========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (id) {
        await loadSalesOrderDetail(id);
        bindFinalization(id);
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
        setText("deadline", formatDate(data.deadline));
        setText("description", data.description);

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
        toggleFinalizationForm(data.status);
    } catch (error) {
        alert(error.message);
    }
}

function renderTimeline(data) {
    const timeline = document.getElementById("productionTimeline");
    if (!timeline) return;

    const stages = [
        { key: "marketing", label: "Quotation Approved", done: true },
        { key: "admin", label: "Sales Order Created", done: true },
        { key: "ppic", label: "Work Order Released", done: data.status !== "waiting_ppic" },
        ...MESConfig.productionStages.map((s) => ({
            key: s.key,
            label: s.label,
            done: getStageIndex(data.production_stage) > getStageIndex(s.key),
            active: data.production_stage === s.key
        })),
        { key: "completed", label: "Project Completed", done: data.status === "completed", active: data.status === "qc_passed" }
    ];

    timeline.innerHTML = stages.map((stage) => {
        let className = "";
        if (stage.done) className = "completed";
        else if (stage.active) className = "active";

        const icon = stage.done ? "bi-check-circle-fill" : stage.active ? "bi-gear-fill" : "bi-circle";
        return `<li class="${className}"><i class="bi ${icon}"></i>${stage.label}</li>`;
    }).join("");
}

function getStageIndex(stage) {
    const stages = MESConfig.productionStages.map((s) => s.key);
    return stages.indexOf(stage);
}

function toggleFinalizationForm(status) {
    const form = document.getElementById("finalizationForm");
    if (form) {
        form.style.display = status === "qc_passed" ? "block" : "none";
    }
}

function bindFinalization(id) {
    const form = document.getElementById("finalizationForm");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const payload = {
            delivery_order: form.delivery_order.value,
            packing_list: form.packing_list.value,
            invoice: form.invoice.value
        };

        try {
            await finalizeProject(id, payload);
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
