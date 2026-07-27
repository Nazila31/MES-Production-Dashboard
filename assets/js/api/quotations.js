/* ==========================================================
    QUOTATIONS API
========================================================== */

async function fetchQuotations(params = {}) {
    return apiOrMock("/quotations", async () => {
        let data = cloneMock(MockData.quotations);

        if (params.status) {
            data = data.filter((item) => item.status === params.status);
        }

        if (params.search) {
            const keyword = params.search.toLowerCase();
            data = data.filter((item) => {
                return (
                    item.quotation_number.toLowerCase().includes(keyword) ||
                    item.client.toLowerCase().includes(keyword)
                );
            });
        }

        return { data };
    });
}

async function fetchQuotation(id) {
    return apiOrMock(`/quotations/${id}`, async () => {
        const item = MockData.quotations.find((q) => q.id === Number(id));

        if (!item) {
            throw new Error("Quotation not found");
        }

        return { data: cloneMock(item) };
    });
}

async function createQuotation(payload) {
    return apiOrMock("/quotations", async () => {
        const newItem = {
            id: MockData.quotations.length + 1,
            quotation_number: `QTN25${String(MockData.quotations.length + 1).padStart(4, "0")}`,
            status: "draft",
            created_at: new Date().toISOString().split("T")[0],
            ...payload
        };

        MockData.quotations.push(newItem);
        return { data: cloneMock(newItem), message: "Quotation created successfully" };
    }, { method: "POST", body: payload });
}

async function updateQuotation(id, payload) {
    return apiOrMock(`/quotations/${id}`, async () => {
        const index = MockData.quotations.findIndex((q) => q.id === Number(id));

        if (index === -1) {
            throw new Error("Quotation not found");
        }

        MockData.quotations[index] = { ...MockData.quotations[index], ...payload };
        return { data: cloneMock(MockData.quotations[index]), message: "Quotation updated successfully" };
    }, { method: "PUT", body: payload });
}

async function approveQuotation(id) {
    return apiOrMock(`/quotations/${id}/approve`, async () => {
        const index = MockData.quotations.findIndex((q) => q.id === Number(id));

        if (index === -1) {
            throw new Error("Quotation not found");
        }

        MockData.quotations[index].status = "approved";
        MockData.notifications.unshift({
            id: MockData.notifications.length + 1,
            type: "quotation_approved",
            title: "Quotation Approved",
            message: `Quotation ${MockData.quotations[index].quotation_number} has been approved.`,
            read: false,
            created_at: new Date().toISOString()
        });

        return { data: cloneMock(MockData.quotations[index]), message: "Quotation approved" };
    }, { method: "POST" });
}

async function rejectQuotation(id) {
    return apiOrMock(`/quotations/${id}/reject`, async () => {
        const index = MockData.quotations.findIndex((q) => q.id === Number(id));

        if (index === -1) {
            throw new Error("Quotation not found");
        }

        MockData.quotations[index].status = "rejected";
        return { data: cloneMock(MockData.quotations[index]), message: "Quotation rejected" };
    }, { method: "POST" });
}
