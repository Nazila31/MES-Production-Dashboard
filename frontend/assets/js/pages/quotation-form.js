/* ==========================================================
    QUOTATION FORM (Add / Edit)
========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const form = document.getElementById("quotationForm");

    if (id) await loadQuotationForEdit(id);
    if (form) form.addEventListener("submit", (event) => handleSubmit(event, id));
});

async function loadQuotationForEdit(id) {
    try {
        const response = await fetchQuotation(id);
        const data = response.data;
        setValue("quotation_number", data.quotation_number);
        setValue("client", data.client);
        setValue("pic", data.pic);
        setValue("machine", data.machine);
        setValue("amount", data.amount);
        setValue("description", data.description);

        const numberField = document.querySelector('[name="quotation_number"]');
        if (numberField && ["approved", "rejected"].includes(data.status)) {
            numberField.readOnly = true;
        }
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
    const formData = new FormData(form);
    const fileInput = form.querySelector('input[type="file"]');

    if (fileInput?.files?.[0]) {
        formData.set("file", fileInput.files[0]);
    }

    try {
        if (id) {
            await updateQuotation(id, formData);
        } else {
            await createQuotation(formData);
        }
        showSuccessModal();
    } catch (error) {
        alert(error.message);
    }
}

function showSuccessModal() {
    document.getElementById("successModal")?.classList.add("show");
}

function finishSave() {
    window.location.href = `${getBasePath()}pages/quotations/index.html`;
}
