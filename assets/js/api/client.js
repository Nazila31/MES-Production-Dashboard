/* ==========================================================
    API CLIENT
    Base HTTP client for Laravel REST API
========================================================== */

async function apiRequest(endpoint, options = {}) {
    const url = `${MESConfig.apiBaseUrl}${endpoint}`;
    const defaultHeaders = {
        Accept: "application/json",
        "Content-Type": "application/json"
    };

    const config = {
        method: options.method || "GET",
        headers: { ...defaultHeaders, ...options.headers }
    };

    if (options.body) {
        config.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, config);

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `API Error: ${response.status}`);
    }

    return response.json();
}

async function mockRequest(data, ms = 300) {
    await delay(ms);
    return cloneMock(data);
}

async function apiOrMock(endpoint, mockFn, options = {}) {
    if (MESConfig.useMockData) {
        return mockFn();
    }

    return apiRequest(endpoint, options);
}
