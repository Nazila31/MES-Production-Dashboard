/* ==========================================================
    LAYOUT COMPONENT
    Renders sidebar navigation from shared config
========================================================== */

function renderSidebar(activePage) {
    const sidebar = document.querySelector(".sidebar-menu");

    if (!sidebar) {
        return;
    }

    const base = getBasePath();
    sidebar.innerHTML = MESConfig.navigation.map((item) => {
        const href = item.href.startsWith("pages/") ? `${base}${item.href}` : `${base}${item.href}`;
        const isActive = item.id === activePage ? "active" : "";

        return `
            <li>
                <a href="${href}" class="${isActive}">
                    <i class="bi ${item.icon}"></i>
                    <span>${item.label}</span>
                </a>
            </li>
        `;
    }).join("");

    const logoLink = document.querySelector(".company-logo");
    if (logoLink) {
        logoLink.href = `${base}index.html`;
    }

    fixAssetPaths(base);
}

function fixAssetPaths(base) {
    document.querySelectorAll("[data-asset]").forEach((el) => {
        el.setAttribute("src", `${base}${el.dataset.asset}`);
    });

    document.querySelectorAll("link[data-stylesheet]").forEach((el) => {
        el.href = `${base}${el.dataset.stylesheet}`;
    });
}

function initLayout() {
    const activePage = document.body.dataset.page || "";
    const pageTitle = document.body.dataset.title || "";
    const breadcrumb = document.body.dataset.breadcrumb || "";

    renderSidebar(activePage);

    const navbarTitle = document.querySelector(".navbar-left h5");
    const navbarBreadcrumb = document.querySelector(".navbar-left small");

    if (navbarTitle && pageTitle) {
        navbarTitle.textContent = pageTitle;
    }

    if (navbarBreadcrumb && breadcrumb) {
        navbarBreadcrumb.textContent = breadcrumb;
    }

    document.title = `${pageTitle} | ${MESConfig.companyName}`;
}

document.addEventListener("DOMContentLoaded", initLayout);
