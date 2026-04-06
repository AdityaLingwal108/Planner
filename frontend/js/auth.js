/* ==========================================================================
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
    }
}

function handleLogoClick() {
    if (isLoggedIn) {
        routeToDashboard();
    } else {
        switchAuthView('loginView');
    }
}

/* --- PERSISTENCE CHECK: Validates JWT token exists --- */
function checkPersistence() {
    const token = localStorage.getItem('jwt_token');
    const navAuth = document.getElementById('navAuthLinks');
    const navApp = document.getElementById('navAppLinks');

    if (token && navAuth && navApp) {
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

// Run check after a 100ms delay to ensure all scripts are initialized
window.addEventListener('load', () => {
    setTimeout(checkPersistence, 100);
});