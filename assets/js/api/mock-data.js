/* ==========================================================
    MOCK DATA
    Temporary data until Laravel REST API is connected
========================================================== */

const MockData = {
    quotations: [
        {
            id: 1,
            quotation_number: "QTN250001",
            client: "PT Astra Honda Motor",
            pic: "Budi Santoso",
            machine: "CNC Jig Engine Mounting",
            amount: 185000000,
            status: "approved",
            description: "Manufacturing CNC Jig Engine Mounting for PT Astra Honda Motor.",
            created_at: "2026-07-15",
            deadline: "2026-08-30"
        },
        {
            id: 2,
            quotation_number: "QTN250002",
            client: "PT Toyota Motor Manufacturing",
            pic: "Siti Rahayu",
            machine: "Fixture Assembly Line",
            amount: 92000000,
            status: "draft",
            description: "Custom fixture assembly line for engine block inspection.",
            created_at: "2026-07-20",
            deadline: "2026-09-15"
        },
        {
            id: 3,
            quotation_number: "QTN250003",
            client: "PT Denso Indonesia",
            pic: "Ahmad Wijaya",
            machine: "Precision Mold Base",
            amount: 65000000,
            status: "rejected",
            description: "Precision mold base for injection molding component.",
            created_at: "2026-07-18",
            deadline: "2026-08-20"
        },
        {
            id: 4,
            quotation_number: "QTN250004",
            client: "PT Mitsubishi Motors",
            pic: "Budi Santoso",
            machine: "Welding Jig Platform",
            amount: 120000000,
            status: "approved",
            description: "Welding jig platform for chassis assembly process.",
            created_at: "2026-07-22",
            deadline: "2026-09-01"
        }
    ],

    salesOrders: [
        {
            id: 1,
            so_number: "SO250721001",
            quotation_id: 1,
            quotation_number: "QTN250001",
            spk_global: "SPK250721001",
            client: "PT Astra Honda Motor",
            machine: "CNC Jig Engine Mounting",
            pic: "Budi Santoso",
            status: "in_production",
            production_stage: "machining",
            progress: 50,
            start_date: "2026-07-21",
            deadline: "2026-08-30",
            description: "Manufacturing CNC Jig Engine Mounting for PT Astra Honda Motor.",
            documents: []
        },
        {
            id: 2,
            so_number: "SO250724002",
            quotation_id: 4,
            quotation_number: "QTN250004",
            spk_global: "SPK250724002",
            client: "PT Mitsubishi Motors",
            machine: "Welding Jig Platform",
            pic: "Budi Santoso",
            status: "waiting_ppic",
            production_stage: null,
            progress: 0,
            start_date: "2026-07-24",
            deadline: "2026-09-01",
            description: "Welding jig platform for chassis assembly process.",
            documents: []
        }
    ],

    bomItems: [
        { id: 1, so_id: 1, material_code: "MAT-001", material_name: "Steel Plate SS400", qty: 4, unit: "pcs", stock_available: 10 },
        { id: 2, so_id: 1, material_code: "MAT-002", material_name: "Aluminum Block 6061", qty: 2, unit: "pcs", stock_available: 5 },
        { id: 3, so_id: 1, material_code: "MAT-003", material_name: "Bearing SKF 6205", qty: 8, unit: "pcs", stock_available: 20 }
    ],

    workOrders: [
        {
            id: 1,
            so_id: 1,
            wo_number: "WO250721001",
            status: "released",
            schedule_date: "2026-07-22",
            released_at: "2026-07-22T08:00:00"
        }
    ],

    notifications: [
        {
            id: 1,
            type: "quotation_approved",
            title: "Quotation Approved",
            message: "Quotation QTN250001 has been approved.",
            read: false,
            created_at: "2026-07-16T10:30:00"
        },
        {
            id: 2,
            type: "so_created",
            title: "Sales Order Created",
            message: "SO SO250721001 created from QTN250001.",
            read: false,
            created_at: "2026-07-21T09:00:00"
        },
        {
            id: 3,
            type: "work_order_released",
            title: "Work Order Released",
            message: "Work Order WO250721001 has been released to production.",
            read: true,
            created_at: "2026-07-22T08:15:00"
        },
        {
            id: 4,
            type: "stage_completed",
            title: "Fabrication Completed",
            message: "Fabrication stage completed for SO250721001.",
            read: true,
            created_at: "2026-07-23T14:00:00"
        },
        {
            id: 5,
            type: "deadline_reminder",
            title: "Deadline Reminder",
            message: "SO SO250721001 deadline is approaching (30 Aug 2026).",
            read: false,
            created_at: "2026-07-25T08:00:00"
        }
    ],

    activities: [
        { id: 1, message: "Fabrication completed for SO250721001", time: "2026-07-23T14:00:00", type: "stage" },
        { id: 2, message: "Work Order WO250721001 released", time: "2026-07-22T08:15:00", type: "ppic" },
        { id: 3, message: "Sales Order SO250721001 created", time: "2026-07-21T09:00:00", type: "admin" },
        { id: 4, message: "Quotation QTN250001 approved", time: "2026-07-16T10:30:00", type: "marketing" }
    ],

    dashboard: {
        total_quotations: 4,
        approved_quotations: 2,
        total_sales_orders: 2,
        waiting_ppic: 1,
        in_production: 1,
        fabrication: 0,
        machining: 1,
        assembly: 0,
        qc: 0,
        completed: 0,
        delayed: 0,
        production_trend: [2, 3, 1, 4, 2, 3, 1],
        department_distribution: [1, 1, 0, 0],
        production_progress: [0, 1, 0, 0, 0]
    },

    reports: {
        total_orders: 2,
        completed: 0,
        delayed: 0,
        efficiency: 0,
        monthly_production: [0, 0, 0, 0, 0, 2],
        department_distribution: [1, 1, 0, 0],
        status_distribution: [0, 1, 1],
        summary: [
            { month: "July 2026", sales_order: 2, completed: 0, delayed: 0, efficiency: "0%" }
        ]
    }
};

function cloneMock(value) {
    return JSON.parse(JSON.stringify(value));
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
