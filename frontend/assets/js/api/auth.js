/* ==========================================================
    AUTH API
========================================================== */

async function loginUser(email, password) {
    const response = await apiRequest("/auth/login", {
        method: "POST",
        body: { email, password }
    });

    setAuthToken(response.data.token);
    setAuthUser(response.data.user);

    return response.data;
}

async function logoutUser() {
    try {
        await apiRequest("/auth/logout", { method: "POST" });
    } finally {
        clearAuth();
    }
}

async function fetchCurrentUser() {
    const response = await apiRequest("/auth/me");
    setAuthUser(response.data);
    return response.data;
}

function requireAuth(allowedRoles = []) {
    const user = getAuthUser();
    const base = getBasePath();

    if (!user) {
        window.location.href = `${base}login.html`;
        return false;
    }

    if (allowedRoles.length && !allowedRoles.includes(user.role) && user.role !== "admin") {
        const home = getRoleHomePage(user.role);
        window.location.href = `${base}${home}`;
        return false;
    }

    return true;
}

function getRoleHomePage(role) {
    const map = {
        admin: "index.html",
        marketing: "pages/dashboard/marketing.html",
        ppic: "pages/dashboard/ppic.html",
        production: "pages/dashboard/production.html"
    };
    return map[role] || "login.html";
}

function getDashboardHref(role) {
    return getRoleHomePage(role);
}
