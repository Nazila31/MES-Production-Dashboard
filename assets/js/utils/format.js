/* ==========================================================
    FORMAT UTILITIES
========================================================== */

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
