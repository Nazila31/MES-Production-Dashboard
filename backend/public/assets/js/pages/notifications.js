/* ==========================================================
    NOTIFICATIONS PAGE
========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
    await loadNotificationsPage();
    document.getElementById("markAllReadBtn")?.addEventListener("click", handleMarkAllRead);
});

async function loadNotificationsPage() {
    try {
        const response = await fetchNotifications();
        renderNotifications(response.data || []);
    } catch (error) {
        console.error(error);
    }
}

function renderNotifications(notifications) {
    const container = document.getElementById("notificationsContainer");
    if (!container) return;

    if (!notifications.length) {
        container.innerHTML = `<div class="text-center py-5">
            <i class="bi bi-bell-slash fs-1 text-secondary"></i>
            <h5 class="mt-3">No Notifications</h5>
        </div>`;
        return;
    }

    container.innerHTML = notifications.map((item) => `
        <div class="notification-page-item ${item.read ? "" : "unread"}" data-id="${item.id}">
            <div class="notification-page-icon"><i class="bi bi-bell"></i></div>
            <div class="flex-grow-1">
                <strong>${item.title}</strong>
                <p class="mb-1">${item.message}</p>
                <small class="text-muted">${formatDate(item.created_at)}</small>
            </div>
            ${item.read ? "" : `<button class="btn btn-sm btn-outline-primary" onclick="markRead(${item.id})">Mark Read</button>`}
        </div>`).join("");
}

async function markRead(id) {
    await markNotificationRead(id);
    await loadNotificationsPage();
    if (typeof refreshNotificationBadge === "function") {
        await refreshNotificationBadge();
    }
}

async function handleMarkAllRead() {
    await markAllNotificationsRead();
    await loadNotificationsPage();
    if (typeof refreshNotificationBadge === "function") {
        await refreshNotificationBadge();
    }
}
