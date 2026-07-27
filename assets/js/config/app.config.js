/* ==========================================================
    APP CONFIGURATION
    Central config for API base URL and navigation
========================================================== */

const MESConfig = {
    apiBaseUrl: "/api/v1",
    useMockData: true,
    appName: "Manufacturing Execution System",
    companyName: "PT Karya Machindo Industries",

    navigation: [
        { id: "dashboard", label: "Dashboard", icon: "bi-speedometer2", href: "index.html" },
        { id: "quotations", label: "Quotations", icon: "bi-file-earmark-text", href: "pages/quotations/index.html" },
        { id: "sales-orders", label: "Sales Orders", icon: "bi-cart-check", href: "pages/sales-orders/index.html" },
        { id: "ppic", label: "PPIC", icon: "bi-diagram-3", href: "pages/ppic/index.html" },
        { id: "production", label: "Production", icon: "bi-gear-wide-connected", href: "pages/production/index.html" },
        { id: "reports", label: "Reports", icon: "bi-bar-chart-line", href: "pages/reports/index.html" },
        { id: "notifications", label: "Notifications", icon: "bi-bell", href: "pages/notifications/index.html" }
    ],

    productionStages: [
        { key: "fabrication", label: "Fabrication", button: "Complete Fabrication", progress: 25 },
        { key: "machining", label: "Machining", button: "Complete Machining", progress: 50 },
        { key: "assembly", label: "Assembly", button: "Complete Assembly", progress: 75 },
        { key: "qc", label: "Quality Control", button: "QC Passed", progress: 100 }
    ],

    quotationStatuses: ["draft", "approved", "rejected"],
    soStatuses: ["waiting_ppic", "ppic_processing", "released", "in_production", "qc_passed", "completed"],
    notificationTypes: [
        "quotation_approved",
        "so_created",
        "work_order_released",
        "stage_completed",
        "qc_passed",
        "deadline_reminder",
        "project_completed"
    ]
};
