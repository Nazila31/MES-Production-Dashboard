/* ==========================================================
    QUOTATION FORM (Add / Edit)
========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const form = document.getElementById("quotationForm");

    if (id) {
        await loadQuotationForEdit(id);
    }

    if (form) {
        form.addEventListener("submit", (event) => handleSubmit(event, id));
    }
});

async function loadQuotationForEdit(id) {
    try {
        const response = await fetchQuotation(id);
        const data = response.data;
        setValue("client", data.client);
        setValue("pic", data.pic);
        setValue("machine", data.machine);
        setValue("amount", data.amount);
        setValue("deadline", data.deadline);
        setValue("description", data.description);
    } catch (error) {
        alert(error.message);
    }
}

function setValue(name, value) {
    const field = document.querySelector(`[name="${name}"]`);
    if (field) field.value = value || "";
}

async function handleSubmit(event, id) {
    event.preventDefault();
    const form = event.target;
    const payload = {
        client: form.client.value,
        pic: form.pic.value,
        machine: form.machine.value,
        amount: Number(form.amount.value),
        deadline: form.deadline.value,
        description: form.description.value
    };

    try {
        if (id) {
            await updateQuotation(id, payload);
        } else {
            await createQuotation(payload);
        }

        showSuccessModal();
    } catch (error) {
        alert(error.message);
    }
}

function showSuccessModal() {
    const modal = document.getElementById("successModal");
    if (modal) modal.classList.add("show");
}

function finishSave() {
    window.location.href = `${getBasePath()}pages/quotations/index.html`;
}
