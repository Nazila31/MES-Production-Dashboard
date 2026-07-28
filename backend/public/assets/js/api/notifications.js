/* ==========================================================
    NOTIFICATIONS API
========================================================== */

async function fetchNotifications() {
    return apiRequest("/notifications");
}

async function markNotificationRead(id) {
    return apiRequest(`/notifications/${id}/read`, { method: "POST" });
}

async function markAllNotificationsRead() {
    return apiRequest("/notifications/read-all", { method: "POST" });
}

function getUnreadCount(notifications) {
    return notifications.filter((n) => !n.read).length;
}

async function fetchUnreadCount() {
    const response = await apiRequest("/notifications/unread-count");
    return response.data.count;
}
