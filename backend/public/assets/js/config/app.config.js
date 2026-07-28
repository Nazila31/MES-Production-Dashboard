/* ==========================================================
    APP CONFIGURATION
========================================================== */

const MESConfig = {
    apiBaseUrl: "/api/v1",
    useMockData: false,
    appName: "Manufacturing Execution System",
    companyName: "PT Karya Machindo Industries",

    navigation: [
        { id: "dashboard", label: "Dashboard", icon: "bi-speedometer2", href: "index.html", roles: ["admin", "marketing", "ppic", "production"] },
        { id: "quotations", label: "Quotations", icon: "bi-file-earmark-text", href: "pages/quotations/index.html", roles: ["admin", "marketing"] },
        { id: "sales-orders", label: "Sales Orders", icon: "bi-cart-check", href: "pages/sales-orders/index.html", roles: ["admin"] },
        { id: "ppic", label: "PPIC", icon: "bi-diagram-3", href: "pages/ppic/index.html", roles: ["admin", "ppic"] },
        { id: "production", label: "Production", icon: "bi-gear-wide-connected", href: "pages/production/index.html", roles: ["admin", "production"] },
        { id: "delivery", label: "Delivery", icon: "bi-truck", href: "pages/production/delivery.html", roles: ["admin", "production"] },
        { id: "reports", label: "Reports", icon: "bi-bar-chart-line", href: "pages/reports/index.html", roles: ["admin"] },
        { id: "notifications", label: "Notifications", icon: "bi-bell", href: "pages/notifications/index.html", roles: ["admin", "marketing", "ppic", "production"] }
    ],

    rolePages: {
        admin: ["dashboard", "quotations", "sales-orders", "ppic", "production", "delivery", "reports", "notifications"],
        marketing: ["dashboard", "quotations", "notifications"],
        ppic: ["dashboard", "ppic", "notifications"],
        production: ["dashboard", "production", "delivery", "notifications"]
    },

    qcReturnStages: [
        { key: "fabrication", label: "Fabrication" },
        { key: "machining", label: "Machining" },
        { key: "assembly", label: "Assembly" }
    ],

    productionStages: [
        { key: "fabrication", label: "Fabrication", button: "Complete Fabrication", progress: 25 },
        { key: "machining", label: "Machining", button: "Complete Machining", progress: 50 },
        { key: "assembly", label: "Assembly", button: "Complete Assembly", progress: 75 },
        { key: "qc", label: "Quality Control", button: "QC Passed", progress: 100 }
    ],

    quotationStatuses: ["draft", "sent", "approved", "rejected"],
    soStatuses: ["waiting_ppic", "ppic_processing", "released", "in_production", "qc_passed", "ready_for_delivery", "completed"],
    notificationTypes: [
        "quotation_approved",
        "so_created",
        "work_order_released",
        "stage_completed",
        "qc_passed",
        "ready_for_delivery",
        "deadline_reminder",
        "project_completed"
    ]
};
