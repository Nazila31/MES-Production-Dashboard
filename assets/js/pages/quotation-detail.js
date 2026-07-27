/* ==========================================================
    QUOTATION DETAIL PAGE
========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (id) {
        await loadQuotationDetail(id);
        bindApprovalActions(id);
    }
});

async function loadQuotationDetail(id) {
    try {
        const response = await fetchQuotation(id);
        const data = response.data;
        const styles = getStatusStyles(data.status);

        setText("quotationNumber", data.quotation_number);
        setText("client", data.client);
        setText("pic", data.pic);
        setText("machine", data.machine);
        setText("amount", formatCurrency(data.amount));
        setText("deadline", formatDate(data.deadline));
        setText("createdAt", formatDate(data.created_at));
        setText("description", data.description);

        const badge = document.getElementById("statusBadge");
        if (badge) {
            badge.className = `badge-kustom ${styles.badge}`;
            badge.textContent = formatStatusLabel(data.status);
        }

        const approveBtn = document.getElementById("approveBtn");
        const rejectBtn = document.getElementById("rejectBtn");

        if (data.status !== "draft") {
            if (approveBtn) approveBtn.style.display = "none";
            if (rejectBtn) rejectBtn.style.display = "none";
        }
    } catch (error) {
        alert(error.message);
    }
}

function bindApprovalActions(id) {
    const approveBtn = document.getElementById("approveBtn");
    const rejectBtn = document.getElementById("rejectBtn");

    if (approveBtn) {
        approveBtn.addEventListener("click", async () => {
            await approveQuotation(id);
            location.reload();
        });
    }

    if (rejectBtn) {
        rejectBtn.addEventListener("click", async () => {
            await rejectQuotation(id);
            location.reload();
        });
    }
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value || "-";
}
