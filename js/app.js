// Main App Initialization and Global Functions

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  initTheme();
  initEventListeners();
  showCoursesPage();
});

// Initialize event listeners
function initEventListeners() {
  // Theme toggle
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', function(event) {
    // Escape key to close forms
    if (event.key === 'Escape') {
      closeAllForms();
    }
  });
}

// Close all open forms
function closeAllForms() {
  if (!document.getElementById('createCourseFormContainer').classList.contains('hidden')) {
    toggleCreateCourseForm();
  }
  if (!document.getElementById('editCourseFormContainer').classList.contains('hidden')) {
    toggleEditCourseForm();
  }
  if (!document.getElementById('createAssessmentFormContainer').classList.contains('hidden')) {
    toggleCreateAssessmentForm();
  }
}

// Notification System
function showNotification(message, type = 'info', duration = 3000) {
  // Remove existing notification
  const existing = document.querySelector('.notification');
  if (existing) {
    existing.remove();
  }

  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Trigger animation
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  // Remove after duration
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, duration);
}

// Export Functions (for future backend integration)
function exportCoursesToJSON() {
  const data = {
    courses: dataStore.courses,
    assessments: dataStore.assessments,
    exportedAt: new Date().toISOString(),
  };
  
  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `courses-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Debug Functions (for development)
function debugGetAllData() {
  return {
    courses: dataStore.courses,
    assessments: dataStore.assessments,
  };
}

function debugResetData() {
  dataStore.courses = [];
  dataStore.assessments = {};
  dataStore.initializeData();
  showCoursesPage();
  showNotification('Data reset to initial state', 'info');
}

// Page Rendering Functions
function renderFullCourseDetails(courseId) {
  const course = dataStore.getCourseById(courseId);
  if (!course) {
    showCoursesPage();
    return;
  }

  renderCourseDetails(courseId);
  renderAssessments(courseId);
}

// Filter and Search Functions
function searchCourses(query) {
  const courses = dataStore.getCourses();
  if (!query.trim()) {
    renderCourses();
    return;
  }

  const filtered = courses.filter(course =>
    course.code.toLowerCase().includes(query.toLowerCase()) ||
    course.name.toLowerCase().includes(query.toLowerCase()) ||
    course.instructor.toLowerCase().includes(query.toLowerCase())
  );

  const coursesGrid = document.getElementById('coursesGrid');
  const emptyState = document.getElementById('emptyState');

  if (filtered.length === 0) {
    coursesGrid.innerHTML = '';
    show('emptyState');
    document.querySelector('.empty-state p').textContent = 'No courses found matching your search.';
    return;
  }

  hide('emptyState');
  coursesGrid.innerHTML = filtered.map(course => createCourseCard(course)).join('');
}

function searchAssessments(courseId, query) {
  const assessments = dataStore.getAssessmentsByCourse(courseId);
  if (!query.trim()) {
    renderAssessments(courseId);
    return;
  }

  const filtered = assessments.filter(assessment =>
    assessment.title.toLowerCase().includes(query.toLowerCase()) ||
    assessment.type.toLowerCase().includes(query.toLowerCase()) ||
    (assessment.description && assessment.description.toLowerCase().includes(query.toLowerCase()))
  );

  const assessmentsList = document.getElementById('assessmentsList');
  const emptyAssessments = document.getElementById('emptyAssessments');

  if (filtered.length === 0) {
    assessmentsList.innerHTML = '';
    show('emptyAssessments');
    document.querySelector('.empty-state p').textContent = 'No assessments found matching your search.';
    return;
  }

  hide('emptyAssessments');
  assessmentsList.innerHTML = filtered.map(assessment => 
    createAssessmentItem(courseId, assessment)
  ).join('');
}

function filterAssessmentsByType(courseId, type) {
  const assessments = dataStore.getAssessmentsByCourse(courseId);
  if (!type) {
    renderAssessments(courseId);
    return;
  }

  const filtered = assessments.filter(assessment => assessment.type === type);

  const assessmentsList = document.getElementById('assessmentsList');
  const emptyAssessments = document.getElementById('emptyAssessments');

  if (filtered.length === 0) {
    assessmentsList.innerHTML = '';
    show('emptyAssessments');
    return;
  }

  hide('emptyAssessments');
  const sorted = [...filtered].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  assessmentsList.innerHTML = sorted.map(assessment => 
    createAssessmentItem(courseId, assessment)
  ).join('');
}

function filterAssessmentsByStatus(courseId, status) {
  const assessments = dataStore.getAssessmentsByCourse(courseId);
  if (!status) {
    renderAssessments(courseId);
    return;
  }

  const filtered = assessments.filter(assessment => assessment.status === status);

  const assessmentsList = document.getElementById('assessmentsList');
  const emptyAssessments = document.getElementById('emptyAssessments');

  if (filtered.length === 0) {
    assessmentsList.innerHTML = '';
    show('emptyAssessments');
    return;
  }

  hide('emptyAssessments');
  const sorted = [...filtered].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  assessmentsList.innerHTML = sorted.map(assessment => 
    createAssessmentItem(courseId, assessment)
  ).join('');
}

// Statistics Functions
function getCourseStatistics(courseId) {
  const course = dataStore.getCourseById(courseId);
  const assessments = dataStore.getAssessmentsByCourse(courseId);

  const stats = {
    courseCode: course.code,
    courseName: course.name,
    totalAssessments: assessments.length,
    completedAssessments: assessments.filter(a => a.status === 'completed').length,
    currentAverage: dataStore.calculateCourseAverage(courseId),
    assessmentsByType: {},
    assessmentsByStatus: {},
    upcomingCount: 0,
  };

  // Count by type
  assessments.forEach(assessment => {
    stats.assessmentsByType[assessment.type] = (stats.assessmentsByType[assessment.type] || 0) + 1;
  });

  // Count by status
  assessments.forEach(assessment => {
    stats.assessmentsByStatus[assessment.status] = (stats.assessmentsByStatus[assessment.status] || 0) + 1;
  });

  // Count upcoming
  const now = new Date();
  stats.upcomingCount = assessments.filter(a => {
    return new Date(a.dueDate) > now && a.status === 'pending';
  }).length;

  return stats;
}

function getAllStatistics() {
  const courses = dataStore.getCourses();
  const stats = {
    totalCourses: courses.length,
    totalAssessments: 0,
    overallAverage: 0,
    upcomingAssessments: dataStore.getUpcomingAssessments(30).length,
    courseStats: [],
  };

  let totalWeightedScore = 0;
  let totalWeight = 0;

  courses.forEach(course => {
    const courseStats = getCourseStatistics(course.id);
    stats.courseStats.push(courseStats);
    stats.totalAssessments += courseStats.totalAssessments;

    // Calculate overall average
    const assessments = dataStore.getAssessmentsByCourse(course.id);
    assessments.forEach(assessment => {
      if (assessment.earnedMarks !== null) {
        const percentage = (assessment.earnedMarks / assessment.totalMarks) * 100;
        totalWeightedScore += percentage * assessment.weight;
        totalWeight += assessment.weight;
      }
    });
  });

  stats.overallAverage = totalWeight > 0 ? Math.round((totalWeightedScore / totalWeight) * 100) / 100 : 0;

  return stats;
}

// Responsive Utilities
function handleResponsive() {
  const width = window.innerWidth;
  if (width < 768) {
    document.body.classList.add('mobile');
  } else {
    document.body.classList.remove('mobile');
  }
}

window.addEventListener('resize', handleResponsive);
handleResponsive();

// Global error handler
window.addEventListener('error', function(e) {
  console.error('Global error:', e);
  showNotification('An unexpected error occurred. Please try again.', 'error');
});