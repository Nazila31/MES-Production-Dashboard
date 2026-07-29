/* ==========================================================
    WORKFLOW CONSTANTS
========================================================== */

const STATUS_STYLES = {
    draft: { progress: "progress-waiting", badge: "status-waiting", label: "Draft" },
    sent: { progress: "progress-waiting", badge: "status-ppic", label: "Sent" },
    approved: { progress: "progress-completed", badge: "status-completed", label: "Approved" },
    rejected: { progress: "progress-delayed", badge: "status-delayed", label: "Rejected" },
    waiting_ppic: { progress: "progress-waiting", badge: "status-waiting", label: "Waiting PPIC" },
    ppic_processing: { progress: "progress-ppic", badge: "status-ppic", label: "PPIC Processing" },
    released: { progress: "progress-ppic", badge: "status-ppic", label: "Released" },
    in_production: { progress: "progress-production", badge: "status-production", label: "In Production" },
    fabrication: { progress: "progress-machining", badge: "status-machining", label: "Fabrication" },
    machining: { progress: "progress-machining", badge: "status-machining", label: "Machining" },
    assembly: { progress: "progress-assembly", badge: "status-assembly", label: "Assembly" },
    qc: { progress: "progress-qc", badge: "status-qc", label: "QC" },
    qc_passed: { progress: "progress-qc", badge: "status-qc", label: "QC Passed" },
    ready_for_delivery: { progress: "progress-ppic", badge: "status-ppic", label: "Ready for Delivery" },
    completed: { progress: "progress-completed", badge: "status-completed", label: "Completed" },
    delayed: { progress: "progress-delayed", badge: "status-delayed", label: "Delayed" }
};

const DEFAULT_STATUS_STYLE = {
    progress: "progress-production",
    badge: "status-production",
    label: "Unknown"
};

function getStatusStyles(status) {
    return STATUS_STYLES[status] || DEFAULT_STATUS_STYLE;
}

function getStageAction(stage) {
    const actions = {
        fabrication: "completeFabrication",
        machining: "completeMachining",
        assembly: "completeAssembly",
        qc: "passQC"
    };

    return actions[stage] || null;
}

function getNextStage(currentStage) {
    const stages = MESConfig.productionStages.map((item) => item.key);
    const index = stages.indexOf(currentStage);

    if (index === -1 || index >= stages.length - 1) {
        return null;
    }

    return stages[index + 1];
}
