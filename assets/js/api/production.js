/* ==========================================================
    PRODUCTION API
    Operator stage completion actions
========================================================== */

async function fetchCurrentProduction() {
    return apiOrMock("/production/current", async () => {
        const data = MockData.salesOrders.filter((so) => {
            return so.status === "in_production" && so.production_stage;
        });

        return { data: cloneMock(data) };
    });
}

async function fetchOperatorDashboard() {
    return apiOrMock("/production/dashboard", async () => {
        const active = MockData.salesOrders.find((so) => so.status === "in_production" && so.production_stage);

        return {
            data: {
                current_project: active ? cloneMock(active) : null,
                queue: MockData.salesOrders.filter((so) => so.status === "in_production")
            }
        };
    });
}

function completeStage(soId, stage, nextStage, progress) {
    const soIndex = MockData.salesOrders.findIndex((so) => so.id === Number(soId));

    if (soIndex === -1) {
        throw new Error("Sales Order not found");
    }

    const so = MockData.salesOrders[soIndex];

    if (so.production_stage !== stage) {
        throw new Error(`Cannot complete ${stage}. Current stage is ${so.production_stage}`);
    }

    MockData.notifications.unshift({
        id: MockData.notifications.length + 1,
        type: stage === "qc" ? "qc_passed" : "stage_completed",
        title: stage === "qc" ? "QC Passed" : `${capitalize(stage)} Completed`,
        message: `${capitalize(stage)} stage completed for ${so.so_number}.`,
        read: false,
        created_at: new Date().toISOString()
    });

    if (nextStage) {
        MockData.salesOrders[soIndex].production_stage = nextStage;
        MockData.salesOrders[soIndex].progress = progress;
    } else {
        MockData.salesOrders[soIndex].status = "qc_passed";
        MockData.salesOrders[soIndex].production_stage = null;
        MockData.salesOrders[soIndex].progress = 100;
    }

    return cloneMock(MockData.salesOrders[soIndex]);
}

async function completeFabrication(soId) {
    return apiOrMock(`/production/${soId}/fabrication`, async () => {
        const data = completeStage(soId, "fabrication", "machining", 25);
        return { data, message: "Fabrication completed" };
    }, { method: "POST" });
}

async function completeMachining(soId) {
    return apiOrMock(`/production/${soId}/machining`, async () => {
        const data = completeStage(soId, "machining", "assembly", 50);
        return { data, message: "Machining completed" };
    }, { method: "POST" });
}

async function completeAssembly(soId) {
    return apiOrMock(`/production/${soId}/assembly`, async () => {
        const data = completeStage(soId, "assembly", "qc", 75);
        return { data, message: "Assembly completed" };
    }, { method: "POST" });
}

async function passQC(soId) {
    return apiOrMock(`/production/${soId}/qc`, async () => {
        const data = completeStage(soId, "qc", null, 100);
        return { data, message: "QC passed. Admin notified for finalization." };
    }, { method: "POST" });
}
