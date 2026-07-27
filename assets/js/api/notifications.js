/* ==========================================================
    NOTIFICATIONS API
========================================================== */

async function fetchNotifications() {
    return apiOrMock("/notifications", async () => {
        return { data: cloneMock(MockData.notifications) };
    });
}

async function markNotificationRead(id) {
    return apiOrMock(`/notifications/${id}/read`, async () => {
        const index = MockData.notifications.findIndex((n) => n.id === Number(id));

        if (index !== -1) {
            MockData.notifications[index].read = true;
        }

        return { message: "Notification marked as read" };
    }, { method: "POST" });
}

async function markAllNotificationsRead() {
    return apiOrMock("/notifications/read-all", async () => {
        MockData.notifications.forEach((n) => {
            n.read = true;
        });

        return { message: "All notifications marked as read" };
    }, { method: "POST" });
}

function getUnreadCount(notifications) {
    return notifications.filter((n) => !n.read).length;
}
