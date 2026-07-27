/* ==========================================================
    SHARED SCRIPT LOADER
    Dynamically loads core scripts based on page depth
========================================================== */

function loadMesScripts(pageScripts = []) {
    const base = getBasePath();
    const coreScripts = [
        "assets/js/config/app.config.js",
        "assets/js/utils/path.js",
        "assets/js/utils/constants.js",
        "assets/js/utils/format.js",
        "assets/js/api/mock-data.js",
        "assets/js/api/client.js",
        "assets/js/api/quotations.js",
        "assets/js/api/salesOrders.js",
        "assets/js/api/ppic.js",
        "assets/js/api/production.js",
        "assets/js/api/dashboard.js",
        "assets/js/api/reports.js",
        "assets/js/api/notifications.js",
        "assets/js/components/layout.js",
        "assets/js/components/notifications-ui.js",
        "assets/js/app.js"
    ];

    const allScripts = [...coreScripts, ...pageScripts];
    let index = 0;

    function loadNext() {
        if (index >= allScripts.length) return;

        const script = document.createElement("script");
        script.src = `${base}${allScripts[index]}`;
        script.onload = () => {
            index += 1;
            loadNext();
        };
        document.body.appendChild(script);
    }

    loadNext();
}

function loadMesScriptsWithCharts(pageScripts = []) {
    const base = getBasePath();
    const chartScript = document.createElement("script");
    chartScript.src = "https://cdn.jsdelivr.net/npm/chart.js";
    chartScript.onload = () => {
        const utils = document.createElement("script");
        utils.src = `${base}assets/js/utils/charts.js`;
        utils.onload = () => loadMesScripts(pageScripts);
        document.body.appendChild(utils);
    };
    document.body.appendChild(chartScript);
}
