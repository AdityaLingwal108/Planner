/* ==========================================================================
   AUTHENTICATION & GLOBAL ROUTING (BACKEND CONNECTED)
   ========================================================================== */

const API_BASE_URL = '/api/auth';
let isLoggedIn = false;

/* --- ROUTING CORE (UNCHANGED FROM YOUR TEAM) --- */

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
    
    if (typeof renderDashboard === 'function') {
        renderDashboard();
    }
}

function routeToCourses(event) {
    if (event) event.preventDefault();
    hideAllPages();

    document.getElementById('coursesPage').classList.add('active');
    if (typeof renderCourses === 'function') {
        renderCourses();
    }
}

function handleLogoClick() {
    if (isLoggedIn) {
        routeToDashboard();
    } else {
        switchAuthView('loginView');
    }
}

/* --- REAL AUTHENTICATION API LOGIC --- */

// NEW: Call this from your Registration form
async function handleRegisterSubmit(event) {
    event.preventDefault();
    
    // NOTE: You must verify these IDs match your HTML register form!
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        
        if (typeof showNotification === 'function') {
            showNotification('Registration successful! Please log in.', 'success');
        } else {
            alert('Registration successful! Please log in.');
        }
        
        switchAuthView('loginView'); // Send them back to login screen
    } catch (error) {
        alert(error.message);
    }
}

// UPDATED: Replaces your old handleAuthSubmit
async function handleAuthSubmit(event) {
    event.preventDefault();

    // NOTE: You must verify these IDs match your HTML login form!
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        // REAL INTEGRATION: Save JWT Token
        localStorage.setItem('jwt_token', data.token);
        localStorage.setItem('user_role', data.user.role);
        isLoggedIn = true;

        document.getElementById('navAuthLinks').classList.add('hidden');
        document.getElementById('navAppLinks').classList.remove('hidden');

        // Route based on role
        if (data.user.role === 'admin') {
             window.location.href = 'adminpage.html'; // Assuming admin is a separate file
        } else {
             routeToDashboard();
        }

        if (typeof showNotification === 'function') {
            showNotification('Successfully logged in!', 'success');
        }
    } catch (error) {
        alert(error.message); // Will alert "Invalid credentials"
    }
}

// UPDATED: Logout API Call
async function handleLogout() {
    try {
        await fetch(`${API_BASE_URL}/logout`, { method: 'POST' });
    } catch (error) {
        console.error("Logout API failed", error);
    }

    isLoggedIn = false;
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_role');

    document.getElementById('navAppLinks').classList.add('hidden');
    document.getElementById('navAuthLinks').classList.remove('hidden');

    switchAuthView('loginView');
}

/* --- UPDATED: JWT PERSISTENCE CHECK --- */
function checkPersistence() {
    const token = localStorage.getItem('jwt_token'); // Check for real token, not 'true'
    const role = localStorage.getItem('user_role');
    const navAuth = document.getElementById('navAuthLinks');
    const navApp = document.getElementById('navAppLinks');

    if (token && navAuth && navApp) {
        isLoggedIn = true;
        navAuth.classList.add('hidden');
        navApp.classList.remove('hidden');

        if (role === 'admin') {
            if (!window.location.pathname.includes('adminpage.html')) {
                window.location.href = 'adminpage.html';
            }
        } else {
            routeToDashboard();
        }
        console.log("Persistence: Session restored via JWT.");
    } else {
        console.log("Persistence: No token found, staying on login.");
    }
}

/* --- CRITICAL UTILITY FOR TEAMMATES --- */
// Persons 2, 3, and 4 MUST use this function instead of fetch() to talk to the backend.
window.fetchWithAuth = async function(url, options = {}) {
    const token = localStorage.getItem('jwt_token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };
    return fetch(url, { ...options, headers });
};

// Run check after a 100ms delay to ensure all scripts are initialized
window.addEventListener('load', () => {
    setTimeout(checkPersistence, 100);
});