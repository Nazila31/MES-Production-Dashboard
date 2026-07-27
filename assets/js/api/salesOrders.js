/* ==========================================================
    SALES ORDERS API
========================================================== */

async function fetchSalesOrders(params = {}) {
    return apiOrMock("/sales-orders", async () => {
        let data = cloneMock(MockData.salesOrders);

        if (params.status) {
            data = data.filter((item) => item.status === params.status);
        }

        if (params.search) {
            const keyword = params.search.toLowerCase();
            data = data.filter((item) => {
                return (
                    item.so_number.toLowerCase().includes(keyword) ||
                    item.client.toLowerCase().includes(keyword)
                );
            });
        }

        return { data };
    });
}

async function fetchApprovedQuotations() {
    return apiOrMock("/quotations?status=approved", async () => {
        const data = MockData.quotations.filter((q) => q.status === "approved" && !MockData.salesOrders.some((so) => so.quotation_id === q.id));
        return { data: cloneMock(data) };
    });
}

async function fetchSalesOrder(id) {
    return apiOrMock(`/sales-orders/${id}`, async () => {
        const item = MockData.salesOrders.find((so) => so.id === Number(id) || so.so_number === id);

        if (!item) {
            throw new Error("Sales Order not found");
        }

        return { data: cloneMock(item) };
    });
}

async function createSO(quotationId, documents = []) {
    return apiOrMock("/sales-orders", async () => {
        const quotation = MockData.quotations.find((q) => q.id === Number(quotationId));

        if (!quotation) {
            throw new Error("Quotation not found");
        }

        if (quotation.status !== "approved") {
            throw new Error("Only approved quotations can be converted to Sales Order");
        }

        const soNumber = `SO${new Date().toISOString().slice(2, 10).replace(/-/g, "")}${String(MockData.salesOrders.length + 1).padStart(3, "0")}`;
        const spkGlobal = `SPK${soNumber.slice(2)}`;

        const newSO = {
            id: MockData.salesOrders.length + 1,
            so_number: soNumber,
            quotation_id: quotation.id,
            quotation_number: quotation.quotation_number,
            spk_global: spkGlobal,
            client: quotation.client,
            machine: quotation.machine,
            pic: quotation.pic,
            status: "waiting_ppic",
            production_stage: null,
            progress: 0,
            start_date: new Date().toISOString().split("T")[0],
            deadline: quotation.deadline,
            description: quotation.description,
            documents
        };

        MockData.salesOrders.push(newSO);
        MockData.notifications.unshift({
            id: MockData.notifications.length + 1,
            type: "so_created",
            title: "Sales Order Created",
            message: `SO ${soNumber} created from ${quotation.quotation_number}.`,
            read: false,
            created_at: new Date().toISOString()
        });

        return { data: cloneMock(newSO), message: "Sales Order created successfully" };
    }, { method: "POST", body: { quotation_id: quotationId, documents } });
}

async function finalizeProject(soId, payload) {
    return apiOrMock(`/sales-orders/${soId}/finalize`, async () => {
        const index = MockData.salesOrders.findIndex((so) => so.id === Number(soId));

        if (index === -1) {
            throw new Error("Sales Order not found");
        }

        MockData.salesOrders[index].status = "completed";
        MockData.salesOrders[index].progress = 100;
        MockData.salesOrders[index].delivery_order = payload.delivery_order;
        MockData.salesOrders[index].packing_list = payload.packing_list;
        MockData.salesOrders[index].invoice = payload.invoice;

        MockData.notifications.unshift({
            id: MockData.notifications.length + 1,
            type: "project_completed",
            title: "Project Completed",
            message: `Project ${MockData.salesOrders[index].so_number} has been completed.`,
            read: false,
            created_at: new Date().toISOString()
        });

        return { data: cloneMock(MockData.salesOrders[index]), message: "Project finalized successfully" };
    }, { method: "POST", body: payload });
}
