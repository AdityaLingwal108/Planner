// Utility Functions

// DOM Helpers
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  document.getElementById(pageId).classList.add('active');
}

function toggleElement(elementId) {
  const element = document.getElementById(elementId);
  element.classList.toggle('hidden');
}

function show(elementId) {
  document.getElementById(elementId).classList.remove('hidden');
}

function hide(elementId) {
  document.getElementById(elementId).classList.add('hidden');
}

function hideElement(element) {
  element.classList.add('hidden');
}

function showElement(element) {
  element.classList.remove('hidden');
}

// Validation
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validateCourseForm(formData) {
  const errors = {};
  
  if (!formData.code.trim()) {
    errors.code = 'Course code is required';
  }
  if (!formData.name.trim()) {
    errors.name = 'Course name is required';
  }
  if (!formData.instructor.trim()) {
    errors.instructor = 'Instructor name is required';
  }
  
  return errors;
}

function validateAssessmentForm(formData) {
  const errors = {};
  
  if (!formData.type) {
    errors.type = 'Assessment type is required';
  }
  if (!formData.title.trim()) {
    errors.title = 'Assessment title is required';
  }
  if (!formData.dueDate) {
    errors.dueDate = 'Due date is required';
  }
  if (!formData.totalMarks || formData.totalMarks <= 0) {
    errors.totalMarks = 'Total marks must be greater than 0';
  }
  if (!formData.weight || formData.weight < 0 || formData.weight > 100) {
    errors.weight = 'Weight must be between 0 and 100';
  }
  
  return errors;
}

// Date Formatting
function formatDate(date) {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

function formatDateInput(date) {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDaysUntilDue(dueDate) {
  if (!(dueDate instanceof Date)) {
    dueDate = new Date(dueDate);
  }
  const now = new Date();
  const diff = dueDate - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days;
}

// Calculations
function calculatePercentage(earned, total) {
  if (total === 0) return 0;
  return Math.round((earned / total) * 100);
}

function getGradeColor(percentage) {
  if (percentage >= 80) return '#27ae60'; // Green
  if (percentage >= 70) return '#f39c12'; // Orange
  if (percentage >= 60) return '#e74c3c'; // Red
  return '#95a5a6'; // Gray
}

function getProgressBarWidth(percentage) {
  return Math.min(percentage, 100);
}

// Type Icons
function getAssessmentIcon(type) {
  const icons = {
    'Assignment': '📝',
    'Quiz': '❓',
    'Exam': '📋',
    'Lab': '🔬',
    'Project': '🚀',
  };
  return icons[type] || '📄';
}

// Status Helpers
function getStatusBadgeClass(status) {
  return status === 'completed' ? 'badge-success' : 'badge-pending';
}

function getStatusBadgeText(status) {
  return status === 'completed' ? '✓ Completed' : '⏳ Pending';
}

// Event Handlers
function clearFormErrors(formId) {
  const form = document.getElementById(formId);
  if (form) {
    form.querySelectorAll('.error-message').forEach(error => {
      error.textContent = '';
    });
    form.querySelectorAll('.form-group input, .form-group select, .form-group textarea').forEach(input => {
      input.classList.remove('error');
    });
  }
}

function displayFormErrors(formId, errors) {
  const form = document.getElementById(formId);
  if (!form) return;

  clearFormErrors(formId);

  Object.keys(errors).forEach(fieldName => {
    const errorElement = document.getElementById(`${fieldName}Error`);
    const inputElement = form.querySelector(`[name="${fieldName}"]`);
    
    if (errorElement) {
      errorElement.textContent = errors[fieldName];
    }
    if (inputElement) {
      inputElement.classList.add('error');
    }
  });
}

// Local Storage (for future backend integration)
function saveToLocalStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function getFromLocalStorage(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

function removeFromLocalStorage(key) {
  localStorage.removeItem(key);
}

// Theme Management
function initTheme() {
  const theme = getFromLocalStorage('theme') || 'light';
  document.body.className = `${theme}-mode`;
  updateThemeButton(theme);
}

function toggleTheme() {
  const currentTheme = document.body.className.includes('dark') ? 'dark' : 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.body.className = `${newTheme}-mode`;
  saveToLocalStorage('theme', newTheme);
  updateThemeButton(newTheme);

  if (typeof renderDashboard === 'function') {
    renderDashboard();
  }
}

function updateThemeButton(theme) {
  const themeButton = document.getElementById('themeToggle');
  if (themeButton) {
    themeButton.textContent = theme === 'dark' ? ' ☀️ ' : ' 🌙 ';
  }
}

// String Utilities
function truncateString(str, maxLength) {
  return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}