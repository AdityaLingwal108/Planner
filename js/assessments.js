// Assessments Page Management

function toggleCreateAssessmentForm() {
  toggleElement('createAssessmentFormContainer');
  if (!document.getElementById('createAssessmentFormContainer').classList.contains('hidden')) {
    document.getElementById('assessmentTitle').focus();
  } else {
    document.getElementById('createAssessmentForm').reset();
    clearFormErrors('createAssessmentForm');
  }
}

function handleCreateAssessment(event) {
  event.preventDefault();

  const courseId = dataStore.currentCourseId;
  if (!courseId) {
    showNotification('Error: No course selected', 'error');
    return;
  }

  const formData = {
    type: document.getElementById('assessmentType').value,
    title: document.getElementById('assessmentTitle').value.trim(),
    description: document.getElementById('assessmentDescription').value.trim(),
    dueDate: new Date(document.getElementById('dueDate').value),
    weight: parseFloat(document.getElementById('weight').value),
    totalMarks: parseFloat(document.getElementById('totalMarks').value),
    status: document.getElementById('status').value,
  };

  const errors = validateAssessmentForm(formData);

  if (Object.keys(errors).length > 0) {
    displayFormErrors('createAssessmentForm', errors);
    return;
  }

  const newAssessment = dataStore.addAssessment(courseId, formData);

  // Reset form
  document.getElementById('createAssessmentForm').reset();
  clearFormErrors('createAssessmentForm');
  toggleCreateAssessmentForm();

  // Re-render assessments
  renderAssessments(courseId);

  showNotification('Assessment added successfully!', 'success');
}

function handleEditAssessment(event, courseId, assessmentId) {
  event.preventDefault();

  const earnedMarksInput = document.getElementById(`earnedMarks-${assessmentId}`);
  const statusInput = document.getElementById(`status-${assessmentId}`);

  if (!earnedMarksInput || !statusInput) return;

  const earnedMarks = earnedMarksInput.value === '' ? null : parseFloat(earnedMarksInput.value);
  const status = statusInput.value;

  const assessment = dataStore.getAssessmentById(courseId, assessmentId);
  if (!assessment) return;

  // Validate
  if (earnedMarks !== null && (earnedMarks < 0 || earnedMarks > assessment.totalMarks)) {
    showNotification('Earned marks must be between 0 and total marks', 'error');
    return;
  }

  dataStore.updateAssessment(courseId, assessmentId, {
    earnedMarks: earnedMarks,
    status: status,
  });

  renderAssessments(courseId);
  showNotification('Assessment updated successfully!', 'success');
}

function handleDeleteAssessment(courseId, assessmentId) {
  if (!confirm('Are you sure you want to delete this assessment?')) {
    return;
  }

  dataStore.deleteAssessment(courseId, assessmentId);
  renderAssessments(courseId);
  showNotification('Assessment deleted successfully!', 'success');
}

function renderAssessments(courseId) {
  const assessments = dataStore.getAssessmentsByCourse(courseId);
  const assessmentsList = document.getElementById('assessmentsList');
  const emptyAssessments = document.getElementById('emptyAssessments');

  if (assessments.length === 0) {
    assessmentsList.innerHTML = '';
    show('emptyAssessments');
    return;
  }

  hide('emptyAssessments');

  // Sort assessments by due date
  const sorted = [...assessments].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  assessmentsList.innerHTML = sorted.map(assessment => 
    createAssessmentItem(courseId, assessment)
  ).join('');
}

function createAssessmentItem(courseId, assessment) {
  const daysUntilDue = getDaysUntilDue(assessment.dueDate);
  const daysText = daysUntilDue < 0 ? 'Overdue' : daysUntilDue === 0 ? 'Due today' : `${daysUntilDue} days left`;
  const daysClass = daysUntilDue < 0 ? 'overdue' : daysUntilDue <= 3 ? 'urgent' : '';
  
  const hasMarks = assessment.earnedMarks !== null;
  const percentage = hasMarks ? calculatePercentage(assessment.earnedMarks, assessment.totalMarks) : 0;
  const percentColor = hasMarks ? getGradeColor(percentage) : '#95a5a6';

  return `
    <div class="assessment-item">
      <div class="assessment-header">
        <div class="assessment-title">
          <span class="assessment-icon">${getAssessmentIcon(assessment.type)}</span>
          <div>
            <h4>${assessment.title}</h4>
            <p class="assessment-type">${assessment.type} • Weight: ${assessment.weight}%</p>
          </div>
        </div>
        <div class="assessment-actions">
          <button class="btn-icon" onclick="deleteAssessmentFromList('${courseId}', '${assessment.id}')" title="Delete assessment">🗑️</button>
        </div>
      </div>

      ${assessment.description ? `<p class="assessment-description">${assessment.description}</p>` : ''}

      <div class="assessment-details">
        <div class="detail-item">
          <span class="detail-label">Due Date</span>
          <span class="detail-value ${daysClass}">${formatDate(assessment.dueDate)}</span>
          <span class="days-left ${daysClass}">${daysText}</span>
        </div>

        <div class="detail-item">
          <span class="detail-label">Total Marks</span>
          <span class="detail-value">${assessment.totalMarks}</span>
        </div>

        <div class="detail-item">
          <span class="detail-label">Status</span>
          <select id="status-${assessment.id}" class="status-select" onchange="handleEditAssessment(event, '${courseId}', '${assessment.id}')">
            <option value="pending" ${assessment.status === 'pending' ? 'selected' : ''}>⏳ Pending</option>
            <option value="completed" ${assessment.status === 'completed' ? 'selected' : ''}>✓ Completed</option>
          </select>
        </div>
      </div>

      <div class="marks-section">
        <div class="marks-input">
          <label for="earnedMarks-${assessment.id}">Earned Marks</label>
          <div class="marks-input-group">
            <input 
              type="number" 
              id="earnedMarks-${assessment.id}"
              class="marks-input-field"
              min="0" 
              max="${assessment.totalMarks}"
              value="${assessment.earnedMarks !== null ? assessment.earnedMarks : ''}"
              placeholder="Enter marks"
              onchange="handleEditAssessment(event, '${courseId}', '${assessment.id}')"
            >
            <span class="marks-total">/ ${assessment.totalMarks}</span>
          </div>
        </div>

        ${hasMarks ? `
          <div class="marks-display">
            <div class="percentage-circle" style="color: ${percentColor}">
              <span>${percentage}%</span>
            </div>
            <div class="grade-info">
              <p class="grade-value" style="color: ${percentColor}">${percentage}%</p>
              <p class="grade-scale">${getGradeLabel(percentage)}</p>
            </div>
          </div>
        ` : `
          <div class="marks-display">
            <p class="no-marks">No marks entered yet</p>
          </div>
        `}
      </div>

      ${hasMarks ? `
        <div class="progress-bar assessment-progress">
          <div class="progress-fill" style="width: ${percentage}%; background-color: ${percentColor}"></div>
        </div>
      ` : ''}
    </div>
  `;
}

function deleteAssessmentFromList(courseId, assessmentId) {
  handleDeleteAssessment(courseId, assessmentId);
}

function getGradeLabel(percentage) {
  if (percentage >= 90) return 'A+';
  if (percentage >= 85) return 'A';
  if (percentage >= 80) return 'A-';
  if (percentage >= 77) return 'B+';
  if (percentage >= 73) return 'B';
  if (percentage >= 70) return 'B-';
  if (percentage >= 67) return 'C+';
  if (percentage >= 63) return 'C';
  if (percentage >= 60) return 'C-';
  if (percentage >= 50) return 'D';
  return 'F';
}

function toggleEditMarksForm(assessmentId) {
  const form = document.getElementById(`editMarksForm-${assessmentId}`);
  if (form) {
    form.classList.toggle('hidden');
  }
}