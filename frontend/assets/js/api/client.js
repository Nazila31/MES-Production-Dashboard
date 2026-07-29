/* ==========================================================
    API CLIENT
========================================================== */

function getAuthToken() {
    return sessionStorage.getItem("mes_token");
}

function setAuthToken(token) {
    if (token) {
        sessionStorage.setItem("mes_token", token);
    } else {
        sessionStorage.removeItem("mes_token");
    }
}

function getAuthUser() {
    const raw = sessionStorage.getItem("mes_user");
    return raw ? JSON.parse(raw) : null;
}

function setAuthUser(user) {
    if (user) {
        sessionStorage.setItem("mes_user", JSON.stringify(user));
    } else {
        sessionStorage.removeItem("mes_user");
    }
}

function clearAuth() {
    setAuthToken(null);
    setAuthUser(null);
}

async function apiRequest(endpoint, options = {}) {
    const url = `${MESConfig.apiBaseUrl}${endpoint}`;
    const headers = { Accept: "application/json", ...options.headers };

    const token = getAuthToken();
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    const config = {
        method: options.method || "GET",
        headers
    };

    if (options.body) {
        config.body = options.body instanceof FormData ? options.body : JSON.stringify(options.body);
    }

    const response = await fetch(url, config);

    if (response.status === 401) {
        clearAuth();
        const loginPath = `${getBasePath()}login.html`;
        if (!window.location.pathname.endsWith("login.html")) {
            window.location.href = loginPath;
        }
        throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `API Error: ${response.status}`);
    }

    if (response.status === 204) {
        return {};
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
        return response.json();
    }

    return response;
}

async function apiOrMock(endpoint, mockFn, options = {}) {
    return apiRequest(endpoint, options);
}

function buildQuery(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            query.set(key, value);
        }
    });
    const qs = query.toString();
    return qs ? `?${qs}` : "";
}
