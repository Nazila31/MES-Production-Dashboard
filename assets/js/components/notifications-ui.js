/* ==========================================================
    NOTIFICATIONS UI COMPONENT
    Loads and renders notification dropdown
========================================================== */

const NOTIFICATION_ICONS = {
    quotation_approved: "bi-file-earmark-check",
    so_created: "bi-cart-check",
    work_order_released: "bi-diagram-3",
    stage_completed: "bi-gear-wide-connected",
    qc_passed: "bi-shield-check",
    deadline_reminder: "bi-calendar-event",
    project_completed: "bi-check-circle"
};

async function loadNotificationsDropdown() {
    const listEl = document.getElementById("notificationList");
    const badgeEl = document.getElementById("notificationBadge");

    if (!listEl) {
        return;
    }

    try {
        const response = await fetchNotifications();
        const notifications = response.data || [];
        const unread = getUnreadCount(notifications);

        if (badgeEl) {
            badgeEl.textContent = unread;
            badgeEl.style.display = unread > 0 ? "flex" : "none";
        }

        if (notifications.length === 0) {
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
                <div class="notification-item ${unreadClass}">
                    <i class="bi ${icon}"></i>
                    <div>
                        <strong>${item.title}</strong>
                        <p class="mb-0">${item.message}</p>
                        <small class="text-muted">${formatDate(item.created_at)}</small>
                    </div>
                </div>
            `;
        }).join("");
    } catch (error) {
        console.error("Failed to load notifications:", error);
    }
}

document.addEventListener("DOMContentLoaded", loadNotificationsDropdown);
