// Courses Page Management

function showCoursesPage(event = null) {
  if (event) event.preventDefault();
  //INTEGRATION: Hide other views before showing courses to prevent overlap
  if (typeof hideAllPages === 'function') hideAllPages();
  showPage('coursesPage');
  renderCourses();
}

function toggleCreateCourseForm() {
  toggleElement('createCourseFormContainer');
  if (!document.getElementById('createCourseFormContainer').classList.contains('hidden')) {
    document.getElementById('courseCode').focus();
  } else {
    document.getElementById('createCourseForm').reset();
    clearFormErrors('createCourseForm');
  }
}

function toggleEditCourseForm() {
  toggleElement('editCourseFormContainer');
  if (!document.getElementById('editCourseFormContainer').classList.contains('hidden')) {
    document.getElementById('editCourseCode').focus();
  }
}

function handleCreateCourse(event) {
  event.preventDefault();

  const formData = {
    code: document.getElementById('courseCode').value.trim(),
    name: document.getElementById('courseName').value.trim(),
    instructor: document.getElementById('instructor').value.trim(),
    term: document.getElementById('term').value,
    credits: parseInt(document.getElementById('credits').value),
    description: document.getElementById('description').value.trim(),
  };

  const errors = validateCourseForm(formData);

  if (Object.keys(errors).length > 0) {
    displayFormErrors('createCourseForm', errors);
    return;
  }

  // Check if course code already exists
  if (dataStore.courses.some(c => c.code === formData.code)) {
    displayFormErrors('createCourseForm', { courseCode: 'This course code already exists' });
    return;
  }

  const newCourse = dataStore.addCourse(formData);

  // Reset form
  document.getElementById('createCourseForm').reset();
  clearFormErrors('createCourseForm');
  toggleCreateCourseForm();

  // Re-render courses
  renderCourses();

  // Show success message
  showNotification('Course added successfully!', 'success');
}

function handleEditCourse(event) {
  event.preventDefault();

  const courseId = dataStore.currentCourseId;
  const formData = {
    code: document.getElementById('editCourseCode').value.trim(),
    name: document.getElementById('editCourseName').value.trim(),
    instructor: document.getElementById('editInstructor').value.trim(),
    description: document.getElementById('editDescription').value.trim(),
  };

  const errors = validateCourseForm(formData);

  if (Object.keys(errors).length > 0) {
    displayFormErrors('editCourseForm', errors);
    return;
  }

  dataStore.updateCourse(courseId, formData);

  clearFormErrors('editCourseForm');
  toggleEditCourseForm();

  // Re-render course details
  renderCourseDetails(courseId);

  showNotification('Course updated successfully!', 'success');
}

function handleDeleteCourse() {
  if (!confirm('Are you sure you want to delete this course? All assessments will also be deleted.')) {
    return;
  }

  const courseId = dataStore.currentCourseId;
  dataStore.deleteCourse(courseId);

  showNotification('Course deleted successfully!', 'success');
  setTimeout(() => {
    showCoursesPage();
  }, 500);
}

function renderCourses() {
  const courses = dataStore.getCourses();
  const coursesGrid = document.getElementById('coursesGrid');
  const emptyState = document.getElementById('emptyState');

  if (courses.length === 0) {
    coursesGrid.innerHTML = '';
    show('emptyState');
    return;
  }

  hide('emptyState');
  coursesGrid.innerHTML = courses.map(course => createCourseCard(course)).join('');
}

function createCourseCard(course) {
  const average = dataStore.calculateCourseAverage(course.id);
  const completed = dataStore.getCompletedAssessments(course.id);
  const total = dataStore.getTotalAssessments(course.id);
  const averageColor = getGradeColor(average);
  const progressWidth = getProgressBarWidth(average);

  return `
    <div class="course-card">
      <div class="course-card-header">
        <h2>${course.code}</h2>
        <div class="course-actions">
          <button class="btn-icon" onclick="editCourse('${course.id}')" title="Edit course">✏️</button>
          <button class="btn-icon btn-danger" onclick="deleteCourseFromCard('${course.id}')" title="Delete course">🗑️</button>
        </div>
      </div>

      <h3>${course.name}</h3>
      <p class="course-instructor">👨‍🏫 ${course.instructor}</p>
      <p class="course-term">📅 ${course.term}</p>

      <div class="course-stats">
        <div class="stat">
          <span class="stat-label">Assignments</span>
          <span class="stat-value">${completed}/${total}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Current Average</span>
          <span class="stat-value average" style="color: ${averageColor}">
            ${average.toFixed(1)}%
          </span>
        </div>
      </div>

      <div class="progress-bar">
        <div class="progress-fill" style="width: ${progressWidth}%; background-color: ${averageColor}"></div>
      </div>

      <button class="btn btn-secondary w-full" onclick="viewCourseDetails('${course.id}')">
        View Course Details →
      </button>
    </div>
  `;
}

function viewCourseDetails(courseId) {
  dataStore.currentCourseId = courseId;
  // PERSON 1 INTEGRATION: Hide other views before showing course details to prevent overlap
  if (typeof hideAllPages === 'function') hideAllPages();
  showPage('courseDetailsPage');
  renderCourseDetails(courseId);
}

function editCourse(courseId) {
  const course = dataStore.getCourseById(courseId);
  if (!course) return;

  dataStore.currentCourseId = courseId;
  document.getElementById('editCourseCode').value = course.code;
  document.getElementById('editCourseName').value = course.name;
  document.getElementById('editInstructor').value = course.instructor;
  document.getElementById('editDescription').value = course.description || '';

  toggleEditCourseForm();
}

function deleteCourseFromCard(courseId) {
  if (!confirm('Are you sure you want to delete this course? All assessments will also be deleted.')) {
    return;
  }

  dataStore.deleteCourse(courseId);
  showNotification('Course deleted successfully!', 'success');
  renderCourses();
}

function renderCourseDetails(courseId) {
  const course = dataStore.getCourseById(courseId);
  if (!course) return;

  const average = dataStore.calculateCourseAverage(courseId);
  const completed = dataStore.getCompletedAssessments(courseId);
  const total = dataStore.getTotalAssessments(courseId);
  const averageColor = getGradeColor(average);
  const progressWidth = getProgressBarWidth(average);

  const courseDetailsContainer = document.getElementById('courseDetailsContainer');
  courseDetailsContainer.innerHTML = `
    <div class="course-details">
      <div class="course-info">
        <div>
          <h2>${course.code}</h2>
          <h3>${course.name}</h3>
          <p class="course-full-info">
            <span>👨‍🏫 ${course.instructor}</span>
            <span>📅 ${course.term}</span>
            <span>⭐ ${course.credits} Credits</span>
          </p>
          ${course.description ? `<p class="course-description">${course.description}</p>` : ''}
        </div>
        
        <div class="course-summary">
          <div class="summary-item">
            <span class="summary-label">Completion</span>
            <span class="summary-value">${completed}/${total}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Course Average</span>
            <span class="summary-value" style="color: ${averageColor}; font-size: 1.5em; font-weight: bold;">
              ${average.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      <div class="course-progress">
        <h4>Progress</h4>
        <div class="progress-bar large">
          <div class="progress-fill" style="width: ${progressWidth}%; background-color: ${averageColor}"></div>
        </div>
        <p class="progress-text">${completed} of ${total} assessments completed</p>
      </div>
    </div>
  `;
}