/* ==========================================================
    LAYOUT COMPONENT
========================================================== */

const PAGE_ROLE_DEFAULTS = {
    dashboard: ["admin", "marketing", "ppic", "production"],
    quotations: ["admin", "marketing"],
    "sales-orders": ["admin"],
    ppic: ["admin", "ppic"],
    production: ["admin", "production"],
    delivery: ["admin", "production"],
    reports: ["admin"],
    notifications: ["admin", "marketing", "ppic", "production"],
};

function getPageRoles() {
    if (document.body.dataset.roles) {
        return document.body.dataset.roles.split(",").map((role) => role.trim()).filter(Boolean);
    }

    const page = document.body.dataset.page || "";
    return PAGE_ROLE_DEFAULTS[page] || ["admin"];
}

function renderSidebar(activePage) {
    const sidebar = document.querySelector(".sidebar-menu");
    if (!sidebar) return;

    const user = getAuthUser();
    const base = getBasePath();
    const allowed = user ? (MESConfig.rolePages[user.role] || []) : [];

    sidebar.innerHTML = MESConfig.navigation
        .filter((item) => !user || user.role === "admin" || allowed.includes(item.id))
        .map((item) => {
            let href = item.href.startsWith("pages/") ? `${base}${item.href}` : `${base}${item.href}`;
            if (item.id === "dashboard" && user) {
                href = `${base}${getDashboardHref(user.role)}`;
            }
            const isActive = item.id === activePage ? "active" : "";
            return `<li><a href="${href}" class="${isActive}"><i class="bi ${item.icon}"></i><span>${item.label}</span></a></li>`;
        }).join("");

    const logoLink = document.querySelector(".company-logo");
    if (logoLink) {
        logoLink.href = `${base}${getRoleHomePage(user?.role || "admin")}`;
    }

    updateProfileInfo(user);
    fixAssetPaths(base);
}

function updateProfileInfo(user) {
    if (!user) return;

    document.querySelectorAll(".profile-info strong").forEach((el) => {
        el.textContent = user.name;
    });

    document.querySelectorAll(".profile-info small, .profile-header small").forEach((el) => {
        el.textContent = user.role_label || capitalize(user.role);
    });
}

function fixAssetPaths(base) {
    document.querySelectorAll("[data-asset]").forEach((el) => {
        el.setAttribute("src", `${base}${el.dataset.asset}`);
    });

    document.querySelectorAll("link[data-stylesheet]").forEach((el) => {
        el.href = `${base}${el.dataset.stylesheet}`;
    });
}

function ensureNavbarControls() {
    const navbar = document.querySelector(".top-navbar");
    if (!navbar) return;

    let navbarRight = navbar.querySelector(".navbar-right");
    if (!navbarRight) {
        navbarRight = document.createElement("div");
        navbarRight.className = "navbar-right";
        navbar.appendChild(navbarRight);
    }

    if (!document.getElementById("notificationToggle")) {
        const base = getBasePath();
        navbarRight.insertAdjacentHTML("afterbegin", `
            <div class="notification-wrapper">
                <button class="notification-btn" id="notificationToggle" type="button">
                    <i class="bi bi-bell"></i>
                    <span class="notification-badge" id="notificationBadge" style="display:none;">0</span>
                </button>
                <div class="notification-dropdown" id="notificationDropdown">
                    <div class="notification-header">Notifications</div>
                    <div id="notificationList"></div>
                    <div class="notification-footer">
                        <a href="${base}pages/notifications/index.html">View all notifications</a>
                    </div>
                </div>
            </div>
        `);
    }

    bindNotificationDropdown();
}

function bindNotificationDropdown() {
    const notificationToggle = document.getElementById("notificationToggle");
    const notificationDropdown = document.getElementById("notificationDropdown");
    const profileDropdown = document.getElementById("profileDropdown");
    const profileToggle = document.getElementById("profileToggle");

    if (!notificationToggle || notificationToggle.dataset.bound === "true") {
        return;
    }

    notificationToggle.dataset.bound = "true";

    notificationToggle.addEventListener("click", async (event) => {
        event.stopPropagation();
        profileDropdown?.classList.remove("show");
        profileToggle?.classList.remove("active");
        notificationDropdown?.classList.toggle("show");

        if (notificationDropdown?.classList.contains("show")) {
            await loadNotificationsDropdown();
        }
    });

    notificationDropdown?.addEventListener("click", (event) => {
        event.stopPropagation();
    });
}

async function refreshNotificationBadge() {
    const badgeEl = document.getElementById("notificationBadge");
    if (!badgeEl || typeof apiRequest !== "function") {
        return;
    }

    try {
        const response = await apiRequest("/notifications/unread-count");
        const unread = response.data?.count || 0;
        badgeEl.textContent = unread;
        badgeEl.style.display = unread > 0 ? "flex" : "none";
    } catch (error) {
        console.error("Failed to load notification badge:", error);
    }
}

function initLayout() {
    const activePage = document.body.dataset.page || "";
    const pageTitle = document.body.dataset.title || "";
    const breadcrumb = document.body.dataset.breadcrumb || "";
    const allowedRoles = getPageRoles();

    if (!window.location.pathname.endsWith("login.html")) {
        requireAuth(allowedRoles);
    }

    ensureNavbarControls();
    renderSidebar(activePage);
    refreshNotificationBadge();

    const navbarTitle = document.querySelector(".navbar-left h5");
    const navbarBreadcrumb = document.querySelector(".navbar-left small");

    if (navbarTitle && pageTitle) navbarTitle.textContent = pageTitle;
    if (navbarBreadcrumb && breadcrumb) navbarBreadcrumb.textContent = breadcrumb;

    document.title = `${pageTitle} | ${MESConfig.companyName}`;
}

document.addEventListener("DOMContentLoaded", initLayout);

const NOTIFICATION_ICONS = {
    quotation_approved: "bi-file-earmark-check",
    so_created: "bi-cart-check",
    work_order_released: "bi-diagram-3",
    stage_completed: "bi-gear-wide-connected",
    qc_passed: "bi-shield-check",
    deadline_reminder: "bi-calendar-event",
    ready_for_delivery: "bi-truck",
    project_completed: "bi-check-circle",
};

async function loadNotificationsDropdown() {
    const listEl = document.getElementById("notificationList");
    if (!listEl || typeof apiRequest !== "function") {
        return;
    }

    try {
        const response = await apiRequest("/notifications");
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
                    await apiRequest(`/notifications/${id}/read`, { method: "POST" });
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
