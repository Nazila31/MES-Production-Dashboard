/* ==========================================================
    REPORTS PAGE
========================================================== */

/* ==========================================================
    Initialization
========================================================== */

document.addEventListener("DOMContentLoaded", () => {
    const exportBtn = document.getElementById("exportCSV");

    if (exportBtn) {
        exportBtn.addEventListener("click", exportCSV);
    }
});

/* ==========================================================
    Feature Functions
========================================================== */

function exportCSV() {
    const headers = ["Month", "Sales Order", "Completed", "Delayed", "Efficiency"];
    const csv = headers.join(",") + "\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "Production_Report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}
