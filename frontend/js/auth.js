/* ==========================================================================
   AUTHENTICATION & GLOBAL ROUTING
   ========================================================================== */

let isLoggedIn = false;

/* --- DATA LOADER --- */
// Loads real courses from DB into dataStore before any page renders
async function loadDataStore() {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    // Clear mock data first
    dataStore.courses = [];
    dataStore.assessments = {};

    try {
        const res = await fetch('/api/courses', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) return;
        const dbCourses = await res.json();
        if (!dbCourses || dbCourses.length === 0) return;

        for (const c of dbCourses) {
            const dbId = String(c.id);
            dataStore.courses.push({
                id: dbId, code: c.code, name: c.name,
                instructor: c.instructor, term: c.term,
                credits: c.credits || 3, description: c.description || '',
                createdAt: new Date(c.createdAt || Date.now()),
            });
            try {
                const aRes = await fetch(`/api/courses/${c.id}/assessments`, {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                if (!aRes.ok) continue;
                const assessments = await aRes.json();
                dataStore.assessments[dbId] = (assessments || []).map(a => ({
                    id: String(a.id), courseId: dbId, type: a.type,
                    title: a.title, description: a.description || '',
                    dueDate: new Date(a.dueDate), weight: a.weight,
                    totalMarks: a.totalMarks, earnedMarks: a.earnedMarks,
                    status: a.status, createdAt: new Date(a.createdAt || Date.now()),
                }));
            } catch(e) {}
        }
    } catch(e) {
        console.warn('Could not load dataStore from API:', e);
    }
}

/* --- ROUTING CORE --- */

function hideAllPages() {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
}

function switchAuthView(viewId) {
    hideAllPages();
    document.getElementById(viewId).classList.add('active');
}

function routeToDashboard() {
    hideAllPages();
    document.getElementById('dashboardPage').classList.add('active');
    if (typeof renderDashboard === 'function') renderDashboard();
}

function routeToCourses(event) {
    if (event) event.preventDefault();
    hideAllPages();
    document.getElementById('coursesPage').classList.add('active');
    if (typeof renderCourses === 'function') renderCourses();
}

/* --- FETCH HELPER --- */

window.fetchWithAuth = function(url, options = {}) {
    const token = localStorage.getItem('jwt_token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
        ...(options.headers || {}),
    };
    return fetch(url, { ...options, headers });
};

/* --- HELPERS --- */

function showNav(loggedIn) {
    const navAuth = document.getElementById('navAuthLinks');
    const navApp  = document.getElementById('navAppLinks');
    if (!navAuth || !navApp) return;
    if (loggedIn) {
        navAuth.classList.add('hidden');
        navApp.classList.remove('hidden');
        navApp.style.display = 'flex';
    } else {
        navApp.classList.add('hidden');
        navApp.style.display = 'none';
        navAuth.classList.remove('hidden');
    }
}

/* --- LOGIN --- */

async function handleAuthSubmit(event) {
    event.preventDefault();

    const form     = event.target;
    const email    = (form.querySelector('input[type="email"]')?.value    || '').trim();
    const password = (form.querySelector('input[type="password"]')?.value || '').trim();

    if (!email || !password) {
        showNotification('Please enter your email and password.', 'error');
        return;
    }

    const isAdmin  = email.includes('@admin');
    const endpoint = isAdmin ? '/api/adminauth/login' : '/api/auth/login';

    try {
        const res  = await fetch(endpoint, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email, password }),
        });
        const data = await res.json();

        if (!res.ok) {
            showNotification(data.error || 'Invalid email or password.', 'error');
            return;
        }

        localStorage.setItem('jwt_token',  data.token);
        localStorage.setItem('user_role',  data.user.role);
        localStorage.setItem('isLoggedIn', 'true');
        isLoggedIn = true;

        if (data.user.role === 'admin') {
            window.location.href = 'adminpage.html';
            return;
        }

        showNav(true);
        await loadDataStore();
        routeToDashboard();
        showNotification('Successfully logged in!', 'success');

    } catch (err) {
        console.error('Login error:', err);
        showNotification('Could not reach the server. Is the backend running?', 'error');
    }
}

/* --- REGISTER --- */

async function handleRegisterSubmit(event) {
    event.preventDefault();

    const name     = (document.getElementById('registerName')?.value     || '').trim();
    const email    = (document.getElementById('registerEmail')?.value    || '').trim();
    const password = (document.getElementById('registerPassword')?.value || '').trim();

    if (!name || !email || !password) {
        showNotification('All fields are required.', 'error');
        return;
    }
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters.', 'error');
        return;
    }

    const isAdmin  = email.includes('@admin');
    const endpoint = isAdmin ? '/api/adminauth/register' : '/api/auth/register';

    try {
        const res  = await fetch(endpoint, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ name, email, password }),
        });
        const data = await res.json();

        if (!res.ok) {
            showNotification(data.error || 'Registration failed.', 'error');
            return;
        }

        showNotification('Account created! Please log in.', 'success');
        switchAuthView('loginView');

    } catch (err) {
        console.error('Register error:', err);
        showNotification('Could not reach the server. Is the backend running?', 'error');
    }
}

/* --- LOGOUT --- */

function handleLogout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_role');
    window.location.replace('index.html');
}

function handleLogoClick() {
    if (isLoggedIn) routeToDashboard();
    else switchAuthView('loginView');
}

/* --- SESSION PERSISTENCE --- */
// Verifies the stored JWT is still valid with the server before restoring the session.
// This prevents stale or fake tokens from bypassing login.

async function checkPersistence() {
    const token = localStorage.getItem('jwt_token');
    const role  = localStorage.getItem('user_role');

    if (!token) {
        console.log('Persistence: No token, staying on login.');
        return;
    }

    try {
        // Verify token is still valid by hitting a protected endpoint
        const res = await fetch('/api/dashboard', {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (!res.ok) {
            // Token is expired or invalid — clear everything and stay on login
            console.log('Persistence: Token invalid, clearing session.');
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('user_role');
            return;
        }

        // Token is valid — restore session
        if (role === 'admin') {
            if (!window.location.pathname.endsWith('adminpage.html')) {
                window.location.href = 'adminpage.html';
            }
            return;
        }

        isLoggedIn = true;
        showNav(true);
        // Load real data before rendering
        await loadDataStore();
        routeToDashboard();
        console.log('Persistence: Session restored.');

    } catch (err) {
        // Server unreachable — don't restore session, force re-login
        console.warn('Persistence: Server unreachable, clearing session.', err);
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_role');
    }
}

window.addEventListener('load', () => {
    setTimeout(checkPersistence, 100);
});
