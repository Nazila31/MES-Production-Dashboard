/* ==========================================================
    FORMAT UTILITIES
========================================================== */

function getDownloadUrl(url) {
    if (!url) return "#";
    return url.includes("?") ? `${url}&download=1` : `${url}?download=1`;
}

function openFileUrl(url, download = false) {
    if (!url) return;
    window.open(download ? getDownloadUrl(url) : url, "_blank");
}

function formatFollowUpStatus(status) {
    if (!status) return "-";
    const match = MESConfig.followUpStatuses.find((item) => item.key === status);
    return match?.label || capitalize(status);
}

function getDeadlineIndicatorClass(status) {
    return ({
        safe: "deadline-safe",
        approaching: "deadline-approaching",
        overdue: "deadline-overdue",
    })[status] || "";
}

function getDeadlineIndicatorLabel(status) {
    return ({
        safe: "Aman",
        approaching: "Mendekati",
        overdue: "Terlewati",
    })[status] || "";
}

function renderDeadlineCell(date, status) {
    if (!date) return "-";
    const indicatorClass = getDeadlineIndicatorClass(status);
    const indicatorLabel = getDeadlineIndicatorLabel(status);
    const dot = status ? `<span class="deadline-dot ${indicatorClass}" title="${indicatorLabel}"></span>` : "";
    return `${dot}${formatDate(date)}`;
}

function formatDate(value) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });
}

function formatCurrency(value) {
    if (value === null || value === undefined) {
        return "-";
    }

    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(value);
}

function formatStatusLabel(status) {
    const styles = getStatusStyles(status);
    return styles.label || status;
}

function capitalize(text) {
    if (!text) {
        return "";
    }

    return text.charAt(0).toUpperCase() + text.slice(1).replace(/_/g, " ");
}
