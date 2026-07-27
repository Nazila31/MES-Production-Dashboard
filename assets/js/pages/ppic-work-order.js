/* ==========================================================
    PPIC - WORK ORDER & PRODUCTION SCHEDULE
========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
    const soId = new URLSearchParams(window.location.search).get("so_id");
    const isSchedulePage = document.body.dataset.subpage === "schedule";

    if (isSchedulePage) {
        await loadSchedule();
    } else if (soId) {
        await loadWorkOrderPage(soId);
    }
});

async function loadWorkOrderPage(soId) {
    const soResponse = await fetchSalesOrder(soId);
    setText("soNumber", soResponse.data.so_number);
    setText("client", soResponse.data.client);
    setText("spkGlobal", soResponse.data.spk_global);

    const woResponse = await fetchWorkOrder(soId);
    if (woResponse.data) {
        setText("woNumber", woResponse.data.wo_number);
        setValue("scheduleDate", woResponse.data.schedule_date);

        if (woResponse.data.status === "released") {
            document.getElementById("releaseBtn")?.setAttribute("disabled", "true");
        }
    } else {
        document.getElementById("createWOBtn")?.addEventListener("click", async () => {
            const result = await createWorkOrder(soId);
            setText("woNumber", result.data.wo_number);
        });
    }

    document.getElementById("releaseBtn")?.addEventListener("click", async () => {
        const scheduleDate = document.getElementById("scheduleDate")?.value;
        if (!scheduleDate) {
            alert("Please set production schedule date");
            return;
        }

        try {
            await releaseWorkOrder(soId, scheduleDate);
            document.getElementById("successModal")?.classList.add("show");
        } catch (error) {
            alert(error.message);
        }
    });
}

async function loadSchedule() {
    const response = await fetchProductionSchedule();
    const tbody = document.getElementById("scheduleTableBody");
    if (!tbody) return;

    const items = response.data || [];
    tbody.innerHTML = items.length ? items.map((item) => `
        <tr>
            <td>${item.wo_number}</td>
            <td>SO #${item.so_id}</td>
            <td>${formatDate(item.schedule_date)}</td>
            <td><span class="badge-kustom status-completed">Released</span></td>
        </tr>`).join("") : `<tr><td colspan="4" class="text-center py-4 text-muted">No scheduled work orders.</td></tr>`;
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value || "-";
}

function setValue(id, value) {
    const el = document.getElementById(id);
    if (el && value) el.value = value;
}

function finishRelease() {
    window.location.href = `${getBasePath()}pages/ppic/schedule.html`;
}
