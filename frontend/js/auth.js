/* ==========================================================================
<<<<<<< HEAD
   AUTHENTICATION & GLOBAL ROUTING (BACKEND CONNECTED)
   ========================================================================== */

const API_BASE_URL = '/api/auth';
let isLoggedIn = false;

/* --- ROUTING CORE (UNCHANGED FROM YOUR TEAM) --- */
=======
   AUTHENTICATION & GLOBAL ROUTING
   Handles login state, JWT management, and prevents pages from overlapping.
   ========================================================================== */

let isLoggedIn = false;

/* --- fetchWithAuth: Global wrapper for authenticated API calls --- */
window.fetchWithAuth = async function(url, options = {}) {
    const token = localStorage.getItem('jwt_token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };
    
    // Attach JWT token if available
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return fetch(url, {
        ...options,
        headers
    });
};

/* --- ROUTING CORE --- */
>>>>>>> 3b783fc94735420146303896b04e722020dc791c

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
    
<<<<<<< HEAD
=======
    // Execute the dashboard logic to populate real data
>>>>>>> 3b783fc94735420146303896b04e722020dc791c
    if (typeof renderDashboard === 'function') {
        renderDashboard();
    }
}

function routeToCourses(event) {
    if (event) event.preventDefault();
    hideAllPages();

<<<<<<< HEAD
    document.getElementById('coursesPage').classList.add('active');
    if (typeof renderCourses === 'function') {
        renderCourses();
=======
    if (typeof renderCourses === 'function') {
        document.getElementById('coursesPage').classList.add('active');
        renderCourses();
    } else {
        document.getElementById('coursesPage').classList.add('active');
    }
}

/* --- AUTHENTICATION HANDLERS --- */

/**
 * handleLogin: Real login that calls POST /api/auth/login
 * Stores JWT token on success
 */
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        if (typeof showNotification === 'function') {
            showNotification('Please enter email and password.', 'error');
        }
        return;
    }
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            if (typeof showNotification === 'function') {
                showNotification(data.error || 'Login failed.', 'error');
            }
            return;
        }
        
        // Store JWT token and user info
        localStorage.setItem('jwt_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('isLoggedIn', 'true');
        
        isLoggedIn = true;
        
        // Update nav visibility
        document.getElementById('navAuthLinks').classList.add('hidden');
        document.getElementById('navAppLinks').classList.remove('hidden');
        
        // Clear form
        document.getElementById('loginForm').reset();
        
        // Navigate to dashboard
        routeToDashboard();
        
        if (typeof showNotification === 'function') {
            showNotification(`Welcome back, ${data.user.name}!`, 'success');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        if (typeof showNotification === 'function') {
            showNotification('Network error. Please try again.', 'error');
        }
    }
}

/**
 * handleRegister: Real registration that calls POST /api/auth/register
 * Auto-logs in on success by calling handleLogin internally
 */
async function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    
    if (!name || !email || !password) {
        if (typeof showNotification === 'function') {
            showNotification('Please fill in all fields.', 'error');
        }
        return;
    }
    
    if (password.length < 6) {
        if (typeof showNotification === 'function') {
            showNotification('Password must be at least 6 characters.', 'error');
        }
        return;
    }
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            if (typeof showNotification === 'function') {
                showNotification(data.error || 'Registration failed.', 'error');
            }
            return;
        }
        
        if (typeof showNotification === 'function') {
            showNotification('Account created! Logging you in...', 'success');
        }
        
        // Clear register form
        document.getElementById('registerForm').reset();
        
        // Auto-login after successful registration
        // Populate login fields and trigger login
        document.getElementById('loginEmail').value = email;
        document.getElementById('loginPassword').value = password;
        
        // Small delay to show the success message, then login
        setTimeout(() => {
            handleLogin({ preventDefault: () => {} });
        }, 500);
        
    } catch (error) {
        console.error('Registration error:', error);
        if (typeof showNotification === 'function') {
            showNotification('Network error. Please try again.', 'error');
        }
    }
}

/**
 * handleLogout: Clears JWT token and user data
 */
function handleLogout() {
    isLoggedIn = false;

    // Clear all auth data from storage
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');

    document.getElementById('navAppLinks').classList.add('hidden');
    document.getElementById('navAuthLinks').classList.remove('hidden');

    switchAuthView('loginView');
    
    if (typeof showNotification === 'function') {
        showNotification('Logged out successfully.', 'info');
>>>>>>> 3b783fc94735420146303896b04e722020dc791c
    }
}

function handleLogoClick() {
    if (isLoggedIn) {
        routeToDashboard();
    } else {
        switchAuthView('loginView');
    }
}

<<<<<<< HEAD
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
=======
/* --- PERSISTENCE CHECK: Validates JWT token exists --- */
function checkPersistence() {
    const token = localStorage.getItem('jwt_token');
>>>>>>> 3b783fc94735420146303896b04e722020dc791c
    const navAuth = document.getElementById('navAuthLinks');
    const navApp = document.getElementById('navAppLinks');

    if (token && navAuth && navApp) {
<<<<<<< HEAD
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

=======
        // Token exists, consider user logged in
        // Note: For full validation, you could call a /api/auth/verify endpoint
        isLoggedIn = true;

        navAuth.classList.add('hidden');
        navApp.classList.remove('hidden');

        routeToDashboard();
        console.log("Persistence: Session restored from JWT token.");
    } else {
        console.log("Persistence: No valid session found, staying on login.");
    }
}

>>>>>>> 3b783fc94735420146303896b04e722020dc791c
// Run check after a 100ms delay to ensure all scripts are initialized
window.addEventListener('load', () => {
    setTimeout(checkPersistence, 100);
});