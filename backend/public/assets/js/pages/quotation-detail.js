/* ==========================================================
    QUOTATION DETAIL PAGE
========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
    const id = new URLSearchParams(window.location.search).get("id");
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

        const editBtn = document.getElementById("editBtn");
        if (editBtn && ["draft", "sent"].includes(data.status)) {
            editBtn.style.display = "inline-flex";
            editBtn.href = `edit.html?id=${id}`;
        }

        if (data.has_file) {
            const previewBtn = document.createElement("button");
            previewBtn.className = "btn btn-outline-primary ms-2";
            previewBtn.innerHTML = '<i class="bi bi-eye"></i> Preview Document';
            previewBtn.onclick = () => previewDocument(id);
            document.querySelector(".page-header div:last-child")?.prepend(previewBtn);
        }

        const approveBtn = document.getElementById("approveBtn");
        const rejectBtn = document.getElementById("rejectBtn");
        if (!["draft", "sent"].includes(data.status)) {
            if (approveBtn) approveBtn.style.display = "none";
            if (rejectBtn) rejectBtn.style.display = "none";
        }
    } catch (error) {
        alert(error.message);
    }
}

function bindApprovalActions(id) {
    document.getElementById("approveBtn")?.addEventListener("click", async () => {
        await approveQuotation(id);
        location.reload();
    });

    document.getElementById("rejectBtn")?.addEventListener("click", async () => {
        await rejectQuotation(id);
        location.reload();
    });
}

async function previewDocument(id) {
    const response = await previewQuotation(id);
    window.open(response.data.url, "_blank");
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value || "-";
}
