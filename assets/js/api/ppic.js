/* ==========================================================
    PPIC API
========================================================== */

async function fetchReleasedSO() {
    return apiOrMock("/ppic/released-so", async () => {
        const data = MockData.salesOrders.filter((so) => {
            return ["waiting_ppic", "ppic_processing", "released"].includes(so.status);
        });

        return { data: cloneMock(data) };
    });
}

async function fetchBOM(soId) {
    return apiOrMock(`/ppic/bom/${soId}`, async () => {
        const data = MockData.bomItems.filter((item) => item.so_id === Number(soId));
        return { data: cloneMock(data) };
    });
}

async function saveBOM(soId, items) {
    return apiOrMock(`/ppic/bom/${soId}`, async () => {
        MockData.bomItems = MockData.bomItems.filter((item) => item.so_id !== Number(soId));
        items.forEach((item, index) => {
            MockData.bomItems.push({ id: Date.now() + index, so_id: Number(soId), ...item });
        });

        const soIndex = MockData.salesOrders.findIndex((so) => so.id === Number(soId));
        if (soIndex !== -1) {
            MockData.salesOrders[soIndex].status = "ppic_processing";
        }

        return { data: cloneMock(items), message: "BOM saved successfully" };
    }, { method: "POST", body: { items } });
}

async function checkWarehouseStock(soId) {
    return apiOrMock(`/ppic/warehouse/${soId}`, async () => {
        const bom = MockData.bomItems.filter((item) => item.so_id === Number(soId));
        const data = bom.map((item) => ({
            ...item,
            sufficient: item.stock_available >= item.qty
        }));

        return { data: cloneMock(data) };
    });
}

async function createWorkOrder(soId) {
    return apiOrMock(`/ppic/work-orders`, async () => {
        const so = MockData.salesOrders.find((item) => item.id === Number(soId));

        if (!so) {
            throw new Error("Sales Order not found");
        }

        const woNumber = `WO${so.so_number.slice(2)}`;
        const workOrder = {
            id: MockData.workOrders.length + 1,
            so_id: Number(soId),
            wo_number: woNumber,
            status: "draft",
            schedule_date: null,
            released_at: null
        };

        MockData.workOrders.push(workOrder);
        return { data: cloneMock(workOrder), message: "Work Order created" };
    }, { method: "POST", body: { so_id: soId } });
}

async function releaseWorkOrder(soId, scheduleDate) {
    return apiOrMock(`/ppic/work-orders/${soId}/release`, async () => {
        const soIndex = MockData.salesOrders.findIndex((so) => so.id === Number(soId));
        const woIndex = MockData.workOrders.findIndex((wo) => wo.so_id === Number(soId));

        if (soIndex === -1) {
            throw new Error("Sales Order not found");
        }

        if (woIndex === -1) {
            throw new Error("Work Order not found");
        }

        MockData.workOrders[woIndex].status = "released";
        MockData.workOrders[woIndex].schedule_date = scheduleDate;
        MockData.workOrders[woIndex].released_at = new Date().toISOString();

        MockData.salesOrders[soIndex].status = "in_production";
        MockData.salesOrders[soIndex].production_stage = "fabrication";
        MockData.salesOrders[soIndex].progress = 0;

        MockData.notifications.unshift({
            id: MockData.notifications.length + 1,
            type: "work_order_released",
            title: "Work Order Released",
            message: `Work Order ${MockData.workOrders[woIndex].wo_number} released to production.`,
            read: false,
            created_at: new Date().toISOString()
        });

        return {
            data: cloneMock(MockData.workOrders[woIndex]),
            message: "Work Order released to production"
        };
    }, { method: "POST", body: { schedule_date: scheduleDate } });
}

async function fetchWorkOrder(soId) {
    return apiOrMock(`/ppic/work-orders/${soId}`, async () => {
        const item = MockData.workOrders.find((wo) => wo.so_id === Number(soId));
        return { data: item ? cloneMock(item) : null };
    });
}

async function fetchProductionSchedule() {
    return apiOrMock("/ppic/schedule", async () => {
        const data = MockData.workOrders.filter((wo) => wo.status === "released");
        return { data: cloneMock(data) };
    });
}
