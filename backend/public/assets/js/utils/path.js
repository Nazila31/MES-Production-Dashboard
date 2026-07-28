/* ==========================================================
    PATH UTILITIES
    Resolve asset and page paths from any directory depth
========================================================== */

function getBasePath() {
    const path = window.location.pathname.replace(/\\/g, "/");
    const pagesIndex = path.indexOf("/pages/");

    if (pagesIndex === -1) {
        return "./";
    }

    const afterPages = path.substring(pagesIndex + "/pages/".length);
    const depth = afterPages.split("/").filter(Boolean).length;

    return "../".repeat(depth + 1);
}

function assetPath(relativePath) {
    return `${getBasePath()}${relativePath.replace(/^\//, "")}`;
}

function pagePath(relativePath) {
    return `${getBasePath()}${relativePath.replace(/^\//, "")}`;
}
