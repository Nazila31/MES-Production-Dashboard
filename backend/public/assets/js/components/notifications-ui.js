const NOTIFICATION_ICONS = {
    quotation_approved: "bi-file-earmark-check",
    so_created: "bi-cart-check",
    work_order_released: "bi-diagram-3",
    stage_completed: "bi-gear-wide-connected",
    qc_passed: "bi-shield-check",
    deadline_reminder: "bi-calendar-event",
    project_completed: "bi-check-circle",
};

async function fetchNotificationsList() {
    return apiRequest("/notifications");
}

async function markNotificationReadById(id) {
    return apiRequest(`/notifications/${id}/read`, { method: "POST" });
}

async function loadNotificationsDropdown() {
    const listEl = document.getElementById("notificationList");
    if (!listEl || typeof apiRequest !== "function") {
        return;
    }

    try {
        const response = await fetchNotificationsList();
        const notifications = response.data || [];

        await refreshNotificationBadge();

        if (!notifications.length) {
            listEl.className = "notification-empty";
            listEl.innerHTML = `
                <i class="bi bi-bell-slash fs-2 text-secondary"></i>
                <p class="mt-3 mb-1">No Notifications</p>
                <small class="text-muted">You have no notifications yet.</small>
            `;
            return;
        }

        listEl.className = "";
        listEl.innerHTML = notifications.slice(0, 5).map((item) => {
            const icon = NOTIFICATION_ICONS[item.type] || "bi-bell";
            const unreadClass = item.read ? "" : "unread";

            return `
                <div class="notification-item ${unreadClass}" data-notification-id="${item.id}" data-read="${item.read ? "1" : "0"}">
                    <i class="bi ${icon}"></i>
                    <div>
                        <strong>${item.title}</strong>
                        <p class="mb-0">${item.message}</p>
                        <small class="text-muted">${formatDate(item.created_at)}</small>
                    </div>
                </div>
            `;
        }).join("");

        listEl.querySelectorAll(".notification-item[data-read='0']").forEach((item) => {
            item.addEventListener("click", async () => {
                const id = item.dataset.notificationId;
                if (!id) return;

                try {
                    await markNotificationReadById(id);
                    item.dataset.read = "1";
                    item.classList.remove("unread");
                    await refreshNotificationBadge();
                } catch (error) {
                    console.error(error);
                }
            });
        });
    } catch (error) {
        console.error("Failed to load notifications:", error);
    }
}
