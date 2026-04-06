/* ==========================================================================
   MANAGE ACCOUNT PAGE LOGIC
   Uses window.fetchWithAuth from auth.js for authenticated API calls
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // Load current user data into form
    loadUserData();

    // Handle form submission
    const accountForm = document.getElementById('accountForm');
    if (accountForm) {
        accountForm.addEventListener('submit', handleAccountUpdate);
    }
});

/**
 * Load current user data from localStorage and populate the form
 */
function loadUserData() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            document.getElementById('accountName').value = user.name || '';
            document.getElementById('accountEmail').value = user.email || '';
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
}

/**
 * Handle account update form submission
 */
async function handleAccountUpdate(event) {
    event.preventDefault();

    const messageEl = document.getElementById('accountMessage');
    const name = document.getElementById('accountName').value.trim();
    const email = document.getElementById('accountEmail').value.trim();
    const password = document.getElementById('accountPassword').value;
    const confirmPassword = document.getElementById('accountConfirmPassword').value;

    // Validation
    if (!name || !email) {
        showMessage('Name and email are required.', 'error');
        return;
    }

    if (password && password !== confirmPassword) {
        showMessage('Passwords do not match.', 'error');
        return;
    }

    if (password && password.length < 6) {
        showMessage('Password must be at least 6 characters.', 'error');
        return;
    }

    // Build request body
    const body = { name, email };
    if (password) {
        body.password = password;
    }

    try {
        const response = await window.fetchWithAuth('/api/auth/user', {
            method: 'PUT',
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.error || 'Failed to update profile.', 'error');
            return;
        }

        // Update localStorage with new user data
        if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
        }

        // Clear password fields
        document.getElementById('accountPassword').value = '';
        document.getElementById('accountConfirmPassword').value = '';

        showMessage('Profile updated successfully!', 'success');

    } catch (error) {
        console.error('Account update error:', error);
        showMessage('Network error. Please try again.', 'error');
    }
}

/**
 * Display a message to the user
 */
function showMessage(text, type) {
    const messageEl = document.getElementById('accountMessage');
    if (messageEl) {
        messageEl.textContent = text;
        messageEl.className = `message ${type}`;
        messageEl.classList.remove('hidden');

        // Auto-hide success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                messageEl.classList.add('hidden');
            }, 3000);
        }
    }
}
