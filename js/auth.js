/* ==========================================================================
   AUTHENTICATION & GLOBAL ROUTING
   Handles login state and prevents pages from overlapping.
   ========================================================================== */

let isLoggedIn = false;

/* --- ROUTING CORE --- */

function hideAllPages() {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
}

function switchAuthView(viewId) {
    hideAllPages();
    document.getElementById(viewId).classList.add('active');
}

function routeToDashboard() {
    hideAllPages();
    document.getElementById('dashboardPage').classList.add('active');
    
    // Execute the dashboard logic to populate real data
    if (typeof renderDashboard === 'function') {
        renderDashboard();
    }
}

function routeToCourses(event) {
    if (event) event.preventDefault();
    hideAllPages();

    if (typeof renderCourses === 'function') {
        document.getElementById('coursesPage').classList.add('active');
        renderCourses();
    } else {
        document.getElementById('coursesPage').classList.add('active');
    }
}

/* --- AUTHENTICATION HANDLERS --- */

function handleAuthSubmit(event) {
    event.preventDefault();
    isLoggedIn = true;

    // INTEGRATION: Save login state to browser storage
    localStorage.setItem('isLoggedIn', 'true');

    document.getElementById('navAuthLinks').classList.add('hidden');
    document.getElementById('navAppLinks').classList.remove('hidden');

    routeToDashboard();

    if (typeof showNotification === 'function') {
        showNotification('Successfully logged in!', 'success');
    }
}

function handleLogout() {
    isLoggedIn = false;

    // INTEGRATION: Remove login state from browser storage
    localStorage.removeItem('isLoggedIn');

    document.getElementById('navAppLinks').classList.add('hidden');
    document.getElementById('navAuthLinks').classList.remove('hidden');

    switchAuthView('loginView');
}

function handleLogoClick() {
    if (isLoggedIn) {
        routeToDashboard();
    } else {
        switchAuthView('loginView');
    }
}

/* --- INTEGRATION: PERSISTENCE CHECK (GLOBAL) --- */
function checkPersistence() {
    const savedSession = localStorage.getItem('isLoggedIn');
    const navAuth = document.getElementById('navAuthLinks');
    const navApp = document.getElementById('navAppLinks');

    if (savedSession === 'true' && navAuth && navApp) {
        isLoggedIn = true;

        navAuth.classList.add('hidden');
        navApp.classList.remove('hidden');

        routeToDashboard();
        console.log("Persistence: Session restored successfully.");
    } else {
        console.log("Persistence: No session found, staying on login.");
    }
}

// Run check after a 100ms delay to ensure all scripts are initialized
window.addEventListener('load', () => {
    setTimeout(checkPersistence, 100);
});