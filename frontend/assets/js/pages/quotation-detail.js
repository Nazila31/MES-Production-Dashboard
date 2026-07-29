/* ==========================================================
    QUOTATION DETAIL PAGE
========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (id) {
        await loadQuotationDetail(id);
        bindApprovalActions(id);
        bindFollowUpForm(id);
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

        const previewBtn = document.getElementById("previewDocumentBtn");
        if (previewBtn) {
            if (data.has_file) {
                previewBtn.style.display = "inline-flex";
                previewBtn.onclick = () => previewDocument(id);
            } else {
                previewBtn.style.display = "none";
                previewBtn.onclick = null;
            }
        }

        const approveBtn = document.getElementById("approveBtn");
        const rejectBtn = document.getElementById("rejectBtn");
        if (!["draft", "sent"].includes(data.status)) {
            if (approveBtn) approveBtn.style.display = "none";
            if (rejectBtn) rejectBtn.style.display = "none";
        }

        renderFollowUps(data.follow_ups || []);
    } catch (error) {
        alert(error.message);
    }
}

function renderFollowUps(followUps) {
    const list = document.getElementById("followUpList");
    if (!list) return;

    if (!followUps.length) {
        list.innerHTML = `<p class="text-muted mb-0">Belum ada follow up. Tambahkan catatan komunikasi dengan client.</p>`;
        return;
    }

    list.innerHTML = followUps.map((item) => {
        const statusBadge = item.status
            ? `<span class="badge-kustom badge-info ms-2">${item.status_label || formatFollowUpStatus(item.status)}</span>`
            : "";

        return `
            <div class="follow-up-item">
                <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
                    <strong>${formatDate(item.follow_up_date)}</strong>
                    ${statusBadge}
                </div>
                <p class="mb-1 mt-2">${item.description}</p>
                <small class="text-muted">${item.created_by || "System"} — ${formatDate(item.created_at)}</small>
            </div>`;
    }).join("");
}

function bindFollowUpForm(id) {
    const form = document.getElementById("followUpForm");
    if (!form) return;

    const statusSelect = form.querySelector('[name="status"]');
    if (statusSelect) {
        statusSelect.innerHTML = `<option value="">— Opsional —</option>${MESConfig.followUpStatuses.map((item) =>
            `<option value="${item.key}">${item.label}</option>`).join("")}`;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(form);

        try {
            await addQuotationFollowUp(id, {
                follow_up_date: formData.get("follow_up_date"),
                description: formData.get("description"),
                status: formData.get("status") || null,
            });
            form.reset();
            await loadQuotationDetail(id);
        } catch (error) {
            alert(error.message);
        }
    });
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
