/* ==========================================================
    REPORTS PAGE
========================================================== */

let documentPreviewModal = null;

document.addEventListener("DOMContentLoaded", async () => {
    const modalEl = document.getElementById("documentPreviewModal");
    if (modalEl && window.bootstrap) {
        documentPreviewModal = new bootstrap.Modal(modalEl);
    }

    await loadReports();
    document.getElementById("exportCSV")?.addEventListener("click", handleExportCsv);
    document.getElementById("exportPDF")?.addEventListener("click", handleExportPdf);
    document.getElementById("generateReport")?.addEventListener("click", loadReports);
});

function getReportFilters() {
    return {
        date_from: document.getElementById("dateFrom")?.value || "",
        date_to: document.getElementById("dateTo")?.value || "",
        client: document.getElementById("clientFilter")?.value || "",
        so_number: document.getElementById("soFilter")?.value || "",
        quotation_number: document.getElementById("quotationFilter")?.value || "",
        status: document.getElementById("statusFilter")?.value || ""
    };
}

async function loadReports() {
    try {
        const response = await fetchReports(getReportFilters());
        const data = response.data;

        setText("reportTotalOrders", data.total_orders ?? 0);
        setText("reportCompleted", data.completed ?? 0);
        setText("reportDelayed", data.delayed ?? 0);
        setText("reportEfficiency", `${data.efficiency ?? 0}%`);

        renderReportTable(data.rows || []);
        renderReportCharts(data);
    } catch (error) {
        console.error(error);
    }
}

function renderReportTable(rows) {
    const tbody = document.getElementById("reportTableBody");
    if (!tbody) return;

    if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="12" class="text-center py-4 text-muted">No report data available.</td></tr>`;
        return;
    }

    tbody.innerHTML = rows.map((row, index) => {
        const docs = row.documents || [];
        const statusClass = getStatusStyles(row.status).badge;
        const statusLabel = row.status_label || formatStatusLabel(row.status);
        const fileLabel = docs.length === 1 ? "1 File" : `${docs.length} Files`;

        return `
            <tr class="report-row" data-row-index="${index}">
                <td><button class="btn btn-sm btn-link p-0 report-expand-btn" data-target="report-docs-${index}" aria-label="Toggle details"><i class="bi bi-chevron-right"></i></button></td>
                <td>${row.quotation_date || "-"}</td>
                <td>${row.so_date || "-"}</td>
                <td><strong>${row.so_number || "-"}</strong></td>
                <td>${row.client || "-"}</td>
                <td>${renderDeadlineCell(row.material_deadline, row.material_deadline_status)}</td>
                <td>${renderDeadlineCell(row.production_deadline, row.production_deadline_status)}</td>
                <td>${row.production_start || "-"}</td>
                <td>${row.completion_date || "-"}</td>
                <td>${row.total_days != null ? `${row.total_days} hari` : "-"}</td>
                <td><span class="badge-kustom ${statusClass}">${statusLabel}</span></td>
                <td>
                    <button type="button" class="btn btn-sm btn-light report-docs-toggle" data-target="report-docs-${index}" ${docs.length ? "" : "disabled"}>
                        ${docs.length ? `<i class="bi bi-chevron-down"></i> ${fileLabel}` : "0 Files"}
                    </button>
                </td>
            </tr>
            <tr class="report-docs-row d-none" id="report-docs-${index}">
                <td colspan="12">
                    ${renderDocumentPanel(docs, row)}
                </td>
            </tr>`;
    }).join("");

    tbody.querySelectorAll(".report-expand-btn, .report-docs-toggle").forEach((btn) => {
        btn.addEventListener("click", () => toggleDocumentRow(btn));
    });

    tbody.querySelectorAll("[data-doc-view]").forEach((btn) => {
        btn.addEventListener("click", () => openDocumentPreview(btn.dataset));
    });
}

function renderDocumentPanel(documents, row) {
    const rejectLogs = row.qc_reject_logs || [];
    let html = "";

    if (!documents.length && !rejectLogs.length) {
        return `<div class="report-docs-empty text-muted py-3"><i class="bi bi-file-earmark-x"></i> No documents uploaded for ${row.so_number}.</div>`;
    }

    if (documents.length) {
        html += `
            <div class="report-docs-panel">
                <div class="report-docs-meta mb-2">
                    <strong>${row.so_number}</strong> — SPK: ${row.spk_global || "-"}
                </div>
                <ul class="report-doc-list mb-3">
                    ${documents.map((doc) => `
                        <li>
                            <i class="bi ${doc.is_image ? "bi-image" : "bi-file-earmark-pdf"}"></i>
                            <span>${doc.label}: ${doc.file_name}</span>
                            <div class="report-doc-inline-actions">
                                <button type="button" class="btn btn-sm btn-outline-primary"
                                    data-doc-view="1"
                                    data-url="${doc.url}"
                                    data-name="${doc.file_name}"
                                    data-label="${doc.label}"
                                    data-image="${doc.is_image ? "1" : "0"}">
                                    View
                                </button>
                                <a href="${doc.download_url || getDownloadUrl(doc.url)}" class="btn btn-sm btn-outline-secondary">Download</a>
                            </div>
                        </li>`).join("")}
                </ul>
                <div class="report-docs-grid">
                    ${documents.map((doc) => renderDocumentCard(doc)).join("")}
                </div>
            </div>`;
    }

    if (rejectLogs.length) {
        html += `
            <div class="report-reject-history mt-3">
                <h6>QC Reject History</h6>
                ${rejectLogs.map((log) => `
                    <div class="border rounded p-2 mb-2">
                        <strong>Return to ${formatStatusLabel(log.return_to_stage)}</strong>
                        <p class="mb-1 mt-1">${log.reject_reason}</p>
                        <small class="text-muted">${log.rejected_by || "Unknown"} — ${log.created_at || "-"}</small>
                    </div>`).join("")}
            </div>`;
    }

    return html;
}

function renderDocumentCard(doc) {
    const thumbnail = doc.is_image
        ? `<img src="${doc.url}" alt="${doc.file_name}" class="report-doc-thumb">`
        : `<div class="report-doc-icon"><i class="bi bi-file-earmark-pdf"></i></div>`;

    return `
        <div class="report-doc-card">
            ${thumbnail}
            <div class="report-doc-info">
                <span class="report-doc-label">${doc.label}</span>
                <small class="text-muted d-block text-truncate">${doc.file_name}</small>
                <div class="report-doc-actions mt-2">
                    <button type="button" class="btn btn-sm btn-outline-primary"
                        data-doc-view="1"
                        data-url="${doc.url}"
                        data-name="${doc.file_name}"
                        data-label="${doc.label}"
                        data-image="${doc.is_image ? "1" : "0"}">
                        <i class="bi bi-eye"></i> View
                    </button>
                    <a href="${doc.download_url || getDownloadUrl(doc.url)}" class="btn btn-sm btn-outline-secondary" download="${doc.file_name}">
                        <i class="bi bi-download"></i> Download
                    </a>
                </div>
            </div>
        </div>`;
}

function toggleDocumentRow(button) {
    const targetId = button.dataset.target;
    const docsRow = document.getElementById(targetId);
    if (!docsRow) return;

    const isHidden = docsRow.classList.contains("d-none");
    docsRow.classList.toggle("d-none", !isHidden);

    document.querySelectorAll(`[data-target="${targetId}"]`).forEach((el) => {
        const icon = el.querySelector("i");
        if (!icon) return;
        icon.classList.toggle("bi-chevron-right", !isHidden);
        icon.classList.toggle("bi-chevron-down", isHidden);
    });
}

function openDocumentPreview(dataset) {
    const title = document.getElementById("documentPreviewTitle");
    const body = document.getElementById("documentPreviewBody");
    const download = document.getElementById("documentPreviewDownload");

    if (!title || !body || !download) {
        window.open(dataset.url, "_blank");
        return;
    }

    title.textContent = `${dataset.label} — ${dataset.name}`;
    download.href = getDownloadUrl(dataset.url);
    download.setAttribute("download", dataset.name);

    if (dataset.image === "1") {
        body.innerHTML = `<img src="${dataset.url}" alt="${dataset.name}" class="report-preview-image">`;
    } else {
        body.innerHTML = `<iframe src="${dataset.url}" class="report-preview-frame" title="${dataset.name}"></iframe>`;
    }

    if (documentPreviewModal) {
        documentPreviewModal.show();
    } else {
        window.open(dataset.url, "_blank");
    }
}

function renderReportCharts(data) {
    const hasProduction = hasChartData(data.monthly_production);
    toggleChartEmptyText("productionChartText", hasProduction);
    if (hasProduction) {
        const labels = getLastSixMonthLabels();
        initLineChart(document.getElementById("productionChart"), labels, data.monthly_production, "Sales Order", 0.35);
    }

    const hasDept = hasChartData(data.department_distribution);
    toggleChartEmptyText("departmentChartText", hasDept);
    if (hasDept) {
        initDoughnutChart(document.getElementById("departmentChart"), ["Fabrication", "Machining", "Assembly", "QC"], data.department_distribution);
    }

    const hasStatus = hasChartData(data.status_distribution);
    toggleChartEmptyText("statusChartText", hasStatus);
    if (hasStatus) {
        initBarChart(document.getElementById("statusChart"), ["Completed", "In Production", "Waiting PPIC"], data.status_distribution);
    }
}

function getLastSixMonthLabels() {
    const labels = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(date.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }));
    }

    return labels;
}

async function handleExportCsv() {
    const csv = await exportReportCSV(getReportFilters());
    downloadBlob(new Blob([csv], { type: "text/csv" }), "Production_Report.csv");
}

async function handleExportPdf() {
    const blob = await exportReportPDF(getReportFilters());
    downloadBlob(blob, "Production_Report.pdf");
}

function downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}
